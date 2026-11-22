"use server";
// Server actions for the Defense Day page (A5, P4): the own sheet, the verdict and the held step (FR-DEF-05 to 07, INV-14, INV-15).
import { field, run, type Result } from "@/app/_lib/run";
import { InputProblem } from "@/server/data/coordinator";
import { markDefenseHeld, recordVerdict, saveSheet } from "@/server/data/defense";
import type { Verdict } from "@/server/domain/milestone";
import type { Tdw10Section } from "@/server/domain/evaluation";

const VERDICTS: Verdict[] = ["approved", "approved_with_revisions", "disapproved"];
const asVerdict = (v: string): Verdict | null => (VERDICTS as string[]).includes(v) ? (v as Verdict) : null;

export async function saveSheetAction(attemptId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => {
    const scores: { indicatorId: string; score: number }[] = [];
    const comments: { section: Tdw10Section; body: string }[] = [];
    for (const [key, value] of form.entries()) {
      const text = String(value).trim();
      if (key.startsWith("score_") && text !== "") scores.push({ indicatorId: key.slice(6), score: Number(text) });
      if (key.startsWith("comment_")) comments.push({ section: key.slice(8) as Tdw10Section, body: text });
    }
    await saveSheet(ctx, attemptId, { actionTaken: asVerdict(field(form, "actionTaken")), scores, comments });
  });
}

export async function recordVerdictAction(milestoneId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => {
    const verdict = asVerdict(field(form, "verdict"));
    if (!verdict) throw new InputProblem("Pick the verdict first.");
    await recordVerdict(ctx, milestoneId, verdict);
  });
}

export async function markHeldAction(milestoneId: string): Promise<Result> {
  return run(async (ctx) => {
    await markDefenseHeld(ctx, milestoneId);
  });
}
