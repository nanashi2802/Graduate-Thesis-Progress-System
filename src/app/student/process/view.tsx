// The markup of the Thesis process screen (PROCESS, design/screens/PROCESS.md, FR-TRK-01, FR-DOC-01, Task R4.3).
// `page.tsx` (R4.6, after gate UX-P-04) loads the data and passes it here. /lab renders this view with mock props.
// This file composes patterns only and imports nothing from src/server except types (IMPLEMENTATION_PLAN.md §2).
// No action on this page except form downloads. Stage 0 is not a step. Only the Student's degree level (G2).
import { Glyph } from "@/components/patterns/glyphs";
import { formLabel } from "@/components/patterns/status";
import { StepByStep } from "@/components/patterns/step-by-step";
import { Stepper } from "@/components/patterns/stepper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { processSteps, type DegreeLevel, type ProcessActivity, type ProcessForm, type ProcessPosition } from "./steps";

export type ProcessViewProps = {
  degreeLevel: DegreeLevel;
  position: ProcessPosition;
  /** The link of a blank form (decision R4-b). Leave it out to show the forms with no download (R4-b C). */
  formHref?: (code: string) => string;
  /** R4-d, passed to the step-by-step pattern. */
  phone?: "accordion" | "current";
};

const DEGREE: Record<DegreeLevel, string> = { masters: "Master's", doctoral: "Doctoral" };
const KIND_GLYPH = { gate: "gate", defense: "defense" } as const;

function Activities({ items }: { items: ProcessActivity[] }) {
  return (
    <ol className="flex flex-col divide-y divide-border border-y border-border">
      {items.map((a, i) => (
        <li key={i} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <span className="text-sm font-medium text-muted-foreground">{a.who}</span>
          <span className={cn("flex items-start gap-2 text-base text-foreground", (a.kind === "gate" || a.kind === "defense") && "font-medium")}>
            {a.kind === "gate" || a.kind === "defense" ? <Glyph name={KIND_GLYPH[a.kind]} size={20} className="mt-0.5 shrink-0 text-primary" /> : null}
            <span className="min-w-0">
              {a.text}
              {a.kind === "outside" ? (
                <span className="ml-2 inline-flex items-center rounded-full border border-dashed border-divider-strong px-2 py-px align-middle text-[0.8rem] leading-4 font-medium text-muted-foreground">
                  Outside office
                </span>
              ) : null}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Forms({ forms, formHref }: { forms: ProcessForm[]; formHref?: (code: string) => string }) {
  if (forms.length === 0) {
    return <p className="text-sm text-muted-foreground">This step has no TDW forms. You upload the clearance evidence on the Clearance page.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {forms.map((f) => (
        <li key={f.code} className="flex min-h-(--row-h-comfortable) flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="flex min-w-0 items-baseline gap-3">
            <span className="shrink-0 font-mono text-sm text-foreground">{formLabel(f.code)}</span>
            <span className="text-base text-foreground">{f.name}</span>
          </span>
          {formHref ? (
            <a href={formHref(f.code)} download className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 self-start sm:self-auto")}>
              Download form<span className="sr-only">, {formLabel(f.code)} {f.name}, Word file</span>
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ProcessView({ degreeLevel, position, formHref, phone }: ProcessViewProps) {
  const steps = processSteps(degreeLevel);
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Thesis process</h1>
        <p className="text-base text-muted-foreground">{DEGREE[degreeLevel]}</p>
      </header>
      {/* Below 640 px the four labels do not fit; the step list under it shows the same path (G3). */}
      <Stepper current={position.current ?? 4} completed={position.completed} className="max-sm:hidden" />
      <StepByStep
        phone={phone}
        steps={steps.map((s, i) => ({
          id: s.id,
          title: s.title,
          meta: s.meta,
          current: position.current === i + 1,
          done: position.completed.includes(i + 1),
          body: (
            <div className="flex flex-col gap-5">
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-text-secondary">What happens, in order</h3>
                <Activities items={s.activities} />
              </section>
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-text-secondary">Forms</h3>
                <Forms forms={s.forms} formHref={formHref} />
              </section>
            </div>
          ),
        }))}
      />
    </div>
  );
}
