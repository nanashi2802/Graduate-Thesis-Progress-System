// Appointment board data and actions (C3): FR-CMT-01 to FR-CMT-04, FR-CMT-03, BR-03,
// NFR-01, NFR-03, AD-B-011, AD-B-018. Server only.
// Each write checks the actor first, then the pure rule in `domain/committee.ts`, then
// writes the row and its audit record in one transaction.
import "server-only";
import { and, count, eq, gt, inArray, ne } from "drizzle-orm";
import {
  checkAppointment,
  checkProposeSeat,
  checkSeatStatus,
  committeeKindFor,
  type CommitteeBlockCode,
  type CommitteeKind,
  type PanelSizes,
} from "@/server/domain/committee";
import type { Designation, MilestoneCode } from "@/server/domain/milestone";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { checkTransition, transitionMilestone, TransitionRefused } from "./milestones";
import {
  appUser,
  committee,
  committeeMember,
  documentRecord,
  milestoneInstance,
  slot,
  templateVersion,
  thesisInstance,
} from "./schema";

export type BoardBlockCode =
  | CommitteeBlockCode
  | "not_found"
  | "before_gate_1a"
  | "wrong_document"
  | "appointment_not_linked"
  | "nda_not_linked"
  | "already_appointed";

export type BoardResult<T> = { ok: true; value: T } | { ok: false; code: BoardBlockCode; reason: string };

const MESSAGES: Partial<Record<BoardBlockCode, string>> = {
  not_found: "The record does not exist.",
  before_gate_1a: "Allowed after Gate 1a (the Adviser endorsement).",
  wrong_document: "Choose the right form for this committee or member.",
  appointment_not_linked: "Upload the appointment form first.",
  nda_not_linked: "Upload the NDA of each member first.",
  already_appointed: "The committee is already appointed.",
};

const refuse = <T>(code: BoardBlockCode, reason?: string): BoardResult<T> => ({
  ok: false,
  code,
  reason: reason ?? MESSAGES[code] ?? "This action is not allowed.",
});

const KIND_MILESTONE: Record<CommitteeKind, MilestoneCode> = { evaluation_committee: "proposal", final_panel: "final" };
const APPOINTMENT_FORM: Record<CommitteeKind, "TDW_06" | "TDW_11"> = {
  evaluation_committee: "TDW_06",
  final_panel: "TDW_11",
};

// C3 is a Coordinator screen. Every function here starts with this check (NFR-01).
function requireCoordinator(ctx: DataContext): void {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") throw new AccessDeniedError("only the Coordinator manages committees");
}

async function loadMilestone(ctx: DataContext, thesisId: string, milestone: MilestoneCode) {
  const [row] = await ctx.db
    .select({
      milestoneId: milestoneInstance.id,
      status: milestoneInstance.status,
      adviserUserId: thesisInstance.adviserUserId,
      degreeLevel: thesisInstance.degreeLevel,
      panelSizeMasters: templateVersion.panelSizeMasters,
      panelSizeDoctoral: templateVersion.panelSizeDoctoral,
    })
    .from(milestoneInstance)
    .innerJoin(thesisInstance, eq(thesisInstance.id, milestoneInstance.thesisInstanceId))
    .innerJoin(templateVersion, eq(templateVersion.id, milestoneInstance.templateVersionId))
    .where(and(eq(milestoneInstance.thesisInstanceId, thesisId), eq(milestoneInstance.milestoneCode, milestone)));
  return row ?? null;
}

async function loadCommittee(ctx: DataContext, committeeId: string) {
  const [c] = await ctx.db.select().from(committee).where(eq(committee.id, committeeId));
  if (!c) return null;
  const m = await loadMilestone(ctx, c.thesisInstanceId, KIND_MILESTONE[c.kind]);
  return m ? { committee: c, milestone: m } : null;
}

async function seatsOf(ctx: DataContext, committeeId: string) {
  return ctx.db.select().from(committeeMember).where(eq(committeeMember.committeeId, committeeId));
}

/** Propose one seat. The first seat makes the committee for the milestone (FR-CMT-01, FR-CMT-03). */
export async function proposeSeat(
  ctx: DataContext,
  input: { thesisId: string; milestone: MilestoneCode; memberUserId: string; designation: Designation },
): Promise<BoardResult<typeof committeeMember.$inferSelect>> {
  requireCoordinator(ctx);
  const kind = committeeKindFor(input.milestone);
  const m = await loadMilestone(ctx, input.thesisId, kind ? input.milestone : "proposal");
  if (!m) return refuse("not_found");
  const [candidate] = await ctx.db.select().from(appUser).where(eq(appUser.id, input.memberUserId));
  if (!candidate) return refuse("not_found");

  return ctx.db.transaction(async (tx) => {
    const txCtx = { db: tx, actor: ctx.actor };
    const [existing] = kind
      ? await tx
          .select()
          .from(committee)
          .where(and(eq(committee.thesisInstanceId, input.thesisId), eq(committee.kind, kind)))
      : [];
    const seats = existing ? await seatsOf(txCtx, existing.id) : [];
    const rule = checkProposeSeat({
      actorRole: ctx.actor.role,
      milestone: input.milestone,
      candidateRole: candidate.isActive ? candidate.role : "inactive",
      candidateUserId: candidate.id,
      adviserUserId: m.adviserUserId,
      seats: seats.map((x) => ({ memberUserId: x.memberUserId, designation: x.designation, status: x.status })),
    });
    if (!rule.ok) return refuse(rule.code, rule.reason);
    if (m.status !== "ADVISER_ENDORSED") return refuse("before_gate_1a");
    if (existing?.appointedAt) return refuse("already_appointed");

    const c = existing ?? (await tx.insert(committee).values({ thesisInstanceId: input.thesisId, kind: kind! }).returning())[0]!;
    const [seat] = await tx
      .insert(committeeMember)
      .values({ committeeId: c.id, memberUserId: candidate.id, designation: input.designation })
      .returning();
    await recordAudit(txCtx, {
      action: "committee_member.propose",
      targetTable: "committee_member",
      targetId: seat!.id,
      detail: { committeeKind: c.kind, designation: input.designation },
    });
    return { ok: true, value: seat! };
  });
}

/** Record the member's answer: Accepted or Declined, once (FR-CMT-03, AD-B-011). */
export async function recordSeatAnswer(
  ctx: DataContext,
  input: { seatId: string; status: "accepted" | "declined" },
): Promise<BoardResult<null>> {
  requireCoordinator(ctx);
  const [seat] = await ctx.db.select().from(committeeMember).where(eq(committeeMember.id, input.seatId));
  if (!seat) return refuse("not_found");
  const rule = checkSeatStatus(ctx.actor.role, seat.status, input.status);
  if (!rule.ok) return refuse(rule.code, rule.reason);
  return ctx.db.transaction(async (tx) => {
    await tx.update(committeeMember).set({ status: input.status }).where(eq(committeeMember.id, seat.id));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: `committee_member.${input.status}`,
      targetTable: "committee_member",
      targetId: seat.id,
    });
    return { ok: true, value: null };
  });
}

/** Link the TDW 06 (Evaluation Committee) or TDW 11 (Final Panel) record (FR-CMT-04). */
export async function linkAppointmentForm(
  ctx: DataContext,
  input: { committeeId: string; documentId: string },
): Promise<BoardResult<null>> {
  requireCoordinator(ctx);
  const loaded = await loadCommittee(ctx, input.committeeId);
  if (!loaded) return refuse("not_found");
  if (loaded.committee.appointedAt) return refuse("already_appointed");
  const [d] = await ctx.db.select().from(documentRecord).where(eq(documentRecord.id, input.documentId));
  if (!d || d.milestoneInstanceId !== loaded.milestone.milestoneId || d.formCode !== APPOINTMENT_FORM[loaded.committee.kind]) {
    return refuse("wrong_document");
  }
  return ctx.db.transaction(async (tx) => {
    await tx.update(committee).set({ appointmentDocumentId: d.id }).where(eq(committee.id, input.committeeId));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "committee.link_appointment_form",
      targetTable: "committee",
      targetId: input.committeeId,
      detail: { formCode: d.formCode },
    });
    return { ok: true, value: null };
  });
}

/** Link the member's own TDW 05 NDA record to the seat (FR-CMT-04, BR-08). */
export async function linkNda(ctx: DataContext, input: { seatId: string; documentId: string }): Promise<BoardResult<null>> {
  requireCoordinator(ctx);
  const [seat] = await ctx.db.select().from(committeeMember).where(eq(committeeMember.id, input.seatId));
  if (!seat) return refuse("not_found");
  const loaded = await loadCommittee(ctx, seat.committeeId);
  if (!loaded) return refuse("not_found");
  const [d] = await ctx.db.select().from(documentRecord).where(eq(documentRecord.id, input.documentId));
  if (
    !d ||
    d.formCode !== "TDW_05" ||
    d.subjectUserId !== seat.memberUserId ||
    d.milestoneInstanceId !== loaded.milestone.milestoneId
  ) {
    return refuse("wrong_document");
  }
  return ctx.db.transaction(async (tx) => {
    await tx.update(committeeMember).set({ ndaDocumentId: d.id }).where(eq(committeeMember.id, seat.id));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "committee_member.link_nda",
      targetTable: "committee_member",
      targetId: seat.id,
    });
    return { ok: true, value: null };
  });
}

type LoadedCommittee = NonNullable<Awaited<ReturnType<typeof loadCommittee>>>;

/** Why the committee cannot be marked Appointed now, or null (BR-18). One check for the action and the screen. */
async function appointmentProblem(
  ctx: DataContext,
  { committee: c, milestone: m }: LoadedCommittee,
): Promise<{ code: BoardBlockCode; reason: string } | null> {
  const blocked = (code: BoardBlockCode, reason?: string) => ({ code, reason: reason ?? MESSAGES[code] ?? "This action is not allowed." });
  if (c.appointedAt) return blocked("already_appointed");
  if (m.status !== "ADVISER_ENDORSED") return blocked("before_gate_1a");
  const seats = await seatsOf(ctx, c.id);
  const sizes: PanelSizes = {
    masters: { proposal: m.panelSizeMasters, final: m.panelSizeMasters },
    doctoral: { proposal: m.panelSizeDoctoral, final: m.panelSizeDoctoral },
  };
  const rule = checkAppointment({
    actorRole: ctx.actor.role,
    milestone: KIND_MILESTONE[c.kind],
    level: m.degreeLevel,
    sizes,
    adviserUserId: m.adviserUserId,
    seats: seats.map((x) => ({ memberUserId: x.memberUserId, designation: x.designation, status: x.status })),
  });
  if (!rule.ok) return blocked(rule.code, rule.reason);
  if (!c.appointmentDocumentId) return blocked("appointment_not_linked");
  if (seats.some((x) => x.status !== "declined" && !x.ndaDocumentId)) return blocked("nda_not_linked");
  return null;
}

/**
 * Mark the committee and its active seats Appointed (FR-CMT-04). The seats must pass
 * `checkAppointment`, and the form and each NDA must be linked (AD-B-018). Manuscript
 * access still needs both records verified (`memberAccess`, BR-08). The milestone status
 * change to COMMITTEE_APPOINTED belongs to the P1-E04 wiring.
 */
export async function markAppointed(ctx: DataContext, input: { committeeId: string }): Promise<BoardResult<null>> {
  requireCoordinator(ctx);
  const loaded = await loadCommittee(ctx, input.committeeId);
  if (!loaded) return refuse("not_found");
  const { committee: c } = loaded;
  const problem = await appointmentProblem(ctx, loaded);
  if (problem) return refuse(problem.code, problem.reason);
  const active = (await seatsOf(ctx, c.id)).filter((x) => x.status !== "declined");

  return ctx.db.transaction(async (tx) => {
    const now = new Date();
    await tx.update(committee).set({ appointedAt: now }).where(eq(committee.id, c.id));
    await tx
      .update(committeeMember)
      .set({ appointedAt: now })
      .where(and(eq(committeeMember.committeeId, c.id), ne(committeeMember.status, "declined")));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "committee.appoint",
      targetTable: "committee",
      targetId: c.id,
      detail: { committeeKind: c.kind, seats: active.length },
    });
    return { ok: true, value: null };
  });
}

/**
 * Move the milestone to COMMITTEE_APPOINTED (FR-CMT-04, AD-B-021). It runs after the appointment commits,
 * as a second call (`agent-a`: the guard reads `committee.appointedAt` and the verified forms). The
 * appointment stays if the move is refused. The Coordinator verifies the paper first (BR-08).
 */
export async function advanceMilestone(ctx: DataContext, input: { committeeId: string }): Promise<BoardResult<null>> {
  requireCoordinator(ctx);
  const loaded = await loadCommittee(ctx, input.committeeId);
  if (!loaded) return refuse("not_found");
  if (!loaded.committee.appointedAt) return refuse("not_allowed", "Mark the committee Appointed first.");
  try {
    await transitionMilestone(ctx, loaded.milestone.milestoneId, "COMMITTEE_APPOINTED");
  } catch (e) {
    if (e instanceof TransitionRefused) return refuse("not_allowed", e.message);
    throw e;
  }
  return { ok: true, value: null };
}

export type BoardSeat = {
  id: string;
  memberUserId: string;
  fullName: string;
  designation: Designation;
  status: "proposed" | "accepted" | "declined";
  ndaLinked: boolean;
  appointed: boolean;
};

export type AppointmentBoard = {
  committees: {
    id: string;
    kind: CommitteeKind;
    milestoneId: string;
    appointmentFormLinked: boolean;
    appointed: boolean;
    /** Why "Mark Appointed" is blocked now (BR-18). Null when it is open. */
    appointBlockedReason: string | null;
    /** The milestone is already at COMMITTEE_APPOINTED or later. */
    milestoneAdvanced: boolean;
    /** Why the milestone cannot move to COMMITTEE_APPOINTED now (BR-18). Null when it can. */
    advanceBlockedReason: string | null;
    seats: BoardSeat[];
  }[];
  /** Every active Panel Member, with workload and availability (FR-CMT-02). The Adviser pool is separate (SITEMAP C3). */
  pool: { userId: string; fullName: string; activeSeats: number; freeDefenseSlots: number }[];
};

/** The C3 board for one thesis (FR-CMT-02, FR-CMT-03). */
export async function appointmentBoard(ctx: DataContext, thesisId: string): Promise<AppointmentBoard> {
  requireCoordinator(ctx);
  const committees = await ctx.db.select().from(committee).where(eq(committee.thesisInstanceId, thesisId));
  const seats = committees.length
    ? await ctx.db
        .select({ seat: committeeMember, fullName: appUser.fullName })
        .from(committeeMember)
        .innerJoin(appUser, eq(appUser.id, committeeMember.memberUserId))
        .where(
          inArray(
            committeeMember.committeeId,
            committees.map((c) => c.id),
          ),
        )
    : [];

  const members = await ctx.db
    .select({ userId: appUser.id, fullName: appUser.fullName })
    .from(appUser)
    .where(and(eq(appUser.role, "panel_member"), eq(appUser.isActive, true)));
  const load = await ctx.db
    .select({ userId: committeeMember.memberUserId, n: count() })
    .from(committeeMember)
    .where(ne(committeeMember.status, "declined"))
    .groupBy(committeeMember.memberUserId);
  const free = await ctx.db
    .select({ userId: slot.ownerUserId, n: count() })
    .from(slot)
    .where(and(eq(slot.slotType, "defense"), eq(slot.status, "available"), gt(slot.startsAt, new Date())))
    .groupBy(slot.ownerUserId);
  const loadBy = new Map(load.map((r) => [r.userId, Number(r.n)]));
  const freeBy = new Map(free.map((r) => [r.userId, Number(r.n)]));

  const blockedBy = new Map<string, { milestoneId: string; reason: string | null; advanced: boolean; advanceReason: string | null }>();
  for (const c of committees) {
    const loaded = await loadCommittee(ctx, c.id);
    const problem = loaded ? await appointmentProblem(ctx, loaded) : null;
    const advanced = !!loaded && loaded.milestone.status !== "ADVISER_ENDORSED" && loaded.milestone.status !== "DRAFT" && loaded.milestone.status !== "READY";
    let advanceReason: string | null = null;
    if (loaded && !advanced) {
      if (!c.appointedAt) advanceReason = "Mark the committee Appointed first.";
      else {
        const d = await checkTransition(ctx, loaded.milestone.milestoneId, "COMMITTEE_APPOINTED");
        if (!d.ok) advanceReason = d.reason;
      }
    }
    blockedBy.set(c.id, { milestoneId: loaded?.milestone.milestoneId ?? "", reason: problem?.reason ?? null, advanced, advanceReason });
  }

  return {
    committees: committees.map((c) => ({
      id: c.id,
      kind: c.kind,
      milestoneId: blockedBy.get(c.id)!.milestoneId,
      appointmentFormLinked: c.appointmentDocumentId !== null,
      appointed: c.appointedAt !== null,
      appointBlockedReason: blockedBy.get(c.id)!.reason,
      milestoneAdvanced: blockedBy.get(c.id)!.advanced,
      advanceBlockedReason: blockedBy.get(c.id)!.advanceReason,
      seats: seats
        .filter((r) => r.seat.committeeId === c.id)
        .map(({ seat, fullName }) => ({
          id: seat.id,
          memberUserId: seat.memberUserId,
          fullName,
          designation: seat.designation,
          status: seat.status,
          ndaLinked: seat.ndaDocumentId !== null,
          appointed: seat.appointedAt !== null,
        })),
    })),
    pool: members.map((p) => ({
      ...p,
      activeSeats: loadBy.get(p.userId) ?? 0,
      freeDefenseSlots: freeBy.get(p.userId) ?? 0,
    })),
  };
}
