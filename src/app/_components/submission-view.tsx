// The shared submission view (SV): one read-only record of one milestone, on four routes (FR-SUB-01 to FR-SUB-05).
// It holds no gate or edit action. It links to the user's own workspace (FR-SUB-04). The manuscript opens there (AD-B-025).
import type { UserRole } from "@/server/data/schema";
import Link from "next/link";
import { AccessDenied } from "@/app/_components/access-denied";
import { pst } from "@/app/_lib/format";
import { EmptyState } from "@/components/empty-state";
import { MilestoneStatusPill } from "@/components/status";
import { getRoleState } from "@/server/auth/session";
import { AccessDeniedError, type DataContext } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { submissionView } from "@/server/data/submission-view";

const NAME = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" } as const;
const OWN_PR = { student: "/student/pr", adviser: "/adviser/pr", panel_member: "/panel/pr" } as const;

export async function SubmissionViewScreen({ portal, milestoneId }: { portal: UserRole; milestoneId: string }) {
  const state = await getRoleState(portal);
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx: DataContext = { db: getDb(), actor: state.actor };
  const role = ctx.actor.role;

  let v: Awaited<ReturnType<typeof submissionView>>;
  try {
    v = await submissionView(ctx, milestoneId);
  } catch (e) {
    if (e instanceof AccessDeniedError)
      return <AccessDenied reason={role === "panel_member" ? "You cannot open this record. Panel Members need the verified appointment form and their own verified NDA." : "You cannot open this record. It belongs to another thesis."} />;
    if (e instanceof InputProblem) return <main className="mx-auto max-w-[960px] px-4 py-8"><EmptyState title="This record was not found." detail="Go back to your dashboard and open it from there." /></main>;
    throw e;
  }
  if (!v.open)
    return <main className="mx-auto max-w-[960px] px-4 py-8"><EmptyState title={`The ${NAME[v.milestone]} record is not open yet.`} detail={v.reason} /></main>;

  const own = role === "coordinator" ? null : v.prId ? `${OWN_PR[role]}/${v.prId}${v.lockedCommit ? `?commit=${v.lockedCommit.ordinal}` : ""}` : null;
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{NAME[v.milestone]}: submission record</h1>
        <MilestoneStatusPill status={v.status} />
      </header>
      {role === "coordinator" && <a className="text-sm underline" href={`/coordinator/dossier/${v.thesisId}`} download>Export the Student dossier (JSON, with index)</a>}

      <section aria-labelledby="sv-ms" className="flex flex-col gap-1">
        <h2 id="sv-ms" className="text-base font-semibold">Locked manuscript</h2>
        {v.lockedCommit ? <p className="text-sm">Commit v{v.lockedCommit.ordinal} is the commit that Gate 1b locked.</p> : <p className="text-sm text-muted-foreground">No locked commit is on record.</p>}
        {own ? <Link className="text-sm underline" href={own}>Open it in your workspace</Link> : <p className="text-sm text-muted-foreground">The Coordinator reads the manuscript in the student record.</p>}
      </section>

      <section aria-labelledby="sv-gates" className="flex flex-col gap-1">
        <h2 id="sv-gates" className="text-base font-semibold">Gate record</h2>
        <ul className="text-sm">{v.gates.map((g, i) => <li key={i}>{g.gate}: {g.result}, {pst(g.at)}</li>)}</ul>
      </section>

      <section aria-labelledby="sv-docs" className="flex flex-col gap-1">
        <h2 id="sv-docs" className="text-base font-semibold">Document checklist</h2>
        <ul className="text-sm">{v.checklist.map((d) => <li key={d.requiredItemId}>{d.formCode} {d.label}: {d.records.length ? [...new Set(d.records.map((r) => r.state))].join(", ") : "not started"}</li>)}</ul>
      </section>

      <section aria-labelledby="sv-def" className="flex flex-col gap-1">
        <h2 id="sv-def" className="text-base font-semibold">Defense</h2>
        {v.defense?.scheduledStartAt ? <p className="text-sm">{pst(v.defense.scheduledStartAt)}, {v.defense.roomOrLink ?? "room or link not set"}</p> : <p className="text-sm text-muted-foreground">No defense date is confirmed yet.</p>}
      </section>

      <section aria-labelledby="sv-th" className="flex flex-col gap-1">
        <h2 id="sv-th" className="text-base font-semibold">Comments</h2>
        <p className="text-sm">{v.threads.open} open and {v.threads.resolved} resolved threads. {v.documentComments} document comments.</p>
      </section>

      <section aria-labelledby="sv-min" className="flex flex-col gap-1">
        <h2 id="sv-min" className="text-base font-semibold">Minutes</h2>
        {v.minutes ? <p className="whitespace-pre-wrap text-sm">{v.minutes.body}</p> : <p className="text-sm text-muted-foreground">The Minutes show after the stage closes.</p>}
      </section>
    </main>
  );
}
