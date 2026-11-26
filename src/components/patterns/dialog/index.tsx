"use client";
// Source: Primer dialog, Stripe confirm dialogs (UX-D-03), DESIGN.md §8.9, UX-010, BR-19, Task R3.5.
// A permanent action (it records something that never changes, BR-19) asks once more before it runs.
// Base UI dialog: role="dialog", a title, a one-sentence body, the confirm button named with the verb, and Cancel.
// Focus (decision R3-e): option A starts on Cancel (recommended), option B on the confirm button. Escape closes
// the dialog and focus returns to the opener. While the action runs, the confirm button waits (PendingButton). An
// error shows inside the dialog, and the dialog stays open. No red fill (F3).
import { Dialog } from "@base-ui/react/dialog";
import { useId, useRef, useState, useTransition, type Ref } from "react";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { SCRIM, type SheetScrim } from "@/components/patterns/side-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConfirmCopy } from "./copy";

export { confirmCopy, type ConfirmCopy, type ConfirmKind } from "./copy";

export type ConfirmResult = { error?: string } | void;

export type ConfirmBodyProps = {
  body: string;
  confirmLabel: string;
  /** What the action opens or locks, for a gate dialog (DESIGN.md §8.9). */
  unlocks?: readonly string[];
  pending: boolean;
  state: FormFeedbackState;
  formId: string;
  onCancel?: () => void;
  cancelRef?: Ref<HTMLButtonElement>;
};

/** The inside of the dialog. Exported for the tests: a server render does not render the portal. */
export function ConfirmBody({ body, confirmLabel, unlocks, pending, state, formId, onCancel, cancelRef }: ConfirmBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <p id={`${formId}-body`} className="text-sm text-text-secondary">
        {body}
      </p>
      {unlocks && unlocks.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-text-secondary">
          {unlocks.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      ) : null}
      <FormFeedback state={state} id={formId} lines={2} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <PendingButton pending={pending} label={confirmLabel} pendingLabel="Saving…" />
      </div>
    </div>
  );
}

export type ConfirmDialogProps = ConfirmCopy & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs the server action. Return `{ error }` to keep the dialog open with the error. */
  onConfirm: () => Promise<ConfirmResult>;
  unlocks?: readonly string[];
  /** Decision R3-e. A: Cancel (default). B: the confirm button. */
  focus?: "cancel" | "confirm";
  scrim?: SheetScrim;
};

export function ConfirmDialog({ title, body, confirmLabel, open, onOpenChange, onConfirm, unlocks, focus = "cancel", scrim = "foreground" }: ConfirmDialogProps) {
  const formId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [pending, start] = useTransition();
  const change = (o: boolean) => {
    if (!o) setState({ status: "idle" });
    onOpenChange(o);
  };
  return (
    <Dialog.Root open={open} onOpenChange={change}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-(--motion-overlay) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
            SCRIM[scrim],
          )}
        />
        <Dialog.Popup
          initialFocus={() => (focus === "cancel" ? cancelRef.current : formRef.current?.querySelector<HTMLElement>('button[type="submit"]') ?? null)}
          aria-describedby={`${formId}-body`}
          className="fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-panel border border-border bg-popover p-6 text-popover-foreground shadow-[var(--shadow-popover)] outline-none transition-[opacity,scale] duration-(--motion-overlay) data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100"
        >
          <Dialog.Title className="text-lg leading-7 font-semibold">{title}</Dialog.Title>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              if (pending) return;
              start(async () => {
                setState({ status: "pending" });
                const r = await onConfirm();
                if (r && r.error) setState({ status: "error", message: r.error });
                else change(false);
              });
            }}
          >
            <ConfirmBody body={body} confirmLabel={confirmLabel} unlocks={unlocks} pending={pending} state={state} formId={formId} cancelRef={cancelRef} onCancel={() => change(false)} />
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
