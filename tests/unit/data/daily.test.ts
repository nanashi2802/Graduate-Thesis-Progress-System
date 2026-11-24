// P2-E04-T06: the daily job (FR-NTF-04, FR-NTF-05, FR-NTF-06, FR-NTF-07, BR-20, NFR-11).
import { beforeEach, describe, expect, it } from "vitest";
import { runDailyNotifications } from "@/server/data/daily";
import type { Db } from "@/server/data/db";
import type { EmailPort } from "@/server/data/notifications";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
let sent: { to: string; subject: string }[];
const mail: EmailPort = async (to, msg) => {
  sent.push({ to, subject: msg.subject });
  return "re_1";
};
const link = "https://app.test/login";
const now = new Date("2026-03-10T01:00:00Z"); // 09:00 PST, 2026-03-10

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
  sent = [];
});

async function schedule(startAt: string) {
  await db.insert(s.defenseAttempt).values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date(startAt) });
}

describe("reminders", () => {
  it("sends A4 on its day only, and a second run the same day sends nothing new", async () => {
    await schedule("2026-03-13T02:00:00Z"); // PST date 2026-03-13: 3 days away
    const first = await runDailyNotifications(db, now, mail, link);
    expect(first.reminders).toBeGreaterThan(0);
    const logged = (await db.select().from(s.emailLog)).length;
    expect(logged).toBe(sent.length);
    expect(sent.length).toBeGreaterThan(0);
    const again = await runDailyNotifications(db, now, mail, link);
    expect(again.reminders).toBe(0);
    expect(sent).toHaveLength(logged);
    // A different day with no matching offset sends none.
    const quiet = await runDailyNotifications(db, new Date("2026-03-11T01:00:00Z"), mail, link);
    expect(quiet.reminders).toBe(0); // 2 days before: no rule
    expect(sent).toHaveLength(logged);
  });

  it("keeps the in-app row and sends no email when the user turned the event off", async () => {
    await schedule("2026-03-13T02:00:00Z");
    await db.insert(s.notificationPreference).values({ userId: seed.student.id, eventCode: "A4", enabled: false });
    await runDailyNotifications(db, now, mail, link);
    const rows = await db.select().from(s.notification);
    expect(rows.some((r) => r.recipientUserId === seed.student.id && r.eventCode === "A4")).toBe(true);
    expect(sent.some((m) => m.to === seed.student.email)).toBe(false);
  });
});

describe("digests", () => {
  it("sends one B4 digest and does not send it twice", async () => {
    await db.insert(s.notification).values([
      { recipientUserId: seed.student.id, eventCode: "B4" },
      { recipientUserId: seed.student.id, eventCode: "B4" },
    ]);
    expect((await runDailyNotifications(db, now, mail, link)).digests).toBe(1);
    expect(sent).toHaveLength(1);
    expect((await db.select().from(s.emailLog)).length).toBe(2);
    expect((await runDailyNotifications(db, now, mail, link)).digests).toBe(0);
  });

  it("holds a Student's Defense Day thread digest until the defense closes (BR-20)", async () => {
    const [pr] = await db.insert(s.submissionPr).values({ milestoneInstanceId: seed.milestone.id }).returning();
    const [c] = await db
      .insert(s.manuscriptCommit)
      .values({ submissionPrId: pr!.id, ordinal: 1, fileKey: "agent-b/k1", sha256: "a".repeat(64), sizeBytes: 10, uploadedByUserId: seed.student.id })
      .returning();
    const [t] = await db
      .insert(s.critiqueThread)
      .values({ commitId: c!.id, authorUserId: seed.panel[0]!.id, authorRole: "panel_member", context: "defense_day", body: "x" })
      .returning();
    await db.insert(s.notification).values({ recipientUserId: seed.student.id, eventCode: "C2", targetTable: "critique_thread", targetId: t!.id });
    expect((await runDailyNotifications(db, now, mail, link)).digests).toBe(0);
    await db.insert(s.defenseAttempt).values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "closed" });
    expect((await runDailyNotifications(db, now, mail, link)).digests).toBe(1);
  });

  it("sends no digest email for a turned-off event", async () => {
    await db.insert(s.notification).values({ recipientUserId: seed.student.id, eventCode: "B4" });
    await db.insert(s.notificationPreference).values({ userId: seed.student.id, eventCode: "B4", enabled: false });
    expect((await runDailyNotifications(db, now, mail, link)).digests).toBe(0);
    expect(sent).toHaveLength(0);
  });
});
