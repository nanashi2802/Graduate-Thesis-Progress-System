// Evaluation sheet rules for TDW 08, TDW 10 and TDW 13 (FR-DEF-05 to 07, FR-CMT-06,
// INV-14, INV-16, INV-25, BR-10, BR-11, BR-15, BR-17, ERD §5, AD-B-016).
// Pure code: no database and no framework. The data layer loads the rows, calls these
// checks, and writes the rows. The verdict and the close are in milestone.ts.

import type { MilestoneCode, Verdict } from "./milestone";

export type EvaluationForm = "TDW_08" | "TDW_10" | "TDW_13";
export type MatchResult = "pending" | "matched" | "mismatch";
export type Tdw10Section =
  | "title_prelims"
  | "chapter_1"
  | "chapter_2"
  | "chapter_3"
  | "chapter_4"
  | "chapter_5"
  | "references_appendices"
  | "remarks"
  | "general_observations";

/** One `rubric_indicator` row. */
export type Indicator = { id: string; weightPct: number };
/** One `evaluation_score` row. */
export type Score = { indicatorId: string; score: number };
/** The parts of one `evaluation_entry` row that the rules read. */
export type SheetState = {
  memberUserId: string;
  actionTaken: Verdict | null;
  verifiedAt: Date | null;
  sheetMatch: MatchResult;
};

export type EvaluationBlockCode =
  | "before_start"
  | "verified"
  | "not_own_sheet"
  | "not_an_evaluator"
  | "weights_not_100"
  | "no_scores_on_form"
  | "unknown_indicator"
  | "score_out_of_range"
  | "wrong_comment_box";

export type EvaluationDecision = { ok: true } | { ok: false; code: EvaluationBlockCode; reason: string };

const MESSAGES: Record<EvaluationBlockCode, string> = {
  before_start: "The sheet opens at the scheduled start of the defense.",
  verified: "The Coordinator verified this sheet. It is read only.",
  not_own_sheet: "You can edit only your own sheet.",
  not_an_evaluator: "You do not complete a sheet for this defense.",
  weights_not_100: "The rubric weights must total 100%.",
  no_scores_on_form: "This form has comment boxes only.",
  unknown_indicator: "Each score must match one rubric line, once.",
  score_out_of_range: "Each score must be from 0 to the weight of its line.",
  wrong_comment_box: "This form has one comments box only.",
};

const ok: EvaluationDecision = { ok: true };
const block = (code: EvaluationBlockCode): EvaluationDecision => ({ ok: false, code, reason: MESSAGES[code] });

const FORMS: Record<MilestoneCode, EvaluationForm> = { proposal: "TDW_08", pre_final: "TDW_10", final: "TDW_13" };

/** TDW 08 at Proposal, TDW 10 at Pre-Final, TDW 13 at Final (FR-DEF-05). */
export function evaluationFormFor(milestone: MilestoneCode): EvaluationForm {
  return FORMS[milestone];
}

export function isRubricForm(form: EvaluationForm): boolean {
  return form !== "TDW_10";
}

/**
 * The users who complete a sheet: the Adviser at Proposal and Pre-Final, never at Final
 * (FR-DEF-06), then each appointed member. A substitute takes the absent member's sheet
 * (FR-CMT-06). The count matches FR §3 when the committee has its template size.
 */
export function expectedEvaluators(input: {
  milestone: MilestoneCode;
  adviserUserId: string;
  memberUserIds: readonly string[];
  substitutes: readonly { absentUserId: string; substituteUserId: string }[];
}): string[] {
  const swap = new Map(input.substitutes.map((s) => [s.absentUserId, s.substituteUserId]));
  const members = input.memberUserIds.map((id) => swap.get(id) ?? id);
  return input.milestone === "final" ? members : [input.adviserUserId, ...members];
}

/** INV-14: a member edits their own sheet from the scheduled start until it is verified. */
export function checkSheetEdit(input: {
  actorUserId: string;
  memberUserId: string;
  expected: readonly string[];
  scheduledStartAt: Date | null;
  verifiedAt: Date | null;
  now: Date;
}): EvaluationDecision {
  if (!input.expected.includes(input.actorUserId)) return block("not_an_evaluator");
  if (input.actorUserId !== input.memberUserId) return block("not_own_sheet");
  if (input.scheduledStartAt === null || input.now < input.scheduledStartAt) return block("before_start");
  if (input.verifiedAt !== null) return block("verified");
  return ok;
}

/** INV-25: the weights of one template version total 100. */
export function checkRubricWeights(indicators: readonly Indicator[]): EvaluationDecision {
  const sum = indicators.reduce((s, i) => s + i.weightPct, 0);
  return Math.abs(sum - 100) < 1e-9 ? ok : block("weights_not_100");
}

/** Each score is for one known line, once, from 0 to its weight. TDW 10 has no scores. */
export function checkScores(form: EvaluationForm, indicators: readonly Indicator[], scores: readonly Score[]): EvaluationDecision {
  if (!isRubricForm(form)) return scores.length === 0 ? ok : block("no_scores_on_form");
  const weights = new Map(indicators.map((i) => [i.id, i.weightPct]));
  const seen = new Set<string>();
  for (const s of scores) {
    const weight = weights.get(s.indicatorId);
    if (weight === undefined || seen.has(s.indicatorId)) return block("unknown_indicator");
    seen.add(s.indicatorId);
    if (!Number.isFinite(s.score) || s.score < 0 || s.score > weight) return block("score_out_of_range");
  }
  return ok;
}

/** The rubric total is the plain sum. No grade equivalent (BR-15, ERD §5). */
export function rubricTotal(scores: readonly Score[]): number {
  return scores.reduce((s, x) => s + x.score, 0);
}

/** TDW 10 uses the chapter boxes. The rubric forms use `general_observations` only. */
export function checkComment(form: EvaluationForm, section: Tdw10Section): EvaluationDecision {
  if (isRubricForm(form) && section !== "general_observations") return block("wrong_comment_box");
  return ok;
}

function expectedSheets(expected: readonly string[], sheets: readonly SheetState[]): (SheetState | undefined)[] {
  return expected.map((id) => sheets.find((s) => s.memberUserId === id));
}

/**
 * The INV-16 sheet part: each expected sheet exists, and every entry of the attempt
 * is verified and matches its scan (ERD INV-16 "every evaluation_entry").
 */
export function sheetsVerifiedAndMatched(expected: readonly string[], sheets: readonly SheetState[]): boolean {
  const done = (s: SheetState | undefined) => s !== undefined && s.verifiedAt !== null && s.sheetMatch === "matched";
  return expected.length > 0 && expectedSheets(expected, sheets).every(done) && sheets.every(done);
}

/** BR-11: the Student sees the results only when every expected sheet is verified. */
export function resultsVisible(expected: readonly string[], sheets: readonly SheetState[]): boolean {
  return expected.length > 0 && expectedSheets(expected, sheets).every((s) => s !== undefined && s.verifiedAt !== null);
}

/** FR-DEF-07: a warning for each member whose Action Taken differs from the verdict. It never blocks (BR-17). */
export function actionTakenWarnings(
  verdict: Verdict | null,
  sheets: readonly SheetState[],
): { memberUserId: string; actionTaken: Verdict }[] {
  if (verdict === null) return [];
  return sheets.flatMap((s) =>
    s.actionTaken !== null && s.actionTaken !== verdict ? [{ memberUserId: s.memberUserId, actionTaken: s.actionTaken }] : [],
  );
}
