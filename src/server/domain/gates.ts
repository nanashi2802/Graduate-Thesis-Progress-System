// The checks for one actor's gate action (FR-WFL-03 to 05, FR-WFL-07, BR-13, BR-20).
// Pure code. The data layer counts the actor's own OPEN threads (BR-05) and reads the
// outside statuses (BR-14), then calls these before it writes the gate_action row.
// When the last member endorses, milestone.ts decides the status change.
import type { IpmoValue, MilestoneCode, RpoValue } from "./milestone";

export type GateBlockCode =
  | "wrong_actor"
  | "reason_required"
  | "coordinator_content_return"
  | "open_threads"
  | "ipmo_not_passed"
  | "revisions_not_accepted"
  | "clearance_incomplete";

/** Every refusal carries a reason to show (BR-18, FR-WFL-13). */
export type GateDecision = { ok: true } | { ok: false; code: GateBlockCode; reason: string };

// Messages from Operational Flow v3.1 §4.7 where it has one.
const MESSAGES: Record<GateBlockCode, string> = {
  wrong_actor: "Your role cannot make this change.",
  reason_required: "Write a reason for the Return.",
  coordinator_content_return: "A Coordinator Return is for compliance or eligibility only.",
  open_threads: "You have open threads. Resolve them first.",
  ipmo_not_passed: "The IPMO check has not passed.",
  revisions_not_accepted: "Accept the Pre-Final revisions first.",
  clearance_incomplete: "A clearance item is incomplete.",
};

const block = (code: GateBlockCode): GateDecision => ({ ok: false, code, reason: MESSAGES[code] });
const pass: GateDecision = { ok: true };

export type ReturnPurpose = "compliance" | "eligibility" | "content";

/** INV-19, BR-13: every Return has a written reason. A Coordinator Return is for compliance or eligibility only. */
export function checkReturn(input: {
  role: "student" | "adviser" | "panel_member" | "coordinator";
  reason: string | null;
  purpose: ReturnPurpose | null;
}): GateDecision {
  if (input.role === "student") return block("wrong_actor");
  if (!input.reason?.trim()) return block("reason_required");
  if (input.role === "coordinator" && input.purpose !== "compliance" && input.purpose !== "eligibility") {
    return block("coordinator_content_return");
  }
  return pass;
}

/** INV-20, FR-WFL-03: the Adviser endorses a Ready commit. */
export function checkGate1a(input: { milestone: MilestoneCode; ownOpenThreads: number; ipmo: IpmoValue }): GateDecision {
  if (input.ownOpenThreads > 0) return block("open_threads");
  if (input.milestone === "pre_final" && input.ipmo !== "PASSED") return block("ipmo_not_passed");
  return pass;
}

/** INV-21, FR-WFL-04: the Adviser or one Panel Member endorses the commit. */
export function checkGate1b(input: {
  milestone: MilestoneCode;
  ownOpenThreads: number;
  /** Milestone 3 only: this member accepted every Pre-Final revision item. */
  preFinalRevisionsAccepted: boolean;
}): GateDecision {
  if (input.ownOpenThreads > 0) return block("open_threads");
  if (input.milestone === "final" && !input.preFinalRevisionsAccepted) return block("revisions_not_accepted");
  return pass;
}

/** INV-22, FR-WFL-07, BR-20: one member marks the final manuscript approved. */
export function checkGate2(input: { ownOpenThreads: number; ipmo: IpmoValue; rpo: RpoValue }): GateDecision {
  if (input.ipmo !== "PASSED" || input.rpo !== "DONE") return block("clearance_incomplete");
  if (input.ownOpenThreads > 0) return block("open_threads");
  return pass;
}
