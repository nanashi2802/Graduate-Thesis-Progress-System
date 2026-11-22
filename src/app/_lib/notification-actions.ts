"use server";
// The notification center actions (FR-NTF-01). A user marks only their own rows (ERD §8, NFR-01).
import { field, run } from "./run";
import { markAllNotificationsRead, markNotificationRead } from "@/server/data/notifications";

export async function markReadAction(form: FormData): Promise<void> {
  await run((ctx) => markNotificationRead(ctx, field(form, "notificationId")));
}

export async function markAllReadAction(): Promise<void> {
  await run((ctx) => markAllNotificationsRead(ctx).then(() => undefined));
}
