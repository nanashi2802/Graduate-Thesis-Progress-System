// The Student tracker (S1): identity card, stepper, next action, readiness checklist, outside
// statuses, defense card and key dates. FR-TRK-01, FR-TRK-05, NFR-01, NFR-04, BR-09, BR-17, BR-18.
// Server only. A Student reads their own thesis only (ERD §8). Flags never block (BR-17).
import "server-only";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { complianceChecklist, type ChecklistItem } from "@/server/domain/checklist";
import { addDays, type MilestoneCode, type MilestoneStatus, type PstDate } from "@/server/domain/milestone";
import type { DocumentState } from "@/server/domain/documents";
import { nextAction, type NextAction } from "@/server/domain/next-action";
import { pstDate } from "@/server/notify/time";
import { requireActive, AccessDeniedError, type DataContext } from "./access";
import { printedCopyStatus } from "./defense";
import { loadMilestoneContext, loadMilestoneFacts } from "./milestone-facts";
import { currentOutsideStatuses, type OutsideStatuses } from "./outside";
import { requireThesisRead } from "./scope";
import {
  appUser,
  committee,
  committeeMember,
  defenseAttempt,
  documentRecord,
  milestoneInstance,
  thesisInstance,
} from "./schema";

export type StudentTracker = {
  identity: {
    title: string | null;
    degreeLevel: "masters" | "doctoral";
    adviserName: string;
    /** Names of the accepted Panel Members of the committee or the Final Panel, once appointed. */
    committeeNames: string[];
  };
  stepper: { id: string; code: MilestoneCode; status: MilestoneStatus; current: boolean }[];
  current: { milestoneId: string; code: MilestoneCode; status: MilestoneStatus };
  next: NextAction;
  checklist: ChecklistItem[];
  outside: OutsideStatuses;
  /** After the Coordinator confirms the date (FR-DEF-03). */
  defense: { date: PstDate; roomOrLink: string | null; printedCopiesDue: PstDate } | null;
  keyDates: { earliestDefenseDate: PstDate | null; printedCopiesDue: PstDate | null; targetDate: PstDate | null };
};

const formKey = (code: string) => code.replace("_", " ");

type Db = DataContext["db"];

// The readiness checklist (FR-DOC-08), the same list as the date confirmation. Call only after an access check.
async function loadChecklist(db: Db, milestoneId: string, code: MilestoneCode, committeeId: string | null) {
  const docs = await db.select().from(documentRecord).where(eq(documentRecord.milestoneInstanceId, milestoneId));
  const documents: Record<string, DocumentState | undefined> = {};
  for (const d of docs) documents[formKey(d.formCode)] = d.state as DocumentState;
  const seatNdas = committeeId
    ? await db
        .select({ ndaDocumentId: committeeMember.ndaDocumentId })
        .from(committeeMember)
        .where(and(eq(committeeMember.committeeId, committeeId), ne(committeeMember.status, "declined")))
    : [];
  const ndas = seatNdas.map((s) => (docs.find((d) => d.id === s.ndaDocumentId)?.state ?? "not_started") as DocumentState);
  const outside = await currentOutsideStatuses(db, milestoneId);
  const checklist = complianceChecklist(code, {
    documents,
    ndas,
    officialReceipt: docs.find((d) => d.formCode === "OR")?.state as DocumentState | undefined,
    ethics: outside.ethics,
    ipmo: outside.ipmo,
  });
  return { checklist, outside };
}

/** The FR-DOC-08 list of one milestone, for a reader of the thesis. C5 names the missing items from it (BR-18). */
export async function readinessChecklist(ctx: DataContext, milestoneId: string): Promise<ChecklistItem[]> {
  requireActive(ctx.actor);
  const mctx = await loadMilestoneContext(ctx.db, milestoneId);
  if (!mctx) throw new AccessDeniedError("no access to this milestone");
  await requireThesisRead(ctx, mctx.thesis.id);
  return (await loadChecklist(ctx.db, milestoneId, mctx.code, mctx.committeeId)).checklist;
}

/** The S1 regions for the signed-in Student. Any other role is refused (NFR-01). */
export async function studentTracker(ctx: DataContext, now: Date = new Date()): Promise<StudentTracker | null> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "student") throw new AccessDeniedError("only a Student reads the Student tracker");
  const [thesis] = await ctx.db.select().from(thesisInstance).where(eq(thesisInstance.studentUserId, ctx.actor.userId));
  if (!thesis) return null;

  const milestones = await ctx.db
    .select()
    .from(milestoneInstance)
    .where(eq(milestoneInstance.thesisInstanceId, thesis.id))
    .orderBy(asc(milestoneInstance.openedAt));
  const current = milestones.at(-1);
  if (!current) return null;
  const mctx = await loadMilestoneContext(ctx.db, current.id);
  if (!mctx) return null;
  const code = current.milestoneCode;
  const facts = await loadMilestoneFacts(ctx.db, mctx, now);
  const [adviser] = await ctx.db.select({ name: appUser.fullName }).from(appUser).where(eq(appUser.id, thesis.adviserUserId));

  // Appointed committee or Final Panel members (names only).
  const appointed = await ctx.db
    .select({ name: appUser.fullName })
    .from(committeeMember)
    .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
    .innerJoin(appUser, eq(appUser.id, committeeMember.memberUserId))
    .where(and(eq(committee.thesisInstanceId, thesis.id), eq(committeeMember.status, "accepted")))
    .orderBy(asc(appUser.fullName));

  const { checklist, outside } = await loadChecklist(ctx.db, current.id, code, mctx.committeeId);

  // The defense card shows after the date is confirmed (FR-DEF-03): the latest attempt with a start time.
  const [scheduled] = await ctx.db
    .select()
    .from(defenseAttempt)
    .where(and(eq(defenseAttempt.milestoneInstanceId, current.id), inArray(defenseAttempt.status, ["scheduled", "held"])))
    .orderBy(desc(defenseAttempt.attemptNo))
    .limit(1);
  const defenseDate = scheduled?.scheduledStartAt ? pstDate(scheduled.scheduledStartAt) : null;
  // The due date follows the template value (BR-09, FR-DEF-04), the same as the Coordinator screen.
  const printedCopiesDue = scheduled ? (await printedCopyStatus(ctx, scheduled.id, now)).dueDate : null;

  return {
    identity: {
      title: thesis.title,
      degreeLevel: thesis.degreeLevel,
      adviserName: adviser?.name ?? "",
      committeeNames: appointed.map((a) => a.name),
    },
    stepper: milestones.map((m) => ({ id: m.id, code: m.milestoneCode, status: m.status, current: m.id === current.id })),
    current: { milestoneId: current.id, code, status: current.status },
    next: nextAction(code, current.status, {
      returnReason: current.returnReason,
      minNoticeDays: facts.minNoticeDays,
      defenseDate,
      dataGatheringApproved: current.dataGatheringApprovedAt !== null,
    }),
    checklist,
    outside,
    defense: defenseDate && printedCopiesDue ? { date: defenseDate, roomOrLink: scheduled!.roomOrLink, printedCopiesDue } : null,
    keyDates: {
      earliestDefenseDate: facts.gate1bCompletedOn ? addDays(facts.gate1bCompletedOn, facts.minNoticeDays) : null,
      printedCopiesDue,
      targetDate: current.targetDate,
    },
  };
}
