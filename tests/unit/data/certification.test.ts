// P1-E10: Certification and data gathering (FR-WFL-06, FR-WFL-11, BR-02, INV-17, INV-34, AD-A-022).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import { approveDataGathering, dataGatheringApproved } from "@/server/data/certification";
import { expectAuditKinds } from "../../support/audit";
import type { Db } from "@/server/data/db";
import { transitionMilestone } from "@/server/data/milestones";
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

// A Proposal milestone at CLOSED with one accepted member and one revision item.
async function closed() {
  const t = await makeThesisChain(db);
  const member = await makeUser(db, "panel_member");
  const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
  await db.insert(s.committeeMember).values({ committeeId: com!.id, memberUserId: member.id, status: "accepted" });
  await db.update(s.milestoneInstance).set({ status: "CLOSED" }).where(eq(s.milestoneInstance.id, t.milestone.id));
  const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, t.version.id));
  const [attempt] = await db.insert(s.defenseAttempt).values({ milestoneInstanceId: t.milestone.id, attemptNo: 1, status: "closed" }).returning();
  const [revision] = await db.insert(s.revisionItem).values({ defenseAttemptId: attempt!.id, ordinal: 1, body: "Add a limitation section." }).returning();
  const certification = async (state: s.DocumentState) =>
    db.insert(s.documentRecord).values({
      milestoneInstanceId: t.milestone.id,
      templateRequiredItemId: item!.id,
      formCode: "CERTIFICATION",
      linkedCommitId: t.commit.id,
      state,
    });
  return { ...t, member, revision: revision!, certification };
}
const statusOf = async (id: string) => (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, id)))[0]!;

describe("CLOSED to CERTIFIED (FR-WFL-06, INV-17, INV-34)", () => {
  it("needs every revision item accepted by the Adviser and each member, and the verified Certification", async () => {
    const t = await closed();
    await expect(transitionMilestone(as(t.coordinator), t.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "revisions_not_accepted" });
    await db.insert(s.revisionAcceptance).values([
      { revisionItemId: t.revision.id, memberUserId: t.adviser.id },
      { revisionItemId: t.revision.id, memberUserId: t.member.id },
    ]);
    await expect(transitionMilestone(as(t.coordinator), t.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "certification_missing" });
    await t.certification("physical_received");
    await expect(transitionMilestone(as(t.coordinator), t.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "certification_missing" });
    await db.update(s.documentRecord).set({ state: "verified" }).where(eq(s.documentRecord.milestoneInstanceId, t.milestone.id));
    await expect(transitionMilestone(as(t.adviser), t.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "wrong_actor" });
    await expect(transitionMilestone(as(t.student), t.milestone.id, "CERTIFIED")).rejects.toMatchObject({ code: "wrong_actor" });
    await transitionMilestone(as(t.coordinator), t.milestone.id, "CERTIFIED");
    expect((await statusOf(t.milestone.id)).status).toBe("CERTIFIED");
    const rows = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, t.milestone.id));
    expect(rows.find((r) => r.gate === "certification")).toMatchObject({ result: "recorded", actorUserId: t.coordinator.id });
  });

  it("makes the database refuse a Certification with no linked commit (INV-34) and a second one", async () => {
    const t = await closed();
    const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, t.version.id));
    await expect(
      db.insert(s.documentRecord).values({ milestoneInstanceId: t.milestone.id, templateRequiredItemId: item!.id, formCode: "CERTIFICATION" }),
    ).rejects.toThrow();
    await t.certification("verified");
    await expect(t.certification("verified")).rejects.toThrow();
  });
});

describe("approveDataGathering (FR-WFL-11)", () => {
  async function certified() {
    const t = await closed();
    await db.update(s.milestoneInstance).set({ status: "CERTIFIED" }).where(eq(s.milestoneInstance.id, t.milestone.id));
    return t;
  }

  it("lets only the Adviser of the thesis approve, once, after CERTIFIED", async () => {
    const t = await closed();
    await expect(approveDataGathering(as(t.adviser), t.milestone.id)).rejects.toThrow(/Certification first/);
    await db.update(s.milestoneInstance).set({ status: "CERTIFIED" }).where(eq(s.milestoneInstance.id, t.milestone.id));
    await expect(approveDataGathering(as(t.student), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(approveDataGathering(as(t.coordinator), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    const other = await makeUser(db, "adviser");
    await expect(approveDataGathering(as(other), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    expect(await dataGatheringApproved(as(t.student), t.milestone.id)).toBe(false);
    await approveDataGathering(as(t.adviser), t.milestone.id);
    await expectAuditKinds(db, ["data_gathering.approve", "milestone.open"]);
    expect(await dataGatheringApproved(as(t.student), t.milestone.id)).toBe(true);
    await expect(approveDataGathering(as(t.adviser), t.milestone.id)).rejects.toThrow(/already/);
    const rows = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, t.milestone.id));
    expect(rows.find((r) => r.gate === "data_gathering")).toMatchObject({ result: "approved", actorUserId: t.adviser.id });
  });

  it("is for the Proposal only", async () => {
    const t = await certified();
    const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "pre_final"));
    const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, tpl!.id));
    const [m2] = await db
      .insert(s.milestoneInstance)
      .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "pre_final", status: "CLOSED" })
      .returning();
    await expect(approveDataGathering(as(t.adviser), m2!.id)).rejects.toThrow(/Proposal/);
  });
});
