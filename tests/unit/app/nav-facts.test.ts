// Task R2.8 (UX-P-02 data facts): the role shell turns existing data results into sidebar facts. No new query.
import { describe, expect, it } from "vitest";
import { adviserNavFacts, panelNavFacts, studentNavFacts } from "@/app/_lib/nav-facts";
import { NO_FACTS } from "@/components/patterns/sidebar/nav";

const tracker = (over: Record<string, unknown> = {}) =>
  ({
    current: { milestoneId: "m-2", code: "pre_final", status: "DEFENSE_SCHEDULED" },
    keyDates: { earliestDefenseDate: "2027-01-19", printedCopiesDue: null, targetDate: null },
    defense: { attemptId: "d-2", date: "2027-01-26", roomOrLink: null, printedCopiesDue: "2027-01-19" },
    ...over,
  }) as never;

describe("studentNavFacts", () => {
  it("gives no facts when the Student has no thesis", () => {
    expect(studentNavFacts(null, null)).toEqual(NO_FACTS);
  });

  it("maps the milestone, Gate 1b, the defense and the PR", () => {
    expect(studentNavFacts(tracker(), "pr-2")).toMatchObject({ milestone: 2, milestoneId: "m-2", prId: "pr-2", gate1bDone: true, defenseId: "d-2", sheetsVerified: false });
  });

  it("reads Gate 1b as not done when no earliest defense date exists", () => {
    expect(studentNavFacts(tracker({ keyDates: { earliestDefenseDate: null } }), "pr-2").gate1bDone).toBe(false);
  });

  it.each(["CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED"])("treats the sheets as verified at %s (owner, UX-P-02)", (status) => {
    expect(studentNavFacts(tracker({ current: { milestoneId: "m-3", code: "final", status } }), "pr-3")).toMatchObject({ milestone: 3, sheetsVerified: true });
  });

  it.each(["DEFENSE_SCHEDULED", "DEFENSE_HELD", "DRAFT"])("keeps the sheets unverified at %s", (status) => {
    expect(studentNavFacts(tracker({ current: { milestoneId: "m-3", code: "final", status } }), "pr-3").sheetsVerified).toBe(false);
  });
});

describe("adviserNavFacts", () => {
  it("links the first advisee with a defense; the start time is not known", () => {
    const f = adviserNavFacts({ advisees: [{ attemptId: null, prId: "a" }, { attemptId: "d-9", prId: "b" }] } as never);
    expect(f).toMatchObject({ defenseId: "d-9", defenseStarted: null });
  });
  it("gives no defense when no advisee has one", () => {
    expect(adviserNavFacts({ advisees: [] } as never).defenseId).toBeNull();
  });
});

describe("panelNavFacts", () => {
  const now = new Date("2027-01-20T02:00:00Z");
  const a = (id: string, startsAt: string | null, open = true) => ({
    prId: `pr-${id}`,
    attemptId: startsAt ? `d-${id}` : null,
    access: open ? { open: true } : { open: false, reason: "x" },
    defense: startsAt ? { startsAt: new Date(startsAt), roomOrLink: null } : null,
  });

  it("picks the assignment with the next defense (R2-b)", () => {
    const f = panelNavFacts({ assignments: [a("1", null), a("2", "2027-02-01T01:00:00Z"), a("3", "2027-01-25T01:00:00Z")] } as never, now);
    expect(f).toMatchObject({ prId: "pr-3", defenseId: "d-3", panelAccess: true, defenseStarted: false });
  });

  it("marks the defense started when today's start time has passed", () => {
    const f = panelNavFacts({ assignments: [a("4", "2027-01-20T01:00:00Z")] } as never, now);
    expect(f).toMatchObject({ defenseId: "d-4", defenseStarted: true });
  });

  it("falls back to the first assignment, and keeps its access state", () => {
    const f = panelNavFacts({ assignments: [a("5", null, false), a("6", null)] } as never, now);
    expect(f).toMatchObject({ prId: "pr-5", panelAccess: false, defenseId: null });
  });

  it("gives no facts with no assignment", () => {
    expect(panelNavFacts({ assignments: [] } as never, now)).toEqual(NO_FACTS);
  });
});
