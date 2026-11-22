// `/student/defense/[defenseId]` (S5): the defense results after every sheet is verified, the Minutes and the attempt
// history (FR-DEF-11, FR-DEF-12, BR-11, BR-15). No grade equivalent is shown. defenseId is the defense attempt id.
import { AccessDenied } from "@/app/_components/access-denied";
import { pst } from "@/app/_lib/format";
import { EmptyState } from "@/components/empty-state";
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { defensePage, listAttempts } from "@/server/data/defense";

const VERDICT = { approved: "Approved", approved_with_revisions: "Approved with Revisions", disapproved: "Disapproved" } as const;
const NEXT = {
  approved: "No revisions are needed. Your Coordinator prepares the next step.",
  approved_with_revisions: "Revise your manuscript with the Minutes. Your committee accepts the revisions.",
  disapproved: "Your manuscript is open again. Revise it, then ask for a new defense date.",
} as const;

export default async function Page({ params }: PageProps<"/student/defense/[defenseId]">) {
  const { defenseId } = await params;
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  let milestoneId: string;
  try {
    milestoneId = (await defensePage(ctx, defenseId)).milestone.id;
  } catch (e) {
    if (e instanceof AccessDeniedError) return <AccessDenied reason="You cannot open this defense. It belongs to another thesis." />;
    if (e instanceof InputProblem) return <main className="mx-auto max-w-[960px] px-4 py-8"><EmptyState title="This defense was not found." detail="Open it from your dashboard." /></main>;
    throw e;
  }
  const attempts = await listAttempts(ctx, milestoneId);
  const current = attempts.find((a) => a.attempt.id === defenseId);

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Defense results</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">You see the results after the Coordinator verifies every signed sheet.</p>
      </header>

      {current ? (
        <section aria-labelledby="result" className="flex flex-col gap-3">
          <h2 id="result" className="text-lg font-semibold">
            Attempt {current.attempt.attemptNo}
          </h2>
          <p className="text-sm text-muted-foreground">
            {current.attempt.scheduledStartAt ? `${pst(current.attempt.scheduledStartAt)}${current.attempt.roomOrLink ? ` · ${current.attempt.roomOrLink}` : ""}` : current.attempt.proposedDate ? `Proposed for ${current.attempt.proposedDate}` : "No date yet."}
          </p>
          {!current.resultsVisible ? (
            <EmptyState title="The results are not ready." detail="They appear after every signed sheet is verified. The Coordinator verifies them after the defense." />
          ) : (
            <>
              {current.attempt.verdict ? (
                <div role="status" className="rounded-control border border-border p-4">
                  <p className="text-base font-semibold">{VERDICT[current.attempt.verdict]}</p>
                  <p className="text-sm text-muted-foreground">{NEXT[current.attempt.verdict]}</p>
                </div>
              ) : null}
              <ul className="flex flex-col divide-y divide-border border-y border-border">
                {current.entries.map((e, i) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>Sheet {i + 1}</span>
                    <span>
                      {e.actionTaken ? VERDICT[e.actionTaken] : "No Action Taken"}
                      {e.total !== null ? ` · Rubric total ${e.total} of 100` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">Minutes</h3>
                {current.minutes ? <p className="text-sm whitespace-pre-wrap">{current.minutes.body}</p> : <p className="text-sm text-muted-foreground">The Coordinator has not issued the Minutes yet.</p>}
              </div>
            </>
          )}
        </section>
      ) : null}

      <section aria-labelledby="history" className="flex flex-col gap-3">
        <h2 id="history" className="text-lg font-semibold">
          Attempt history
        </h2>
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {attempts.map((a) => (
            <li key={a.attempt.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>Attempt {a.attempt.attemptNo}</span>
              <span>{a.resultsVisible && a.attempt.verdict ? VERDICT[a.attempt.verdict] : "Results not ready"}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
