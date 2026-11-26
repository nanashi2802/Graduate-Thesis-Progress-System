"use client";
// Source: own (DESIGN.md §8.9 Return composer, design/screens/C4.md "Writing a Return"), BR-13, BR-18, UX-D-16, Task R3.4.
// Inline in the record panel, no dialog. One free-text field, "Reason for return", with one placeholder example.
// "Send return" is blocked with "Write a reason first" until the field has text (spaces do not count).
// No preset reasons: the Student sees the reason word for word. A Coordinator reason is compliance or eligibility
// only (BR-13). The caller moves focus back to its Return button on "Cancel". The result stays on the screen.
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { control, FormField } from "@/components/patterns/form-field";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { Glyph } from "@/components/patterns/glyphs";
import { Button } from "@/components/ui/button";

export const RETURN_BLOCKED = "Write a reason first";

export const canSend = (reason: string) => reason.trim().length > 0;

export type ReturnComposerProps = {
  /** Runs the server action. Return `{ error }` to show it in the slot under the form. */
  onSend: (reason: string) => Promise<{ error?: string } | void>;
  onCancel: () => void;
  /** One example, for instance "Example: the scan has no Adviser signature." */
  placeholder: string;
  /** Focus the field when the composer opens (default). */
  autoFocus?: boolean;
};

export function ReturnComposer({ onSend, onCancel, placeholder, autoFocus = true }: ReturnComposerProps) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [pending, start] = useTransition();
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  const ready = canSend(reason);
  return (
    <form
      aria-label="Return"
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready || pending) return;
        start(async () => {
          setState({ status: "pending" });
          const r = await onSend(reason.trim());
          setState(r && r.error ? { status: "error", message: r.error } : { status: "idle" });
        });
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <FormField label="Reason for return" id={`${id}-reason`} reserve={false}>
        <textarea ref={ref} name="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} rows={4} className={control.textarea} />
      </FormField>
      <FormFeedback state={state} id={id} lines={2} />
      <div className="flex flex-col gap-2">
        {/* UX-D-16: the button and its reason line keep one height, so typing the first letter moves nothing. */}
        {ready ? (
          <span className="flex h-14 flex-col [&>button]:w-full">
            <PendingButton pending={pending} label="Send return" pendingLabel="Sending…" variant="return" />
          </span>
        ) : (
          <BlockedAction type="submit" variant="return" reason={RETURN_BLOCKED} wrapperClassName="h-14 w-full" className="w-full">
            Send return
          </BlockedAction>
        )}
        <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const pht = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

/** The on-screen result after a Return (UX-D-04: a workflow result never goes in a toast). */
export function ReturnResult({ student, reason, at }: { student: string; reason: string; at: Date }) {
  return (
    <div role="status" className="flex flex-col gap-1 rounded-card border border-tone-returned-line bg-tone-returned-bg p-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-tone-returned-fg">
        <Glyph name="return" size={16} />
        Returned to {student}
      </p>
      <p className="text-foreground">“{reason}”</p>
      <time dateTime={at.toISOString()} className="font-mono text-[0.8rem] text-muted-foreground">
        {pht(at)} PHT
      </time>
    </div>
  );
}
