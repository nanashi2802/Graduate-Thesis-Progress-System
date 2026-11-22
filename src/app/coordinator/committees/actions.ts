"use server";
// C3 actions (FR-CMT-01 to FR-CMT-04). The data layer checks the role and the rules again (NFR-01).
import { revalidatePath } from "next/cache";
import { advanceMilestone, linkAppointmentForm, linkNda, markAppointed, proposeSeat, recordSeatAnswer, type BoardResult } from "@/server/data/committees";
import { InputProblem } from "@/server/data/coordinator";
import type { DataContext } from "@/server/data/access";
import type { Designation, MilestoneCode } from "@/server/domain/milestone";
import { runAction, text, type FormState } from "../_lib/action";

// A refused rule becomes the message of the form (BR-18).
async function run(work: (ctx: DataContext) => Promise<BoardResult<unknown>>, done: string): Promise<FormState> {
  const result = await runAction(async (ctx) => {
    const res = await work(ctx);
    if (!res.ok) throw new InputProblem(res.reason);
    return done;
  });
  if (result.ok) revalidatePath("/coordinator/committees");
  return result;
}

export async function proposeSeatAction(_prev: FormState, form: FormData): Promise<FormState> {
  return run(
    (ctx) =>
      proposeSeat(ctx, {
        thesisId: text(form, "thesisId"),
        milestone: text(form, "milestone") as MilestoneCode,
        memberUserId: text(form, "memberUserId"),
        designation: text(form, "designation") as Designation,
      }),
    "Seat proposed. Record the answer of the member when it arrives.",
  );
}

export async function seatAnswerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const status = text(form, "status") === "declined" ? "declined" : "accepted";
  return run((ctx) => recordSeatAnswer(ctx, { seatId: text(form, "seatId"), status }), status === "accepted" ? "Seat accepted." : "Seat declined. Propose another member.");
}

export async function linkAppointmentAction(_prev: FormState, form: FormData): Promise<FormState> {
  return run((ctx) => linkAppointmentForm(ctx, { committeeId: text(form, "committeeId"), documentId: text(form, "documentId") }), "The appointment form is linked.");
}

export async function linkNdaAction(_prev: FormState, form: FormData): Promise<FormState> {
  return run((ctx) => linkNda(ctx, { seatId: text(form, "seatId"), documentId: text(form, "documentId") }), "The NDA is linked.");
}

export async function markAppointedAction(_prev: FormState, form: FormData): Promise<FormState> {
  const committeeId = text(form, "committeeId");
  const result = await run((ctx) => markAppointed(ctx, { committeeId }), "The committee is appointed.");
  if (!result.ok) return result;
  // Second call, after the appointment commits (AD-B-021). A refusal keeps the appointment.
  const next = await runAction(async (ctx) => {
    const res = await advanceMilestone(ctx, { committeeId });
    if (!res.ok) throw new InputProblem(res.reason);
    return "The committee is appointed. The milestone moved to Committee appointed.";
  });
  if (next.ok) {
    revalidatePath("/coordinator/committees");
    return next;
  }
  return { ok: `The committee is appointed. The milestone has not moved yet: ${next.error}` };
}

export async function advanceMilestoneAction(_prev: FormState, form: FormData): Promise<FormState> {
  return run((ctx) => advanceMilestone(ctx, { committeeId: text(form, "committeeId") }), "The milestone moved to Committee appointed.");
}
