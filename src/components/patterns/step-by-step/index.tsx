"use client";
// Source: GOV.UK step-by-step navigation (DESIGN.md §7.4 `step-by-step`, §8.2), FR-TRK-01, Task R4.2. Screen: PROCESS.
// An ordered list of steps with a vertical line. Each step heading is a heading with a disclosure button inside
// (aria-expanded, aria-controls). "You are here" marks the current step (aria-current="step"); it starts expanded.
// The other steps start collapsed. "Show all steps" opens or closes every step.
// Step marks follow the stepper (F5, UX-D-11 item 2): a done step is a maroon circle with the white `done` glyph;
// the current step is gold with a maroon edge; a later step is an outline circle with its number.
// Phone (decision R4-d): A the same accordion, full width (default); B only the current step below 640 px, with
// "Show all steps" to show the rest.
import { useId, useState, type ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

export type Step = {
  id: string;
  title: string;
  current: boolean;
  done: boolean;
  /** What happens in the step. Lists, forms: the screen composes it. */
  body: ReactNode;
  /** One short line under the title, for example "Milestone 1". */
  meta?: string;
};

export type StepByStepProps = {
  steps: Step[];
  /** R4-d: "accordion" (A, default) or "current" (B). */
  phone?: "accordion" | "current";
  headingLevel?: 2 | 3;
  className?: string;
};

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

function Mark({ n, step }: { n: number; step: Step }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-1 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold",
        step.done && "border-primary bg-primary text-primary-foreground",
        !step.done && step.current && "border-2 border-primary bg-progress text-foreground",
        !step.done && !step.current && "border-divider-strong bg-card text-muted-foreground",
      )}
    >
      {step.done ? (
        <span data-glyph="done" className="inline-flex">
          <Glyph name="done" size={20} />
        </span>
      ) : (
        n
      )}
    </span>
  );
}

export function StepByStep({ steps, phone = "accordion", headingLevel = 2, className }: StepByStepProps) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(() => new Set(steps.filter((s) => s.current).map((s) => s.id)));
  // R4-d B: below 640 px only the current step shows until the Student asks for all of them.
  const [phoneAll, setPhoneAll] = useState(false);
  const allOpen = steps.every((s) => open.has(s.id));
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => {
    setOpen(allOpen ? new Set() : new Set(steps.map((s) => s.id)));
    setPhoneAll(true);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex">
        <button
          type="button"
          data-slot="step-toggle-all"
          onClick={toggleAll}
          className={cn("min-h-11 rounded-control text-sm font-medium text-link underline-offset-4 hover:underline", FOCUS)}
        >
          {allOpen ? "Hide all steps" : "Show all steps"}
        </button>
      </div>
      <ol data-slot="step-by-step" className="flex flex-col">
        {steps.map((step, i) => {
          const isOpen = open.has(step.id);
          const bodyId = `${baseId}-${step.id}`;
          const last = i === steps.length - 1;
          const phoneHidden = phone === "current" && !step.current && !phoneAll;
          return (
            <li
              key={step.id}
              data-slot="step"
              data-state={step.done ? "done" : step.current ? "current" : "later"}
              aria-current={step.current ? "step" : undefined}
              className={cn("relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4", phoneHidden && "max-sm:hidden")}
            >
              {/* The line between the step marks. Maroon after a done step, as in the stepper (DESIGN.md §8.2). */}
              {!last ? (
                <span aria-hidden="true" className={cn("absolute top-8 bottom-0 left-4 w-px -translate-x-1/2", step.done ? "bg-primary" : "bg-divider-strong")} />
              ) : null}
              <Mark n={i + 1} step={step} />
              <div className={cn("flex min-w-0 flex-col", last ? "pb-0" : "pb-6")}>
                <Heading className="text-lg leading-8 font-semibold text-foreground">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={() => toggle(step.id)}
                    className={cn("-mx-1 flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-control px-1 text-left hover:text-foreground", FOCUS)}
                  >
                    <span>{step.title}</span>
                    {step.current ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-tone-achieved-line bg-tone-achieved-bg px-2.5 py-0.5 text-sm leading-5 font-semibold text-tone-achieved-fg">
                        You are here
                      </span>
                    ) : null}
                    {step.done ? <span className="text-sm font-medium text-muted-foreground">Done</span> : null}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-link">
                      {isOpen ? "Hide" : "Show"}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn("transition-transform duration-(--motion-state) motion-reduce:transition-none", !isOpen && "-rotate-90")}
                      >
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </span>
                  </button>
                </Heading>
                {step.meta ? <p className="text-sm text-muted-foreground">{step.meta}</p> : null}
                <div id={bodyId} hidden={!isOpen || undefined} className="pt-3">
                  {step.body}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
