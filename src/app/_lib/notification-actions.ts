"use server";
// The notification center actions (FR-NTF-01). A user marks only their own rows (ERD §8, NFR-01).
import { field, run } from "./run";
import { markAllNotificationsRead, markNotificationRead } from "@/server/data/notifications";
import { OPTIONAL_EVENTS } from "@/server/notify/events";
import { setMyPreference } from "@/server/data/preferences";

export async function markReadAction(form: FormData): Promise<void> {
  await run((ctx) => markNotificationRead(ctx, field(form, "notificationId")));
}

export async function markAllReadAction(): Promise<void> {
  await run((ctx) => markAllNotificationsRead(ctx).then(() => undefined));
}

// One form saves every switch. A box that is not checked means "off".
export async function savePreferencesAction(form: FormData): Promise<void> {
  await run(async (ctx) => {
    for (const code of OPTIONAL_EVENTS) await setMyPreference(ctx, code, form.has(`on_${code}`));
  });
}
