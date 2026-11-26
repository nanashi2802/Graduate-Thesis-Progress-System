"use client";
// Source: Linear list views, Carbon data table (DESIGN.md §5.4, §5.6, §10 Tables), UX-014, UX-036, UX-D-16, Task R3.1.
// Screens: A1, P1, C1, C2, C3, C8, C9, C10. Real table markup: a caption, `th scope="col"`, sentence-case headers.
// Sort is a prop: the page sorts the rows, the pattern shows `aria-sort` and the header control.
// Densities: compact (Coordinator) 48 px rows and fixed column widths; comfortable 56 px rows.
// Row actions all have one width (`--row-action-w`). A blocked row action shows its reason (BR-18): under the button
// in a comfortable row, in a tooltip linked with aria-describedby in a compact row (decision R3-i, fixed row height).
// Long text (decision R3-c): A one line with the full text in a tooltip and on focus (default); B a two-line clamp.
// Groups: the header can be a disclosure button that hides and shows its rows (owner, UX-P-03); the count stays.
// Phone (decision R3-b): A stacked rows of label and value pairs (default); B a framed region that scrolls.
import { Tooltip } from "@base-ui/react/tooltip";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { Glyph, type GlyphName } from "@/components/patterns/glyphs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QueueColumn<Row> = {
  key: string;
  /** Sentence case (UX-014). */
  label: string;
  /** A fixed width for compact tables, for example "180px". One column without a width takes the rest. */
  width?: string;
  /** The plain text of the cell: the tooltip, the long-text cell and the default render use it. */
  text?: (row: Row) => string;
  render?: (row: Row) => ReactNode;
  sortable?: boolean;
  /** A thesis title or another long text: one line, full text on hover and focus (R3-c). */
  long?: boolean;
  align?: "start" | "end";
  /** Mono text with tabular figures: ages, dates, counts. */
  mono?: boolean;
  /** Hide a minor column below 1024 px (G5), so the fixed columns fit a tablet. */
  hideBelowLaptop?: boolean;
};

export type RowAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Why the action is blocked (BR-18, SITEMAP §9 words). */
  reason?: string;
  /** The single next step of the screen (G1). At most one row in a screen. */
  primary?: boolean;
};

export type SortState = { key: string; dir: "asc" | "desc" };

export type QueueTableProps<Row> = {
  /** The accessible name of the table, shown as a hidden caption. */
  caption: string;
  columns: QueueColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  density: "compact" | "comfortable";
  /** Groups keep the `order` given (the queue order of the screen); rows keep the page sort inside each group. */
  groupBy?: {
    key: (row: Row) => string;
    glyph?: (group: string) => GlyphName;
    order?: readonly string[];
    /**
     * The group header is a disclosure button (owner, UX-P-03): it hides and shows the rows of its group.
     * The label sits in the first column: give that column a width that fits the longest label (chevron, glyph,
     * label and count; about 240 px for the C1 queue names), so no label runs into the next column.
     */
    collapsible?: boolean;
    /** Groups that start closed. */
    defaultCollapsed?: readonly string[];
  };
  action?: (row: Row) => RowAction | null;
  /** The header of the action column. Hidden: the buttons carry the words. */
  actionLabel?: string;
  /** What shows when there are no rows: an EmptyState with the first step. */
  empty: ReactNode;
  sort?: SortState;
  /** The page changes the sort. Without it, a sortable header shows its state only. */
  onSort?: (key: string) => void;
  longText?: "tooltip" | "clamp";
  phone?: "stack" | "scroll";
  actionLook?: "button" | "link";
};

const rank = (order: readonly string[] | undefined, key: string) => {
  const i = order?.indexOf(key) ?? -1;
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

function LongText({ text, mode }: { text: string; mode: "tooltip" | "clamp" }) {
  if (mode === "clamp") return <span className="line-clamp-2 whitespace-normal">{text}</span>;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={300}
        render={<span data-long="true" tabIndex={0} className={cn("block truncate rounded-stamp", FOCUS)} />}
      >
        {text}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" align="start" sideOffset={6} className="z-50">
          <Tooltip.Popup className="max-w-[min(90vw,480px)] rounded-control border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-[var(--shadow-popover)] transition-opacity duration-(--motion-overlay) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            {text}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function ActionCell({ a, look, density }: { a: RowAction; look: "button" | "link"; density: "compact" | "comfortable" }) {
  if (a.reason && density === "compact") return <CompactBlocked a={a} look={look} />;
  if (a.reason) {
    return (
      <BlockedAction size="compact" variant={look === "link" ? "text" : "secondary"} reason={a.reason} wrapperClassName="items-end">
        {a.label}
      </BlockedAction>
    );
  }
  const cls =
    look === "link"
      ? cn(buttonVariants({ variant: "link", size: "sm" }), "h-(--row-action-h) w-(--row-action-w) justify-end px-0")
      : cn(buttonVariants({ variant: a.primary ? "default" : "outline", size: "sm" }), "h-(--row-action-h) w-(--row-action-w) justify-center");
  if (a.href) {
    return (
      <Link href={a.href as never} className={cls}>
        {a.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={a.onClick} className={cls}>
      {a.label}
    </button>
  );
}

/**
 * A blocked row action in a compact row (decision R3-i): the 48 px row keeps its height, so the reason is not under
 * the button. The button shows a lock glyph, stays focusable (aria-disabled), and the reason is linked with
 * aria-describedby and shown in a tooltip on hover and focus (DESIGN.md §8.5 compact rule, BR-18).
 */
function CompactBlocked({ a, look }: { a: RowAction; look: "button" | "link" }) {
  const id = useId();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={0}
        render={
          <button
            type="button"
            aria-disabled="true"
            aria-describedby={id}
            onClick={(e) => e.preventDefault()}
            className={cn(
              buttonVariants({ variant: look === "link" ? "link" : "outline", size: "sm" }),
              "h-(--row-action-h) w-(--row-action-w) cursor-not-allowed justify-center gap-1.5 border-border text-muted-foreground aria-disabled:opacity-100",
            )}
          />
        }
      >
        <Glyph name="lock" size={16} />
        {a.label}
        <span id={id} className="sr-only">
          {a.reason}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" align="end" sideOffset={6} className="z-50">
          <Tooltip.Popup className="max-w-60 rounded-control border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-[var(--shadow-popover)] transition-opacity duration-(--motion-overlay) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            {a.reason}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function QueueTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  density,
  groupBy,
  action,
  actionLabel = "Action",
  empty,
  sort,
  onSort,
  longText = "tooltip",
  phone = "stack",
  actionLook = "button",
}: QueueTableProps<Row>) {
  const tableId = useId();
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set(groupBy?.defaultCollapsed ?? []));
  const toggle = (k: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  if (rows.length === 0) {
    return (
      <div data-slot="queue-table-empty" className="rounded-card border border-border bg-card px-(--cell-pad-x)">
        {empty}
      </div>
    );
  }
  const stack = phone === "stack";
  const rowH = density === "compact" ? "h-(--row-h-compact)" : "h-(--row-h-comfortable)";
  const colCount = columns.length + (action ? 1 : 0);
  // On a phone (R3-b A) each row is a card of label and value pairs; the action comes last.
  const ST = {
    table: stack && "max-sm:block",
    head: stack && "max-sm:sr-only",
    body: stack && "max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:p-3",
    tr: stack && "max-sm:flex max-sm:flex-col max-sm:rounded-card max-sm:border max-sm:border-border max-sm:py-2",
    td: stack &&
      "max-sm:flex max-sm:h-auto max-sm:items-baseline max-sm:gap-3 max-sm:border-b-0 max-sm:py-1.5 max-sm:before:w-28 max-sm:before:shrink-0 max-sm:before:text-[0.8rem] max-sm:before:font-medium max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)]",
  };

  // Compact tables use fixed widths. The table never gets narrower than its fixed columns plus 120 px for the
  // flexible column: below that it scrolls inside its frame, so headers and cells never overlap.
  const px = (w?: string) => (w && /^\d+px$/.test(w) ? parseInt(w, 10) : 0);
  const minWidth =
    density === "compact"
      ? columns.filter((c) => !c.hideBelowLaptop).reduce((n, c) => n + (px(c.width) || 120), 0) + (action ? 132 + 32 : 0)
      : undefined;
  const LAPTOP_ONLY = "max-lg:hidden";

  const groups: { key: string | null; rows: readonly Row[] }[] = groupBy
    ? [...rows.reduce((m, r) => m.set(groupBy.key(r), [...(m.get(groupBy.key(r)) ?? []), r]), new Map<string, Row[]>())]
        .map(([key, rs]) => ({ key, rows: rs }))
        .sort((a, b) => rank(groupBy.order, a.key) - rank(groupBy.order, b.key))
    : [{ key: null, rows }];

  const table = (
    <table
      style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
      className={cn("w-full border-separate border-spacing-0 text-sm", density === "compact" && "table-fixed", ST.table, stack && "max-sm:min-w-0!")}
    >
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        {columns.map((c) => (
          <col key={c.key} className={c.hideBelowLaptop ? LAPTOP_ONLY : undefined} style={c.width ? { width: c.width } : undefined} />
        ))}
        {action ? <col style={{ width: "calc(var(--row-action-w) + 2 * var(--cell-pad-x))" }} /> : null}
      </colgroup>
      <thead className={cn(ST.head)}>
        <tr>
          {columns.map((c) => {
            const active = sort?.key === c.key;
            return (
              <th
                key={c.key}
                scope="col"
                aria-sort={c.sortable ? (active ? ARIA_SORT[sort!.dir] : "none") : undefined}
                className={cn(
                  "h-10 border-b border-divider-strong bg-muted px-(--cell-pad-x) text-left text-[0.8rem] font-semibold whitespace-nowrap text-muted-foreground first:rounded-tl-card last:rounded-tr-card",
                  c.align === "end" && "text-right",
                  c.hideBelowLaptop && LAPTOP_ONLY,
                )}
              >
                {c.sortable && onSort ? (
                  <button type="button" onClick={() => onSort(c.key)} className={cn("inline-flex items-center gap-1 rounded-stamp hover:text-foreground", FOCUS, active && "text-foreground")}>
                    {c.label}
                    <SortMark dir={active ? sort!.dir : null} />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.sortable && active ? <SortMark dir={sort!.dir} /> : null}
                  </span>
                )}
              </th>
            );
          })}
          {action ? (
            <th scope="col" className="h-10 border-b border-divider-strong bg-muted px-(--cell-pad-x) last:rounded-tr-card">
              <span className="sr-only">{actionLabel}</span>
            </th>
          ) : null}
        </tr>
      </thead>
      {groups.map((g, gi) => {
        const isClosed = g.key !== null && !!groupBy?.collapsible && closed.has(g.key);
        const rowId = (i: number) => `${tableId}-g${gi}-r${i}`;
        const label = (
          <>
            {groupBy?.glyph && g.key !== null ? <Glyph name={groupBy.glyph(g.key)} size={16} /> : null}
            {g.key}
            <span className="font-mono font-medium text-muted-foreground tabular-nums">{g.rows.length}</span>
          </>
        );
        return (
        <tbody key={g.key ?? "all"} data-collapsed={isClosed || undefined} className={cn(ST.body)}>
          {g.key !== null ? (
            <tr className={cn(stack && "max-sm:block")}>
              <th
                scope="rowgroup"
                colSpan={colCount}
                className={cn(
                  "h-10 bg-background px-(--cell-pad-x) text-left text-[0.8rem] font-semibold text-text-secondary",
                  isClosed && gi === groups.length - 1 ? "rounded-b-card" : "border-b border-border",
                )}
              >
                {groupBy?.collapsible ? (
                  <button
                    type="button"
                    aria-expanded={!isClosed}
                    aria-controls={g.rows.map((_, i) => rowId(i)).join(" ")}
                    onClick={() => toggle(g.key!)}
                    className={cn("-mx-1 inline-flex h-8 items-center gap-2 rounded-control px-1 hover:text-foreground", FOCUS)}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn("transition-transform duration-(--motion-state) motion-reduce:transition-none", isClosed && "-rotate-90")}
                    >
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                    {label}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2">{label}</span>
                )}
              </th>
            </tr>
          ) : null}
          {g.rows.map((r, ri) => {
            const a = action?.(r) ?? null;
            return (
              <tr key={rowKey(r)} id={groupBy?.collapsible ? rowId(ri) : undefined} hidden={isClosed || undefined} className={cn("group/row", ST.tr)}>
                {columns.map((c) => {
                  const text = c.text?.(r) ?? "";
                  return (
                    <td
                      key={c.key}
                      data-label={c.label}
                      className={cn(
                        rowH,
                        "overflow-hidden border-b border-border px-(--cell-pad-x) align-middle text-foreground transition-colors duration-(--motion-state) group-last/row:border-b-0 group-hover/row:bg-muted motion-reduce:transition-none",
                        c.long ? "max-w-0" : "whitespace-nowrap text-ellipsis",
                        c.mono && "font-mono text-[0.8rem] tabular-nums",
                        c.align === "end" && "text-right",
                        ST.td,
                        c.long && stack && "max-sm:max-w-none",
                        c.hideBelowLaptop && (stack ? "sm:max-lg:hidden" : LAPTOP_ONLY),
                      )}
                    >
                      {c.render ? c.render(r) : c.long ? <LongText text={text} mode={longText} /> : text}
                    </td>
                  );
                })}
                {action ? (
                  <td
                    data-label=""
                    className={cn(
                      rowH,
                      "border-b border-border px-(--cell-pad-x) text-right align-middle group-last/row:border-b-0 group-hover/row:bg-muted",
                      stack && "max-sm:block max-sm:h-auto max-sm:border-b-0 max-sm:pt-2 max-sm:text-left",
                    )}
                  >
                    {a ? <ActionCell a={a} look={actionLook} density={density} /> : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        );
      })}
    </table>
  );

  return (
    <Tooltip.Provider>
      <div
        data-slot="queue-table"
        data-density={density}
        className={cn("rounded-card border border-border bg-card", phone === "scroll" ? "overflow-x-auto" : "max-sm:border-0 max-sm:bg-transparent sm:overflow-x-auto")}
      >
        {phone === "scroll" ? <div className="min-w-[720px]">{table}</div> : table}
      </div>
    </Tooltip.Provider>
  );
}

function SortMark({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={dir ? "" : "opacity-40"}>
      {dir === "asc" ? <path d="M4 10l4-4 4 4" /> : dir === "desc" ? <path d="M4 6l4 4 4-4" /> : <path d="M5 6.5l3-3 3 3M5 9.5l3 3 3-3" />}
    </svg>
  );
}
