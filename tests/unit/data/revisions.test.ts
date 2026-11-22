// P2-E03: revision items from the Minutes (FR-REV-13, INV-21, BR-05, BR-11, AD-A-026).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { transitionMilestone } from "@/server/data/milestones";
import { acceptRevision, addRevisionItems, linkRevisionToCommit, listRevisionItems } from "@/server/data/revisions";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: actorOf(u) });

// A Proposal milestone with a held defense, verdict Approved with Revisions, two members.
async function held(verdict: "approved" | "approved_with_revisions" | "disapproved" = "approved_with_revisions") {
  const t = await makeThesisChain(db);
  const lead = await makeUser(db, "panel_member");
  const chair = await makeUser(db, "panel_member");
  const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
  const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, t.version.id));
  const doc = async (formCode: s.FormCode, subject: string | null) =>
    (await db.insert(s.documentRecord).values({ milestoneInstanceId: t.milestone.id, templateRequiredItemId: item!.id, formCode, subjectUserId: subject, state: "verified" }).returning())[0]!;
  const appointment = await doc("TDW_06", null);
  const ndas = [await doc("TDW_05", lead.id), await doc("TDW_05", chair.id)];
  await db.update(s.committee).set({ appointmentDocumentId: appointment.id }).where(eq(s.committee.id, com!.id));
  await db.insert(s.committeeMember).values([
    { committeeId: com!.id, memberUserId: lead.id, designation: "lead_panel_member", status: "accepted", ndaDocumentId: ndas[0]!.id },
    { committeeId: com!.id, memberUserId: chair.id, designation: "panel_chair", status: "accepted", ndaDocumentId: ndas[1]!.id },
  ]);
  const [attempt] = await db
    .insert(s.defenseAttempt)
    .values({ milestoneInstanceId: t.milestone.id, attemptNo: 1, status: "held", verdict, verdictByUserId: lead.id, verdictAt: new Date() })
    .returning();
  await db.update(s.milestoneInstance).set({ status: "DEFENSE_HELD" }).where(eq(s.milestoneInstance.id, t.milestone.id));
  const verifySheets = () =>
    db.insert(s.evaluationEntry).values(
      [t.adviser, lead, chair].map((u) => ({ defenseAttemptId: attempt!.id, memberUserId: u.id, form: "TDW_08" as const, actionTaken: "approved_with_revisions" as const, sheetMatch: "matched" as const, verifiedAt: new Date() })),
    );
  return { ...t, lead, chair, attempt: attempt!, verifySheets };
}

describe("addRevisionItems (FR-REV-13)", () => {
  it("lets only the Coordinator enter items, after a held defense with Approved with Revisions", async () => {
    const w = await held();
    await expect(addRevisionItems(as(w.adviser), w.attempt.id, ["x"])).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(addRevisionItems(as(w.coordinator), w.attempt.id, ["  ", ""])).rejects.toThrow(/at least one/);
    expect(await addRevisionItems(as(w.coordinator), w.attempt.id, ["Add limits.", " Fix refs. "])).toEqual({ count: 2 });
    expect(await addRevisionItems(as(w.coordinator), w.attempt.id, ["Third."])).toEqual({ count: 1 });
    const rows = await db.select().from(s.revisionItem).where(eq(s.revisionItem.defenseAttemptId, w.attempt.id));
    expect(rows.map((r) => r.ordinal).sort()).toEqual([1, 2, 3]);
    expect(rows.find((r) => r.ordinal === 2)!.body).toBe("Fix refs.");
    const approved = await held("approved");
    await expect(addRevisionItems(as(approved.coordinator), approved.attempt.id, ["x"])).rejects.toThrow(/Approved with Revisions/);
    await db.update(s.defenseAttempt).set({ status: "scheduled" }).where(eq(s.defenseAttempt.id, approved.attempt.id));
    await expect(addRevisionItems(as(approved.coordinator), approved.attempt.id, ["x"])).rejects.toThrow(/held defense/);
  });

  it("refuses the Final milestone, which uses threads (FR-REV-12)", async () => {
    const w = await held();
    const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "final"));
    const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, tpl!.id));
    const [m3] = await db.insert(s.milestoneInstance).values({ thesisInstanceId: w.thesis.id, templateVersionId: v!.id, milestoneCode: "final" }).returning();
    const [a3] = await db.insert(s.defenseAttempt).values({ milestoneInstanceId: m3!.id, attemptNo: 1, status: "held", verdict: "approved_with_revisions", verdictByUserId: w.lead.id, verdictAt: new Date() }).returning();
    await expect(addRevisionItems(as(w.coordinator), a3!.id, ["x"])).rejects.toThrow(/Final Defense uses no revision items/);
  });
});

describe("link, accept and the Certification (FR-REV-13, FR-WFL-06, INV-21)", () => {
  it("runs link, accept by each member, and then CERTIFIED can pass the revisions guard", async () => {
    const w = await held();
    await addRevisionItems(as(w.coordinator), w.attempt.id, ["Add limits."]);
    const [row] = await db.select().from(s.revisionItem).where(eq(s.revisionItem.defenseAttemptId, w.attempt.id));
    const itemId = row!.id;
    // The member cannot accept before the Student links a commit.
    await expect(acceptRevision(as(w.lead), itemId)).rejects.toThrow(/not linked/);
    await expect(linkRevisionToCommit(as(w.adviser), itemId, w.commit.id)).rejects.toBeInstanceOf(AccessDeniedError);
    const other = await makeThesisChain(db);
    await expect(linkRevisionToCommit(as(w.student), itemId, other.commit.id)).rejects.toThrow(/not on your manuscript/);
    await linkRevisionToCommit(as(w.student), itemId, w.commit.id);

    await db.update(s.milestoneInstance).set({ status: "CLOSED" }).where(eq(s.milestoneInstance.id, w.milestone.id));
    await expect(transitionMilestone(as(w.coordinator), w.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "revisions_not_accepted" });
    await expect(acceptRevision(as(w.student), itemId)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(acceptRevision(as(w.coordinator), itemId)).rejects.toBeInstanceOf(AccessDeniedError);
    const stranger = await makeUser(db, "adviser");
    await expect(acceptRevision(as(stranger), itemId)).rejects.toBeInstanceOf(AccessDeniedError);
    for (const u of [w.adviser, w.lead]) await acceptRevision(as(u), itemId);
    await expect(acceptRevision(as(w.lead), itemId)).rejects.toThrow(/already/);
    // Not every member accepted yet.
    await expect(transitionMilestone(as(w.coordinator), w.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "revisions_not_accepted" });
    await acceptRevision(as(w.chair), itemId);
    // Past this point the guard asks for the Certification document, so the revisions guard passed.
    await expect(transitionMilestone(as(w.coordinator), w.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "certification_missing" });
    // An accepted item no longer changes.
    await expect(linkRevisionToCommit(as(w.student), itemId, w.commit.id)).rejects.toThrow(/cannot change/);
  });
});

describe("listRevisionItems (BR-11)", () => {
  it("hides the items from the Student until every sheet is verified, and shows who accepted", async () => {
    const w = await held();
    await addRevisionItems(as(w.coordinator), w.attempt.id, ["Add limits.", "Fix refs."]);
    expect(await listRevisionItems(as(w.student), w.attempt.id)).toEqual([]);
    const coordinatorView = await listRevisionItems(as(w.coordinator), w.attempt.id);
    expect(coordinatorView.map((i) => i.ordinal)).toEqual([1, 2]);
    expect(coordinatorView.every((i) => i.mine === null && !i.allAccepted)).toBe(true);
    await w.verifySheets();
    const seen = await listRevisionItems(as(w.student), w.attempt.id);
    expect(seen.map((i) => i.body)).toEqual(["Add limits.", "Fix refs."]);
    const [first] = seen;
    await linkRevisionToCommit(as(w.student), first!.id, w.commit.id);
    for (const u of [w.adviser, w.lead, w.chair]) await acceptRevision(as(u), first!.id);
    const after = await listRevisionItems(as(w.lead), w.attempt.id);
    expect(after[0]).toMatchObject({ linkedCommitOrdinal: 1, allAccepted: true, mine: true });
    expect(after[1]).toMatchObject({ linkedCommitOrdinal: null, allAccepted: false, mine: false });
    const stranger = await makeUser(db, "student");
    await expect(listRevisionItems(as(stranger), w.attempt.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
