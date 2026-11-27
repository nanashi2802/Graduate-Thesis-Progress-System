"use client";
// Source: own (DESIGN.md §7.4 `verdict`), design/screens/P4.md, C6.md, FR-DEF-07, FR-REV-12, BR-17, BR-18, F2, F4,
// Task R6.4. Each member's total (an ink number) and Action Taken, then the verdict control.
// A sheet that is not saved is a flag: it never blocks the record control (F2, BR-17). An Action Taken that differs
// from the recorded verdict is a flag on that row (FR-DEF-07). R6-c A: the panel refreshes every 30 s while it is
// mounted, shows "Updated hh:mm PHT" and has a Refresh button. R6-b A: after the close, the recorded verdict shows as
// text with a `done` stamp, with no control. Record verdict asks once more (R3-h A, BR-19).
import { useEffect, useId, useState } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { ConfirmDialog, confirmCopy } from "@/components/patterns/dialog";
import { Flag } from "@/components/patterns/flag";
import { FormFeedback, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { control } from "@/components/patterns/form-field";
import { Glyph } from "@/components/patterns/glyphs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VerdictValue = "approved" | "approved_with_revisions" | "disapproved";
export const VERDICT_LABEL: Record<VerdictValue, string> = {
  approved: "Approved",
  approved_with_revisions: "Approved with Revisions",
  disapproved: "Disapproved",
};

export type VerdictMember = {
  name: string;
  /** Lead Panel Member, Panel Chair, Adviser. */
  designation?: string;
  /** null: the sheet is not saved yet. */
  total: number | null;
  actionTaken: VerdictValue | null;
  /** The Action Taken differs from the recorded verdict (FR-DEF-07). */
  differs?: boolean;
};

export const REFRESH_MS = 30_000;

export const missingLine = (n: number) => (n === 0 ? null : `${n} sheet${n === 1 ? " is" : "s are"} not saved yet.`);

const HHMM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export type VerdictProps = {
  members: readonly VerdictMember[];
  /** The verdict seat may record now. */
  canRecord: boolean;
  /** Why the control is blocked (BR-18), for example "Allowed on or after the defense date." */
  recordReason?: string;
  recorded?: VerdictValue | null;
  /** The defense is closed: read only. */
  closed?: boolean;
  updatedAt: Date;
  /** Load the sheets again (the page: router.refresh()). */
  onRefresh: () => void;
  onRecord: (verdict: VerdictValue) => Promise<{ error?: string } | void>;
  student?: string;
};

export function Verdict({ members, canRecord, recordReason, recorded = null, closed = false, updatedAt, onRefresh, onRecord, student }: VerdictProps) {
  if (!canRecord && !closed && !recordReason?.trim()) throw new Error("Verdict: a blocked record control needs a reason (BR-18).");
  const id = useId();
  const [choice, setChoice] = useState<VerdictValue | "">(recorded ?? "");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const missing = missingLine(members.filter((m) => m.total === null).length);

  useEffect(() => {
    if (closed) return;
    const t = setInterval(onRefresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [closed, onRefresh]);

  const table = (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Saved sheets</caption>
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">Member</th>
          <th scope="col" className="py-2 pr-4 text-right font-medium">Total</th>
          <th scope="col" className="py-2 font-medium">Action Taken</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.name} className="border-b border-border align-top">
            <td className="py-3 pr-4">
              <span className="block text-foreground">{m.name}</span>
              {m.designation ? <span className="block text-[0.8rem] text-muted-foreground">{m.designation}</span> : null}
            </td>
            <td className="py-3 pr-4 text-right">
              <span data-slot="member-total" className={cn("font-mono tabular-nums", m.total === null ? "text-muted-foreground" : "text-foreground")}>
                {m.total === null ? "Not saved" : m.total}
              </span>
            </td>
            <td className="py-3">
              <span className="block text-foreground">{m.actionTaken ? VERDICT_LABEL[m.actionTaken] : "—"}</span>
              {m.differs ? <Flag className="mt-1 text-[0.8rem]">Action Taken differs from the recorded verdict.</Flag> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (closed) {
    return (
      <section data-slot="verdict" data-mode="closed" aria-label="Verdict" className="flex flex-col gap-4">
        {table}
        <p data-slot="verdict-stamp" className="inline-flex w-fit items-center gap-2 rounded-stamp border border-tone-done-line bg-tone-done-bg px-2 py-1 text-sm font-medium text-tone-done-fg">
          <Glyph name="done" size={16} />
          Recorded verdict: {recorded ? VERDICT_LABEL[recorded] : "None"}
        </p>
      </section>
    );
  }

  const copy = confirmCopy({ kind: "verdict", student });
  return (
    <section data-slot="verdict" aria-label="Verdict" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Updated {HHMM.format(updatedAt)} PHT
        </p>
        <Button type="button" variant="outline" size="defense" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      {table}
      {missing ? <Flag>{missing}</Flag> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-verdict`} className="text-sm font-medium text-foreground">
          Collective verdict
        </label>
        <select
          id={`${id}-verdict`}
          value={choice}
          onChange={(e) => setChoice(e.target.value as VerdictValue | "")}
          aria-describedby={state.status === "error" ? `${id}-error` : undefined}
          className={cn(control.select, "h-12 lg:h-12 w-full max-w-sm text-base")}
        >
          <option value="">Choose</option>
          {(Object.keys(VERDICT_LABEL) as VerdictValue[]).map((v) => (
            <option key={v} value={v}>
              {VERDICT_LABEL[v]}
            </option>
          ))}
        </select>
        <BlockedAction
          type="button"
          size="defense"
          reason={canRecord ? undefined : recordReason}
          onClick={() => {
            if (!canRecord) return;
            if (choice === "") {
              setState({ status: "error", message: "Choose a verdict first." });
              return;
            }
            setState({ status: "idle" });
            setOpen(true);
          }}
        >
          Record verdict
        </BlockedAction>
        <FormFeedback state={state} id={id} lines={2} />
      </div>
      <ConfirmDialog
        {...copy}
        open={open}
        onOpenChange={setOpen}
        onConfirm={async () => {
          const res = await onRecord(choice as VerdictValue);
          if (!res?.error) setState({ status: "done", message: `Recorded: ${VERDICT_LABEL[choice as VerdictValue]}.` });
          return res;
        }}
      />
    </section>
  );
}
