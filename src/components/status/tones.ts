// Status labels and tones (DESIGN.md §3.3, §3.4). One map, so the same status
// looks the same on every screen (DESIGN.md P8). Pure data: no React.
import type { MilestoneCode, MilestoneStatus } from "@/server/domain/milestone";

export type Tone = "neutral" | "active" | "pending" | "done" | "returned" | "locked" | "achieved";

export type StatusView = { label: string; tone: Tone };

const MILESTONE_STATUS: Record<MilestoneStatus, StatusView> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  READY: { label: "Ready for review", tone: "active" },
  ADVISER_ENDORSED: { label: "Adviser endorsed", tone: "active" },
  COMMITTEE_APPOINTED: { label: "Committee appointed", tone: "active" },
  COMMITTEE_ENDORSED: { label: "Endorsed, manuscript locked", tone: "locked" },
  DATE_PROPOSED: { label: "Date proposed", tone: "pending" },
  DEFENSE_SCHEDULED: { label: "Defense scheduled", tone: "active" },
  DEFENSE_HELD: { label: "Defense held", tone: "active" },
  CLOSED: { label: "Stage closed", tone: "done" },
  CERTIFIED: { label: "Certified", tone: "achieved" },
  FINAL_APPROVED: { label: "Final approved", tone: "achieved" },
  CLEARED: { label: "Cleared", tone: "achieved" },
  RETURNED: { label: "Returned", tone: "returned" },
};

/** Label and tone of a milestone status. In the Final milestone, the committee is the Final Panel. */
export function milestoneStatusView(status: MilestoneStatus, milestone?: MilestoneCode): StatusView {
  if (status === "COMMITTEE_APPOINTED" && milestone === "final") {
    return { label: "Panel appointed", tone: "active" };
  }
  return MILESTONE_STATUS[status];
}

export type DocumentState =
  | "not_started"
  | "prepared"
  | "scan_uploaded"
  | "locked_as_submitted"
  | "physical_received"
  | "verified"
  | "mismatch"
  | "returned";

const DOCUMENT_STATE: Record<DocumentState, StatusView> = {
  not_started: { label: "Not started", tone: "neutral" },
  prepared: { label: "Prepared", tone: "neutral" },
  scan_uploaded: { label: "Scan uploaded", tone: "pending" },
  locked_as_submitted: { label: "Locked as submitted", tone: "locked" },
  physical_received: { label: "Physical received", tone: "active" },
  verified: { label: "Verified", tone: "done" },
  // A mismatch is a flag (BR-17): it warns and never blocks.
  mismatch: { label: "Mismatch", tone: "pending" },
  returned: { label: "Returned", tone: "returned" },
};

export function documentStateView(state: DocumentState): StatusView {
  return DOCUMENT_STATE[state];
}

export type OutsideKind = "ethics" | "ipmo" | "rpo" | "copyright";

export type OutsideValue =
  | "NOT_SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUIRED"
  | "APPROVED"
  | "UNDER_CHECK"
  | "FAILED"
  | "PASSED"
  | "UNDER_EDITING"
  | "DONE"
  | "NOT_APPLIED"
  | "APPLIED"
  | "REGISTERED";

const OUTSIDE_KIND_LABEL: Record<OutsideKind, string> = {
  ethics: "Ethics",
  ipmo: "IPMO",
  rpo: "RPO",
  copyright: "Copyright",
};

const OUTSIDE_VALUE: Record<OutsideValue, StatusView> = {
  NOT_SUBMITTED: { label: "Not submitted", tone: "neutral" },
  NOT_APPLIED: { label: "Not applied", tone: "neutral" },
  UNDER_REVIEW: { label: "Under review", tone: "pending" },
  UNDER_CHECK: { label: "Under check", tone: "pending" },
  UNDER_EDITING: { label: "Under editing", tone: "pending" },
  APPLIED: { label: "Applied", tone: "pending" },
  CHANGES_REQUIRED: { label: "Changes required", tone: "returned" },
  FAILED: { label: "Failed", tone: "returned" },
  APPROVED: { label: "Approved", tone: "done" },
  PASSED: { label: "Passed", tone: "done" },
  DONE: { label: "Done", tone: "done" },
  REGISTERED: { label: "Registered", tone: "done" },
};

/** Outside statuses are set by the Coordinator from the outside office (BR-14). */
export function outsideStatusView(kind: OutsideKind, value: OutsideValue): StatusView & { kindLabel: string } {
  return { ...OUTSIDE_VALUE[value], kindLabel: OUTSIDE_KIND_LABEL[kind] };
}
