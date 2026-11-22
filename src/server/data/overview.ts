// The Coordinator overview (C1): KPI strip, grouped action queue and Student table.
// FR-TRK-04, FR-TRK-06 (pacing flag), NFR-01, NFR-04, BR-17. Server only. Coordinator only.
// Each KPI count is the length of its queue, so a count always opens the same list.
// A pacing flag is information only (BR-17). It never blocks an action.
import "server-only";
import { asc, count, eq, inArray, max } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { MilestoneCode, MilestoneStatus, PstDate } from "@/server/domain/milestone";
import { pstDate } from "@/server/notify/time";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { appUser, documentRecord, gateAction, milestoneInstance, thesisInstance } from "./schema";

export type QueueKind =
  | "appoint_committee"
  | "review_documents"
  | "confirm_date"
  | "close_stage"
  | "certify"
  | "final_approval"
  | "clearance";

/** The text of each group. The screen maps `kind` to a route (SITEMAP C3, C4, C5, C6, C7). */
export const QUEUE_LABEL: Record<QueueKind, string> = {
  appoint_committee: "Appoint a committee",
  review_documents: "Review scans",
  confirm_date: "Confirm a defense date",
  close_stage: "Close a stage",
  certify: "Record a Certification",
  final_approval: "Record the final approval",
  clearance: "Check clearance",
};

export type QueueItem = {
  kind: QueueKind;
  thesisId: string;
  milestoneId: string;
  studentName: string;
  milestone: MilestoneCode;
  /** Scans waiting, for `review_documents`. */
  count: number;
  /** The last gate change, or the day the milestone opened. */
  since: Date;
  daysWaiting: number;
};

export type OverviewStudent = {
  thesisId: string;
  studentName: string;
  adviserName: string;
  milestone: MilestoneCode;
  status: MilestoneStatus;
  targetDate: PstDate | null;
  /** The target date is past and the milestone is not closed. Information only (BR-17). */
  pacingFlag: boolean;
};

export type CoordinatorOverview = {
  kpis: { kind: QueueKind; label: string; count: number }[];
  queue: QueueItem[];
  students: OverviewStudent[];
};

const KIND_BY_STATUS: Partial<Record<MilestoneStatus, (m: MilestoneCode) => QueueKind | null>> = {
  ADVISER_ENDORSED: (m) => (m === "pre_final" ? null : "appoint_committee"),
  DATE_PROPOSED: () => "confirm_date",
  DEFENSE_HELD: () => "close_stage",
  CLOSED: (m) => (m === "proposal" ? "certify" : m === "final" ? "final_approval" : null),
  FINAL_APPROVED: () => "clearance",
};

// A pacing flag shows while a milestone is before the defense is closed and the target date has passed (FR-TRK-06).
const FLAG_DONE: MilestoneStatus[] = ["CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED"];

const WAITING_SCAN_STATES = ["locked_as_submitted", "physical_received"] as const;
const DAY_MS = 86_400_000;

export async function coordinatorOverview(ctx: DataContext, now: Date = new Date()): Promise<CoordinatorOverview> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") throw new AccessDeniedError("only the Coordinator reads the overview");
  const student = alias(appUser, "student");
  const adviser = alias(appUser, "adviser");
  const rows = await ctx.db
    .select({
      thesisId: thesisInstance.id,
      studentName: student.fullName,
      adviserName: adviser.fullName,
      milestoneId: milestoneInstance.id,
      code: milestoneInstance.milestoneCode,
      status: milestoneInstance.status,
      targetDate: milestoneInstance.targetDate,
      openedAt: milestoneInstance.openedAt,
    })
    .from(milestoneInstance)
    .innerJoin(thesisInstance, eq(thesisInstance.id, milestoneInstance.thesisInstanceId))
    .innerJoin(student, eq(student.id, thesisInstance.studentUserId))
    .innerJoin(adviser, eq(adviser.id, thesisInstance.adviserUserId))
    .orderBy(asc(student.fullName), asc(milestoneInstance.openedAt));

  const ids = rows.map((r) => r.milestoneId);
  const lastGate = ids.length
    ? await ctx.db
        .select({ id: gateAction.milestoneInstanceId, at: max(gateAction.createdAt) })
        .from(gateAction)
        .where(inArray(gateAction.milestoneInstanceId, ids))
        .groupBy(gateAction.milestoneInstanceId)
    : [];
  const waitingScans = ids.length
    ? await ctx.db
        .select({ id: documentRecord.milestoneInstanceId, n: count() })
        .from(documentRecord)
        .where(inArray(documentRecord.state, [...WAITING_SCAN_STATES]))
        .groupBy(documentRecord.milestoneInstanceId)
    : [];
  const gateAt = new Map(lastGate.map((g) => [g.id, g.at]));
  const scans = new Map(waitingScans.map((w) => [w.id, Number(w.n)]));

  const queue: QueueItem[] = [];
  for (const r of rows) {
    const since = gateAt.get(r.milestoneId) ?? r.openedAt;
    const daysWaiting = Math.max(0, Math.floor((now.getTime() - since.getTime()) / DAY_MS));
    const base = { thesisId: r.thesisId, milestoneId: r.milestoneId, studentName: r.studentName, milestone: r.code, since, daysWaiting };
    const kind = KIND_BY_STATUS[r.status]?.(r.code) ?? null;
    if (kind) queue.push({ ...base, kind, count: 1 });
    const n = scans.get(r.milestoneId) ?? 0;
    if (n > 0) queue.push({ ...base, kind: "review_documents", count: n });
  }
  queue.sort((a, b) => b.daysWaiting - a.daysWaiting || a.studentName.localeCompare(b.studentName));

  const kinds = Object.keys(QUEUE_LABEL) as QueueKind[];
  const today = pstDate(now);
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) latest.set(r.thesisId, r); // The rows run oldest first, so the last one is the current milestone.
  return {
    kpis: kinds.map((kind) => ({ kind, label: QUEUE_LABEL[kind], count: queue.filter((q) => q.kind === kind).length })),
    queue,
    students: [...latest.values()].map((r) => ({
      thesisId: r.thesisId,
      studentName: r.studentName,
      adviserName: r.adviserName,
      milestone: r.code,
      status: r.status,
      targetDate: r.targetDate,
      pacingFlag: !!r.targetDate && r.targetDate < today && !FLAG_DONE.includes(r.status),
    })),
  };
}
