// Milestone status changes and gate actions (ERD §7.1, FR-WFL-02 to 09, BR-02, BR-13, BR-07, INV-12 to INV-22).
// The pure rules are in src/server/domain/milestone.ts and gates.ts. This file loads the facts,
// asks the rules, writes the change and the audit row in one transaction. Server only.
import "server-only";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import {
  checkGate1b,
  checkGate2,
  checkReturn,
  type GateBlockCode,
  type ReturnPurpose,
} from "@/server/domain/gates";
import {
  decideTransition,
  type BlockCode,
  type Decision,
  type MilestoneStatus,
  type TransitionActor,
} from "@/server/domain/milestone";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { emitSafely } from "./recipients";
import { appLink } from "@/server/notify/link";
import { InputProblem } from "./coordinator";
import { lastReturnGateId, loadMilestoneContext, loadMilestoneFacts, type MilestoneContext } from "./milestone-facts";
import {
  committee,
  committeeMember,
  critiqueThread,
  defenseAttempt,
  gateAction,
  manuscriptCommit,
  milestoneInstance,
  revisionAcceptance,
  revisionItem,
  submissionPr,
  type GateKindValue,
  type GateResultValue,
} from "./schema";
import { requireThesisRead } from "./scope";
import { latestVersionId } from "./templates";

// A refused change. The screen shows `message` as it is (BR-18).
export class TransitionRefused extends InputProblem {
  constructor(
    reason: string,
    readonly code: BlockCode | GateBlockCode | "gate_done" | "wrong_status",
  ) {
    super(reason);
    this.name = "TransitionRefused";
  }
}

type Tx = DataContext["db"];

async function loadAllowed(ctx: DataContext, milestoneId: string): Promise<MilestoneContext> {
  requireActive(ctx.actor);
  const mctx = await loadMilestoneContext(ctx.db, milestoneId);
  if (!mctx) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, mctx.thesis.id);
  return mctx;
}

// The role of the actor in the rule table. A Panel Member needs an accepted seat (BR-08).
async function transitionActor(ctx: DataContext, mctx: MilestoneContext): Promise<TransitionActor> {
  const { role, userId } = ctx.actor;
  if (role !== "panel_member") return { kind: role };
  if (!mctx.memberIds.includes(userId) || !mctx.committeeId) {
    // A substitute can read the thesis but holds no seat on this committee (FR-DEF-12).
    return { kind: "panel_member", designation: "none" };
  }
  const [seat] = await ctx.db
    .select({ designation: committeeMember.designation })
    .from(committeeMember)
    .where(and(eq(committeeMember.committeeId, mctx.committeeId), eq(committeeMember.memberUserId, userId)));
  return { kind: "panel_member", designation: seat?.designation ?? "none" };
}

// Threads that this user opened on the commits of the PR and has not resolved (INV-20 to INV-22).
async function ownOpenThreads(db: Tx, prId: string | undefined, userId: string): Promise<number> {
  if (!prId) return 0;
  const rows = await db
    .select({ id: critiqueThread.id })
    .from(critiqueThread)
    .innerJoin(manuscriptCommit, eq(manuscriptCommit.id, critiqueThread.commitId))
    .where(
      and(eq(manuscriptCommit.submissionPrId, prId), eq(critiqueThread.authorUserId, userId), eq(critiqueThread.state, "OPEN")),
    );
  return rows.length;
}

// INV-21: in Milestone 3 the member accepted every Pre-Final revision item.
// A Final Panel member with no seat on the Evaluation Committee could not accept them, so the rule skips that member (AD-A-031).
async function acceptedPreFinalItems(db: Tx, thesisId: string, userId: string, role: string): Promise<boolean> {
  if (role === "panel_member") {
    const seat = await db
      .select({ id: committeeMember.id })
      .from(committeeMember)
      .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
      .where(and(eq(committee.thesisInstanceId, thesisId), eq(committee.kind, "evaluation_committee"), eq(committeeMember.status, "accepted"), eq(committeeMember.memberUserId, userId)));
    if (seat.length === 0) return true;
  }
  const [pre] = await db
    .select({ id: milestoneInstance.id })
    .from(milestoneInstance)
    .where(and(eq(milestoneInstance.thesisInstanceId, thesisId), eq(milestoneInstance.milestoneCode, "pre_final")));
  if (!pre) return true;
  const attempts = await db.select({ id: defenseAttempt.id }).from(defenseAttempt).where(eq(defenseAttempt.milestoneInstanceId, pre.id));
  if (attempts.length === 0) return true;
  const items = await db
    .select({ id: revisionItem.id })
    .from(revisionItem)
    .where(inArray(revisionItem.defenseAttemptId, attempts.map((a) => a.id)));
  if (items.length === 0) return true;
  const accepted = await db
    .select({ itemId: revisionAcceptance.revisionItemId })
    .from(revisionAcceptance)
    .where(and(inArray(revisionAcceptance.revisionItemId, items.map((i) => i.id)), eq(revisionAcceptance.memberUserId, userId)));
  return items.every((i) => accepted.some((a) => a.itemId === i.id));
}

// Read only. The screen uses it to show a disabled action with its reason (BR-18).
export async function checkTransition(
  ctx: DataContext,
  milestoneId: string,
  to: MilestoneStatus,
  input: { reason?: string | null } = {},
): Promise<Decision> {
  const mctx = await loadAllowed(ctx, milestoneId);
  const actor = await transitionActor(ctx, mctx);
  const facts = await loadMilestoneFacts(ctx.db, mctx);
  facts.returnReason = input.reason ?? null;
  return decideTransition(mctx.code, mctx.milestone.status, to, actor, facts);
}

// Which gate row a status change leaves (ERD §7.1: "each change writes one gate_action or audit_record").
const GATE_FOR: Partial<Record<MilestoneStatus, { gate: GateKindValue; result: GateResultValue }>> = {
  ADVISER_ENDORSED: { gate: "gate_1a", result: "endorsed" },
  DEFENSE_SCHEDULED: { gate: "date_confirmation", result: "recorded" },
  CLOSED: { gate: "stage_close", result: "recorded" },
  CERTIFIED: { gate: "certification", result: "recorded" },
  FINAL_APPROVED: { gate: "stage_close", result: "recorded" },
  CLEARED: { gate: "clearance_close", result: "recorded" },
};

async function applyStatus(
  tx: Tx,
  ctx: DataContext,
  mctx: MilestoneContext,
  to: MilestoneStatus,
  extra: { returnReason?: string | null } = {},
): Promise<void> {
  const from = mctx.milestone.status;
  // The status guard stops two requests from both moving the same milestone.
  const changed = await tx
    .update(milestoneInstance)
    .set({ status: to, ...(extra.returnReason !== undefined ? { returnReason: extra.returnReason } : {}) })
    .where(and(eq(milestoneInstance.id, mctx.milestone.id), eq(milestoneInstance.status, from)))
    .returning({ id: milestoneInstance.id });
  if (changed.length === 0) throw new TransitionRefused("The milestone changed. Reload the page.", "wrong_status");
  // BR-07: the manuscript locks at Gate 1b and unlocks when the defense closes.
  if (mctx.pr && to === "COMMITTEE_ENDORSED") {
    await tx.update(submissionPr).set({ lockedAt: new Date() }).where(eq(submissionPr.id, mctx.pr.id));
  }
  if (mctx.pr && to === "CLOSED") {
    await tx.update(submissionPr).set({ lockedAt: null }).where(eq(submissionPr.id, mctx.pr.id));
  }
}

// One status change by one actor (a gate with one actor, a Return, or a Coordinator step).
// Gate 1b has many actors: use `endorseGate1b`.
export async function transitionMilestone(
  ctx: DataContext,
  milestoneId: string,
  to: MilestoneStatus,
  input: { reason?: string | null; purpose?: ReturnPurpose | null } = {},
): Promise<MilestoneStatus> {
  const mctx = await loadAllowed(ctx, milestoneId);
  if (to === "COMMITTEE_ENDORSED") throw new TransitionRefused("Endorse the commit at Gate 1b.", "not_allowed");
  const actor = await transitionActor(ctx, mctx);
  const facts = await loadMilestoneFacts(ctx.db, mctx);
  const from = mctx.milestone.status;
  const reason = input.reason?.trim() || null;
  facts.returnReason = reason;

  if (to === "RETURNED") {
    // INV-19, BR-13: a reason, and a Coordinator Return only for compliance or eligibility.
    const gate = checkReturn({ role: ctx.actor.role, reason, purpose: input.purpose ?? null });
    if (!gate.ok) throw new TransitionRefused(gate.reason, gate.code);
  }
  const decision = decideTransition(mctx.code, from, to, actor, facts);
  if (!decision.ok) throw new TransitionRefused(decision.reason, decision.code);

  await ctx.db.transaction(async (tx) => {
    const txCtx = { db: tx, actor: ctx.actor };
    if (to === "RETURNED") {
      await applyStatus(tx, ctx, mctx, "RETURNED", { returnReason: reason });
      await tx.insert(gateAction).values({
        milestoneInstanceId: milestoneId,
        gate: from === "READY" ? "gate_1a" : "date_confirmation",
        result: "returned",
        actorUserId: ctx.actor.userId,
        actorRole: ctx.actor.role,
        commitId: mctx.pr?.readyCommitId ?? null,
        reason,
      });
      // BR-13: a Return starts a new round. The manuscript unlocks and the Ready mark clears, so the
      // Student can upload and mark Ready again, and Gate 1b starts from zero (AD-A-018).
      if (mctx.pr) {
        await tx.update(submissionPr).set({ lockedAt: null, readyCommitId: null }).where(eq(submissionPr.id, mctx.pr.id));
      }
      // INV-18: the status goes back to DRAFT at once. The reason stays for the Student.
      await applyStatus(tx, ctx, { ...mctx, milestone: { ...mctx.milestone, status: "RETURNED" } }, "DRAFT");
      await recordAudit(txCtx, {
        action: "milestone.return",
        targetTable: "milestone_instance",
        targetId: milestoneId,
        detail: { from, purpose: input.purpose ?? null },
      });
      return;
    }
    await applyStatus(tx, ctx, mctx, to);
    const gate = GATE_FOR[to];
    if (gate) {
      await tx.insert(gateAction).values({
        milestoneInstanceId: milestoneId,
        gate: gate.gate,
        result: gate.result,
        actorUserId: ctx.actor.userId,
        actorRole: ctx.actor.role,
        commitId: gate.gate === "gate_1a" ? (mctx.pr?.readyCommitId ?? null) : null,
      });
    }
    await recordAudit(txCtx, {
      action: "milestone.status",
      targetTable: "milestone_instance",
      targetId: milestoneId,
      detail: { from, to },
    });
  });
  // After the commit (INV-30). A3: a date request that came back; A2 comes from `confirmDefenseDate`.
  // C6 (FR-NTF-01): Gate 1a and Gate 2 only. Gate 1b is in `endorseGate1b`. The callers of this function that hold a
  // transaction never reach these statuses, so no notice is written before an outer commit.
  const scope = { thesisId: mctx.thesis.id, milestone: mctx.code, userIds: mctx.memberIds };
  const at = { link: appLink("/login"), targetTable: "milestone_instance", targetId: milestoneId };
  if (to === "RETURNED" && from === "DATE_PROPOSED") await emitSafely(ctx, "A3", scope, at);
  else if (to === "ADVISER_ENDORSED" || to === "FINAL_APPROVED") await emitSafely(ctx, "C6", scope, at);
  return to === "RETURNED" ? "DRAFT" : to;
}

// FR-WFL-09: a Disapproved verdict sends the milestone from DEFENSE_HELD back to DRAFT. The system makes the
// step, in the transaction of the action that held the defense. Like a Return, it unlocks the manuscript,
// clears the Ready mark and starts a new Gate 1b round (AD-A-018, AD-A-021). The reason stays for the Student.
export async function disapproveToDraft(ctx: DataContext, milestoneId: string): Promise<void> {
  const mctx = await loadAllowed(ctx, milestoneId);
  const facts = await loadMilestoneFacts(ctx.db, mctx);
  const decision = decideTransition(mctx.code, mctx.milestone.status, "DRAFT", { kind: "system" }, facts);
  if (!decision.ok) throw new TransitionRefused(decision.reason, decision.code);
  const reason = "Disapproved at the defense.";
  await ctx.db.transaction(async (tx) => {
    await applyStatus(tx, ctx, mctx, "DRAFT", { returnReason: reason });
    await tx.insert(gateAction).values({
      milestoneInstanceId: milestoneId,
      gate: "stage_close",
      result: "returned",
      actorUserId: ctx.actor.userId,
      actorRole: ctx.actor.role,
      commitId: mctx.pr?.readyCommitId ?? null,
      reason,
    });
    if (mctx.pr) await tx.update(submissionPr).set({ lockedAt: null, readyCommitId: null }).where(eq(submissionPr.id, mctx.pr.id));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "milestone.status",
      targetTable: "milestone_instance",
      targetId: milestoneId,
      detail: { from: "DEFENSE_HELD", to: "DRAFT" },
    });
  });
}

// FR-WFL-01: Milestone 2 opens when Milestone 1 is CERTIFIED and the Adviser approved data gathering. Milestone 3 opens
// when Milestone 2 is CLOSED. The new milestone uses the newest template version (FR-TPL-04). It is DRAFT. Safe to repeat.
export async function openMilestone(ctx: DataContext, thesisId: string, code: "pre_final" | "final"): Promise<void> {
  requireActive(ctx.actor);
  const versionId = await latestVersionId(ctx.db, code);
  const made = await ctx.db
    .insert(milestoneInstance)
    .values({ thesisInstanceId: thesisId, templateVersionId: versionId, milestoneCode: code })
    .onConflictDoNothing()
    .returning({ id: milestoneInstance.id });
  if (made.length > 0) {
    await recordAudit(ctx, { action: "milestone.open", targetTable: "milestone_instance", targetId: made[0]!.id, detail: { code } });
  }
}

const GATE_1B_FROM: MilestoneStatus[] = ["COMMITTEE_APPOINTED", "ADVISER_ENDORSED"];

// The checks before a Gate 1b endorsement. They throw, so the screen and `endorseGate1b` share one rule (BR-18).
async function gate1bChecks(ctx: DataContext, mctx: MilestoneContext): Promise<{ commitId: string; from: MilestoneStatus }> {
  const { role, userId } = ctx.actor;
  const isMember = role === "panel_member" && mctx.memberIds.includes(userId);
  if (role !== "adviser" && !isMember) throw new AccessDeniedError("only the Adviser or an accepted Panel Member endorses");
  const from = mctx.milestone.status;
  // Milestone 2 has no new appointment: its Gate 1b starts from ADVISER_ENDORSED (ERD §7.1).
  const expected: MilestoneStatus = mctx.code === "pre_final" ? "ADVISER_ENDORSED" : "COMMITTEE_APPOINTED";
  if (from !== expected || !GATE_1B_FROM.includes(from)) {
    throw new TransitionRefused("Gate 1b is not open for this milestone.", "wrong_status");
  }
  const commitId = mctx.pr?.readyCommitId;
  if (!commitId) throw new TransitionRefused("Upload a commit first.", "no_ready_commit");
  const gate = checkGate1b({
    milestone: mctx.code,
    ownOpenThreads: await ownOpenThreads(ctx.db, mctx.pr?.id, userId),
    preFinalRevisionsAccepted: mctx.code === "final" ? await acceptedPreFinalItems(ctx.db, mctx.thesis.id, userId, ctx.actor.role) : true,
  });
  if (!gate.ok) throw new TransitionRefused(gate.reason, gate.code);
  return { commitId, from };
}

// Read only. The reason why this user cannot endorse at Gate 1b now, or null when they can (BR-18).
export async function gate1bBlock(ctx: DataContext, milestoneId: string): Promise<string | null> {
  const mctx = await loadAllowed(ctx, milestoneId);
  try {
    const { commitId } = await gate1bChecks(ctx, mctx);
    const sinceReturn = await lastReturnGateId(ctx.db, milestoneId);
    const [own] = await ctx.db
      .select({ id: gateAction.id })
      .from(gateAction)
      .where(
        and(
          eq(gateAction.milestoneInstanceId, milestoneId),
          eq(gateAction.gate, "gate_1b"),
          eq(gateAction.actorUserId, ctx.actor.userId),
          eq(gateAction.commitId, commitId),
          gt(gateAction.id, sinceReturn),
        ),
      );
    return own ? "You already endorsed this commit." : null;
  } catch (e) {
    if (e instanceof TransitionRefused || e instanceof AccessDeniedError) return e.message;
    throw e;
  }
}

// Read only. True when this user's Gate 1b endorsement is the last one, so it locks the manuscript (BR-07, INV-21).
// The same rule as `gate1bComplete`: the Adviser and every accepted member endorse the Ready commit. The endorse
// dialog uses it to name the real effect (R3.10, UX-010).
export async function gate1bLocksOnEndorse(ctx: DataContext, milestoneId: string): Promise<boolean> {
  const mctx = await loadAllowed(ctx, milestoneId);
  const commitId = mctx.pr?.readyCommitId;
  if (!commitId || mctx.memberIds.length === 0) return false;
  const sinceReturn = await lastReturnGateId(ctx.db, milestoneId);
  const rows = await ctx.db
    .select({ actor: gateAction.actorUserId })
    .from(gateAction)
    .where(
      and(
        eq(gateAction.milestoneInstanceId, milestoneId),
        eq(gateAction.gate, "gate_1b"),
        eq(gateAction.result, "endorsed"),
        eq(gateAction.commitId, commitId),
        gt(gateAction.id, sinceReturn),
      ),
    );
  const endorsers = [mctx.thesis.adviserUserId, ...mctx.memberIds];
  if (!endorsers.includes(ctx.actor.userId)) return false;
  return endorsers.filter((id) => id !== ctx.actor.userId).every((id) => rows.some((r) => r.actor === id));
}

// Gate 1b: the Adviser or one accepted Panel Member endorses the Ready commit (FR-WFL-04, INV-21).
// The last endorsement moves the milestone to COMMITTEE_ENDORSED and locks the manuscript (BR-07).
export async function endorseGate1b(ctx: DataContext, milestoneId: string): Promise<{ completed: boolean }> {
  const mctx = await loadAllowed(ctx, milestoneId);
  const { role, userId } = ctx.actor;
  const { commitId, from } = await gate1bChecks(ctx, mctx);

  const result = await ctx.db.transaction(async (tx) => {
    const txCtx = { db: tx, actor: ctx.actor };
    const sinceReturn = await lastReturnGateId(tx, milestoneId);
    const own = await tx
      .select({ id: gateAction.id })
      .from(gateAction)
      .where(
        and(
          eq(gateAction.milestoneInstanceId, milestoneId),
          eq(gateAction.gate, "gate_1b"),
          eq(gateAction.actorUserId, userId),
          eq(gateAction.commitId, commitId),
          gt(gateAction.id, sinceReturn),
        ),
      );
    if (own.length > 0) throw new TransitionRefused("You already endorsed this commit.", "gate_done");
    await tx.insert(gateAction).values({
      milestoneInstanceId: milestoneId,
      gate: "gate_1b",
      result: "endorsed",
      actorUserId: userId,
      actorRole: role,
      commitId,
    });
    await recordAudit(txCtx, { action: "gate_1b.endorse", targetTable: "milestone_instance", targetId: milestoneId });
    const facts = await loadMilestoneFacts(tx, mctx);
    if (!facts.gate1bComplete) return { completed: false };
    const actor = await transitionActor(txCtx, mctx);
    const decision = decideTransition(mctx.code, from, "COMMITTEE_ENDORSED", actor, facts);
    if (!decision.ok) throw new TransitionRefused(decision.reason, decision.code);
    await applyStatus(tx, ctx, mctx, "COMMITTEE_ENDORSED");
    await recordAudit(txCtx, {
      action: "milestone.status",
      targetTable: "milestone_instance",
      targetId: milestoneId,
      detail: { from, to: "COMMITTEE_ENDORSED" },
    });
    return { completed: true };
  });
  if (result.completed) await emitSafely(ctx, "C6", { thesisId: mctx.thesis.id, milestone: mctx.code }, { link: appLink("/login"), targetTable: "milestone_instance", targetId: milestoneId });
  return result;
}

// The checks before a Gate 2 approval. They throw, so the screen and `approveGate2` share one rule (BR-18).
async function gate2Checks(ctx: DataContext, mctx: MilestoneContext): Promise<void> {
  const { role, userId } = ctx.actor;
  if (role !== "panel_member" || !mctx.memberIds.includes(userId)) {
    throw new AccessDeniedError("only a Final Panel member approves at Gate 2");
  }
  if (mctx.code !== "final" || mctx.milestone.status !== "CLOSED") {
    throw new TransitionRefused("Gate 2 opens after the Final defense closes.", "wrong_status");
  }
  const facts = await loadMilestoneFacts(ctx.db, mctx);
  const gate = checkGate2({
    ownOpenThreads: await ownOpenThreads(ctx.db, mctx.pr?.id, userId),
    ipmo: facts.ipmo,
    rpo: facts.rpo,
  });
  if (!gate.ok) throw new TransitionRefused(gate.reason, gate.code);
}

const hasApproved = async (db: Tx, milestoneId: string, userId: string) =>
  (
    await db
      .select({ id: gateAction.id })
      .from(gateAction)
      .where(and(eq(gateAction.milestoneInstanceId, milestoneId), eq(gateAction.gate, "gate_2"), eq(gateAction.actorUserId, userId)))
  ).length > 0;

// Read only. The reason why this user cannot approve at Gate 2 now, or null when they can (BR-18).
export async function gate2Block(ctx: DataContext, milestoneId: string): Promise<string | null> {
  const mctx = await loadAllowed(ctx, milestoneId);
  try {
    await gate2Checks(ctx, mctx);
    return (await hasApproved(ctx.db, milestoneId, ctx.actor.userId)) ? "You already approved the final manuscript." : null;
  } catch (e) {
    if (e instanceof TransitionRefused || e instanceof AccessDeniedError) return e.message;
    throw e;
  }
}

// Gate 2: one Final Panel member marks the final manuscript approved (FR-WFL-07, BR-20, INV-22).
// The row names the newest commit, the version that the member approves and that the signed paper must match (INV-34).
// The Coordinator then moves the milestone to FINAL_APPROVED with `transitionMilestone`.
export async function approveGate2(ctx: DataContext, milestoneId: string): Promise<void> {
  const mctx = await loadAllowed(ctx, milestoneId);
  const { role, userId } = ctx.actor;
  await gate2Checks(ctx, mctx);
  await ctx.db.transaction(async (tx) => {
    if (await hasApproved(tx, milestoneId, userId)) throw new TransitionRefused("You already approved the final manuscript.", "gate_done");
    const [newest] = mctx.pr
      ? await tx.select({ id: manuscriptCommit.id }).from(manuscriptCommit).where(eq(manuscriptCommit.submissionPrId, mctx.pr.id)).orderBy(desc(manuscriptCommit.ordinal)).limit(1)
      : [];
    await tx.insert(gateAction).values({
      milestoneInstanceId: milestoneId,
      gate: "gate_2",
      result: "approved",
      actorUserId: userId,
      actorRole: role,
      commitId: newest?.id ?? null,
    });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "gate_2.approve", targetTable: "milestone_instance", targetId: milestoneId });
  });
}
