// Source: Linear, own; design/screens/C1.md region 1, design/mockups/coordinator-mockups.html v5 (.kpis), UX-033, Task R3.2.
// Six cells on C1. Each cell is a link that filters the queue: the count (36 px mono), the oldest age beside it
// ("6d"), the 30 px glyph in the top-right corner, the label below. The selected cell has aria-current.
// A count of 0 is muted and shows no age. Late (decision R3-a): the pending tone and the pending glyph, so color is
// not the only cue. Fixed cell height (UX-D-16): a 3-digit count does not move the strip.
import Link from "next/link";
import { Glyph, type GlyphName } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

export type KpiItem = {
  label: string;
  count: number;
  /** Days the oldest item waits. `null` when the queue is empty. */
  oldestDays: number | null;
  late: boolean;
  glyph: GlyphName;
  href: string;
  selected?: boolean;
};

const name = (i: KpiItem) =>
  i.count === 0 || i.oldestDays === null
    ? `${i.label}: ${i.count} waiting`
    : `${i.label}: ${i.count} waiting, oldest ${i.oldestDays} ${i.oldestDays === 1 ? "day" : "days"}${i.late ? ", late" : ""}`;

export function KpiStrip({ items, label = "Queues" }: { items: readonly KpiItem[]; label?: string }) {
  return (
    <nav aria-label={label} data-slot="kpi-strip">
      <ul className="grid grid-cols-2 overflow-hidden rounded-card border border-border bg-card sm:grid-cols-3 lg:grid-cols-6">
        {items.map((i) => {
          const zero = i.count === 0;
          return (
            <li key={i.label} className="-mt-px -ml-px border-t border-l border-border">
              <Link
                href={i.href as never}
                aria-label={name(i)}
                aria-current={i.selected ? "true" : undefined}
                data-zero={zero || undefined}
                className={cn(
                  "grid h-[104px] grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr] gap-x-2 gap-y-2 px-4 pt-3.5 pb-3 outline-none transition-colors duration-(--motion-state) hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                  i.selected && "bg-accent shadow-[inset_0_-2px_0_var(--primary)] hover:bg-accent",
                )}
              >
                <span className="flex min-w-0 items-baseline gap-2 overflow-hidden">
                  <span
                    className={cn(
                      "font-mono text-(length:--kpi-num-size) leading-none tracking-tight tabular-nums",
                      zero ? "font-medium text-muted-foreground" : "font-semibold text-foreground",
                    )}
                  >
                    {i.count}
                  </span>
                  {!zero && i.oldestDays !== null ? (
                    <span
                      data-late={i.late || undefined}
                      className={cn("inline-flex items-center gap-0.5 font-mono text-[0.8rem] font-medium whitespace-nowrap", i.late ? "text-tone-pending-fg" : "text-muted-foreground")}
                    >
                      {i.late ? <Glyph name="pending" size={16} /> : null}
                      {i.oldestDays}d
                    </span>
                  ) : null}
                </span>
                <span className={cn("size-(--kpi-glyph-size) [&>svg]:size-full", i.selected ? "text-primary" : "text-muted-foreground")}>
                  <Glyph name={i.glyph} size={30} />
                </span>
                <span className={cn("col-span-2 self-end truncate text-[0.8125rem] leading-5", i.selected ? "font-semibold text-foreground" : "text-text-secondary")}>
                  {i.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
