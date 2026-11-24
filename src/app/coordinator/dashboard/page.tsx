// `/coordinator/dashboard` (C1): KPI strip, grouped action queue and Student table (FR-TRK-04, FR-TRK-06, NFR-04, BR-17).
// The KPI strip is the Docket of the Coordinator: each count opens its queue on this page (DESIGN.md §5.2).
// The portal layout checks the role.
import Link from "next/link";
import { MILESTONE_LABEL, DashSection, linkClass, td, th, waiting } from "@/app/_components/dash";
import { FlagBanner } from "@/components/banners";
import { EmptyState } from "@/components/empty-state";
import { MilestoneStatusPill } from "@/components/status";
import { coordinatorOverview, QUEUE_LABEL, type QueueItem, type QueueKind } from "@/server/data/overview";
import type { MilestoneCode } from "@/server/domain/milestone";
import { pageContext } from "../_lib/action";

// Where each queue item opens (SITEMAP C3 to C6). C7 (clearance) is not built yet: those items show a reason, not a link (BR-18).
function hrefOf(q: QueueItem): string | null {
  switch (q.kind) {
    case "appoint_committee":
      return `/coordinator/committees?thesis=${q.thesisId}`;
    case "review_documents":
      return `/coordinator/documents?thesis=${q.thesisId}`;
    case "confirm_date":
      return "/coordinator/schedule";
    case "close_stage":
    case "certify":
      return q.attemptId ? `/coordinator/defense/${q.attemptId}` : "/coordinator/schedule";
    case "final_approval":
    case "clearance":
      return null;
  }
}

export default async function Page() {
  const ctx = await pageContext();
  if (!ctx) return null; // The portal layout shows Access Denied.
  const o = await coordinatorOverview(ctx);
  const flagged = o.students.filter((s) => s.pacingFlag);
  const groups = o.kpis.filter((k) => k.count > 0);

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">Each count opens its queue below. The oldest request comes first.</p>
      </header>

      <section aria-label="Queue counts" className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6">
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {o.kpis.map((k) => (
            <li key={k.kind} className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold tabular-nums">{k.count}</span>
              {k.count > 0 ? (
                <a className={linkClass} href={`#queue-${k.kind}`}>
                  {k.label}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">{k.label}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {groups.length === 0 ? (
        <EmptyState title="No request waits." detail="New requests appear here when a Student, an Adviser or a Panel Member acts." />
      ) : (
        groups.map((g) => (
          <DashSection key={g.kind} id={`queue-${g.kind}`} title={`${QUEUE_LABEL[g.kind as QueueKind]} · ${g.count}`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Student</th>
                    <th className={th}>Milestone</th>
                    <th className={th}>Waiting</th>
                    <th className={th}>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.queue
                    .filter((q) => q.kind === g.kind)
                    .map((q) => (
                      <tr key={`${q.kind}-${q.milestoneId}`}>
                        <td className={td}>
                          {q.studentName}
                          {q.kind === "review_documents" ? <span className="text-muted-foreground"> · {q.count} {q.count === 1 ? "scan" : "scans"}</span> : null}
                        </td>
                        <td className={td}>{MILESTONE_LABEL[q.milestone]}</td>
                        <td className={td}>{waiting(q.daysWaiting)}</td>
                        <td className={td}>
                          {hrefOf(q) ? (
                            <Link className={linkClass} href={hrefOf(q)!}>
                              Open<span className="sr-only"> {QUEUE_LABEL[q.kind]} for {q.studentName}</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">The clearance screen is not open yet.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DashSection>
        ))
      )}

      <DashSection title="Students">
        {flagged.length > 0 ? (
          <FlagBanner>
            {flagged.length === 1 ? "1 Student is" : `${flagged.length} Students are`} past the target date: {flagged.map((s) => s.studentName).join(", ")}. This is information only. It never blocks an action (BR-17).
          </FlagBanner>
        ) : null}
        {o.students.length === 0 ? (
          <EmptyState title="No Student accounts yet." detail="Make a Student account on the Accounts page." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Student</th>
                  <th className={th}>Adviser</th>
                  <th className={th}>Milestone</th>
                  <th className={th}>Status</th>
                  <th className={th}>Target date</th>
                  <th className={th}>Residency end</th>
                </tr>
              </thead>
              <tbody>
                {o.students.map((s) => (
                  <tr key={s.thesisId}>
                    <td className={td}>{s.studentName}</td>
                    <td className={td}>{s.adviserName}</td>
                    <td className={td}>{MILESTONE_LABEL[s.milestone]}</td>
                    <td className={td}>
                      <MilestoneStatusPill status={s.status} milestone={s.milestone as MilestoneCode} />
                    </td>
                    <td className={td}>
                      {s.targetDate ?? "Not set"}
                      {s.pacingFlag ? <span className="ml-2 text-xs font-medium text-muted-foreground">Past the target date</span> : null}
                    </td>
                    <td className={td}>
                      {s.residency?.endDate ?? "Not set"}
                      {s.residency?.warning ? <span className="ml-2 text-xs font-medium text-muted-foreground">Near or past the end date</span> : null}
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
