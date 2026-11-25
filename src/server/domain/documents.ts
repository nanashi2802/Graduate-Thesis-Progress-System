// Document lifecycle (FR-DOC-02, FR-DOC-03, FR-DOC-06, FR-DOC-07, BR-12, BR-13, BR-19, ERD §7.2, D-28).
// Pure code: no database and no framework. The data layer writes the
// `document_record` state and the history row for each change (P1-E07).

export type DocumentState =
  | "not_started"
  | "prepared"
  | "scan_uploaded"
  | "locked_as_submitted"
  | "verified"
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

type Row = { from: DocumentState; to: DocumentState; actors: DocumentActor[] };

// ERD §7.2, row `document_record.state`, in the same order.
const ROWS: readonly Row[] = [
  // FR-DOC-04: the app prefills the form.
  { from: "not_started", to: "prepared", actors: ["system"] },
  // FR-DOC-03: the signed scan is uploaded ...
  { from: "prepared", to: "scan_uploaded", actors: ["uploader"] },
  // ... and locks on upload (BR-19).
  { from: "scan_uploaded", to: "locked_as_submitted", actors: ["system"] },
  // FR-DOC-06: the Coordinator verifies a locked scan. A verified document is final (BR-19, D-28).
  { from: "locked_as_submitted", to: "verified", actors: ["coordinator"] },
  // FR-DOC-07: the Coordinator returns a scan with a reason (BR-13). A Return replaces the old Mismatch (D-28).
  { from: "scan_uploaded", to: "returned", actors: ["coordinator"] },
  { from: "locked_as_submitted", to: "returned", actors: ["coordinator"] },
  // The uploader sends a corrected scan.
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
  const rows = ROWS.filter((r) => r.from === from && r.to === to);
  if (rows.length === 0) return block("not_allowed");
  if (!rows.some((r) => r.actors.includes(actor))) return block("wrong_actor");
  if (to === "returned" && !returnReason?.trim()) return block("reason_required");
  return { ok: true };
}

/** A scan exists and is locked: a new file needs a Return first (FR-DOC-03, BR-19). */
export function canUploadScan(state: DocumentState): boolean {
  return state === "prepared" || state === "returned";
}

/** BR-12: a returned document never stops the defense, but the stage cannot close while one is open. */
export function blocksStageClose(states: readonly DocumentState[]): boolean {
  return states.includes("returned");
}
