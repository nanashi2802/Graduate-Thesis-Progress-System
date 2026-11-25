// `/adviser/dashboard` (A1): the action queue and the advisee roster (FR-TRK-02, FR-TRK-06, NFR-04, BR-17, BR-18).
// Each queue item opens the screen that holds the action. Flags are information only. The portal layout checks the role.
import Link from "next/link";
import { ActionForm } from "@/app/_components/action-form";
import { DashSection, MILESTONE_LABEL, linkClass, td, th, waiting } from "@/app/_components/dash";
import { ScanUploader } from "@/app/student/documents/scan-uploader";
import { FlagBanner } from "@/components/banners";
import { EmptyState } from "@/components/empty-state";
import { MilestoneStatusPill } from "@/components/status";
import { getRoleState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { adviserDashboard, ADVISER_QUEUE_LABEL, type AdviserQueueItem } from "@/server/data/queues";
import type { MilestoneCode } from "@/server/domain/milestone";
import { approveDataGatheringAction } from "./actions";

function Action({ q }: { q: AdviserQueueItem }) {
  switch (q.kind) {
    case "gate_1a":
    case "gate_1b":
      return q.prId ? (
        <Link className={linkClass} href={`/adviser/pr/${q.prId}`}>
          Open the review<span className="sr-only"> for {q.studentName}</span>
        </Link>
      ) : null;
    case "data_gathering":
      return (
        <ActionForm action={approveDataGatheringAction} submitLabel="Approve data gathering" resetOnSuccess={false}>
          <input type="hidden" name="milestoneId" value={q.milestoneId ?? ""} />
        </ActionForm>
      );
    case "tdw03":
      return q.milestoneId && q.requiredItemId ? <ScanUploader milestoneId={q.milestoneId} requiredItemId={q.requiredItemId} label="the signed TDW 03" /> : null;
    case "consultation_request":
      return (
        <Link className={linkClass} href="/adviser/availability">
          Answer the request<span className="sr-only"> of {q.studentName}</span>
        </Link>
      );
  }
}

export default async function Page() {
  const state = await getRoleState("adviser");
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const d = await adviserDashboard({ db: getDb(), actor: state.actor });
  const flagged = d.advisees.filter((a) => a.pacingFlag);

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">Your action queue shows the oldest request first.</p>
      </header>

      <DashSection title={`Action queue · ${d.queue.length}`}>
        {d.queue.length === 0 ? (
          <EmptyState title="Nothing waits for you." detail="New requests from your advisees appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Student</th>
                  <th className={th}>Step</th>
                  <th className={th}>Waiting</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {d.queue.map((q, i) => (
                  <tr key={`${q.kind}-${q.milestoneId ?? q.thesisId}-${i}`}>
                    <td className={td}>
                      {q.studentName}
                      {q.milestone ? <span className="text-muted-foreground"> · {MILESTONE_LABEL[q.milestone]}</span> : null}
                    </td>
                    <td className={td}>{ADVISER_QUEUE_LABEL[q.kind]}</td>
                    <td className={td}>{waiting(q.daysWaiting)}</td>
                    <td className={td}>
                      <Action q={q} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashSection>

      <DashSection title="Advisees">
        {d.adviseeLimitFlag ? (
          <FlagBanner>You advise more active Students than the advisee limit. This is information only (BR-17).</FlagBanner>
        ) : null}
        {flagged.length > 0 ? (
          <FlagBanner>
            {flagged.length === 1 ? "1 advisee is" : `${flagged.length} advisees are`} past the target date: {flagged.map((a) => a.studentName).join(", ")}. This is information only (BR-17).
          </FlagBanner>
        ) : null}
        {d.advisees.length === 0 ? (
          <EmptyState title="You have no advisees yet." detail="The Coordinator assigns a Student to you when the account opens." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Student</th>
                  <th className={th}>Milestone</th>
                  <th className={th}>Status</th>
                  <th className={th}>Target date</th>
                  <th className={th}>Open</th>
                </tr>
              </thead>
              <tbody>
                {d.advisees.map((a) => (
                  <tr key={a.thesisId}>
                    <td className={td}>{a.studentName}</td>
                    <td className={td}>{MILESTONE_LABEL[a.milestone]}</td>
                    <td className={td}>
                      <MilestoneStatusPill status={a.status} milestone={a.milestone as MilestoneCode} />
                    </td>
                    <td className={td}>
                      {a.targetDate ?? "Not set"}
                      {a.pacingFlag ? <span className="ml-2 text-xs font-medium text-muted-foreground">Past the target date</span> : null}
                    </td>
                    <td className={td}>
                      <div className="flex flex-col gap-1">
                        {a.prId ? (
                          <Link className={linkClass} href={`/adviser/pr/${a.prId}`}>
                            Review<span className="sr-only"> {a.studentName}</span>
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">No commit yet</span>
                        )}
                        {a.attemptId ? (
                          <Link className={linkClass} href={`/adviser/defense/${a.attemptId}`}>
                            Defense Day<span className="sr-only"> of {a.studentName}</span>
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashSection>
    </main>
  );
}
