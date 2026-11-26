// Source: design/screens/README.md (Sidebars), spec/SITEMAP.md §9, DESIGN.md §5.1. Task R2.1 (UX-027, UX-028).
// The sidebar items of each role, in README order. Pure: no data access. The role shell computes `NavFacts`
// from data functions that exist and check access (IMPLEMENTATION_PLAN.md §9, Task R2.1).
// Left out until their routes exist: "Thesis process" (R4) and the Coordinator "Audit" (R7d).
// Left out because no list route exists (decision R2-b): the Coordinator "Defense" item; "Submission" for
// the Adviser, the Panel Member and the Coordinator (they open SV from a record row).
// Glyphs: D-07 as chosen at UX-P-02 (option A, Availability option B).
import type { GlyphName } from "@/components/patterns/glyphs";

/** The same values as `UserRole` in src/server/data/schema/enums.ts. A pattern imports nothing from src/server/. */
export type NavRole = "student" | "adviser" | "panel_member" | "coordinator";

export type NavItem = {
  label: string;
  /** Null only for a locked item that has no target yet. */
  href: string | null;
  glyph: GlyphName;
  /** The reason the item is not open yet, in SITEMAP §9 words. Null when the item is open. */
  lockedReason: string | null;
  count?: number;
};

export type NavFacts = {
  /** 1 Proposal, 2 Pre-Final, 3 Final. Null when the Student has no thesis yet. */
  milestone: 1 | 2 | 3 | null;
  milestoneId: string | null;
  /** The submission PR of the current milestone (Manuscript item). */
  prId: string | null;
  gate1bDone: boolean;
  sheetsVerified: boolean;
  defenseId: string | null;
  /** Panel Member: the appointment form and the member's NDA are recorded (BR-08). */
  panelAccess: boolean;
  /** Null when the data does not give the start time: the item then shows open (Task R2.1 rule). */
  defenseStarted: boolean | null;
};

export const NO_FACTS: NavFacts = {
  milestone: null,
  milestoneId: null,
  prId: null,
  gate1bDone: false,
  sheetsVerified: false,
  defenseId: null,
  panelAccess: false,
  defenseStarted: null,
};

/** Word for word from spec/SITEMAP.md §9 and IMPLEMENTATION_PLAN.md Task R2.1. */
export const LOCKED = {
  clearance: "Opens at Milestone 3.",
  submission: "Opens at Gate 1b.",
  results: "Opens when the Coordinator verifies the sheets.",
  defenseDay: "Opens at the scheduled start.",
  panelManuscript: "Opens when your appointment and NDA are recorded.",
  /** Decision R2-b, option B. */
  fromRecord: "Open it from a record.",
  /** No SITEMAP row: the Student has no thesis record yet (first day). Owner to confirm the words. */
  noThesis: "Opens when the Coordinator sets up your thesis.",
} as const;

export type NavOptions = {
  /** R2-b: "omit" (option A, recommended) leaves Submission out of the record-based roles; "locked" shows it locked. */
  recordItems?: "omit" | "locked";
};

const open = (label: string, href: string, glyph: GlyphName): NavItem => ({ label, href, glyph, lockedReason: null });
const gated = (label: string, glyph: GlyphName, href: string | null, reason: string | null): NavItem =>
  href && !reason ? open(label, href, glyph) : { label, href: null, glyph, lockedReason: reason ?? LOCKED.noThesis };

function defenseDay(base: string, f: NavFacts): NavItem {
  if (!f.defenseId || f.defenseStarted === false) return gated("Defense Day", "defense", null, LOCKED.defenseDay);
  return open("Defense Day", `${base}/defense/${f.defenseId}`, "defense");
}

export function navFor(role: NavRole, f: NavFacts, opts: NavOptions = {}): NavItem[] {
  const submissionFromRecord = opts.recordItems === "locked" ? [gated("Submission", "submission", null, LOCKED.fromRecord)] : [];
  switch (role) {
    case "student":
      return [
        open("Dashboard", "/student/dashboard", "overview"),
        gated("Manuscript", "manuscript", f.prId && `/student/pr/${f.prId}`, f.prId ? null : LOCKED.noThesis),
        open("Documents", "/student/documents", "template"),
        open("Schedule", "/student/schedule", "schedule"),
        gated("Defense results", "results", f.defenseId && `/student/defense/${f.defenseId}`, f.sheetsVerified && f.defenseId ? null : LOCKED.results),
        gated("Clearance", "clear", "/student/clearance", f.milestone === 3 ? null : LOCKED.clearance),
        gated("Submission", "submission", f.milestoneId && `/student/submission/${f.milestoneId}`, f.gate1bDone && f.milestoneId ? null : LOCKED.submission),
      ];
    case "adviser":
      return [
        open("Advisees", "/adviser/dashboard", "advisees"),
        // The review queue is a section of A1. A hash link is never marked active (`isActive`).
        open("Review queue", "/adviser/dashboard#queue", "queue"),
        open("Consultations", "/adviser/consultations", "consult"),
        open("Availability", "/adviser/availability", "availability"),
        defenseDay("/adviser", f),
        ...submissionFromRecord,
      ];
    case "panel_member":
      return [
        open("Assignments", "/panel/dashboard", "assignments"),
        gated("Manuscript", "manuscript", f.prId && `/panel/pr/${f.prId}`, f.panelAccess && f.prId ? null : LOCKED.panelManuscript),
        open("Availability", "/panel/availability", "availability"),
        defenseDay("/panel", f),
        ...submissionFromRecord,
      ];
    case "coordinator":
      return [
        open("Overview", "/coordinator/dashboard", "overview"),
        open("Students", "/coordinator/students", "student"),
        open("Committees", "/coordinator/committees", "seat"),
        open("Documents", "/coordinator/documents", "verify"),
        open("Schedule", "/coordinator/schedule", "schedule"),
        open("Clearance", "/coordinator/clearance", "clear"),
        open("Templates", "/coordinator/templates", "template"),
        open("Users", "/coordinator/users", "users"),
        ...submissionFromRecord,
      ];
  }
}

/** The item is active on its route and on child routes. A hash link is never active (two items would match). */
export function isActive(href: string | null, pathname: string): boolean {
  if (!href || href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
