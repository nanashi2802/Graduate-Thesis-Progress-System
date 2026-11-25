// Source: own (BR-17, DESIGN.md §8.5). A flag warns and never blocks, and never looks like a block (F2).
// It sits near the record it concerns. The action next to it stays enabled.
// Compact (Coordinator rows): a glyph in the row. The text shows on hover and focus, and a screen reader reads it.
import type { ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

export type FlagProps = { children: ReactNode; compact?: boolean; className?: string };

export function Flag({ children, compact = false, className }: FlagProps) {
  if (compact) {
    return (
      <span
        data-slot="flag"
        role="note"
        tabIndex={0}
        className={cn(
          "group relative inline-flex size-6 items-center justify-center rounded-control text-tone-pending-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
          className,
        )}
      >
        <Glyph name="flag" size={16} />
        <span className="sr-only">{children}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-full left-0 z-20 mt-1 hidden w-max max-w-64 rounded-control border border-tone-pending-line bg-popover px-2 py-1 text-[0.8rem] text-popover-foreground shadow-popover group-hover:block group-focus-visible:block"
        >
          {children}
        </span>
      </span>
    );
  }
  return (
    <div
      data-slot="flag"
      role="note"
      className={cn("flex w-fit items-start gap-2 text-sm text-tone-pending-fg", className)}
    >
      <Glyph name="flag" size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
