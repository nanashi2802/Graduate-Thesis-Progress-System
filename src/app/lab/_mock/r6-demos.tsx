"use client";
// Mock demos of the R6 patterns (Task R6.1 to R6.6): the slot list, the date picker, the Defense Day sheet, the verdict
// panel and the consultation log. Mock data only, no server import (eslint rule for src/app/lab).
// The actions wait 600 ms and change nothing. Decisions R6-a A, R6-b A, R6-c A, R6-d A (UX-P-06, 27 Nov 2026).
import { useCallback, useId, useState } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { ConsultationLog, type ConsultationEntry } from "@/components/patterns/consultation-log";
import { DatePicker, type DayKey } from "@/components/patterns/date-picker";
import { DefenseForm, type DefenseRow } from "@/components/patterns/defense-form";
import { EmptyState } from "@/components/patterns/empty-state";
import { control, FormField } from "@/components/patterns/form-field";
import { LoadingBlocks } from "@/components/patterns/loading";
import { SlotList, type SlotEntry } from "@/components/patterns/slot-list";
import { Verdict, VERDICT_LABEL, type VerdictMember, type VerdictValue } from "@/components/patterns/verdict";
import { Button } from "@/components/ui/button";

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
/** 12 Jan 2027, h:00 PHT. */
const at = (day: number, h: number, m = 0) => new Date(Date.UTC(2027, 0, day, h - 8, m));

// ---- Slot list (R6.1) ----

const OPEN_SLOTS: SlotEntry[] = [
  { id: "o1", startsAt: at(14, 9), endsAt: at(14, 10), mode: "in_person", place: "Room 301, CEA building", status: "available" },
  { id: "o2", startsAt: at(15, 13), endsAt: at(15, 14), mode: "online", place: "Google Meet", status: "available" },
];
const MY_SLOTS: SlotEntry[] = [
  { id: "m1", startsAt: at(14, 9), endsAt: at(14, 10), mode: "in_person", place: "Room 301, CEA building", status: "available" },
  { id: "m2", startsAt: at(15, 13), endsAt: at(15, 14), mode: "online", place: "Google Meet", status: "pending", student: "Dino Aquino" },
  { id: "m3", startsAt: at(18, 15), endsAt: at(18, 16), mode: "in_person", place: "Room 301, CEA building", status: "confirmed", student: "Ella Santos" },
];
const MY_REQUESTS: SlotEntry[] = [
  { id: "r1", startsAt: at(18, 15), endsAt: at(18, 16), mode: "online", place: "Google Meet", meetingLink: "https://meet.example/abc-defg-hij", status: "confirmed", student: "You" },
];

export function SlotListDemo({ view }: { view: "open" | "mine" | "requests" | "empty-student" | "empty-adviser" | "loading" }) {
  if (view === "loading") return <LoadingBlocks shape="slots" rows={3} label="Loading the slots" />;
  if (view === "empty-student")
    return <SlotList label="Open slots" slots={[]} empty={<EmptyState title="Your Adviser has no open slots yet." />} />;
  if (view === "empty-adviser")
    return (
      <SlotList
        label="My slots"
        slots={[]}
        empty={<EmptyState title="No slots yet." body="Publish a slot so advisees can book." action={<Button type="button">Publish a slot</Button>} />}
      />
    );
  if (view === "open")
    return (
      <SlotList
        label="Open slots"
        slots={OPEN_SLOTS}
        empty={null}
        action={(s) => (
          <Button type="button" variant={s.id === "o1" ? "default" : "outline"}>
            Request this slot
          </Button>
        )}
      />
    );
  if (view === "requests") return <SlotList label="My requests" slots={MY_REQUESTS.map((s) => ({ ...s, student: null }))} empty={null} />;
  return (
    <SlotList
      label="My slots"
      slots={MY_SLOTS}
      empty={null}
      action={(s) =>
        s.status === "available" ? (
          <Button type="button" variant="outline" size="sm">
            Remove
          </Button>
        ) : null
      }
    />
  );
}

// ---- Date picker (R6.2) ----

/** Gate 1b on 12 Jan 2027: the earliest date is 19 Jan 2027 (BR-09). Today in the demo: 12 Jan 2027. */
const EARLIEST = at(19, 0);
const TODAY = at(12, 10);

export function DatePickerDemo({ mode }: { mode: "empty" | "chosen" | "locked" }) {
  const id = useId();
  const [value, setValue] = useState<DayKey | null>(mode === "chosen" ? "2027-01-26" : null);
  if (mode === "locked")
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Defense date</p>
        <BlockedAction type="button" reason="Locked until Gate 1b.">
          Propose date
        </BlockedAction>
      </div>
    );
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <DatePicker id={id} label="Defense date" name="date" earliest={EARLIEST} today={TODAY} value={value} onChange={setValue} />
      {value ? (
        <Button type="submit" className="w-fit">
          Propose date
        </Button>
      ) : (
        <BlockedAction type="submit" reason="Choose a date first.">
          Propose date
        </BlockedAction>
      )}
    </form>
  );
}

// ---- Defense Day sheet (R6.3) ----

const ROWS: DefenseRow[] = [
  { id: "a1", code: "A1", name: "Problem, objectives and scope", weight: 20, score: 18 },
  { id: "a2", code: "A2", name: "Review of related literature", weight: 15, score: 12.5 },
  { id: "a3", code: "A3", name: "Method and design", weight: 30, score: 24 },
  { id: "a4", code: "A4", name: "Presentation and answers", weight: 20, score: null },
  { id: "a5", code: "A5", name: "Manuscript format", weight: 15, score: 13 },
];

function SheetFields({ readOnly }: { readOnly: boolean }) {
  const id = useId();
  if (readOnly)
    return (
      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="font-medium text-foreground">General observations</dt>
          <dd className="m-0 max-w-[65ch] text-foreground">Clear scope. Add the sample size to Chapter 3.</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Action Taken</dt>
          <dd className="m-0 text-foreground">{VERDICT_LABEL.approved_with_revisions}</dd>
        </div>
      </dl>
    );
  return (
    <>
      <FormField label="General observations" id={`${id}-obs`}>
        <textarea id={`${id}-obs`} name="comment_general_observations" className={control.textarea} defaultValue="Clear scope. Add the sample size to Chapter 3." />
      </FormField>
      <FormField label="Action Taken" id={`${id}-action`}>
        <select id={`${id}-action`} name="actionTaken" className={`${control.select} h-12 lg:h-12 max-w-sm text-base`} defaultValue="approved_with_revisions">
          <option value="">Choose</option>
          {(Object.keys(VERDICT_LABEL) as VerdictValue[]).map((v) => (
            <option key={v} value={v}>
              {VERDICT_LABEL[v]}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}

export function DefenseFormDemo({ mode }: { mode: "edit" | "error" | "before-start" | "verified" | "closed" | "loading" }) {
  if (mode === "loading") return <LoadingBlocks shape="defense" rows={5} label="Loading your evaluation sheet" />;
  const sheetMode = mode === "verified" || mode === "closed" ? mode : "edit";
  return (
    <div className="w-full max-w-[720px]">
      <DefenseForm
        rows={ROWS}
        mode={sheetMode}
        legend="TDW 08 Proposal evaluation"
        blockedReason={mode === "before-start" ? "Opens at the scheduled start." : undefined}
        onSave={async () => {
          await wait();
          return mode === "error" ? { ok: false, error: "The defense is not open for sheets." } : { ok: true };
        }}
      >
        <SheetFields readOnly={sheetMode !== "edit"} />
      </DefenseForm>
    </div>
  );
}

// ---- Verdict panel (R6.4) ----

const MEMBERS: VerdictMember[] = [
  { name: "Dr. Ana Reyes", designation: "Lead Panel Member", total: 86, actionTaken: "approved_with_revisions" },
  { name: "Engr. Ben Cruz", designation: "Panel Member", total: 79.5, actionTaken: "approved", differs: true },
  { name: "Dr. Carla Lim", designation: "Panel Member", total: null, actionTaken: null },
];

export function VerdictDemo({ mode }: { mode: "open" | "before-date" | "all-saved" | "closed" }) {
  const [updatedAt, setUpdatedAt] = useState(() => at(26, 14, 5));
  const refresh = useCallback(() => setUpdatedAt(new Date()), []);
  const members =
    mode === "all-saved"
      ? MEMBERS.map((m) => (m.total === null ? { ...m, total: 82, actionTaken: "approved_with_revisions" as const } : { ...m, differs: false }))
      : MEMBERS;
  return (
    <div className="w-full max-w-[720px]">
      <Verdict
        members={mode === "closed" ? members.map((m) => ({ ...m, total: m.total ?? 82, actionTaken: m.actionTaken ?? "approved_with_revisions" })) : members}
        canRecord={mode !== "before-date"}
        recordReason={mode === "before-date" ? "Allowed on or after the defense date." : undefined}
        recorded={mode === "closed" ? "approved_with_revisions" : mode === "open" ? "approved_with_revisions" : null}
        closed={mode === "closed"}
        updatedAt={updatedAt}
        onRefresh={refresh}
        onRecord={async () => {
          await wait();
        }}
        student="Dino Aquino"
      />
    </div>
  );
}

// ---- Consultation log (R6.5) ----

const LOG: ConsultationEntry[] = [
  { id: "c1", heldAt: at(5, 9), place: "Room 301, CEA building", topics: "Chapter 1 scope and the objectives", confirmed: true },
  { id: "c2", heldAt: at(12, 14, 30), place: "Google Meet", topics: "Chapter 3 sampling method, the sample size and the survey tool that the Student will use", confirmed: true },
  { id: "c3", heldAt: at(19, 10), place: "Room 301, CEA building", topics: null, confirmed: false },
];

export function ConsultationLogDemo({ view }: { view: "rows" | "empty" | "loading" }) {
  if (view === "loading") return <LoadingBlocks shape="rows" rows={3} label="Loading the consultation log" />;
  return (
    <ConsultationLog
      rows={view === "empty" ? [] : LOG}
      empty={<EmptyState title="No consultations yet." body="Entries appear here after each booked consultation." />}
      action={(r) => (r.confirmed ? null : { label: "Confirm", onClick: () => {}, primary: true })}
    />
  );
}
