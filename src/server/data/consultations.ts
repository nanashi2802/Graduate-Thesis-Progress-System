// Slots, bookings and the consultation log (FR-SCH-01 to 08, BR-16, INV-28, NFR-01, NFR-03, AD-A-020).
// Server only. A meeting link goes only to the slot owner and to the Student of a confirmed booking (INV-28).
import "server-only";
import { and, asc, desc, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { committeeKindFor } from "@/server/domain/committee";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { appLink } from "@/server/notify/link";
import { emitSafely } from "./recipients";
import { InputProblem } from "./coordinator";
import { commonFree, expandWeekly, slotProblem, type Interval, type SlotInput } from "./schedule-rules";
import {
  booking,
  bookingThreadLink,
  committee,
  committeeMember,
  consultationLogEntry,
  critiqueThread,
  manuscriptCommit,
  milestoneInstance,
  slot,
  submissionPr,
  thesisInstance,
} from "./schema";
import { requireThesisRead } from "./scope";

type Slot = typeof slot.$inferSelect;
export type SlotView = Omit<Slot, "meetingLink"> & { meetingLink: string | null };

// ---- Publish ----

// FR-SCH-01: the Adviser publishes consultation slots. FR-SCH-07: the Adviser and Panel Members publish
// defense availability. One-off or weekly. A new slot cannot overlap an own slot.
export async function publishSlots(
  ctx: DataContext,
  input: SlotInput & { slotType: "consultation" | "defense" },
  now: Date = new Date(),
): Promise<{ slotIds: string[] }> {
  requireActive(ctx.actor);
  const { role, userId } = ctx.actor;
  const allowed = input.slotType === "consultation" ? role === "adviser" : role === "adviser" || role === "panel_member";
  if (!allowed) throw new AccessDeniedError(input.slotType === "consultation" ? "only the Adviser publishes consultation slots" : "only the Adviser and Panel Members publish defense slots");
  const problem = slotProblem(input, now);
  if (problem) throw new InputProblem(problem);
  const periods = expandWeekly(input.startsAt, input.endsAt, input.repeatWeeks);
  const rule = input.repeatWeeks > 0 ? `weekly:${input.repeatWeeks + 1}` : null;

  return ctx.db.transaction(async (tx) => {
    const mine = await tx
      .select({ startsAt: slot.startsAt, endsAt: slot.endsAt })
      .from(slot)
      .where(and(eq(slot.ownerUserId, userId), gt(slot.endsAt, periods[0]!.start)));
    for (const p of periods) {
      if (mine.some((m) => m.startsAt < p.end && p.start < m.endsAt)) {
        throw new InputProblem("A slot overlaps another slot of yours.");
      }
    }
    const rows = await tx
      .insert(slot)
      .values(
        periods.map((p) => ({
          ownerUserId: userId,
          slotType: input.slotType,
          mode: input.mode,
          meetingLink: input.mode === "online" ? input.meetingLink!.trim() : null,
          startsAt: p.start,
          endsAt: p.end,
          recurrenceRule: rule,
        })),
      )
      .returning({ id: slot.id });
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "slot.publish",
      targetTable: "slot",
      targetId: rows[0]!.id,
      detail: { slotType: input.slotType, count: rows.length },
    });
    return { slotIds: rows.map((r) => r.id) };
  });
}

// Removes an own slot that nobody requested. A requested or confirmed slot stays (the Adviser declines it).
export async function withdrawSlot(ctx: DataContext, slotId: string): Promise<void> {
  requireActive(ctx.actor);
  const removed = await ctx.db
    .delete(slot)
    .where(and(eq(slot.id, slotId), eq(slot.ownerUserId, ctx.actor.userId), eq(slot.status, "available")))
    .returning({ id: slot.id });
  if (removed.length === 0) throw new InputProblem("You can remove only your own slot that nobody requested.");
  await recordAudit(ctx, { action: "slot.withdraw", targetTable: "slot", targetId: slotId });
}

// ---- Read ----

// INV-28: the link is for the owner, and for the Student of a confirmed booking on the slot.
async function withLinkRule(ctx: DataContext, rows: Slot[]): Promise<SlotView[]> {
  const confirmedFor = new Set<string>();
  if (ctx.actor.role === "student" && rows.length > 0) {
    const mine = await ctx.db
      .select({ slotId: booking.slotId })
      .from(booking)
      .innerJoin(thesisInstance, eq(thesisInstance.id, booking.thesisInstanceId))
      .where(
        and(
          inArray(booking.slotId, rows.map((r) => r.id)),
          eq(booking.status, "confirmed"),
          eq(thesisInstance.studentUserId, ctx.actor.userId),
        ),
      );
    for (const m of mine) confirmedFor.add(m.slotId);
  }
  return rows.map((r) => ({
    ...r,
    meetingLink: r.ownerUserId === ctx.actor.userId || confirmedFor.has(r.id) ? r.meetingLink : null,
  }));
}

/**
 * The slots the actor can see. The Adviser and a Panel Member see their own. The Student sees the
 * open consultation slots of their own Adviser, and the slots they booked (FR-SCH-02).
 */
export async function listSlots(
  ctx: DataContext,
  filter: { slotType?: "consultation" | "defense" } = {},
  now: Date = new Date(),
): Promise<SlotView[]> {
  requireActive(ctx.actor);
  const { role, userId } = ctx.actor;
  const byType = filter.slotType ? [eq(slot.slotType, filter.slotType)] : [];
  if (role === "adviser" || role === "panel_member") {
    const rows = await ctx.db
      .select()
      .from(slot)
      .where(and(eq(slot.ownerUserId, userId), ...byType))
      .orderBy(asc(slot.startsAt));
    return withLinkRule(ctx, rows);
  }
  if (role !== "student") throw new AccessDeniedError("the Coordinator has no slot list");
  const [thesis] = await ctx.db.select().from(thesisInstance).where(eq(thesisInstance.studentUserId, userId));
  if (!thesis) return [];
  const booked = await ctx.db.select({ slotId: booking.slotId }).from(booking).where(eq(booking.thesisInstanceId, thesis.id));
  const own = booked.map((b) => b.slotId);
  const rows = (
    await ctx.db
      .select()
      .from(slot)
      .where(and(eq(slot.ownerUserId, thesis.adviserUserId), eq(slot.slotType, "consultation"), ...byType))
      .orderBy(asc(slot.startsAt))
  ).filter((r) => own.includes(r.id) || (r.status === "available" && r.startsAt > now));
  return withLinkRule(ctx, rows);
}

// ---- Booking ----

// Threads that belong to the thesis of the Student (FR-SCH-04).
async function threadsOfThesis(db: DataContext["db"], thesisId: string, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await db
    .select({ id: critiqueThread.id })
    .from(critiqueThread)
    .innerJoin(manuscriptCommit, eq(manuscriptCommit.id, critiqueThread.commitId))
    .innerJoin(submissionPr, eq(submissionPr.id, manuscriptCommit.submissionPrId))
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, submissionPr.milestoneInstanceId))
    .where(and(eq(milestoneInstance.thesisInstanceId, thesisId), inArray(critiqueThread.id, ids)));
  return rows.length === new Set(ids).size;
}

async function studentThesis(ctx: DataContext) {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "student") throw new AccessDeniedError("only the Student requests a slot");
  const [thesis] = await ctx.db.select().from(thesisInstance).where(eq(thesisInstance.studentUserId, ctx.actor.userId));
  if (!thesis) throw new AccessDeniedError("no thesis for this Student");
  return thesis;
}

// FR-SCH-02, FR-SCH-04: the Student requests an open slot of their Adviser, with an agenda and linked threads.
export async function requestBooking(
  ctx: DataContext,
  input: { slotId: string; agenda?: string | null; threadIds?: string[] },
  now: Date = new Date(),
): Promise<{ bookingId: string }> {
  const thesis = await studentThesis(ctx);
  const threadIds = [...new Set(input.threadIds ?? [])];
  const made = await ctx.db.transaction(async (tx) => {
    const [s] = await tx.select().from(slot).where(eq(slot.id, input.slotId));
    if (!s || s.slotType !== "consultation" || s.ownerUserId !== thesis.adviserUserId) {
      throw new InputProblem("This slot is not one of your Adviser's consultation slots.");
    }
    if (s.startsAt <= now) throw new InputProblem("This slot has started.");
    if (!(await threadsOfThesis(tx, thesis.id, threadIds))) throw new InputProblem("A linked thread is not on your manuscript.");
    // The status guard stops two Students from both taking the slot.
    const taken = await tx
      .update(slot)
      .set({ status: "pending" })
      .where(and(eq(slot.id, s.id), eq(slot.status, "available")))
      .returning({ id: slot.id });
    if (taken.length === 0) throw new InputProblem("Another Student has requested this slot.");
    const [b] = await tx
      .insert(booking)
      .values({ slotId: s.id, thesisInstanceId: thesis.id, agenda: input.agenda?.trim() || null })
      .returning();
    if (threadIds.length > 0) await tx.insert(bookingThreadLink).values(threadIds.map((t) => ({ bookingId: b!.id, critiqueThreadId: t })));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "booking.request", targetTable: "booking", targetId: b!.id });
    return { bookingId: b!.id };
  });
  // F1 (FR-NTF-01): after the commit. The email holds no agenda (FR-NTF-03).
  await emitSafely(ctx, "F1", { thesisId: thesis.id }, { link: appLink("/login"), targetTable: "booking", targetId: made.bookingId });
  return made;
}

// FR-SCH-04: the Student changes the agenda and the linked threads until the slot starts.
export async function updateAgenda(
  ctx: DataContext,
  bookingId: string,
  input: { agenda: string | null; threadIds: string[] },
  now: Date = new Date(),
): Promise<void> {
  const thesis = await studentThesis(ctx);
  const [row] = await ctx.db
    .select({ b: booking, s: slot })
    .from(booking)
    .innerJoin(slot, eq(slot.id, booking.slotId))
    .where(and(eq(booking.id, bookingId), eq(booking.thesisInstanceId, thesis.id)));
  if (!row) throw new AccessDeniedError("this booking is not yours");
  if (row.b.status === "declined") throw new InputProblem("This request was declined.");
  if (row.s.startsAt <= now) throw new InputProblem("The consultation has started.");
  const threadIds = [...new Set(input.threadIds)];
  if (!(await threadsOfThesis(ctx.db, thesis.id, threadIds))) throw new InputProblem("A linked thread is not on your manuscript.");
  await ctx.db.transaction(async (tx) => {
    await tx.update(booking).set({ agenda: input.agenda?.trim() || null }).where(eq(booking.id, bookingId));
    await tx.delete(bookingThreadLink).where(eq(bookingThreadLink.bookingId, bookingId));
    if (threadIds.length > 0) await tx.insert(bookingThreadLink).values(threadIds.map((t) => ({ bookingId, critiqueThreadId: t })));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "booking.agenda", targetTable: "booking", targetId: bookingId });
  });
}

export type BookingView = {
  booking: typeof booking.$inferSelect;
  slot: SlotView;
  studentUserId: string;
  threadIds: string[];
};

// The Adviser lists the requests on their own slots. The Student lists their own.
export async function listBookings(ctx: DataContext): Promise<BookingView[]> {
  requireActive(ctx.actor);
  const { role, userId } = ctx.actor;
  if (role !== "adviser" && role !== "student") throw new AccessDeniedError("only the Adviser and the Student list bookings");
  const rows = await ctx.db
    .select({ b: booking, s: slot, student: thesisInstance.studentUserId })
    .from(booking)
    .innerJoin(slot, eq(slot.id, booking.slotId))
    .innerJoin(thesisInstance, eq(thesisInstance.id, booking.thesisInstanceId))
    .where(role === "adviser" ? eq(slot.ownerUserId, userId) : eq(thesisInstance.studentUserId, userId))
    .orderBy(desc(slot.startsAt));
  if (rows.length === 0) return [];
  const views = await withLinkRule(ctx, rows.map((r) => r.s));
  const links = await ctx.db
    .select()
    .from(bookingThreadLink)
    .where(inArray(bookingThreadLink.bookingId, rows.map((r) => r.b.id)));
  return rows.map((r, i) => ({
    booking: r.b,
    slot: views[i]!,
    studentUserId: r.student,
    threadIds: links.filter((l) => l.bookingId === r.b.id).map((l) => l.critiqueThreadId),
  }));
}

// FR-SCH-02: the Adviser confirms or declines. A declined slot is open again.
export async function decideBooking(ctx: DataContext, bookingId: string, decision: "confirm" | "decline"): Promise<void> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "adviser") throw new AccessDeniedError("only the Adviser decides a request");
  let thesisId = "";
  await ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .select({ b: booking, s: slot })
      .from(booking)
      .innerJoin(slot, eq(slot.id, booking.slotId))
      .where(eq(booking.id, bookingId));
    if (!row || row.s.ownerUserId !== ctx.actor.userId) throw new AccessDeniedError("this request is not on your slot");
    if (row.b.status !== "pending") throw new InputProblem("This request has a decision already.");
    const confirm = decision === "confirm";
    await tx
      .update(booking)
      .set({ status: confirm ? "confirmed" : "declined", decidedAt: new Date() })
      .where(eq(booking.id, bookingId));
    await tx.update(slot).set({ status: confirm ? "confirmed" : "available" }).where(eq(slot.id, row.s.id));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: `booking.${decision}`, targetTable: "booking", targetId: bookingId });
    thesisId = row.b.thesisInstanceId;
  });
  await emitSafely(ctx, "F2", { thesisId }, { link: appLink("/login"), targetTable: "booking", targetId: bookingId });
}

// ---- Consultation log (TDW 03 rows, BR-16) ----

async function logTarget(ctx: DataContext, entryId: string) {
  requireActive(ctx.actor);
  const [row] = await ctx.db
    .select({ entry: consultationLogEntry, thesis: thesisInstance })
    .from(consultationLogEntry)
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, consultationLogEntry.milestoneInstanceId))
    .innerJoin(thesisInstance, eq(thesisInstance.id, milestoneInstance.thesisInstanceId))
    .where(eq(consultationLogEntry.id, entryId));
  if (!row) throw new InputProblem("This log entry does not exist.");
  return row;
}

// FR-SCH-05: the Adviser confirms that a confirmed consultation was held. The system drafts the entry.
export async function draftLogEntry(
  ctx: DataContext,
  bookingId: string,
  input: { placeOrPlatform?: string | null },
  now: Date = new Date(),
): Promise<{ entryId: string }> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "adviser") throw new AccessDeniedError("only the Adviser drafts a log entry");
  const [row] = await ctx.db
    .select({ b: booking, s: slot })
    .from(booking)
    .innerJoin(slot, eq(slot.id, booking.slotId))
    .where(eq(booking.id, bookingId));
  if (!row || row.s.ownerUserId !== ctx.actor.userId) throw new AccessDeniedError("this booking is not on your slot");
  if (row.b.status !== "confirmed") throw new InputProblem("Confirm the request first.");
  if (row.s.startsAt > now) throw new InputProblem("The consultation has not started.");
  const [existing] = await ctx.db.select({ id: consultationLogEntry.id }).from(consultationLogEntry).where(eq(consultationLogEntry.bookingId, bookingId));
  if (existing) throw new InputProblem("This consultation has a log entry already.");
  // The entry belongs to the milestone that is open for the thesis now: the newest one.
  const [m] = await ctx.db
    .select({ id: milestoneInstance.id })
    .from(milestoneInstance)
    .where(eq(milestoneInstance.thesisInstanceId, row.b.thesisInstanceId))
    .orderBy(desc(milestoneInstance.openedAt))
    .limit(1);
  if (!m) throw new InputProblem("The thesis has no milestone.");
  return ctx.db.transaction(async (tx) => {
    const [e] = await tx
      .insert(consultationLogEntry)
      .values({
        milestoneInstanceId: m.id,
        bookingId,
        heldAt: row.s.startsAt,
        placeOrPlatform: input.placeOrPlatform?.trim() || (row.s.mode === "online" ? "Online" : "In person"),
      })
      .returning({ id: consultationLogEntry.id });
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "log.draft", targetTable: "consultation_log_entry", targetId: e!.id });
    return { entryId: e!.id };
  });
}

// FR-SCH-05: the Student adds the topic.
export async function setLogTopic(ctx: DataContext, entryId: string, topic: string): Promise<void> {
  const { entry, thesis } = await logTarget(ctx, entryId);
  if (ctx.actor.role !== "student" || thesis.studentUserId !== ctx.actor.userId) throw new AccessDeniedError("only the Student of this thesis adds the topic");
  if (entry.confirmedAt) throw new InputProblem("The Adviser confirmed this entry. It cannot change.");
  const text = topic.trim();
  if (!text) throw new InputProblem("Write the topic first.");
  await ctx.db.transaction(async (tx) => {
    await tx.update(consultationLogEntry).set({ topic: text }).where(eq(consultationLogEntry.id, entryId));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "log.topic", targetTable: "consultation_log_entry", targetId: entryId });
  });
}

// FR-SCH-05: the Adviser confirms the entry with the recommendations. BR-16: no minimum count.
export async function confirmLogEntry(ctx: DataContext, entryId: string, recommendations: string | null): Promise<void> {
  const { entry, thesis } = await logTarget(ctx, entryId);
  if (ctx.actor.role !== "adviser" || thesis.adviserUserId !== ctx.actor.userId) throw new AccessDeniedError("only the Adviser of this thesis confirms");
  if (entry.confirmedAt) throw new InputProblem("This entry is confirmed already.");
  if (!entry.topic?.trim()) throw new InputProblem("The Student adds the topic first.");
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(consultationLogEntry)
      .set({ recommendations: recommendations?.trim() || null, confirmedAt: new Date() })
      .where(eq(consultationLogEntry.id, entryId));
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "log.confirm", targetTable: "consultation_log_entry", targetId: entryId });
  });
}

// FR-SCH-06: the TDW 03 view. The Student, the Adviser and the Coordinator read it. A Panel Member does not.
export async function listLogEntries(ctx: DataContext, milestoneId: string) {
  requireActive(ctx.actor);
  if (ctx.actor.role === "panel_member") throw new AccessDeniedError("the consultation log is not for Panel Members");
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, m.thesisInstanceId);
  return ctx.db
    .select()
    .from(consultationLogEntry)
    .where(eq(consultationLogEntry.milestoneInstanceId, milestoneId))
    .orderBy(asc(consultationLogEntry.heldAt));
}

// ---- Defense availability (FR-SCH-08) ----

// The periods in which every required evaluator is free. A booked
// defense slot (status not available) is not free.
export async function commonDefenseWindows(
  ctx: DataContext,
  thesisId: string,
  now: Date = new Date(),
): Promise<Interval[]> {
  await requireThesisRead(ctx, thesisId);
  const [thesis] = await ctx.db.select().from(thesisInstance).where(eq(thesisInstance.id, thesisId));
  // The defense of the newest milestone: Milestones 1 and 2 use the Evaluation Committee, Milestone 3 the
  // Final Panel (FR-CMT-01). The Adviser completes no sheet at the Final, so is not required there (FR-DEF-06).
  const [current] = await ctx.db
    .select({ code: milestoneInstance.milestoneCode })
    .from(milestoneInstance)
    .where(eq(milestoneInstance.thesisInstanceId, thesisId))
    .orderBy(desc(milestoneInstance.openedAt))
    .limit(1);
  const code = current?.code ?? "proposal";
  const seats = await ctx.db
    .select({ userId: committeeMember.memberUserId })
    .from(committeeMember)
    .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
    .where(
      and(
        eq(committee.thesisInstanceId, thesisId),
        eq(committee.kind, committeeKindFor(code) ?? "evaluation_committee"),
        ne(committeeMember.status, "declined"),
      ),
    );
  const members = [...new Set(seats.map((s) => s.userId))];
  const required = code === "final" ? members : [thesis!.adviserUserId, ...members];
  const rows = await ctx.db
    .select({ owner: slot.ownerUserId, start: slot.startsAt, end: slot.endsAt })
    .from(slot)
    .where(and(inArray(slot.ownerUserId, required), eq(slot.slotType, "defense"), eq(slot.status, "available"), gt(slot.startsAt, now), lt(slot.startsAt, new Date(now.getTime() + 366 * 86_400_000))));
  return commonFree(required.map((id) => rows.filter((r) => r.owner === id).map((r) => ({ start: r.start, end: r.end }))));
}
