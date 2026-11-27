// Source: GOV.UK radios, Linear list (DESIGN.md §7.4 `slot-list`), FR-SCH-01 to FR-SCH-03, UX-039, G5, Task R6.1.
// Screens: S4 (open slots, my requests), A4 and P3 (my slots). At most 3 facts in a row: the time, the place and one
// state. A requested or confirmed slot names the Student (UX-039). The page passes the meeting link only to the
// Adviser and the booked Student (FR-SCH-03), and gives the row action (Remove, Request this slot).
import type { ReactNode } from "react";
import { StatusPill, type Tone } from "@/components/patterns/status";
import { formatPhtRange } from "@/lib/date";
import { cn } from "@/lib/utils";

export type SlotEntry = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  mode: "in_person" | "online";
  /** The room, or the platform name for an online slot. */
  place?: string | null;
  /** Only for the Adviser and the booked Student (FR-SCH-03). */
  meetingLink?: string | null;
  status: "available" | "pending" | "confirmed";
  /** The Student who requested or holds the slot. */
  student?: string | null;
};

export type SlotListProps = {
  /** The accessible name of the list. */
  label: string;
  slots: readonly SlotEntry[];
  /** An EmptyState with the first step. */
  empty: ReactNode;
  action?: (slot: SlotEntry) => ReactNode;
  className?: string;
};

const MODE = { in_person: "In person", online: "Online" } as const;
const STATE: Record<SlotEntry["status"], { tone: Tone; label: string; who: string }> = {
  available: { tone: "neutral", label: "Open", who: "" },
  pending: { tone: "pending", label: "Requested", who: "by" },
  confirmed: { tone: "done", label: "Confirmed", who: "with" },
};

const LINK = "text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring";

export function SlotList({ label, slots, empty, action, className }: SlotListProps) {
  if (slots.length === 0) return <>{empty}</>;
  return (
    <ul aria-label={label} className={cn("flex flex-col divide-y divide-border rounded-card border border-border bg-card", className)}>
      {slots.map((s) => {
        const state = STATE[s.status];
        const act = action?.(s);
        return (
          <li key={s.id} data-slot="slot-row" className="flex min-h-(--row-h-comfortable) flex-wrap items-center gap-x-4 gap-y-2 px-(--cell-pad-x) py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              <p data-fact="time" className="font-medium text-foreground">
                {formatPhtRange(s.startsAt, s.endsAt)}
              </p>
              <p data-fact="place" className="text-muted-foreground">
                {MODE[s.mode]}
                {s.place ? ` · ${s.place}` : ""}
                {s.meetingLink ? (
                  <>
                    {" · "}
                    <a className={LINK} href={s.meetingLink}>
                      Meeting link
                    </a>
                  </>
                ) : null}
              </p>
            </div>
            <div data-fact="state" className="flex items-center gap-2 text-sm">
              <StatusPill tone={state.tone} label={state.label} />
              {s.student && state.who ? (
                <span className="text-foreground">
                  <span className="text-muted-foreground">{state.who} </span>
                  {s.student}
                </span>
              ) : null}
            </div>
            {act ? <div className="shrink-0">{act}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
