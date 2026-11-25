import { Lock, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A flag (BR-17, DESIGN.md §7.5). It warns and never blocks: put it above the
 * action it concerns, and keep that action enabled. Examples: the residency
 * warning, the Action Taken mismatch, a printed-copy mismatch.
 */
export function FlagBanner({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="flag-banner"
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-control border border-tone-pending-line bg-tone-pending-bg px-3 py-2 text-sm text-tone-pending-fg",
        className,
      )}
    >
      <TriangleAlert aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/**
 * The locked banner across a locked region, for example the manuscript viewer
 * after Gate 1b (BR-07, DESIGN.md §7.6). The text says when it locked and what unlocks it.
 */
export function LockedBanner({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="locked-banner"
      role="status"
      className={cn(
        "flex items-start gap-2 border-y border-tone-locked-line bg-tone-locked-bg px-3 py-2 text-sm text-tone-locked-fg",
        className,
      )}
    >
      <Lock aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
