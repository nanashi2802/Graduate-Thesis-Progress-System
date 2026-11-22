// P1-E04 domain part: the milestone state machine (ERD §7.1, FR-WFL-02, FR-WFL-08, FR-WFL-09).
// Pure functions. No database. The data layer gives the facts (P1-E04 wiring, Track A).
import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  decideTransition,
  statusesFor,
  type MilestoneFacts,
  type TransitionActor,
} from "@/server/domain/milestone";

const coordinator: TransitionActor = { kind: "coordinator" };
const adviser: TransitionActor = { kind: "adviser" };
const student: TransitionActor = { kind: "student" };
const system: TransitionActor = { kind: "system" };
const lead: TransitionActor = { kind: "panel_member", designation: "lead_panel_member" };
const chair: TransitionActor = { kind: "panel_member", designation: "panel_chair" };
const member: TransitionActor = { kind: "panel_member", designation: "none" };

// Facts where every guard passes. Each test breaks one fact.
const ok: MilestoneFacts = {
  hasReadyCommit: true,
  adviserOpenThreads: 0,
  ipmo: "PASSED",
  rpo: "DONE",
  returnReason: "Fix the format of Chapter 3.",
  appointmentAndNdasRecorded: true,
  gate1bComplete: true,
  gate1bCompletedOn: "2026-12-01",
  minNoticeDays: 7,
  proposedDate: "2026-12-08",
  defenseChecklistComplete: true,
  defenseDate: "2026-12-10",
  today: "2026-12-10",
  verdict: "approved",
  sheetsVerifiedAndMatched: true,
  minutesIssued: true,
  documentInMismatch: false,
  revisionItemsAllAccepted: true,
  certificationVerified: true,
  gate2Complete: true,
  signedFinalManuscriptVerified: true,
  clearanceItemsAllVerified: true,
};

describe("statusesFor (FR-WFL-02)", () => {
  it("adds CERTIFIED to Milestone 1 only", () => {
    expect(statusesFor("proposal")).toContain("CERTIFIED");
    expect(statusesFor("pre_final")).not.toContain("CERTIFIED");
    expect(statusesFor("final")).not.toContain("CERTIFIED");
  });
  it("adds FINAL_APPROVED and CLEARED to Milestone 3 only", () => {
    expect(statusesFor("final")).toEqual(expect.arrayContaining(["FINAL_APPROVED", "CLEARED"]));
    expect(statusesFor("proposal")).not.toContain("CLEARED");
    expect(statusesFor("pre_final")).not.toContain("FINAL_APPROVED");
  });
});

describe("ERD §7.1 table", () => {
  it("has 16 allowed transitions", () => {
    expect(ALLOWED_TRANSITIONS).toHaveLength(16);
  });
  it("refuses a change that is not in the table", () => {
    const r = decideTransition("proposal", "DRAFT", "CLOSED", coordinator, ok);
    expect(r).toEqual({ ok: false, code: "not_allowed", reason: expect.any(String) });
  });
  it("refuses a status that the milestone does not have", () => {
    expect(decideTransition("pre_final", "CLOSED", "CERTIFIED", coordinator, ok).ok).toBe(false);
    expect(decideTransition("proposal", "CLOSED", "FINAL_APPROVED", coordinator, ok).ok).toBe(false);
  });
});

describe("happy path for each milestone", () => {
  type Step = [string, string, TransitionActor];
  const m1: Step[] = [
    ["DRAFT", "READY", student],
    ["READY", "ADVISER_ENDORSED", adviser],
    ["ADVISER_ENDORSED", "COMMITTEE_APPOINTED", coordinator],
    ["COMMITTEE_APPOINTED", "COMMITTEE_ENDORSED", member],
    ["COMMITTEE_ENDORSED", "DATE_PROPOSED", student],
    ["DATE_PROPOSED", "DEFENSE_SCHEDULED", coordinator],
    ["DEFENSE_SCHEDULED", "DEFENSE_HELD", lead],
    ["DEFENSE_HELD", "CLOSED", coordinator],
    ["CLOSED", "CERTIFIED", coordinator],
  ];
  it.each(m1)("Milestone 1: %s to %s", (from, to, actor) => {
    expect(decideTransition("proposal", from as never, to as never, actor, ok)).toEqual({ ok: true });
  });

  it("Milestone 2 skips the appointment: ADVISER_ENDORSED to COMMITTEE_ENDORSED", () => {
    expect(decideTransition("pre_final", "ADVISER_ENDORSED", "COMMITTEE_ENDORSED", adviser, ok).ok).toBe(true);
    expect(decideTransition("pre_final", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED", coordinator, ok).ok).toBe(false);
  });
  it("Milestone 1 and 3 need the appointment", () => {
    expect(decideTransition("proposal", "ADVISER_ENDORSED", "COMMITTEE_ENDORSED", adviser, ok).ok).toBe(false);
    expect(decideTransition("final", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED", coordinator, ok).ok).toBe(true);
  });
  it("Milestone 3 ends at CLEARED", () => {
    expect(decideTransition("final", "DEFENSE_SCHEDULED", "DEFENSE_HELD", chair, ok).ok).toBe(true);
    expect(decideTransition("final", "CLOSED", "FINAL_APPROVED", coordinator, ok).ok).toBe(true);
    expect(decideTransition("final", "FINAL_APPROVED", "CLEARED", coordinator, ok).ok).toBe(true);
  });
});

describe("INV-17: only a Coordinator sets CLOSED, CERTIFIED, FINAL_APPROVED, CLEARED (BR-02)", () => {
  const cases: [string, string, string][] = [
    ["proposal", "DEFENSE_HELD", "CLOSED"],
    ["proposal", "CLOSED", "CERTIFIED"],
    ["final", "CLOSED", "FINAL_APPROVED"],
    ["final", "FINAL_APPROVED", "CLEARED"],
  ];
  const others = [student, adviser, lead, chair, member, system];
  it.each(cases)("%s: %s to %s", (m, from, to) => {
    expect(decideTransition(m as never, from as never, to as never, coordinator, ok).ok).toBe(true);
    for (const a of others) {
      expect(decideTransition(m as never, from as never, to as never, a, ok)).toMatchObject({
        ok: false,
        code: "wrong_actor",
      });
    }
  });
});

describe("INV-18 and INV-19: a Return needs a reason, then goes back to DRAFT (BR-13)", () => {
  it("refuses an Adviser Return with no reason", () => {
    for (const reason of [null, "", "   "]) {
      expect(
        decideTransition("proposal", "READY", "RETURNED", adviser, { ...ok, returnReason: reason }),
      ).toMatchObject({ ok: false, code: "reason_required" });
    }
  });
  it("accepts an Adviser Return with a reason", () => {
    expect(decideTransition("proposal", "READY", "RETURNED", adviser, ok).ok).toBe(true);
  });
  it("lets the Coordinator Return a date proposal with a reason", () => {
    expect(decideTransition("proposal", "DATE_PROPOSED", "RETURNED", coordinator, ok).ok).toBe(true);
    expect(
      decideTransition("proposal", "DATE_PROPOSED", "RETURNED", coordinator, { ...ok, returnReason: "" }).ok,
    ).toBe(false);
  });
  it("only the system moves RETURNED to DRAFT", () => {
    expect(decideTransition("proposal", "RETURNED", "DRAFT", system, ok).ok).toBe(true);
    expect(decideTransition("proposal", "RETURNED", "DRAFT", student, ok).ok).toBe(false);
  });
});

describe("INV-20: Gate 1a (FR-WFL-03)", () => {
  it("blocks the Adviser with open threads", () => {
    expect(
      decideTransition("proposal", "READY", "ADVISER_ENDORSED", adviser, { ...ok, adviserOpenThreads: 2 }),
    ).toEqual({ ok: false, code: "open_threads", reason: "You have open threads. Resolve them first." });
  });
  it("blocks Milestone 2 until IPMO is PASSED", () => {
    expect(
      decideTransition("pre_final", "READY", "ADVISER_ENDORSED", adviser, { ...ok, ipmo: "UNDER_CHECK" }),
    ).toEqual({ ok: false, code: "ipmo_not_passed", reason: "The IPMO check has not passed." });
  });
  it("does not check IPMO in Milestone 1", () => {
    expect(
      decideTransition("proposal", "READY", "ADVISER_ENDORSED", adviser, { ...ok, ipmo: "NOT_SUBMITTED" }).ok,
    ).toBe(true);
  });
});

describe("INV-21: Gate 1b completes the committee endorsement (FR-WFL-04)", () => {
  it("waits until every member endorsed", () => {
    expect(
      decideTransition("proposal", "COMMITTEE_APPOINTED", "COMMITTEE_ENDORSED", member, {
        ...ok,
        gate1bComplete: false,
      }),
    ).toMatchObject({ ok: false, code: "gate_1b_incomplete" });
  });
  it("refuses a Student or a Coordinator", () => {
    for (const a of [student, coordinator]) {
      expect(decideTransition("proposal", "COMMITTEE_APPOINTED", "COMMITTEE_ENDORSED", a, ok).ok).toBe(false);
    }
  });
});

describe("other guards", () => {
  it("Mark Ready needs a commit", () => {
    expect(decideTransition("proposal", "DRAFT", "READY", student, { ...ok, hasReadyCommit: false }).ok).toBe(false);
  });
  it("the appointment needs the form and NDAs", () => {
    expect(
      decideTransition("proposal", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED", coordinator, {
        ...ok,
        appointmentAndNdasRecorded: false,
      }).ok,
    ).toBe(false);
  });
  it("INV-12: the date is at least min_notice_days after Gate 1b (BR-09)", () => {
    const f = { ...ok, gate1bCompletedOn: "2026-12-01", minNoticeDays: 7 };
    expect(decideTransition("proposal", "COMMITTEE_ENDORSED", "DATE_PROPOSED", student, { ...f, proposedDate: "2026-12-07" }))
      .toMatchObject({ ok: false, code: "date_too_early" });
    expect(decideTransition("proposal", "COMMITTEE_ENDORSED", "DATE_PROPOSED", student, { ...f, proposedDate: "2026-12-08" }).ok)
      .toBe(true);
  });
  it("INV-12: no date before Gate 1b", () => {
    expect(
      decideTransition("proposal", "COMMITTEE_ENDORSED", "DATE_PROPOSED", student, { ...ok, gate1bCompletedOn: null }),
    ).toEqual({ ok: false, code: "gate_1b_incomplete", reason: "Locked until Gate 1b." });
  });
  it("INV-13: scheduling needs the checklist", () => {
    expect(
      decideTransition("proposal", "DATE_PROPOSED", "DEFENSE_SCHEDULED", coordinator, {
        ...ok,
        defenseChecklistComplete: false,
      }),
    ).toEqual({ ok: false, code: "checklist_incomplete", reason: "An item is missing. The screen names it." });
  });
  it("INV-15: the verdict needs the right designation and the defense date", () => {
    expect(decideTransition("proposal", "DEFENSE_SCHEDULED", "DEFENSE_HELD", member, ok).ok).toBe(false);
    expect(decideTransition("proposal", "DEFENSE_SCHEDULED", "DEFENSE_HELD", chair, ok).ok).toBe(false);
    expect(decideTransition("final", "DEFENSE_SCHEDULED", "DEFENSE_HELD", lead, ok).ok).toBe(false);
    expect(
      decideTransition("proposal", "DEFENSE_SCHEDULED", "DEFENSE_HELD", lead, { ...ok, today: "2026-12-09" }),
    ).toEqual({ ok: false, code: "before_defense_date", reason: "Allowed on or after the defense date." });
    expect(
      decideTransition("proposal", "DEFENSE_SCHEDULED", "DEFENSE_HELD", lead, { ...ok, verdict: null }).ok,
    ).toBe(false);
  });
  it("INV-16: closing needs verified sheets, Minutes and no mismatch", () => {
    for (const bad of [
      { sheetsVerifiedAndMatched: false },
      { minutesIssued: false },
      { documentInMismatch: true },
    ]) {
      expect(decideTransition("proposal", "DEFENSE_HELD", "CLOSED", coordinator, { ...ok, ...bad }).ok).toBe(false);
    }
  });
  it("FR-WFL-09: a Disapproved verdict goes back to DRAFT, and the stage does not close", () => {
    const f = { ...ok, verdict: "disapproved" as const };
    expect(decideTransition("proposal", "DEFENSE_HELD", "DRAFT", system, f).ok).toBe(true);
    expect(decideTransition("proposal", "DEFENSE_HELD", "DRAFT", system, ok).ok).toBe(false);
    expect(decideTransition("proposal", "DEFENSE_HELD", "CLOSED", coordinator, f).ok).toBe(false);
  });
  it("CERTIFIED needs accepted revision items and the verified Certification (INV-34)", () => {
    expect(decideTransition("proposal", "CLOSED", "CERTIFIED", coordinator, { ...ok, revisionItemsAllAccepted: false }).ok).toBe(false);
    expect(decideTransition("proposal", "CLOSED", "CERTIFIED", coordinator, { ...ok, certificationVerified: false }).ok).toBe(false);
  });
  it("FINAL_APPROVED needs Gate 2 and the signed final manuscript (INV-34)", () => {
    expect(decideTransition("final", "CLOSED", "FINAL_APPROVED", coordinator, { ...ok, gate2Complete: false }).ok).toBe(false);
    expect(
      decideTransition("final", "CLOSED", "FINAL_APPROVED", coordinator, { ...ok, signedFinalManuscriptVerified: false }).ok,
    ).toBe(false);
  });
  it("CLEARED needs every clearance item", () => {
    expect(decideTransition("final", "FINAL_APPROVED", "CLEARED", coordinator, { ...ok, clearanceItemsAllVerified: false }).ok).toBe(false);
  });
  it("every refusal has a reason to show (BR-18, FR-WFL-13)", () => {
    const r = decideTransition("proposal", "DRAFT", "READY", adviser, ok);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(0);
  });
});
