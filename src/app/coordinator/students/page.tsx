// `/coordinator/students` (C2): the create-account form and the Student list (FR-ACC-04, FR-ACC-07).
import { EmptyState } from "@/components/empty-state";
import { listStudents } from "@/server/data/students";
import { listActiveUsers } from "@/server/data/users";
import { pageContext } from "../_lib/action";
import { PageHeader, Section, td, th } from "../_lib/page-header";
import { CreateStudentForm } from "./create-student-form";

const LEVEL = { masters: "Master's", doctoral: "Doctoral" } as const;
const MILESTONE: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };

export default async function Page() {
  const ctx = await pageContext();
  if (!ctx) return null; // The portal layout shows Access Denied.
  const [students, advisers] = await Promise.all([listStudents(ctx), listActiveUsers(ctx, "adviser")]);
  return (
    <div className="mx-auto flex flex-col gap-12">
      <PageHeader
        title="Accounts"
        detail="Make a Student account only after the Student is eligible. The system then opens the Thesis Instance and Milestone 1."
      />
      <Section title="New Student account">
        {advisers.length === 0 ? (
          <EmptyState
            title="No active Adviser exists."
            detail="Each Student needs one Adviser. Add an Adviser account on the Users page first."
          />
        ) : (
          <CreateStudentForm advisers={advisers} />
        )}
      </Section>
      <Section title="Students">
        {students.length === 0 ? (
          <EmptyState title="No Student accounts yet." detail="New accounts appear here after you make them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Student</th>
                  <th className={th}>Adviser</th>
                  <th className={th}>Degree</th>
                  <th className={th}>Start term</th>
                  <th className={th}>Milestone</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const current = s.milestones.at(-1);
                  return (
                    <tr key={s.thesisId}>
                      <td className={td}>
                        <div className="font-medium">{s.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.email}
                          {s.isActive ? "" : " · Deactivated"}
                        </div>
                      </td>
                      <td className={td}>{s.adviserName}</td>
                      <td className={td}>{LEVEL[s.degreeLevel]}</td>
                      <td className={td}>{s.programStartTerm}</td>
                      <td className={td}>{current ? `${MILESTONE[current.code]} · ${current.status}` : "None"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
