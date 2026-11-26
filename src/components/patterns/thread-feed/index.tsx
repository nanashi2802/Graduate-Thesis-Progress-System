"use client";
// Source: Primer review comments (DESIGN.md §8.8, §7.4 `thread-feed`), Notion reading width (UX-D-03),
// FR-REV-04 to FR-REV-08, BR-05, BR-06, D-26, ADR-009, Task R5.4. Screens: S2, A2, P2.
// Tabs Open (first, selected), All and Resolved, each with its count. A thread: the author with the designation, the
// review context, the commit (`v3`), the Outdated tag (BR-06), an optional "p. 14" (R5-d), the body at a 65-character
// measure, "Addressed by v4" (FR-REV-08), the replies, then Reply (everyone except the Coordinator) and Resolve (only
// the author, never the Student: BR-05). The viewer's own open threads have the amber edge: they block the viewer's
// gate. A resolved thread is one line with the `done` glyph; a click opens it.
// "p. 14" is a link to `?commit=3&page=14` (R5-d B, UX-P-05), so Back returns and the link can be shared.
// No pin or highlight on the PDF (ADR-009). Every form is on the form-feedback contract (UX-011, UX-D-16).
import { useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { EmptyState } from "@/components/patterns/empty-state";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { control, FormField } from "@/components/patterns/form-field";
import { Glyph } from "@/components/patterns/glyphs";
import { Button } from "@/components/ui/button";
import { nextTab } from "@/lib/tabs";
import { cn } from "@/lib/utils";

export type FeedReply = { id: string; /** "Student", "Adviser", "Panel Member" (the role word until names are in the data). */ author: string; body: string };

export type FeedThread = {
  id: string;
  commitOrdinal: number;
  /** The author with the designation: "Adviser", "Panel Member · Panel Chair". */
  author: string;
  context: "iteration" | "committee_review" | "defense_day";
  state: "OPEN" | "RESOLVED";
  /** FR-REV-04, D-26: 1 to 9999, or null. */
  page: number | null;
  body: string;
  /** BR-06: an open thread on a commit that is not the newest. */
  outdated: boolean;
  /** FR-REV-08: the commits that say they address this thread. */
  addressedBy: number[];
  replies: FeedReply[];
  /** The viewer wrote this thread. */
  own: boolean;
  /** The viewer may resolve it: the page sets it from `thread.authorUserId === actor.userId` (BR-05). */
  canResolve: boolean;
};

export type FeedTab = "open" | "all" | "resolved";
type Result = Promise<{ error?: string } | void>;

export type ThreadFeedProps = {
  threads: FeedThread[];
  viewerRole: "student" | "adviser" | "panel_member" | "coordinator";
  onReply: (threadId: string, body: string) => Result;
  onResolve: (threadId: string) => Result;
  /** A reviewer posts a new thread on the selected commit. Leave it out for the Student. */
  onPost?: (body: string, page: number | null) => Result;
  /** The commit the new thread goes on. */
  postOrdinal?: number;
  /** Why a new thread cannot be posted now (SITEMAP §9, BR-18). */
  postBlockedReason?: string;
  /** R5-d B: the link of "p. 14". Default `?commit=3&page=14` (the page reads both). /lab keeps its own query. */
  pageHref?: (page: number, commitOrdinal: number) => string;
  defaultTab?: FeedTab;
};

const CONTEXT = { iteration: "Adviser review", committee_review: "Committee review", defense_day: "Defense Day" } as const;
const TABS: { id: FeedTab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "resolved", label: "Resolved" },
];
const EMPTY: Record<FeedTab, { title: string; body: string }> = {
  open: { title: "No open threads.", body: "A reviewer's comment on a commit appears here. The author of a thread resolves it." },
  all: { title: "No threads yet.", body: "A reviewer's comment on a commit appears here. The author of a thread resolves it." },
  resolved: { title: "No resolved threads.", body: "A thread moves here when its author resolves it." },
};

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";
const LINK = cn("font-mono text-[0.8rem] font-medium text-link underline-offset-4 hover:underline", FOCUS);

function useAction() {
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [pending, start] = useTransition();
  const run = (work: () => Result, done?: () => void) =>
    start(async () => {
      setState({ status: "pending" });
      const r = await work();
      if (r && r.error) setState({ status: "error", message: r.error });
      else {
        setState({ status: "idle" });
        done?.();
      }
    });
  return { state, pending, run };
}

function PageRef({ t, pageHref }: { t: FeedThread; pageHref?: ThreadFeedProps["pageHref"] }) {
  if (t.page === null) return null;
  const label = `Show page ${t.page} of v${t.commitOrdinal}`;
  return (
    <a href={pageHref ? pageHref(t.page, t.commitOrdinal) : `?commit=${t.commitOrdinal}&page=${t.page}`} aria-label={label} className={LINK}>
      p. {t.page}
    </a>
  );
}

/** The reply form, opened by the Reply button. Focus moves into it; Cancel and Escape close it and focus Reply. */
function ReplyForm({ id, threadId, onReply, onClose }: { id: string; threadId: string; onReply: ThreadFeedProps["onReply"]; onClose: () => void }) {
  const [body, setBody] = useState("");
  const { state, pending, run } = useAction();
  return (
    <form
      id={id}
      aria-label="Reply"
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending || body.trim() === "") return;
        run(() => onReply(threadId, body.trim()), () => {
          setBody("");
          onClose();
        });
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <FormField label="Reply" id={`${id}-body`} reserve={false}>
        {/* autoFocus: the user opened the form with the Reply button, so focus moves into it. */}
        <textarea name="body" rows={2} autoFocus value={body} onChange={(e) => setBody(e.target.value)} className={cn(control.textarea, "min-h-16")} />
      </FormField>
      <div className="flex items-start gap-3">
        <PendingButton pending={pending} label="Send reply" pendingLabel="Sending…" variant="outline" size="sm" />
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}

/** The action row of an open thread: Reply (a disclosure button) and, for the author only, Resolve (BR-05). */
function ThreadActions({ t, props }: { t: FeedThread; props: ThreadFeedProps }) {
  const formId = useId();
  const replyRef = useRef<HTMLButtonElement>(null);
  const [replying, setReplying] = useState(false);
  const resolve = useAction();
  const reviewer = props.viewerRole === "adviser" || props.viewerRole === "panel_member";
  // BR-05: the Student never resolves, whatever the data says. A reviewer resolves only their own threads.
  const canResolve = reviewer && t.canResolve;
  const close = () => {
    setReplying(false);
    replyRef.current?.focus();
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {props.viewerRole !== "coordinator" ? (
          <button
            ref={replyRef}
            type="button"
            aria-expanded={replying}
            aria-controls={formId}
            onClick={() => setReplying((v) => !v)}
            className={cn("inline-flex min-h-11 items-center rounded-control px-1 text-sm font-medium text-link underline-offset-4 hover:underline lg:min-h-8", FOCUS)}
          >
            Reply
          </button>
        ) : null}
        {canResolve ? (
          <form
            aria-label="Resolve"
            onSubmit={(e) => {
              e.preventDefault();
              if (!resolve.pending) resolve.run(() => props.onResolve(t.id));
            }}
          >
            <PendingButton pending={resolve.pending} label="Resolve" pendingLabel="Saving…" variant="outline" size="sm" />
          </form>
        ) : null}
      </div>
      {canResolve ? <FormFeedback state={resolve.state} id={`${formId}-resolve`} lines={2} /> : null}
      {replying ? <ReplyForm id={formId} threadId={t.id} onReply={props.onReply} onClose={close} /> : null}
    </div>
  );
}

function ThreadBody({ t, props }: { t: FeedThread; props: ThreadFeedProps }) {
  const open = t.state === "OPEN";
  return (
    <>
      <p className="max-w-[65ch] text-base leading-6 whitespace-pre-wrap text-foreground">{t.body}</p>
      {t.addressedBy.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Glyph name="commit" size={16} />
          Addressed by{" "}
          {t.addressedBy.map((n, i) => (
            <span key={n} className="font-mono text-foreground">
              v{n}
              {i < t.addressedBy.length - 1 ? "," : ""}
            </span>
          ))}
        </p>
      ) : null}
      {t.replies.length > 0 ? (
        <ul className="flex flex-col gap-2 border-l border-border pl-3">
          {t.replies.map((r) => (
            <li key={r.id} className="flex max-w-[65ch] flex-col gap-0.5 text-sm">
              <span className="font-medium text-foreground">{r.author}</span>
              <span className="whitespace-pre-wrap text-foreground">{r.body}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {open ? <ThreadActions t={t} props={props} /> : null}
    </>
  );
}

function Meta({ t, props }: { t: FeedThread; props: ThreadFeedProps }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{t.author}</span>
      <span>{CONTEXT[t.context]}</span>
      <span className="font-mono text-[0.8rem]">v{t.commitOrdinal}</span>
      {t.outdated ? <span className="rounded-full border border-border px-2 text-[0.8rem] leading-5">Outdated</span> : null}
      <PageRef t={t} pageHref={props.pageHref} />
    </p>
  );
}

function OpenThread({ t, props }: { t: FeedThread; props: ThreadFeedProps }) {
  const amber = t.own && t.state === "OPEN";
  return (
    <li
      data-slot="thread"
      data-state={t.state}
      data-own={t.own || undefined}
      className={cn("flex flex-col gap-3 border-l-[3px] py-4 pl-4", amber ? "border-l-tone-pending-fg" : "border-l-transparent")}
    >
      <Meta t={t} props={props} />
      <ThreadBody t={t} props={props} />
    </li>
  );
}

/** A resolved thread: one line with the `done` glyph. A click opens it (§8.8). */
function ResolvedThread({ t, props }: { t: FeedThread; props: ThreadFeedProps }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <li data-slot="thread" data-state={t.state} className="flex flex-col gap-3 border-l-[3px] border-l-transparent py-3 pl-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn("-ml-1 flex min-h-11 min-w-0 items-center gap-2 rounded-control px-1 text-left text-sm text-muted-foreground hover:text-foreground", FOCUS)}
      >
        <span className="shrink-0 text-tone-done-fg">
          <Glyph name="done" size={16} />
        </span>
        <span className="shrink-0 font-medium text-foreground">{t.author}</span>
        <span className="min-w-0 truncate">{t.body}</span>
      </button>
      <div id={id} hidden={!open || undefined} className="flex flex-col gap-3">
        <Meta t={t} props={props} />
        <ThreadBody t={t} props={props} />
      </div>
    </li>
  );
}

function NewThread({ props }: { props: ThreadFeedProps }) {
  const id = useId();
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  const { state, pending, run } = useAction();
  const blocked = props.postBlockedReason;
  const label = props.postOrdinal ? `New thread on v${props.postOrdinal}` : "New thread";
  return (
    <form
      aria-label="New thread"
      className="flex flex-col gap-3 border-t border-border pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (blocked || pending || body.trim() === "" || !props.onPost) return;
        // FR-REV-04, D-26: the page is optional. The server checks the range.
        const pageNo = page.trim() === "" ? null : Number(page);
        run(
          () => props.onPost!(body.trim(), pageNo),
          () => {
            setBody("");
            setPage("");
          },
        );
      }}
    >
      <FormField label={label} id={`${id}-body`} reserve={false}>
        <textarea name="body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} readOnly={!!blocked} aria-disabled={blocked ? true : undefined} className={control.textarea} />
      </FormField>
      <FormField label="Page (optional)" id={`${id}-page`} hint="From 1 to 9999." className="w-48">
        <input
          type="number"
          min={1}
          max={9999}
          step={1}
          inputMode="numeric"
          name="page"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          readOnly={!!blocked}
          aria-disabled={blocked ? true : undefined}
          className={cn(control.input, "font-mono")}
        />
      </FormField>
      <div className="flex items-start">
        {blocked ? (
          <BlockedAction type="submit" variant="secondary" reason={blocked}>
            Post thread
          </BlockedAction>
        ) : (
          <PendingButton pending={pending} label="Post thread" pendingLabel="Posting…" variant="outline" />
        )}
      </div>
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}

export function ThreadFeed(props: ThreadFeedProps) {
  const { threads, defaultTab = "open" } = props;
  const base = useId();
  const [tab, setTab] = useState<FeedTab>(defaultTab);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const counts: Record<FeedTab, number> = {
    open: threads.filter((t) => t.state === "OPEN").length,
    all: threads.length,
    resolved: threads.filter((t) => t.state === "RESOLVED").length,
  };
  const list = threads.filter((t) => tab === "all" || (tab === "open" ? t.state === "OPEN" : t.state === "RESOLVED"));
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = nextTab(e.key, i, TABS.length);
    if (n === null) return;
    e.preventDefault();
    setTab(TABS[n]!.id);
    refs.current[n]?.focus();
  };
  const reviewer = props.viewerRole === "adviser" || props.viewerRole === "panel_member";
  return (
    <div data-slot="thread-feed" className="flex flex-col gap-2">
      <div role="tablist" aria-label="Threads" className="flex gap-1 border-b border-border">
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
            aria-controls={`${base}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground aria-selected:border-primary aria-selected:text-foreground",
              FOCUS,
            )}
          >
            {t.label}
            <span className="font-mono text-[0.8rem] text-muted-foreground tabular-nums">{counts[t.id]}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${tab}`} tabIndex={0} className={cn("rounded-control", FOCUS)}>
        {list.length === 0 ? (
          <EmptyState title={EMPTY[tab].title} body={EMPTY[tab].body} />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {list.map((t) => (t.state === "RESOLVED" ? <ResolvedThread key={t.id} t={t} props={props} /> : <OpenThread key={t.id} t={t} props={props} />))}
          </ul>
        )}
      </div>
      {reviewer && props.onPost ? <NewThread props={props} /> : null}
    </div>
  );
}
