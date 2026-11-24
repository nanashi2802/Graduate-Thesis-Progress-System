// `/coordinator/clearance` (C7): verify the clearance items and close to CLEARED (FR-CLR-01 to 04, BR-02, BR-18).
import Link from "next/link";
import { ClearanceList } from "@/app/_components/clearance-list";
import { OutsideSetters } from "@/app/_components/outside-setters";
import { EmptyState } from "@/components/empty-state";
import { clearanceView } from "@/server/data/clearance";
import { checkTransition } from "@/server/data/milestones";
import { listStudents } from "@/server/data/students";
import { pageContext } from "../_lib/action";
import { PageHeader, Section } from "../_lib/page-header";
import { CloseForm, VerifyForm } from "./forms";

const link = "text-sm font-medium text-primary underline-offset-4 hover:underline";

export default async function Page({ searchParams }: PageProps<"/coordinator/clearance">) {
  const ctx = await pageContext();
  if (!ctx) return null; // The portal layout shows Access Denied.
  const students = (await listStudents(ctx)).filter((s) => s.milestones.some((m) => m.code === "final"));
  const param = (await searchParams).thesis;
  const student = students.find((s) => s.thesisId === (Array.isArray(param) ? param[0] : param));
  const final = student?.milestones.find((m) => m.code === "final");
  const view = final ? await clearanceView(ctx, final.id) : null;
  const closeBlock = final && view && view.status !== "CLEARED" ? await checkTransition(ctx, final.id, "CLEARED") : null;

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-8 sm:px-8">
      <PageHeader title="Clearance" detail="Verify the evidence of each item. Close the thesis as Cleared when every item is done." />
      {!student || !final || !view ? (
        students.length === 0 ? (
          <EmptyState title="No Student is at the Final milestone." detail="A Student appears here after the Final milestone opens." />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {students.map((s) => (
              <li key={s.thesisId} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm">{s.studentName}</span>
                <Link className={link} href={`/coordinator/clearance?thesis=${s.thesisId}`}>
                  Open clearance<span className="sr-only"> of {s.studentName}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <p className="text-sm">
            <Link className={link} href="/coordinator/clearance">
              All Students
            </Link>
            <span className="text-muted-foreground"> / {student.studentName}</span>
          </p>
          <Section title="Outside-office status">
            <OutsideSetters ctx={ctx} milestoneId={final.id} />
          </Section>
          <Section title="Checklist">
            <ClearanceList
              rows={view.rows}
              action={(r) =>
                r.source === "coordinator" && !r.done ? (
                  <VerifyForm
                    milestoneId={final.id}
                    kind={r.kind}
                    blockedReason={view.status === "FINAL_APPROVED" ? undefined : "Verify items after Gate 2 is approved (FINAL_APPROVED)."}
                  />
                ) : null
              }
            />
            {view.status === "CLEARED" ? (
              <p className="text-sm text-muted-foreground">This thesis is Cleared.</p>
            ) : (
              <CloseForm milestoneId={final.id} blockedReason={closeBlock && !closeBlock.ok ? closeBlock.reason : undefined} />
            )}
          </Section>
        </>
      )}
    </main>
  );
}
