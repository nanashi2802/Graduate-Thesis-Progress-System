// `/coordinator/documents` (C4): the Coordinator checks each scan against the paper (FR-DOC-06, FR-DOC-07, FR-DOC-11, BR-12, BR-13, BR-18).
// Pick a Student, then work through the records of each milestone.
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { DocumentStamp, documentHistoryLabel } from "@/components/status";
import { deliverables, documentHistory } from "@/server/data/documents";
import { listStudents } from "@/server/data/students";
import { decideDocumentChange, type DocumentState } from "@/server/domain/documents";
import { OutsideSetters } from "@/app/_components/outside-setters";
import { sessionContext } from "../_lib/action";
import { PageHeader, Section, td, th } from "../_lib/page-header";
import { ReviewForm, type ReviewBlocks } from "./review-form";

const MILESTONE_LABEL: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };
const TARGETS = ["verified", "returned"] as const;
const link = "text-sm font-medium text-link underline-offset-4 hover:underline";

// The same rule the action runs. A dummy reason passes the reason check, so the box can still be empty (BR-18).
function blocksFor(state: DocumentState): ReviewBlocks {
  const out: ReviewBlocks = {};
  for (const to of TARGETS) {
    const d = decideDocumentChange(state, to, "coordinator", "x");
    if (!d.ok) out[to] = d.reason;
  }
  return out;
}

export default async function Page({ searchParams }: PageProps<"/coordinator/documents">) {
  const ctx = await sessionContext();
  const students = await listStudents(ctx);
  const param = (await searchParams).thesis;
  const student = students.find((s) => s.thesisId === (Array.isArray(param) ? param[0] : param));

  return (
    <div className="mx-auto flex flex-col gap-12">
      <PageHeader
        title="Document review"
        detail="Compare each scan with the signed paper. Verify it, or return it with a reason."
      />
      {!student ? (
        <Section title="Choose a Student">
          {students.length === 0 ? (
            <EmptyState title="No Student accounts yet." detail="Make a Student account on the Accounts page first." />
          ) : (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {students.map((s) => (
                <li key={s.thesisId} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm">
                    {s.studentName} <span className="text-muted-foreground">· Adviser {s.adviserName}</span>
                  </span>
                  <Link className={link} href={`/coordinator/documents?thesis=${s.thesisId}`}>
                    Review documents<span className="sr-only"> of {s.studentName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : (
        <>
          <p className="text-sm">
            <Link className={link} href="/coordinator/documents">
              All Students
            </Link>
            <span className="text-muted-foreground"> / {student.studentName}</span>
          </p>
          {await Promise.all(
            student.milestones.map(async (m) => {
              const rows = (await deliverables(ctx, m.id)).flatMap((d) => d.records.map((r) => ({ d, r })));
              return (
                <Section key={m.id} title={`${MILESTONE_LABEL[m.code] ?? m.code} Defense`}>
                  <OutsideSetters ctx={ctx} milestoneId={m.id} />
                  {rows.length === 0 ? (
                    <EmptyState title="No scan is uploaded yet." detail="Records appear here after an upload." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={th}>Document</th>
                            <th className={th}>History</th>
                            <th className={th}>Review</th>
                          </tr>
                        </thead>
                        <tbody>
                          {await Promise.all(
                            rows.map(async ({ d, r }) => {
                              const history = await documentHistory(ctx, r.id);
                              return (
                                <tr key={r.id}>
                                  <td className={td}>
                                    <div className="font-medium">{d.label}</div>
                                    <DocumentStamp form={d.formCode.replace("_", " ")} state={r.state} />
                                  </td>
                                  <td className={td}>
                                    <p className="text-xs text-muted-foreground">
                                      {history.files.length} {history.files.length === 1 ? "file" : "files"}
                                    </p>
                                    <details>
                                      <summary className="cursor-pointer text-xs font-medium">State history</summary>
                                      <ol className="mt-1 flex flex-col gap-1 text-xs">
                                        {history.events.map((e, i) => (
                                          <li key={i}>
                                            {documentHistoryLabel(e.fromState)} → {documentHistoryLabel(e.toState)}
                                            {e.reason ? ` · ${e.reason}` : ""}
                                          </li>
                                        ))}
                                      </ol>
                                    </details>
                                  </td>
                                  <td className={td}>
                                    <ReviewForm documentId={r.id} blocks={blocksFor(r.state)} form={d.formCode} student={student.studentName} />
                                  </td>
                                </tr>
                              );
                            }),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>
              );
            }),
          )}
        </>
      )}
    </div>
  );
}
