// Source: own, ledger (DESIGN.md §8.2, FR-TRK-01). Four steps: Proposal, Pre-Final, Final, Clearance.
// Completed: solid maroon circle with a white check. Current: Golden Yellow circle with a maroon edge.
// Locked: an outline circle with the `lock` glyph. This follows the brand guide sample app (UX-D-11 item 2):
// maroon for progress made, gold only for "you are here". A check, never a PUP logo shape (F1).
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

export const STEPS = ["Proposal", "Pre-Final", "Final", "Clearance"] as const;

export type StepperProps = {
  /** The current step, 1 to 4. */
  current: 1 | 2 | 3 | 4;
  /** The completed steps, 1 to 4. */
  completed: number[];
  /** Small nodes, labels for screen readers only. For queue rows (A1, P1). */
  compact?: boolean;
  className?: string;
};

type State = "completed" | "current" | "locked";
const STATE_TEXT: Record<State, string> = { completed: "completed", current: "current step", locked: "not started" };

export function Stepper({ current, completed, compact = false, className }: StepperProps) {
  const states: State[] = STEPS.map((_, i) => (completed.includes(i + 1) ? "completed" : i + 1 === current ? "current" : "locked"));
  return (
    <ol data-slot="stepper" aria-label="Thesis steps" className={cn("flex items-center", compact ? "gap-1" : "gap-2", className)}>
      {STEPS.map((label, i) => {
        const state = states[i]!;
        return (
          <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-2">
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={cn("h-px", compact ? "w-3" : "w-6 sm:w-10", states[i - 1] === "completed" ? "bg-primary" : "bg-divider-strong")}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full border",
                compact ? "size-4" : "size-6",
                state === "completed" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-2 border-primary bg-progress",
                state === "locked" && "border-divider-strong bg-card text-muted-foreground",
              )}
            >
              {state === "completed" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={compact ? "size-3" : "size-3.5"}>
                  <path d="m6 12 4 4 8-8" />
                </svg>
              ) : null}
              {state === "locked" && !compact ? <Glyph name="lock" size={16} className="size-3.5" /> : null}
            </span>
            <span
              className={cn(
                compact ? "sr-only" : "text-sm whitespace-nowrap",
                !compact && state === "current" && "text-base font-semibold text-foreground",
                !compact && state === "completed" && "text-foreground",
                !compact && state === "locked" && "text-muted-foreground",
              )}
            >
              {label}
              <span className="sr-only">, {STATE_TEXT[state]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
