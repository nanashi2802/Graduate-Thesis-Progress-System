"use client";
// Client parts of C5. A blocked action shows its reason next to the action (BR-18, DESIGN.md §7.4).
import { useActionState } from "react";
import { ActionButton } from "@/components/action-button";
import { cn } from "@/lib/utils";
import { ActionForm, Field, fieldClass, ResultSlot } from "../_lib/form-parts";
import { checkCopiesAction, confirmDateAction, recordCopiesAction, returnDateAction } from "./actions";

// R3.10: the one form-feedback contract (UX-011). A result shows as "done", an error as role="alert".
const Message = ResultSlot;

export function ConfirmDateForm({ milestoneId, proposedDate, blockedReason }: { milestoneId: string; proposedDate: string; blockedReason: string | null }) {
  const [state, run] = useActionState(confirmDateAction, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start (Philippine Standard Time)" htmlFor={`start-${milestoneId}`} hint={`The start must be on ${proposedDate}.`}>
          <input id={`start-${milestoneId}`} name="startsAt" type="datetime-local" required defaultValue={`${proposedDate}T09:00`} className={fieldClass} />
        </Field>
        <Field label="Room or meeting link" htmlFor={`room-${milestoneId}`}>
          <input id={`room-${milestoneId}`} name="roomOrLink" required className={fieldClass} />
        </Field>
      </div>
      <ActionButton type="submit" blockedReason={blockedReason ?? undefined}>
        Confirm date and room
      </ActionButton>
      <Message state={state} />
    </form>
  );
}

export function ReturnDateForm({ milestoneId }: { milestoneId: string }) {
  return (
    <ActionForm action={returnDateAction} submit="Return the request" variant="outline" className="flex max-w-[640px] flex-col gap-3">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Reason" htmlFor={`reason-${milestoneId}`} hint="The Student reads it (BR-13).">
          <input id={`reason-${milestoneId}`} name="reason" required className={fieldClass} />
        </Field>
        <Field label="Purpose" htmlFor={`purpose-${milestoneId}`} hint="A Coordinator Return is for compliance or eligibility only.">
          <select id={`purpose-${milestoneId}`} name="purpose" defaultValue="compliance" className={fieldClass}>
            <option value="compliance">Compliance</option>
            <option value="eligibility">Eligibility</option>
          </select>
        </Field>
      </div>
    </ActionForm>
  );
}

export function RecordCopiesForm({ attemptId, expected, blockedReason }: { attemptId: string; expected: number; blockedReason?: string }) {
  const [state, run] = useActionState(recordCopiesAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="attemptId" value={attemptId} />
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Copies received" htmlFor={`copies-${attemptId}`} hint={`Expected: ${expected}.`}>
          <input id={`copies-${attemptId}`} name="copyCount" type="number" min={1} required defaultValue={expected || undefined} className={cn(fieldClass, "w-28")} />
        </Field>
        <ActionButton type="submit" size="sm" variant="outline" blockedReason={blockedReason}>
          Record receipt
        </ActionButton>
      </div>
      <Message state={state} />
    </form>
  );
}

export function CheckCopiesForm({ attemptId, blockedReason }: { attemptId: string; blockedReason?: string }) {
  const [state, run] = useActionState(checkCopiesAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="attemptId" value={attemptId} />
      <div className="flex flex-wrap gap-2">
        <ActionButton type="submit" name="result" value="matched" size="sm" blockedReason={blockedReason}>
          Copies match
        </ActionButton>
        <ActionButton type="submit" name="result" value="mismatch" size="sm" variant="outline" blockedReason={blockedReason}>
          Mismatch
        </ActionButton>
      </div>
      <Message state={state} />
    </form>
  );
}
