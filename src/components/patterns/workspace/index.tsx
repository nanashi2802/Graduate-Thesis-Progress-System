"use client";
// Source: Primer pull request (DESIGN.md §5.6, §7.4 `workspace`), design/screens/S2.md, A2.md, P2.md, Task R5.6.
// The manuscript workspace of S2, A2 and P2: the header (identity line), the box (merge box on S2, gate box on A2 and
// P2), the commit selector, then the viewer and the thread feed. At laptop (1024 px and up) the viewer and the feed
// split, with the feed at 400 px. Below 1024 px, a tab list "Manuscript" and "Threads" with the count (R5-a A), so
// nothing covers the PDF.
// S2 upload (R5-b A, adapted by the owner at UX-P-05: "I don't like sticky components"): a plain region at the foot of
// the Manuscript column, after the viewer. Nothing in the workspace is sticky or fixed.
// The parts are slots (ReactNode), so a server page can render each part and pass it in.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { nextTab } from "@/lib/tabs";
import { cn } from "@/lib/utils";

export type WorkspaceProps = {
  header: ReactNode;
  box: ReactNode;
  commits?: ReactNode;
  viewer: ReactNode;
  feed: ReactNode;
  /** The count on the Threads tab: the open threads. */
  threadCount: number;
  /** S2 only: the upload of a new version, at the foot of the Manuscript column. */
  upload?: ReactNode;
  /** The tab that starts selected below 1024 px. */
  defaultTab?: "manuscript" | "threads";
  className?: string;
};

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

const TABS = [
  { id: "manuscript" as const, label: "Manuscript" },
  { id: "threads" as const, label: "Threads" },
];

export function Workspace({ header, box, commits, viewer, feed, threadCount, upload, defaultTab = "manuscript", className }: WorkspaceProps) {
  const base = useId();
  const [tab, setTab] = useState<"manuscript" | "threads">(defaultTab);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = nextTab(e.key, i, TABS.length);
    if (n === null) return;
    e.preventDefault();
    setTab(TABS[n]!.id);
    refs.current[n]?.focus();
  };
  return (
    <div data-slot="workspace" className={cn("flex min-w-0 flex-col gap-6", className)}>
      <header className="flex min-w-0 flex-col gap-2">{header}</header>
      {box}
      <div role="tablist" aria-label="Workspace" className="flex gap-1 border-b border-border lg:hidden">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${base}-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground aria-selected:border-primary aria-selected:text-foreground",
              FOCUS,
            )}
          >
            {t.label}
            {t.id === "threads" ? <span className="font-mono text-[0.8rem] text-muted-foreground tabular-nums">{threadCount}</span> : null}
          </button>
        ))}
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <section
          aria-label="Manuscript"
          id={`${base}-manuscript`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-manuscript`}
          className={cn("flex min-w-0 flex-col gap-4", tab !== "manuscript" && "max-lg:hidden")}
        >
          {commits}
          {viewer}
          {upload ? (
            <div data-slot="upload-region" className="flex flex-col gap-3 border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground">Upload a new version</h2>
              {upload}
            </div>
          ) : null}
        </section>
        <section
          aria-label="Threads"
          id={`${base}-threads`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-threads`}
          className={cn("flex min-w-0 flex-col gap-4", tab !== "threads" && "max-lg:hidden")}
        >
          <h2 className="text-lg font-semibold text-foreground max-lg:sr-only">Threads</h2>
          {feed}
        </section>
      </div>
    </div>
  );
}
