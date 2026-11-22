"use client";
// C7 forms: one verify button for each Coordinator item and the close button. A blocked action shows its reason (BR-18).
import { useActionState } from "react";
import { ActionButton } from "@/components/action-button";
import { closeClearanceAction, verifyItemAction } from "./actions";

const note = (s: { ok?: string; error?: string }) => (
  <p role="status" aria-live="polite" className={s.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
    {s.error ?? s.ok ?? ""}
  </p>
);

export function VerifyForm({ milestoneId, kind, blockedReason }: { milestoneId: string; kind: string; blockedReason?: string }) {
  const [state, run] = useActionState(verifyItemAction, {});
  return (
    <form action={run} className="flex flex-col gap-1">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <input type="hidden" name="kind" value={kind} />
      {kind === "final_copy" && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" name="matches" /> The final copy matches the approved manuscript
        </label>
      )}
      <ActionButton type="submit" size="sm" blockedReason={blockedReason}>
        Verify
      </ActionButton>
      {note(state)}
    </form>
  );
}

export function CloseForm({ milestoneId, blockedReason }: { milestoneId: string; blockedReason?: string }) {
  const [state, run] = useActionState(closeClearanceAction, {});
  return (
    <form action={run} className="flex flex-col gap-1">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <ActionButton type="submit" blockedReason={blockedReason}>
        Close as Cleared
      </ActionButton>
      {note(state)}
    </form>
  );
}
