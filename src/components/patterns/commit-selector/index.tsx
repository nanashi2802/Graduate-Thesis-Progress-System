"use client";
// Source: Primer commit list (DESIGN.md §8.7, §7.4 `commit-selector`), design/screens/S2.md, FR-REV-01, BR-19, Task R5.3.
// Screens: S2, A2, P2, SV. A list of links that sets `?commit=` (the page reads it today), newest first. Each row:
// `v3` in mono, the short hash in muted mono, the date in PHT, the uploader, and the `active` "Ready" pill on the
// commit marked Ready. No edit or delete control: a commit never changes (BR-19).
// The 3 newest commits show. Older ones sit behind a disclosure button with `aria-expanded` and the count, the same
// look as the task-list groups (R4-a B). The group opens when the selected commit is in it.
import { useId, useState } from "react";
import { StatusPill } from "@/components/patterns/status";
import { cn } from "@/lib/utils";

export type CommitEntry = {
  id: string;
  ordinal: number;
  sha256: string;
  uploadedAt: Date;
  /** "You" on S2; the Student's role word on the other screens until the name is in the data. */
  uploader: string;
  changeNote?: string | null;
};

export type CommitSelectorProps = {
  commits: CommitEntry[];
  selectedId: string | null;
  /** The commit marked Ready (`pr.readyCommitId`). */
  readyId?: string | null;
  /** How many of the newest commits show before the disclosure button. */
  visible?: number;
  /** The link of a commit. Default `?commit=3` (the page reads it). /lab keeps its own query with this. */
  hrefFor?: (ordinal: number) => string;
  className?: string;
};

export const shortHash = (sha: string) => sha.slice(0, 7);

const pht = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

function Row({ c, selected, ready, href }: { c: CommitEntry; selected: boolean; ready: boolean; href: string }) {
  return (
    <li data-slot="commit-row">
      <a
        href={href}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "grid min-h-11 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-control border-l-[3px] border-l-transparent px-3 py-2 text-sm hover:bg-muted aria-[current=true]:border-l-primary aria-[current=true]:bg-muted",
          FOCUS,
        )}
      >
        <span className="font-mono text-sm font-semibold text-foreground">v{c.ordinal}</span>
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-mono text-[0.8rem] text-muted-foreground">{shortHash(c.sha256)}</span>
          <time dateTime={c.uploadedAt.toISOString()} className="text-muted-foreground">
            {pht(c.uploadedAt)} PHT
          </time>
          <span className="text-muted-foreground">{c.uploader}</span>
        </span>
        <span className="justify-self-end">{ready ? <StatusPill tone="active" label="Ready" /> : null}</span>
        {c.changeNote ? <span className="col-start-2 col-end-4 truncate text-[0.8rem] text-muted-foreground">{c.changeNote}</span> : null}
      </a>
    </li>
  );
}

export function CommitSelector({ commits, selectedId, readyId = null, visible = 3, hrefFor = (n) => `?commit=${n}`, className }: CommitSelectorProps) {
  const olderId = useId();
  const newestFirst = [...commits].sort((a, b) => b.ordinal - a.ordinal);
  const shown = newestFirst.slice(0, visible);
  const older = newestFirst.slice(visible);
  const [open, setOpen] = useState(older.some((c) => c.id === selectedId));
  const row = (c: CommitEntry) => <Row key={c.id} c={c} selected={c.id === selectedId} ready={c.id === readyId} href={hrefFor(c.ordinal)} />;
  return (
    <nav aria-label="Commits" data-slot="commit-selector" className={cn("flex flex-col gap-1", className)}>
      <ol className="flex flex-col gap-0.5">{shown.map(row)}</ol>
      {older.length > 0 ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={olderId}
            onClick={() => setOpen((v) => !v)}
            className={cn("inline-flex min-h-11 items-center gap-2 self-start rounded-control px-3 text-sm font-medium text-link hover:underline", FOCUS)}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cn("shrink-0 transition-transform duration-(--motion-state) motion-reduce:transition-none", !open && "-rotate-90")}>
              <path d="M4 6l4 4 4-4" />
            </svg>
            {`${open ? "Hide" : "Show"} ${older.length} older commit${older.length === 1 ? "" : "s"}`}
          </button>
          <ol id={olderId} hidden={!open || undefined} className="flex flex-col gap-0.5">
            {older.map(row)}
          </ol>
        </>
      ) : null}
    </nav>
  );
}
