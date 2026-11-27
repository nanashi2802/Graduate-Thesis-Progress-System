"use client";
// Source: USWDS date picker, WAI-ARIA APG date picker grid (DESIGN.md §7.4 `date-picker`), BR-09, BR-18, UX-022,
// Task R6.2. Screen: S4 only (R6-a A). An inline month grid, no popover. A day is a PHT day ("yyyy-mm-dd"), so the
// grid never shifts a day across the UTC+8 line. A day before `earliest` stays focusable, has `aria-disabled` and
// names the BR-09 reason; the server still checks the date. Keyboard: arrows move one day or one week, Home and End go
// to the start and the end of the week, Page Up and Page Down move one month, Enter and Space choose the day.
// Built with Base UI's Button (no new package: Base UI 1.9 has no calendar part).
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The BR-09 reason, word for word (SITEMAP §9). */
export const DATE_REASON = "At least 7 days after Gate 1b.";

/** A PHT day, "yyyy-mm-dd". */
export type DayKey = string;

const PHT_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" });
export const phtDay = (d: Date): DayKey => PHT_DAY.format(d);

const toUtc = (k: DayKey) => {
  const [y = 0, m = 1, d = 1] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (d: Date): DayKey => d.toISOString().slice(0, 10);

export const addDays = (k: DayKey, n: number): DayKey => {
  const d = toUtc(k);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
};

/** The same day in another month, or the last day of a shorter month. */
export const addMonths = (k: DayKey, n: number): DayKey => {
  const d = toUtc(k);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fromUtc(d);
};

const weekday = (k: DayKey) => toUtc(k).getUTCDay(); // 0 = Sunday

/** The day a key moves the focus to, or null for any other key. */
export function moveDay(k: DayKey, key: string): DayKey | null {
  switch (key) {
    case "ArrowLeft":
      return addDays(k, -1);
    case "ArrowRight":
      return addDays(k, 1);
    case "ArrowUp":
      return addDays(k, -7);
    case "ArrowDown":
      return addDays(k, 7);
    case "Home":
      return addDays(k, -weekday(k));
    case "End":
      return addDays(k, 6 - weekday(k));
    case "PageUp":
      return addMonths(k, -1);
    case "PageDown":
      return addMonths(k, 1);
    default:
      return null;
  }
}

/** The weeks (Sunday first) that show the month of `k`. */
function monthWeeks(k: DayKey): DayKey[][] {
  const first = `${k.slice(0, 8)}01`;
  const start = addDays(first, -weekday(first));
  const month = k.slice(0, 7);
  const weeks: DayKey[][] = [];
  let day = start;
  do {
    const sunday = day;
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(sunday, i)));
    day = addDays(day, 7);
  } while (day.slice(0, 7) === month);
  return weeks;
}

const MONTH = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
const FULL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const SHORT = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const DAYS = [
  ["Su", "Sunday"],
  ["Mo", "Monday"],
  ["Tu", "Tuesday"],
  ["We", "Wednesday"],
  ["Th", "Thursday"],
  ["Fr", "Friday"],
  ["Sa", "Saturday"],
] as const;

const full = (k: DayKey) => FULL.format(toUtc(k)).replace(",", "");
const short = (k: DayKey) => SHORT.format(toUtc(k)).replace(",", "");

export type DatePickerProps = {
  id: string;
  label: string;
  /** The form field name. The value is sent as "yyyy-mm-dd" (PHT). */
  name?: string;
  /** The first day that is allowed (BR-09: Gate 1b plus the notice period). */
  earliest: Date;
  value: DayKey | null;
  onChange: (day: DayKey) => void;
  /** For tests and /lab. Default: now. */
  today?: Date;
};

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
  </svg>
);

export function DatePicker({ id, label, name, earliest, value, onChange, today }: DatePickerProps) {
  const min = phtDay(earliest);
  const now = phtDay(today ?? new Date());
  const [focus, setFocus] = useState<DayKey>(value ?? (now > min ? now : min));
  const moved = useRef(false);
  const grid = useRef<HTMLTableElement>(null);
  const labelId = `${id}-label`;
  const monthId = useId();
  const reasonId = `${id}-reason`;

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus]);

  const pick = (k: DayKey) => {
    if (k < min) return; // blocked (BR-09): the focus stays, the reason is read
    setFocus(k);
    onChange(k);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = moveDay(focus, e.key);
    if (next === null) return;
    e.preventDefault();
    moved.current = true;
    setFocus(next);
  };
  const month = focus.slice(0, 7);

  return (
    <div data-slot="date-picker" role="group" aria-labelledby={labelId} className="flex w-fit flex-col gap-3">
      <span id={labelId} className="text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="icon" className="size-11 lg:size-9" aria-label="Previous month" onClick={() => setFocus(addMonths(focus, -1))}>
          <Chevron dir="left" />
        </Button>
        <h3 id={monthId} aria-live="polite" className="text-sm font-semibold text-foreground">
          {MONTH.format(toUtc(focus))}
        </h3>
        <Button type="button" variant="outline" size="icon" className="size-11 lg:size-9" aria-label="Next month" onClick={() => setFocus(addMonths(focus, 1))}>
          <Chevron dir="right" />
        </Button>
      </div>
      <table ref={grid} role="grid" aria-labelledby={monthId} className="border-collapse">
        <thead>
          <tr>
            {DAYS.map(([abbr, day]) => (
              <th key={day} scope="col" abbr={day} className="size-11 text-center text-[0.8rem] font-medium text-muted-foreground">
                {abbr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(focus).map((week) => (
            <tr key={week[0]}>
              {week.map((k) => {
                const blocked = k < min;
                const selected = k === value;
                const outside = k.slice(0, 7) !== month;
                return (
                  <td key={k} aria-selected={selected} className="p-0.5 text-center">
                    <button
                      type="button"
                      data-day={k}
                      tabIndex={k === focus ? 0 : -1}
                      aria-label={full(k)}
                      aria-disabled={blocked || undefined}
                      aria-describedby={blocked ? reasonId : undefined}
                      aria-current={k === now ? "date" : undefined}
                      onClick={() => pick(k)}
                      onKeyDown={onKey}
                      className={cn(
                        // The text font, not mono: the mono digits hide the strike in their middle bar (3, 4, 5, 6).
                        "size-10 rounded-control text-sm tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
                        blocked ? "cursor-not-allowed text-muted-foreground line-through decoration-2" : "font-medium text-foreground hover:bg-muted",
                        outside && !selected && "opacity-60",
                        k === now && !selected && "border border-border",
                        selected && "bg-primary text-primary-foreground hover:bg-primary",
                      )}
                    >
                      {Number(k.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flex items-center gap-1 text-[0.8rem] leading-4 font-medium text-muted-foreground">
        <Glyph name="lock" size={16} />
        <span>
          Days before {short(min)} are blocked. <span id={reasonId}>{DATE_REASON}</span>
        </span>
      </p>
      <p aria-live="polite" className="text-sm text-foreground">
        {value ? (
          <>
            Chosen date: <span className="font-medium">{short(value)}</span>
          </>
        ) : (
          <span className="text-muted-foreground">No date chosen.</span>
        )}
      </p>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
    </div>
  );
}
