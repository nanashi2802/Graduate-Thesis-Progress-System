// `/coordinator/schedule` (C5): date confirmation and printed copies (FR-DEF-03, FR-DEF-04, BR-09, BR-17, BR-18).
// The checklist of FR-DOC-08 must be complete before the date is confirmed (INV-13). A late receipt is a warning only.
import { FlagBanner } from "@/components/banners";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { listAttempts, printedCopyStatus } from "@/server/data/defense";
import { checkTransition } from "@/server/data/milestones";
import { listStudents, type StudentRow } from "@/server/data/students";
import { readinessChecklist } from "@/server/data/tracker";
import { pstDate } from "@/server/notify/time";
import { sessionContext } from "../_lib/action";
import { PageHeader, Section, td, th } from "../_lib/page-header";
import { CheckCopiesForm, ConfirmDateForm, RecordCopiesForm, ReturnDateForm } from "./schedule-forms";

const MILESTONE_LABEL: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };
const PST = { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" } as const;

type Ctx = Awaited<ReturnType<typeof sessionContext>>;
type Entry = { student: StudentRow; milestone: StudentRow["milestones"][number] };

export default async function Page() {
  const ctx = await sessionContext();
  const students = await listStudents(ctx);
  const entries = students.flatMap((student) => student.milestones.map((milestone) => ({ student, milestone })));
  const requests = entries.filter((e) => e.milestone.status === "DATE_PROPOSED");
  const scheduled = entries.filter((e) => e.milestone.status === "DEFENSE_SCHEDULED");

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <PageHeader
        title="Schedule"
        detail="Confirm each defense date and room. Record the printed copies. A late receipt shows a warning and never blocks a step."
      />
      <Section title="Date requests">
        {requests.length === 0 ? (
          <EmptyState title="No date request waits." detail="A request appears here after a Student proposes a date." />
        ) : (
          await Promise.all(requests.map((e) => <Request key={e.milestone.id} entry={e} ctx={ctx} />))
        )}
      </Section>
      <Section title="Scheduled defenses">
        {scheduled.length === 0 ? (
          <EmptyState title="No defense is scheduled." detail="Confirmed defenses appear here with their printed copies." />
        ) : (
          await Promise.all(scheduled.map((e) => <Scheduled key={e.milestone.id} entry={e} ctx={ctx} />))
        )}
      </Section>
    </main>
  );
}

const heading = (e: Entry) => `${e.student.studentName} · ${MILESTONE_LABEL[e.milestone.code] ?? e.milestone.code} Defense`;

async function Request({ entry, ctx }: { entry: Entry; ctx: Ctx }) {
  const { milestone } = entry;
  const attempt = (await listAttempts(ctx, milestone.id)).at(-1)?.attempt;
  const missing = (await readinessChecklist(ctx, milestone.id)).filter((i) => !i.done);
  const decision = await checkTransition(ctx, milestone.id, "DEFENSE_SCHEDULED");
  // BR-18: the reason names the missing items.
  const blocked = decision.ok
    ? null
    : missing.length > 0
      ? `An item is missing: ${missing.map((i) => i.label).join(", ")}.`
      : decision.reason;
  return (
    <article className="flex flex-col gap-4 border-b border-border pb-8">
      <h3 className="text-base font-semibold">{heading(entry)}</h3>
      <p className="text-sm text-muted-foreground">Proposed date: {attempt?.proposedDate ?? "not set"}</p>
      {attempt?.proposedDate ? <ConfirmDateForm milestoneId={milestone.id} proposedDate={attempt.proposedDate} blockedReason={blocked} /> : null}
      <details>
        <summary className="cursor-pointer text-sm font-medium">Return the request to change the date</summary>
        <div className="mt-3">
          <ReturnDateForm milestoneId={milestone.id} />
        </div>
      </details>
    </article>
  );
}

async function Scheduled({ entry, ctx }: { entry: Entry; ctx: Ctx }) {
  const { milestone } = entry;
  const attempt = (await listAttempts(ctx, milestone.id)).at(-1)?.attempt;
  if (!attempt) return null;
  const copies = await printedCopyStatus(ctx, attempt.id);
  const receipt = copies.receipt;
  return (
    <article className="flex flex-col gap-4 border-b border-border pb-8">
      <h3 className="text-base font-semibold">{heading(entry)}</h3>
      <p className="text-sm text-muted-foreground">
        {attempt.scheduledStartAt ? new Intl.DateTimeFormat("en-PH", PST).format(attempt.scheduledStartAt) : "No start time"} · {attempt.roomOrLink ?? "No room"}
      </p>
      <p className="text-sm">
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/coordinator/defense/${attempt.id}`}>
          Open the defense page<span className="sr-only"> of {entry.student.studentName}</span>
        </Link>
        <span className="text-muted-foreground"> for the sheets, the Minutes and the close.</span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Printed copies due</th>
              <th className={th}>Expected</th>
              <th className={th}>Received</th>
              <th className={th}>Check</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>{copies.dueDate ?? "Not set"}</td>
              <td className={td}>{copies.expectedCount}</td>
              <td className={td}>
                {receipt ? `${receipt.copyCount} on ${pstDate(receipt.receivedAt)}` : "Not received"}
              </td>
              <td className={td}>{receipt ? (receipt.matchResult === "pending" ? "Waiting for the check" : receipt.matchResult === "matched" ? "Matched" : "Mismatch") : "Record the receipt first"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {copies.late ? <FlagBanner>The printed copies are late. This is a warning only. It does not block any step (BR-17).</FlagBanner> : null}
      <div className="grid gap-6 sm:grid-cols-2">
        <RecordCopiesForm
          attemptId={attempt.id}
          expected={copies.expectedCount}
          blockedReason={receipt?.matchResult === "matched" ? "The copies are checked already." : undefined}
        />
        <CheckCopiesForm
          attemptId={attempt.id}
          blockedReason={!receipt ? "Record the receipt of the copies first." : receipt.matchResult === "matched" ? "The copies are checked already." : undefined}
        />
      </div>
    </article>
  );
}
