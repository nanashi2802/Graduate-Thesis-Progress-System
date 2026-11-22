// Certification and data gathering of Milestone 1 (FR-WFL-06, FR-WFL-11, BR-02, INV-17, INV-34, AD-A-022). Server only.
// The change CLOSED to CERTIFIED is `transitionMilestone` (the Coordinator, with every revision item accepted and
// the CERTIFICATION document verified). This file holds the step after it: the Adviser approves data gathering.
import "server-only";
import { and, eq } from "drizzle-orm";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem } from "./coordinator";
import { gateAction, milestoneInstance, submissionPr } from "./schema";
import { requireThesisRead } from "./scope";

/** FR-WFL-11: after Milestone 1 is CERTIFIED, the Adviser of the thesis approves the start of data gathering. Once only. */
export async function approveDataGathering(ctx: DataContext, milestoneId: string, now: Date = new Date()): Promise<void> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "adviser") throw new AccessDeniedError("only the Adviser approves data gathering");
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, m.thesisInstanceId);
  if (m.milestoneCode !== "proposal") throw new InputProblem("Data gathering follows the Proposal Defense.");
  if (m.status !== "CERTIFIED") throw new InputProblem("The Coordinator records the Certification first.");
  if (m.dataGatheringApprovedAt) throw new InputProblem("Data gathering is approved already.");
  await ctx.db.transaction(async (tx) => {
    // The status guard stops two requests from both approving.
    const set = await tx
      .update(milestoneInstance)
      .set({ dataGatheringApprovedAt: now })
      .where(and(eq(milestoneInstance.id, milestoneId), eq(milestoneInstance.status, "CERTIFIED")))
      .returning({ id: milestoneInstance.id });
    if (set.length === 0) throw new InputProblem("The milestone changed. Reload the page.");
    const [pr] = await tx.select({ ready: submissionPr.readyCommitId }).from(submissionPr).where(eq(submissionPr.milestoneInstanceId, milestoneId));
    await tx.insert(gateAction).values({
      milestoneInstanceId: milestoneId,
      gate: "data_gathering",
      result: "approved",
      actorUserId: ctx.actor.userId,
      actorRole: ctx.actor.role,
      commitId: pr?.ready ?? null,
    });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "data_gathering.approve", targetTable: "milestone_instance", targetId: milestoneId });
  });
}

/** True when the Adviser approved data gathering for this milestone (FR-WFL-11). */
export async function dataGatheringApproved(ctx: DataContext, milestoneId: string): Promise<boolean> {
  requireActive(ctx.actor);
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, m.thesisInstanceId);
  return m.dataGatheringApprovedAt !== null;
}
