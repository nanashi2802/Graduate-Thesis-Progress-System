import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** The four stages of the stepper (DESIGN.md §7.2). Clearance follows the Final milestone. */
export const STEPPER_STAGES = ["Proposal", "Pre-Final", "Final", "Clearance"] as const;

export type StepperStageIndex = 0 | 1 | 2 | 3;
export type StepState = "completed" | "active" | "locked";

/**
 * State of each node. `current` is the stage the Student is in now.
 * `allDone` marks every node completed (the Student is Cleared).
 */
export function stepStates(current: StepperStageIndex, allDone = false): StepState[] {
  return STEPPER_STAGES.map((_, i) => (allDone || i < current ? "completed" : i === current ? "active" : "locked"));
}

const STATE_TEXT: Record<StepState, string> = {
  completed: "completed",
  active: "current stage",
  locked: "not started",
};

/**
 * Milestone stepper (DESIGN.md §7.2, FR-TRK-01). Gold marks completed and active nodes.
 * It uses a check, never a star or another shape from the PUP logo (DESIGN.md P9).
 */
export function MilestoneStepper({
  current,
  allDone = false,
  className,
}: {
  current: StepperStageIndex;
  allDone?: boolean;
  className?: string;
}) {
  const states = stepStates(current, allDone);
  return (
    <ol data-slot="milestone-stepper" aria-label="Thesis stages" className={cn("flex items-center gap-2", className)}>
      {states.map((state, i) => {
        const label = STEPPER_STAGES[i];
        return (
          <li
            key={label}
            data-state={state}
            aria-current={state === "active" ? "step" : undefined}
            className="flex items-center gap-2"
          >
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={cn("h-px w-6 sm:w-10", states[i - 1] === "completed" ? "bg-primary" : "bg-neutral-300")}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                state === "completed" && "border-gold-500 bg-gold-400 text-maroon-600",
                state === "active" && "border-2 border-maroon-600 bg-gold-400 text-maroon-600",
                state === "locked" && "border-neutral-300 bg-card text-neutral-600",
              )}
            >
              {state === "completed" ? <Check strokeWidth={2} className="size-3.5" /> : null}
              {state === "locked" ? <Lock strokeWidth={1.5} className="size-3" /> : null}
            </span>
            <span
              className={cn(
                "text-sm whitespace-nowrap",
                state === "active" ? "text-base font-semibold text-foreground" : "",
                state === "completed" ? "text-foreground" : "",
                state === "locked" ? "text-muted-foreground" : "",
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
