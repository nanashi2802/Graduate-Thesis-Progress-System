"use server";
// Server actions for slots, bookings, the consultation log and the defense date (S4, A3, A4, P3).
// FR-SCH-01 to 08, FR-DEF-01. The data layer checks the role and the thesis (NFR-01).
import { field, pstDateTime, run, type Result } from "@/app/_lib/run";
import {
  confirmLogEntry,
  decideBooking,
  draftLogEntry,
  publishSlots,
  requestBooking,
  setLogTopic,
  updateAgenda,
  withdrawSlot,
} from "@/server/data/consultations";
import { proposeDefenseDate } from "@/server/data/defense";

async function publish(slotType: "consultation" | "defense", form: FormData): Promise<Result> {
  return run(async (ctx) => {
    const mode = field(form, "mode") === "online" ? "online" : "in_person";
    await publishSlots(ctx, {
      slotType,
      mode,
      meetingLink: mode === "online" ? field(form, "meetingLink") : null,
      startsAt: pstDateTime(field(form, "startsAt")),
      endsAt: pstDateTime(field(form, "endsAt")),
      repeatWeeks: Number(field(form, "repeatWeeks") || 0),
    });
  });
}
export async function publishConsultation(form: FormData): Promise<Result> {
  return publish("consultation", form);
}
export async function publishDefense(form: FormData): Promise<Result> {
  return publish("defense", form);
}

export async function withdrawSlotAction(slotId: string): Promise<Result> {
  return run(async (ctx) => withdrawSlot(ctx, slotId));
}

export async function requestBookingAction(slotId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => {
    await requestBooking(ctx, { slotId, agenda: field(form, "agenda"), threadIds: form.getAll("threadIds").map(String) });
  });
}

export async function updateAgendaAction(bookingId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => updateAgenda(ctx, bookingId, { agenda: field(form, "agenda"), threadIds: form.getAll("threadIds").map(String) }));
}

export async function decideBookingAction(bookingId: string, decision: "confirm" | "decline"): Promise<Result> {
  return run(async (ctx) => decideBooking(ctx, bookingId, decision));
}

export async function draftLogAction(bookingId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => {
    await draftLogEntry(ctx, bookingId, { placeOrPlatform: field(form, "place") });
  });
}

export async function topicAction(entryId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => setLogTopic(ctx, entryId, field(form, "topic")));
}

export async function confirmLogAction(entryId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => confirmLogEntry(ctx, entryId, field(form, "recommendations") || null));
}

export async function proposeDateAction(milestoneId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => {
    await proposeDefenseDate(ctx, milestoneId, field(form, "date"));
  });
}
