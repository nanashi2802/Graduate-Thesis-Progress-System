"use client";
// Publish slots: one-off or weekly, In person or Online with one meeting link (FR-SCH-01, FR-SCH-07).
// Times are Philippine Standard Time (NFR-11).
import { useState } from "react";
import { publishConsultation, publishDefense } from "@/app/_lib/schedule-actions";
import { ActionForm, Field, inputClass } from "@/app/_components/action-form";

export function SlotPublishForm({ slotType }: { slotType: "consultation" | "defense" }) {
  const [mode, setMode] = useState<"in_person" | "online">("in_person");
  return (
    <ActionForm action={slotType === "consultation" ? publishConsultation : publishDefense} submitLabel="Publish" className="flex max-w-lg flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Starts (PST)">
          <input name="startsAt" type="datetime-local" required className={inputClass} />
        </Field>
        <Field label="Ends (PST)">
          <input name="endsAt" type="datetime-local" required className={inputClass} />
        </Field>
      </div>
      <Field label="Mode">
        <select name="mode" className={inputClass} value={mode} onChange={(e) => setMode(e.target.value === "online" ? "online" : "in_person")}>
          <option value="in_person">In person</option>
          <option value="online">Online</option>
        </select>
      </Field>
      {mode === "online" ? (
        <Field label="Meeting link">
          <input name="meetingLink" type="url" required placeholder="https://" className={inputClass} />
        </Field>
      ) : null}
      <Field label="Repeat weekly, extra weeks (0 for a single slot)">
        <input name="repeatWeeks" type="number" min={0} max={15} defaultValue={0} className={inputClass} />
      </Field>
    </ActionForm>
  );
}
