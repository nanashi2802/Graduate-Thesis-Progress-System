"use client";
// A form that calls a server action and shows its refusal reason as text (BR-18).
// R3.10: the one form-feedback contract (UX-011, UX-012, UX-013, DESIGN.md §8.4, §10 Forms). The signature, the
// result shape and the server action do not change:
// - pending: PendingButton (keeps its width, aria-busy, stays focusable).
// - error: the FormFeedback slot under the form (role="alert"), with a fixed height (UX-D-16).
// - success: a toast for a small action only (`successToast`, UX-D-04), then router.refresh().
// - confirm: a permanent action (BR-19, UX-010) asks once more in a ConfirmDialog. The browser checks the
//   required fields first; the dialog then sends the same FormData.
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import type { Result } from "@/app/_lib/run";
import { ActionButton } from "@/components/action-button";
import { ConfirmDialog, type ConfirmCopy } from "@/components/patterns/dialog";
import { FormFeedback, PendingButton, type FeedbackLines, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { FormField, control, type FormFieldProps } from "@/components/patterns/form-field";
import { useToast } from "@/components/patterns/toast";

const FALLBACK = "The change was not saved.";

export function ActionForm({
  action,
  submitLabel,
  blockedReason,
  variant = "default",
  className,
  resetOnSuccess = true,
  successToast,
  confirm,
  feedbackLines = 2,
  children,
}: {
  action: (form: FormData) => Promise<Result>;
  submitLabel: string;
  blockedReason?: string;
  variant?: "default" | "outline" | "return";
  className?: string;
  resetOnSuccess?: boolean;
  /** A small confirmation only (UX-D-04), for example "Slot requested." A workflow result stays on the screen. */
  successToast?: string;
  /** A permanent action (BR-19): the dialog copy (`confirmCopy`). The submit button opens the dialog. */
  confirm?: ConfirmCopy & { unlocks?: readonly string[] };
  /** The height of the message slot in 20 px lines, for the longest message at the narrowest width (UX-D-16). */
  feedbackLines?: FeedbackLines;
  children?: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);
  const formId = useId();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [held, setHeld] = useState<FormData | null>(null);

  const succeed = () => {
    if (resetOnSuccess) ref.current?.reset();
    if (successToast) toast.show({ label: successToast, tone: "done" });
    router.refresh();
  };

  return (
    <form
      ref={ref}
      className={className ?? "flex flex-col gap-2"}
      onSubmit={(e) => {
        e.preventDefault();
        if (blockedReason || pending) return;
        const data = new FormData(e.currentTarget);
        setState({ status: "idle" });
        if (confirm) {
          setHeld(data);
          return;
        }
        start(async () => {
          setState({ status: "pending" });
          const res = await action(data);
          if (res.ok) {
            setState({ status: "idle" });
            succeed();
          } else {
            setState({ status: "error", message: res.error ?? FALLBACK });
          }
        });
      }}
    >
      {children}
      {blockedReason !== undefined ? (
        <ActionButton type="submit" size="sm" variant={variant} blockedReason={blockedReason} className="self-start">
          {submitLabel}
        </ActionButton>
      ) : (
        <PendingButton pending={pending} label={submitLabel} pendingLabel="Saving…" variant={variant} size="sm" className="self-start" />
      )}
      <FormFeedback state={state} id={formId} lines={feedbackLines} />
      {confirm ? (
        <ConfirmDialog
          {...confirm}
          open={held !== null}
          onOpenChange={(o) => {
            if (!o) setHeld(null);
          }}
          onConfirm={async () => {
            if (!held) return;
            const res = await action(held);
            if (!res.ok) return { error: res.error ?? FALLBACK };
            succeed();
          }}
        />
      ) : null}
    </form>
  );
}

/**
 * The old field part, kept until R8 (R3.10). It now renders the FormField pattern: the label above the control,
 * linked by id. `hint` and `error` follow the contract (UX-011).
 */
export function Field({ label, children, hint, error }: { label: string; children: FormFieldProps["children"]; hint?: string; error?: string }) {
  const id = useId();
  return (
    <FormField label={label} id={id} hint={hint} error={error} reserve={false}>
      {children}
    </FormField>
  );
}

/** Old class names, kept until R8 (R3.10). They are the one control class set of `form-field`. */
export const inputClass = control.input;
export const areaClass = control.textarea;
