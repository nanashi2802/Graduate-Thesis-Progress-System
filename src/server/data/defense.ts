// Defense: date, schedule, sheets, verdict, Minutes and close (FR-DEF-01 to 12, BR-09 to BR-12, BR-15,
// INV-12 to INV-16, NFR-01, NFR-03, AD-A-021). Server only. The status changes run through
// `transitionMilestone`, so the rule table of ERD §7.1 stays in one place. Each action here wraps the
// attempt row and the status change in one transaction.
import "server-only";
import { and, asc, desc, eq, inArray, max } from "drizzle-orm";
import {
  actionTakenWarnings,
  checkComment,
  checkScores,
  checkSheetEdit,
  evaluationFormFor,
  resultsVisible,
  rubricTotal,
  type Tdw10Section,
} from "@/server/domain/evaluation";
import { addDays, type Verdict } from "@/server/domain/milestone";
import { pstDate } from "@/server/notify/time";
import { uploadProblem } from "@/server/files/rules";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import type { FilePort } from "./documents";
import { expectedEvaluatorsFor, loadMilestoneContext, type MilestoneContext } from "./milestone-facts";
import { checkTransition, disapproveToDraft, openMilestone, transitionMilestone } from "./milestones";
import {
  committeeMember,
  defenseAttempt,
  evaluationComment,
  evaluationEntry,
  evaluationScore,
  minutes,
  printedCopyReceipt,
  rubricIndicator,
  submissionPr,
  templateVersion,
} from "./schema";
import { requireThesisRead } from "./scope";

type Attempt = typeof defenseAttempt.$inferSelect;
type Tx = DataContext["db"];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SCAN_KEY = /(^|\/)scan\/[^/]+\.(pdf|jpg|png)$/;

async function loadMilestone(ctx: DataContext, milestoneId: string): Promise<MilestoneContext> {
  requireActive(ctx.actor);
  const mctx = await loadMilestoneContext(ctx.db, milestoneId);
  if (!mctx) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, mctx.thesis.id);
  return mctx;
}

async function latestAttempt(db: Tx, milestoneId: string): Promise<Attempt | undefined> {
  const [a] = await db
    .select()
    .from(defenseAttempt)
    .where(eq(defenseAttempt.milestoneInstanceId, milestoneId))
    .orderBy(desc(defenseAttempt.attemptNo))
    .limit(1);
  return a;
}

// An attempt takes sheets and Minutes from the schedule until the Coordinator closes it.
const isOpen = (a: Attempt) => a.status === "scheduled" || a.status === "held";

async function loadAttempt(ctx: DataContext, attemptId: string) {
  requireActive(ctx.actor);
  const [a] = await ctx.db.select().from(defenseAttempt).where(eq(defenseAttempt.id, attemptId));
  if (!a) throw new InputProblem("This defense attempt does not exist.");
  const mctx = await loadMilestone(ctx, a.milestoneInstanceId);
  return { attempt: a, mctx };
}

// ---- Date and schedule ----

/**
 * FR-DEF-01, INV-12, BR-09: after Gate 1b the Student proposes a date. The rule table refuses a date less
 * than `min_notice_days` after Gate 1b. A new Return starts a new proposal on the same open attempt.
 * The dates in the common free time are shown to the Student, not forced (AD-A-021).
 */
export async function proposeDefenseDate(ctx: DataContext, milestoneId: string, proposedDate: string): Promise<{ attemptId: string }> {
  const mctx = await loadMilestone(ctx, milestoneId);
  if (ctx.actor.role !== "student") throw new AccessDeniedError("only the Student proposes a date");
  if (!DATE.test(proposedDate) || Number.isNaN(new Date(`${proposedDate}T00:00:00Z`).getTime())) {
    throw new InputProblem("Enter the date as YYYY-MM-DD.");
  }
  return ctx.db.transaction(async (tx) => {
    const last = await latestAttempt(tx, milestoneId);
    let attemptId: string;
    if (last && last.status === "proposed") {
      await tx.update(defenseAttempt).set({ proposedDate }).where(eq(defenseAttempt.id, last.id));
      attemptId = last.id;
    } else {
      const [made] = await tx
        .insert(defenseAttempt)
        .values({ milestoneInstanceId: milestoneId, attemptNo: (last?.attemptNo ?? 0) + 1, proposedDate })
        .returning({ id: defenseAttempt.id });
      attemptId = made!.id;
    }
    // A refusal throws and the transaction rolls back the attempt row.
    await transitionMilestone({ db: tx, actor: ctx.actor }, mctx.milestone.id, "DATE_PROPOSED");
    return { attemptId };
  });
}

/**
 * FR-DEF-03, INV-13: the Coordinator confirms the date, the start time and the room or link. The rule table
 * blocks the confirmation until the FR-DOC-08 checklist is complete. The start must fall on the proposed
 * date. To change the date, the Coordinator Returns the request.
 */
export async function confirmDefenseDate(
  ctx: DataContext,
  milestoneId: string,
  input: { startsAt: Date; roomOrLink: string },
): Promise<void> {
  requireCoordinator(ctx, "confirms a defense date");
  const mctx = await loadMilestone(ctx, milestoneId);
  const room = input.roomOrLink.trim();
  if (!room) throw new InputProblem("Enter the room or the meeting link.");
  await ctx.db.transaction(async (tx) => {
    const a = await latestAttempt(tx, milestoneId);
    if (!a || a.status !== "proposed" || !a.proposedDate) throw new InputProblem("The Student has not proposed a date.");
    if (pstDate(input.startsAt) !== a.proposedDate) {
      throw new InputProblem(`The start must be on ${a.proposedDate}. To change the date, Return the request.`);
    }
    await tx
      .update(defenseAttempt)
      .set({ status: "scheduled", scheduledStartAt: input.startsAt, roomOrLink: room })
      .where(eq(defenseAttempt.id, a.id));
    await transitionMilestone({ db: tx, actor: ctx.actor }, mctx.milestone.id, "DEFENSE_SCHEDULED");
  });
}

// ---- Sheets ----

export type SheetInput = {
  actionTaken: Verdict | null;
  scores: { indicatorId: string; score: number }[];
  comments: { section: Tdw10Section; body: string }[];
};

/**
 * FR-DEF-05, FR-DEF-06, INV-14, BR-10: an evaluator saves their own sheet from the scheduled start until
 * the Coordinator verifies it. A mismatch reopens the sheet. TDW 08 and TDW 13 take scores that match the
 * rubric of the milestone template (INV-25). TDW 10 takes comments only. No grade equivalent (BR-15).
 */
export async function saveSheet(
  ctx: DataContext,
  attemptId: string,
  input: SheetInput,
  now: Date = new Date(),
): Promise<{ entryId: string; total: number | null }> {
  const { attempt, mctx } = await loadAttempt(ctx, attemptId);
  const expected = await expectedEvaluatorsFor(ctx.db, mctx, attempt.id);
  // The attempt status decides, not the milestone status: a Disapproved defense goes back to DRAFT at once, and its
  // missing sheets and Minutes still follow (FR-DEF-12, FR-WFL-09, BR-11).
  if (!isOpen(attempt)) throw new InputProblem("The defense is not open for sheets.");
  const [existing] = await ctx.db
    .select()
    .from(evaluationEntry)
    .where(and(eq(evaluationEntry.defenseAttemptId, attemptId), eq(evaluationEntry.memberUserId, ctx.actor.userId)));
  const edit = checkSheetEdit({
    actorUserId: ctx.actor.userId,
    memberUserId: ctx.actor.userId,
    expected,
    scheduledStartAt: attempt.scheduledStartAt,
    verifiedAt: existing?.verifiedAt ?? null,
    now,
  });
  if (!edit.ok) throw new InputProblem(edit.reason);

  const form = evaluationFormFor(mctx.code);
  const rubric = await ctx.db
    .select({ id: rubricIndicator.id, weightPct: rubricIndicator.weightPct })
    .from(rubricIndicator)
    .where(eq(rubricIndicator.templateVersionId, mctx.milestone.templateVersionId));
  const scores = checkScores(form, rubric, input.scores);
  if (!scores.ok) throw new InputProblem(scores.reason);
  for (const c of input.comments) {
    const d = checkComment(form, c.section);
    if (!d.ok) throw new InputProblem(d.reason);
  }
  const comments = input.comments.filter((c) => c.body.trim());

  return ctx.db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(evaluationEntry)
      .values({ defenseAttemptId: attemptId, memberUserId: ctx.actor.userId, form, actionTaken: input.actionTaken, updatedAt: now })
      .onConflictDoUpdate({
        target: [evaluationEntry.defenseAttemptId, evaluationEntry.memberUserId],
        set: { actionTaken: input.actionTaken, updatedAt: now, sheetMatch: "pending" },
      })
      .returning({ id: evaluationEntry.id });
    const entryId = entry!.id;
    await tx.delete(evaluationScore).where(eq(evaluationScore.evaluationEntryId, entryId));
    await tx.delete(evaluationComment).where(eq(evaluationComment.evaluationEntryId, entryId));
    if (input.scores.length > 0) {
      await tx.insert(evaluationScore).values(input.scores.map((s) => ({ evaluationEntryId: entryId, rubricIndicatorId: s.indicatorId, score: String(s.score) })));
    }
    if (comments.length > 0) {
      await tx.insert(evaluationComment).values(comments.map((c) => ({ evaluationEntryId: entryId, section: c.section, body: c.body.trim() })));
    }
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "sheet.save", targetTable: "evaluation_entry", targetId: entryId, detail: { form } });
    return { entryId, total: input.scores.length > 0 ? rubricTotal(input.scores) : null };
  });
}

// A sheet the Coordinator can still work on: not verified, and its attempt is open.
async function openEntry(ctx: DataContext, entryId: string) {
  const [row] = await ctx.db
    .select({ e: evaluationEntry, a: defenseAttempt })
    .from(evaluationEntry)
    .innerJoin(defenseAttempt, eq(defenseAttempt.id, evaluationEntry.defenseAttemptId))
    .where(eq(evaluationEntry.id, entryId));
  if (!row) throw new InputProblem("This sheet does not exist.");
  if (row.e.verifiedAt) throw new InputProblem("This sheet is verified. It cannot change.");
  if (!isOpen(row.a)) throw new InputProblem("The defense of this sheet is closed.");
  return row.e;
}

/** FR-DEF-08: the Coordinator gets an upload link for the signed sheet scan of one entry. */
export async function requestSheetUpload(
  ctx: DataContext,
  entryId: string,
  input: { sha256: string; size: number; contentType: string },
  files: FilePort,
) {
  requireCoordinator(ctx, "uploads a signed sheet");
  const req = { kind: "scan", ...input } as const;
  const problem = uploadProblem(req);
  if (problem) throw new InputProblem(problem);
  await openEntry(ctx, entryId);
  return { link: await files.createUploadLink(req) };
}

export async function confirmSheetUpload(
  ctx: DataContext,
  entryId: string,
  input: { key: string; sha256: string; size: number; contentType: string },
  files: FilePort,
): Promise<void> {
  requireCoordinator(ctx, "uploads a signed sheet");
  const problem = uploadProblem({ kind: "scan", sha256: input.sha256, size: input.size, contentType: input.contentType });
  if (problem) throw new InputProblem(problem);
  if (!SCAN_KEY.test(input.key)) throw new InputProblem("This file key is not valid.");
  await openEntry(ctx, entryId);
  const [used] = await ctx.db.select({ id: evaluationEntry.id }).from(evaluationEntry).where(eq(evaluationEntry.sheetFileKey, input.key));
  if (used) throw new InputProblem("This file key is already used.");
  if (!(await files.checkStoredFile(input.key, input.sha256, input.size))) throw new InputProblem("The stored file does not match its hash. Upload it again.");
  await ctx.db.transaction(async (tx) => {
    await tx.update(evaluationEntry).set({ sheetFileKey: input.key, sheetMatch: "pending" }).where(eq(evaluationEntry.id, entryId));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "sheet.scan", targetTable: "evaluation_entry", targetId: entryId });
  });
}

/**
 * FR-DEF-08: the Coordinator checks the signed scan against the encoded entry. A match verifies the sheet
 * and locks it (INV-14). A mismatch keeps the sheet open: the member corrects it (BR-12).
 */
export async function verifySheet(ctx: DataContext, entryId: string, result: "matched" | "mismatch", now: Date = new Date()): Promise<void> {
  requireCoordinator(ctx, "verifies a sheet");
  const e = await openEntry(ctx, entryId);
  if (!e.sheetFileKey) throw new InputProblem("Upload the signed scan first.");
  if (result === "matched" && !e.actionTaken) throw new InputProblem("The sheet has no Action Taken.");
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(evaluationEntry)
      .set({ sheetMatch: result, verifiedAt: result === "matched" ? now : null })
      .where(eq(evaluationEntry.id, entryId));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: `sheet.${result}`, targetTable: "evaluation_entry", targetId: entryId });
  });
}

// ---- Verdict, held, Minutes, close ----

async function requireVerdictSeat(ctx: DataContext, mctx: MilestoneContext): Promise<void> {
  // INV-15: the Lead Panel Member (Milestones 1 and 2) or the Panel Chair (Milestone 3).
  const need = mctx.code === "final" ? "panel_chair" : "lead_panel_member";
  if (ctx.actor.role !== "panel_member" || !mctx.committeeId) throw new AccessDeniedError("only the Lead Panel Member or the Panel Chair records the verdict");
  const [seat] = await ctx.db
    .select({ designation: committeeMember.designation })
    .from(committeeMember)
    .where(
      and(eq(committeeMember.committeeId, mctx.committeeId), eq(committeeMember.memberUserId, ctx.actor.userId), eq(committeeMember.status, "accepted")),
    );
  if (seat?.designation !== need) throw new AccessDeniedError(`only the ${need === "panel_chair" ? "Panel Chair" : "Lead Panel Member"} records the verdict`);
}

/**
 * FR-DEF-07, INV-15, BR-17: the collective verdict, on or after the defense date. The result lists each
 * member whose Action Taken differs. A warning never blocks. The Lead Panel Member or the Panel Chair can
 * record the verdict again until the defense is held. Each change has an audit row.
 */
export async function recordVerdict(
  ctx: DataContext,
  milestoneId: string,
  verdict: Verdict,
  now: Date = new Date(),
): Promise<{ warnings: { memberUserId: string; actionTaken: Verdict }[] }> {
  const mctx = await loadMilestone(ctx, milestoneId);
  await requireVerdictSeat(ctx, mctx);
  if (mctx.milestone.status !== "DEFENSE_SCHEDULED") throw new InputProblem("The verdict is for a scheduled defense.");
  const a = await latestAttempt(ctx.db, milestoneId);
  if (!a?.scheduledStartAt) throw new InputProblem("The defense has no date.");
  if (pstDate(now) < pstDate(a.scheduledStartAt)) throw new InputProblem("The verdict is for the defense date or later.");
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(defenseAttempt)
      .set({ verdict, verdictByUserId: ctx.actor.userId, verdictAt: now })
      .where(eq(defenseAttempt.id, a.id));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "defense.verdict", targetTable: "defense_attempt", targetId: a.id, detail: { verdict } });
  });
  const entries = await ctx.db.select().from(evaluationEntry).where(eq(evaluationEntry.defenseAttemptId, a.id));
  return { warnings: actionTakenWarnings(verdict, entries) };
}

/**
 * INV-15, FR-WFL-09: the Lead Panel Member or the Panel Chair marks the defense held. A Disapproved
 * verdict sends the milestone back to DRAFT at once, with the manuscript unlocked, so a new attempt can follow.
 */
export async function markDefenseHeld(ctx: DataContext, milestoneId: string): Promise<{ backToDraft: boolean }> {
  const mctx = await loadMilestone(ctx, milestoneId);
  await requireVerdictSeat(ctx, mctx);
  return ctx.db.transaction(async (tx) => {
    const txCtx = { db: tx, actor: ctx.actor };
    const a = await latestAttempt(tx, milestoneId);
    if (!a) throw new InputProblem("The defense has no attempt.");
    await transitionMilestone(txCtx, milestoneId, "DEFENSE_HELD");
    await tx.update(defenseAttempt).set({ status: "held" }).where(eq(defenseAttempt.id, a.id));
    if (a.verdict === "disapproved") {
      await disapproveToDraft(txCtx, milestoneId);
      return { backToDraft: true };
    }
    return { backToDraft: false };
  });
}

/**
 * FR-DEF-09: the Coordinator issues the Minutes of one attempt after the defense is held. The attempt can
 * belong to a Disapproved defense that is back in DRAFT (FR-DEF-12). A second issue is refused (BR-19).
 */
export async function issueMinutes(ctx: DataContext, attemptId: string, body: string, now: Date = new Date()): Promise<void> {
  requireCoordinator(ctx, "issues the Minutes");
  const { attempt } = await loadAttempt(ctx, attemptId);
  const text = body.trim();
  if (!text) throw new InputProblem("Write the Minutes first.");
  if (attempt.status !== "held") throw new InputProblem("The Minutes follow a held defense.");
  await ctx.db.transaction(async (tx) => {
    const [found] = await tx.select().from(minutes).where(eq(minutes.defenseAttemptId, attempt.id));
    if (found?.issuedAt) throw new InputProblem("The Minutes are issued already.");
    if (found) await tx.update(minutes).set({ body: text, issuedAt: now, issuedByUserId: ctx.actor.userId }).where(eq(minutes.id, found.id));
    else await tx.insert(minutes).values({ defenseAttemptId: attempt.id, body: text, issuedAt: now, issuedByUserId: ctx.actor.userId });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "minutes.issue", targetTable: "defense_attempt", targetId: attempt.id });
  });
}

/** FR-DEF-10, INV-16: the Coordinator closes the defense. The rule table checks the sheets, the Minutes and the documents. */
export async function closeDefense(ctx: DataContext, milestoneId: string, now: Date = new Date()): Promise<void> {
  requireCoordinator(ctx, "closes a defense");
  const mctx = await loadMilestone(ctx, milestoneId);
  await ctx.db.transaction(async (tx) => {
    const a = await latestAttempt(tx, milestoneId);
    if (!a) throw new InputProblem("The defense has no attempt.");
    await transitionMilestone({ db: tx, actor: ctx.actor }, milestoneId, "CLOSED");
    await tx.update(defenseAttempt).set({ status: "closed", closedAt: now }).where(eq(defenseAttempt.id, a.id));
    // FR-WFL-01: Milestone 3 opens when Milestone 2 is CLOSED.
    if (mctx.code === "pre_final") await openMilestone({ db: tx, actor: ctx.actor }, mctx.thesis.id, "final");
  });
}

// ---- Printed copies (FR-DEF-04, BR-09) ----

export type PrintedCopyStatus = {
  /** Printed copies are due `printed_copies_due_days` before the defense date (PST date). */
  dueDate: string | null;
  expectedCount: number;
  receipt: typeof printedCopyReceipt.$inferSelect | null;
  /** BR-09: a late or missing receipt is a warning only (BR-17). */
  late: boolean;
};

export async function printedCopyStatus(ctx: DataContext, attemptId: string, now: Date = new Date()): Promise<PrintedCopyStatus> {
  const { attempt, mctx } = await loadAttempt(ctx, attemptId);
  const [v] = await ctx.db.select().from(templateVersion).where(eq(templateVersion.id, mctx.milestone.templateVersionId));
  const [receipt] = await ctx.db.select().from(printedCopyReceipt).where(eq(printedCopyReceipt.defenseAttemptId, attemptId));
  const dueDate = attempt.scheduledStartAt ? addDays(pstDate(attempt.scheduledStartAt), -(v?.printedCopiesDueDays ?? 7)) : null;
  const doctoral = mctx.degreeLevel === "doctoral";
  const receivedOn = receipt ? pstDate(receipt.receivedAt) : null;
  return {
    dueDate,
    expectedCount: (doctoral ? v?.printedCopiesDoctoral : v?.printedCopiesMasters) ?? 0,
    receipt: receipt ?? null,
    late: dueDate !== null && (receivedOn ? receivedOn > dueDate : pstDate(now) > dueDate),
  };
}

/** FR-DEF-04: the Coordinator records the receipt of the printed copies. A warning for a late receipt never blocks (BR-17). */
export async function recordPrintedCopies(ctx: DataContext, attemptId: string, copyCount: number, now: Date = new Date()): Promise<void> {
  requireCoordinator(ctx, "records printed copies");
  const { attempt } = await loadAttempt(ctx, attemptId);
  if (!Number.isInteger(copyCount) || copyCount <= 0) throw new InputProblem("Enter the number of copies, one or more.");
  if (!isOpen(attempt)) throw new InputProblem("The defense is not open for printed copies.");
  await ctx.db.transaction(async (tx) => {
    const [found] = await tx.select().from(printedCopyReceipt).where(eq(printedCopyReceipt.defenseAttemptId, attemptId));
    if (found?.matchResult === "matched") throw new InputProblem("The copies are checked already.");
    if (found) await tx.update(printedCopyReceipt).set({ copyCount, receivedAt: now, matchResult: "pending" }).where(eq(printedCopyReceipt.id, found.id));
    else await tx.insert(printedCopyReceipt).values({ defenseAttemptId: attemptId, copyCount, receivedAt: now });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "printed.receive", targetTable: "defense_attempt", targetId: attemptId, detail: { copyCount } });
  });
}

/** FR-DEF-04, FR-DEF-09: the Coordinator checks the printed copies against the locked manuscript. */
export async function checkPrintedCopies(ctx: DataContext, attemptId: string, result: "matched" | "mismatch"): Promise<void> {
  requireCoordinator(ctx, "checks printed copies");
  const { attempt } = await loadAttempt(ctx, attemptId);
  if (!isOpen(attempt)) throw new InputProblem("The defense is not open for printed copies.");
  const [found] = await ctx.db.select().from(printedCopyReceipt).where(eq(printedCopyReceipt.defenseAttemptId, attemptId));
  if (!found) throw new InputProblem("Record the receipt of the copies first.");
  await ctx.db.transaction(async (tx) => {
    await tx.update(printedCopyReceipt).set({ matchResult: result }).where(eq(printedCopyReceipt.id, found.id));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: `printed.${result}`, targetTable: "defense_attempt", targetId: attemptId });
  });
}

// ---- The Defense Day page (A5, P4) ----

async function isVerdictSeat(ctx: DataContext, mctx: MilestoneContext): Promise<boolean> {
  const need = mctx.code === "final" ? "panel_chair" : "lead_panel_member";
  if (ctx.actor.role !== "panel_member" || !mctx.committeeId) return false;
  const [seat] = await ctx.db
    .select({ designation: committeeMember.designation })
    .from(committeeMember)
    .where(and(eq(committeeMember.committeeId, mctx.committeeId), eq(committeeMember.memberUserId, ctx.actor.userId), eq(committeeMember.status, "accepted")));
  return seat?.designation === need;
}

/**
 * FR-DEF-05, FR-DEF-06, FR-DEF-07: what the Defense Day page of one attempt needs: the form, the rubric, the own sheet,
 * and the reason each action is blocked (BR-18). It reads only. The page for the Adviser (A5) and the Panel Member (P4) are one.
 */
export async function defensePage(ctx: DataContext, attemptId: string, now: Date = new Date()) {
  const { attempt, mctx } = await loadAttempt(ctx, attemptId);
  const form = evaluationFormFor(mctx.code);
  const expected = await expectedEvaluatorsFor(ctx.db, mctx, attempt.id);
  const rubric = await ctx.db
    .select({ id: rubricIndicator.id, code: rubricIndicator.code, label: rubricIndicator.label, weightPct: rubricIndicator.weightPct })
    .from(rubricIndicator)
    .where(eq(rubricIndicator.templateVersionId, mctx.milestone.templateVersionId))
    .orderBy(asc(rubricIndicator.code));
  const [entry] = await ctx.db
    .select()
    .from(evaluationEntry)
    .where(and(eq(evaluationEntry.defenseAttemptId, attempt.id), eq(evaluationEntry.memberUserId, ctx.actor.userId)));
  const scores = entry ? await ctx.db.select().from(evaluationScore).where(eq(evaluationScore.evaluationEntryId, entry.id)) : [];
  const comments = entry ? await ctx.db.select().from(evaluationComment).where(eq(evaluationComment.evaluationEntryId, entry.id)) : [];
  const isEvaluator = expected.includes(ctx.actor.userId);

  let editBlock: string | null = null;
  if (!isEvaluator) editBlock = "You do not complete a sheet for this defense.";
  else if (!isOpen(attempt)) editBlock = "The defense is not open for sheets.";
  else {
    const d = checkSheetEdit({
      actorUserId: ctx.actor.userId,
      memberUserId: ctx.actor.userId,
      expected,
      scheduledStartAt: attempt.scheduledStartAt,
      verifiedAt: entry?.verifiedAt ?? null,
      now,
    });
    if (!d.ok) editBlock = d.reason;
  }

  const verdictSeat = await isVerdictSeat(ctx, mctx);
  let verdictBlock: string | null = null;
  if (mctx.milestone.status !== "DEFENSE_SCHEDULED") verdictBlock = "The verdict is for a scheduled defense.";
  else if (!attempt.scheduledStartAt || pstDate(now) < pstDate(attempt.scheduledStartAt)) verdictBlock = "The verdict is for the defense date or later.";
  let heldBlock: string | null = null;
  if (verdictSeat) {
    const d = await checkTransition(ctx, mctx.milestone.id, "DEFENSE_HELD");
    if (!d.ok) heldBlock = d.reason;
  }
  const sheets = await ctx.db.select().from(evaluationEntry).where(eq(evaluationEntry.defenseAttemptId, attempt.id));
  const [pr] = await ctx.db.select({ id: submissionPr.id }).from(submissionPr).where(eq(submissionPr.milestoneInstanceId, mctx.milestone.id));
  // BR-11: a Student sees the verdict only when every expected sheet is verified, as in `listAttempts`.
  const hideVerdict = ctx.actor.role === "student" && !resultsVisible(expected, sheets);
  return {
    attempt: hideVerdict ? { ...attempt, verdict: null, verdictByUserId: null, verdictAt: null } : attempt,
    milestone: { id: mctx.milestone.id, code: mctx.code, status: mctx.milestone.status },
    /** The Submission PR of the milestone, for the "Manuscript and comments" tab at the Final (FR-DEF-05). */
    prId: pr?.id ?? null,
    form,
    rubric,
    isEvaluator,
    own: entry
      ? {
          entry,
          scores: Object.fromEntries(scores.map((x) => [x.rubricIndicatorId, Number(x.score)])) as Record<string, number>,
          comments: Object.fromEntries(comments.map((c) => [c.section, c.body])) as Record<string, string>,
        }
      : null,
    editBlock,
    verdictSeat,
    verdictBlock,
    heldBlock,
    // BR-17: a warning only. Only the seat that records the verdict sees it.
    warnings: verdictSeat ? actionTakenWarnings(attempt.verdict, sheets) : [],
    sheetsSaved: sheets.length,
    sheetsExpected: expected.length,
  };
}

// ---- Read ----

export type AttemptView = {
  attempt: Attempt;
  /** BR-11: the Student sees verdict, sheets and Minutes only when every expected sheet is verified. */
  resultsVisible: boolean;
  entries: (typeof evaluationEntry.$inferSelect & { total: number | null })[];
  minutes: { body: string; issuedAt: Date } | null;
  warnings: { memberUserId: string; actionTaken: Verdict }[];
};

/**
 * FR-DEF-11, FR-DEF-12, BR-11, BR-15: every attempt with its date, room, verdict, sheets and Minutes.
 * The Coordinator sees all. A Student sees results when every expected sheet is verified. An evaluator
 * sees their own sheet and the verdict. The total is the plain sum, never a grade.
 */
export async function listAttempts(ctx: DataContext, milestoneId: string): Promise<AttemptView[]> {
  const mctx = await loadMilestone(ctx, milestoneId);
  const { role, userId } = ctx.actor;
  const attempts = await ctx.db
    .select()
    .from(defenseAttempt)
    .where(eq(defenseAttempt.milestoneInstanceId, milestoneId))
    .orderBy(asc(defenseAttempt.attemptNo));
  const out: AttemptView[] = [];
  for (const attempt of attempts) {
    const all = await ctx.db.select().from(evaluationEntry).where(eq(evaluationEntry.defenseAttemptId, attempt.id));
    const expected = await expectedEvaluatorsFor(ctx.db, mctx, attempt.id);
    const visible = resultsVisible(expected, all);
    const shown =
      role === "coordinator" ? all : role === "student" ? (visible ? all : []) : all.filter((e) => e.memberUserId === userId);
    const ids = shown.map((e) => e.id);
    const scores = ids.length ? await ctx.db.select().from(evaluationScore).where(inArray(evaluationScore.evaluationEntryId, ids)) : [];
    const [m] = await ctx.db.select().from(minutes).where(eq(minutes.defenseAttemptId, attempt.id));
    const minutesShown = m?.issuedAt && (role !== "student" || visible) ? { body: m.body, issuedAt: m.issuedAt } : null;
    const verdictShown = role === "student" && !visible ? { ...attempt, verdict: null, verdictByUserId: null, verdictAt: null } : attempt;
    out.push({
      attempt: verdictShown,
      resultsVisible: visible,
      entries: shown.map((e) => {
        const mine = scores.filter((s) => s.evaluationEntryId === e.id).map((s) => ({ indicatorId: s.rubricIndicatorId, score: Number(s.score) }));
        return { ...e, total: mine.length ? rubricTotal(mine) : null };
      }),
      minutes: minutesShown,
      warnings: role === "coordinator" || role === "panel_member" ? actionTakenWarnings(attempt.verdict, all) : [],
    });
  }
  return out;
}

// The next attempt number is also the count of attempts so far plus one (FR-DEF-12).
export async function attemptCount(ctx: DataContext, milestoneId: string): Promise<number> {
  await loadMilestone(ctx, milestoneId);
  const [r] = await ctx.db.select({ n: max(defenseAttempt.attemptNo) }).from(defenseAttempt).where(eq(defenseAttempt.milestoneInstanceId, milestoneId));
  return r?.n ?? 0;
}
