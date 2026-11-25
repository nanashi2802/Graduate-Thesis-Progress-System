"use client";
import { ActionForm, Field, fieldClass } from "../_lib/form-parts";
import { saveTemplateAction, setTargetDateAction } from "./actions";

type Version = {
  versionNo: number;
  minNoticeDays: number;
  printedCopiesDueDays: number;
  panelSizeMasters: number;
  panelSizeDoctoral: number;
  printedCopiesMasters: number;
  printedCopiesDoctoral: number;
  reviewerWaitDays: number | null;
  adviseeLimit: number | null;
};
type Rubric = { code: string; label: string; weightPct: number };

export function TemplateForm({ code, version, rubric }: { code: string; version: Version; rubric: Rubric[] }) {
  const id = (k: string) => `${code}-${k}`;
  const sizeLabel =
    code === "final" ? "Panel Members besides the Panel Chair" : "Panel Members besides the Adviser";
  const num = (key: keyof Version, label: string, hint?: string) => (
    <Field label={label} htmlFor={id(key)} hint={hint}>
      <input
        id={id(key)}
        name={key}
        type="number"
        min={key === "reviewerWaitDays" ? 0 : key === "adviseeLimit" ? 1 : undefined}
        defaultValue={version[key] ?? ""}
        required={key !== "reviewerWaitDays" && key !== "adviseeLimit"}
        className={fieldClass}
      />
    </Field>
  );
  return (
    <ActionForm action={saveTemplateAction} submit="Save as a new version">
      <input type="hidden" name="code" value={code} />
      <div className="grid gap-4 sm:grid-cols-2">
        {num("panelSizeMasters", `${sizeLabel} (Master's)`)}
        {num("panelSizeDoctoral", `${sizeLabel} (Doctoral)`)}
        {num("printedCopiesMasters", "Printed copies (Master's)")}
        {num("printedCopiesDoctoral", "Printed copies (Doctoral)")}
        {num("minNoticeDays", "Minimum notice after Gate 1b (days)", "BR-09: at least 7.")}
        {num("printedCopiesDueDays", "Printed copies due before the defense (days)")}
        {num("reviewerWaitDays", "Reviewer wait threshold (days)", "Empty means no threshold.")}
        {code === "proposal"
          ? num("adviseeLimit", "Advisee limit", "Empty means Off. An Adviser over the limit gets a flag. It never blocks an action (BR-17).")
          : null}
      </div>
      {rubric.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-foreground">Rubric weights (%). They must total 100%.</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {rubric.map((r) => (
              <Field key={r.code} label={`${r.code} ${r.label}`} htmlFor={id(`w-${r.code}`)}>
                <input
                  id={id(`w-${r.code}`)}
                  name={`weight-${r.code}`}
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={r.weightPct}
                  required
                  className={fieldClass}
                />
              </Field>
            ))}
          </div>
        </fieldset>
      ) : null}
      <Field label="Change note" htmlFor={id("note")} hint="The system logs this note with the new version (FR-TPL-04).">
        <input id={id("note")} name="changeNote" required className={fieldClass} />
      </Field>
    </ActionForm>
  );
}

export function TargetDateForm({ milestoneId, targetDate, label }: { milestoneId: string; targetDate: string | null; label: string }) {
  return (
    <ActionForm action={setTargetDateAction} submit="Save" variant="outline" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <Field label={label} htmlFor={`td-${milestoneId}`}>
        <input id={`td-${milestoneId}`} name="targetDate" type="date" defaultValue={targetDate ?? ""} className={fieldClass} />
      </Field>
    </ActionForm>
  );
}
