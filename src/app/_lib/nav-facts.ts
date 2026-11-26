// Task R2.8 (approved at UX-P-02, 26 Nov 2026): the sidebar facts from data results that exist and check access.
// Pure: no query here. The role shell calls the data functions (studentTracker, submissionFor,
// adviserDashboard, panelDashboard) and passes the results.
import { NO_FACTS, type NavFacts } from "@/components/patterns/sidebar/nav";
import type { AdviserDashboard, PanelDashboard } from "@/server/data/queues";
import type { StudentTracker } from "@/server/data/tracker";

const MILESTONE = { proposal: 1, pre_final: 2, final: 3 } as const;

// The owner approved the status rule (UX-P-02): a stage closes only when every sheet is verified (BR-02,
// SITEMAP §9 "Close a stage"), so CLOSED and later mean "verified". Before the close, the item stays locked.
const VERIFIED = new Set(["CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED"]);

export function studentNavFacts(t: Pick<StudentTracker, "current" | "keyDates" | "defense"> | null, prId: string | null): NavFacts {
  if (!t) return NO_FACTS;
  return {
    ...NO_FACTS,
    milestone: MILESTONE[t.current.code],
    milestoneId: t.current.milestoneId,
    prId,
    gate1bDone: t.keyDates.earliestDefenseDate !== null,
    defenseId: t.defense?.attemptId ?? null,
    sheetsVerified: VERIFIED.has(t.current.status),
  };
}

/** R2-b: the Adviser has many advisees. Defense Day links the first advisee with a scheduled or held defense. */
export function adviserNavFacts(d: Pick<AdviserDashboard, "advisees">): NavFacts {
  const withDefense = d.advisees.find((a) => a.attemptId);
  // AdviseeRow has no start time, so the item shows open; the A5 page keeps its own block (gap recorded at UX-P-02).
  return { ...NO_FACTS, defenseId: withDefense?.attemptId ?? null, defenseStarted: null };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** R2-b: the assignment with the next defense (a defense that started less than a day ago counts), else the first. */
export function panelNavFacts(d: Pick<PanelDashboard, "assignments">, now: Date = new Date()): NavFacts {
  if (d.assignments.length === 0) return NO_FACTS;
  const upcoming = d.assignments
    .filter((a) => a.defense && a.defense.startsAt.getTime() > now.getTime() - DAY_MS)
    .sort((x, y) => x.defense!.startsAt.getTime() - y.defense!.startsAt.getTime());
  const pick = upcoming[0] ?? d.assignments[0]!;
  return {
    ...NO_FACTS,
    prId: pick.prId,
    panelAccess: pick.access.open,
    defenseId: pick.attemptId,
    defenseStarted: pick.defense ? pick.defense.startsAt.getTime() <= now.getTime() : null,
  };
}
