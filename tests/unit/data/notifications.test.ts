// P1-E12-T02: notification rows and the notification center
// (FR-NTF-01, FR-NTF-07, NFR-01, NFR-05, INV-30, AD-B-020).
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notifyEvent,
  unreadCount,
  type EmailPort,
} from "@/server/data/notifications";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
let sent: { to: string; subject: string; text: string }[];

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }) => ({ db, actor: actorOf(u) });
const okMail: EmailPort = async (to, msg) => {
  sent.push({ to, ...msg });
  return "re_1";
};
const failMail: EmailPort = async () => {
  throw new Error("Resend returned HTTP 500");
};
const link = "https://app.test/student";

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
  sent = [];
});

describe("notifyEvent (FR-NTF-01, INV-30)", () => {
  it("writes one row for each recipient and sends an immediate email", async () => {
    const res = await notifyEvent(
      as(seed.coordinator),
      { code: "B3", recipientUserIds: [seed.student.id, seed.student.id], link },
      okMail,
    );
    expect(res).toHaveLength(1);
    expect(res[0]!.email).toEqual({ status: "sent", providerId: "re_1" });
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe(seed.student.email);
    expect(await db.select().from(s.notification)).toHaveLength(1);
  });

  it("keeps the notification row when the email fails (INV-30, NFR-05)", async () => {
    const res = await notifyEvent(as(seed.coordinator), { code: "B3", recipientUserIds: [seed.student.id], link }, failMail);
    expect(res[0]!.email).toEqual({ status: "failed", error: "Resend returned HTTP 500" });
    expect(await db.select().from(s.notification)).toHaveLength(1);
  });

  it("sends no email for a reminder or a digest event", async () => {
    const res = await notifyEvent(as(seed.coordinator), { code: "C2", recipientUserIds: [seed.student.id], link }, okMail);
    expect(res[0]!.email).toEqual({ status: "skipped", why: "reminder_or_digest" });
    expect(sent).toHaveLength(0);
    expect(await db.select().from(s.notification)).toHaveLength(1);
  });

  it("sends a required event even when the user's off-set holds it (FR-NTF-05)", async () => {
    // No optional event is "immediate" in the catalog (all are reminders or digests), so the off-set matters only for required events.
    const off = new Map([[seed.student.id, new Set(["F2"] as const)]]);
    const res = await notifyEvent(as(seed.coordinator), { code: "F2", recipientUserIds: [seed.student.id], link, turnedOff: off }, okMail);
    expect(res[0]!.email.status).toBe("sent");
  });

  it("works with no email port", async () => {
    const res = await notifyEvent(as(seed.coordinator), { code: "B3", recipientUserIds: [seed.student.id], link }, null);
    expect(res[0]!.email).toEqual({ status: "skipped", why: "no_email_port" });
  });

  it("refuses a deactivated actor (NFR-01)", async () => {
    const ctx = { db, actor: { ...actorOf(seed.coordinator), isActive: false } };
    await expect(notifyEvent(ctx, { code: "B3", recipientUserIds: [seed.student.id], link }, okMail)).rejects.toBeInstanceOf(
      AccessDeniedError,
    );
  });
});

describe("notification center", () => {
  async function fill() {
    await notifyEvent(as(seed.coordinator), { code: "B3", recipientUserIds: [seed.student.id, seed.adviser.id], link }, null);
    await notifyEvent(as(seed.coordinator), { code: "C6", recipientUserIds: [seed.student.id], link }, null);
  }

  it("lists only the rows of the signed-in user, with the fixed text", async () => {
    await fill();
    const mine = await listMyNotifications(as(seed.student));
    expect(mine).toHaveLength(2);
    expect(mine.every((n) => !n.read)).toBe(true);
    expect(mine.map((n) => n.eventCode).sort()).toEqual(["B3", "C6"]);
    expect(mine.find((n) => n.eventCode === "B3")!.event).toBe("A document was returned");
    expect(await listMyNotifications(as(seed.adviser))).toHaveLength(1);
    expect(await listMyNotifications(as(seed.panel[0]!))).toHaveLength(0);
  });

  it("counts, marks one read and marks all read", async () => {
    await fill();
    expect(await unreadCount(as(seed.student))).toBe(2);
    const [first] = await listMyNotifications(as(seed.student));
    await markNotificationRead(as(seed.student), first!.id);
    await markNotificationRead(as(seed.student), first!.id); // again: no change, no error
    expect(await unreadCount(as(seed.student))).toBe(1);
    expect(await listMyNotifications(as(seed.student), { unreadOnly: true })).toHaveLength(1);
    expect(await markAllNotificationsRead(as(seed.student))).toBe(1);
    expect(await unreadCount(as(seed.student))).toBe(0);
    expect(await unreadCount(as(seed.adviser))).toBe(1);
  });

  it("refuses to read another user's notification (ERD §8)", async () => {
    await fill();
    const [adv] = await listMyNotifications(as(seed.adviser));
    await expect(markNotificationRead(as(seed.student), adv!.id)).rejects.toBeInstanceOf(AccessDeniedError);
    expect(await unreadCount(as(seed.adviser))).toBe(1);
  });
});
