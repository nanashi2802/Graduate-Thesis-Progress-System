// In-app notifications and the notification center (NC): FR-NTF-01, FR-NTF-07, NFR-01,
// NFR-05, INV-30, AD-B-020. Server only.
// `notifyEvent` writes the `notification` rows first and commits them. Then it tries the
// emails. A failed email never rolls back the event (INV-30).
// A user reads and changes only their own rows (ERD §8).
import "server-only";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { buildNotificationEmail, EVENTS, shouldEmail, type EventCode } from "@/server/notify/events";
import type { EmailMessage } from "@/server/notify/email";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { appUser, notification } from "./schema";

/** The one email call this module needs. The app passes `sendEmail` from `src/server/notify/email.ts`. Tests pass a fake. */
export type EmailPort = (to: string, msg: EmailMessage) => Promise<string>;

export type NotifyInput = {
  code: EventCode;
  /** The users that get the event. The caller turns the recipient tokens of the catalog into users. */
  recipientUserIds: readonly string[];
  targetTable?: string | null;
  targetId?: string | null;
  /** The link in the email. It holds no manuscript text and no comment (FR-NTF-03). */
  link: string;
  deadline?: string | null;
  /** Events that each user turned off (FR-NTF-05). Empty until P2-E04 adds the preference table. */
  turnedOff?: ReadonlyMap<string, ReadonlySet<EventCode>>;
};

export type EmailOutcome =
  | { status: "sent"; providerId: string }
  | { status: "failed"; error: string }
  | { status: "skipped"; why: "reminder_or_digest" | "turned_off" | "no_email_port" };

export type NotifyResult = { notificationId: string; recipientUserId: string; email: EmailOutcome }[];

export async function notifyEvent(ctx: DataContext, input: NotifyInput, sendMail: EmailPort | null): Promise<NotifyResult> {
  requireActive(ctx.actor);
  const recipients = [...new Set(input.recipientUserIds)];
  if (recipients.length === 0) return [];

  // 1. The in-app rows. They commit before any email is tried (INV-30).
  const rows = await ctx.db
    .insert(notification)
    .values(
      recipients.map((recipientUserId) => ({
        recipientUserId,
        eventCode: input.code,
        targetTable: input.targetTable ?? null,
        targetId: input.targetId ?? null,
      })),
    )
    .returning({ id: notification.id, recipientUserId: notification.recipientUserId });

  const users = await ctx.db
    .select({ id: appUser.id, email: appUser.email })
    .from(appUser)
    .where(inArray(appUser.id, recipients));
  const emailOf = new Map(users.map((u) => [u.id, u.email]));

  // 2. The emails. Each failure is caught and reported, never thrown (NFR-05).
  const result: NotifyResult = [];
  for (const row of rows) {
    result.push({
      notificationId: row.id,
      recipientUserId: row.recipientUserId,
      email: await tryEmail(input, row.recipientUserId, emailOf.get(row.recipientUserId), sendMail),
    });
  }
  return result;
}

async function tryEmail(
  input: NotifyInput,
  userId: string,
  address: string | undefined,
  sendMail: EmailPort | null,
): Promise<EmailOutcome> {
  // Reminders and digests come from the daily job (FR-NTF-04, FR-NTF-06).
  if (EVENTS[input.code].delivery !== "immediate") return { status: "skipped", why: "reminder_or_digest" };
  if (!shouldEmail(input.code, input.turnedOff?.get(userId) ?? new Set())) return { status: "skipped", why: "turned_off" };
  if (!sendMail) return { status: "skipped", why: "no_email_port" };
  if (!address) return { status: "failed", error: "The user has no email address." };
  try {
    const providerId = await sendMail(address, buildNotificationEmail(input.code, input.deadline ?? null, input.link));
    return { status: "sent", providerId };
  } catch (e) {
    // Keep the message short. It can come from a provider body.
    return { status: "failed", error: (e instanceof Error ? e.message : String(e)).slice(0, 200) };
  }
}

export type NotificationItem = {
  id: string;
  eventCode: EventCode;
  event: string;
  nextAction: string;
  targetTable: string | null;
  targetId: string | null;
  createdAt: Date;
  read: boolean;
};

/** The notification center list of the signed-in user, newest first. */
export async function listMyNotifications(
  ctx: DataContext,
  opts: { unreadOnly?: boolean; limit?: number } = {},
): Promise<NotificationItem[]> {
  requireActive(ctx.actor);
  const mine = eq(notification.recipientUserId, ctx.actor.userId);
  const rows = await ctx.db
    .select()
    .from(notification)
    .where(opts.unreadOnly ? and(mine, isNull(notification.readAt)) : mine)
    .orderBy(desc(notification.createdAt), desc(notification.id))
    .limit(Math.min(Math.max(opts.limit ?? 50, 1), 200));
  return rows.map((r) => ({
    id: r.id,
    eventCode: r.eventCode as EventCode,
    event: EVENTS[r.eventCode as EventCode].event,
    nextAction: EVENTS[r.eventCode as EventCode].nextAction,
    targetTable: r.targetTable,
    targetId: r.targetId,
    createdAt: r.createdAt,
    read: r.readAt !== null,
  }));
}

export async function unreadCount(ctx: DataContext): Promise<number> {
  requireActive(ctx.actor);
  const [row] = await ctx.db
    .select({ n: count() })
    .from(notification)
    .where(and(eq(notification.recipientUserId, ctx.actor.userId), isNull(notification.readAt)));
  return row?.n ?? 0;
}

/** Marks one of the user's own notifications read. Another user's row looks like a missing row. */
export async function markNotificationRead(ctx: DataContext, notificationId: string): Promise<void> {
  requireActive(ctx.actor);
  const [row] = await ctx.db
    .select({ id: notification.id, readAt: notification.readAt })
    .from(notification)
    .where(and(eq(notification.id, notificationId), eq(notification.recipientUserId, ctx.actor.userId)));
  if (!row) throw new AccessDeniedError("no access to this notification");
  if (row.readAt) return;
  await ctx.db.update(notification).set({ readAt: new Date() }).where(eq(notification.id, row.id));
}

export async function markAllNotificationsRead(ctx: DataContext): Promise<number> {
  requireActive(ctx.actor);
  const rows = await ctx.db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.recipientUserId, ctx.actor.userId), isNull(notification.readAt)))
    .returning({ id: notification.id });
  return rows.length;
}
