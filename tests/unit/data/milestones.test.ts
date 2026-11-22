// P1-E04-T03 to T05: milestone status changes, Returns, Gate 1b and Gate 2, outside statuses
// (FR-WFL-02 to 10, BR-02, BR-07, BR-13, BR-14, INV-17 to INV-22, INV-27, AD-A-017).
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import {
  approveGate2,
  checkTransition,
  endorseGate1b,
  transitionMilestone,
  TransitionRefused,
} from "@/server/data/milestones";
import { currentOutsideStatuses, readOutsideStatuses, setOutsideStatus } from "@/server/data/outside";
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

// A thesis with an Evaluation Committee of two accepted Panel Members.
async function setup() {
  const chain = await makeThesisChain(db);
  const lead = await makeUser(db, "panel_member");
  const chair = await makeUser(db, "panel_member");
  const [com] = await db
    .insert(s.committee)
    .values({ thesisInstanceId: chain.thesis.id, kind: "evaluation_committee" })
    .returning();
  await db.insert(s.committeeMember).values([
    { committeeId: com!.id, memberUserId: lead.id, designation: "lead_panel_member", status: "accepted" },
    { committeeId: com!.id, memberUserId: chair.id, designation: "none", status: "accepted" },
  ]);
  return { ...chain, lead, chair, committee: com! };
}

const setStatus = (milestoneId: string, status: s.MilestoneStatusValue) =>
  db.update(s.milestoneInstance).set({ status }).where(eq(s.milestoneInstance.id, milestoneId));
const setReady = (prId: string, commitId: string) =>
  db.update(s.submissionPr).set({ readyCommitId: commitId }).where(eq(s.submissionPr.id, prId));
const statusOf = async (milestoneId: string) =>
  (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, milestoneId)))[0]!;

async function openThread(commitId: string, author: { id: string; role: s.UserRole }) {
  const [t] = await db
    .insert(s.critiqueThread)
    .values({ commitId, authorUserId: author.id, authorRole: author.role, context: "iteration", body: "Fake comment." })
    .returning();
  return t!;
}

describe("transitionMilestone (ERD §7.1)", () => {
  it("lets the Student mark Ready only when a commit is marked Ready", async () => {
    const t = await setup();
    await expect(transitionMilestone(as(t.student), t.milestone.id, "READY")).rejects.toMatchObject({ code: "no_ready_commit" });
    await setReady(t.pr.id, t.commit.id);
    await expect(transitionMilestone(as(t.student), t.milestone.id, "READY")).resolves.toBe("READY");
    expect((await statusOf(t.milestone.id)).status).toBe("READY");
  });

  it("refuses a status change that is not in the table", async () => {
    const t = await setup();
    await expect(transitionMilestone(as(t.student), t.milestone.id, "CLOSED")).rejects.toMatchObject({ code: "not_allowed" });
  });

  it("refuses the wrong role: a Student cannot endorse at Gate 1a (BR-02)", async () => {
    const t = await setup();
    await setStatus(t.milestone.id, "READY");
    await expect(transitionMilestone(as(t.student), t.milestone.id, "ADVISER_ENDORSED")).rejects.toMatchObject({
      code: "wrong_actor",
    });
  });

  it("refuses a Coordinator-only status for the Adviser (INV-17)", async () => {
    const t = await setup();
    await setStatus(t.milestone.id, "DEFENSE_HELD");
    await expect(transitionMilestone(as(t.adviser), t.milestone.id, "CLOSED")).rejects.toMatchObject({ code: "wrong_actor" });
  });

  it("blocks Gate 1a for an Adviser with an open thread, then writes the gate row (INV-20)", async () => {
    const t = await setup();
    await setReady(t.pr.id, t.commit.id);
    await setStatus(t.milestone.id, "READY");
    const thread = await openThread(t.commit.id, t.adviser);
    await expect(transitionMilestone(as(t.adviser), t.milestone.id, "ADVISER_ENDORSED")).rejects.toMatchObject({
      code: "open_threads",
    });
    await db
      .update(s.critiqueThread)
      .set({ state: "RESOLVED", resolvedAt: new Date() })
      .where(eq(s.critiqueThread.id, thread.id));
    await transitionMilestone(as(t.adviser), t.milestone.id, "ADVISER_ENDORSED");
    const rows = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, t.milestone.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ gate: "gate_1a", result: "endorsed", actorUserId: t.adviser.id, commitId: t.commit.id });
  });

  it("makes a Return need a reason and goes back to DRAFT with the reason kept (INV-18, INV-19, BR-13)", async () => {
    const t = await setup();
    await setStatus(t.milestone.id, "READY");
    await expect(transitionMilestone(as(t.adviser), t.milestone.id, "RETURNED", { reason: "  " })).rejects.toMatchObject({
      code: "reason_required",
    });
    await expect(transitionMilestone(as(t.adviser), t.milestone.id, "RETURNED", { reason: "Fix chapter 2." })).resolves.toBe(
      "DRAFT",
    );
    const m = await statusOf(t.milestone.id);
    expect(m.status).toBe("DRAFT");
    expect(m.returnReason).toBe("Fix chapter 2.");
    const [row] = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, t.milestone.id));
    expect(row).toMatchObject({ gate: "gate_1a", result: "returned", reason: "Fix chapter 2." });
  });

  it("limits a Coordinator Return to compliance or eligibility (INV-19)", async () => {
    const t = await setup();
    await setStatus(t.milestone.id, "DATE_PROPOSED");
    await expect(
      transitionMilestone(as(t.coordinator), t.milestone.id, "RETURNED", { reason: "Rewrite it.", purpose: "content" }),
    ).rejects.toMatchObject({ code: "coordinator_content_return" });
    await expect(
      transitionMilestone(as(t.coordinator), t.milestone.id, "RETURNED", { reason: "Form is missing.", purpose: "compliance" }),
    ).resolves.toBe("DRAFT");
  });

  it("refuses a user with no access to the thesis (NFR-01)", async () => {
    const t = await setup();
    const stranger = await makeUser(db, "student");
    await expect(transitionMilestone(as(stranger), t.milestone.id, "READY")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(checkTransition(as(stranger), t.milestone.id, "READY")).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("gives the reason for a blocked action without writing (BR-18)", async () => {
    const t = await setup();
    const d = await checkTransition(as(t.student), t.milestone.id, "READY");
    expect(d).toMatchObject({ ok: false, code: "no_ready_commit", reason: "Upload a commit first." });
    expect((await statusOf(t.milestone.id)).status).toBe("DRAFT");
  });

  it("writes an audit row for each change (NFR-03)", async () => {
    const t = await setup();
    await setReady(t.pr.id, t.commit.id);
    await transitionMilestone(as(t.student), t.milestone.id, "READY");
    const rows = await db
      .select()
      .from(s.auditRecord)
      .where(and(eq(s.auditRecord.targetId, t.milestone.id), eq(s.auditRecord.action, "milestone.status")));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.detail).toEqual({ from: "DRAFT", to: "READY" });
  });
});

describe("endorseGate1b (FR-WFL-04, INV-21, BR-07)", () => {
  async function atGate1b() {
    const t = await setup();
    await setReady(t.pr.id, t.commit.id);
    await setStatus(t.milestone.id, "COMMITTEE_APPOINTED");
    // BR-08 and FR-CMT-04: the appointment form and every NDA are recorded.
    return t;
  }

  it("moves to COMMITTEE_ENDORSED and locks the manuscript after the last endorsement", async () => {
    const t = await atGate1b();
    await expect(endorseGate1b(as(t.adviser), t.milestone.id)).resolves.toEqual({ completed: false });
    await expect(endorseGate1b(as(t.lead), t.milestone.id)).resolves.toEqual({ completed: false });
    expect((await statusOf(t.milestone.id)).status).toBe("COMMITTEE_APPOINTED");
    await expect(endorseGate1b(as(t.chair), t.milestone.id)).resolves.toEqual({ completed: true });
    expect((await statusOf(t.milestone.id)).status).toBe("COMMITTEE_ENDORSED");
    const [pr] = await db.select().from(s.submissionPr).where(eq(s.submissionPr.id, t.pr.id));
    expect(pr!.lockedAt).not.toBeNull();
  });

  it("starts a new Gate 1b round after a Coordinator Return at DATE_PROPOSED (BR-13, BR-07, AD-A-018)", async () => {
    const t = await atGate1b();
    for (const u of [t.adviser, t.lead, t.chair]) await endorseGate1b(as(u), t.milestone.id);
    expect((await statusOf(t.milestone.id)).status).toBe("COMMITTEE_ENDORSED");
    await setStatus(t.milestone.id, "DATE_PROPOSED");
    await transitionMilestone(as(t.coordinator), t.milestone.id, "RETURNED", { reason: "Form is missing.", purpose: "compliance" });
    // The manuscript is unlocked and the Ready mark is clear.
    const [pr] = await db.select().from(s.submissionPr).where(eq(s.submissionPr.id, t.pr.id));
    expect(pr!.lockedAt).toBeNull();
    expect(pr!.readyCommitId).toBeNull();
    // The Student marks Ready again, and the milestone comes back to the Gate 1b stage.
    await setReady(t.pr.id, t.commit.id);
    await setStatus(t.milestone.id, "COMMITTEE_APPOINTED");
    for (const u of [t.adviser, t.lead]) await expect(endorseGate1b(as(u), t.milestone.id)).resolves.toEqual({ completed: false });
    await expect(endorseGate1b(as(t.chair), t.milestone.id)).resolves.toEqual({ completed: true });
    expect((await statusOf(t.milestone.id)).status).toBe("COMMITTEE_ENDORSED");
  });

  it("refuses a second endorsement by the same person", async () => {
    const t = await atGate1b();
    await endorseGate1b(as(t.adviser), t.milestone.id);
    await expect(endorseGate1b(as(t.adviser), t.milestone.id)).rejects.toMatchObject({ code: "gate_done" });
  });

  it("refuses a member with an open thread (INV-21)", async () => {
    const t = await atGate1b();
    await openThread(t.commit.id, t.lead);
    await expect(endorseGate1b(as(t.lead), t.milestone.id)).rejects.toMatchObject({ code: "open_threads" });
  });

  it("refuses a Student, a Coordinator and a Panel Member with no seat", async () => {
    const t = await atGate1b();
    for (const u of [t.student, t.coordinator]) {
      await expect(endorseGate1b(as(u), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    }
    const outsider = await makeUser(db, "panel_member");
    await expect(endorseGate1b(as(outsider), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("refuses when the milestone is not at Gate 1b", async () => {
    const t = await setup();
    await setReady(t.pr.id, t.commit.id);
    await expect(endorseGate1b(as(t.adviser), t.milestone.id)).rejects.toBeInstanceOf(TransitionRefused);
  });

  it("refuses a Coordinator who sets COMMITTEE_ENDORSED directly", async () => {
    const t = await atGate1b();
    await expect(transitionMilestone(as(t.coordinator), t.milestone.id, "COMMITTEE_ENDORSED")).rejects.toBeInstanceOf(
      TransitionRefused,
    );
  });
});

describe("outside statuses (FR-WFL-10, BR-14, INV-27, AD-A-017)", () => {
  it("starts every status at its first value", async () => {
    const t = await setup();
    expect(await currentOutsideStatuses(db, t.milestone.id)).toEqual({
      ethics: "NOT_SUBMITTED",
      ipmo: "NOT_SUBMITTED",
      rpo: "NOT_SUBMITTED",
      copyright: "NOT_APPLIED",
    });
  });

  it("lets only the Coordinator set one, and the latest event wins", async () => {
    const t = await setup();
    await setOutsideStatus(as(t.coordinator), t.milestone.id, "ipmo", "UNDER_CHECK");
    await setOutsideStatus(as(t.coordinator), t.milestone.id, "ipmo", "PASSED");
    expect((await readOutsideStatuses(as(t.student), t.milestone.id)).ipmo).toBe("PASSED");
    await expect(setOutsideStatus(as(t.adviser), t.milestone.id, "ipmo", "FAILED")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(setOutsideStatus(as(t.student), t.milestone.id, "ipmo", "FAILED")).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("refuses a value that does not belong to the kind (INV-27)", async () => {
    const t = await setup();
    await expect(setOutsideStatus(as(t.coordinator), t.milestone.id, "ipmo", "DONE")).rejects.toThrow(/INV-27/);
    // The database check refuses it too.
    await expect(
      db.insert(s.outsideStatusEvent).values({
        milestoneInstanceId: t.milestone.id,
        kind: "rpo",
        value: "PASSED",
        setByUserId: t.coordinator.id,
      }),
    ).rejects.toThrow();
  });

  it("refuses a write by a user who is not a Coordinator in the database (INV-27)", async () => {
    const t = await setup();
    await expect(
      db.insert(s.outsideStatusEvent).values({
        milestoneInstanceId: t.milestone.id,
        kind: "ipmo",
        value: "PASSED",
        setByUserId: t.adviser.id,
      }),
    ).rejects.toThrow();
  });

  it("is append-only (INV-08)", async () => {
    const t = await setup();
    await setOutsideStatus(as(t.coordinator), t.milestone.id, "ethics", "UNDER_REVIEW");
    await expect(db.delete(s.outsideStatusEvent).where(eq(s.outsideStatusEvent.milestoneInstanceId, t.milestone.id))).rejects.toThrow();
  });

  it("blocks Milestone 2 Gate 1a until IPMO passed (INV-20, FR-WFL-03)", async () => {
    const t = await setup();
    const [preTpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "pre_final"));
    const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, preTpl!.id));
    const [m2] = await db
      .insert(s.milestoneInstance)
      .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "pre_final", status: "READY" })
      .returning();
    const [pr2] = await db.insert(s.submissionPr).values({ milestoneInstanceId: m2!.id }).returning();
    const [c2] = await db
      .insert(s.manuscriptCommit)
      .values({
        submissionPrId: pr2!.id,
        ordinal: 1,
        fileKey: `test/manuscript/${crypto.randomUUID()}.pdf`,
        sha256: "0".repeat(64),
        sizeBytes: 10,
        uploadedByUserId: t.student.id,
      })
      .returning();
    await setReady(pr2!.id, c2!.id);
    await expect(transitionMilestone(as(t.adviser), m2!.id, "ADVISER_ENDORSED")).rejects.toMatchObject({ code: "ipmo_not_passed" });
    await setOutsideStatus(as(t.coordinator), m2!.id, "ipmo", "PASSED");
    await expect(transitionMilestone(as(t.adviser), m2!.id, "ADVISER_ENDORSED")).resolves.toBe("ADVISER_ENDORSED");
  });
});

describe("approveGate2 (FR-WFL-07, BR-20, INV-22)", () => {
  it("refuses outside the Final milestone after close", async () => {
    const t = await setup();
    await expect(approveGate2(as(t.lead), t.milestone.id)).rejects.toBeInstanceOf(TransitionRefused);
    await expect(approveGate2(as(t.student), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
