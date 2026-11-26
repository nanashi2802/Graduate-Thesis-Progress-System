"use client";
// One row of the C4 review: a reason box and the two actions, Verify and Return (D-28). A blocked action shows its reason (BR-18).
// R3.10 (R3-h A, UX-010, BR-19): Verify asks once more in a ConfirmDialog, then sends the same FormData (`to=verified`)
// to the same server action. Return stays one step until the composer comes with C4 in R7d.
import { useActionState, useRef, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { confirmCopy } from "@/components/patterns/dialog/copy";
import { ConfirmButton, fieldClass, ResultSlot, type FormState } from "../_lib/form-parts";
import { reviewDocumentAction } from "./actions";

export type ReviewBlocks = Partial<Record<"verified" | "returned", string>>;

export function ReviewForm({ documentId, blocks, form, student }: { documentId: string; blocks: ReviewBlocks; form: string; student: string }) {
  const [state, run] = useActionState(reviewDocumentAction, {});
  const ref = useRef<HTMLFormElement>(null);
  // The result of the dialog path. A new Return submit clears it, so the slot shows the newest result.
  const [confirmed, setConfirmed] = useState<FormState | null>(null);
  return (
    <form ref={ref} action={run} onSubmit={() => setConfirmed(null)} className="flex flex-col gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <input
        name="reason"
        aria-label="Reason for a Return"
        placeholder="Reason (needed for a Return)"
        className={fieldClass}
      />
      <div className="flex flex-wrap gap-2">
        <ConfirmButton
          action={reviewDocumentAction}
          formRef={ref}
          fields={{ to: "verified" }}
          copy={confirmCopy({ kind: "verify", form, student })}
          blockedReason={blocks.verified}
          onResult={setConfirmed}
          size="sm"
        >
          Verify
        </ConfirmButton>
        <ActionButton type="submit" name="to" value="returned" size="sm" variant="outline" blockedReason={blocks.returned}>
          Return
        </ActionButton>
      </div>
      <ResultSlot state={confirmed ?? state} />
    </form>
  );
}
