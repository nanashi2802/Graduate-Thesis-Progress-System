// Labels for codes (UX-016, G11: no enum names or codes in the UI). Pure data.
// The unit test checks that every value of the schema enums has a label.

const FORM: Record<string, string> = {
  OR: "Official receipt",
  ETHICS_CERT: "Ethics certificate",
  CERTIFICATION: "Certification",
  SIGNED_FINAL_MANUSCRIPT: "Signed final manuscript",
  MINUTES: "Minutes",
  FINAL_COPY: "Final copy",
  CONFERENCE_CERT: "Conference certificate",
  JOURNAL_PUB: "Journal publication",
  SUPPORTING: "Supporting document",
};

/** "TDW_03" and "TDW 03" give "TDW 03". Other codes give a short name. */
export function formLabel(code: string): string {
  if (/^TDW[_ ]\d{2}$/.test(code)) return code.replace("_", " ");
  return FORM[code] ?? code.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

const GATE: Record<string, string> = {
  gate_1a: "Gate 1a",
  gate_1b: "Gate 1b",
  certification: "Certification",
  gate_2: "Gate 2",
  date_confirmation: "Defense date confirmed",
  stage_close: "Stage closed",
  clearance_close: "Clearance closed",
  data_gathering: "Data gathering",
};

export function gateLabel(kind: string): string {
  return GATE[kind] ?? kind.replace(/_/g, " ");
}

// "approved" stays until the owner decides UX-X-05 (Endorse and Return against the UTP names).
const RESULT: Record<string, string> = {
  endorsed: "Endorsed",
  returned: "Returned",
  accepted: "Accepted",
  approved: "Approved",
  recorded: "Recorded",
};

export function gateResultLabel(result: string): string {
  return RESULT[result] ?? result;
}
