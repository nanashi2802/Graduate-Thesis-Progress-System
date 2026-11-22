// Slots, bookings and the consultation log (ERD §4.1, store D5).
import { sql } from "drizzle-orm";
import { check, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { appUser, milestoneInstance, thesisInstance } from "./accounts";
import { app } from "./app";
import { id, ts } from "./columns";
import { bookingStatus, slotMode, slotStatus, slotType } from "./enums";
import { critiqueThread } from "./manuscript";

// INV-28: `meeting_link` goes only to the owner and the Student of a confirmed booking (DL).
export const slot = app.table(
  "slot",
  {
    id: id(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => appUser.id),
    slotType: slotType("slot_type").notNull(),
    mode: slotMode("mode").notNull(),
    meetingLink: text("meeting_link"),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at").notNull(),
    recurrenceRule: text("recurrence_rule"),
    status: slotStatus("status").notNull().default("available"),
  },
  (t) => [check("slot_time_order", sql`${t.endsAt} > ${t.startsAt}`)],
);

export const booking = app.table("booking", {
  id: id(),
  slotId: uuid("slot_id")
    .notNull()
    .references(() => slot.id),
  thesisInstanceId: uuid("thesis_instance_id")
    .notNull()
    .references(() => thesisInstance.id),
  agenda: text("agenda"),
  status: bookingStatus("status").notNull().default("pending"),
  requestedAt: ts("requested_at").notNull().defaultNow(),
  decidedAt: ts("decided_at"),
});

export const bookingThreadLink = app.table(
  "booking_thread_link",
  {
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id),
    critiqueThreadId: uuid("critique_thread_id")
      .notNull()
      .references(() => critiqueThread.id),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.critiqueThreadId] })],
);

// One TDW 03 row (FR-SCH-05, FR-SCH-06).
export const consultationLogEntry = app.table("consultation_log_entry", {
  id: id(),
  milestoneInstanceId: uuid("milestone_instance_id")
    .notNull()
    .references(() => milestoneInstance.id),
  bookingId: uuid("booking_id")
    .unique()
    .references(() => booking.id),
  heldAt: ts("held_at").notNull(),
  placeOrPlatform: text("place_or_platform"),
  topic: text("topic"),
  recommendations: text("recommendations"),
  confirmedAt: ts("confirmed_at"),
});
