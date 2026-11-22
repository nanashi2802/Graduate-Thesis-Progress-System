// The facts that the milestone guards read (ERD §4.2, `MilestoneFacts` in src/server/domain/milestone.ts).
// Call only after an access check. Server only.
import "server-only";
import { and, desc, eq, gt, inArray, isNotNull, max, ne } from "drizzle-orm";
import { checklistComplete } from "@/server/domain/checklist";
import { committeeKindFor, type DegreeLevel } from "@/server/domain/committee";
import { expectedEvaluators, sheetsVerifiedAndMatched as sheetsVerifiedAndMatchedRule } from "@/server/domain/evaluation";
import type { DocumentState } from "@/server/domain/documents";
import type { MilestoneCode, MilestoneFacts, Verdict } from "@/server/domain/milestone";
import { pstDate } from "@/server/notify/time";
import type { Db } from "./db";
import { currentOutsideStatuses } from "./outside";
import {
  committee,
  committeeMember,
  critiqueThread,
  defenseAttempt,
  defenseSubstitute,
  documentRecord,
  evaluationEntry,
  gateAction,
  manuscriptCommit,
  milestoneInstance,
  minutes,
  revisionAcceptance,
  revisionItem,
  submissionPr,
  templateVersion,
  thesisInstance,
} from "./schema";

export type MilestoneContext = {
  milestone: typeof milestoneInstance.$inferSelect;
  thesis: typeof thesisInstance.$inferSelect;
  code: MilestoneCode;
  degreeLevel: DegreeLevel;
  pr: typeof submissionPr.$inferSelect | undefined;
  /** The Adviser and the accepted Panel Members who endorse at Gate 1b (FR-WFL-04). */
  committeeId: string | null;
  memberIds: string[];
  latestAttempt: typeof defenseAttempt.$inferSelect | undefined;
};

export async function loadMilestoneContext(db: Db, milestoneId: string): Promise<MilestoneContext | null> {
  const [row] = await db
    .select({ milestone: milestoneInstance, thesis: thesisInstance })
    .from(milestoneInstance)
    .innerJoin(thesisInstance, eq(thesisInstance.id, milestoneInstance.thesisInstanceId))
    .where(eq(milestoneInstance.id, milestoneId));
  if (!row) return null;
  const code = row.milestone.milestoneCode;
  const [pr] = await db.select().from(submissionPr).where(eq(submissionPr.milestoneInstanceId, milestoneId));
  // Milestone 2 reuses the Evaluation Committee (FR-CMT-01).
  const kind = committeeKindFor(code) ?? "evaluation_committee";
  const [com] = await db
    .select()
    .from(committee)
    .where(and(eq(committee.thesisInstanceId, row.thesis.id), eq(committee.kind, kind)));
  const seats = com
    ? await db
        .select({ userId: committeeMember.memberUserId })
        .from(committeeMember)
        .where(and(eq(committeeMember.committeeId, com.id), eq(committeeMember.status, "accepted")))
    : [];
  const [latestAttempt] = await db
    .select()
    .from(defenseAttempt)
    .where(eq(defenseAttempt.milestoneInstanceId, milestoneId))
    .orderBy(desc(defenseAttempt.attemptNo))
    .limit(1);
  return {
    milestone: row.milestone,
    thesis: row.thesis,
    code,
    degreeLevel: row.thesis.degreeLevel,
    pr,
    committeeId: com?.id ?? null,
    memberIds: seats.map((s) => s.userId),
    latestAttempt,
  };
}

// A Return starts a new round: Gate 1b rows before the last Return no longer count (AD-A-018).
export async function lastReturnGateId(db: Db, milestoneId: string): Promise<number> {
  const [row] = await db
    .select({ id: max(gateAction.id) })
    .from(gateAction)
    .where(and(eq(gateAction.milestoneInstanceId, milestoneId), eq(gateAction.result, "returned")));
  return row?.id ?? 0;
}

// The users who complete a sheet for one attempt (FR-DEF-06, FR-CMT-06).
export async function expectedEvaluatorsFor(db: Db, ctx: MilestoneContext, attemptId: string): Promise<string[]> {
  const subs = await db
    .select({ absent: committeeMember.memberUserId, substitute: defenseSubstitute.substituteUserId })
    .from(defenseSubstitute)
    .innerJoin(committeeMember, eq(committeeMember.id, defenseSubstitute.absentMemberId))
    .where(eq(defenseSubstitute.defenseAttemptId, attemptId));
  return expectedEvaluators({
    milestone: ctx.code,
    adviserUserId: ctx.thesis.adviserUserId,
    memberUserIds: ctx.memberIds,
    substitutes: subs.map((x) => ({ absentUserId: x.absent, substituteUserId: x.substitute })),
  });
}

const formKey = (code: string) => code.replace("_", " ");

export async function loadMilestoneFacts(db: Db, ctx: MilestoneContext, now: Date = new Date()): Promise<MilestoneFacts> {
  const { milestone, code, pr, latestAttempt } = ctx;
  const outside = await currentOutsideStatuses(db, milestone.id);
  const [version] = await db.select().from(templateVersion).where(eq(templateVersion.id, milestone.templateVersionId));

  const adviserOpenThreads = pr
    ? (
        await db
          .select({ id: critiqueThread.id })
          .from(critiqueThread)
          .innerJoin(manuscriptCommit, eq(manuscriptCommit.id, critiqueThread.commitId))
          .where(
            and(
              eq(manuscriptCommit.submissionPrId, pr.id),
              eq(critiqueThread.authorUserId, ctx.thesis.adviserUserId),
              eq(critiqueThread.state, "OPEN"),
            ),
          )
      ).length
    : 0;

  const docs = await db.select().from(documentRecord).where(eq(documentRecord.milestoneInstanceId, milestone.id));
  const docState = (form: string) => docs.find((d) => d.formCode === form)?.state as DocumentState | undefined;
  const documents: Record<string, DocumentState | undefined> = {};
  for (const d of docs) documents[formKey(d.formCode)] = d.state as DocumentState;

  // The appointment form and the NDA of each seat that is not declined: a proposed seat with no answer
  // blocks the record (FR-CMT-04). Gate 1b counts accepted seats only (`memberIds`).
  // The appointment form and the NDA of each seat that is not declined (BR-08, FR-CMT-04). A proposed seat
  // with no answer blocks the record. Gate 1b counts accepted seats only (`memberIds`).
  let appointmentAndNdasRecorded = false;
  let ndas: DocumentState[] = [];
  if (ctx.committeeId) {
    const [com] = await db.select().from(committee).where(eq(committee.id, ctx.committeeId));
    const seatNdas = await db
      .select({ state: documentRecord.state })
      .from(committeeMember)
      .leftJoin(documentRecord, eq(documentRecord.id, committeeMember.ndaDocumentId))
      .where(and(eq(committeeMember.committeeId, ctx.committeeId), ne(committeeMember.status, "declined")));
    ndas = seatNdas.map((s) => (s.state ?? "not_started") as DocumentState);
    const [form] = com?.appointmentDocumentId
      ? await db.select().from(documentRecord).where(eq(documentRecord.id, com.appointmentDocumentId))
      : [];
    appointmentAndNdasRecorded =
      !!com?.appointedAt && form?.state === "verified" && ndas.length > 0 && ndas.every((s) => s === "verified");
  }

  // Gate 1b complete: the Adviser and every accepted member endorsed the same commit (ERD §4.2).
  const endorsers = [ctx.thesis.adviserUserId, ...ctx.memberIds];
  let gate1bComplete = false;
  let gate1bCompletedOn: string | null = null;
  if (pr?.readyCommitId && ctx.memberIds.length > 0) {
    const sinceReturn = await lastReturnGateId(db, milestone.id);
    const rows = await db
      .select({ actor: gateAction.actorUserId, at: gateAction.createdAt })
      .from(gateAction)
      .where(
        and(
          eq(gateAction.milestoneInstanceId, milestone.id),
          eq(gateAction.gate, "gate_1b"),
          eq(gateAction.result, "endorsed"),
          eq(gateAction.commitId, pr.readyCommitId),
          gt(gateAction.id, sinceReturn),
        ),
      );
    gate1bComplete = endorsers.every((id) => rows.some((r) => r.actor === id));
    if (gate1bComplete) {
      const last = rows.filter((r) => endorsers.includes(r.actor)).reduce((a, b) => (a.at > b.at ? a : b));
      gate1bCompletedOn = pstDate(last.at);
    }
  }

  // The latest defense attempt: date, verdict, sheets, Minutes, revision items.
  let sheetsVerifiedAndMatched = false;
  let minutesIssued = false;
  let revisionItemsAllAccepted = true;
  if (latestAttempt) {
    const entries = await db.select().from(evaluationEntry).where(eq(evaluationEntry.defenseAttemptId, latestAttempt.id));
    // TDW 08 and TDW 10: the Adviser and each member. TDW 13: the Final Panel only (Unified §2.5).
    // A substitute takes the sheet of the absent member (FR-CMT-06, AD-A-021).
    const expected = await expectedEvaluatorsFor(db, ctx, latestAttempt.id);
    sheetsVerifiedAndMatched = sheetsVerifiedAndMatchedRule(expected, entries);
    const issued = await db
      .select({ id: minutes.id })
      .from(minutes)
      .where(and(eq(minutes.defenseAttemptId, latestAttempt.id), isNotNull(minutes.issuedAt)));
    minutesIssued = issued.length > 0;
    const items = await db.select({ id: revisionItem.id }).from(revisionItem).where(eq(revisionItem.defenseAttemptId, latestAttempt.id));
    if (items.length > 0) {
      const accepted = await db
        .select()
        .from(revisionAcceptance)
        .where(inArray(revisionAcceptance.revisionItemId, items.map((i) => i.id)));
      revisionItemsAllAccepted = items.every((i) =>
        endorsers.every((u) => accepted.some((a) => a.revisionItemId === i.id && a.memberUserId === u)),
      );
    }
  }

  // Gate 2: every Final Panel member approved (FR-WFL-07).
  let gate2Complete = false;
  if (code === "final" && ctx.memberIds.length > 0) {
    const rows = await db
      .select({ actor: gateAction.actorUserId })
      .from(gateAction)
      .where(and(eq(gateAction.milestoneInstanceId, milestone.id), eq(gateAction.gate, "gate_2"), eq(gateAction.result, "approved")));
    gate2Complete = ctx.memberIds.every((id) => rows.some((r) => r.actor === id));
  }

  return {
    hasReadyCommit: !!pr?.readyCommitId,
    adviserOpenThreads,
    ipmo: outside.ipmo,
    rpo: outside.rpo,
    returnReason: null,
    appointmentAndNdasRecorded,
    gate1bComplete,
    gate1bCompletedOn,
    minNoticeDays: version?.minNoticeDays ?? 7,
    proposedDate: latestAttempt?.proposedDate ?? null,
    defenseChecklistComplete: checklistComplete(code, {
      documents,
      ndas,
      officialReceipt: docState("OR"),
      ethics: outside.ethics,
      ipmo: outside.ipmo,
    }),
    defenseDate: latestAttempt?.scheduledStartAt ? pstDate(latestAttempt.scheduledStartAt) : null,
    today: pstDate(now),
    verdict: (latestAttempt?.verdict ?? null) as Verdict | null,
    sheetsVerifiedAndMatched,
    minutesIssued,
    documentInMismatch: docs.some((d) => d.state === "mismatch"),
    revisionItemsAllAccepted,
    certificationVerified: docState("CERTIFICATION") === "verified",
    gate2Complete,
    signedFinalManuscriptVerified: docState("SIGNED_FINAL_MANUSCRIPT") === "verified",
    // P3-E04 adds `clearance_item`. Until then no milestone can be CLEARED.
    clearanceItemsAllVerified: false,
  };
}
