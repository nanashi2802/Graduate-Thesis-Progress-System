// P1-E11-T01: the next-action card for each milestone and status (FR-TRK-01, NFR-04, BR-18).
import { describe, expect, it } from "vitest";
import { statusesFor, type MilestoneCode } from "@/server/domain/milestone";
import { nextAction } from "@/server/domain/next-action";

const facts = { returnReason: null, minNoticeDays: 7, defenseDate: null };
const MILESTONES: MilestoneCode[] = ["proposal", "pre_final", "final"];
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe("nextAction", () => {
  it("answers for each status of each milestone", () => {
    for (const m of MILESTONES) {
      for (const status of [...statusesFor(m), "RETURNED" as const]) {
        const n = nextAction(m, status, facts);
        expect(n.text.length, `${m} ${status}`).toBeGreaterThan(0);
      }
    }
  });

  it("gives a Student button only when the Student acts (BR-18)", () => {
    for (const m of MILESTONES) {
      for (const status of statusesFor(m)) {
        const n = nextAction(m, status, facts);
        expect(n.action !== null, `${m} ${status}`).toBe(n.actor === "student");
      }
    }
  });

  it("names the role that acts in the transition table", () => {
    expect(nextAction("proposal", "READY", facts).actor).toBe("adviser");
    expect(nextAction("proposal", "ADVISER_ENDORSED", facts)).toMatchObject({ actor: "coordinator", text: "The Coordinator appoints your Evaluation Committee." });
    expect(nextAction("final", "ADVISER_ENDORSED", facts).text).toContain("Final Panel");
    expect(nextAction("pre_final", "ADVISER_ENDORSED", facts).actor).toBe("committee"); // No appointment at Pre-Final (FR-CMT-01).
    expect(nextAction("proposal", "COMMITTEE_ENDORSED", facts)).toMatchObject({ actor: "student", action: "Choose a date" });
    expect(nextAction("proposal", "DATE_PROPOSED", facts).actor).toBe("coordinator");
    expect(nextAction("proposal", "DEFENSE_HELD", facts).actor).toBe("coordinator");
  });

  it("shows the notice days and the defense date", () => {
    expect(nextAction("proposal", "COMMITTEE_ENDORSED", { ...facts, minNoticeDays: 10 }).text).toContain("10 days");
    expect(nextAction("proposal", "DEFENSE_SCHEDULED", { ...facts, defenseDate: "2026-12-15" }).text).toContain("2026-12-15");
  });

  it("names the data gathering approval at CERTIFIED until the Adviser gives it (FR-WFL-11)", () => {
    expect(nextAction("proposal", "CERTIFIED", facts)).toMatchObject({ actor: "adviser", action: null });
    expect(nextAction("proposal", "CERTIFIED", facts).text).toContain("data gathering");
    expect(nextAction("proposal", "CERTIFIED", { ...facts, dataGatheringApproved: true })).toMatchObject({ actor: "none" });
  });

  it("shows the written reason after a Return (BR-13)", () => {
    const n = nextAction("proposal", "DRAFT", { ...facts, returnReason: "The method chapter is missing." });
    expect(n.text).toContain("The method chapter is missing.");
    expect(n.action).toBe("Open the manuscript");
    expect(nextAction("proposal", "RETURNED", { ...facts, returnReason: "x" }).text).toContain("returned");
  });

  it("keeps each sentence short and uses the project terms (AGENTS.md §5, §8)", () => {
    for (const m of MILESTONES) {
      for (const status of statusesFor(m)) {
        const { text } = nextAction(m, status, facts);
        expect(wordCount(text), text).toBeLessThanOrEqual(25);
        expect(text).not.toMatch(/Evaluator|Admin\b/);
      }
    }
  });
});
