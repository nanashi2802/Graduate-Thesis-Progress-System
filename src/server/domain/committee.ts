// Committee appointment rules (FR-CMT-01 to 06, BR-03, BR-08, BR-21, ERD §4.2, §7.2).
// Pure code: no database and no framework. The data layer loads the rows and the
// verified flags, calls these checks, and writes the rows (P1-E05).

import type { Designation, MilestoneCode } from "./milestone";

export type DegreeLevel = "masters" | "doctoral";
export type MemberStatus = "proposed" | "accepted" | "declined";
export type CommitteeKind = "evaluation_committee" | "final_panel";

/** Seat sizes from the template (ERD `template_version.panel_size_*`). */
export type PanelSizes = {
  masters: { proposal: number; final: number };
  doctoral: { proposal: number; final: number };
};

export type Seat = {
  memberUserId: string;
  designation: Designation;
  status: MemberStatus;
};

export type CommitteeBlockCode =
  | "no_appointment_in_milestone"
  | "wrong_actor"
  | "not_allowed"
  | "wrong_size"
  | "seat_not_accepted"
  | "lead_count"
  | "chair_count"
  | "duplicate_member"
  | "adviser_on_committee"
  | "not_a_panel_member"
  | "appointment_not_verified"
  | "nda_not_verified"
  | "access_ended";

export type CommitteeDecision = { ok: true } | { ok: false; code: CommitteeBlockCode; reason: string };

const MESSAGES: Record<CommitteeBlockCode, string> = {
  no_appointment_in_milestone: "Milestone 2 has no new appointment. The Evaluation Committee continues.",
  wrong_actor: "Only the Coordinator can make this change.",
  not_allowed: "This status change is not allowed.",
  wrong_size: "The number of seats does not match the size for the degree level.",
  seat_not_accepted: "A seat is not accepted yet. Replace each declined seat.",
  lead_count: "Name exactly one Lead Panel Member.",
  chair_count: "Name exactly one Panel Chair.",
  duplicate_member: "A Panel Member has two seats.",
  adviser_on_committee: "The Adviser cannot sit on the committee.",
  not_a_panel_member: "Only a Panel Member account can take a seat.",
  appointment_not_verified: "Record the appointment form first.",
  nda_not_verified: "Record this member's NDA first.",
  access_ended: "Access to the manuscript has ended.",
};

const ok: CommitteeDecision = { ok: true };
const block = (code: CommitteeBlockCode): CommitteeDecision => ({ ok: false, code, reason: MESSAGES[code] });

/** Milestone 1 appoints the Evaluation Committee, Milestone 3 the Final Panel, Milestone 2 nothing (FR-CMT-01). */
export function committeeKindFor(milestone: MilestoneCode): CommitteeKind | null {
  if (milestone === "proposal") return "evaluation_committee";
  if (milestone === "final") return "final_panel";
  return null;
}

export function seatCount(sizes: PanelSizes, level: DegreeLevel, milestone: MilestoneCode): number | null {
  if (milestone === "pre_final") return null;
  return sizes[level][milestone];
}

/** The seats that count: a declined seat is kept as history but needs a new row (ERD §7.2). */
export function activeSeats(seats: readonly Seat[]): Seat[] {
  return seats.filter((s) => s.status !== "declined");
}

/** Check one proposed seat before the data layer writes the `committee_member` row (FR-CMT-01, BR-03, INV-03). */
export function checkProposeSeat(input: {
  actorRole: string;
  milestone: MilestoneCode;
  candidateRole: string;
  candidateUserId: string;
  adviserUserId: string;
  seats: readonly Seat[];
}): CommitteeDecision {
  if (input.actorRole !== "coordinator") return block("wrong_actor");
  if (committeeKindFor(input.milestone) === null) return block("no_appointment_in_milestone");
  if (input.candidateUserId === input.adviserUserId) return block("adviser_on_committee");
  if (input.candidateRole !== "panel_member") return block("not_a_panel_member");
  if (activeSeats(input.seats).some((s) => s.memberUserId === input.candidateUserId)) return block("duplicate_member");
  return ok;
}

/**
 * Seat status change (FR-CMT-03, ERD §7.2): `proposed` to `accepted` or `declined`, once.
 * The Coordinator records the member's answer (AD-B-011).
 */
export function checkSeatStatus(actorRole: string, from: MemberStatus, to: MemberStatus): CommitteeDecision {
  if (actorRole !== "coordinator") return block("wrong_actor");
  if (from !== "proposed" || (to !== "accepted" && to !== "declined")) return block("not_allowed");
  return ok;
}

/**
 * Can the Coordinator mark the committee Appointed (FR-CMT-01, FR-CMT-04)? The active
 * seats match the size, each is accepted, and one Lead Panel Member and one Panel Chair are named.
 */
export function checkAppointment(input: {
  actorRole: string;
  milestone: MilestoneCode;
  level: DegreeLevel;
  sizes: PanelSizes;
  adviserUserId: string;
  seats: readonly Seat[];
}): CommitteeDecision {
  if (input.actorRole !== "coordinator") return block("wrong_actor");
  const size = seatCount(input.sizes, input.level, input.milestone);
  if (size === null) return block("no_appointment_in_milestone");
  const active = activeSeats(input.seats);
  if (active.some((s) => s.memberUserId === input.adviserUserId)) return block("adviser_on_committee");
  if (new Set(active.map((s) => s.memberUserId)).size !== active.length) return block("duplicate_member");
  if (active.length !== size) return block("wrong_size");
  if (active.some((s) => s.status !== "accepted")) return block("seat_not_accepted");
  if (active.filter((s) => s.designation === "lead_panel_member").length !== 1) return block("lead_count");
  if (active.filter((s) => s.designation === "panel_chair").length !== 1) return block("chair_count");
  return ok;
}

/**
 * "Member has access" (ERD §4.2, BR-08, BR-21, INV-24, INV-33). A seat needs the verified
 * appointment form and its own verified NDA. A substitute (FR-CMT-06) needs its own
 * verified NDA. Access ends at the BR-21 event for both.
 */
export function memberAccess(input: {
  kind: "seat" | "substitute";
  appointmentVerified: boolean;
  ndaVerified: boolean;
  accessEnded: boolean;
}): CommitteeDecision {
  if (input.accessEnded) return block("access_ended");
  if (input.kind === "seat" && !input.appointmentVerified) return block("appointment_not_verified");
  if (!input.ndaVerified) return block("nda_not_verified");
  return ok;
}
