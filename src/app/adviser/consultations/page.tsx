// `/adviser/consultations` (A3): confirmed consultations, the log entries and the TDW 03 view (FR-SCH-05, FR-SCH-06, BR-16).
import { ActionForm, areaClass, Field, inputClass } from "@/app/_components/action-form";
import { MODE, pst, pstRange } from "@/app/_lib/format";
import { confirmLogAction, draftLogAction } from "@/app/_lib/schedule-actions";
import { EmptyState } from "@/components/empty-state";
import { getRoleState } from "@/server/auth/session";
import { listBookings, listLogEntries } from "@/server/data/consultations";
import { getDb } from "@/server/data/db";
import { readableMilestones } from "@/server/data/documents";

export default async function Page() {
  const state = await getRoleState("adviser");
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const bookings = (await listBookings(ctx)).filter((b) => b.booking.status === "confirmed");
  const milestones = await readableMilestones(ctx);
  const entries = (await Promise.all(milestones.map((m) => listLogEntries(ctx, m.id)))).flat();
  const logged = new Set(entries.map((e) => e.bookingId));
  const now = new Date();
  const toLog = bookings.filter((b) => !logged.has(b.booking.id));

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Consultation log</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          Confirm that a consultation was held. The system drafts the entry. The Student adds the topic. You confirm it with your recommendations. There is no minimum count.
        </p>
      </header>

      <section aria-labelledby="held" className="flex flex-col gap-3">
        <h2 id="held" className="text-lg font-semibold">
          Confirmed consultations
        </h2>
        {toLog.length === 0 ? (
          <EmptyState title="No consultation waits for a log entry." detail="Confirmed consultations appear here until you add them to the log." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {toLog.map((b) => {
              const started = b.slot.startsAt <= now;
              return (
                <li key={b.booking.id} className="flex flex-col gap-2 py-3">
                  <p className="text-sm font-medium">
                    {pstRange(b.slot.startsAt, b.slot.endsAt)} · {MODE[b.slot.mode]}
                  </p>
                  <ActionForm
                    action={draftLogAction.bind(null, b.booking.id)}
                    submitLabel="Add to the log as held"
                    blockedReason={started ? undefined : "The consultation has not started."}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <Field label="Place or platform (optional)">
                      <input name="place" className={inputClass} />
                    </Field>
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="log" className="flex flex-col gap-3">
        <h2 id="log" className="text-lg font-semibold">
          TDW 03 log
        </h2>
        {entries.length === 0 ? (
          <EmptyState title="The log is empty." detail="An entry appears after you add a held consultation." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 py-3 text-sm">
                <p className="font-medium">
                  {pst(e.heldAt)} · {e.placeOrPlatform}
                </p>
                <p>Topic: {e.topic ?? "The Student has not added the topic."}</p>
                {e.confirmedAt ? (
                  <p>Recommendations: {e.recommendations ?? "None."} (confirmed {pst(e.confirmedAt)})</p>
                ) : (
                  <ActionForm
                    action={confirmLogAction.bind(null, e.id)}
                    submitLabel="Confirm entry"
                    blockedReason={e.topic ? undefined : "The Student adds the topic first."}
                  >
                    <Field label="Recommendations">
                      <textarea name="recommendations" className={areaClass} />
                    </Field>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
