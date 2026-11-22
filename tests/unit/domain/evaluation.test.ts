import { describe, expect, it } from "vitest";
import {
  actionTakenWarnings,
  checkComment,
  checkRubricWeights,
  checkScores,
  checkSheetEdit,
  evaluationFormFor,
  expectedEvaluators,
  resultsVisible,
  rubricTotal,
  sheetsVerifiedAndMatched,
  type Indicator,
  type SheetState,
} from "@/server/domain/evaluation";

// Default weights from FR §3 (A1 10, A2 20, A3 20, A4 10, B1 10, B2 10, B3 20).
const RUBRIC: Indicator[] = [
  { id: "A1", weightPct: 10 },
  { id: "A2", weightPct: 20 },
  { id: "A3", weightPct: 20 },
  { id: "A4", weightPct: 10 },
  { id: "B1", weightPct: 10 },
  { id: "B2", weightPct: 10 },
  { id: "B3", weightPct: 20 },
];

const START = new Date("2026-12-10T01:00:00Z"); // 09:00 PST

describe("form for each milestone (FR-DEF-05)", () => {
  it("uses TDW 08, TDW 10 and TDW 13", () => {
    expect(evaluationFormFor("proposal")).toBe("TDW_08");
    expect(evaluationFormFor("pre_final")).toBe("TDW_10");
    expect(evaluationFormFor("final")).toBe("TDW_13");
  });
});

describe("expected evaluators (FR-DEF-06, FR-CMT-06)", () => {
  const members = ["p1", "p2"];
  it("includes the Adviser at Proposal and Pre-Final", () => {
    expect(expectedEvaluators({ milestone: "proposal", adviserUserId: "adv", memberUserIds: members, substitutes: [] })).toEqual([
      "adv",
      "p1",
      "p2",
    ]);
    expect(
      expectedEvaluators({ milestone: "pre_final", adviserUserId: "adv", memberUserIds: members, substitutes: [] }),
    ).toHaveLength(3);
  });
  it("excludes the Adviser at Final", () => {
    expect(
      expectedEvaluators({ milestone: "final", adviserUserId: "adv", memberUserIds: ["c", "p1", "p2", "p3"], substitutes: [] }),
    ).toEqual(["c", "p1", "p2", "p3"]);
  });
  it("puts the substitute in the seat of the absent member", () => {
    expect(
      expectedEvaluators({
        milestone: "proposal",
        adviserUserId: "adv",
        memberUserIds: members,
        substitutes: [{ absentUserId: "p2", substituteUserId: "s9" }],
      }),
    ).toEqual(["adv", "p1", "s9"]);
  });
});

describe("sheet edit window (INV-14, BR-10)", () => {
  const base = { actorUserId: "p1", memberUserId: "p1", expected: ["adv", "p1"], scheduledStartAt: START, verifiedAt: null };
  it("blocks before the scheduled start", () => {
    const d = checkSheetEdit({ ...base, now: new Date(START.getTime() - 60_000) });
    expect(d).toMatchObject({ ok: false, code: "before_start" });
  });
  it("allows at the scheduled start", () => {
    expect(checkSheetEdit({ ...base, now: START })).toEqual({ ok: true });
  });
  it("blocks when no start is scheduled", () => {
    expect(checkSheetEdit({ ...base, scheduledStartAt: null, now: START })).toMatchObject({ ok: false, code: "before_start" });
  });
  it("blocks after the Coordinator verifies the sheet", () => {
    const d = checkSheetEdit({ ...base, now: START, verifiedAt: START });
    expect(d).toMatchObject({ ok: false, code: "verified" });
  });
  it("lets a member edit only their own sheet", () => {
    expect(checkSheetEdit({ ...base, actorUserId: "adv", now: START })).toMatchObject({ ok: false, code: "not_own_sheet" });
  });
  it("blocks a user who is not an expected evaluator", () => {
    const d = checkSheetEdit({ ...base, actorUserId: "x", memberUserId: "x", now: START });
    expect(d).toMatchObject({ ok: false, code: "not_an_evaluator" });
  });
  it("gives a reason with each refusal (BR-18)", () => {
    const d = checkSheetEdit({ ...base, now: new Date(0) });
    expect(d.ok === false && d.reason.length > 0).toBe(true);
  });
});

describe("rubric weights (INV-25)", () => {
  it("accepts weights that sum to 100", () => {
    expect(checkRubricWeights(RUBRIC)).toEqual({ ok: true });
  });
  it("refuses other sums", () => {
    expect(checkRubricWeights(RUBRIC.slice(1))).toMatchObject({ ok: false, code: "weights_not_100" });
  });
});

describe("scores (FR-DEF-05)", () => {
  it("accepts a score from 0 to the weight", () => {
    expect(checkScores("TDW_08", RUBRIC, [{ indicatorId: "A1", score: 0 }, { indicatorId: "A2", score: 20 }])).toEqual({ ok: true });
  });
  it("refuses a score above the weight or below 0", () => {
    expect(checkScores("TDW_08", RUBRIC, [{ indicatorId: "A1", score: 11 }])).toMatchObject({ ok: false, code: "score_out_of_range" });
    expect(checkScores("TDW_13", RUBRIC, [{ indicatorId: "A1", score: -1 }])).toMatchObject({ ok: false, code: "score_out_of_range" });
  });
  it("refuses an unknown indicator or a duplicate", () => {
    expect(checkScores("TDW_08", RUBRIC, [{ indicatorId: "Z9", score: 1 }])).toMatchObject({ ok: false, code: "unknown_indicator" });
    expect(
      checkScores("TDW_08", RUBRIC, [
        { indicatorId: "A1", score: 1 },
        { indicatorId: "A1", score: 2 },
      ]),
    ).toMatchObject({ ok: false, code: "unknown_indicator" });
  });
  it("refuses any score on the comments-only TDW 10", () => {
    expect(checkScores("TDW_10", RUBRIC, [{ indicatorId: "A1", score: 5 }])).toMatchObject({ ok: false, code: "no_scores_on_form" });
    expect(checkScores("TDW_10", RUBRIC, [])).toEqual({ ok: true });
  });
  it("totals the scores as a plain sum, with no grade equivalent (BR-15)", () => {
    const total = rubricTotal(RUBRIC.map((i) => ({ indicatorId: i.id, score: i.weightPct })));
    expect(total).toBe(100);
    expect(typeof total).toBe("number");
  });
});

describe("comment boxes (FR-DEF-05)", () => {
  it("lets TDW 10 use the chapter boxes", () => {
    expect(checkComment("TDW_10", "chapter_3")).toEqual({ ok: true });
    expect(checkComment("TDW_10", "remarks")).toEqual({ ok: true });
  });
  it("gives the rubric forms one general box only", () => {
    expect(checkComment("TDW_08", "general_observations")).toEqual({ ok: true });
    expect(checkComment("TDW_13", "chapter_1")).toMatchObject({ ok: false, code: "wrong_comment_box" });
  });
});

describe("close inputs (INV-16, BR-11)", () => {
  const sheet = (member: string, over: Partial<SheetState> = {}): SheetState => ({
    memberUserId: member,
    actionTaken: "approved",
    verifiedAt: START,
    sheetMatch: "matched",
    ...over,
  });
  const expected = ["adv", "p1", "p2"];
  it("is true when each expected sheet is verified and matched", () => {
    expect(sheetsVerifiedAndMatched(expected, [sheet("adv"), sheet("p1"), sheet("p2")])).toBe(true);
  });
  it("is false when a sheet is missing, unverified or a mismatch", () => {
    expect(sheetsVerifiedAndMatched(expected, [sheet("adv"), sheet("p1")])).toBe(false);
    expect(sheetsVerifiedAndMatched(expected, [sheet("adv"), sheet("p1"), sheet("p2", { verifiedAt: null })])).toBe(false);
    expect(sheetsVerifiedAndMatched(expected, [sheet("adv"), sheet("p1"), sheet("p2", { sheetMatch: "mismatch" })])).toBe(false);
    expect(sheetsVerifiedAndMatched(expected, [sheet("adv"), sheet("p1"), sheet("p2", { sheetMatch: "pending" })])).toBe(false);
  });
  it("also needs every other entry of the attempt verified and matched (ERD INV-16)", () => {
    expect(sheetsVerifiedAndMatched(["adv"], [sheet("adv"), sheet("x", { verifiedAt: null })])).toBe(false);
    expect(sheetsVerifiedAndMatched(["adv"], [sheet("adv"), sheet("x")])).toBe(true);
  });
  it("shows results to the Student only when every sheet is verified (BR-11)", () => {
    expect(resultsVisible(expected, [sheet("adv"), sheet("p1"), sheet("p2")])).toBe(true);
    expect(resultsVisible(expected, [sheet("adv"), sheet("p1"), sheet("p2", { verifiedAt: null, sheetMatch: "pending" })])).toBe(false);
    expect(resultsVisible(expected, [])).toBe(false);
  });
});

describe("Action Taken against the verdict (FR-DEF-07, BR-17)", () => {
  const sheets: SheetState[] = [
    { memberUserId: "p1", actionTaken: "approved", verifiedAt: null, sheetMatch: "pending" },
    { memberUserId: "p2", actionTaken: "disapproved", verifiedAt: null, sheetMatch: "pending" },
    { memberUserId: "p3", actionTaken: null, verifiedAt: null, sheetMatch: "pending" },
  ];
  it("names each member whose Action Taken differs", () => {
    expect(actionTakenWarnings("approved", sheets)).toEqual([{ memberUserId: "p2", actionTaken: "disapproved" }]);
  });
  it("gives no warning before the verdict", () => {
    expect(actionTakenWarnings(null, sheets)).toEqual([]);
  });
});
