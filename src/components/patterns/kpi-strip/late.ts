// Decision R3-a (proposed at UX-P-03): when an age is "late" in the KPI strip and the inbox.
// The success targets belong to the owner (AGENTS.md §4), so option C (no late style) is the default until the owner
// sets them. A page computes `late` with `isLate` and passes it to the pattern.
export type QueueKind = "all" | "scans" | "dates" | "committees" | "defenses" | "clearance";

/** Days after which an item is late, by queue kind. `null`: never late. */
export type LatePolicy = Record<QueueKind, number | null>;

export const LATE_POLICIES = {
  /** One value, 5 days. */
  A: { all: 5, scans: 5, dates: 5, committees: 5, defenses: 5, clearance: 5 },
  /** A value for each queue kind. "All waiting" uses the smallest. */
  B: { all: 3, scans: 3, dates: 5, committees: 7, defenses: 5, clearance: 5 },
  /** No late style until the owner sets the targets (recommended for now). */
  C: { all: null, scans: null, dates: null, committees: null, defenses: null, clearance: null },
} as const satisfies Record<string, LatePolicy>;

export function isLate(kind: QueueKind, oldestDays: number | null, policy: LatePolicy): boolean {
  const limit = policy[kind];
  return oldestDays !== null && limit !== null && oldestDays > limit;
}
