import { describe, expect, it } from "vitest";
import { addDays, daysUntil, remindersDue, type ReminderFacts } from "@/server/notify/reminders";

const none: ReminderFacts = { defenseDate: null, printedCopiesDueDays: 7, targetDate: null, residencyEndDate: null };

describe("date helpers (NFR-11)", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(daysUntil("2027-01-01", "2027-01-12")).toBe(11);
  });

  it("refuses a value that is not a PST date", () => {
    expect(() => daysUntil("2027-1-1", "2027-01-12")).toThrow();
  });
});

describe("remindersDue (FR-NTF-06)", () => {
  const defense: ReminderFacts = { ...none, defenseDate: "2027-01-20" };

  it("sends A4 3 days and 1 day before the defense only", () => {
    expect(remindersDue("2027-01-17", defense)).toEqual([{ code: "A4", deadline: "2027-01-20" }]);
    expect(remindersDue("2027-01-19", defense)).toEqual([{ code: "A4", deadline: "2027-01-20" }]);
    expect(remindersDue("2027-01-18", defense)).toEqual([]);
    expect(remindersDue("2027-01-20", defense)).toEqual([]);
  });

  it("sends B1 7 days before the printed-copies due date (BR-09)", () => {
    // Due date 2027-01-13 (7 days before the defense). Reminder on 2027-01-06.
    expect(remindersDue("2027-01-06", defense)).toEqual([{ code: "B1", deadline: "2027-01-13" }]);
    expect(remindersDue("2027-01-07", defense)).toEqual([]);
  });

  it("uses the template's printed-copies days", () => {
    expect(remindersDue("2027-01-09", { ...defense, printedCopiesDueDays: 4 })).toEqual([
      { code: "B1", deadline: "2027-01-16" },
    ]);
  });

  it("keeps B2 off with no target date (G24), and sends it 7 days before and 1 day after", () => {
    expect(remindersDue("2027-02-01", none)).toEqual([]);
    const t = { ...none, targetDate: "2027-03-01" };
    expect(remindersDue("2027-02-22", t)).toEqual([{ code: "B2", deadline: "2027-03-01" }]);
    expect(remindersDue("2027-03-02", t)).toEqual([{ code: "B2", deadline: "2027-03-01" }]);
    expect(remindersDue("2027-03-01", t)).toEqual([]);
  });

  it("sends B6 90 and 30 days before the residency end date", () => {
    const r = { ...none, residencyEndDate: "2030-06-30" };
    expect(remindersDue(addDays("2030-06-30", -90), r)).toEqual([{ code: "B6", deadline: "2030-06-30" }]);
    expect(remindersDue(addDays("2030-06-30", -30), r)).toEqual([{ code: "B6", deadline: "2030-06-30" }]);
    expect(remindersDue(addDays("2030-06-30", -31), r)).toEqual([]);
  });

  it("can send more than one reminder on one day", () => {
    const f = { ...none, defenseDate: "2027-01-20", targetDate: "2027-01-24" };
    expect(remindersDue("2027-01-17", f).map((x) => x.code)).toEqual(["A4", "B2"]);
  });
});
