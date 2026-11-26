"use client";
// Source: Primer merge box with checks (DESIGN.md §5.3 A2/P2, §7.4 `gate-box`, §8.9), design/screens/A2.md, P2.md,
// SITEMAP §9, BR-05, BR-18, BR-19, F3, Task R5.2.
// The A2 and P2 form of the Docket. One row for each gate check, with a pass (`done`) or a fail (`flag`) glyph and the
// reason of a failing check. Then the gate button: the one maroon button of the region (G1). A failing check blocks it
// with `aria-disabled` and the first failing reason (BR-18). An open gate button opens the existing ConfirmDialog copy
// (R3-h A, UX-010), and the gate runs only after the confirm.
// Return (FR-WFL-05) is never disabled and never a solid red fill (F3). It opens the inline ReturnComposer under the
// box, the same as C4 (R5-c A, UX-P-05). Escape and Cancel close it and return focus to the Return button.
// Today the data layer gives one reason for each gate (`checkTransition`, `gate1bBlock`, `gate2Block`), so the screen
// lists the checks that those reasons can name. A full list of checks is a data change for later.
import { useRef, useState } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { ConfirmDialog, type ConfirmCopy, type ConfirmResult } from "@/components/patterns/dialog";
import { Glyph } from "@/components/patterns/glyphs";
import { ReturnComposer } from "@/components/patterns/return-composer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GateCheck = {
  id: string;
  /** The condition, said as the passed state: "Your threads are resolved". */
  label: string;
  ok: boolean;
  /** The SITEMAP §9 text of a failing check. */
  reason?: string;
};

/** The reason that blocks the gate button: the first failing check, or nothing. */
export function gateBlock(checks: GateCheck[]): string | undefined {
  const fail = checks.find((c) => !c.ok);
  if (!fail) return undefined;
  return fail.reason?.trim() ? fail.reason : fail.label;
}

export type GateBoxProps = {
  checks: GateCheck[];
  /** The gate button label, with the gate name (DESIGN.md §8.3): "Endorse (Gate 1a)". */
  gateLabel: string;
  /** The `confirmCopy` text of the gate. */
  confirm: ConfirmCopy;
  /** Runs the gate server action after the confirm. Return `{ error }` to keep the dialog open with it. */
  onGate: () => Promise<ConfirmResult>;
  /** Runs the Return server action. Leave it out where the gate has no Return. */
  onReturn?: (reason: string) => Promise<{ error?: string } | void>;
  /** No gate to check yet (A2 with no Ready commit). The gate button is blocked with this text. */
  waiting?: string;
  /** The heading of the box. */
  title?: string;
  className?: string;
};

const RETURN_PLACEHOLDER = "Example: Chapter 3 does not answer the research questions. Revise it before the next commit.";

export function GateBox({ checks, gateLabel, confirm, onGate, onReturn, waiting, title = "Gate checks", className }: GateBoxProps) {
  const [open, setOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const returnRef = useRef<HTMLButtonElement>(null);
  const reason = waiting ?? gateBlock(checks);
  const closeReturn = () => {
    setReturning(false);
    returnRef.current?.focus();
  };
  const returnButton = onReturn ? (
    <Button
      ref={returnRef}
      type="button"
      variant="return"
      className="sm:ml-auto"
      aria-expanded={returning}
      onClick={() => setReturning((v) => !v)}
    >
      <Glyph name="return" size={16} />
      Return to the Student
    </Button>
  ) : null;
  return (
    <section aria-label={title} data-slot="gate-box" className={cn("flex flex-col gap-4 rounded-card border border-border bg-card p-4 sm:p-5", className)}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {/* Waiting: no check rows. The gate button's reason carries the sentence, so it is said once (DESIGN.md §2.1). */}
      {waiting ? null : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {checks.map((c) => (
            <li key={c.id} data-slot="gate-check" data-ok={c.ok} className="flex min-h-11 items-start gap-3 py-2.5 text-sm leading-5">
              <span className={cn("mt-0.5 shrink-0", c.ok ? "text-tone-done-fg" : "text-tone-pending-fg")}>
                <Glyph name={c.ok ? "done" : "flag"} size={16} label={c.ok ? "Passed" : "Not passed"} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={cn(c.ok ? "text-foreground" : "font-medium text-foreground")}>{c.label}</span>
                {!c.ok && c.reason ? <span className="text-muted-foreground">{c.reason}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-start gap-3">
        {reason !== undefined ? (
          <BlockedAction type="button" reason={reason}>
            {gateLabel}
          </BlockedAction>
        ) : (
          <Button type="button" onClick={() => setOpen(true)}>
            {gateLabel}
          </Button>
        )}
        {returnButton}
      </div>
      <ConfirmDialog {...confirm} open={open} onOpenChange={setOpen} onConfirm={onGate} />
      {onReturn && returning ? (
        <div data-slot="gate-return" className="max-w-[480px] border-t border-border pt-4">
          <p className="mb-3 text-sm text-muted-foreground">The Student sees this reason.</p>
          <ReturnComposer
            placeholder={RETURN_PLACEHOLDER}
            onCancel={closeReturn}
            onSend={async (r) => {
              const res = await onReturn(r);
              if (res && res.error) return res;
              setReturning(false);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
