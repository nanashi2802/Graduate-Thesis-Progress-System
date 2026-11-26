"use client";
// Lab only (Round R3, Tasks R3.1 to R3.7): live demos with mock actions. Fake data, no server import.
import { useMemo, useRef, useState } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { ConfirmDialog, confirmCopy, type ConfirmKind } from "@/components/patterns/dialog";
import { EmptyState } from "@/components/patterns/empty-state";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { control, FormField } from "@/components/patterns/form-field";
import { Glyph } from "@/components/patterns/glyphs";
import { Inbox, InboxList, InboxRecord, type StateStep } from "@/components/patterns/inbox";
import { QueueTable, type QueueColumn, type SortState } from "@/components/patterns/queue-table";
import { ReturnComposer, ReturnResult } from "@/components/patterns/return-composer";
import { SheetClose, SideSheet, type SheetScrim, type SheetWidth } from "@/components/patterns/side-sheet";
import { formLabel, StatusPill } from "@/components/patterns/status";
import { ToastProvider, useToast } from "@/components/patterns/toast";
import { Button } from "@/components/ui/button";
import { A1_QUEUE, C1_QUEUE, C2_STUDENTS, INBOX_ITEMS, SCAN_NAMES, type AdviserRow, type QueueRow, type StudentRow } from "./r3-data";

const wait = (ms = 700) => new Promise<void>((r) => setTimeout(r, ms));
const GROUP_GLYPH: Record<string, "scan" | "calendar" | "seat" | "defense" | "clear"> = {
  "Check scans": "scan",
  "Confirm dates": "calendar",
  "Appoint committees": "seat",
  "Close defenses": "defense",
  "Check clearance": "clear",
};

export type TableOptions = { phone: "stack" | "scroll"; longText: "tooltip" | "clamp"; actionLook: "button" | "link" };

function sortRows<T>(rows: readonly T[], sort: SortState, value: (r: T, key: string) => string | number) {
  return [...rows].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return sort.dir === "asc" ? c : -c;
  });
}

const flip = (s: SortState, key: string): SortState => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "days" ? "desc" : "asc" });

/** C1 region 2: the action queue, grouped by queue, compact. */
export function C1QueueDemo({ opts, empty, collapsed }: { opts: TableOptions; empty?: boolean; collapsed?: string[] }) {
  const [sort, setSort] = useState<SortState>({ key: "days", dir: "desc" });
  const rows = useMemo(() => sortRows(C1_QUEUE, sort, (r, k) => (k === "days" ? r.days : r.student)), [sort]);
  const columns: QueueColumn<QueueRow>[] = [
    { key: "student", label: "Student", width: "220px", sortable: true, text: (r) => r.student, render: (r) => <span className="font-medium">{r.student}</span> },
    { key: "form", label: "Form", width: "96px", mono: true, text: (r) => (r.form ? formLabel(r.form) : "—") },
    { key: "request", label: "Request", long: true, text: (r) => r.request },
    { key: "milestone", label: "Milestone", width: "110px", hideBelowLaptop: true, text: (r) => r.milestone },
    { key: "days", label: "Waiting", width: "96px", sortable: true, mono: true, text: (r) => `${r.days} ${r.days === 1 ? "day" : "days"}` },
  ];
  return (
    <QueueTable
      caption="Action queue"
      columns={columns}
      rows={empty ? [] : rows}
      rowKey={(r) => r.id}
      density="compact"
      groupBy={{ key: (r) => r.kind, glyph: (g) => GROUP_GLYPH[g] ?? "queue", order: Object.keys(GROUP_GLYPH), collapsible: true, defaultCollapsed: collapsed }}
      action={(r) => ({ label: r.action, href: "#", reason: r.blocked })}
      sort={sort}
      onSort={(k) => setSort((s) => flip(s, k))}
      empty={
        <EmptyState
          title="Nothing waits for you."
          body="Requests appear here when Students and faculty act. Start with the faculty accounts."
          action={<Button>Add faculty</Button>}
        />
      }
      {...opts}
    />
  );
}

/** C2 region 1: the Student list with a long title, a flag glyph and a status pill. */
export function C2StudentsDemo({ opts }: { opts: TableOptions }) {
  const columns: QueueColumn<StudentRow>[] = [
    { key: "student", label: "Student", width: "160px", text: (r) => r.student, render: (r) => <span className="font-medium">{r.student}</span> },
    { key: "title", label: "Thesis title", long: true, text: (r) => r.title },
    { key: "adviser", label: "Adviser", width: "180px", text: (r) => r.adviser },
    { key: "milestone", label: "Milestone", width: "110px", text: (r) => r.milestone },
    {
      key: "status",
      label: "Status",
      width: "150px",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusPill tone={r.status === "Ready" ? "active" : r.status === "In review" ? "pending" : "neutral"} label={r.status} />
          {r.flag ? (
            <span className="text-tone-pending-fg" title={r.flag}>
              <Glyph name="flag" size={16} label={`Flag: ${r.flag}`} />
            </span>
          ) : null}
        </span>
      ),
    },
  ];
  return (
    <QueueTable
      caption="Students"
      columns={columns}
      rows={C2_STUDENTS}
      rowKey={(r) => r.id}
      density="compact"
      action={() => ({ label: "Open", href: "#" })}
      empty={null}
      {...opts}
    />
  );
}

/** A1 region 1: the Adviser queue, comfortable, the one primary row action of the screen (R3-f A). */
export function A1QueueDemo({ opts, empty }: { opts: TableOptions; empty?: boolean }) {
  const columns: QueueColumn<AdviserRow>[] = [
    { key: "student", label: "Student", width: "180px", text: (r) => r.student, render: (r) => <span className="font-medium">{r.student}</span> },
    {
      key: "request",
      label: "Request",
      long: true,
      text: (r) => r.request,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{r.request}</span>
          {r.gate ? <span className="shrink-0 rounded-stamp border border-divider-strong px-1.5 font-mono text-[0.8rem] text-text-secondary">{r.gate}</span> : null}
        </span>
      ),
    },
    { key: "days", label: "Waiting", width: "110px", mono: true, text: (r) => `${r.days} ${r.days === 1 ? "day" : "days"}` },
  ];
  return (
    <QueueTable
      caption="Waiting for you"
      columns={columns}
      rows={empty ? [] : A1_QUEUE}
      rowKey={(r) => r.id}
      density="comfortable"
      action={(r) => ({ label: r.gate ? "Review" : r.request.startsWith("Record") ? "Record" : "Open", href: "#", primary: r.id === "a1" })}
      empty={<EmptyState title="No requests are waiting." body="Requests appear here when an advisee marks a version Ready." />}
      {...opts}
    />
  );
}

// ——— Inbox (C4) ———

export type InboxState = "checking" | "return" | "returned" | "verified" | "empty";

const STEPS: Record<Exclude<InboxState, "empty">, StateStep[]> = {
  checking: [{ label: "Scan uploaded", state: "done" }, { label: "Verified", state: "todo" }],
  return: [{ label: "Scan uploaded", state: "done" }, { label: "Verified", state: "todo" }],
  returned: [{ label: "Scan uploaded", state: "done" }, { label: "Returned", state: "returned" }],
  verified: [{ label: "Scan uploaded", state: "done" }, { label: "Verified", state: "done" }],
};

function ScanPlaceholder({ file }: { file: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-3.5">
        <span className="truncate font-mono text-[0.8rem] text-text-secondary">{file}</span>
        <span className="flex items-center gap-1 font-mono text-[0.8rem] text-muted-foreground">
          <button type="button" aria-label="Zoom out" className="size-7 rounded-stamp border border-border bg-card">−</button>
          100%
          <button type="button" aria-label="Zoom in" className="size-7 rounded-stamp border border-border bg-card">+</button>
        </span>
      </div>
      <div className="flex flex-1 justify-center p-6">
        {/* The scan page stays white in dark (DESIGN.md §8.6, UX-D-01). Mock: lines only, no real form. */}
        <div aria-label="Scan preview (mock)" role="img" className="flex h-[420px] w-full max-w-[340px] flex-col gap-3 bg-white p-7 shadow-[var(--shadow-popover)]">
          <span className="mx-auto h-2 w-1/2 rounded-full bg-black/15" />
          <span className="mx-auto mb-3 h-3 w-2/3 rounded-full bg-black/25" />
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="h-1.5 rounded-full bg-black/10" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
          ))}
          <span className="mt-auto grid grid-cols-2 gap-6">
            <span className="h-px bg-black/40" />
            <span className="h-px bg-black/40" />
          </span>
        </div>
      </div>
    </div>
  );
}

const AT = new Date("2027-01-12T01:20:00Z");

export function InboxDemo({ initial, selectedId = "d2" }: { initial: InboxState; selectedId?: string }) {
  const [state, setState] = useState<InboxState>(initial);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [reason, setReason] = useState("The Adviser signature on page 2 is missing. Upload a new scan with the signature.");
  const returnRef = useRef<HTMLButtonElement>(null);
  const item = INBOX_ITEMS.find((i) => i.id === selectedId) ?? INBOX_ITEMS[1]!;
  const empty = state === "empty";
  const docState = state === "verified" ? "verified" : state === "returned" ? "returned" : "scan_uploaded";
  const copy = confirmCopy({ kind: "verify", form: item.form, student: item.student });
  return (
    <>
      <Inbox
        label="Scans to check"
        list={
          <InboxList
            label="Scans to check, oldest first"
            items={empty ? [] : INBOX_ITEMS}
            selectedId={item.id}
            empty={<EmptyState title="No scans are waiting." body="New scans appear here when a Student uploads one." />}
          />
        }
        viewer={empty ? <div className="h-full" /> : <ScanPlaceholder file={`${item.form.replace("_", "-")}_${item.student.split(" ")[1]}.pdf`} />}
        record={
          empty ? null : (
            <InboxRecord
              form={item.form}
              state={docState}
              name={SCAN_NAMES[item.form] ?? item.form}
              student={item.student}
              milestone={item.milestone}
              steps={STEPS[state]}
              result={
                state === "returned" ? (
                  <div className="flex flex-col gap-2">
                    <ReturnResult student={item.student} reason={reason} at={AT} />
                    <p className="text-[0.8rem] text-muted-foreground">Next: new scan from the Student</p>
                  </div>
                ) : state === "verified" ? (
                  <p role="status" className="flex items-center gap-2 rounded-card border border-tone-done-line bg-tone-done-bg p-3 text-sm font-semibold text-tone-done-fg">
                    <Glyph name="verify" size={16} />
                    Verified · <time dateTime={AT.toISOString()} className="font-mono font-medium">12 Jan 2027, 9:20 am</time> · locked
                  </p>
                ) : null
              }
              actions={
                state === "checking" ? (
                  <>
                    <Button className="w-full" onClick={() => setVerifyOpen(true)}>
                      Verify
                    </Button>
                    <Button ref={returnRef} variant="return" className="w-full" onClick={() => setState("return")}>
                      <Glyph name="return" size={16} />
                      Return
                    </Button>
                  </>
                ) : state === "return" ? (
                  <ReturnComposer
                    placeholder="Example: the scan has no Adviser signature."
                    onCancel={() => {
                      setState("checking");
                      requestAnimationFrame(() => returnRef.current?.focus());
                    }}
                    onSend={async (r) => {
                      await wait();
                      setReason(r);
                      setState("returned");
                    }}
                  />
                ) : null
              }
              details={{ uploadedAt: new Date("2027-01-06T03:10:00Z"), by: item.student, sha256: "9f2c4e7a1b0d8c3f5e6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0" }}
            />
          )
        }
      />
      <ConfirmDialog
        {...copy}
        scrim="token"
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onConfirm={async () => {
          await wait();
          setState("verified");
        }}
      />
    </>
  );
}

// ——— Return composer alone ———

export function ComposerDemo({ mode }: { mode: "empty" | "error" }) {
  const [sent, setSent] = useState<string | null>(null);
  if (sent) return <ReturnResult student="Dino Aquino" reason={sent} at={AT} />;
  return (
    <div className="w-[300px]">
      <ReturnComposer
        autoFocus={false}
        placeholder="Example: the scan has no Adviser signature."
        onCancel={() => {}}
        onSend={async (r) => {
          await wait();
          if (mode === "error") return { error: "The scan is no longer waiting. Another Coordinator checked it." };
          setSent(r);
        }}
      />
    </div>
  );
}

// ——— Confirm dialog ———

const KINDS: { k: ConfirmKind; opener: string; unlocks?: string[] }[] = [
  { k: { kind: "verify", form: "TDW_12", student: "Dino Aquino" }, opener: "Verify" },
  {
    k: { kind: "endorse1b", student: "Dino Aquino" },
    opener: "Endorse this commit (Gate 1b)",
    unlocks: ["The manuscript locks until the defense closes.", "The Student can propose a defense date."],
  },
  { k: { kind: "endorse1a", student: "Bea Santos" }, opener: "Endorse (Gate 1a)" },
  { k: { kind: "gate2", student: "Dino Aquino" }, opener: "Approve the final manuscript (Gate 2)" },
  { k: { kind: "verdict", student: "Hugo Ramos" }, opener: "Record verdict" },
  { k: { kind: "scanMatches", form: "TDW_08", student: "Hugo Ramos" }, opener: "Scan matches" },
  { k: { kind: "closeStage", student: "Hugo Ramos" }, opener: "Close the stage" },
];

export function DialogDemo({ focus, scrim, initialOpen }: { focus: "cancel" | "confirm"; scrim: SheetScrim; initialOpen?: string }) {
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {KINDS.map(({ k, opener }, i) => (
          <Button key={k.kind} variant={i === 0 ? "default" : "outline"} onClick={() => setOpen(k.kind)}>
            {opener}
          </Button>
        ))}
        <Button variant="outline" onClick={() => setOpen("error")}>
          Verify (the server refuses)
        </Button>
      </div>
      <p role="status" className="h-5 text-sm text-text-secondary">
        {done ? `Recorded: ${done}. The result stays on the screen (UX-D-04).` : ""}
      </p>
      {KINDS.map(({ k, unlocks }) => (
        <ConfirmDialog
          key={k.kind}
          {...confirmCopy(k)}
          unlocks={unlocks}
          focus={focus}
          scrim={scrim}
          open={open === k.kind}
          onOpenChange={(o) => setOpen(o ? k.kind : null)}
          onConfirm={async () => {
            await wait();
            setDone(confirmCopy(k).confirmLabel);
          }}
        />
      ))}
      <ConfirmDialog
        {...confirmCopy(KINDS[0]!.k)}
        focus={focus}
        scrim={scrim}
        open={open === "error"}
        onOpenChange={(o) => setOpen(o ? "error" : null)}
        onConfirm={async () => {
          await wait();
          return { error: "The scan is no longer waiting. Another Coordinator checked it." };
        }}
      />
    </div>
  );
}

// ——— Side sheet with a form (C2 "Add a Student") and the one feedback contract ———

type SheetFormState = { state: FormFeedbackState; emailError?: string };

function AddStudentForm({ fieldError, onChange }: { fieldError?: boolean; onChange: (s: SheetFormState) => void }) {
  const [s, set] = useState<SheetFormState>({ state: { status: "idle" } });
  const update = (n: SheetFormState) => (set(n), onChange(n));
  return (
    <form
      id="add-student"
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (s.state.status === "pending") return;
        const name = String(new FormData(e.currentTarget).get("name") || "Ella Bautista");
        update({ state: { status: "pending" } });
        await wait();
        update(
          fieldError
            ? { state: { status: "idle" }, emailError: "This email already has an account. Use another email." }
            : { state: { status: "done", message: `Account created for ${name}. Milestone 1 is open.` } },
        );
      }}
    >
      <FormField label="Full name" id="s-name">
        <input name="name" defaultValue="Ella Bautista" className={control.input} />
      </FormField>
      <FormField label="Email" id="s-email" hint="The Student signs in with this email." error={s.emailError}>
        <input name="email" type="email" defaultValue="ella.bautista@example.test" className={control.input} />
      </FormField>
      <FormField label="Degree level" id="s-degree">
        <select name="degree" className={control.select} defaultValue="masters">
          <option value="masters">Master&apos;s</option>
          <option value="doctoral">Doctoral</option>
        </select>
      </FormField>
      <FormField label="Working thesis title" id="s-title" hint="The Student can edit the title until Gate 1b.">
        <textarea name="title" rows={3} className={control.textarea} defaultValue="Edge inference of crop disease on low-power microcontrollers" />
      </FormField>
      <FormFeedback state={s.state} id="add-student" lines={2} />
    </form>
  );
}

export function SideSheetDemo({ width, scrim, defaultOpen, fieldError }: { width: SheetWidth; scrim: SheetScrim; defaultOpen?: boolean; fieldError?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [form, setForm] = useState<SheetFormState>({ state: { status: "idle" } });
  return (
    <SideSheet
      title="Add a Student"
      width={width}
      scrim={scrim}
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>Add a Student</Button>}
      footer={
        <>
          <PendingButton form="add-student" pending={form.state.status === "pending"} label="Create account" pendingLabel="Saving…" />
          <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
        </>
      }
    >
      <AddStudentForm fieldError={fieldError} onChange={setForm} />
    </SideSheet>
  );
}

// ——— The one form-feedback contract: small action (toast) and workflow action (on screen) ———

function SmallActionForm() {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  return (
    <form
      className="flex w-[300px] flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        await wait();
        setPending(false);
        toast.show({ label: "Availability published.", tone: "done", glyph: "calendar" });
      }}
    >
      <FormField label="Available from" id="avail-from" hint="Students see the slots you publish." lines={2}>
        <input type="time" defaultValue="09:00" className={control.input} />
      </FormField>
      <FormFeedback state={{ status: "idle" }} id="avail" lines={2} />
      <PendingButton pending={pending} label="Publish" pendingLabel="Publishing…" variant="outline" />
    </form>
  );
}

function WorkflowForm() {
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  return (
    <form
      className="flex w-[300px] flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: "pending" });
        await wait();
        setState({ status: "done", message: "Committee appointed. Sign TDW 06 and upload the scan." });
      }}
    >
      <FormField label="Lead Panel Member" id="lead">
        <select className={control.select} defaultValue="1">
          <option value="1">Dr. Rosa Villanueva</option>
          <option value="2">Engr. Paolo Cruz</option>
        </select>
      </FormField>
      <FormFeedback state={state} id="appoint" lines={2} />
      <PendingButton pending={state.status === "pending"} label="Mark appointed" pendingLabel="Saving…" />
    </form>
  );
}

function FieldErrorForm() {
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="flex w-[300px] flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        await wait();
        setPending(false);
        setError("This email already has an account. Use another email.");
      }}
    >
      <FormField label="Email" id="fe-email" hint="Use the university email." error={error} lines={2}>
        <input type="email" defaultValue="dino.aquino@example.test" className={control.input} />
      </FormField>
      <FormFeedback state={{ status: "idle" }} id="fe" lines={2} />
      <PendingButton pending={pending} label="Create account" pendingLabel="Saving…" />
    </form>
  );
}

export function FormContractDemo() {
  return (
    <ToastProvider>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground">Small action: a toast (UX-D-04)</p>
          <SmallActionForm />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground">Workflow action: the result stays on the screen</p>
          <WorkflowForm />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground">Server error that names a field: under the field</p>
          <FieldErrorForm />
        </div>
      </div>
    </ToastProvider>
  );
}

export function BlockedRowActionSample() {
  return (
    <BlockedAction size="compact" variant="secondary" reason="Opens at Gate 1b.">
      Confirm date
    </BlockedAction>
  );
}
