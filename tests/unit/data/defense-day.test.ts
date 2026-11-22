// P3-E02: Defense Day threads, context C (FR-REV-12, FR-REV-15, BR-20, AD-A-028).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { approveGate2, gate2Block, transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import { listThreads, postThread, replyToThread, resolveThread, threadPostBlock } from "@/server/data/manuscript";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser, SHA } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: actorOf(u) });
const DAY = 86_400_000;

// A Final milestone with a Final Panel (Panel Chair and one member, access verified), a scheduled attempt and one commit.
async function finalWorld(startOffsetDays: number) {
  const t = await makeThesisChain(db);
  const chair = await makeUser(db, "panel_member");
  const member = await makeUser(db, "panel_member");
  const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "final"));
  const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, tpl!.id));
  const [m3] = await db
    .insert(s.milestoneInstance)
    .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "final", status: "DEFENSE_SCHEDULED" })
    .returning();
  const [pr] = await db.insert(s.submissionPr).values({ milestoneInstanceId: m3!.id }).returning();
  const [commit] = await db
    .insert(s.manuscriptCommit)
    .values({ submissionPrId: pr!.id, ordinal: 1, fileKey: `test/manuscript/${crypto.randomUUID()}.pdf`, sha256: SHA, sizeBytes: 100, uploadedByUserId: t.student.id })
    .returning();
  // The Final manuscript locked at Gate 1b (BR-07), after its last commit.
  await db.update(s.submissionPr).set({ lockedAt: new Date() }).where(eq(s.submissionPr.id, pr!.id));
  const [panel] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "final_panel" }).returning();
  const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, v!.id));
  const doc = async (formCode: s.FormCode, subject: string | null) =>
    (await db.insert(s.documentRecord).values({ milestoneInstanceId: m3!.id, templateRequiredItemId: item!.id, formCode, subjectUserId: subject, state: "verified" }).returning())[0]!;
  const form = await doc("TDW_11", null);
  await db.update(s.committee).set({ appointmentDocumentId: form.id }).where(eq(s.committee.id, panel!.id));
  const ndas = [await doc("TDW_05", chair.id), await doc("TDW_05", member.id)];
  await db.insert(s.committeeMember).values([
    { committeeId: panel!.id, memberUserId: chair.id, designation: "panel_chair", status: "accepted", ndaDocumentId: ndas[0]!.id },
    { committeeId: panel!.id, memberUserId: member.id, designation: "none", status: "accepted", ndaDocumentId: ndas[1]!.id },
  ]);
  await db.insert(s.defenseAttempt).values({ milestoneInstanceId: m3!.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date(Date.now() + startOffsetDays * DAY) });
  return { ...t, chair, member, m3: m3!, commit: commit!, pr: pr! };
}
const setStatus = (id: string, status: s.MilestoneStatusValue) => db.update(s.milestoneInstance).set({ status }).where(eq(s.milestoneInstance.id, id));

describe("Defense Day threads (FR-REV-12, FR-REV-15, BR-20)", () => {
  it("is read only before the scheduled start, with the reason shown", async () => {
    const w = await finalWorld(2);
    expect(await threadPostBlock(as(w.member), w.m3.id)).toMatch(/opens at the scheduled start/);
    await expect(postThread(as(w.member), { commitId: w.commit.id, body: "Too early." })).rejects.toThrow(/cannot post/);
    // The panel still reads the manuscript (access rules, INV-24).
    await expect(listThreads(as(w.member), w.m3.id)).resolves.toEqual([]);
  });

  it("opens at the start for the Panel Chair and the Panel Members, in context C", async () => {
    const w = await finalWorld(-1);
    expect(await threadPostBlock(as(w.member), w.m3.id)).toBeNull();
    await postThread(as(w.member), { commitId: w.commit.id, body: "Explain the framework." });
    await postThread(as(w.chair), { commitId: w.commit.id, body: "Check the references." });
    const threads = await listThreads(as(w.chair), w.m3.id);
    expect(threads.map((t) => t.thread.context)).toEqual(["defense_day", "defense_day"]);
  });

  it("refuses the Adviser, the Student and the Coordinator, and a member outside the Final Panel", async () => {
    const w = await finalWorld(-1);
    for (const u of [w.adviser, w.student, w.coordinator]) {
      await expect(postThread(as(u), { commitId: w.commit.id, body: "x" })).rejects.toThrow(/cannot post/);
    }
    const outsider = await makeUser(db, "panel_member");
    await expect(postThread(as(outsider), { commitId: w.commit.id, body: "x" })).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("hides the threads from the Student until the defense closes, then lets the Student reply (BR-20)", async () => {
    const w = await finalWorld(-1);
    const { threadId } = await postThread(as(w.member), { commitId: w.commit.id, body: "Explain the framework." });
    expect(await listThreads(as(w.student), w.m3.id)).toEqual([]);
    await expect(replyToThread(as(w.student), threadId, "Reply")).rejects.toBeInstanceOf(AccessDeniedError);
    // The Adviser supervises and sees the thread.
    expect(await listThreads(as(w.adviser), w.m3.id)).toHaveLength(1);
    await setStatus(w.m3.id, "DEFENSE_HELD");
    expect(await listThreads(as(w.student), w.m3.id)).toEqual([]);
    await setStatus(w.m3.id, "CLOSED");
    expect(await listThreads(as(w.student), w.m3.id)).toHaveLength(1);
    await replyToThread(as(w.student), threadId, "Explained in the new commit.");
    // Only the author resolves (BR-05).
    await expect(resolveThread(as(w.chair), threadId)).rejects.toBeInstanceOf(AccessDeniedError);
    await resolveThread(as(w.member), threadId);
  });

  it("closes the window for a member who approved Gate 2", async () => {
    const w = await finalWorld(-1);
    await setStatus(w.m3.id, "CLOSED");
    await db.insert(s.gateAction).values({ milestoneInstanceId: w.m3.id, gate: "gate_2", result: "approved", actorUserId: w.member.id, actorRole: "panel_member" });
    expect(await threadPostBlock(as(w.member), w.m3.id)).toMatch(/approved Gate 2/);
    expect(await threadPostBlock(as(w.chair), w.m3.id)).toBeNull();
  });
});

describe("Gate 2 and FINAL_APPROVED (FR-WFL-07, BR-20, INV-22, INV-34)", () => {
  it("needs IPMO PASSED, RPO DONE and no open thread of the member, and names the approved commit", async () => {
    const w = await finalWorld(-1);
    await setStatus(w.m3.id, "CLOSED");
    expect(await gate2Block(as(w.member), w.m3.id)).toMatch(/clearance item is incomplete/);
    await expect(approveGate2(as(w.member), w.m3.id)).rejects.toMatchObject({ code: "clearance_incomplete" });
    for (const [kind, value] of [["ipmo", "PASSED"], ["rpo", "DONE"]] as const) await setOutsideStatus(as(w.coordinator), w.m3.id, kind, value);
    const { threadId } = await postThread(as(w.member), { commitId: w.commit.id, body: "One more point." });
    expect(await gate2Block(as(w.member), w.m3.id)).toMatch(/open threads/);
    await resolveThread(as(w.member), threadId);
    expect(await gate2Block(as(w.member), w.m3.id)).toBeNull();
    expect(await gate2Block(as(w.student), w.m3.id)).toMatch(/Final Panel/);
    await approveGate2(as(w.member), w.m3.id);
    expect(await gate2Block(as(w.member), w.m3.id)).toMatch(/already approved/);
    await expect(approveGate2(as(w.member), w.m3.id)).rejects.toMatchObject({ code: "gate_done" });
    const [row] = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, w.m3.id));
    expect(row).toMatchObject({ result: "approved", actorUserId: w.member.id, commitId: w.commit.id });
  });

  it("lets the Coordinator record FINAL_APPROVED only after every member approved and the signed manuscript is verified", async () => {
    const w = await finalWorld(-1);
    await setStatus(w.m3.id, "CLOSED");
    for (const [kind, value] of [["ipmo", "PASSED"], ["rpo", "DONE"]] as const) await setOutsideStatus(as(w.coordinator), w.m3.id, kind, value);
    await expect(transitionMilestone(as(w.coordinator), w.m3.id, "FINAL_APPROVED")).rejects.toMatchObject({ code: "gate_2_incomplete" });
    await approveGate2(as(w.member), w.m3.id);
    await expect(transitionMilestone(as(w.coordinator), w.m3.id, "FINAL_APPROVED")).rejects.toMatchObject({ code: "gate_2_incomplete" });
    await approveGate2(as(w.chair), w.m3.id);
    await expect(transitionMilestone(as(w.coordinator), w.m3.id, "FINAL_APPROVED")).rejects.toMatchObject({ code: "signed_final_missing" });
    const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.formCode, "SIGNED_FINAL_MANUSCRIPT"));
    await db.insert(s.documentRecord).values({ milestoneInstanceId: w.m3.id, templateRequiredItemId: item!.id, formCode: "SIGNED_FINAL_MANUSCRIPT", linkedCommitId: w.commit.id, state: "verified" });
    await expect(transitionMilestone(as(w.adviser), w.m3.id, "FINAL_APPROVED")).rejects.toMatchObject({ code: "wrong_actor" });
    await transitionMilestone(as(w.coordinator), w.m3.id, "FINAL_APPROVED");
    const [m] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, w.m3.id));
    expect(m!.status).toBe("FINAL_APPROVED");
  });
});
