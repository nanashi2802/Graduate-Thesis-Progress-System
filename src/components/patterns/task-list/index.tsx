"use client";
// Source: GOV.UK task list (DESIGN.md §7.4 `task-list`, §8.1, §8.4), UX-D-16, BR-17, BR-18, Task R4.1.
// Screens: S1 (this milestone), S3 (documents), S6 and C7 (clearance items).
// A group is a heading and a list. Each item: at most one stamp (a document stamp, an outside chip or a status pill,
// so the type allows one only), a label, one reason under the label, and the actions on the right.
// A collapsed group (decision R4-a): B a disclosure button with aria-expanded, the same look as the queue-table
// groups (default); A a native <details>. The count stays when the group is closed.
// A reason is a fixed slot (UX-D-16): two lines on the screen, the full text in the DOM, "Show more" for the rest.
// A returned reason is the Coordinator's text, word for word. A flag (BR-17) is never a reason here: it never blocks.
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { DocumentStamp, OutsideChip, StatusPill, type DocumentState, type OutsideKind, type OutsideValue, type Tone } from "@/components/patterns/status";
import { cn } from "@/lib/utils";

/** One stamp for each item, at most (the GOV.UK status tag). */
export type TaskStamp =
  | { kind: "document"; form: string; state: DocumentState }
  | { kind: "outside"; outside: OutsideKind; value: OutsideValue }
  | { kind: "status"; tone: Tone; label: string };

export type TaskReason = {
  text: string;
  /** returned: the Coordinator's reason, word for word. blocks: why the item stops the step. note: a plain fact. */
  kind: "returned" | "blocks" | "note";
};

export type TaskItem = {
  id: string;
  stamp?: TaskStamp;
  label: ReactNode;
  reason?: TaskReason;
  /** The item's actions: a `BlockedAction`, an uploader, a "Download form" link. One maroon button for each region (G1). */
  actions?: ReactNode;
};

export type TaskGroup = {
  label: string;
  /** The group can close and starts closed ("Advising forms · optional", "Completed milestones"). */
  collapsed?: boolean;
  /** One helper line for the region (DESIGN.md §2.1, comfortable screens only). */
  hint?: string;
  items: TaskItem[];
  /** Shown when the group has no items. */
  empty?: ReactNode;
};

export type TaskListProps = {
  groups: TaskGroup[];
  /** R4-a: "button" (B, default) or "details" (A). */
  disclosure?: "button" | "details";
  /** The heading level of the group labels. */
  headingLevel?: 2 | 3;
  className?: string;
};

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

function Stamp({ stamp }: { stamp: TaskStamp }) {
  if (stamp.kind === "document") return <DocumentStamp form={stamp.form} state={stamp.state} />;
  if (stamp.kind === "outside") return <OutsideChip kind={stamp.outside} value={stamp.value} />;
  return <StatusPill tone={stamp.tone} label={stamp.label} />;
}

const REASON_LOOK: Record<TaskReason["kind"], { glyph: "return" | "lock" | null; className: string; prefix?: string }> = {
  returned: { glyph: "return", className: "text-tone-returned-fg", prefix: "Returned: " },
  blocks: { glyph: "lock", className: "text-foreground" },
  note: { glyph: null, className: "text-muted-foreground" },
};

/** Two lines on the screen, the full text in the DOM (UX-D-16). "Show more" opens it over the next content. */
function Reason({ reason }: { reason: TaskReason }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.scrollHeight > el.clientHeight + 1) setOverflow(true);
  }, []);
  const look = REASON_LOOK[reason.kind];
  return (
    <div className="relative h-10">
      <div className={cn(open && "absolute inset-x-0 top-0 z-10 rounded-control bg-card p-1 -m-1 shadow-[var(--shadow-popover)]")}>
        <p data-reason={reason.kind} className={cn("flex items-start gap-1.5 text-sm leading-5", look.className)}>
          {look.glyph ? <Glyph name={look.glyph} size={16} className="mt-0.5 shrink-0" /> : null}
          <span ref={ref} id={id} className={cn("min-w-0", !open && (overflow ? "line-clamp-1" : "line-clamp-2"))}>
            {look.prefix ? <span className="font-medium">{look.prefix}</span> : null}
            {reason.text}
          </span>
        </p>
        {overflow ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((v) => !v)}
            className={cn("ml-5.5 text-[0.8rem] leading-5 font-medium text-link underline-offset-4 hover:underline", FOCUS)}
          >
            {open ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Item({ item }: { item: TaskItem }) {
  return (
    <li data-slot="task-item" className="flex min-h-(--row-h-comfortable) flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {item.stamp ? <Stamp stamp={item.stamp} /> : null}
          <span className="text-base font-medium text-foreground">{item.label}</span>
        </div>
        {item.reason ? <Reason reason={item.reason} /> : null}
      </div>
      {item.actions ? <div className="flex shrink-0 flex-wrap items-start gap-3 sm:justify-end">{item.actions}</div> : null}
    </li>
  );
}

function Items({ group, id, hidden }: { group: TaskGroup; id?: string; hidden?: boolean }) {
  if (group.items.length === 0) {
    return (
      <div id={id} hidden={hidden || undefined}>
        {group.empty}
      </div>
    );
  }
  return (
    <ul id={id} hidden={hidden || undefined} className="flex flex-col divide-y divide-border border-y border-border">
      {group.items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </ul>
  );
}

const Count = ({ n }: { n: number }) => <span className="font-mono text-sm font-medium text-muted-foreground tabular-nums">{n}</span>;

const Chevron = ({ closed }: { closed: boolean }) => (
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
    className={cn("shrink-0 transition-transform duration-(--motion-state) motion-reduce:transition-none", closed && "-rotate-90")}
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

function ButtonGroup({ group, Heading }: { group: TaskGroup; Heading: "h2" | "h3" }) {
  const listId = useId();
  const [closed, setClosed] = useState(!!group.collapsed);
  const collapsible = group.collapsed !== undefined;
  return (
    <section data-slot="task-group" data-collapsed={(collapsible && closed) || undefined} className="flex flex-col gap-3">
      <Heading className="text-lg font-semibold text-foreground">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={!closed}
            aria-controls={listId}
            onClick={() => setClosed((v) => !v)}
            className={cn("-mx-1 inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-left hover:text-foreground", FOCUS)}
          >
            <Chevron closed={closed} />
            {group.label}
            <Count n={group.items.length} />
          </button>
        ) : (
          <span className="inline-flex items-center gap-2">
            {group.label}
            <Count n={group.items.length} />
          </span>
        )}
      </Heading>
      {group.hint && !(collapsible && closed) ? <p className="max-w-[72ch] text-sm text-muted-foreground">{group.hint}</p> : null}
      <Items group={group} id={listId} hidden={collapsible && closed} />
    </section>
  );
}

function DetailsGroup({ group }: { group: TaskGroup }) {
  return (
    <details data-slot="task-group" open={!group.collapsed} className="group/details flex flex-col gap-3">
      <summary className={cn("flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control text-lg font-semibold text-foreground [&::-webkit-details-marker]:hidden", FOCUS)}>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 -rotate-90 transition-transform duration-(--motion-state) group-open/details:rotate-0 motion-reduce:transition-none">
          <path d="M4 6l4 4 4-4" />
        </svg>
        {group.label}
        <Count n={group.items.length} />
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {group.hint ? <p className="max-w-[72ch] text-sm text-muted-foreground">{group.hint}</p> : null}
        <Items group={group} />
      </div>
    </details>
  );
}

export function TaskList({ groups, disclosure = "button", headingLevel = 2, className }: TaskListProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div data-slot="task-list" className={cn("flex flex-col gap-8", className)}>
      {groups.map((g) =>
        disclosure === "details" && g.collapsed !== undefined ? <DetailsGroup key={g.label} group={g} /> : <ButtonGroup key={g.label} group={g} Heading={Heading} />,
      )}
    </div>
  );
}
