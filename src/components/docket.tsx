import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const NOTHING_BLOCKS = "Nothing blocks this step.";

/**
 * The Docket (DESIGN.md §5.2, P1): the first region and the only card of a record
 * screen. Row 1: where am I. Row 2: what blocks me. Row 3: what can I do now.
 * Put one primary action in `actions`, with secondary text buttons to its left.
 */
export function Docket({
  where,
  blocker,
  flag,
  actions,
  label = "Current step",
  className,
}: {
  /** Row 1: the stepper and the status pill. */
  where: ReactNode;
  /** Row 2: one sentence from UTP 3.6. Leave it out when nothing blocks. */
  blocker?: string;
  /** A flag banner (BR-17). It sits above the actions and never disables them. */
  flag?: ReactNode;
  /** Row 3: the actions. */
  actions?: ReactNode;
  label?: string;
  className?: string;
}) {
  const blocked = blocker !== undefined && blocker.trim() !== "";
  return (
    <section
      data-slot="docket"
      aria-label={label}
      className={cn("flex flex-col gap-4 rounded-card border border-border bg-card p-6", className)}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{where}</div>
      <p data-slot="docket-blocker" className={cn("text-base", blocked ? "text-foreground" : "text-muted-foreground")}>
        {blocked ? (
          <>
            <span className="font-semibold">Blocks: </span>
            {blocker}
          </>
        ) : (
          NOTHING_BLOCKS
        )}
      </p>
      {flag}
      {actions ? <div className="flex flex-wrap items-start justify-end gap-3">{actions}</div> : null}
    </section>
  );
}
