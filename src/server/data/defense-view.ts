// The Coordinator's defense page data (C6): the attempt, the expected sheets with their scan state,
// the verdict, the Minutes, and why "Close the stage" or "Record the Certification" is blocked.
// FR-DEF-05 to FR-DEF-10, FR-WFL-06, NFR-01, BR-11, BR-12, BR-15, BR-18. Server only. Coordinator only.
import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { MatchResult } from "@/server/domain/evaluation";
import type { MilestoneCode, MilestoneStatus, Verdict } from "@/server/domain/milestone";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { InputProblem } from "./coordinator";
import { listAttempts } from "./defense";
import { expectedEvaluatorsFor, loadMilestoneContext } from "./milestone-facts";
import { checkTransition } from "./milestones";
import { appUser, defenseAttempt } from "./schema";
import { requireThesisRead } from "./scope";

export type SheetRow = {
  memberUserId: string;
  name: string;
  /** Null until the member saves the sheet. */
  entryId: string | null;
  actionTaken: Verdict | null;
  /** The plain sum of the scores, or null (BR-15: never a grade). */
  total: number | null;
  hasScan: boolean;
  sheetMatch: MatchResult;
  verified: boolean;
  /** Why "Verify" and "Mismatch" are blocked now (BR-18), or null. */
  verifyBlockedReason: string | null;
};

export type DefenseDetail = {
  attemptId: string;
  attemptNo: number;
  attemptStatus: "proposed" | "scheduled" | "held" | "closed";
  milestoneId: string;
  milestone: MilestoneCode;
  milestoneStatus: MilestoneStatus;
  studentName: string;
  scheduledStartAt: Date | null;
  roomOrLink: string | null;
  verdict: Verdict | null;
  sheets: SheetRow[];
  minutes: { body: string; issuedAt: Date } | null;
  /** Why "Issue the Minutes" is blocked now, or null. */
  minutesBlockedReason: string | null;
  /** Why "Close the stage" is blocked now, or null. */
  closeBlockedReason: string | null;
  /** The Certification step follows a closed Proposal (FR-WFL-06). Null when it is open, "none" is not used. */
  certifyBlockedReason: string | null;
  showCertify: boolean;
};

export async function defenseDetail(ctx: DataContext, attemptId: string): Promise<DefenseDetail> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") throw new AccessDeniedError("only the Coordinator reads the defense page");
  const [attempt] = await ctx.db.select().from(defenseAttempt).where(eq(defenseAttempt.id, attemptId));
  if (!attempt) throw new InputProblem("This defense attempt does not exist.");
  const mctx = await loadMilestoneContext(ctx.db, attempt.milestoneInstanceId);
  if (!mctx) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, mctx.thesis.id);

  const view = (await listAttempts(ctx, mctx.milestone.id)).find((v) => v.attempt.id === attemptId);
  const expected = await expectedEvaluatorsFor(ctx.db, mctx, attemptId);
  const people = await ctx.db
    .select({ id: appUser.id, name: appUser.fullName })
    .from(appUser)
    .where(inArray(appUser.id, [...expected, mctx.thesis.studentUserId]));
  const nameOf = new Map(people.map((p) => [p.id, p.name]));

  const sheets: SheetRow[] = expected.map((memberUserId) => {
    const e = view?.entries.find((x) => x.memberUserId === memberUserId) ?? null;
    const verified = !!e?.verifiedAt;
    return {
      memberUserId,
      name: nameOf.get(memberUserId) ?? "",
      entryId: e?.id ?? null,
      actionTaken: e?.actionTaken ?? null,
      total: e?.total ?? null,
      hasScan: !!e?.sheetFileKey,
      sheetMatch: (e?.sheetMatch ?? "pending") as MatchResult,
      verified,
      verifyBlockedReason: !e
        ? "The member has not saved the sheet yet."
        : verified
          ? "This sheet is verified. It cannot change."
          : !e.sheetFileKey
            ? "Upload the signed scan first."
            : !e.actionTaken
              ? "The sheet has no Action Taken."
              : attempt.status === "closed"
                ? "The defense of this sheet is closed."
                : null,
    };
  });

  const status = mctx.milestone.status;
  const minutesIssued = !!view?.minutes;
  const closeBlockedReason =
    status === "DEFENSE_HELD"
      ? await reasonOf(ctx, mctx.milestone.id, "CLOSED")
      : status === "DEFENSE_SCHEDULED"
        ? "The defense is not held yet. The Lead Panel Member or the Panel Chair marks it held after the verdict."
        : status === "CLOSED" || status === "CERTIFIED" || status === "FINAL_APPROVED" || status === "CLEARED"
          ? "The stage is closed."
          : "The defense is not scheduled.";
  const showCertify = mctx.code === "proposal" && (status === "CLOSED" || status === "CERTIFIED");

  return {
    attemptId,
    attemptNo: attempt.attemptNo,
    attemptStatus: attempt.status,
    milestoneId: mctx.milestone.id,
    milestone: mctx.code,
    milestoneStatus: status,
    studentName: nameOf.get(mctx.thesis.studentUserId) ?? "",
    scheduledStartAt: attempt.scheduledStartAt,
    roomOrLink: attempt.roomOrLink,
    verdict: view?.attempt.verdict ?? null,
    sheets,
    minutes: view?.minutes ?? null,
    minutesBlockedReason: minutesIssued
      ? "The Minutes are issued already."
      : attempt.status !== "held"
        ? "The Minutes follow a held defense."
        : null,
    closeBlockedReason,
    certifyBlockedReason: status === "CERTIFIED" ? "The Proposal is certified already." : status === "CLOSED" ? await reasonOf(ctx, mctx.milestone.id, "CERTIFIED") : null,
    showCertify,
  };
}

async function reasonOf(ctx: DataContext, milestoneId: string, to: MilestoneStatus): Promise<string | null> {
  const d = await checkTransition(ctx, milestoneId, to);
  return d.ok ? null : d.reason;
}
