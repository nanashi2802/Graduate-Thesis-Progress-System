// Source: own. The domain glyph set (DESIGN.md §6.2), copied from the <symbol> elements in
// design/mockups/coordinator-mockups.html. `g-mismatch` is `flag`, `g-def-a` is `defense`.
// Rules (brand guide, Icons; UX-D-11): 24 × 24 grid, 1.75 px stroke, round caps and joins, currentColor
// (so both themes work), outline only: the mockup's tone fills are removed. No PUP logo or seal shape (F1).
// The mockup drew `done` and `todo` at 1.6 and `search` with no round join: all use the brand rule here.
// Still to draw: the status glyphs of D-06 and the sidebar glyphs of D-07 (R2).
import type { ReactNode } from "react";

const GLYPHS = {
  audit: (
    <>
      <path d="M5 3h10v18H5zM8 7h4M8 10h4M8 13h2" />
      <circle cx="16" cy="15" r="3" />
      <path d="m18.2 17.2 2.8 2.8" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m9 15.5 2 2 4-4" />
    </>
  ),
  clear: (
    <>
      <path d="M5 4h12v14H5z" />
      <path d="M7 6v14h12V6" />
      <path d="m8 11 2 2 4-4" />
    </>
  ),
  commit: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M3 12h5.5M15.5 12H21" />
    </>
  ),
  defense: (
    <>
      <rect x="3" y="3" width="18" height="12" rx="1" />
      <path d="m7 11 3-3 2.5 2.5L17 6" />
      <path d="M12 15v3M8 21l4-3 4 3" />
    </>
  ),
  done: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  export: (
    <>
      <path d="M5 12v8h14v-8M12 3v11M8 7l4-4 4 4" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4h12l-3 5 3 5H6" />
    </>
  ),
  gate: (
    <>
      <path d="M4 20V6M20 20V6M4 8h16M7 8v12M17 8v12M12 8v12" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  overview: (
    <>
      <rect x="3" y="4" width="8" height="7" rx="1" />
      <path d="M14 5h7M14 9h5M3 15h18M3 19h12" />
    </>
  ),
  received: (
    <>
      <path d="M3 14h5l1.5 2h5L16 14h5v6H3zM3 14l3-9h12l3 9" />
      <path d="M12 4v7M9.5 8.5 12 11l2.5-2.5" />
    </>
  ),
  return: (
    <>
      <path d="M4 14h16v6H4zM14 4H9a4 4 0 0 0 0 8h6" />
      <path d="m12 9 3 3-3 3" />
    </>
  ),
  scan: (
    <>
      <path d="M14 3H6v12M14 3l4 4v4M14 3v4h4" />
      <path d="M3 18h18M8 9h4M8 12h3" />
      <path d="M5 21h14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  seat: (
    <>
      <path d="M8 4h8v7H8zM6 11h12v3H6zM7 14v6M17 14v6M7 17h10" />
    </>
  ),
  student: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
    </>
  ),
  template: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M5 8h14M8 12h8M8 15h8M8 18h5" />
    </>
  ),
  todo: (
    <>
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" />
    </>
  ),
  verify: (
    <>
      <path d="M4 3h11v4M4 3v14h5" />
      <path d="M9 7h11v14H9z" />
      <path d="m12 14 2 2 4-4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof GLYPHS;
export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];

export type GlyphProps = {
  name: GlyphName;
  /** 16 in text, 20 in buttons and the sidebar, 30 in the KPI strip (DESIGN.md §6.2). */
  size?: 16 | 20 | 30;
  /** Give a label only when the glyph stands alone. Without one it is hidden from screen readers. */
  label?: string;
  className?: string;
};

export function Glyph({ name, size = 16, label, className }: GlyphProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
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
      className={className}
      {...a11y}
    >
      {GLYPHS[name]}
    </svg>
  );
}
