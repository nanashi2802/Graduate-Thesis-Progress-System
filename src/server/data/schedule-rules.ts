// Pure rules for slots (FR-SCH-01, FR-SCH-07, FR-SCH-08, AD-A-020). No database, no framework.
export type Interval = { start: Date; end: Date };

export type SlotInput = {
  mode: "in_person" | "online";
  meetingLink: string | null;
  startsAt: Date;
  endsAt: Date;
  /** Extra weekly copies after the first slot (FR-SCH-01: one-off or recurring). */
  repeatWeeks: number;
};

export const MAX_REPEAT_WEEKS = 15;
export const MAX_SLOT_MINUTES = 8 * 60;

/** One reason for the first problem, or null. */
export function slotProblem(input: SlotInput, now: Date): string | null {
  if (Number.isNaN(input.startsAt.getTime()) || Number.isNaN(input.endsAt.getTime())) return "Enter a start and an end time.";
  if (input.endsAt <= input.startsAt) return "The end time must be after the start time.";
  if (input.endsAt.getTime() - input.startsAt.getTime() > MAX_SLOT_MINUTES * 60_000) return "A slot lasts 8 hours at most.";
  if (input.startsAt <= now) return "A slot must start in the future.";
  if (!Number.isInteger(input.repeatWeeks) || input.repeatWeeks < 0 || input.repeatWeeks > MAX_REPEAT_WEEKS) {
    return `Repeat 0 to ${MAX_REPEAT_WEEKS} more weeks.`;
  }
  const link = input.meetingLink?.trim() ?? "";
  if (input.mode === "online") {
    if (!link) return "An Online slot needs a meeting link.";
    if (!/^https?:\/\/\S+$/i.test(link)) return "The meeting link must start with http:// or https://.";
  } else if (link) {
    return "An In person slot has no meeting link.";
  }
  return null;
}

/** The slots a recurring publish makes: the first one, then one each week. */
export function expandWeekly(start: Date, end: Date, repeatWeeks: number): Interval[] {
  const week = 7 * 24 * 60 * 60_000;
  return Array.from({ length: repeatWeeks + 1 }, (_, i) => ({
    start: new Date(start.getTime() + i * week),
    end: new Date(end.getTime() + i * week),
  }));
}

export const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/**
 * FR-SCH-08: the periods in which every required member is free. Each list holds the free
 * intervals of one member. An empty list for any member gives no common period.
 */
export function commonFree(perMember: Interval[][], minMinutes = 30): Interval[] {
  if (perMember.length === 0 || perMember.some((l) => l.length === 0)) return [];
  let common = [...perMember[0]!];
  for (const list of perMember.slice(1)) {
    const next: Interval[] = [];
    for (const a of common) {
      for (const b of list) {
        const start = a.start > b.start ? a.start : b.start;
        const end = a.end < b.end ? a.end : b.end;
        if (end > start) next.push({ start, end });
      }
    }
    common = next;
  }
  return common
    .filter((i) => i.end.getTime() - i.start.getTime() >= minMinutes * 60_000)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
