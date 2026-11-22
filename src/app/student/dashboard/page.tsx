// `/student/dashboard` (S1): the thesis tracker (FR-TRK-01, FR-TRK-05, NFR-04, BR-17, BR-18).
// The Docket is the next-action card. The other regions are ruled sections, not cards (DESIGN.md §5.2, §5.3).
// The residency indicator waits for the residency rule (R7). The portal layout checks the role.
import Link from "next/link";
import { CircleCheck, CircleDashed } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Docket } from "@/components/docket";
import { MilestoneStepper, type StepperStageIndex } from "@/components/milestone-stepper";
import { MilestoneStatusPill, OutsideChip } from "@/components/status";
import { buttonVariants } from "@/components/ui/button";
import { getSessionState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { submissionFor } from "@/server/data/manuscript";
import { studentTracker } from "@/server/data/tracker";
import type { MilestoneCode } from "@/server/domain/milestone";

const STAGE: Record<MilestoneCode, StepperStageIndex> = { proposal: 0, pre_final: 1, final: 2 };
const MILESTONE_LABEL: Record<MilestoneCode, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };
const WHO: Record<string, string> = {
  student: "You act.",
  adviser: "Your Adviser acts.",
  coordinator: "The Coordinator acts.",
  panel_member: "A Panel Member acts.",
  committee: "Your Adviser and Panel Members act.",
  none: "No one acts now.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default async function Page() {
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const t = await studentTracker(ctx);
  if (!t) {
    return (
      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <EmptyState title="Your thesis record is not open yet." detail="The Coordinator opens it when your account is ready." />
      </main>
    );
  }

  const { current, next } = t;
  const cleared = current.status === "CLEARED";
  const stage: StepperStageIndex = current.status === "FINAL_APPROVED" ? 3 : STAGE[current.code];
  // The primary action goes to the page that holds it. The manuscript space is made on first use (FR-REV-01).
  let href: string | null = null;
  if (next.action === "Open the manuscript") href = `/student/pr/${(await submissionFor(ctx, current.milestoneId)).pr.id}`;
  else if (next.action === "Choose a date") href = "/student/schedule";
  else if (next.action === "Open documents") href = "/student/documents";
  else if (next.action === "Open clearance") href = "/student/clearance";

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-base font-medium">{t.identity.title ?? "Your thesis"}</p>
        <p className="text-sm text-muted-foreground">
          {t.identity.degreeLevel === "masters" ? "Master's" : "Doctoral"} · Adviser {t.identity.adviserName}
          {t.identity.committeeNames.length > 0 ? ` · Committee: ${t.identity.committeeNames.join(", ")}` : ""}
        </p>
      </header>

      <Docket
        label="Next action"
        where={
          <>
            <MilestoneStepper current={stage} allDone={cleared} />
            <MilestoneStatusPill status={current.status} milestone={current.code} />
          </>
        }
        // A waiting step names the wait. An acting step blocks nothing (BR-18).
        blocker={next.action === null ? `${next.text} ${WHO[next.actor]}` : undefined}
        actions={
          next.action !== null ? (
            href ? (
              <Link href={href} className={buttonVariants()}>
                {next.action}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">{next.text}</span>
            )
          ) : undefined
        }
      />
      {next.action !== null && href ? <p className="-mt-8 max-w-[72ch] text-base">{next.text}</p> : null}

      <Section title={`Readiness · ${MILESTONE_LABEL[current.code]}`}>
        {t.checklist.length === 0 ? (
          <EmptyState title="No checklist for this step." detail="The list appears when a defense date is near." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {t.checklist.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                {i.done ? <CircleCheck aria-hidden="true" className="size-4 text-tone-done-fg" /> : <CircleDashed aria-hidden="true" className="size-4 text-muted-foreground" />}
                <span>{i.label}</span>
                <span className="ml-auto text-muted-foreground">{i.done ? "Done" : "Not done"}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Outside statuses">
        <div className="flex flex-wrap gap-3">
          <OutsideChip kind="ethics" value={t.outside.ethics} />
          <OutsideChip kind="ipmo" value={t.outside.ipmo} />
          <OutsideChip kind="rpo" value={t.outside.rpo} />
          <OutsideChip kind="copyright" value={t.outside.copyright} />
        </div>
        <p className="text-sm text-muted-foreground">The Coordinator sets these. You cannot change them.</p>
      </Section>

      {t.defense ? (
        <Section title="Defense">
          <dl className="grid max-w-[640px] grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Date</dt>
            <dd>{t.defense.date}</dd>
            <dt className="text-muted-foreground">Room or link</dt>
            <dd>{t.defense.roomOrLink ?? "Not set"}</dd>
            <dt className="text-muted-foreground">Printed copies due</dt>
            <dd>{t.defense.printedCopiesDue}</dd>
          </dl>
        </Section>
      ) : null}

      <Section title="Key dates">
        <dl className="grid max-w-[640px] grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Earliest defense date</dt>
          <dd>{t.keyDates.earliestDefenseDate ?? "After Gate 1b"}</dd>
          <dt className="text-muted-foreground">Printed copies due</dt>
          <dd>{t.keyDates.printedCopiesDue ?? "After the date is confirmed"}</dd>
          <dt className="text-muted-foreground">Target date</dt>
          <dd>{t.keyDates.targetDate ?? "Not set"}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">These dates are information. They never block an action.</p>
      </Section>
    </main>
  );
}
