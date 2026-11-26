// The link of a blank TDW form (DESIGN.md §8.12, decision R4-b A at UX-P-04, FR-DOC-01).
// The 13 blank forms are public university forms with no student data. They are static files in public/forms,
// copied byte for byte from docs/reference/tdw-forms. After Phase 4 (FR-DOC-04, FR-DOC-05) "Download form" gives the
// prefilled form; the control does not change, only this link.

/** `/forms/TDW-07.doc` for `TDW_07`, or null when the record has no blank form (OR, Minutes, evidence). */
export function blankFormHref(code: string): string | null {
  const m = /^TDW[_ ](\d{2})$/.exec(code);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 13 ? `/forms/TDW-${m[1]}.doc` : null;
}
