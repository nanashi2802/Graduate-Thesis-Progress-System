// `/coordinator/templates` (C8): templates, parameters and target dates (FR-TPL-01 to FR-TPL-05).
import { EmptyState } from "@/components/empty-state";
import { listStudents } from "@/server/data/students";
import { listTemplates } from "@/server/data/templates";
import { sessionContext } from "../_lib/action";
import { PageHeader, Section, td, th } from "../_lib/page-header";
import { TargetDateForm, TemplateForm } from "./template-forms";

const UPLOADER: Record<string, string> = {
  student: "Student",
  adviser: "Adviser",
  panel_member: "Panel Member",
  coordinator: "Coordinator",
};
const MILESTONE: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };

export default async function Page() {
  const ctx = await sessionContext();
  const [templates, students] = await Promise.all([listTemplates(ctx), listStudents(ctx)]);
  const open = students.flatMap((s) =>
    s.milestones
      .filter((m) => !["CERTIFIED", "CLOSED", "CLEARED"].includes(m.status))
      .map((m) => ({ ...m, studentName: s.studentName })),
  );
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <PageHeader
        title="Templates"
        detail="A change makes a new template version. Running milestones keep the version they started with."
      />
      {templates.map((t) => (
        <Section key={t.code} title={`${t.name} · version ${t.version.versionNo}`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="pb-2 text-left text-sm text-muted-foreground">Required forms and deliverables</caption>
              <thead>
                <tr>
                  <th className={th}>Form</th>
                  <th className={th}>Paper signers</th>
                  <th className={th}>Uploaded by</th>
                  <th className={th}>Needed for the date</th>
                </tr>
              </thead>
              <tbody>
                {t.items.map((i) => (
                  <tr key={i.id}>
                    <td className={td}>
                      {i.formCode.replace("_", " ")} · {i.label}
                    </td>
                    <td className={td}>{i.paperSigners ?? "None"}</td>
                    <td className={td}>{UPLOADER[i.uploaderRole]}</td>
                    <td className={td}>{i.neededForDateConfirmation ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TemplateForm code={t.code} version={t.version} rubric={t.rubric} />
        </Section>
      ))}
      <Section title="Target dates">
        {open.length === 0 ? (
          <EmptyState title="No open milestones." detail="Target dates appear here after you make a Student account." />
        ) : (
          <ul className="flex flex-col gap-4">
            {open.map((m) => (
              <li key={m.id}>
                <TargetDateForm milestoneId={m.id} targetDate={m.targetDate} label={`${m.studentName} · ${MILESTONE[m.code]}`} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
