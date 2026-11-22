// `/panel/dashboard` (P1): the assignments (FR-TRK-03, NFR-04, BR-08, BR-18).
// Each assignment shows the designation, the access status with its reason, the action required and the defense schedule.
// The portal layout checks the role.
import Link from "next/link";
import { Lock } from "lucide-react";
import { DashSection, MILESTONE_LABEL, linkClass, td, th } from "@/app/_components/dash";
import { pst } from "@/app/_lib/format";
import { EmptyState } from "@/components/empty-state";
import { MilestoneStatusPill } from "@/components/status";
import { getSessionState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { panelDashboard } from "@/server/data/queues";

const DESIGNATION: Record<string, string> = { none: "Panel Member", lead_panel_member: "Lead Panel Member", panel_chair: "Panel Chair" };

export default async function Page() {
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const { assignments } = await panelDashboard({ db: getDb(), actor: state.actor });
  const due = assignments.filter((a) => a.actionRequired !== null);

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {due.length === 0 ? "Nothing is due from you now." : `${due.length} ${due.length === 1 ? "assignment needs" : "assignments need"} your action.`}
        </p>
      </header>

      <DashSection title="Assignments">
        {assignments.length === 0 ? (
          <EmptyState title="You have no assignment yet." detail="An assignment appears here after the Coordinator proposes you for a committee." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Student</th>
                  <th className={th}>Role</th>
                  <th className={th}>Access</th>
                  <th className={th}>Action required</th>
                  <th className={th}>Defense</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.milestoneId}>
                    <td className={td}>
                      <div className="font-medium">{a.studentName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {MILESTONE_LABEL[a.milestone]}
                        <MilestoneStatusPill status={a.status} milestone={a.milestone} />
                      </div>
                    </td>
                    <td className={td}>
                      {DESIGNATION[a.designation]}
                      {a.isSubstitute ? <span className="text-muted-foreground"> · Substitute</span> : null}
                    </td>
                    <td className={td}>
                      {a.access.open ? (
                        a.prId ? (
                          <Link className={linkClass} href={`/panel/pr/${a.prId}`}>
                            Open the manuscript<span className="sr-only"> of {a.studentName}</span>
                          </Link>
                        ) : (
                          "Open. No commit yet."
                        )
                      ) : (
                        <span className="inline-flex items-start gap-1 text-xs font-medium text-muted-foreground">
                          <Lock aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-3.5 shrink-0" />
                          {a.access.reason}
                        </span>
                      )}
                    </td>
                    <td className={td}>{a.actionRequired ?? "None"}</td>
                    <td className={td}>
                      {a.defense ? (
                        <>
                          {pst(a.defense.startsAt)}
                          <div className="text-xs text-muted-foreground">{a.defense.roomOrLink ?? "No room yet"}</div>
                        </>
                      ) : (
                        "Not scheduled"
                      )}
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
