// The Adviser dashboard (A1) and the Panel Member dashboard (P1): action queue, roster, assignments.
// FR-TRK-02, FR-TRK-03, FR-TRK-06, NFR-01, NFR-04, BR-08, BR-17, BR-18. Server only.
// Each role reads its own rows only (ERD §8). A pacing flag is information only (BR-17).
import "server-only";
import { and, asc, eq, gt, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Designation, MilestoneCode, MilestoneStatus, PstDate } from "@/server/domain/milestone";
import { pstDate } from "@/server/notify/time";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { listBookings } from "./consultations";
import { lastReturnGateId } from "./milestone-facts";
import {
  appUser,
  committee,
  committeeMember,
  defenseAttempt,
  defenseSubstitute,
  documentRecord,
  evaluationEntry,
  gateAction,
  milestoneInstance,
  submissionPr,
  templateRequiredItem,
  thesisInstance,
} from "./schema";
import { canReadManuscript } from "./scope";

const DAY_MS = 86_400_000;
// A pacing flag shows while the milestone is before its close and the target date has passed (FR-TRK-06).
const FLAG_DONE: MilestoneStatus[] = ["CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED"];

function requireRole(ctx: DataContext, role: "adviser" | "panel_member"): void {
  requireActive(ctx.actor);
  if (ctx.actor.role !== role) throw new AccessDeniedError(`only a ${role === "adviser" ? "Adviser" : "Panel Member"} reads this dashboard`);
}

// ---- Adviser (A1) ----

export type AdviserQueueKind = "gate_1a" | "gate_1b" | "data_gathering" | "tdw03" | "consultation_request";

export const ADVISER_QUEUE_LABEL: Record<AdviserQueueKind, string> = {
  gate_1a: "Review a Ready commit (Gate 1a)",
  gate_1b: "Endorse a commit (Gate 1b)",
  data_gathering: "Approve data gathering",
  tdw03: "Upload the TDW 03 scan",
  consultation_request: "Answer a consultation request",
};

export type AdviserQueueItem = {
  kind: AdviserQueueKind;
  thesisId: string;
  /** The submission PR of the milestone, for the link to the review page. Null when none exists. */
  prId: string | null;
  milestoneId: string | null;
  studentName: string;
  milestone: MilestoneCode | null;
  since: Date;
  daysWaiting: number;
};

export type AdviseeRow = {
  thesisId: string;
  studentName: string;
  milestone: MilestoneCode;
  status: MilestoneStatus;
  targetDate: PstDate | null;
  pacingFlag: boolean;
};

export type AdviserDashboard = { queue: AdviserQueueItem[]; advisees: AdviseeRow[] };

const PRE_DEFENSE: MilestoneStatus[] = ["READY", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED", "COMMITTEE_ENDORSED", "DATE_PROPOSED"];

export async function adviserDashboard(ctx: DataContext, now: Date = new Date()): Promise<AdviserDashboard> {
  requireRole(ctx, "adviser");
  const student = alias(appUser, "student");
  const rows = await ctx.db
    .select({
      thesisId: thesisInstance.id,
      studentName: student.fullName,
      milestoneId: milestoneInstance.id,
      code: milestoneInstance.milestoneCode,
      status: milestoneInstance.status,
      targetDate: milestoneInstance.targetDate,
      openedAt: milestoneInstance.openedAt,
      templateVersionId: milestoneInstance.templateVersionId,
      dataGatheringApprovedAt: milestoneInstance.dataGatheringApprovedAt,
      prId: submissionPr.id,
      readyCommitId: submissionPr.readyCommitId,
    })
    .from(milestoneInstance)
    .innerJoin(thesisInstance, eq(thesisInstance.id, milestoneInstance.thesisInstanceId))
    .innerJoin(student, eq(student.id, thesisInstance.studentUserId))
    .leftJoin(submissionPr, eq(submissionPr.milestoneInstanceId, milestoneInstance.id))
    .where(eq(thesisInstance.adviserUserId, ctx.actor.userId))
    .orderBy(asc(student.fullName), asc(milestoneInstance.openedAt));

  const daysSince = (d: Date) => Math.max(0, Math.floor((now.getTime() - d.getTime()) / DAY_MS));
  const queue: AdviserQueueItem[] = [];
  const add = (kind: AdviserQueueKind, r: (typeof rows)[number], since: Date) =>
    queue.push({ kind, thesisId: r.thesisId, prId: r.prId, milestoneId: r.milestoneId, studentName: r.studentName, milestone: r.code, since, daysWaiting: daysSince(since) });

  const ids = rows.map((r) => r.milestoneId);
  const gates = ids.length ? await ctx.db.select().from(gateAction).where(inArray(gateAction.milestoneInstanceId, ids)) : [];
  const lastGateAt = (id: string, fallback: Date) => gates.filter((g) => g.milestoneInstanceId === id).reduce<Date>((a, g) => (g.createdAt > a ? g.createdAt : a), fallback);
  const docs = ids.length ? await ctx.db.select().from(documentRecord).where(inArray(documentRecord.milestoneInstanceId, ids)) : [];

  for (const r of rows) {
    const since = lastGateAt(r.milestoneId, r.openedAt);
    if (r.status === "READY") add("gate_1a", r, since);
    const gate1bOpen = r.status === "COMMITTEE_APPOINTED" || (r.status === "ADVISER_ENDORSED" && r.code === "pre_final");
    if (gate1bOpen && r.readyCommitId) {
      const sinceReturn = await lastReturnGateId(ctx.db, r.milestoneId);
      const own = gates.some(
        (g) => g.milestoneInstanceId === r.milestoneId && g.gate === "gate_1b" && g.actorUserId === ctx.actor.userId && g.commitId === r.readyCommitId && g.id > sinceReturn,
      );
      if (!own) add("gate_1b", r, since);
    }
    if (r.code === "proposal" && r.status === "CERTIFIED" && !r.dataGatheringApprovedAt) add("data_gathering", r, since);
    if (PRE_DEFENSE.includes(r.status)) {
      // The template item that the Adviser uploads (TDW 03). The record must be a locked scan or later.
      const [item] = await ctx.db
        .select({ id: templateRequiredItem.id })
        .from(templateRequiredItem)
        .where(and(eq(templateRequiredItem.templateVersionId, r.templateVersionId), eq(templateRequiredItem.formCode, "TDW_03"), eq(templateRequiredItem.uploaderRole, "adviser")));
      const done = docs.some((d) => d.milestoneInstanceId === r.milestoneId && d.formCode === "TDW_03" && d.state !== "not_started" && d.state !== "prepared");
      if (item && !done) add("tdw03", r, r.openedAt);
    }
  }

  // Consultation requests on the Adviser's own slots (FR-SCH-02).
  const nameOf = new Map(rows.map((r) => [r.thesisId, r.studentName]));
  for (const b of await listBookings(ctx)) {
    if (b.booking.status !== "pending") continue;
    const thesisId = b.booking.thesisInstanceId;
    queue.push({
      kind: "consultation_request",
      thesisId,
      prId: null,
      milestoneId: null,
      studentName: nameOf.get(thesisId) ?? "",
      milestone: null,
      since: b.booking.requestedAt ?? now,
      daysWaiting: daysSince(b.booking.requestedAt ?? now),
    });
  }
  queue.sort((a, b) => b.daysWaiting - a.daysWaiting || a.studentName.localeCompare(b.studentName));

  const today = pstDate(now);
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) latest.set(r.thesisId, r);
  return {
    queue,
    advisees: [...latest.values()].map((r) => ({
      thesisId: r.thesisId,
      studentName: r.studentName,
      milestone: r.code,
      status: r.status,
      targetDate: r.targetDate,
      pacingFlag: !!r.targetDate && r.targetDate < today && !FLAG_DONE.includes(r.status),
    })),
  };
}

// ---- Panel Member (P1) ----

export type Assignment = {
  thesisId: string;
  prId: string | null;
  milestoneId: string;
  studentName: string;
  milestone: MilestoneCode;
  status: MilestoneStatus;
  designation: Designation;
  isSubstitute: boolean;
  /** BR-08: the manuscript opens after the verified form and the member's verified NDA. */
  access: { open: true } | { open: false; reason: string };
  /** One sentence, or null when nothing is due. */
  actionRequired: string | null;
  defense: { startsAt: Date; roomOrLink: string | null } | null;
};

export type PanelDashboard = { assignments: Assignment[] };

export async function panelDashboard(ctx: DataContext, now: Date = new Date()): Promise<PanelDashboard> {
  requireRole(ctx, "panel_member");
  const me = ctx.actor.userId;
  const student = alias(appUser, "student");
  // Seats that are not declined, and substitute seats. One assignment for each thesis (the committee applies to its milestones).
  const seats = await ctx.db
    .select({ thesisId: committee.thesisInstanceId, kind: committee.kind, designation: committeeMember.designation })
    .from(committeeMember)
    .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
    .where(and(eq(committeeMember.memberUserId, me), ne(committeeMember.status, "declined")));
  const subs = await ctx.db
    .select({ thesisId: milestoneInstance.thesisInstanceId, milestoneId: milestoneInstance.id })
    .from(defenseSubstitute)
    .innerJoin(defenseAttempt, eq(defenseAttempt.id, defenseSubstitute.defenseAttemptId))
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, defenseAttempt.milestoneInstanceId))
    .where(eq(defenseSubstitute.substituteUserId, me));
  const thesisIds = [...new Set([...seats.map((s) => s.thesisId), ...subs.map((s) => s.thesisId)])];
  if (thesisIds.length === 0) return { assignments: [] };

  const ms = await ctx.db
    .select({
      thesisId: milestoneInstance.thesisInstanceId,
      milestoneId: milestoneInstance.id,
      code: milestoneInstance.milestoneCode,
      status: milestoneInstance.status,
      studentName: student.fullName,
      prId: submissionPr.id,
      readyCommitId: submissionPr.readyCommitId,
    })
    .from(milestoneInstance)
    .innerJoin(thesisInstance, eq(thesisInstance.id, milestoneInstance.thesisInstanceId))
    .innerJoin(student, eq(student.id, thesisInstance.studentUserId))
    .leftJoin(submissionPr, eq(submissionPr.milestoneInstanceId, milestoneInstance.id))
    .where(inArray(milestoneInstance.thesisInstanceId, thesisIds))
    .orderBy(asc(milestoneInstance.openedAt));

  const out: Assignment[] = [];
  for (const thesisId of thesisIds) {
    const own = ms.filter((m) => m.thesisId === thesisId);
    const seat = seats.find((s) => s.thesisId === thesisId);
    const isSubstitute = !seat;
    // The Final Panel sits at Milestone 3. The Evaluation Committee sits at Milestones 1 and 2 (FR-CMT-01).
    const applies = (code: MilestoneCode) => (isSubstitute ? subs.some((s) => own.find((m) => m.milestoneId === s.milestoneId)?.code === code) : seat!.kind === "final_panel" ? code === "final" : code !== "final");
    const m = [...own].reverse().find((x) => applies(x.code));
    if (!m) continue;

    const access = await canReadManuscript(ctx, thesisId);
    const [attempt] = await ctx.db
      .select()
      .from(defenseAttempt)
      .where(and(eq(defenseAttempt.milestoneInstanceId, m.milestoneId), inArray(defenseAttempt.status, ["scheduled", "held"])))
      .orderBy(asc(defenseAttempt.attemptNo))
      .limit(1);
    const startsAt = attempt?.scheduledStartAt ?? null;
    const dayReached = !!startsAt && pstDate(now) >= pstDate(startsAt);

    let actionRequired: string | null = null;
    if (access.ok && m.readyCommitId && (m.status === "COMMITTEE_APPOINTED" || (m.status === "ADVISER_ENDORSED" && m.code === "pre_final"))) {
      const sinceReturn = await lastReturnGateId(ctx.db, m.milestoneId);
      const [done] = await ctx.db
        .select({ id: gateAction.id })
        .from(gateAction)
        .where(and(eq(gateAction.milestoneInstanceId, m.milestoneId), eq(gateAction.gate, "gate_1b"), eq(gateAction.actorUserId, me), eq(gateAction.commitId, m.readyCommitId), gt(gateAction.id, sinceReturn)));
      if (!done) actionRequired = "Review the commit and endorse it (Gate 1b).";
    }
    if (m.status === "DEFENSE_SCHEDULED" && attempt && dayReached) {
      const [entry] = await ctx.db
        .select()
        .from(evaluationEntry)
        .where(and(eq(evaluationEntry.defenseAttemptId, attempt.id), eq(evaluationEntry.memberUserId, me)));
      const leadsVerdict = seat && !isSubstitute && seat.designation === (m.code === "final" ? "panel_chair" : "lead_panel_member");
      // A saved sheet waits for the Coordinator. The verdict is the Lead Panel Member's or the Panel Chair's own step.
      if (!entry) actionRequired = "Save your evaluation sheet.";
      else if (leadsVerdict && !attempt.verdict) actionRequired = "Record the verdict.";
    }
    out.push({
      thesisId,
      prId: m.prId,
      milestoneId: m.milestoneId,
      studentName: m.studentName,
      milestone: m.code,
      status: m.status,
      designation: seat?.designation ?? "none",
      isSubstitute,
      access: access.ok ? { open: true } : { open: false, reason: access.reason },
      actionRequired,
      defense: startsAt ? { startsAt, roomOrLink: attempt?.roomOrLink ?? null } : null,
    });
  }
  out.sort((a, b) => a.studentName.localeCompare(b.studentName));
  return { assignments: out };
}
