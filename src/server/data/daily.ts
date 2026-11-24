// The daily job's data part (FR-NTF-04, FR-NTF-06, FR-NTF-07, INV-23, BR-20, NFR-11). Server only.
// The cron route calls it after it checks `CRON_SECRET`. There is no signed-in actor, so the function
// takes the database and sends only fixed-text emails (FR-NTF-02). One run per day is safe: a reminder
// is skipped when its `notification` row for the same thesis and PST day exists, and a digest row
// with an `email_log` row is never sent again.
import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull } from "drizzle-orm";
import { residency } from "@/server/domain/residency";
import { digestHeadline, groupDigests, type DigestCode, type DigestItem } from "@/server/notify/digest";
import { buildNotificationEmail, isOptional, type EventCode } from "@/server/notify/events";
import { remindersDue } from "@/server/notify/reminders";
import { pstDate } from "@/server/notify/time";
import type { EmailPort } from "./notifications";
import type { Db } from "./db";
import { resolveRecipients } from "./recipients";
import {
  appUser,
  critiqueThread,
  defenseAttempt,
  emailLog,
  manuscriptCommit,
  milestoneInstance,
  notification,
  notificationPreference,
  submissionPr,
  templateVersion,
  thesisInstance,
} from "./schema";

const DONE = ["CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED"] as const;
const DIGEST_CODES: DigestCode[] = ["B4", "B7", "C2", "C3", "C4", "C5"];

/** Send one email and write its `email_log` rows. Never throws (INV-30, NFR-05). */
async function sendLogged(
  db: Db,
  sendMail: EmailPort,
  to: string,
  code: EventCode,
  deadline: string | null,
  link: string,
  recipientUserId: string,
  notificationIds: (string | null)[],
): Promise<void> {
  let error: string | null = null;
  try {
    await sendMail(to, buildNotificationEmail(code, deadline, link));
  } catch (e) {
    error = (e instanceof Error ? e.message : String(e)).slice(0, 200);
  }
  await db.insert(emailLog).values(
    notificationIds.map((notificationId) => ({
      notificationId,
      recipientUserId,
      eventCode: code,
      result: error ? ("failed" as const) : ("sent" as const),
      error,
    })),
  );
}

async function turnedOffSet(db: Db): Promise<Set<string>> {
  const rows = await db.select().from(notificationPreference).where(eq(notificationPreference.enabled, false));
  return new Set(rows.map((r) => `${r.userId}|${r.eventCode}`));
}

/** A4, B1, B2 and B6 (FR-NTF-06). A turned-off user keeps the in-app row and gets no email. */
export async function sendReminders(db: Db, now: Date, sendMail: EmailPort | null, link: string): Promise<number> {
  const today = pstDate(now);
  const dayStart = new Date(`${today}T00:00:00+08:00`);
  const off = await turnedOffSet(db);
  let made = 0;
  for (const thesis of await db.select().from(thesisInstance)) {
    const ms = await db.select().from(milestoneInstance).where(eq(milestoneInstance.thesisInstanceId, thesis.id)).orderBy(desc(milestoneInstance.openedAt));
    const open = ms.find((m) => !(DONE as readonly string[]).includes(m.status));
    if (!open) continue;
    const [attempt] = await db
      .select({ at: defenseAttempt.scheduledStartAt, ms: defenseAttempt.milestoneInstanceId })
      .from(defenseAttempt)
      .where(and(inArray(defenseAttempt.milestoneInstanceId, ms.map((m) => m.id)), eq(defenseAttempt.status, "scheduled")))
      .orderBy(desc(defenseAttempt.attemptNo))
      .limit(1);
    const defenseMs = ms.find((m) => m.id === attempt?.ms) ?? open;
    const [v] = await db.select().from(templateVersion).where(eq(templateVersion.id, defenseMs.templateVersionId));
    const due = remindersDue(today, {
      defenseDate: attempt?.at ? pstDate(attempt.at) : null,
      printedCopiesDueDays: v?.printedCopiesDueDays ?? 7,
      targetDate: open.targetDate,
      residencyEndDate: residency(thesis.degreeLevel, thesis.programStartTerm, today)?.endDate ?? null,
    });
    for (const r of due) {
      const users = await resolveRecipients(db, r.code, { thesisId: thesis.id, milestone: defenseMs.milestoneCode });
      for (const userId of users) {
        const [seen] = await db
          .select({ id: notification.id })
          .from(notification)
          .where(and(eq(notification.recipientUserId, userId), eq(notification.eventCode, r.code), eq(notification.targetId, thesis.id), gte(notification.createdAt, dayStart)))
          .limit(1);
        if (seen) continue;
        const [row] = await db
          .insert(notification)
          .values({ recipientUserId: userId, eventCode: r.code, targetTable: "thesis_instance", targetId: thesis.id })
          .returning({ id: notification.id });
        made += 1;
        if (!sendMail || (isOptional(r.code) && off.has(`${userId}|${r.code}`))) continue;
        const [u] = await db.select({ email: appUser.email }).from(appUser).where(eq(appUser.id, userId));
        if (u) await sendLogged(db, sendMail, u.email, r.code, r.deadline, link, userId, [row!.id]);
      }
    }
  }
  return made;
}

/** B4, B7 and C2 to C5: one email for each group. Rows with an `email_log` row are done (FR-NTF-04). */
export async function sendDigests(db: Db, sendMail: EmailPort | null, link: string): Promise<number> {
  if (!sendMail) return 0;
  const off = await turnedOffSet(db);
  const rows = await db
    .select({ id: notification.id, code: notification.eventCode, userId: notification.recipientUserId, table: notification.targetTable, target: notification.targetId, role: appUser.role, email: appUser.email })
    .from(notification)
    .innerJoin(appUser, eq(appUser.id, notification.recipientUserId))
    .leftJoin(emailLog, eq(emailLog.notificationId, notification.id))
    .where(and(inArray(notification.eventCode, DIGEST_CODES), isNull(emailLog.id)))
    .orderBy(asc(notification.createdAt));
  const entries: { n: (typeof rows)[number]; item: DigestItem }[] = [];
  for (const n of rows) {
    if (off.has(`${n.userId}|${n.code}`)) continue;
    let commitId: string | null = null;
    let defenseDayThread = false;
    let defenseClosed = false;
    if (n.table === "critique_thread" && n.target) {
      const [t] = await db.select().from(critiqueThread).where(eq(critiqueThread.id, n.target));
      if (t) {
        commitId = t.commitId;
        defenseDayThread = t.context === "defense_day";
        const [c] = await db
          .select({ ms: submissionPr.milestoneInstanceId })
          .from(manuscriptCommit)
          .innerJoin(submissionPr, eq(submissionPr.id, manuscriptCommit.submissionPrId))
          .where(eq(manuscriptCommit.id, t.commitId));
        if (c) {
          const [closed] = await db
            .select({ id: defenseAttempt.id })
            .from(defenseAttempt)
            .where(and(eq(defenseAttempt.milestoneInstanceId, c.ms), eq(defenseAttempt.status, "closed")))
            .limit(1);
          defenseClosed = !!closed;
        }
      }
    }
    entries.push({ n, item: { code: n.code as DigestCode, recipientUserId: n.userId, commitId, defenseDayThread, defenseClosed } });
  }
  const roleOf = new Map(rows.map((r) => [r.userId, r.role]));
  const { groups, held } = groupDigests(entries.map((e) => e.item), (id) => roleOf.get(id) === "student");
  let sent = 0;
  for (const g of groups) {
    const mine = entries.filter(
      (e) => !held.includes(e.item) && e.item.recipientUserId === g.recipientUserId && (g.kind === "commit" ? g.codes.includes(e.item.code) && e.item.commitId === g.commitId && ["C2", "C3", "C4", "C5"].includes(e.item.code) : ["B4", "B7"].includes(e.item.code)),
    );
    await sendLogged(db, sendMail, mine[0]!.n.email, digestHeadline(g), null, link, g.recipientUserId, mine.map((e) => e.n.id));
    sent += 1;
  }
  return sent;
}

export async function runDailyNotifications(db: Db, now: Date, sendMail: EmailPort | null, link: string) {
  const reminders = await sendReminders(db, now, sendMail, link);
  const digests = await sendDigests(db, sendMail, link);
  return { reminders, digests };
}
