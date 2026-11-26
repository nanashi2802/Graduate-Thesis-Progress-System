// The /lab pages, their round and their gate (IMPLEMENTATION_PLAN.md §7, DESIGN_DECISIONS.md §3).
// Add a row when a round adds a page. Change `gate` only when DESIGN_DECISIONS.md records the result.
export type LabPage = {
  path: string;
  title: string;
  round: string;
  gate: string; // the UX-P-nn round that approves it
  built: boolean;
};

export type GateState = "Not shown" | "Waiting" | "Approved" | "Approved with changes" | "Rejected";

// Copy of the "Result" column of DESIGN_DECISIONS.md §3, 26 Nov 2026.
export const GATES: Record<string, GateState> = {
  "UX-P-01": "Approved",
  "UX-P-02": "Approved",
  "UX-P-03": "Approved",
  "UX-P-04": "Approved",
  "UX-P-05": "Approved",
  "UX-P-06": "Not shown",
  "UX-P-07": "Not shown",
};

export const LAB_PAGES: LabPage[] = [
  { path: "/lab/foundations", title: "Foundations: tokens, type, spacing, focus", round: "R1", gate: "UX-P-01", built: true },
  { path: "/lab/glyphs", title: "Glyphs", round: "R1", gate: "UX-P-01", built: true },
  { path: "/lab/brand", title: "Brand mark: hybrid logo (UX-D-10)", round: "R1", gate: "UX-P-01", built: true },
  { path: "/lab/typography", title: "Typography options (owner request)", round: "R1", gate: "UX-P-01", built: true },
  ...["status", "blocked-action", "flag", "empty-state", "identity-line", "docket", "stepper", "theme-toggle"].map((p) => ({
    path: `/lab/patterns/${p}`,
    title: `Pattern: ${p}`,
    round: "R1",
    gate: "UX-P-01",
    built: true,
  })),
  ...["app-shell", "sidebar", "top-bar", "toast"].map((p) => ({ path: `/lab/patterns/${p}`, title: `Pattern: ${p}`, round: "R2", gate: "UX-P-02", built: true })),
  { path: "/lab/states", title: "System states", round: "R2", gate: "UX-P-02", built: true },
  { path: "/lab/motion", title: "Motion options (D-10)", round: "R2", gate: "UX-P-02", built: true },
  { path: "/lab/glyphs#candidates", title: "Glyph candidates (D-06, D-07)", round: "R2", gate: "UX-P-02", built: true },
  ...["queue-table", "kpi-strip", "inbox", "return-composer", "dialog", "side-sheet", "form-field"].map((p) => ({
    path: `/lab/patterns/${p}`,
    title: `Pattern: ${p}`,
    round: "R3",
    gate: "UX-P-03",
    built: true,
  })),
  ...["task-list", "step-by-step"].map((p) => ({ path: `/lab/patterns/${p}`, title: `Pattern: ${p}`, round: "R4", gate: "UX-P-04", built: true })),
  { path: "/lab/screens/PROCESS", title: "Screen: PROCESS (Thesis process)", round: "R4", gate: "UX-P-04", built: true },
  ...["merge-box", "gate-box", "commit-selector", "thread-feed", "pdf-viewer"].map((p) => ({ path: `/lab/patterns/${p}`, title: `Pattern: ${p}`, round: "R5", gate: "UX-P-05", built: true })),
  ...(["student", "adviser", "panel"] as const).map((r) => ({
    path: `/lab/patterns/workspace?role=${r}`,
    title: `Pattern: workspace (${r === "student" ? "S2 Student" : r === "adviser" ? "A2 Adviser" : "P2 Panel Member"})`,
    round: "R5",
    gate: "UX-P-05",
    built: true,
  })),
];
