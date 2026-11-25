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
 * Milestone stepper (DESIGN.md §8.2, FR-TRK-01). Completed nodes are maroon, the current node is gold with a
 * maroon edge (UX-D-11 item 2, approved in UX-P-01). R7 moves the call sites to the `stepper` pattern.
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
                className={cn("h-px w-6 sm:w-10", states[i - 1] === "completed" ? "bg-primary" : "bg-divider-strong")}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                state === "completed" && "border-primary bg-primary text-primary-foreground",
                state === "active" && "border-2 border-primary bg-progress",
                state === "locked" && "border-divider-strong bg-card text-muted-foreground",
              )}
            >
              {state === "completed" ? <Check strokeWidth={2} className="size-3.5" /> : null}
              {state === "locked" ? <Lock strokeWidth={1.75} className="size-3" /> : null}
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
