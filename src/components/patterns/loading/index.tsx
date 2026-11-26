// Source: UX-026, UX-D-15 (owner, UX-P-02: loading blocks for each screen kind, with a loading animation),
// DESIGN.md §6.1, Task R2.5.
// Blocks of the content's shape while a region loads. The region is aria-busy and has a hidden text.
// Effect: "pulse" (option A, recommended: calm, 1.6 s) or "shimmer" (option B). With reduced motion, the blocks
// stand still. Each screen composes its own loading.tsx from these shapes (R3 to R7, see IMPLEMENTATION_PLAN.md).
// R4.4: the task list ("tasks") and the PROCESS steps ("steps") shapes, and the "process" page preset.
// R5.7: the manuscript workspace ("workspace") shape and the "workspace" page preset.
import { cn } from "@/lib/utils";

export type LoadingEffect = "pulse" | "shimmer";
export type LoadingShape = "rows" | "rows-compact" | "kpi" | "cards" | "docket" | "form" | "list" | "inbox" | "tasks" | "steps" | "workspace";

const EFFECT: Record<LoadingEffect, string> = {
  pulse: "bg-muted animate-skeleton",
  shimmer: "animate-shimmer bg-[linear-gradient(90deg,var(--muted)_0%,var(--border)_50%,var(--muted)_100%)] bg-[length:200%_100%]",
};

/** One block. Decorative: hidden from screen readers. */
export function Block({ className, effect = "pulse" }: { className?: string; effect?: LoadingEffect }) {
  return <span data-block aria-hidden="true" className={cn("block rounded-stamp motion-reduce:animate-none", EFFECT[effect], className)} />;
}

function Shape({ shape, rows, effect }: { shape: LoadingShape; rows: number; effect: LoadingEffect }) {
  const b = (className: string) => <Block className={className} effect={effect} />;
  switch (shape) {
    case "rows": // a queue or a table: the row height and the 132 px row action
      return (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-card">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-(--row-h-comfortable) items-center gap-4 px-(--cell-pad-x)">
              {b("h-3 w-1/3")}
              {b("hidden h-3 w-1/5 sm:block")}
              {b("ml-auto h-(--row-action-h) w-(--row-action-w) rounded-control")}
            </div>
          ))}
        </div>
      );
    case "rows-compact": // a compact queue table (R3.8): 48 px rows, the header row
      return (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-card">
          <div className="flex h-10 items-center gap-4 bg-muted px-(--cell-pad-x)">{b("h-2.5 w-24")}</div>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-(--row-h-compact) items-center gap-4 px-(--cell-pad-x)">
              {b("h-3 w-1/4")}
              {b("hidden h-3 w-1/3 sm:block")}
              {b("hidden h-3 w-12 sm:block")}
              {b("ml-auto h-(--row-action-h) w-(--row-action-w) rounded-control")}
            </div>
          ))}
        </div>
      );
    case "kpi": // the C1 KPI strip (R3.8): six cells of the strip height
      return (
        <div className="grid grid-cols-2 overflow-hidden rounded-card border border-border bg-card sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="-mt-px -ml-px flex h-[104px] flex-col justify-between border-t border-l border-border px-4 pt-3.5 pb-3">
              {b("h-8 w-12")}
              {b("h-3 w-2/3")}
            </div>
          ))}
        </div>
      );
    case "inbox": // C4 and C5 (R3.8): list, viewer, record, the same grid as the inbox pattern
      return (
        <div className="grid min-h-[540px] overflow-hidden rounded-card border border-border bg-card sm:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_300px]">
          <div className="flex flex-col divide-y divide-border border-border sm:border-r">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex flex-col gap-2 px-4 py-3.5">
                {b("h-3 w-2/3")}
                {b("h-3 w-1/2")}
              </div>
            ))}
          </div>
          <div className="hidden items-start justify-center bg-muted p-6 sm:flex">{b("h-[420px] w-full max-w-[360px] rounded-control")}</div>
          <div className="hidden flex-col gap-3 border-l border-border p-4 lg:flex">
            {b("h-5 w-24")}
            {b("h-4 w-3/4")}
            {b("h-1 w-full")}
            {b("h-9 w-full rounded-control")}
            {b("h-9 w-full rounded-control")}
          </div>
        </div>
      );
    case "tasks": // the task list (R4.4): a group label, then rows with a stamp, a label and the action on the right
      return (
        <div className="flex flex-col gap-3">
          {b("h-5 w-40")}
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex min-h-(--row-h-comfortable) items-center gap-3 py-4">
                {b("h-6 w-28")}
                {b("h-4 w-1/3")}
                {b("ml-auto hidden h-8 w-32 rounded-control sm:block")}
              </div>
            ))}
          </div>
        </div>
      );
    case "workspace": // the S2, A2, P2 workspace (R5.7): the box, then the viewer block and the feed lines, split at laptop
      return (
        <div className="flex flex-col gap-6">
          <div data-part="box" className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            {b("h-4 w-2/3 max-w-md")}
            {b("h-9 w-36 rounded-control")}
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
            <div data-part="viewer" className="flex flex-col gap-3">
              {b("h-11 w-full max-w-sm rounded-control")}
              {b("aspect-[1/1.294] w-full max-w-[640px] rounded-control")}
            </div>
            <div data-part="feed" className="hidden flex-col gap-4 lg:flex">
              {b("h-9 w-56 rounded-control")}
              {Array.from({ length: Math.max(rows, 3) }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {b("h-3 w-1/3")}
                  {b("h-3 w-full")}
                  {b("h-3 w-2/3")}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "steps": // the PROCESS step-by-step (R4.4): numbered marks on a line, the current step open with its list
      return (
        <div className="flex flex-col gap-6">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
              {b("size-8 rounded-full")}
              <div className="flex flex-col gap-3 pt-1.5">
                {b("h-5 w-32")}
                {i === 0 ? (
                  <>
                    {b("h-3 w-3/4")}
                    {b("h-3 w-2/3")}
                    {b("h-3 w-1/2")}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      );
    case "cards": // a KPI strip or up to 3 cards (G5)
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: Math.min(rows, 3) }, (_, i) => (
            <div key={i} className="flex h-28 flex-col justify-between rounded-card border border-border bg-card p-4">
              {b("h-3 w-1/2")}
              {b("h-8 w-2/3 max-w-16")}
            </div>
          ))}
        </div>
      );
    case "docket": // identity line, then the Docket: where am I, what blocks me, the one action
      return (
        <div className="flex flex-col gap-3">
          {b("h-6 w-2/3 max-w-md")}
          <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-5">
            {b("h-3 w-40")}
            {b("h-4 w-3/4")}
            {b("ml-auto h-10 w-40 rounded-control")}
          </div>
        </div>
      );
    case "form": // labels above fields, then the button
      return (
        <div className="flex max-w-[640px] flex-col gap-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              {b("h-3 w-24")}
              {b("h-11 w-full rounded-control")}
            </div>
          ))}
          {b("h-10 w-32 rounded-control")}
        </div>
      );
    case "list": // notifications, threads, documents: two lines each
      return (
        <ul className="flex flex-col divide-y divide-border">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="flex flex-col gap-2 py-3">
              {b("h-3 w-3/4")}
              {b("h-3 w-1/2")}
            </li>
          ))}
        </ul>
      );
  }
}

export type LoadingBlocksProps = {
  /** Rows, fields or list items. */
  rows?: number;
  /** Hidden text, for example "Loading the review queue". Empty inside a page preset (the page has one). */
  label?: string;
  shape?: LoadingShape;
  effect?: LoadingEffect;
  className?: string;
};

export function LoadingBlocks({ rows = 4, label = "Loading", shape = "rows", effect = "pulse", className }: LoadingBlocksProps) {
  return (
    <div aria-busy="true" data-shape={shape} className={cn("flex flex-col", className)}>
      {label ? <span className="sr-only">{label}</span> : null}
      <Shape shape={shape} rows={rows} effect={effect} />
    </div>
  );
}

export type PageKind = "dashboard" | "queue" | "record" | "form" | "overview" | "inbox" | "process" | "workspace";

/** The fallback of a `loading.tsx`, by screen kind. One busy region with one hidden text. */
export function PageLoadingBlocks({ kind = "queue", label = "Loading the page", effect = "pulse" }: { kind?: PageKind; label?: string; effect?: LoadingEffect }) {
  const parts: Record<PageKind, { shape: LoadingShape; rows: number }[]> = {
    dashboard: [{ shape: "cards", rows: 3 }, { shape: "rows", rows: 4 }],
    queue: [{ shape: "rows", rows: 6 }],
    record: [{ shape: "docket", rows: 1 }, { shape: "list", rows: 3 }],
    form: [{ shape: "form", rows: 3 }],
    overview: [{ shape: "kpi", rows: 1 }, { shape: "rows-compact", rows: 6 }],
    inbox: [{ shape: "inbox", rows: 5 }],
    process: [{ shape: "steps", rows: 4 }],
    workspace: [{ shape: "workspace", rows: 3 }],
  };
  return (
    <div aria-busy="true" data-page={kind} className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      <Block className="h-8 w-64 max-w-full rounded-control" effect={effect} />
      {parts[kind].map((p, i) => (
        <div key={i} data-shape={p.shape}>
          <Shape shape={p.shape} rows={p.rows} effect={effect} />
        </div>
      ))}
    </div>
  );
}

/** An inline wait (a pending button). The text next to it carries the meaning; with reduced motion it stands still. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" className={cn("animate-spin motion-reduce:animate-none", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
