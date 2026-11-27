"use client";
// Source: GOV.UK form, own (DESIGN.md §7.4 `defense-form`), design/screens/A5.md, P4.md, FR-DEF-05, FR-DEF-06, BR-01,
// BR-15, F4, UX-023, UX-025, Task R6.3. R6-b A: a verified or closed sheet shows its values as text with a `done`
// stamp. R6-d A: each score is a number field with 48 px minus and plus buttons (Base UI NumberField).
// The total is the plain sum, an ink number: no grade, no grade word, no color on a score. The paper line shows once,
// after a save (BR-01, G4). No autosave (AGENTS.md §9): only the Save button saves.
// The inputs are named `score_<id>`, so the form data fits `saveSheetAction` as it is. Comments and Action Taken
// come from the page as `children`, inside the same form.
import { NumberField } from "@base-ui/react/number-field";
import { useId, useState, useTransition, type ReactNode } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

export const SAVED_LINE = "Saved. Sign the paper sheet.";
const NOT_SAVED = "The sheet was not saved. Try again.";

export type DefenseRow = { id: string; code: string; name: string; weight: number; score: number | null };

const round2 = (n: number) => Math.round(n * 100) / 100;
/** The plain sum of the scores. An empty score counts as nothing. */
export const sheetTotal = (rows: readonly Pick<DefenseRow, "score">[]) => round2(rows.reduce((sum, r) => sum + (r.score ?? 0), 0));

export type DefenseFormProps = {
  rows: readonly DefenseRow[];
  /** edit: the form. verified: the Coordinator verified the sheet. closed: the defense is closed. */
  mode: "edit" | "verified" | "closed";
  /** The server action with the form data. Called only by the Save button. */
  onSave: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  /** Why Save is blocked (BR-18, SITEMAP §9 words). */
  blockedReason?: string;
  submitLabel?: string;
  /** The form name, for example "TDW 08 Proposal evaluation". */
  legend?: string;
  /** Comments and Action Taken, inside the form. In a read-only mode, the page passes text, not fields. */
  children?: ReactNode;
};

const STAMP = { verified: "Verified by the Coordinator", closed: "The defense is closed" } as const;
// The stepper is one control: its focus ring sits outside the whole group, like every field (DESIGN.md §10: a 2 px
// maroon outline, 2 px out, with the soft ring). The input draws no ring of its own: inside the group, an inner
// outline lands on the button borders, and `overflow-hidden` cuts the soft ring on one side.
const FOCUS_WITHIN =
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-ring has-[input:focus-visible]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ring)_22%,transparent)]";
const STEP_BUTTON =
  "inline-flex size-12 shrink-0 items-center justify-center bg-card text-lg text-foreground outline-none hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:text-muted-foreground";

export function DefenseForm({ rows, mode, onSave, blockedReason, submitLabel = "Save my evaluation", legend = "Evaluation", children }: DefenseFormProps) {
  const formId = useId();
  const [scores, setScores] = useState<Record<string, number | null>>(() => Object.fromEntries(rows.map((r) => [r.id, r.score])));
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [pending, start] = useTransition();
  const max = rows.reduce((sum, r) => sum + r.weight, 0);
  const current = rows.map((r) => ({ ...r, score: scores[r.id] ?? null }));
  const readOnly = mode !== "edit";

  const total = (
    <p data-slot="sheet-total" className="flex items-baseline gap-2 text-base text-foreground">
      <span className="font-semibold">Total</span>
      <span className="font-mono text-xl font-semibold tabular-nums">{sheetTotal(current)}</span>
      <span className="text-muted-foreground">of {max}</span>
    </p>
  );

  if (readOnly) {
    return (
      <section data-slot="defense-form" data-mode={mode} aria-label={legend} className="flex flex-col gap-4">
        <p data-slot="sheet-stamp" className="inline-flex w-fit items-center gap-2 rounded-stamp border border-tone-done-line bg-tone-done-bg px-2 py-1 text-sm font-medium text-tone-done-fg">
          <Glyph name="done" size={16} />
          {STAMP[mode]}
        </p>
        <dl className="flex flex-col divide-y divide-border border-y border-border">
          {current.map((r) => (
            <div key={r.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-3 py-3 text-sm">
              <dt className="contents">
                <span className="font-mono text-muted-foreground">{r.code}</span>
                <span className="text-foreground">{r.name}</span>
              </dt>
              <dd className="m-0 flex items-baseline gap-1 justify-self-end">
                <span data-slot="sheet-score" className={cn("font-mono tabular-nums", r.score === null ? "text-muted-foreground" : "text-foreground")}>
                  {r.score === null ? "Not entered" : r.score}
                </span>
                <span className="text-muted-foreground">of {r.weight}</span>
              </dd>
            </div>
          ))}
        </dl>
        {total}
        {children}
      </section>
    );
  }

  const save = (data: FormData) =>
    start(async () => {
      setState({ status: "pending" });
      const res = await onSave(data).catch(() => ({ ok: false, error: NOT_SAVED }));
      setState(res.ok ? { status: "done", message: SAVED_LINE } : { status: "error", message: res.error ?? NOT_SAVED });
    });

  return (
    <form
      data-slot="defense-form"
      data-mode={mode}
      aria-label={legend}
      className="flex flex-col gap-4"
      // The steppers move by 1, and Base UI puts step="1" on its hidden number input, so the browser would refuse a
      // score like 12.5 and block the submit with no message. The server checks each score (0 to its weight).
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (pending || blockedReason !== undefined) return;
        save(new FormData(e.currentTarget));
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">{legend}: each score from 0 to its weight</legend>
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {rows.map((r) => {
            const inputId = `${formId}-${r.id}`;
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <label htmlFor={inputId} className="flex min-w-0 flex-1 items-baseline gap-3 text-sm">
                  <span className="w-12 shrink-0 font-mono text-muted-foreground">{r.code}</span>
                  <span className="text-foreground">{r.name}</span>
                </label>
                <div className="flex items-center gap-2">
                  <NumberField.Root
                    id={inputId}
                    name={`score_${r.id}`}
                    value={scores[r.id] ?? null}
                    onValueChange={(v) => setScores((s) => ({ ...s, [r.id]: v }))}
                    min={0}
                    max={r.weight}
                    step={1}
                    format={{ maximumFractionDigits: 2 }}
                  >
                    <NumberField.Group data-slot="score-stepper" className={cn("flex h-12 overflow-hidden rounded-control border border-input", FOCUS_WITHIN)}>
                      <NumberField.Decrement aria-label={`Decrease score for ${r.code}`} className={cn(STEP_BUTTON, "border-r border-input")}>
                        −
                      </NumberField.Decrement>
                      <NumberField.Input className="h-12 w-20 bg-background text-center font-mono text-base text-foreground tabular-nums outline-none focus-visible:shadow-none focus-visible:outline-none" />
                      <NumberField.Increment aria-label={`Increase score for ${r.code}`} className={cn(STEP_BUTTON, "border-l border-input")}>
                        +
                      </NumberField.Increment>
                    </NumberField.Group>
                  </NumberField.Root>
                  <span className="w-12 text-sm text-muted-foreground">of {r.weight}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {total}
      {children}
      <div className="flex flex-col gap-1">
        {blockedReason !== undefined ? (
          <BlockedAction type="submit" size="defense" reason={blockedReason}>
            {submitLabel}
          </BlockedAction>
        ) : (
          <PendingButton pending={pending} label={submitLabel} pendingLabel="Saving…" size="defense" className="w-fit" />
        )}
        <FormFeedback state={state} id={formId} lines={2} />
      </div>
    </form>
  );
}
