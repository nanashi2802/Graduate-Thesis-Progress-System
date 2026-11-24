// Revision items from the Minutes (FR-REV-13, FR-WFL-06, INV-21, BR-05, BR-11, AD-A-026). Server only.
// Proposal and Pre-Final only. At the Final the threads are the tracker (FR-REV-12).
// The Coordinator enters the items. The Student links each one to a commit. The Adviser and each accepted
// Panel Member accept each item. Accepted items drive the Certification (Milestone 1) and the Gate 1b check of Milestone 3.
import "server-only";
import { and, asc, eq, inArray, max } from "drizzle-orm";
import { resultsVisible } from "@/server/domain/evaluation";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import { appLink } from "@/server/notify/link";
import { emitSafely } from "./recipients";
import { expectedEvaluatorsFor, loadMilestoneContext, type MilestoneContext } from "./milestone-facts";
import {
  defenseAttempt,
  evaluationEntry,
  manuscriptCommit,
  revisionAcceptance,
  revisionItem,
  submissionPr,
} from "./schema";
import { requireManuscriptRead, requireThesisRead } from "./scope";

export const MAX_ITEMS = 50;

async function loadAttempt(ctx: DataContext, attemptId: string) {
  requireActive(ctx.actor);
  const [attempt] = await ctx.db.select().from(defenseAttempt).where(eq(defenseAttempt.id, attemptId));
  if (!attempt) throw new InputProblem("This defense attempt does not exist.");
  const mctx = await loadMilestoneContext(ctx.db, attempt.milestoneInstanceId);
  if (!mctx) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, mctx.thesis.id);
  return { attempt, mctx };
}

function requireRevisionMilestone(mctx: MilestoneContext): void {
  if (mctx.code === "final") throw new InputProblem("The Final Defense uses no revision items. Its threads are the tracker.");
}

/**
 * FR-REV-13: the Coordinator enters the recommendations of the Minutes as revision items, after the defense is held
 * with the verdict Approved with Revisions. The items get the next ordinals.
 */
export async function addRevisionItems(ctx: DataContext, attemptId: string, bodies: string[]): Promise<{ count: number }> {
  requireCoordinator(ctx, "enters revision items");
  const { attempt, mctx } = await loadAttempt(ctx, attemptId);
  requireRevisionMilestone(mctx);
  const texts = bodies.map((b) => b.trim()).filter(Boolean);
  if (texts.length === 0) throw new InputProblem("Enter at least one revision item.");
  if (attempt.status !== "held" && attempt.status !== "closed") throw new InputProblem("Revision items follow a held defense.");
  if (attempt.verdict !== "approved_with_revisions") throw new InputProblem("Revision items are for the verdict Approved with Revisions.");
  const added = await ctx.db.transaction(async (tx) => {
    const [last] = await tx.select({ n: max(revisionItem.ordinal) }).from(revisionItem).where(eq(revisionItem.defenseAttemptId, attemptId));
    const start = last?.n ?? 0;
    if (start + texts.length > MAX_ITEMS) throw new InputProblem(`A defense has ${MAX_ITEMS} revision items at most.`);
    await tx.insert(revisionItem).values(texts.map((body, i) => ({ defenseAttemptId: attemptId, ordinal: start + i + 1, body })));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "revision.add", targetTable: "defense_attempt", targetId: attemptId, detail: { count: texts.length } });
    return { count: texts.length };
  });
  // B4 (FR-NTF-01): after the commit. Never throws (INV-30).
  await emitSafely(ctx, "B4", { thesisId: mctx.thesis.id, milestone: mctx.code }, { link: appLink("/login"), targetTable: "defense_attempt", targetId: attemptId });
  return added;
}

async function loadItem(ctx: DataContext, itemId: string) {
  requireActive(ctx.actor);
  const [item] = await ctx.db.select().from(revisionItem).where(eq(revisionItem.id, itemId));
  if (!item) throw new InputProblem("This revision item does not exist.");
  const { attempt, mctx } = await loadAttempt(ctx, item.defenseAttemptId);
  return { item, attempt, mctx };
}

/** FR-REV-13: the Student links an item to the commit that answers it. The commit is on the manuscript of the same milestone. */
export async function linkRevisionToCommit(ctx: DataContext, itemId: string, commitId: string): Promise<void> {
  const { item, mctx } = await loadItem(ctx, itemId);
  if (ctx.actor.role !== "student") throw new AccessDeniedError("only the Student links an item to a commit");
  const [commit] = await ctx.db
    .select({ id: manuscriptCommit.id })
    .from(manuscriptCommit)
    .innerJoin(submissionPr, eq(submissionPr.id, manuscriptCommit.submissionPrId))
    .where(and(eq(manuscriptCommit.id, commitId), eq(submissionPr.milestoneInstanceId, mctx.milestone.id)));
  if (!commit) throw new InputProblem("This commit is not on your manuscript of this milestone.");
  await ctx.db.transaction(async (tx) => {
    // An accepted item no longer changes: the acceptance covered the linked commit.
    const accepted = await tx.select({ id: revisionAcceptance.revisionItemId }).from(revisionAcceptance).where(eq(revisionAcceptance.revisionItemId, item.id));
    if (accepted.length > 0) throw new InputProblem("A member accepted this item. It cannot change.");
    await tx.update(revisionItem).set({ linkedCommitId: commitId }).where(eq(revisionItem.id, item.id));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "revision.link", targetTable: "revision_item", targetId: item.id });
  });
  await emitSafely(ctx, "B4", { thesisId: mctx.thesis.id, milestone: mctx.code }, { link: appLink("/login"), targetTable: "revision_item", targetId: item.id });
}

// The Adviser and each accepted Panel Member of the committee accept items (the `endorsers` of the milestone facts).
async function requireEndorser(ctx: DataContext, mctx: MilestoneContext): Promise<void> {
  const { role, userId } = ctx.actor;
  if (role === "adviser" && mctx.thesis.adviserUserId === userId) return;
  if (role === "panel_member" && mctx.memberIds.includes(userId)) {
    await requireManuscriptRead(ctx, mctx.thesis.id);
    return;
  }
  throw new AccessDeniedError("only the Adviser and the committee accept revision items");
}

/**
 * FR-REV-13: a member marks an item accepted. The item needs a linked commit first (the Student answers it).
 * Each member accepts for themselves, once (BR-05).
 */
export async function acceptRevision(ctx: DataContext, itemId: string): Promise<void> {
  const { item, mctx } = await loadItem(ctx, itemId);
  await requireEndorser(ctx, mctx);
  if (!item.linkedCommitId) throw new InputProblem("The Student has not linked a commit to this item yet.");
  await ctx.db.transaction(async (tx) => {
    const [found] = await tx
      .select({ id: revisionAcceptance.revisionItemId })
      .from(revisionAcceptance)
      .where(and(eq(revisionAcceptance.revisionItemId, item.id), eq(revisionAcceptance.memberUserId, ctx.actor.userId)));
    if (found) throw new InputProblem("You accepted this item already.");
    await tx.insert(revisionAcceptance).values({ revisionItemId: item.id, memberUserId: ctx.actor.userId });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "revision.accept", targetTable: "revision_item", targetId: item.id });
  });
}

export type RevisionView = {
  id: string;
  ordinal: number;
  body: string;
  linkedCommitOrdinal: number | null;
  acceptedByUserIds: string[];
  /** Every Adviser and committee member accepted the item. */
  allAccepted: boolean;
  /** This user accepted it, or null when this user does not accept items. */
  mine: boolean | null;
};

/**
 * The revision items of one attempt. A Student sees them when every expected sheet is verified, like the
 * Minutes they come from (BR-11). The Coordinator, the Adviser and the committee see them at once.
 */
export async function listRevisionItems(ctx: DataContext, attemptId: string): Promise<RevisionView[]> {
  const { attempt, mctx } = await loadAttempt(ctx, attemptId);
  if (mctx.code === "final") return [];
  if (ctx.actor.role === "student") {
    const sheets = await ctx.db.select().from(evaluationEntry).where(eq(evaluationEntry.defenseAttemptId, attempt.id));
    if (!resultsVisible(await expectedEvaluatorsFor(ctx.db, mctx, attempt.id), sheets)) return [];
  }
  if (ctx.actor.role === "panel_member") await requireManuscriptRead(ctx, mctx.thesis.id);
  const items = await ctx.db.select().from(revisionItem).where(eq(revisionItem.defenseAttemptId, attemptId)).orderBy(asc(revisionItem.ordinal));
  if (items.length === 0) return [];
  const accepts = await ctx.db.select().from(revisionAcceptance).where(inArray(revisionAcceptance.revisionItemId, items.map((i) => i.id)));
  const commits = await ctx.db.select({ id: manuscriptCommit.id, ordinal: manuscriptCommit.ordinal }).from(manuscriptCommit).where(inArray(manuscriptCommit.id, items.flatMap((i) => (i.linkedCommitId ? [i.linkedCommitId] : []))));
  const endorsers = [mctx.thesis.adviserUserId, ...mctx.memberIds];
  const canAccept = ctx.actor.role === "adviser" || (ctx.actor.role === "panel_member" && mctx.memberIds.includes(ctx.actor.userId));
  return items.map((i) => {
    const by = accepts.filter((a) => a.revisionItemId === i.id).map((a) => a.memberUserId);
    return {
      id: i.id,
      ordinal: i.ordinal,
      body: i.body,
      linkedCommitOrdinal: commits.find((c) => c.id === i.linkedCommitId)?.ordinal ?? null,
      acceptedByUserIds: by,
      allAccepted: endorsers.every((u) => by.includes(u)),
      mine: canAccept ? by.includes(ctx.actor.userId) : null,
    };
  });
}
