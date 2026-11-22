// Document lifecycle (FR-DOC-02, FR-DOC-03, FR-DOC-06, FR-DOC-07, BR-12, BR-13, BR-19, ERD §7.2).
// Pure code: no database and no framework. The data layer writes the
// `document_record` state and the history row for each change (P1-E07).

export type DocumentState =
  | "not_started"
  | "prepared"
  | "scan_uploaded"
  | "locked_as_submitted"
  | "physical_received"
  | "verified"
  | "mismatch"
  | "returned";

/** `system` is the app (prefill, lock on upload). `uploader` is the Student, or the Coordinator for TDW 05, 06 and 11 (FR-CMT-04). */
export type DocumentActor = "system" | "uploader" | "coordinator";

export type DocumentBlockCode = "not_allowed" | "wrong_actor" | "reason_required";

export type DocumentDecision = { ok: true } | { ok: false; code: DocumentBlockCode; reason: string };

const MESSAGES: Record<DocumentBlockCode, string> = {
  not_allowed: "This document change is not allowed. A locked scan changes only through a Return.",
  wrong_actor: "Your role cannot make this change.",
  reason_required: "Write a reason for the Return.",
};

type Row = { from: DocumentState | "*"; to: DocumentState; actors: DocumentActor[] };

// ERD §7.2, row `document_record.state`, in the same order.
const ROWS: readonly Row[] = [
  // FR-DOC-04: the app prefills the form.
  { from: "not_started", to: "prepared", actors: ["system"] },
  // FR-DOC-03: the signed scan is uploaded ...
  { from: "prepared", to: "scan_uploaded", actors: ["uploader"] },
  // ... and locks on upload (BR-19).
  { from: "scan_uploaded", to: "locked_as_submitted", actors: ["system"] },
  { from: "locked_as_submitted", to: "physical_received", actors: ["coordinator"] },
  { from: "physical_received", to: "verified", actors: ["coordinator"] },
  // FR-DOC-07, BR-12: any of the last three can become a mismatch.
  { from: "locked_as_submitted", to: "mismatch", actors: ["coordinator"] },
  { from: "physical_received", to: "mismatch", actors: ["coordinator"] },
  { from: "verified", to: "mismatch", actors: ["coordinator"] },
  // A corrected file locks again.
  { from: "mismatch", to: "locked_as_submitted", actors: ["uploader"] },
  // FR-DOC-06: any state can be returned, with a reason (BR-13).
  { from: "*", to: "returned", actors: ["coordinator"] },
  { from: "returned", to: "scan_uploaded", actors: ["uploader"] },
];

const block = (code: DocumentBlockCode): DocumentDecision => ({ ok: false, code, reason: MESSAGES[code] });

export function decideDocumentChange(
  from: DocumentState,
  to: DocumentState,
  actor: DocumentActor,
  returnReason: string | null = null,
): DocumentDecision {
  if (from === to) return block("not_allowed");
  const rows = ROWS.filter((r) => (r.from === from || r.from === "*") && r.to === to);
  if (rows.length === 0) return block("not_allowed");
  if (!rows.some((r) => r.actors.includes(actor))) return block("wrong_actor");
  if (to === "returned" && !returnReason?.trim()) return block("reason_required");
  return { ok: true };
}

/** A scan exists and is locked: a new file needs a Return or a Mismatch first (FR-DOC-03, BR-19). */
export function canUploadScan(state: DocumentState): boolean {
  return state === "prepared" || state === "returned" || state === "mismatch";
}

/** BR-12: a mismatch never stops the defense, but the stage cannot close while one is open. */
export function blocksStageClose(states: readonly DocumentState[]): boolean {
  return states.includes("mismatch");
}
