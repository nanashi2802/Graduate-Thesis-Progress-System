// Manuscript commits and critique threads, contexts A and B (FR-REV-01 to 07, 08, BR-05 to BR-07,
// INV-05 to INV-07, INV-24, NFR-01, NFR-02, NFR-03, AD-A-019). Server only.
// The browser sends the bytes straight to storage (NFR-12). The server never gets them.
// Context C (Defense Day, FR-REV-12) comes with P3-E02.
import "server-only";
import { and, asc, desc, eq, inArray, max } from "drizzle-orm";
import { uploadProblem } from "@/server/files/rules";
import type { UploadLink } from "@/server/files/storage";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem } from "./coordinator";
import { appLink } from "@/server/notify/link";
import { loadMilestoneContext } from "./milestone-facts";
import { emitSafely } from "./recipients";
import type { FilePort } from "./documents";
import {
  appUser,
  committee,
  committeeMember,
  critiqueThread,
  defenseAttempt,
  gateAction,
  manuscriptCommit,
  milestoneInstance,
  submissionPr,
  threadAddressTag,
  thesisInstance,
  threadReply,
  type MilestoneStatusValue,
  type UserRole,
} from "./schema";
import { requireManuscriptRead, requireThesisRead } from "./scope";

type Tx = DataContext["db"];
type Context = "iteration" | "committee_review" | "defense_day";

const MANUSCRIPT_KEY = /(^|\/)manuscript\/[^/]+\.pdf$/;

async function loadMilestone(ctx: DataContext, milestoneId: string) {
  requireActive(ctx.actor);
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, m.thesisInstanceId);
  return m;
}

// FR-REV-01: each milestone has one Submission PR. It is made on first use.
async function prOf(db: Tx, milestoneId: string) {
  const [found] = await db.select().from(submissionPr).where(eq(submissionPr.milestoneInstanceId, milestoneId));
  if (found) return found;
  const [made] = await db
    .insert(submissionPr)
    .values({ milestoneInstanceId: milestoneId })
    .onConflictDoNothing()
    .returning();
  if (made) return made;
  const [again] = await db.select().from(submissionPr).where(eq(submissionPr.milestoneInstanceId, milestoneId));
  return again!;
}

export async function submissionFor(ctx: DataContext, milestoneId: string) {
  const m = await loadMilestone(ctx, milestoneId);
  if (ctx.actor.role === "student" || ctx.actor.role === "panel_member") await requireManuscriptRead(ctx, m.thesisInstanceId);
  const pr = await prOf(ctx.db, milestoneId);
  const commits = await ctx.db
    .select()
    .from(manuscriptCommit)
    .where(eq(manuscriptCommit.submissionPrId, pr.id))
    .orderBy(asc(manuscriptCommit.ordinal));
  return { pr, commits, locked: pr.lockedAt !== null };
}

// The Student uploads a commit while the manuscript is not locked (FR-REV-02, BR-07).
// While the Adviser reviews a Ready commit, a new commit would change what the Adviser reads.
function uploadBlock(status: MilestoneStatusValue, locked: boolean): string | null {
  if (locked) return "The manuscript is locked.";
  if (status === "READY") return "Wait for the Adviser to endorse or return this commit.";
  return null;
}

function requireStudent(ctx: DataContext, what: string): void {
  if (ctx.actor.role !== "student") throw new AccessDeniedError(`only the Student ${what}`);
}

export async function requestCommitUpload(
  ctx: DataContext,
  input: { milestoneId: string; sha256: string; size: number; contentType: string },
  files: FilePort,
): Promise<{ link: UploadLink }> {
  const m = await loadMilestone(ctx, input.milestoneId);
  requireStudent(ctx, "uploads a commit");
  const pr = await prOf(ctx.db, m.id);
  const blocked = uploadBlock(m.status, pr.lockedAt !== null);
  if (blocked) throw new InputProblem(blocked);
  const req = { kind: "manuscript", sha256: input.sha256, size: input.size, contentType: input.contentType } as const;
  const problem = uploadProblem(req);
  if (problem) throw new InputProblem(problem);
  return { link: await files.createUploadLink(req) };
}

/**
 * FR-REV-02, FR-REV-07, FR-REV-08, INV-06, NFR-02: after the browser upload, check the stored hash
 * and size, then write the commit. A new commit clears the Ready mark, in the same transaction.
 */
export async function confirmCommitUpload(
  ctx: DataContext,
  input: {
    milestoneId: string;
    key: string;
    sha256: string;
    size: number;
    contentType: string;
    changeNote?: string | null;
    addressesThreadIds?: string[];
  },
  files: FilePort,
): Promise<{ commitId: string; ordinal: number }> {
  const m = await loadMilestone(ctx, input.milestoneId);
  requireStudent(ctx, "uploads a commit");
  const pr = await prOf(ctx.db, m.id);
  const blocked = uploadBlock(m.status, pr.lockedAt !== null);
  if (blocked) throw new InputProblem(blocked);
  const problem = uploadProblem({ kind: "manuscript", sha256: input.sha256, size: input.size, contentType: input.contentType });
  if (problem) throw new InputProblem(problem);
  if (!MANUSCRIPT_KEY.test(input.key)) throw new InputProblem("This file key is not valid.");
  const [used] = await ctx.db.select({ id: manuscriptCommit.id }).from(manuscriptCommit).where(eq(manuscriptCommit.fileKey, input.key));
  if (used) throw new InputProblem("This file key is already used.");
  if (!(await files.checkStoredFile(input.key, input.sha256, input.size))) {
    throw new InputProblem("The stored file does not match its hash. Upload it again.");
  }
  const note = input.changeNote?.trim() || null;
  const tags = [...new Set(input.addressesThreadIds ?? [])];

  return ctx.db.transaction(async (tx) => {
    // Lock the PR row, then check the lock again: the last Gate 1b endorsement sets `locked_at` in its own
    // transaction, so this check cannot run in parallel with it (BR-07, INV-05).
    const [fresh] = await tx.select({ lockedAt: submissionPr.lockedAt }).from(submissionPr).where(eq(submissionPr.id, pr.id)).for("update");
    if (fresh?.lockedAt) throw new InputProblem("The manuscript is locked.");
    if (tags.length > 0) {
      // FR-REV-08: tag only threads of this PR.
      const own = await tx
        .select({ id: critiqueThread.id })
        .from(critiqueThread)
        .innerJoin(manuscriptCommit, eq(manuscriptCommit.id, critiqueThread.commitId))
        .where(and(eq(manuscriptCommit.submissionPrId, pr.id), inArray(critiqueThread.id, tags)));
      if (own.length !== tags.length) throw new InputProblem("A tagged thread is not on this manuscript.");
    }
    const [last] = await tx.select({ n: max(manuscriptCommit.ordinal) }).from(manuscriptCommit).where(eq(manuscriptCommit.submissionPrId, pr.id));
    const ordinal = (last?.n ?? 0) + 1;
    const [commit] = await tx
      .insert(manuscriptCommit)
      .values({
        submissionPrId: pr.id,
        ordinal,
        fileKey: input.key,
        sha256: input.sha256,
        sizeBytes: input.size,
        changeNote: note,
        uploadedByUserId: ctx.actor.userId,
      })
      .returning();
    if (tags.length > 0) await tx.insert(threadAddressTag).values(tags.map((t) => ({ commitId: commit!.id, critiqueThreadId: t })));
    // INV-06: a new commit clears the Ready mark.
    await tx.update(submissionPr).set({ readyCommitId: null }).where(eq(submissionPr.id, pr.id));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "manuscript.commit",
      targetTable: "manuscript_commit",
      targetId: commit!.id,
      detail: { ordinal, sizeBytes: input.size },
    });
    return { commitId: commit!.id, ordinal };
  });
}

// Statuses in which the Student can mark a commit Ready: a first Ready (DRAFT), and the new mark
// before Gate 1b after a new commit cleared it (INV-06).
const READY_FROM: MilestoneStatusValue[] = ["DRAFT", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED"];

// FR-REV-07: the Student marks one commit Ready. The status change DRAFT to READY is a separate step
// (`transitionMilestone`), which needs this mark.
export async function markCommitReady(ctx: DataContext, milestoneId: string, commitId: string): Promise<void> {
  const m = await loadMilestone(ctx, milestoneId);
  requireStudent(ctx, "marks a commit Ready");
  const pr = await prOf(ctx.db, m.id);
  if (pr.lockedAt) throw new InputProblem("The manuscript is locked.");
  if (!READY_FROM.includes(m.status)) throw new InputProblem("You cannot mark a commit Ready now.");
  const [commit] = await ctx.db
    .select({ id: manuscriptCommit.id })
    .from(manuscriptCommit)
    .where(and(eq(manuscriptCommit.id, commitId), eq(manuscriptCommit.submissionPrId, pr.id)));
  if (!commit) throw new InputProblem("This commit is not on your manuscript.");
  await ctx.db.transaction(async (tx) => {
    await tx.update(submissionPr).set({ readyCommitId: commitId }).where(eq(submissionPr.id, pr.id));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "manuscript.ready", targetTable: "manuscript_commit", targetId: commitId });
  });
  // C1 (FR-NTF-01): after the commit. Never throws (INV-30).
  await emitSafely(ctx, "C1", { thesisId: m.thesisInstanceId, milestone: m.milestoneCode }, { link: appLink("/login"), targetTable: "manuscript_commit", targetId: commitId });
}

// A signed read link for one commit (INV-24: the access check comes first).
export async function commitReadLink(
  ctx: DataContext,
  commitId: string,
  files: { createReadLink(key: string): Promise<string> },
): Promise<string> {
  requireActive(ctx.actor);
  const [row] = await ctx.db
    .select({ key: manuscriptCommit.fileKey, thesisId: milestoneInstance.thesisInstanceId })
    .from(manuscriptCommit)
    .innerJoin(submissionPr, eq(submissionPr.id, manuscriptCommit.submissionPrId))
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, submissionPr.milestoneInstanceId))
    .where(eq(manuscriptCommit.id, commitId));
  if (!row) throw new InputProblem("This commit does not exist.");
  await requireThesisRead(ctx, row.thesisId);
  await requireManuscriptRead(ctx, row.thesisId);
  return files.createReadLink(row.key);
}

// ---- Threads ----

// Which comment context is open for this actor now (Unified §2.12). Null means the actor cannot post.
// Context C, Defense Day (FR-REV-12, FR-REV-15, BR-20): a Final Panel member posts from the scheduled start of the Final
// Defense until they approve Gate 2. Before the start the panel reads only. A reason string means the window is not open.
async function defenseDayBlock(ctx: DataContext, m: typeof milestoneInstance.$inferSelect, now: Date): Promise<string | null> {
  const { userId } = ctx.actor;
  const [seat] = await ctx.db
    .select({ id: committeeMember.id })
    .from(committeeMember)
    .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
    .where(
      and(
        eq(committee.thesisInstanceId, m.thesisInstanceId),
        eq(committee.kind, "final_panel"),
        eq(committeeMember.memberUserId, userId),
        eq(committeeMember.status, "accepted"),
      ),
    );
  if (!seat) return "Only the Final Panel posts Defense Day threads.";
  const [attempt] = await ctx.db
    .select({ start: defenseAttempt.scheduledStartAt })
    .from(defenseAttempt)
    .where(eq(defenseAttempt.milestoneInstanceId, m.id))
    .orderBy(desc(defenseAttempt.attemptNo))
    .limit(1);
  const inWindowStatus = m.status === "DEFENSE_SCHEDULED" || m.status === "DEFENSE_HELD" || m.status === "CLOSED";
  if (!attempt?.start || !inWindowStatus || now < attempt.start) return "The comment window opens at the scheduled start of the Final Defense.";
  const [approved] = await ctx.db
    .select({ id: gateAction.id })
    .from(gateAction)
    .where(and(eq(gateAction.milestoneInstanceId, m.id), eq(gateAction.gate, "gate_2"), eq(gateAction.actorUserId, userId)));
  if (approved) return "You approved Gate 2. The comment window is closed for you.";
  return null;
}

async function openContext(ctx: DataContext, m: typeof milestoneInstance.$inferSelect, now: Date = new Date()): Promise<Context | null> {
  const { role, userId } = ctx.actor;
  if (role === "adviser") {
    // A: before Gate 1a, and after a Return (status DRAFT).
    return m.status === "DRAFT" || m.status === "READY" ? "iteration" : null;
  }
  if (role === "panel_member") {
    // B: after the appointment, before Gate 1b. Milestones 1 and 2 only (FR-REV-04).
    if (m.milestoneCode === "final") return (await defenseDayBlock(ctx, m, now)) === null ? "defense_day" : null;
    const gate1bOpen = m.milestoneCode === "pre_final" ? m.status === "ADVISER_ENDORSED" : m.status === "COMMITTEE_APPOINTED";
    if (!gate1bOpen) return null;
    const [seat] = await ctx.db
      .select({ id: committeeMember.id })
      .from(committeeMember)
      .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
      .where(
        and(
          eq(committee.thesisInstanceId, m.thesisInstanceId),
          eq(committee.kind, "evaluation_committee"),
          eq(committeeMember.memberUserId, userId),
          eq(committeeMember.status, "accepted"),
        ),
      );
    return seat ? "committee_review" : null;
  }
  return null;
}

// FR-REV-04: the Adviser or a Panel Member posts a thread on a commit, with an optional page number (D-26).
export async function postThread(
  ctx: DataContext,
  input: { commitId: string; body: string; page?: number | null },
): Promise<{ threadId: string }> {
  requireActive(ctx.actor);
  const body = input.body.trim();
  if (!body) throw new InputProblem("Write the comment first.");
  const page = input.page ?? null;
  if (page !== null && !(Number.isInteger(page) && page >= 1 && page <= 9999)) throw new InputProblem("Write a page number from 1 to 9999.");
  const [row] = await ctx.db
    .select({ milestone: milestoneInstance })
    .from(manuscriptCommit)
    .innerJoin(submissionPr, eq(submissionPr.id, manuscriptCommit.submissionPrId))
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, submissionPr.milestoneInstanceId))
    .where(eq(manuscriptCommit.id, input.commitId));
  if (!row) throw new InputProblem("This commit does not exist.");
  const m = row.milestone;
  await requireThesisRead(ctx, m.thesisInstanceId);
  await requireManuscriptRead(ctx, m.thesisInstanceId);
  const context = await openContext(ctx, m);
  if (!context) throw new InputProblem("You cannot post a thread on this manuscript now.");
  const posted = await ctx.db.transaction(async (tx) => {
    const [t] = await tx
      .insert(critiqueThread)
      .values({
        commitId: input.commitId,
        authorUserId: ctx.actor.userId,
        authorRole: ctx.actor.role,
        context,
        body,
        page,
      })
      .returning();
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "thread.post", targetTable: "critique_thread", targetId: t!.id, detail: { context } });
    return { threadId: t!.id };
  });
  await emitSafely(ctx, "C2", { thesisId: m.thesisInstanceId, milestone: m.milestoneCode }, { link: appLink("/login"), targetTable: "critique_thread", targetId: posted.threadId });
  return posted;
}

async function loadThread(ctx: DataContext, threadId: string) {
  requireActive(ctx.actor);
  const [row] = await ctx.db
    .select({ thread: critiqueThread, milestone: milestoneInstance })
    .from(critiqueThread)
    .innerJoin(manuscriptCommit, eq(manuscriptCommit.id, critiqueThread.commitId))
    .innerJoin(submissionPr, eq(submissionPr.id, manuscriptCommit.submissionPrId))
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, submissionPr.milestoneInstanceId))
    .where(eq(critiqueThread.id, threadId));
  if (!row) throw new InputProblem("This thread does not exist.");
  await requireThesisRead(ctx, row.milestone.thesisInstanceId);
  await requireManuscriptRead(ctx, row.milestone.thesisInstanceId);
  return row;
}

// A Panel Member sees context B and C threads only: they cannot comment in context A (Unified §2.12).
// The Student sees Defense Day threads when the defense closes and the manuscript unlocks (BR-20, FR-REV-12).
const visibleTo = (role: DataContext["actor"]["role"], context: string, status: MilestoneStatusValue) =>
  role === "panel_member"
    ? context !== "iteration"
    : role === "student" && context === "defense_day"
      ? status === "CLOSED" || status === "FINAL_APPROVED" || status === "CLEARED"
      : true;

// BR-05: the Student replies. A reviewer can reply too. The Coordinator only reads.
export async function replyToThread(ctx: DataContext, threadId: string, body: string): Promise<void> {
  const { thread, milestone } = await loadThread(ctx, threadId);
  if (!visibleTo(ctx.actor.role, thread.context, milestone.status)) throw new AccessDeniedError("this thread is not visible to you");
  if (ctx.actor.role === "coordinator") throw new AccessDeniedError("the Coordinator does not reply to threads");
  const text = body.trim();
  if (!text) throw new InputProblem("Write the reply first.");
  if (thread.state === "RESOLVED") throw new InputProblem("This thread is resolved.");
  await ctx.db.transaction(async (tx) => {
    const [last] = await tx.select({ n: max(threadReply.ordinal) }).from(threadReply).where(eq(threadReply.critiqueThreadId, threadId));
    await tx.insert(threadReply).values({ critiqueThreadId: threadId, authorUserId: ctx.actor.userId, ordinal: (last?.n ?? 0) + 1, body: text });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "thread.reply", targetTable: "critique_thread", targetId: threadId });
  });
  // C3: the thread author learns of the reply. emitEvent drops the actor.
  await emitSafely(ctx, "C3", { thesisId: milestone.thesisInstanceId, milestone: milestone.milestoneCode, userIds: [thread.authorUserId] }, { link: appLink("/login"), targetTable: "critique_thread", targetId: threadId });
}

// BR-05, INV-07: only the author resolves a thread.
export async function resolveThread(ctx: DataContext, threadId: string): Promise<void> {
  const { thread, milestone } = await loadThread(ctx, threadId);
  if (thread.authorUserId !== ctx.actor.userId) throw new AccessDeniedError("only the author resolves a thread");
  if (thread.state === "RESOLVED") return;
  await ctx.db.transaction(async (tx) => {
    await tx.update(critiqueThread).set({ state: "RESOLVED", resolvedAt: new Date() }).where(eq(critiqueThread.id, threadId));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "thread.resolve", targetTable: "critique_thread", targetId: threadId });
  });
  await emitSafely(ctx, "C4", { thesisId: milestone.thesisInstanceId, milestone: milestone.milestoneCode }, { link: appLink("/login"), targetTable: "critique_thread", targetId: threadId });
}

export type ThreadView = {
  thread: typeof critiqueThread.$inferSelect;
  commitOrdinal: number;
  /** BR-06, FR-REV-05: an open thread on a commit that is not the newest. */
  outdated: boolean;
  /** Each reply carries the role of its author, so the screen can name who replied. */
  replies: ((typeof threadReply.$inferSelect) & { authorRole: UserRole })[];
  /** FR-REV-08: the commits that say they address this thread. */
  addressedByOrdinals: number[];
};

export async function listThreads(ctx: DataContext, milestoneId: string): Promise<ThreadView[]> {
  const m = await loadMilestone(ctx, milestoneId);
  await requireManuscriptRead(ctx, m.thesisInstanceId);
  const pr = await prOf(ctx.db, milestoneId);
  const commits = await ctx.db.select().from(manuscriptCommit).where(eq(manuscriptCommit.submissionPrId, pr.id));
  const ordinalOf = new Map(commits.map((c) => [c.id, c.ordinal]));
  const newest = Math.max(0, ...commits.map((c) => c.ordinal));
  if (commits.length === 0) return [];
  const threads = (
    await ctx.db
      .select()
      .from(critiqueThread)
      .where(inArray(critiqueThread.commitId, commits.map((c) => c.id)))
      .orderBy(desc(critiqueThread.createdAt))
  ).filter((t) => visibleTo(ctx.actor.role, t.context, m.status));
  if (threads.length === 0) return [];
  const ids = threads.map((t) => t.id);
  const replies = await ctx.db.select().from(threadReply).where(inArray(threadReply.critiqueThreadId, ids)).orderBy(asc(threadReply.ordinal));
  const authors = new Map<string, UserRole>();
  if (replies.length > 0) {
    const users = await ctx.db
      .select({ id: appUser.id, role: appUser.role })
      .from(appUser)
      .where(inArray(appUser.id, [...new Set(replies.map((r) => r.authorUserId))]));
    for (const u of users) authors.set(u.id, u.role);
  }
  const tags = await ctx.db.select().from(threadAddressTag).where(inArray(threadAddressTag.critiqueThreadId, ids));
  return threads.map((t) => ({
    thread: t,
    commitOrdinal: ordinalOf.get(t.commitId)!,
    outdated: t.state === "OPEN" && ordinalOf.get(t.commitId)! < newest,
    replies: replies.filter((r) => r.critiqueThreadId === t.id).map((r) => ({ ...r, authorRole: authors.get(r.authorUserId)! })),
    addressedByOrdinals: tags.filter((g) => g.critiqueThreadId === t.id).map((g) => ordinalOf.get(g.commitId)!).sort((a, b) => a - b),
  }));
}

// The milestone of a Submission PR, for the screens whose route holds the PR id (S2, A2, P2).
export async function milestoneOfPr(ctx: DataContext, prId: string): Promise<{ milestoneId: string; code: typeof milestoneInstance.$inferSelect["milestoneCode"] }> {
  requireActive(ctx.actor);
  const [row] = await ctx.db
    .select({ m: milestoneInstance })
    .from(submissionPr)
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, submissionPr.milestoneInstanceId))
    .where(eq(submissionPr.id, prId));
  if (!row) throw new InputProblem("This manuscript does not exist.");
  await requireThesisRead(ctx, row.m.thesisInstanceId);
  return { milestoneId: row.m.id, code: row.m.milestoneCode };
}

// Read only. The reason why this user cannot post a thread now, or null when they can (BR-18).
export async function threadPostBlock(ctx: DataContext, milestoneId: string): Promise<string | null> {
  const m = await loadMilestone(ctx, milestoneId);
  if (ctx.actor.role === "student") return "Only the Adviser and the Panel Members post threads. Reply to a thread below.";
  if (ctx.actor.role === "coordinator") return "The Coordinator reads threads and does not post them.";
  if (ctx.actor.role === "panel_member" && m.milestoneCode === "final") return defenseDayBlock(ctx, m, new Date());
  return (await openContext(ctx, m)) ? null : "You cannot post a thread on this manuscript now.";
}

// Everything the PR workspace screen shows: the milestone, the commits, the Ready mark, the lock and the threads.
// R5.9 (UX-P-05, UX-030): also the thesis title and the Student name, so the screen and the gate dialogs name the
// thesis before a gate action. Read only. It runs after `submissionFor` and `listThreads`, which check access first.
export async function workspaceFor(ctx: DataContext, prId: string) {
  const { milestoneId } = await milestoneOfPr(ctx, prId);
  const milestone = await loadMilestone(ctx, milestoneId);
  const view = await submissionFor(ctx, milestoneId);
  const threads = await listThreads(ctx, milestoneId);
  const [row] = await ctx.db
    .select({ title: thesisInstance.title, studentName: appUser.fullName })
    .from(thesisInstance)
    .innerJoin(appUser, eq(appUser.id, thesisInstance.studentUserId))
    .where(eq(thesisInstance.id, milestone.thesisInstanceId));
  if (!row) throw new InputProblem("The thesis of this manuscript was not found.");
  return { milestone, ...view, threads, identity: { title: row.title, studentName: row.studentName } };
}
