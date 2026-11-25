// Source: GOV.UK notification banner, own (DESIGN.md §5.3). The first card of a record screen.
// Row 1: where am I ("Step 2 of 4", the milestone, the status). Row 2: what blocks me.
// Row 3: what can I do now: one primary action, and a direct form link when the step needs a form.
import Link from "next/link";
import type { ReactNode } from "react";
import { MilestoneStatusPill } from "@/components/patterns/status";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/server/domain/milestone";

export const NOTHING_BLOCKS = "Nothing blocks this step.";

export type DocketProps = {
  step: 1 | 2 | 3 | 4;
  milestone: string;
  status: MilestoneStatus;
  /** One short reason from SITEMAP §9. `null` when nothing blocks. */
  blocker: string | null;
  /** The one primary action. */
  action: ReactNode;
  formLink?: { href: string; label: string };
  /** The "See the whole process" link (first day on S1). */
  processLink?: boolean;
  className?: string;
};

export function Docket({ step, milestone, status, blocker, action, formLink, processLink = false, className }: DocketProps) {
  const blocked = blocker !== null && blocker.trim() !== "";
  return (
    <section
      data-slot="docket"
      aria-label="Current step"
      className={cn("flex flex-col gap-4 rounded-card border border-border bg-card p-6", className)}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-base font-semibold text-foreground">
          Step {step} of 4 · {milestone}
        </p>
        <MilestoneStatusPill status={status} />
      </div>
      <p data-slot="docket-blocker" className={cn("text-base", blocked ? "text-foreground" : "text-muted-foreground")}>
        {blocked ? (
          <>
            <span className="font-semibold">Blocks: </span>
            {blocker}
          </>
        ) : (
          NOTHING_BLOCKS
        )}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {action}
        {formLink ? (
          <a className="text-sm text-link underline-offset-4 hover:underline" href={formLink.href} download>
            {formLink.label}
          </a>
        ) : null}
        {processLink ? (
          <Link className="text-sm text-link underline-offset-4 hover:underline" href="/student/process">
            See the whole process
          </Link>
        ) : null}
      </div>
    </section>
  );
}
