// The milestone state machine (ERD §7.1, FR-WFL-02, FR-WFL-08, FR-WFL-09).
// Pure code: no database and no framework. The data layer collects the facts and
// writes the gate_action or audit_record row for each change (P1-E04 wiring).

export type MilestoneCode = "proposal" | "pre_final" | "final";

export type MilestoneStatus =
  | "DRAFT"
  | "READY"
  | "ADVISER_ENDORSED"
  | "COMMITTEE_APPOINTED"
  | "COMMITTEE_ENDORSED"
  | "DATE_PROPOSED"
  | "DEFENSE_SCHEDULED"
  | "DEFENSE_HELD"
  | "CLOSED"
  | "RETURNED"
  | "CERTIFIED"
  | "FINAL_APPROVED"
  | "CLEARED";

export type Designation = "none" | "lead_panel_member" | "panel_chair";

/** Who asks for the change. `system` is the app itself (automatic steps). */
export type TransitionActor =
  | { kind: "student" | "adviser" | "coordinator" | "system" }
  | { kind: "panel_member"; designation: Designation };

export type IpmoValue = "NOT_SUBMITTED" | "UNDER_CHECK" | "FAILED" | "PASSED";
export type RpoValue = "NOT_SUBMITTED" | "UNDER_EDITING" | "DONE";
export type Verdict = "approved" | "approved_with_revisions" | "disapproved";

/** PST calendar date, `YYYY-MM-DD` (NFR-11). Strings in this form compare in date order. */
export type PstDate = string;

/** The facts that the guards read. The data layer computes them (ERD §4.2). */
export type MilestoneFacts = {
  hasReadyCommit: boolean;
  adviserOpenThreads: number;
  ipmo: IpmoValue;
  rpo: RpoValue;
  returnReason: string | null;
  appointmentAndNdasRecorded: boolean;
  /** The Adviser and every appointed member endorsed the same commit (ERD §4.2). */
  gate1bComplete: boolean;
  gate1bCompletedOn: PstDate | null;
  minNoticeDays: number;
  proposedDate: PstDate | null;
  /** The FR-DOC-08 checklist (INV-13). */
  defenseChecklistComplete: boolean;
  defenseDate: PstDate | null;
  today: PstDate;
  verdict: Verdict | null;
  sheetsVerifiedAndMatched: boolean;
  minutesIssued: boolean;
  documentReturned: boolean;
  revisionItemsAllAccepted: boolean;
  certificationVerified: boolean;
  gate2Complete: boolean;
  signedFinalManuscriptVerified: boolean;
  clearanceItemsAllVerified: boolean;
};

export type BlockCode =
  | "not_allowed"
  | "wrong_actor"
  | "no_ready_commit"
  | "reason_required"
  | "open_threads"
  | "ipmo_not_passed"
  | "appointment_incomplete"
  | "gate_1b_incomplete"
  | "date_too_early"
  | "checklist_incomplete"
  | "before_defense_date"
  | "no_verdict"
  | "sheet_not_verified"
  | "minutes_missing"
  | "document_returned"
  | "disapproved"
  | "not_disapproved"
  | "revisions_not_accepted"
  | "certification_missing"
  | "gate_2_incomplete"
  | "signed_final_missing"
  | "clearance_incomplete";

/** Every refusal carries a reason to show (BR-18, FR-WFL-13). */
export type Decision = { ok: true } | { ok: false; code: BlockCode; reason: string };

// Messages from Operational Flow v3.1 §4.7 where it has one. The others follow AGENTS.md §5.
const MESSAGES: Record<BlockCode, string> = {
  not_allowed: "This status change is not allowed.",
  wrong_actor: "Your role cannot make this change.",
  no_ready_commit: "Upload a commit first.",
  reason_required: "Write a reason for the Return.",
  open_threads: "You have open threads. Resolve them first.",
  ipmo_not_passed: "The IPMO check has not passed.",
  appointment_incomplete: "Record the appointment form and every NDA first.",
  gate_1b_incomplete: "Locked until Gate 1b.",
  date_too_early: "The date is too early. Choose a date after the notice period.",
  checklist_incomplete: "An item is missing. The screen names it.",
  before_defense_date: "Allowed on or after the defense date.",
  no_verdict: "Record the verdict first.",
  sheet_not_verified: "A sheet is not verified.",
  minutes_missing: "Issue the Minutes first.",
  document_returned: "A document was returned. The Student uploads a corrected scan first.",
  disapproved: "The verdict is Disapproved. The cycle starts again at review.",
  not_disapproved: "The verdict is not Disapproved.",
  revisions_not_accepted: "Every member must accept the revisions first.",
  certification_missing: "Verify the Certification first.",
  gate_2_incomplete: "A clearance item is incomplete.",
  signed_final_missing: "Verify the signed final manuscript first.",
  clearance_incomplete: "A clearance item is incomplete.",
};

const BASE: MilestoneStatus[] = [
  "DRAFT",
  "READY",
  "ADVISER_ENDORSED",
  "COMMITTEE_APPOINTED",
  "COMMITTEE_ENDORSED",
  "DATE_PROPOSED",
  "DEFENSE_SCHEDULED",
  "DEFENSE_HELD",
  "CLOSED",
  "RETURNED",
];

/** The statuses of each milestone (FR-WFL-02). */
export function statusesFor(m: MilestoneCode): MilestoneStatus[] {
  if (m === "proposal") return [...BASE, "CERTIFIED"];
  if (m === "final") return [...BASE, "FINAL_APPROVED", "CLEARED"];
  return [...BASE];
}

type ActorKind = TransitionActor["kind"];
type Guard = (m: MilestoneCode, f: MilestoneFacts, a: TransitionActor) => BlockCode | null;

type Transition = {
  from: MilestoneStatus;
  to: MilestoneStatus;
  actors: ActorKind[];
  milestones?: MilestoneCode[];
  guard: Guard;
};

const hasReason = (f: MilestoneFacts) => (f.returnReason?.trim() ? null : "reason_required");

// One row for each row of ERD §7.1, in the same order.
export const ALLOWED_TRANSITIONS: readonly Transition[] = [
  { from: "DRAFT", to: "READY", actors: ["student"], guard: (_m, f) => (f.hasReadyCommit ? null : "no_ready_commit") },
  {
    from: "READY",
    to: "ADVISER_ENDORSED",
    actors: ["adviser"],
    // INV-20, FR-WFL-03.
    guard: (m, f) =>
      f.adviserOpenThreads > 0 ? "open_threads" : m === "pre_final" && f.ipmo !== "PASSED" ? "ipmo_not_passed" : null,
  },
  { from: "READY", to: "RETURNED", actors: ["adviser"], guard: (_m, f) => hasReason(f) },
  { from: "RETURNED", to: "DRAFT", actors: ["system"], guard: () => null },
  {
    from: "ADVISER_ENDORSED",
    to: "COMMITTEE_APPOINTED",
    actors: ["coordinator"],
    milestones: ["proposal", "final"],
    guard: (_m, f) => (f.appointmentAndNdasRecorded ? null : "appointment_incomplete"),
  },
  {
    from: "ADVISER_ENDORSED",
    to: "COMMITTEE_ENDORSED",
    actors: ["adviser", "panel_member"],
    milestones: ["pre_final"],
    guard: (_m, f) => (f.gate1bComplete ? null : "gate_1b_incomplete"),
  },
  {
    from: "COMMITTEE_APPOINTED",
    to: "COMMITTEE_ENDORSED",
    actors: ["adviser", "panel_member"],
    // INV-21: the per-member check is in gates.ts. This needs the last endorsement in.
    guard: (_m, f) => (f.gate1bComplete ? null : "gate_1b_incomplete"),
  },
  {
    from: "COMMITTEE_ENDORSED",
    to: "DATE_PROPOSED",
    actors: ["student"],
    // INV-12, BR-09.
    guard: (_m, f) => {
      if (!f.gate1bCompletedOn) return "gate_1b_incomplete";
      if (!f.proposedDate || f.proposedDate < addDays(f.gate1bCompletedOn, f.minNoticeDays)) return "date_too_early";
      return null;
    },
  },
  {
    from: "DATE_PROPOSED",
    to: "DEFENSE_SCHEDULED",
    actors: ["coordinator"],
    guard: (_m, f) => (f.defenseChecklistComplete ? null : "checklist_incomplete"), // INV-13
  },
  { from: "DATE_PROPOSED", to: "RETURNED", actors: ["coordinator"], guard: (_m, f) => hasReason(f) },
  {
    from: "DEFENSE_SCHEDULED",
    to: "DEFENSE_HELD",
    actors: ["panel_member"],
    // INV-15: Lead Panel Member in M1 and M2, Panel Chair in M3, on or after the defense date.
    guard: (m, f, a) => {
      const need: Designation = m === "final" ? "panel_chair" : "lead_panel_member";
      if (a.kind !== "panel_member" || a.designation !== need) return "wrong_actor";
      if (!f.defenseDate || f.today < f.defenseDate) return "before_defense_date";
      return f.verdict ? null : "no_verdict";
    },
  },
  {
    from: "DEFENSE_HELD",
    to: "CLOSED",
    actors: ["coordinator"],
    // INV-16, BR-12. A Disapproved attempt does not close (FR-WFL-09).
    guard: (_m, f) => {
      if (f.verdict === "disapproved") return "disapproved";
      if (!f.verdict) return "no_verdict";
      if (!f.sheetsVerifiedAndMatched) return "sheet_not_verified";
      if (!f.minutesIssued) return "minutes_missing";
      return f.documentReturned ? "document_returned" : null;
    },
  },
  {
    from: "DEFENSE_HELD",
    to: "DRAFT",
    actors: ["system"],
    guard: (_m, f) => (f.verdict === "disapproved" ? null : "not_disapproved"), // FR-WFL-09
  },
  {
    from: "CLOSED",
    to: "CERTIFIED",
    actors: ["coordinator"],
    milestones: ["proposal"],
    guard: (_m, f) =>
      !f.revisionItemsAllAccepted ? "revisions_not_accepted" : f.certificationVerified ? null : "certification_missing",
  },
  {
    from: "CLOSED",
    to: "FINAL_APPROVED",
    actors: ["coordinator"],
    milestones: ["final"],
    guard: (_m, f) =>
      !f.gate2Complete ? "gate_2_incomplete" : f.signedFinalManuscriptVerified ? null : "signed_final_missing",
  },
  {
    from: "FINAL_APPROVED",
    to: "CLEARED",
    actors: ["coordinator"],
    milestones: ["final"],
    guard: (_m, f) => (f.clearanceItemsAllVerified ? null : "clearance_incomplete"),
  },
];

function block(code: BlockCode): Decision {
  return { ok: false, code, reason: MESSAGES[code] };
}

/** Decides whether `actor` can move milestone `m` from `from` to `to`, given the facts. */
export function decideTransition(
  m: MilestoneCode,
  from: MilestoneStatus,
  to: MilestoneStatus,
  actor: TransitionActor,
  facts: MilestoneFacts,
): Decision {
  const statuses = statusesFor(m);
  const t = ALLOWED_TRANSITIONS.find(
    (x) => x.from === from && x.to === to && (!x.milestones || x.milestones.includes(m)),
  );
  if (!t || !statuses.includes(from) || !statuses.includes(to)) return block("not_allowed");
  // INV-17 follows from the table: only `coordinator` is listed for the four Coordinator statuses.
  if (!t.actors.includes(actor.kind)) return block("wrong_actor");
  const code = t.guard(m, facts, actor);
  return code ? block(code) : { ok: true };
}

/** Adds whole days to a `YYYY-MM-DD` date. Calendar math in UTC, so no time zone shift. */
export function addDays(date: PstDate, days: number): PstDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
