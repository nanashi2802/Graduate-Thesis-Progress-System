"use client";
// One row of the C4 review: a reason box and the two actions, Verify and Return (D-28). A blocked action shows its reason (BR-18).
import { useActionState } from "react";
import { ActionButton } from "@/components/action-button";
import { fieldClass } from "../_lib/form-parts";
import { reviewDocumentAction } from "./actions";

export type ReviewBlocks = Partial<Record<"verified" | "returned", string>>;

const ACTIONS = [
  { to: "verified", label: "Verify", variant: "default" },
  { to: "returned", label: "Return", variant: "outline" },
] as const;

export function ReviewForm({ documentId, blocks }: { documentId: string; blocks: ReviewBlocks }) {
  const [state, run] = useActionState(reviewDocumentAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <input
        name="reason"
        aria-label="Reason for a Return"
        placeholder="Reason (needed for a Return)"
        className={fieldClass}
      />
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <ActionButton key={a.to} type="submit" name="to" value={a.to} size="sm" variant={a.variant} blockedReason={blocks[a.to]}>
            {a.label}
          </ActionButton>
        ))}
      </div>
      <p role="status" aria-live="polite" className={state.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
