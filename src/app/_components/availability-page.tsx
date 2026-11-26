// Slots of one owner: the publish form, the own slots, and (Adviser) the requests (A4, P3, FR-SCH-01, FR-SCH-02, FR-SCH-07).
import type { UserRole } from "@/server/data/schema";
import { ActionForm } from "@/app/_components/action-form";
import { SlotPublishForm } from "@/app/_components/slot-publish-form";
import { WithdrawButton } from "@/app/_components/slot-list";
import { MODE, pst, pstRange, SLOT_STATUS } from "@/app/_lib/format";
import { decideBookingAction } from "@/app/_lib/schedule-actions";
import { EmptyState } from "@/components/empty-state";
import { getRoleState } from "@/server/auth/session";
import { listBookings, listSlots } from "@/server/data/consultations";
import { getDb } from "@/server/data/db";

export async function AvailabilityPage({ portal, withConsultations }: { portal: UserRole; withConsultations: boolean }) {
  const state = await getRoleState(portal);
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const slots = await listSlots(ctx);
  const requests = withConsultations ? (await listBookings(ctx)).filter((b) => b.booking.status === "pending") : [];
  const consultation = slots.filter((s) => s.slotType === "consultation");
  const defense = slots.filter((s) => s.slotType === "defense");

  const list = (rows: typeof slots, empty: string) =>
    rows.length === 0 ? (
      <EmptyState title={empty} detail="Published slots appear here." />
    ) : (
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {rows.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex flex-col gap-0.5 text-sm">
              <p className="font-medium">{pstRange(s.startsAt, s.endsAt)}</p>
              <p className="text-muted-foreground">
                {MODE[s.mode]} · {SLOT_STATUS[s.status]}
                {s.meetingLink ? ` · ${s.meetingLink}` : ""}
              </p>
            </div>
            {s.status === "available" ? <WithdrawButton slotId={s.id} /> : null}
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Availability</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {withConsultations
            ? "Publish consultation slots for your advisees and defense availability for the committee. All times are Philippine Standard Time."
            : "Publish the times you are free for a defense. The Student sees only the dates when every member is free. All times are Philippine Standard Time."}
        </p>
      </header>

      {withConsultations ? (
        <section aria-labelledby="requests" className="flex flex-col gap-3">
          <h2 id="requests" className="text-lg font-semibold">
            Requests
          </h2>
          {requests.length === 0 ? (
            <EmptyState title="No requests are waiting." detail="A request appears when a Student takes one of your open slots." />
          ) : (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {requests.map((r) => (
                <li key={r.booking.id} className="flex flex-col gap-2 py-3">
                  <p className="text-sm font-medium">{pstRange(r.slot.startsAt, r.slot.endsAt)}</p>
                  <p className="text-sm text-muted-foreground">Requested {pst(r.booking.requestedAt)}. {r.booking.agenda ? `Agenda: ${r.booking.agenda}` : "No agenda."}</p>
                  <div className="flex gap-2">
                    <ActionForm className="flex" action={decideBookingAction.bind(null, r.booking.id, "confirm")} submitLabel="Confirm" />
                    <ActionForm className="flex" action={decideBookingAction.bind(null, r.booking.id, "decline")} submitLabel="Decline" variant="outline" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {withConsultations ? (
        <section aria-labelledby="consultation" className="flex flex-col gap-4">
          <h2 id="consultation" className="text-lg font-semibold">
            Consultation slots
          </h2>
          <SlotPublishForm slotType="consultation" />
          {list(consultation, "No consultation slots.")}
        </section>
      ) : null}

      <section aria-labelledby="defense" className="flex flex-col gap-4">
        <h2 id="defense" className="text-lg font-semibold">
          Defense availability
        </h2>
        <SlotPublishForm slotType="defense" />
        {list(defense, "No defense availability.")}
      </section>
    </div>
  );
}
