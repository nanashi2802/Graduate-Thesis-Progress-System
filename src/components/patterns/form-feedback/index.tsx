"use client";
// Source: UX-011, DESIGN.md §8.4, UX-D-04, Task R2.4. One feedback contract for every form (preview in R2,
// integrate in R3 with the form-field pattern, UX-012):
// - pending: the button shows the pending label and aria-busy, and stays focusable (aria-disabled, not disabled).
// - space: the message slot has one fixed height (3 lines by default), and the button keeps its width (UX-D-16).
// - success: a toast for a small action; an on-screen status for a workflow result (Returned, Endorsed …).
// - error: role="alert" under the form, linked to the field when the server names one.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { Spinner } from "@/components/patterns/loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormFeedbackState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; message: string }
  | { status: "error"; message: string; field?: string };

/** The id of the error line. A field the server names sets `aria-describedby` to this id. */
export const errorId = (formId: string) => `${formId}-error`;

export type FeedbackLines = 2 | 3 | 4;

// Literal class names, so Tailwind finds them. 20 px lines (text-sm leading-5).
const HEIGHT: Record<FeedbackLines, string> = { 2: "h-10", 3: "h-15", 4: "h-20" };
const CLAMP: Record<number, string> = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4" };

/**
 * The message slot under a form (UX-D-16): one fixed height in every state, 3 lines by default. Size it for the
 * longest message at the narrowest width with `lines`. A longer message is clamped on the screen only: the full
 * text stays in the DOM (screen readers and the field link read all of it), and "Show more" shows it all.
 */
export function FormFeedback({ state, id, lines = 3 }: { state: FormFeedbackState; id: string; lines?: FeedbackLines }) {
  const message = state.status === "error" || state.status === "done" ? state.message : null;
  return (
    <div data-slot="form-feedback" className={cn("flex flex-col", HEIGHT[lines])}>
      {message !== null ? (
        <Message
          key={message}
          id={state.status === "error" ? errorId(id) : undefined}
          role={state.status === "error" ? "alert" : "status"}
          field={state.status === "error" ? state.field : undefined}
          tone={state.status === "error" ? "error" : "done"}
          lines={lines}
          text={message}
        />
      ) : null}
    </div>
  );
}

function Message({
  id,
  role,
  field,
  tone,
  lines,
  text,
}: {
  id?: string;
  role: "alert" | "status";
  field?: string;
  tone: "error" | "done";
  lines: FeedbackLines;
  text: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [open, setOpen] = useState(false);
  // Measure once after the first paint: the clamped text is taller inside than on the screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.scrollHeight > el.clientHeight + 1) setOverflow(true);
  }, []);
  // With "Show more", the last line holds the toggle, so the text keeps one line less.
  const clamp = open ? "" : CLAMP[overflow ? lines - 1 : lines];
  return (
    <div className={cn("relative", open && "z-10 rounded-control bg-card shadow-[var(--shadow-popover)]")}>
      <p
        role={role}
        data-field={field}
        className={cn("flex items-start gap-2 text-sm leading-5 font-medium", tone === "error" ? "text-tone-returned-fg" : "text-tone-done-fg")}
      >
        <Glyph name={tone === "error" ? "flag" : "done"} size={16} className="mt-0.5 shrink-0" />
        <span ref={ref} id={id} className={cn("min-w-0", clamp)}>
          {text}
        </span>
      </p>
      {overflow ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="ml-6 text-[0.8rem] leading-5 font-medium whitespace-nowrap text-link underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

/** Both labels sit in one grid cell, so the button keeps its width while it waits. */
export function PendingButton({
  pending,
  label,
  pendingLabel,
  variant = "default",
  form,
  size = "default",
  className,
  children,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "return" | "link";
  /** The id of the form, when the button sits outside it (a side-sheet footer, R3.6). */
  form?: string;
  /** "sm" keeps the small button of the old row forms until R7 (R3.10). "defense": 48 px on Defense Day (R6.3). */
  size?: "default" | "sm" | "defense";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Button type="submit" form={form} variant={variant} size={size} className={className} disabled={pending} focusableWhenDisabled aria-busy={pending || undefined}>
      {children}
      <span className="grid">
        <span className={cn("col-start-1 row-start-1", pending && "invisible")}>{label}</span>
        <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2", !pending && "invisible")}>
          <Spinner />
          {pendingLabel}
        </span>
      </span>
    </Button>
  );
}
