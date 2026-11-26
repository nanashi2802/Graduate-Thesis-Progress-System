// Task R2.7 (D-06, D-07): candidate glyphs for gate UX-P-02. Lab only. Two options for each concept.
// Rules (brand guide, Icons; DESIGN.md §6.2): 24 × 24 grid, 1.75 px stroke, round caps and joins, outline only,
// currentColor. No star, seal, laurel, torch or other PUP logo shape (F1). After the gate, the approved paths move
// into GLYPHS in src/components/patterns/glyphs/index.tsx and into tests/unit/components/glyphs.test.ts.
import type { ReactNode } from "react";

export type Candidate = { concept: string; decision: "D-06" | "D-07"; name: string; note?: string; a: ReactNode; b: ReactNode };

export const CANDIDATES: Candidate[] = [
  // ---- D-06: status pill glyphs (today Lucide CircleDot, Clock, BadgeCheck) ----
  {
    concept: "Active (in progress)",
    decision: "D-06",
    name: "active",
    a: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8.5v7l5.5-3.5z" />
      </>
    ),
    b: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M13 9l3 3-3 3" />
      </>
    ),
  },
  {
    concept: "Pending (waiting for someone)",
    decision: "D-06",
    name: "pending",
    a: <path d="M7 3h10M7 21h10M8 3c0 4 3 6 4 9-1 3-4 5-4 9M16 3c0 4-3 6-4 9 1 3 4 5 4 9" />,
    b: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    concept: "Achieved (milestone reached)",
    decision: "D-06",
    name: "achieved",
    note: "Not a star, seal or laurel (F1).",
    a: (
      <>
        <path d="m3 20 6-9 4 5 3-4 5 8z" />
        <path d="M14 9V4l3.5 1.5L14 7" />
      </>
    ),
    b: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M10 17h4v4h-4z" />
      </>
    ),
  },
  // ---- D-07: sidebar glyphs ----
  {
    concept: "Thesis process",
    decision: "D-07",
    name: "process",
    a: (
      <>
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M7 6h7a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h7" />
      </>
    ),
    b: (
      <>
        <circle cx="4.5" cy="6" r="1.5" />
        <circle cx="4.5" cy="12" r="1.5" />
        <circle cx="4.5" cy="18" r="1.5" />
        <path d="M9 6h11M9 12h11M9 18h11" />
      </>
    ),
  },
  {
    concept: "Manuscript",
    decision: "D-07",
    name: "manuscript",
    note: "Brand icon sheet name.",
    a: <path d="M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 15h6M9 18h4" />,
    b: <path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />,
  },
  {
    concept: "Schedule",
    decision: "D-07",
    name: "schedule",
    note: "Brand icon sheet name.",
    a: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="1.5" />
        <path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2" />
      </>
    ),
    b: <path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10" />,
  },
  {
    concept: "Defense results",
    decision: "D-07",
    name: "results",
    a: (
      <>
        <rect x="6" y="4" width="12" height="17" rx="1.5" />
        <path d="M9 4V3h6v1M9 13l2 2 4-4" />
      </>
    ),
    b: <path d="M5 3h14v18H5zM9 17v-4M12 17v-7M15 17v-2" />,
  },
  {
    concept: "Submission",
    decision: "D-07",
    name: "submission",
    a: <path d="M3 7h18v4H3zM5 11v9h14v-9M10 15h4" />,
    b: (
      <>
        <path d="M8 3h10v14H8zM6 6v15h10" />
        <path d="m11 10 1.5 1.5 3-3" />
      </>
    ),
  },
  {
    concept: "Advisees",
    decision: "D-07",
    name: "advisees",
    a: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M15.5 15.2A4.5 4.5 0 0 1 21 19.5" />
      </>
    ),
    b: <path d="m2 9 10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" />,
  },
  {
    concept: "Review queue",
    decision: "D-07",
    name: "queue",
    a: <path d="M4 13h4l1.5 2h5l1.5-2h4M4 13l2-8h12l2 8v6H4zM8.5 9h7" />,
    b: <path d="M4 6h10M4 12h10M4 18h7M15 17l2 2 4-4" />,
  },
  {
    concept: "Consultations",
    decision: "D-07",
    name: "consult",
    a: <path d="M4 5h11v8H9l-3 3v-3H4zM15 9h5v8h-2v3l-3-3h-4v-1" />,
    b: <path d="M4 5h16v11H10l-4 4v-4H4zM8 9h8M8 12h5" />,
  },
  {
    concept: "Availability",
    decision: "D-07",
    name: "availability",
    a: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="1.5" />
        <path d="M3 10h18M8 3v4M16 3v4M7 14h3v3H7zM14 14h3v3h-3z" />
      </>
    ),
    b: (
      <>
        <path d="M11 21H3V5h18v6M3 10h18M8 3v4M16 3v4" />
        <circle cx="17" cy="17" r="4" />
        <path d="M17 15.5V17l1 1" />
      </>
    ),
  },
  {
    concept: "Assignments",
    decision: "D-07",
    name: "assignments",
    note: "Brand icon sheet: Committee.",
    a: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="1.5" />
        <path d="M9 4V3h6v1" />
        <circle cx="12" cy="11" r="2.5" />
        <path d="M8 18a4 4 0 0 1 8 0" />
      </>
    ),
    b: <path d="M3 7h18v13H3zM9 7V4h6v3M3 12h18" />,
  },
];

/** The owner's choice at UX-P-02 (26 Nov 2026). The chosen paths are now in GLYPHS. */
export const CHOSEN: Record<string, "a" | "b"> = { active: "b", pending: "a", achieved: "b", availability: "b" };
export const chosenOf = (name: string) => CHOSEN[name] ?? "a";

export function CandidateGlyph({ children, size = 20, label }: { children: ReactNode; size?: 16 | 20 | 30; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const })}
    >
      {children}
    </svg>
  );
}
