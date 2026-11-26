"use client";
// Small form parts for the Coordinator screens (DESIGN.md §5.3 Form pattern: labels above fields).
// R3.10: the one form-feedback contract (UX-011, UX-012, UX-013). The action shape `(prev, form) → FormState` and
// the server actions do not change. `ok` is a workflow result: it shows on the screen in the FormFeedback slot
// (UX-D-04). `error` shows in the same slot as role="alert". The slot has a fixed height (UX-D-16).
import { useActionState, useId, useState, type ReactNode, type RefObject } from "react";
import { ActionButton } from "@/components/action-button";
import { ConfirmDialog, type ConfirmCopy } from "@/components/patterns/dialog";
import { FormFeedback, PendingButton, type FeedbackLines, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { FormField, control, type FormFieldProps } from "@/components/patterns/form-field";

export type FormState = { ok?: string; error?: string };
type Action = (prev: FormState, form: FormData) => Promise<FormState>;

/** The old class name, kept until R8 (R3.10). It is the `form-field` input class. */
export const fieldClass = control.input;

/** The FormFeedback state of a coordinator action result. */
export function feedbackOf(state: FormState, pending = false): FormFeedbackState {
  if (pending) return { status: "pending" };
  if (state.error) return { status: "error", message: state.error };
  if (state.ok) return { status: "done", message: state.ok };
  return { status: "idle" };
}

/** The old field part, kept until R8 (R3.10). It renders the FormField pattern. `htmlFor` is the control id. */
export function Field({ label, htmlFor, children, hint, error }: { label: string; htmlFor: string; children: FormFieldProps["children"]; hint?: string; error?: string }) {
  return (
    <FormField label={label} id={htmlFor} hint={hint} error={error} reserve={hint !== undefined || error !== undefined} lines={hint && hint.length > 60 ? 2 : 1}>
      {children}
    </FormField>
  );
}

// A form that shows the result of its server action in the message slot under it.
export function ActionForm({
  action,
  submit,
  children,
  className,
  variant = "default",
  feedbackLines = 2,
}: {
  action: Action;
  submit: string;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "link";
  feedbackLines?: FeedbackLines;
}) {
  const [state, run, pending] = useActionState(action, {});
  const formId = useId();
  return (
    <form action={run} className={className ?? "flex max-w-[640px] flex-col gap-4"}>
      {children}
      <div className="flex flex-col gap-2">
        <PendingButton pending={pending} label={submit} pendingLabel="Saving…" variant={variant} className="self-start" />
        <FormFeedback state={feedbackOf(state, pending)} id={formId} lines={feedbackLines} />
      </div>
    </form>
  );
}

/** The message slot of a coordinator form that builds its own buttons (R3.10, UX-011). Fixed height (UX-D-16). */
export function ResultSlot({ state, lines = 2 }: { state: FormState; lines?: FeedbackLines }) {
  const id = useId();
  return <FormFeedback state={feedbackOf(state)} id={id} lines={lines} />;
}

/**
 * A permanent action of a coordinator form (R3-h A, UX-010, BR-19). The button opens a ConfirmDialog. On confirm,
 * it sends the FormData of the form, with `fields` set (for example `to=verified`), to the same server action. An
 * error stays in the dialog. The result goes to `onResult`, for the form's message slot. A blocked action keeps its
 * reason and never opens the dialog (BR-18).
 */
export function ConfirmButton({
  action,
  formRef,
  fields = {},
  copy,
  blockedReason,
  onResult,
  size,
  variant = "default",
  children,
}: {
  action: Action;
  formRef: RefObject<HTMLFormElement | null>;
  fields?: Record<string, string>;
  copy: ConfirmCopy;
  blockedReason?: string;
  onResult: (state: FormState) => void;
  size?: "sm";
  variant?: "default" | "outline";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton type="button" size={size} variant={variant} blockedReason={blockedReason} onClick={() => blockedReason === undefined && setOpen(true)}>
        {children}
      </ActionButton>
      <ConfirmDialog
        {...copy}
        open={open}
        onOpenChange={setOpen}
        onConfirm={async () => {
          const data = new FormData(formRef.current ?? undefined);
          for (const [k, v] of Object.entries(fields)) data.set(k, v);
          const res = await action({}, data);
          if (res.error) return { error: res.error };
          onResult(res);
        }}
      />
    </>
  );
}
