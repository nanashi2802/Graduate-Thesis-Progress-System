// Notification preferences (FR-NTF-05, FR-NTF-09, INV-29, NFR-01, BR-18). Server only.
// A user reads and changes only their own rows. Only the optional events have a switch.
import "server-only";
import { and, eq } from "drizzle-orm";
import { EVENTS, isOptional, type EventCode, type Recipient } from "@/server/notify/events";
import { requireActive, type DataContext } from "./access";
import { InputProblem } from "./coordinator";
import { notificationPreference, type UserRole } from "./schema";

export type PreferenceRow = { code: EventCode; event: string; optional: boolean; enabled: boolean };

// The recipient tokens that can reach each role. "user" is the one account of the event.
const ROLE_TOKENS: Record<UserRole, readonly Recipient[]> = {
  student: ["student", "user", "thread_author"],
  adviser: ["adviser", "user", "reviewer", "thread_author", "members"],
  panel_member: ["members", "affected_members", "substitute", "user", "reviewer", "thread_author"],
  coordinator: ["coordinator", "user"],
};

/** The events this user can receive. An optional event shows its switch. Others are always on. */
export async function listMyPreferences(ctx: DataContext): Promise<PreferenceRow[]> {
  requireActive(ctx.actor);
  const off = await ctx.db
    .select({ code: notificationPreference.eventCode })
    .from(notificationPreference)
    .where(and(eq(notificationPreference.userId, ctx.actor.userId), eq(notificationPreference.enabled, false)));
  const offSet = new Set<string>(off.map((r) => r.code));
  const tokens = ROLE_TOKENS[ctx.actor.role];
  return Object.values(EVENTS)
    .filter((e) => e.recipients.some((r) => tokens.includes(r)))
    .map((e) => ({ code: e.code, event: e.event, optional: isOptional(e.code), enabled: !offSet.has(e.code) }));
}

/** Turn one optional event on or off for the signed-in user. */
export async function setMyPreference(ctx: DataContext, code: string, enabled: boolean): Promise<void> {
  requireActive(ctx.actor);
  if (!(code in EVENTS) || !isOptional(code as EventCode)) throw new InputProblem("This event is always on.");
  await ctx.db
    .insert(notificationPreference)
    .values({ userId: ctx.actor.userId, eventCode: code as EventCode, enabled })
    .onConflictDoUpdate({
      target: [notificationPreference.userId, notificationPreference.eventCode],
      set: { enabled },
    });
}
