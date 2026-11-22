// Reminders made by the daily job (FR-NTF-06, FR §3 parameters, A4, B1, B2, B6).
// Pure code: the data layer collects the dates of each thesis and calls `remindersDue`
// once a day with the PST date (NFR-11). Each rule fires on exact days only, so one daily
// run sends each reminder once with no extra state. AD-B-015 sets the days that FR §3 leaves open.

import type { EventCode } from "./events";

/** PST calendar date `YYYY-MM-DD`. */
export type PstDate = string;

export const REMINDER_DAYS = {
  /** A4: 3 days and 1 day before the defense (FR §3). */
  defense: [3, 1],
  /** B1: 7 days before the printed-copies due date ("due in 7 days", FR §4.10). AD-B-015. */
  printedCopies: [7],
  /** B2: 7 days before the target date, and 1 day after it passes. AD-B-015. */
  targetBefore: [7],
  targetAfter: [1],
  /** B6: 90 and 30 days before the residency end date. AD-B-015. */
  residency: [90, 30],
} as const;

export type ReminderFacts = {
  /** Scheduled defense date, or null when none is confirmed. */
  defenseDate: PstDate | null;
  /** `template_version.printed_copies_due_days` (BR-09, default 7). */
  printedCopiesDueDays: number;
  /** Milestone target date (FR-TPL-05). Null: B2 stays off (G24). */
  targetDate: PstDate | null;
  /** Residency end date (ERD §4.2). Null: B6 stays off. */
  residencyEndDate: PstDate | null;
};

export type DueReminder = { code: EventCode; deadline: PstDate };

const DAY_MS = 86_400_000;

function toDays(d: PstDate): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Not a PST date: ${d}`);
  return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) / DAY_MS;
}

export function addDays(d: PstDate, n: number): PstDate {
  return new Date((toDays(d) + n) * DAY_MS).toISOString().slice(0, 10);
}

/** Days from `today` to `date`. Positive when `date` is later. */
export function daysUntil(today: PstDate, date: PstDate): number {
  return toDays(date) - toDays(today);
}

/** The reminders that the daily job sends today for one thesis. */
export function remindersDue(today: PstDate, f: ReminderFacts): DueReminder[] {
  const out: DueReminder[] = [];
  if (f.defenseDate) {
    const d = daysUntil(today, f.defenseDate);
    if ((REMINDER_DAYS.defense as readonly number[]).includes(d)) out.push({ code: "A4", deadline: f.defenseDate });
    const due = addDays(f.defenseDate, -f.printedCopiesDueDays);
    if ((REMINDER_DAYS.printedCopies as readonly number[]).includes(daysUntil(today, due))) {
      out.push({ code: "B1", deadline: due });
    }
  }
  if (f.targetDate) {
    const d = daysUntil(today, f.targetDate);
    const before = (REMINDER_DAYS.targetBefore as readonly number[]).includes(d);
    const after = (REMINDER_DAYS.targetAfter as readonly number[]).includes(-d);
    if (before || after) out.push({ code: "B2", deadline: f.targetDate });
  }
  if (f.residencyEndDate) {
    const d = daysUntil(today, f.residencyEndDate);
    if ((REMINDER_DAYS.residency as readonly number[]).includes(d)) out.push({ code: "B6", deadline: f.residencyEndDate });
  }
  return out;
}
