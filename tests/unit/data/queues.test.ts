// P1-E11-T03 (Adviser and Panel Member part): A1 and P1 dashboard data
// (FR-TRK-02, FR-TRK-03, FR-TRK-06, NFR-01, BR-08, BR-17, BR-18).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { publishSlots, requestBooking } from "@/server/data/consultations";
import { adviserDashboard, panelDashboard } from "@/server/data/queues";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const adviser = () => ({ db, actor: actorOf(seed.adviser) });
const panel = (i = 0) => ({ db, actor: actorOf(seed.panel[i]!) });
const setStatus = (status: (typeof s.milestoneStatus.enumValues)[number], extra: Partial<typeof s.milestoneInstance.$inferInsert> = {}) =>
  db.update(s.milestoneInstance).set({ status, ...extra }).where(eq(s.milestoneInstance.id, seed.milestone.id));

async function readyCommit() {
  const [pr] = await db.insert(s.submissionPr).values({ milestoneInstanceId: seed.milestone.id }).returning();
  const [c] = await db
    .insert(s.manuscriptCommit)
    .values({ submissionPrId: pr!.id, ordinal: 1, fileKey: "agent-b/test/manuscript/1.pdf", sha256: "a".repeat(64), sizeBytes: 1024, uploadedByUserId: seed.student.id })
    .returning();
  await db.update(s.submissionPr).set({ readyCommitId: c!.id }).where(eq(s.submissionPr.id, pr!.id));
  return { prId: pr!.id, commitId: c!.id };
}

async function seat(userId: string, designation: "none" | "lead_panel_member" | "panel_chair", verifiedPaper: boolean) {
  const [c] = await db.insert(s.committee).values({ thesisInstanceId: seed.thesis.id, kind: "evaluation_committee" }).onConflictDoNothing().returning();
  const committeeId = c?.id ?? (await db.select().from(s.committee))[0]!.id;
  const state = verifiedPaper ? "verified" : "locked_as_submitted";
  const [form] = await db.insert(s.documentRecord).values({ milestoneInstanceId: seed.milestone.id, formCode: "TDW_06", state }).returning();
  const [nda] = await db.insert(s.documentRecord).values({ milestoneInstanceId: seed.milestone.id, formCode: "TDW_05", subjectUserId: userId, state }).returning();
  await db.update(s.committee).set({ appointmentDocumentId: form!.id }).where(eq(s.committee.id, committeeId));
  const [m] = await db.insert(s.committeeMember).values({ committeeId, memberUserId: userId, designation, status: "accepted", ndaDocumentId: nda!.id }).returning();
  return m!;
}

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
});

describe("adviserDashboard (A1)", () => {
  it("lists the advisee roster, and a Ready commit with the TDW 03 upload as the queue", async () => {
    await setStatus("READY");
    const d = await adviserDashboard(adviser());
    expect(d.queue.map((q) => q.kind).sort()).toEqual(["gate_1a", "tdw03"]);
    expect(d.queue[0]).toMatchObject({ studentName: seed.student.fullName, milestone: "proposal" });
    const tdw03 = d.queue.find((q) => q.kind === "tdw03")!;
    expect(tdw03.requiredItemId).toEqual(expect.any(String));
    expect(d.queue.find((q) => q.kind === "gate_1a")!.requiredItemId).toBeNull();
    expect(d.advisees).toEqual([expect.objectContaining({ studentName: seed.student.fullName, status: "READY", pacingFlag: false })]);
  });

  it("queues Gate 1b until the Adviser endorses the Ready commit", async () => {
    const { prId, commitId } = await readyCommit();
    await setStatus("COMMITTEE_APPOINTED");
    const before = await adviserDashboard(adviser());
    expect(before.queue.find((q) => q.kind === "gate_1b")).toMatchObject({ prId });
    await db.insert(s.gateAction).values({ milestoneInstanceId: seed.milestone.id, gate: "gate_1b", result: "endorsed", actorUserId: seed.adviser.id, actorRole: "adviser", commitId });
    expect((await adviserDashboard(adviser())).queue.some((q) => q.kind === "gate_1b")).toBe(false);
  });

  it("queues data gathering after the Certification, once (FR-WFL-11)", async () => {
    await setStatus("CERTIFIED");
    expect((await adviserDashboard(adviser())).queue.map((q) => q.kind)).toEqual(["data_gathering"]);
    await setStatus("CERTIFIED", { dataGatheringApprovedAt: new Date() });
    expect((await adviserDashboard(adviser())).queue).toEqual([]);
  });

  it("queues a pending consultation request, then drops it once the Adviser answers (FR-SCH-02)", async () => {
    const now = new Date("2026-11-22T00:00:00Z");
    const start = new Date(now.getTime() + 86_400_000);
    await publishSlots(adviser(), { slotType: "consultation", mode: "in_person", meetingLink: null, startsAt: start, endsAt: new Date(start.getTime() + 3_600_000), repeatWeeks: 0 }, now);
    const [slot] = await db.select().from(s.slot);
    await requestBooking({ db, actor: actorOf(seed.student) }, { slotId: slot!.id }, now);
    const d = await adviserDashboard(adviser(), now);
    expect(d.queue.find((q) => q.kind === "consultation_request")).toMatchObject({ studentName: seed.student.fullName, milestone: null });
    await db.update(s.booking).set({ status: "confirmed" });
    expect((await adviserDashboard(adviser(), now)).queue.some((q) => q.kind === "consultation_request")).toBe(false);
  });

  it("links the roster row to the review and to the scheduled defense", async () => {
    const { prId } = await readyCommit();
    await setStatus("DEFENSE_SCHEDULED");
    const [att] = await db.insert(s.defenseAttempt).values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date("2026-12-01T01:00:00Z") }).returning();
    expect((await adviserDashboard(adviser())).advisees[0]).toMatchObject({ prId, attemptId: att!.id });
  });

  it("flags a Student past the target date as information only (FR-TRK-06, BR-17)", async () => {
    await setStatus("DRAFT", { targetDate: "2026-11-01" });
    const d = await adviserDashboard(adviser(), new Date("2026-11-20T00:00:00Z"));
    expect(d.advisees[0]!.pacingFlag).toBe(true);
    expect(d.queue.some((q) => q.kind === "gate_1a")).toBe(false); // A flag never adds or blocks an action.
  });

  it("shows only the Adviser's own advisees, and refuses other roles (NFR-01)", async () => {
    const [other] = await db.insert(s.appUser).values({ email: "adv2@example.test", fullName: "Other Adviser", role: "adviser", authUserId: "adv2-auth" }).returning();
    await setStatus("READY");
    expect(await adviserDashboard({ db, actor: actorOf(other!) })).toEqual({ queue: [], advisees: [] });
    for (const u of [seed.student, seed.coordinator, seed.panel[0]!]) {
      await expect(adviserDashboard({ db, actor: actorOf(u) })).rejects.toBeInstanceOf(AccessDeniedError);
    }
  });
});

describe("panelDashboard (P1)", () => {
  it("is empty for a Panel Member with no seat", async () => {
    expect(await panelDashboard(panel())).toEqual({ assignments: [] });
  });

  it("shows a locked manuscript with its reason until the form and the NDA are verified (BR-08, BR-18)", async () => {
    await seat(seed.panel[0]!.id, "lead_panel_member", false);
    await setStatus("COMMITTEE_APPOINTED");
    const [a] = (await panelDashboard(panel())).assignments;
    expect(a).toMatchObject({ studentName: seed.student.fullName, milestone: "proposal", designation: "lead_panel_member", isSubstitute: false, actionRequired: null });
    expect(a!.access.open).toBe(false);
    expect((a!.access as { reason: string }).reason.length).toBeGreaterThan(0);
  });

  it("asks for Gate 1b once the manuscript is open, and stops after the endorsement", async () => {
    await seat(seed.panel[0]!.id, "none", true);
    const { commitId } = await readyCommit();
    await setStatus("COMMITTEE_APPOINTED");
    const [a] = (await panelDashboard(panel())).assignments;
    expect(a!.access).toEqual({ open: true });
    expect(a!.actionRequired).toBe("Review the commit and endorse it (Gate 1b).");
    await db.insert(s.gateAction).values({ milestoneInstanceId: seed.milestone.id, gate: "gate_1b", result: "endorsed", actorUserId: seed.panel[0]!.id, actorRole: "panel_member", commitId });
    expect((await panelDashboard(panel())).assignments[0]!.actionRequired).toBeNull();
  });

  it("asks for the sheet, then for the verdict from the Lead Panel Member, and shows the schedule", async () => {
    await seat(seed.panel[0]!.id, "lead_panel_member", true);
    await setStatus("DEFENSE_SCHEDULED");
    const [att] = await db
      .insert(s.defenseAttempt)
      .values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date("2026-11-20T01:00:00Z"), roomOrLink: "Room 2" })
      .returning();
    const now = new Date("2026-11-21T00:00:00Z");
    const first = (await panelDashboard(panel(), now)).assignments[0]!;
    expect(first.actionRequired).toBe("Save your evaluation sheet.");
    expect(first.defense).toEqual({ startsAt: new Date("2026-11-20T01:00:00Z"), roomOrLink: "Room 2" });
    expect(first.attemptId).toBe(att!.id);
    await db.insert(s.evaluationEntry).values({ defenseAttemptId: att!.id, memberUserId: seed.panel[0]!.id, form: "TDW_08", actionTaken: "approved" });
    expect((await panelDashboard(panel(), now)).assignments[0]!.actionRequired).toBe("Record the verdict.");
    // Before the defense date nothing is due (INV-15).
    expect((await panelDashboard(panel(), new Date("2026-11-19T00:00:00Z"))).assignments[0]!.actionRequired).toBeNull();
  });

  it("shows only the member's own seats, and refuses other roles (NFR-01)", async () => {
    await seat(seed.panel[0]!.id, "none", true);
    expect((await panelDashboard(panel(1))).assignments).toEqual([]);
    for (const u of [seed.student, seed.adviser, seed.coordinator]) {
      await expect(panelDashboard({ db, actor: actorOf(u) })).rejects.toBeInstanceOf(AccessDeniedError);
    }
  });
});
