// The shared read-only submission view (SV): one Milestone Instance after Gate 1b.
// FR-SUB-01 to FR-SUB-04, BR-08, BR-18, NFR-01. Server only. The view holds no gate or edit action.
import "server-only";
import { desc, eq, inArray, or, type SQL } from "drizzle-orm";
import type { MilestoneCode, MilestoneStatus } from "@/server/domain/milestone";
import { requireActive, type DataContext } from "./access";
import { InputProblem } from "./coordinator";
import { listAttempts } from "./defense";
import { deliverables, type Deliverable } from "./documents";
import { listThreads } from "./manuscript";
import { documentComment, documentFile, documentRecord, gateAction, manuscriptCommit, milestoneInstance, submissionPr } from "./schema";
import { requireManuscriptRead, requireThesisRead } from "./scope";

export type SubmissionView =
  | { open: false; reason: string; milestone: MilestoneCode }
  | {
      open: true;
      milestone: MilestoneCode;
      status: MilestoneStatus;
      /** The Submission PR: the link target of the user's own workspace (FR-SUB-04). */
      prId: string | null;
      /** The commit that Gate 1b locked. Read it with `commitReadLink`. */
      lockedCommit: { id: string; ordinal: number } | null;
      gates: { gate: string; result: string; at: Date }[];
      checklist: Deliverable[];
      defense: { scheduledStartAt: Date | null; roomOrLink: string | null } | null;
      threads: { open: number; resolved: number };
      documentComments: number;
      /** Null until the stage closes (FR-SUB-03). */
      minutes: { body: string; issuedAt: Date } | null;
    };

// Gate 1b is passed when the last member endorses. A Return sends the milestone back to DRAFT and closes the view.
const BEFORE_GATE_1B = new Set<string>(["DRAFT", "READY", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED"]);
const CLOSED = new Set<string>(["CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED"]);

export async function submissionView(ctx: DataContext, milestoneId: string): Promise<SubmissionView> {
  requireActive(ctx.actor);
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, m.thesisInstanceId); // FR-SUB-02: the Student, the Adviser, the members and the Coordinator
  if (ctx.actor.role === "panel_member") await requireManuscriptRead(ctx, m.thesisInstanceId); // BR-08

  const gates = await ctx.db
    .select()
    .from(gateAction)
    .where(eq(gateAction.milestoneInstanceId, milestoneId))
    .orderBy(desc(gateAction.id));
  const gate1b = gates.find((g) => g.gate === "gate_1b" && g.result === "endorsed");
  if (!gate1b || BEFORE_GATE_1B.has(m.status)) return { open: false, reason: "The view opens when Gate 1b is passed.", milestone: m.milestoneCode };

  const [pr] = await ctx.db.select().from(submissionPr).where(eq(submissionPr.milestoneInstanceId, milestoneId));
  const commits = pr ? await ctx.db.select().from(manuscriptCommit).where(eq(manuscriptCommit.submissionPrId, pr.id)) : [];
  const locked = commits.find((c) => c.id === gate1b.commitId);
  const threads = await listThreads(ctx, milestoneId);
  const files = await ctx.db
    .select({ id: documentFile.id })
    .from(documentFile)
    .innerJoin(documentRecord, eq(documentRecord.id, documentFile.documentRecordId))
    .where(eq(documentRecord.milestoneInstanceId, milestoneId));
  const targets: SQL[] = [];
  if (commits.length) targets.push(inArray(documentComment.commitId, commits.map((c) => c.id)));
  if (files.length) targets.push(inArray(documentComment.documentFileId, files.map((f) => f.id)));
  const comments = targets.length ? await ctx.db.select({ id: documentComment.id }).from(documentComment).where(or(...targets)) : [];
  const attempts = await listAttempts(ctx, milestoneId);
  const last = attempts.at(-1);
  const closed = CLOSED.has(m.status);

  return {
    open: true,
    milestone: m.milestoneCode,
    status: m.status,
    prId: pr?.id ?? null,
    lockedCommit: locked ? { id: locked.id, ordinal: locked.ordinal } : null,
    gates: gates.map((g) => ({ gate: g.gate, result: g.result, at: g.createdAt })).reverse(),
    checklist: await deliverables(ctx, milestoneId),
    defense: last ? { scheduledStartAt: last.attempt.scheduledStartAt, roomOrLink: last.attempt.roomOrLink } : null,
    threads: { open: threads.filter((t) => t.thread.state === "OPEN").length, resolved: threads.filter((t) => t.thread.state === "RESOLVED").length },
    documentComments: comments.length,
    minutes: closed ? (attempts.findLast((a) => a.minutes)?.minutes ?? null) : null,
  };
}
