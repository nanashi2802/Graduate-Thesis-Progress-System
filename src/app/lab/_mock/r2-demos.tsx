"use client";
// Lab only (Tasks R2.2 to R2.5): live demos with mock actions. Fake data, no server import.
import { useState, useTransition } from "react";
import { ErrorState } from "@/components/patterns/error";
import { FormFeedback, PendingButton, errorId, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { ToastProvider, useToast, type ToastInput } from "@/components/patterns/toast";
import { NotificationsSheet, UserMenu, type TopBarNotification, type TopBarPreference } from "@/components/patterns/top-bar";
import { Button } from "@/components/ui/button";

const wait = (ms = 600) => new Promise<void>((r) => setTimeout(r, ms));

const NOTES: TopBarNotification[] = [
  { id: "n1", event: "Your Adviser endorsed the manuscript.", nextAction: "Wait for the Evaluation Committee review.", createdAt: new Date("2027-01-12T01:00:00Z"), read: false },
  { id: "n2", event: "The Coordinator confirmed the defense date.", nextAction: "Bring the printed copies by 5 Feb 2027.", createdAt: new Date("2027-01-10T06:30:00Z"), read: false },
  { id: "n3", event: "A Panel Member resolved a thread.", nextAction: "No action is needed.", createdAt: new Date("2027-01-08T02:15:00Z"), read: true },
];
const PREFS: TopBarPreference[] = [
  { code: "THREAD_REPLY", event: "A reply to your thread", optional: true, enabled: true },
  { code: "WEEKLY_DIGEST", event: "Weekly summary of open threads", optional: true, enabled: false },
  { code: "GATE_RESULT", event: "A gate result on your milestone", optional: false, enabled: true },
];

function PrefsSaved() {
  const toast = useToast();
  return (
    <UserMenu
      userName="Ana Cruz"
      roleLabel="Student"
      preferences={PREFS}
      actions={{ savePreferences: () => wait(), signOut: () => wait() }}
      onPreferencesSaved={() => toast.show({ label: "Preferences saved.", tone: "done" })}
    />
  );
}

export function TopBarDemo({ open }: { open?: "notifications" | "menu" }) {
  return (
    <ToastProvider>
      <div className="flex flex-wrap items-center gap-2">
        <NotificationsSheet items={NOTES} unread={2} actions={{ markRead: () => wait(), markAllRead: () => wait() }} defaultOpen={open === "notifications"} />
        <NotificationsSheet items={[]} unread={0} actions={{ markRead: () => wait(), markAllRead: () => wait() }} />
        <PrefsSaved />
      </div>
    </ToastProvider>
  );
}

const SMALL: ToastInput[] = [
  { label: "Preferences saved.", tone: "done" },
  { label: "Availability published.", tone: "done", glyph: "calendar" },
  { label: "Slot requested.", tone: "neutral", glyph: "calendar" },
  { label: "File uploaded.", tone: "done", glyph: "received" },
  { label: "The file did not upload. Try again.", tone: "returned", glyph: "flag" },
];

function ToastButtons() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      {SMALL.map((t) => (
        <Button key={t.label} type="button" variant="outline" size="sm" onClick={() => toast.show(t)}>
          {t.label}
        </Button>
      ))}
    </div>
  );
}

export function ToastDemo() {
  return (
    <ToastProvider>
      <ToastButtons />
    </ToastProvider>
  );
}

/** The form-feedback contract (R2.4): pending, error linked to a field, a workflow result on the screen. */
export function FormFeedbackDemo({ kind }: { kind: "small" | "workflow" | "error" }) {
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [pending, start] = useTransition();
  const id = `demo-${kind}`;
  return (
    <ToastProvider>
      <FormBody kind={kind} id={id} state={state} setState={setState} pending={pending} start={start} />
    </ToastProvider>
  );
}

function FormBody({
  kind,
  id,
  state,
  setState,
  pending,
  start,
}: {
  kind: "small" | "workflow" | "error";
  id: string;
  state: FormFeedbackState;
  setState: (s: FormFeedbackState) => void;
  pending: boolean;
  start: (fn: () => Promise<void>) => void;
}) {
  const toast = useToast();
  const fieldError = state.status === "error" && state.field === "date";
  return (
    <form
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setState({ status: "idle" });
        start(async () => {
          await wait(1200);
          if (kind === "error") setState({ status: "error", message: "Enter a date on or after 19 Jan 2027.", field: "date" });
          else if (kind === "workflow") setState({ status: "done", message: "Returned to the Student. The reason is on the record." });
          else toast.show({ label: "Availability published.", tone: "done", glyph: "calendar" });
        });
      }}
    >
      <label htmlFor={`${id}-date`} className="text-sm font-medium">
        {kind === "workflow" ? "Reason" : "Date"}
      </label>
      <input
        id={`${id}-date`}
        name="date"
        defaultValue={kind === "workflow" ? "Chapter 3 needs the data sources." : ""}
        aria-invalid={fieldError || undefined}
        aria-describedby={fieldError ? errorId(id) : undefined}
        className="h-11 rounded-control border border-input bg-card px-3 text-sm aria-invalid:border-tone-returned-fg"
      />
      <div>
        <PendingButton pending={pending} label={kind === "workflow" ? "Return" : "Publish"} pendingLabel={kind === "workflow" ? "Returning…" : "Publishing…"} variant={kind === "workflow" ? "return" : "default"} />
      </div>
      <FormFeedback state={state} id={id} />
    </form>
  );
}

/** A part that throws, inside a local boundary, to show the error state with Try again. */
export function ErrorDemo() {
  const [tries, setTries] = useState(0);
  return tries % 2 === 0 ? (
    <ErrorState what="The review queue did not load." todo="Try again. If it fails again, tell the Coordinator." onRetry={() => setTries((n) => n + 1)} />
  ) : (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm">The queue loaded (mock).</p>
      <Button type="button" variant="outline" size="sm" onClick={() => setTries((n) => n + 1)}>
        Show the error again
      </Button>
    </div>
  );
}
