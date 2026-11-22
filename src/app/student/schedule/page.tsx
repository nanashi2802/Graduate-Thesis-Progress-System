// `/student/schedule` (S4): book consultations, add log topics, and propose the defense date
// (FR-SCH-02 to 05, FR-SCH-08, FR-DEF-01, BR-09, BR-16, INV-28).
import { ActionForm, areaClass, Field, inputClass } from "@/app/_components/action-form";
import { MODE, pst, pstRange, SLOT_STATUS } from "@/app/_lib/format";
import { proposeDateAction, requestBookingAction, topicAction } from "@/app/_lib/schedule-actions";
import { EmptyState } from "@/components/empty-state";
import { getSessionState } from "@/server/auth/session";
import { commonDefenseWindows, listBookings, listLogEntries, listSlots } from "@/server/data/consultations";
import { getDb } from "@/server/data/db";
import { listAttempts } from "@/server/data/defense";
import { readableMilestones } from "@/server/data/documents";
import { listThreads } from "@/server/data/manuscript";

export default async function Page() {
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const milestone = (await readableMilestones(ctx)).at(-1);
  if (!milestone) {
    return (
      <main className="mx-auto max-w-[960px] px-4 py-8 sm:px-8">
        <EmptyState title="No milestone yet." detail="Your Coordinator makes your account with its first milestone." />
      </main>
    );
  }
  const slots = (await listSlots(ctx, { slotType: "consultation" })).filter((s) => s.status === "available");
  const bookings = await listBookings(ctx);
  const entries = await listLogEntries(ctx, milestone.id);
  const threads = (await listThreads(ctx, milestone.id).catch(() => [])).filter((t) => t.thread.state === "OPEN");
  const windows = await commonDefenseWindows(ctx, milestone.thesisId);
  const attempts = await listAttempts(ctx, milestone.id);
  const proposed = attempts.at(-1)?.attempt;

  // BR-09: show the earliest date and why a date can be blocked.
  const canPropose = milestone.status === "COMMITTEE_ENDORSED";
  const proposeBlock = canPropose ? undefined : milestone.status === "DATE_PROPOSED" || milestone.status === "DEFENSE_SCHEDULED" ? "A date is proposed already." : "Locked until Gate 1b.";

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">Book a consultation with your Adviser and pick your defense date. All times are Philippine Standard Time.</p>
      </header>

      <section aria-labelledby="slots" className="flex flex-col gap-3">
        <h2 id="slots" className="text-lg font-semibold">
          Open consultation slots
        </h2>
        {slots.length === 0 ? (
          <EmptyState title="No open slots." detail="Your Adviser publishes slots. They appear here." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {slots.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-3">
                <p className="text-sm font-medium">
                  {pstRange(s.startsAt, s.endsAt)} · {MODE[s.mode]}
                </p>
                <ActionForm action={requestBookingAction.bind(null, s.id)} submitLabel="Request this slot">
                  <Field label="Agenda (optional)">
                    <textarea name="agenda" className={areaClass} />
                  </Field>
                  {threads.length > 0 ? (
                    <fieldset className="flex flex-col gap-1 text-sm">
                      <legend className="font-medium">Link open threads</legend>
                      {threads.map((t) => (
                        <label key={t.thread.id} className="flex items-start gap-2">
                          <input type="checkbox" name="threadIds" value={t.thread.id} />
                          <span>
                            v{t.commitOrdinal}: {t.thread.body.slice(0, 80)}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  ) : null}
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mine" className="flex flex-col gap-3">
        <h2 id="mine" className="text-lg font-semibold">
          My requests
        </h2>
        {bookings.length === 0 ? (
          <EmptyState title="No requests yet." detail="A request appears here after you take a slot." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {bookings.map((b) => (
              <li key={b.booking.id} className="flex flex-col gap-1 py-3 text-sm">
                <p className="font-medium">{pstRange(b.slot.startsAt, b.slot.endsAt)}</p>
                <p className="text-muted-foreground">
                  {b.booking.status === "pending" ? "Waiting for your Adviser" : b.booking.status === "confirmed" ? "Confirmed" : "Declined"} · {MODE[b.slot.mode]} · {SLOT_STATUS[b.slot.status]}
                </p>
                {b.slot.meetingLink ? (
                  <p>
                    Meeting link: <a className="text-primary underline" href={b.slot.meetingLink}>{b.slot.meetingLink}</a>
                  </p>
                ) : null}
                {b.booking.agenda ? <p>Agenda: {b.booking.agenda}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="log" className="flex flex-col gap-3">
        <h2 id="log" className="text-lg font-semibold">
          Consultation log
        </h2>
        {entries.length === 0 ? (
          <EmptyState title="The log is empty." detail="After a consultation, your Adviser adds it. Then you add the topic." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 py-3 text-sm">
                <p className="font-medium">
                  {pst(e.heldAt)} · {e.placeOrPlatform}
                </p>
                {e.confirmedAt ? (
                  <>
                    <p>Topic: {e.topic}</p>
                    <p>Recommendations: {e.recommendations ?? "None."}</p>
                  </>
                ) : (
                  <ActionForm action={topicAction.bind(null, e.id)} submitLabel="Save topic" resetOnSuccess={false}>
                    <Field label="Topic">
                      <input name="topic" defaultValue={e.topic ?? ""} className={inputClass} />
                    </Field>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="defense" className="flex flex-col gap-3">
        <h2 id="defense" className="text-lg font-semibold">
          Defense date
        </h2>
        {proposed?.proposedDate ? (
          <p className="text-sm">
            Proposed date: <span className="font-medium">{proposed.proposedDate}</span>
            {proposed.scheduledStartAt ? `. Confirmed for ${pst(proposed.scheduledStartAt)}${proposed.roomOrLink ? ` at ${proposed.roomOrLink}` : ""}.` : ". The Coordinator confirms the date."}
          </p>
        ) : null}
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          The date must be at least 7 days after Gate 1b (BR-09). These periods have every member free:
        </p>
        {windows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No common free time yet. Your committee publishes its availability.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {windows.slice(0, 12).map((w) => (
              <li key={w.start.toISOString()}>{pstRange(w.start, w.end)}</li>
            ))}
          </ul>
        )}
        <ActionForm action={proposeDateAction.bind(null, milestone.id)} submitLabel="Propose this date" blockedReason={proposeBlock} resetOnSuccess={false}>
          <Field label="Defense date">
            <input name="date" type="date" required className={inputClass} />
          </Field>
        </ActionForm>
      </section>
    </main>
  );
}
