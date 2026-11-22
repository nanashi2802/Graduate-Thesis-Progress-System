// P1-E08: slots, bookings, the consultation log and defense availability (FR-SCH-01 to 08, BR-16, INV-28, AD-A-020).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import {
  commonDefenseWindows,
  confirmLogEntry,
  decideBooking,
  draftLogEntry,
  listBookings,
  listLogEntries,
  listSlots,
  publishSlots,
  requestBooking,
  setLogTopic,
  updateAgenda,
  withdrawSlot,
} from "@/server/data/consultations";
import type { Db } from "@/server/data/db";
import { commonFree, expandWeekly, slotProblem } from "@/server/data/schedule-rules";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: actorOf(u) });

const NOW = new Date("2026-11-22T00:00:00Z");
const at = (days: number, hour = 9) => new Date(NOW.getTime() + days * 86_400_000 + hour * 3_600_000);
const slotIn = (days: number, over: Partial<Parameters<typeof publishSlots>[1]> = {}) => ({
  slotType: "consultation" as const,
  mode: "in_person" as const,
  meetingLink: null,
  startsAt: at(days, 9),
  endsAt: at(days, 10),
  repeatWeeks: 0,
  ...over,
});

describe("slot rules (pure)", () => {
  const base = { mode: "in_person" as const, meetingLink: null, startsAt: at(1), endsAt: at(1, 10), repeatWeeks: 0 };
  it("refuses a bad time, a past start, a long slot and a bad repeat", () => {
    expect(slotProblem({ ...base, endsAt: at(1, 8) }, NOW)).toMatch(/after/);
    expect(slotProblem({ ...base, startsAt: at(-1) , endsAt: at(-1, 10) }, NOW)).toMatch(/future/);
    expect(slotProblem({ ...base, endsAt: at(1, 20) }, NOW)).toMatch(/8 hours/);
    expect(slotProblem({ ...base, repeatWeeks: 99 }, NOW)).toMatch(/Repeat/);
    expect(slotProblem(base, NOW)).toBeNull();
  });
  it("needs a link for Online and none for In person (FR-SCH-01)", () => {
    expect(slotProblem({ ...base, mode: "online" }, NOW)).toMatch(/link/);
    expect(slotProblem({ ...base, mode: "online", meetingLink: "meet.example" }, NOW)).toMatch(/http/);
    expect(slotProblem({ ...base, mode: "online", meetingLink: "https://meet.example.test/a" }, NOW)).toBeNull();
    expect(slotProblem({ ...base, meetingLink: "https://meet.example.test/a" }, NOW)).toMatch(/no meeting link/);
  });
  it("expands a weekly rule into one slot each week", () => {
    const list = expandWeekly(at(1), at(1, 10), 2);
    expect(list.map((i) => i.start.getTime() - at(1).getTime())).toEqual([0, 7 * 86_400_000, 14 * 86_400_000]);
  });
  it("finds the common free periods of all members (FR-SCH-08)", () => {
    const iv = (d: number, h1: number, h2: number) => ({ start: at(d, h1), end: at(d, h2) });
    expect(commonFree([[iv(1, 9, 12)], [iv(1, 10, 14)], [iv(1, 11, 13), iv(2, 9, 10)]])).toEqual([iv(1, 11, 12)]);
    expect(commonFree([[iv(1, 9, 12)], []])).toEqual([]);
    expect(commonFree([[iv(1, 9, 9.25)], [iv(1, 9, 12)]])).toEqual([]);
    expect(commonFree([])).toEqual([]);
  });
});

async function setup() {
  const t = await makeThesisChain(db);
  return t;
}

describe("publishSlots and listSlots (FR-SCH-01, INV-28)", () => {
  it("lets only the Adviser publish consultation slots, and shows an open slot to the own Student", async () => {
    const t = await setup();
    await expect(publishSlots(as(t.student), slotIn(1), NOW)).rejects.toBeInstanceOf(AccessDeniedError);
    const { slotIds } = await publishSlots(as(t.adviser), slotIn(1, { mode: "online", meetingLink: "https://meet.example.test/x", repeatWeeks: 2 }), NOW);
    expect(slotIds).toHaveLength(3);
    const seen = await listSlots(as(t.student), {}, NOW);
    expect(seen).toHaveLength(3);
    // INV-28: no link before a confirmed booking.
    expect(seen.every((x) => x.meetingLink === null)).toBe(true);
    const own = await listSlots(as(t.adviser), {}, NOW);
    expect(own.every((x) => x.meetingLink === "https://meet.example.test/x")).toBe(true);
    const other = await makeThesisChain(db);
    expect(await listSlots(as(other.student), {}, NOW)).toHaveLength(0);
  });

  it("refuses an overlap with an own slot, and a removal of a requested slot", async () => {
    const t = await setup();
    const { slotIds } = await publishSlots(as(t.adviser), slotIn(2), NOW);
    await expect(publishSlots(as(t.adviser), slotIn(2, { startsAt: at(2, 9.5), endsAt: at(2, 10.5) }), NOW)).rejects.toThrow(/overlaps/);
    await requestBooking(as(t.student), { slotId: slotIds[0]! }, NOW);
    await expect(withdrawSlot(as(t.adviser), slotIds[0]!)).rejects.toThrow(/nobody requested/);
    const free = await publishSlots(as(t.adviser), slotIn(3), NOW);
    await expect(withdrawSlot(as(t.student), free.slotIds[0]!)).rejects.toThrow();
    await withdrawSlot(as(t.adviser), free.slotIds[0]!);
  });
});

describe("bookings (FR-SCH-02 to 04, INV-28)", () => {
  it("runs request, decline, request again, confirm, and gives the link to the booked Student only", async () => {
    const t = await setup();
    const { slotIds } = await publishSlots(as(t.adviser), slotIn(2, { mode: "online", meetingLink: "https://meet.example.test/y" }), NOW);
    const slotId = slotIds[0]!;
    const { bookingId } = await requestBooking(as(t.student), { slotId, agenda: "  Chapter 3  " }, NOW);
    const [pending] = await db.select().from(s.slot).where(eq(s.slot.id, slotId));
    expect(pending!.status).toBe("pending");
    // A second Student cannot take it. A slot of another Adviser is not theirs.
    const rival = await makeThesisChain(db);
    await expect(requestBooking(as(rival.student), { slotId }, NOW)).rejects.toThrow(/not one of your Adviser/);
    await expect(decideBooking(as(t.student), bookingId, "confirm")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(decideBooking(as(rival.adviser), bookingId, "confirm")).rejects.toBeInstanceOf(AccessDeniedError);
    await decideBooking(as(t.adviser), bookingId, "decline");
    expect((await db.select().from(s.slot).where(eq(s.slot.id, slotId)))[0]!.status).toBe("available");
    await expect(decideBooking(as(t.adviser), bookingId, "confirm")).rejects.toThrow(/decision already/);

    const again = await requestBooking(as(t.student), { slotId }, NOW);
    expect((await listSlots(as(t.student), {}, NOW))[0]!.meetingLink).toBeNull();
    await decideBooking(as(t.adviser), again.bookingId, "confirm");
    expect((await listSlots(as(t.student), {}, NOW))[0]!.meetingLink).toBe("https://meet.example.test/y");
    expect((await listBookings(as(t.student)))[0]!.slot.meetingLink).toBe("https://meet.example.test/y");
    expect((await listBookings(as(t.adviser)))).toHaveLength(2);
    expect(await listBookings(as(rival.adviser))).toHaveLength(0);
    // A confirmed slot is no longer open for another Student.
    expect(await listSlots(as(rival.student), {}, NOW)).toHaveLength(0);
  });

  it("refuses a started slot, a slot already requested, and a thread of another thesis", async () => {
    const t = await setup();
    const { slotIds } = await publishSlots(as(t.adviser), slotIn(2), NOW);
    await db.update(s.slot).set({ startsAt: at(-1), endsAt: at(-1, 10) }).where(eq(s.slot.id, slotIds[0]!));
    await expect(requestBooking(as(t.student), { slotId: slotIds[0]! }, NOW)).rejects.toThrow(/started/);
    const [ok] = (await publishSlots(as(t.adviser), slotIn(4), NOW)).slotIds;
    const other = await makeThesisChain(db);
    const [foreign] = await db
      .insert(s.critiqueThread)
      .values({ commitId: other.commit.id, authorUserId: other.adviser.id, authorRole: "adviser", context: "iteration", body: "x" })
      .returning();
    await expect(requestBooking(as(t.student), { slotId: ok!, threadIds: [foreign!.id] }, NOW)).rejects.toThrow(/not on your manuscript/);
    await requestBooking(as(t.student), { slotId: ok! }, NOW);
    await expect(requestBooking(as(t.student), { slotId: ok! }, NOW)).rejects.toThrow(/Another Student/);
  });

  it("lets the Student edit the agenda and linked threads until the slot starts (FR-SCH-04)", async () => {
    const t = await setup();
    const [slotId] = (await publishSlots(as(t.adviser), slotIn(2), NOW)).slotIds;
    const { bookingId } = await requestBooking(as(t.student), { slotId: slotId! }, NOW);
    const [thread] = await db
      .insert(s.critiqueThread)
      .values({ commitId: t.commit.id, authorUserId: t.adviser.id, authorRole: "adviser", context: "iteration", body: "x" })
      .returning();
    await updateAgenda(as(t.student), bookingId, { agenda: "Methods", threadIds: [thread!.id] }, NOW);
    const [view] = await listBookings(as(t.adviser));
    expect(view!.booking.agenda).toBe("Methods");
    expect(view!.threadIds).toEqual([thread!.id]);
    await expect(updateAgenda(as(t.student), bookingId, { agenda: "x", threadIds: [] }, at(2, 9.5))).rejects.toThrow(/started/);
    const other = await makeThesisChain(db);
    await expect(updateAgenda(as(other.student), bookingId, { agenda: "x", threadIds: [] }, NOW)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

describe("consultation log (FR-SCH-05, FR-SCH-06, BR-16)", () => {
  async function held() {
    const t = await setup();
    const [slotId] = (await publishSlots(as(t.adviser), slotIn(2), NOW)).slotIds;
    const { bookingId } = await requestBooking(as(t.student), { slotId: slotId! }, NOW);
    await decideBooking(as(t.adviser), bookingId, "confirm");
    return { ...t, bookingId, afterSlot: at(3) };
  }

  it("drafts after the slot, takes the topic from the Student and the confirmation from the Adviser", async () => {
    const t = await held();
    await expect(draftLogEntry(as(t.adviser), t.bookingId, {}, NOW)).rejects.toThrow(/not started/);
    await expect(draftLogEntry(as(t.student), t.bookingId, {}, t.afterSlot)).rejects.toBeInstanceOf(AccessDeniedError);
    const { entryId } = await draftLogEntry(as(t.adviser), t.bookingId, {}, t.afterSlot);
    await expect(draftLogEntry(as(t.adviser), t.bookingId, {}, t.afterSlot)).rejects.toThrow(/already/);
    await expect(confirmLogEntry(as(t.adviser), entryId, "Add a chapter.")).rejects.toThrow(/topic/);
    await expect(setLogTopic(as(t.adviser), entryId, "x")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(setLogTopic(as(t.student), entryId, "  ")).rejects.toThrow(/topic/);
    await setLogTopic(as(t.student), entryId, "Methods");
    await expect(confirmLogEntry(as(t.student), entryId, null)).rejects.toBeInstanceOf(AccessDeniedError);
    await confirmLogEntry(as(t.adviser), entryId, " Add a chapter. ");
    const rows = await listLogEntries(as(t.student), t.milestone.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ topic: "Methods", recommendations: "Add a chapter.", placeOrPlatform: "In person" });
    expect(rows[0]!.confirmedAt).not.toBeNull();
    // A confirmed entry does not change.
    await expect(setLogTopic(as(t.student), entryId, "Other")).rejects.toThrow(/cannot change/);
    await expect(confirmLogEntry(as(t.adviser), entryId, null)).rejects.toThrow(/already/);
  });

  it("sets no minimum count: an empty log is fine (BR-16)", async () => {
    const t = await setup();
    expect(await listLogEntries(as(t.coordinator), t.milestone.id)).toEqual([]);
  });

  it("keeps the log from a Panel Member and a stranger", async () => {
    const t = await setup();
    const member = await makeUser(db, "panel_member");
    await expect(listLogEntries(as(member), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    const stranger = await makeUser(db, "student");
    await expect(listLogEntries(as(stranger), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

describe("defense availability (FR-SCH-07, FR-SCH-08)", () => {
  it("lets the Adviser and a Panel Member publish, and finds the common free time", async () => {
    const t = await setup();
    const m1 = await makeUser(db, "panel_member");
    const m2 = await makeUser(db, "panel_member");
    const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
    await db.insert(s.committeeMember).values([
      { committeeId: com!.id, memberUserId: m1.id, status: "accepted" },
      { committeeId: com!.id, memberUserId: m2.id, status: "accepted" },
    ]);
    const win = (a: number, b: number) => ({ slotType: "defense" as const, mode: "in_person" as const, meetingLink: null, startsAt: at(10, a), endsAt: at(10, b), repeatWeeks: 0 });
    await expect(publishSlots(as(t.student), win(9, 12), NOW)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(publishSlots(as(t.coordinator), win(9, 12), NOW)).rejects.toBeInstanceOf(AccessDeniedError);
    await publishSlots(as(t.adviser), win(9, 12), NOW);
    await publishSlots(as(m1), win(10, 14), NOW);
    expect(await commonDefenseWindows(as(t.student), t.thesis.id, NOW)).toEqual([]);
    await publishSlots(as(m2), win(11, 13), NOW);
    expect(await commonDefenseWindows(as(t.student), t.thesis.id, NOW)).toEqual([{ start: at(10, 11), end: at(10, 12) }]);
    const stranger = await makeUser(db, "student");
    await expect(commonDefenseWindows(as(stranger), t.thesis.id, NOW)).rejects.toBeInstanceOf(AccessDeniedError);
    // A Student never sees a defense slot in the consultation list.
    expect(await listSlots(as(t.student), { slotType: "defense" }, NOW)).toEqual([]);
  });
});
