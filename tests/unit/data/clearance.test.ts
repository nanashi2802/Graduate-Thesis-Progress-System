// P3-E04: the clearance checklist and the close to CLEARED (FR-CLR-01 to 04, BR-02, BR-21, INV-33, AD-A-029).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import { EVIDENCE_FORM, readClearance, verifyClearanceItem } from "@/server/data/clearance";
import type { Db } from "@/server/data/db";
import { transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import { manuscriptAccessEnded } from "@/server/data/scope";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

// A valid id that no row has. Changing a real id can give back the same id.
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: { userId: u.id, role: u.role, isActive: true } as Actor });

// A Final milestone at FINAL_APPROVED, with a verified signed manuscript and one approving panel member.
async function world() {
  const t = await makeThesisChain(db);
  const member = await makeUser(db, "panel_member");
  const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "final"));
  const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, tpl!.id));
  const [m3] = await db
    .insert(s.milestoneInstance)
    .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "final", status: "FINAL_APPROVED" })
    .returning();
  // One accepted Final Panel member, who approved Gate 2 (FR-WFL-07).
  const [panel] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "final_panel" }).returning();
  await db.insert(s.committeeMember).values({ committeeId: panel!.id, memberUserId: member.id, designation: "panel_chair", status: "accepted" });
  await db.insert(s.gateAction).values({ milestoneInstanceId: m3!.id, gate: "gate_2", result: "approved", actorUserId: member.id, actorRole: "panel_member" });
  return { ...t, member, m3: m3! };
}
// The Student's evidence scan, already uploaded (FR-CLR-02), then the Coordinator verifies.
async function verify(w: Awaited<ReturnType<typeof world>>, kind: keyof typeof EVIDENCE_FORM, matchesApproved?: boolean) {
  await db.insert(s.documentRecord).values({ milestoneInstanceId: w.m3.id, formCode: EVIDENCE_FORM[kind], state: "locked_as_submitted" });
  await verifyClearanceItem(as(w.coordinator), { milestoneId: w.m3.id, kind, matchesApproved });
}
const doneOf = async (w: Awaited<ReturnType<typeof world>>, gate2 = true) =>
  Object.fromEntries((await readClearance(as(w.student), w.m3.id, gate2)).map((r) => [r.kind, r.done]));

describe("Clearance checklist (FR-CLR-01 to 04)", () => {
  it("lists the seven items, with four from their own records", async () => {
    const w = await world();
    const rows = await readClearance(as(w.student), w.m3.id, false);
    expect(rows.map((r) => r.kind)).toEqual(["ipmo", "rpo", "gate_2", "copyright", "final_copy", "conference_cert", "journal_pub"]);
    expect(rows.every((r) => !r.done)).toBe(true);
    for (const [kind, value] of [["ipmo", "PASSED"], ["rpo", "DONE"], ["copyright", "REGISTERED"]] as const) {
      await setOutsideStatus(as(w.coordinator), w.m3.id, kind, value);
    }
    expect(await doneOf(w)).toMatchObject({ ipmo: true, rpo: true, copyright: true, gate_2: true, final_copy: false });
  });

  it("refuses a Panel Member without access and a milestone that is not Milestone 3", async () => {
    const w = await world();
    await expect(readClearance(as(await makeUser(db, "panel_member")), w.m3.id, true)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(readClearance(as(w.student), MISSING_ID, true)).rejects.toThrow();
    await expect(readClearance(as(w.student), w.milestone.id, true)).rejects.toThrow(/Milestone 3/);
  });

  it("lets only the Coordinator verify, and the final copy only after the match check (FR-CLR-03)", async () => {
    const w = await world();
    await expect(verifyClearanceItem(as(w.student), { milestoneId: w.m3.id, kind: "conference_cert" })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(verifyClearanceItem(as(w.coordinator), { milestoneId: w.m3.id, kind: "final_copy" })).rejects.toThrow(/approved manuscript/);
    await expect(verifyClearanceItem(as(w.coordinator), { milestoneId: w.m3.id, kind: "ipmo" as "final_copy" })).rejects.toThrow(/another record/);
    await expect(verifyClearanceItem(as(w.coordinator), { milestoneId: w.m3.id, kind: "final_copy", matchesApproved: true })).rejects.toThrow(/evidence/);
    // A returned or mismatched scan is not evidence (FR-CLR-02).
    for (const state of ["returned", "mismatch"] as const) {
      const [r] = await db.insert(s.documentRecord).values({ milestoneInstanceId: w.m3.id, formCode: "FINAL_COPY", state }).returning();
      await expect(verifyClearanceItem(as(w.coordinator), { milestoneId: w.m3.id, kind: "final_copy", matchesApproved: true })).rejects.toThrow(/evidence/);
      await db.delete(s.documentRecord).where(eq(s.documentRecord.id, r!.id));
    }
    await verify(w, "final_copy", true);
    const [row] = await db.select().from(s.clearanceItem).where(eq(s.clearanceItem.milestoneInstanceId, w.m3.id));
    expect(row!.evidenceDocumentId).not.toBeNull();
    await expect(verifyClearanceItem(as(w.coordinator), { milestoneId: w.m3.id, kind: "final_copy", matchesApproved: true })).rejects.toThrow(/already verified/);
    expect(await doneOf(w)).toMatchObject({ final_copy: true, conference_cert: false });
  });

  it("keeps a verified item: no update and no delete (INV-08, BR-19)", async () => {
    const w = await world();
    await verify(w, "journal_pub");
    await expect(db.delete(s.clearanceItem).where(eq(s.clearanceItem.milestoneInstanceId, w.m3.id))).rejects.toThrow();
    await expect(db.update(s.clearanceItem).set({ kind: "rpo" }).where(eq(s.clearanceItem.milestoneInstanceId, w.m3.id))).rejects.toThrow();
  });

  it("ends the Panel Member's manuscript access at the final copy (INV-33, BR-21)", async () => {
    const w = await world();
    expect(await manuscriptAccessEnded(as(w.coordinator), w.thesis.id)).toBe(false);
    await verify(w, "final_copy", true);
    expect(await manuscriptAccessEnded(as(w.coordinator), w.thesis.id)).toBe(true);
  });

  it("sets CLEARED only when every item is done, and only by the Coordinator (FR-CLR-04, BR-02)", async () => {
    const w = await world();
    await expect(transitionMilestone(as(w.coordinator), w.m3.id, "CLEARED")).rejects.toMatchObject({ code: "clearance_incomplete" });
    for (const [kind, value] of [["ipmo", "PASSED"], ["rpo", "DONE"], ["copyright", "REGISTERED"]] as const) {
      await setOutsideStatus(as(w.coordinator), w.m3.id, kind, value);
    }
    await verify(w, "final_copy", true);
    await verify(w, "conference_cert");
    await expect(transitionMilestone(as(w.coordinator), w.m3.id, "CLEARED")).rejects.toMatchObject({ code: "clearance_incomplete" });
    await verify(w, "journal_pub");
    await expect(transitionMilestone(as(w.adviser), w.m3.id, "CLEARED")).rejects.toMatchObject({ code: "wrong_actor" });
    await transitionMilestone(as(w.coordinator), w.m3.id, "CLEARED");
    const [m] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, w.m3.id));
    expect(m!.status).toBe("CLEARED");
  });
});

describe("event B5", () => {
  it("tells the Student when the Coordinator verifies an item", async () => {
    const w = await world();
    await verify(w, "conference_cert");
    const rows = (await db.select().from(s.notification)).filter((n) => n.eventCode === "B5" && n.targetId === w.m3.id);
    expect(rows.map((n) => n.recipientUserId)).toEqual([w.student.id]);
  });
});
