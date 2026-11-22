"use client";
// Client parts of C3 (DESIGN.md §5.3, §7.4). A blocked action shows its reason (BR-18).
import { useActionState, type ReactNode } from "react";
import { ActionButton } from "@/components/action-button";
import { ActionForm, Field, fieldClass, type FormState } from "../_lib/form-parts";
import { advanceMilestoneAction, linkAppointmentAction, linkNdaAction, markAppointedAction, proposeSeatAction, seatAnswerAction } from "./actions";

type Option = { id: string; label: string };

export function ProposeSeatForm({
  thesisId,
  milestone,
  pool,
  blockedReason,
}: {
  thesisId: string;
  milestone: string;
  pool: Option[];
  blockedReason?: string;
}) {
  if (blockedReason) {
    return (
      <ActionButton type="button" variant="outline" blockedReason={blockedReason}>
        Propose a seat
      </ActionButton>
    );
  }
  return (
    <ActionForm action={proposeSeatAction} submit="Propose the seat">
      <input type="hidden" name="thesisId" value={thesisId} />
      <input type="hidden" name="milestone" value={milestone} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Panel Member" htmlFor={`member-${milestone}`} hint="Workload counts seats that are not declined.">
          <select id={`member-${milestone}`} name="memberUserId" required defaultValue="" className={fieldClass}>
            <option value="" disabled>
              Pick a Panel Member
            </option>
            {pool.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Designation" htmlFor={`designation-${milestone}`}>
          <select id={`designation-${milestone}`} name="designation" defaultValue="none" className={fieldClass}>
            <option value="none">None</option>
            <option value="lead_panel_member">Lead Panel Member</option>
            <option value="panel_chair">Panel Chair</option>
          </select>
        </Field>
      </div>
    </ActionForm>
  );
}

function Message({ state }: { state: FormState }) {
  return (
    <p role="status" aria-live="polite" className={state.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      {state.error ?? state.ok ?? ""}
    </p>
  );
}

export function SeatAnswerButtons({ seatId }: { seatId: string }) {
  const [state, run] = useActionState(seatAnswerAction, {});
  return (
    <form action={run} className="flex flex-col gap-1">
      <input type="hidden" name="seatId" value={seatId} />
      <div className="flex gap-2">
        <ActionButton type="submit" name="status" value="accepted" size="sm">
          Accepted
        </ActionButton>
        <ActionButton type="submit" name="status" value="declined" size="sm" variant="outline">
          Declined
        </ActionButton>
      </div>
      <Message state={state} />
    </form>
  );
}

/** One select and one button that link a scanned record (TDW 05, 06 or 11) to a committee or a seat. */
export function LinkForm({
  kind,
  targetName,
  targetId,
  options,
  label,
  blockedReason,
}: {
  kind: "appointment" | "nda";
  targetName: "committeeId" | "seatId";
  targetId: string;
  options: Option[];
  label: string;
  blockedReason?: string;
}) {
  const [state, run] = useActionState(kind === "appointment" ? linkAppointmentAction : linkNdaAction, {});
  if (options.length === 0 || blockedReason) {
    return (
      <ActionButton type="button" size="sm" variant="outline" blockedReason={blockedReason ?? `No scan of the ${label} exists yet. Upload it first.`}>
        Link {label}
      </ActionButton>
    );
  }
  return (
    <form action={run} className="flex flex-col gap-1">
      <input type="hidden" name={targetName} value={targetId} />
      <div className="flex flex-wrap gap-2">
        <select name="documentId" required defaultValue={options[0]!.id} aria-label={`Record of the ${label}`} className={`${fieldClass} w-auto`}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <ActionButton type="submit" size="sm" variant="outline">
          Link {label}
        </ActionButton>
      </div>
      <Message state={state} />
    </form>
  );
}

export function AppointButton({ committeeId, blockedReason, children }: { committeeId: string; blockedReason: string | null; children?: ReactNode }) {
  const [state, run] = useActionState(markAppointedAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="committeeId" value={committeeId} />
      <ActionButton type="submit" blockedReason={blockedReason ?? undefined}>
        {children ?? "Mark Appointed"}
      </ActionButton>
      <Message state={state} />
    </form>
  );
}

/** The second step after "Mark Appointed": move the milestone once the paper is verified (BR-08, AD-B-021). */
export function AdvanceButton({ committeeId, blockedReason }: { committeeId: string; blockedReason: string | null }) {
  const [state, run] = useActionState(advanceMilestoneAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="committeeId" value={committeeId} />
      <ActionButton type="submit" variant="outline" blockedReason={blockedReason ?? undefined}>
        Move the milestone to Committee appointed
      </ActionButton>
      <Message state={state} />
    </form>
  );
}
