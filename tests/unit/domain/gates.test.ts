// P1-E04 domain part: one actor's gate action (FR-WFL-03 to 05, FR-WFL-07, BR-13, BR-20).
import { describe, expect, it } from "vitest";
import { checkGate1a, checkGate1b, checkGate2, checkReturn } from "@/server/domain/gates";

describe("INV-19: checkReturn (BR-13, FR-WFL-05)", () => {
  it("needs a written reason from every role", () => {
    for (const role of ["adviser", "panel_member", "coordinator"] as const) {
      expect(checkReturn({ role, reason: "  ", purpose: "compliance" })).toMatchObject({ ok: false, code: "reason_required" });
    }
  });
  it("limits a Coordinator Return to compliance or eligibility", () => {
    expect(checkReturn({ role: "coordinator", reason: "Missing OR.", purpose: "compliance" }).ok).toBe(true);
    expect(checkReturn({ role: "coordinator", reason: "Not enrolled.", purpose: "eligibility" }).ok).toBe(true);
    expect(checkReturn({ role: "coordinator", reason: "Weak methods.", purpose: "content" })).toMatchObject({
      ok: false,
      code: "coordinator_content_return",
    });
    expect(checkReturn({ role: "coordinator", reason: "x", purpose: null }).ok).toBe(false);
  });
  it("lets the Adviser and a Panel Member Return for content", () => {
    expect(checkReturn({ role: "adviser", reason: "Fix Chapter 2.", purpose: "content" }).ok).toBe(true);
    expect(checkReturn({ role: "panel_member", reason: "Fix Chapter 2.", purpose: null }).ok).toBe(true);
  });
  it("refuses a Student Return", () => {
    expect(checkReturn({ role: "student", reason: "x", purpose: null })).toMatchObject({ ok: false, code: "wrong_actor" });
  });
});

describe("INV-20: checkGate1a (FR-WFL-03)", () => {
  it("passes with no open threads in Milestone 1", () => {
    expect(checkGate1a({ milestone: "proposal", ownOpenThreads: 0, ipmo: "NOT_SUBMITTED" })).toEqual({ ok: true });
  });
  it("blocks on open threads", () => {
    expect(checkGate1a({ milestone: "proposal", ownOpenThreads: 1, ipmo: "PASSED" })).toMatchObject({
      ok: false,
      code: "open_threads",
    });
  });
  it("blocks Milestone 2 until IPMO is PASSED", () => {
    for (const ipmo of ["NOT_SUBMITTED", "UNDER_CHECK", "FAILED"] as const) {
      expect(checkGate1a({ milestone: "pre_final", ownOpenThreads: 0, ipmo }).ok).toBe(false);
    }
    expect(checkGate1a({ milestone: "pre_final", ownOpenThreads: 0, ipmo: "PASSED" }).ok).toBe(true);
  });
});

describe("INV-21: checkGate1b (FR-WFL-04)", () => {
  it("blocks a member with open threads", () => {
    expect(checkGate1b({ milestone: "proposal", ownOpenThreads: 3, preFinalRevisionsAccepted: false })).toEqual({
      ok: false,
      code: "open_threads",
      reason: "You have open threads. Resolve them first.",
    });
  });
  it("in Milestone 3, needs the member to accept every Pre-Final revision item", () => {
    expect(checkGate1b({ milestone: "final", ownOpenThreads: 0, preFinalRevisionsAccepted: false })).toEqual({
      ok: false,
      code: "revisions_not_accepted",
      reason: "Accept the Pre-Final revisions first.",
    });
    expect(checkGate1b({ milestone: "final", ownOpenThreads: 0, preFinalRevisionsAccepted: true }).ok).toBe(true);
  });
  it("does not need revision items in Milestone 1 and 2", () => {
    expect(checkGate1b({ milestone: "proposal", ownOpenThreads: 0, preFinalRevisionsAccepted: false }).ok).toBe(true);
    expect(checkGate1b({ milestone: "pre_final", ownOpenThreads: 0, preFinalRevisionsAccepted: false }).ok).toBe(true);
  });
});

describe("INV-22: checkGate2 (FR-WFL-07, BR-20)", () => {
  it("needs IPMO PASSED and RPO DONE", () => {
    expect(checkGate2({ ownOpenThreads: 0, ipmo: "UNDER_CHECK", rpo: "DONE" })).toEqual({
      ok: false,
      code: "clearance_incomplete",
      reason: "A clearance item is incomplete.",
    });
    expect(checkGate2({ ownOpenThreads: 0, ipmo: "PASSED", rpo: "UNDER_EDITING" }).ok).toBe(false);
  });
  it("blocks a member with open threads, Defense Day threads included", () => {
    expect(checkGate2({ ownOpenThreads: 1, ipmo: "PASSED", rpo: "DONE" })).toMatchObject({ ok: false, code: "open_threads" });
  });
  it("passes when all three hold", () => {
    expect(checkGate2({ ownOpenThreads: 0, ipmo: "PASSED", rpo: "DONE" })).toEqual({ ok: true });
  });
});
