// Compliance checklist for date confirmation (FR-DOC-08, INV-13). Pure code.
// The data layer loads the document states and the outside statuses, then passes
// `checklistComplete(...)` as the `defenseChecklistComplete` fact of the state machine.

import type { DocumentState } from "./documents";
import type { IpmoValue, MilestoneCode } from "./milestone";

export type EthicsValue = "NOT_SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUIRED" | "APPROVED";

export type ChecklistFacts = {
  /** State of each form in this milestone, by form code: "TDW 03", "TDW 06", "TDW 07", ... */
  documents: Readonly<Record<string, DocumentState | undefined>>;
  /** NDA (TDW 05) state of each appointed seat. Empty when no seat exists. */
  ndas: readonly DocumentState[];
  /** Official receipt (OR) state. */
  officialReceipt: DocumentState | undefined;
  ethics: EthicsValue;
  ipmo: IpmoValue;
};

export type ChecklistItem = { id: string; label: string; done: boolean };

// AD-B-013: a submitted scan counts once it is locked. A Mismatch still counts (BR-12:
// it never stops the defense). The appointment form, the NDAs and the OR must be verified.
const SUBMITTED: readonly DocumentState[] = ["locked_as_submitted", "physical_received", "verified", "mismatch"];
const submitted = (s: DocumentState | undefined) => s !== undefined && SUBMITTED.includes(s);
const verified = (s: DocumentState | undefined) => s === "verified";
const allVerified = (list: readonly DocumentState[]) => list.length > 0 && list.every(verified);

/** The FR-DOC-08 list for one milestone, in the order the screen shows it. */
export function complianceChecklist(milestone: MilestoneCode, f: ChecklistFacts): ChecklistItem[] {
  const tdw03: ChecklistItem = { id: "tdw03", label: "TDW 03 submitted", done: submitted(f.documents["TDW 03"]) };
  const or: ChecklistItem = { id: "or", label: "Official receipt verified", done: verified(f.officialReceipt) };

  if (milestone === "proposal") {
    return [
      tdw03,
      { id: "tdw06", label: "TDW 06 appointment form verified", done: verified(f.documents["TDW 06"]) },
      { id: "ndas", label: "Every NDA verified", done: allVerified(f.ndas) },
      { id: "tdw07", label: "TDW 07 scan submitted", done: submitted(f.documents["TDW 07"]) },
      { id: "ethics", label: "Ethics approved", done: f.ethics === "APPROVED" },
      or,
    ];
  }
  if (milestone === "pre_final") {
    return [
      tdw03,
      { id: "tdw09", label: "TDW 09 scan submitted", done: submitted(f.documents["TDW 09"]) },
      { id: "ipmo", label: "IPMO check passed", done: f.ipmo === "PASSED" },
      or,
    ];
  }
  return [
    tdw03,
    { id: "tdw11", label: "TDW 11 appointment form verified", done: verified(f.documents["TDW 11"]) },
    { id: "ndas", label: "Every NDA verified", done: allVerified(f.ndas) },
    { id: "tdw12", label: "TDW 12 scan submitted", done: submitted(f.documents["TDW 12"]) },
    or,
  ];
}

export function checklistComplete(milestone: MilestoneCode, f: ChecklistFacts): boolean {
  return complianceChecklist(milestone, f).every((i) => i.done);
}
