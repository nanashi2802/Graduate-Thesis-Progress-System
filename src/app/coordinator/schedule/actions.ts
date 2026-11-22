"use server";
// C5 actions: date confirmation and printed copies (FR-DEF-03, FR-DEF-04, BR-09, BR-13, BR-17).
// The data layer checks the role and the rules again (NFR-01).
import { revalidatePath } from "next/cache";
import { checkPrintedCopies, confirmDefenseDate, recordPrintedCopies } from "@/server/data/defense";
import { InputProblem } from "@/server/data/coordinator";
import { transitionMilestone } from "@/server/data/milestones";
import { pstDateTime } from "@/app/_lib/run";
import { int, runAction, text, type FormState } from "../_lib/action";

async function done(result: FormState): Promise<FormState> {
  if (result.ok) revalidatePath("/coordinator/schedule");
  return result;
}

export async function confirmDateAction(_prev: FormState, form: FormData): Promise<FormState> {
  const local = text(form, "startsAt"); // `datetime-local` has no zone. The app uses Philippine Standard Time (NFR-11).
  const startsAt = pstDateTime(local);
  if (!local || Number.isNaN(startsAt.getTime())) return { error: "Enter the start date and time." };
  return done(
    await runAction(async (ctx) => {
      await confirmDefenseDate(ctx, text(form, "milestoneId"), { startsAt, roomOrLink: text(form, "roomOrLink") });
      return "The date is confirmed. The Student sees the defense card.";
    }),
  );
}

export async function returnDateAction(_prev: FormState, form: FormData): Promise<FormState> {
  const purpose = text(form, "purpose") === "eligibility" ? "eligibility" : "compliance";
  return done(
    await runAction(async (ctx) => {
      const reason = text(form, "reason");
      if (!reason) throw new InputProblem("Write a reason. The Student reads it.");
      await transitionMilestone(ctx, text(form, "milestoneId"), "RETURNED", { reason, purpose });
      return "The request is returned with your reason.";
    }),
  );
}

export async function recordCopiesAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      await recordPrintedCopies(ctx, text(form, "attemptId"), int(form, "copyCount"));
      return "The receipt is recorded.";
    }),
  );
}

export async function checkCopiesAction(_prev: FormState, form: FormData): Promise<FormState> {
  const result = text(form, "result") === "mismatch" ? "mismatch" : "matched";
  return done(
    await runAction(async (ctx) => {
      await checkPrintedCopies(ctx, text(form, "attemptId"), result);
      return result === "matched" ? "The copies match the locked manuscript." : "Mismatch recorded. It does not stop the defense (BR-12).";
    }),
  );
}
