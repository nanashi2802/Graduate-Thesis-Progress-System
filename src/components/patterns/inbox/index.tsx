// Source: Linear triage, Primer file view (DESIGN.md §7.4 inbox), design/screens/C4.md, C5.md, UX-034, Task R3.3.
// Three regions: the list (300 px), the viewer (flexible), the record (300 px) at laptop. From 640 px to 1023 px the
// record moves under the viewer; on a phone the regions stack. The list holds one link for each item, oldest first.
// The record: the stamp and the name, the Student and the milestone, a 2-step state bar, the actions, a result slot
// and the file details (always shown). The page owns the actions (Verify in a ConfirmDialog, Return in the composer).
import Link from "next/link";
import type { ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { DocumentStamp, type DocumentState } from "@/components/patterns/status";
import { cn } from "@/lib/utils";

export function Inbox({ label, list, viewer, record }: { label: string; list: ReactNode; viewer: ReactNode; record: ReactNode }) {
  return (
    <section
      aria-label={label}
      data-slot="inbox"
      className={cn(
        "grid min-h-[540px] overflow-hidden rounded-card border border-border bg-card",
        "[grid-template-areas:'list'_'viewer'_'record'] sm:grid-cols-[260px_minmax(0,1fr)] sm:[grid-template-areas:'list_viewer'_'list_record']",
        "lg:grid-cols-[300px_minmax(0,1fr)_300px] lg:[grid-template-areas:'list_viewer_record']",
      )}
    >
      <div data-region="list" className="min-w-0 border-b border-border [grid-area:list] sm:row-span-2 sm:border-r sm:border-b-0 lg:row-span-1">
        {list}
      </div>
      <div data-region="viewer" className="min-w-0 bg-muted [grid-area:viewer]">
        {viewer}
      </div>
      <div data-region="record" className="min-w-0 border-t border-border [grid-area:record] lg:border-t-0 lg:border-l">
        {record}
      </div>
    </section>
  );
}

export type InboxItem = {
  id: string;
  href: string;
  student: string;
  ageDays: number;
  late: boolean;
  form: string;
  state: DocumentState;
  milestone: string;
};

export function InboxList({ label, items, selectedId, empty }: { label: string; items: readonly InboxItem[]; selectedId?: string; empty: ReactNode }) {
  if (items.length === 0) return <div className="p-4 text-sm text-muted-foreground">{empty}</div>;
  const sorted = [...items].sort((a, b) => b.ageDays - a.ageDays);
  return (
    <ul aria-label={label} className="flex flex-col">
      {sorted.map((i) => {
        const on = i.id === selectedId;
        return (
          <li key={i.id} className="border-b border-border">
            <Link
              href={i.href as never}
              aria-current={on ? "true" : undefined}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] gap-y-1.5 px-4 py-3.5 outline-none transition-colors duration-(--motion-state) hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                on && "bg-accent shadow-[inset_3px_0_0_var(--primary)] hover:bg-accent",
              )}
            >
              <span className="truncate text-sm font-medium text-foreground">{i.student}</span>
              <span className={cn("inline-flex items-center gap-0.5 self-center font-mono text-[0.8rem] font-medium", i.late ? "text-tone-pending-fg" : "text-text-secondary")}>
                {i.late ? <Glyph name="pending" size={16} /> : null}
                {i.ageDays}d<span className="sr-only">{i.late ? " waiting, late" : " waiting"}</span>
              </span>
              <span className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-muted-foreground">
                <DocumentStamp form={i.form} state={i.state} className="text-[0.8rem]" />
                <span className="truncate">{i.milestone}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export type StateStep = { label: string; state: "done" | "current" | "returned" | "todo" };

const STEP_BAR: Record<StateStep["state"], string> = {
  done: "bg-tone-done-fg",
  current: "bg-tone-active-fg",
  returned: "bg-tone-returned-fg",
  todo: "bg-border",
};
const STEP_WORD: Record<StateStep["state"], string> = { done: "done", current: "now", returned: "returned", todo: "not yet" };

/** The 2-step state bar of the record ("Scan uploaded", then "Verified" or "Returned"). Each step has a text label. */
export function StateBar({ steps }: { steps: readonly StateStep[] }) {
  return (
    <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s) => (
        <li key={s.label} className="flex flex-col gap-1.5">
          <span aria-hidden="true" className={cn("h-1 rounded-full", STEP_BAR[s.state])} />
          <span className={cn("text-[0.8rem] leading-4", s.state === "todo" ? "text-muted-foreground" : "font-medium text-foreground")}>
            {s.label}
            <span className="sr-only">, {STEP_WORD[s.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export type FileDetails = { uploadedAt: Date; by: string; sha256: string };

const pht = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) + " PHT";

export function InboxRecord({
  form,
  state,
  name,
  student,
  milestone,
  steps,
  actions,
  result,
  details,
}: {
  form: string;
  state: DocumentState;
  name: string;
  student: string;
  milestone: string;
  steps: readonly StateStep[];
  /** Verify (maroon) and Return, full width; or the Return composer while the Coordinator writes a reason. */
  actions?: ReactNode;
  /** The on-screen result after Verify or Return (UX-D-04). */
  result?: ReactNode;
  details: FileDetails;
}) {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-1.5">
        <DocumentStamp form={form} state={state} />
        <h3 className="text-[0.9375rem] leading-6 font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {student} · {milestone}
        </p>
      </div>
      <StateBar steps={steps} />
      {result ? <div>{result}</div> : null}
      {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-border pt-4 text-[0.8rem]">
        <dt className="text-muted-foreground">Uploaded</dt>
        <dd>
          <time dateTime={details.uploadedAt.toISOString()} className="font-mono">
            {pht(details.uploadedAt)}
          </time>
        </dd>
        <dt className="text-muted-foreground">By</dt>
        <dd className="truncate">{details.by}</dd>
        <dt className="text-muted-foreground">SHA-256</dt>
        <dd className="font-mono break-all text-muted-foreground">{details.sha256}</dd>
      </dl>
    </div>
  );
}
