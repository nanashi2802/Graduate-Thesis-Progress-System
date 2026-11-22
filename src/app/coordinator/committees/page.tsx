// `/coordinator/committees` (C3): the appointment board (FR-CMT-01 to FR-CMT-04, BR-18).
// Pick a Student, then work on the Evaluation Committee (Milestone 1) and the Final Panel (Milestone 3).
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { milestoneStatusView } from "@/components/status";
import { appointmentBoard, type AppointmentBoard } from "@/server/data/committees";
import { deliverables } from "@/server/data/documents";
import { listStudents, type StudentRow } from "@/server/data/students";
import { committeeKindFor } from "@/server/domain/committee";
import type { MilestoneCode } from "@/server/domain/milestone";
import { sessionContext } from "../_lib/action";
import { PageHeader, Section, td, th } from "../_lib/page-header";
import { AppointButton, LinkForm, ProposeSeatForm, SeatAnswerButtons } from "./committee-forms";

const KIND_LABEL = { evaluation_committee: "Evaluation Committee", final_panel: "Final Panel" } as const;
const MILESTONE_LABEL: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };
const DESIGNATION: Record<string, string> = { none: "None", lead_panel_member: "Lead Panel Member", panel_chair: "Panel Chair" };
const STATUS: Record<string, string> = { proposed: "Proposed", accepted: "Accepted", declined: "Declined" };
const BEFORE_GATE_1A = "Allowed after Gate 1a (the Adviser endorsement).";

export default async function Page({ searchParams }: PageProps<"/coordinator/committees">) {
  const ctx = await sessionContext();
  const students = await listStudents(ctx);
  const param = (await searchParams).thesis;
  const selected = students.find((s) => s.thesisId === (Array.isArray(param) ? param[0] : param));

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <PageHeader
        title="Committees"
        detail="Propose Panel Members, record their answers, link the signed paper and mark the committee Appointed. The paper is the record (BR-01)."
      />
      {selected ? <Board student={selected} board={await appointmentBoard(ctx, selected.thesisId)} ctx={ctx} /> : <StudentPicker students={students} />}
    </main>
  );
}

function StudentPicker({ students }: { students: StudentRow[] }) {
  return (
    <Section title="Choose a Student">
      {students.length === 0 ? (
        <EmptyState title="No Student accounts yet." detail="Make a Student account on the Accounts page first." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Student</th>
                <th className={th}>Adviser</th>
                <th className={th}>Milestone</th>
                <th className={th}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const current = s.milestones.at(-1);
                return (
                  <tr key={s.thesisId}>
                    <td className={td}>{s.studentName}</td>
                    <td className={td}>{s.adviserName}</td>
                    <td className={td}>{current ? `${MILESTONE_LABEL[current.code] ?? current.code} · ${milestoneStatusView(current.status, current.code as MilestoneCode).label}` : "None"}</td>
                    <td className={td}>
                      <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/coordinator/committees?thesis=${s.thesisId}`}>
                        Open the board<span className="sr-only"> of {s.studentName}</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

async function Board({ student, board, ctx }: { student: StudentRow; board: AppointmentBoard; ctx: Awaited<ReturnType<typeof sessionContext>> }) {
  const pool = board.pool.map((p) => ({
    id: p.userId,
    label: `${p.fullName} · ${p.activeSeats} seats · ${p.freeDefenseSlots} free defense slots`,
  }));
  // Milestone 2 has no appointment (FR-CMT-01), so it has no section.
  const sections = student.milestones.filter((m) => committeeKindFor(m.code as MilestoneCode) !== null);

  return (
    <>
      <p className="text-sm">
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/coordinator/committees">
          All Students
        </Link>
        <span className="text-muted-foreground"> / {student.studentName} · Adviser {student.adviserName}</span>
      </p>
      {sections.length === 0 ? (
        <EmptyState title="No milestone needs a committee yet." detail="The Evaluation Committee opens at Milestone 1." />
      ) : null}
      {await Promise.all(
        sections.map(async (m) => {
          const kind = committeeKindFor(m.code as MilestoneCode)!;
          const c = board.committees.find((x) => x.kind === kind);
          const records = (await deliverables(ctx, m.id)).flatMap((d) => d.records.map((r) => ({ ...r, formCode: d.formCode })));
          const scanned = records.filter((r) => r.state !== "not_started" && r.state !== "prepared");
          const formCode = kind === "evaluation_committee" ? "TDW_06" : "TDW_11";
          const formOptions = scanned.filter((r) => r.formCode === formCode).map((r) => ({ id: r.id, label: `${formCode.replace("_", " ")} · ${r.state}` }));
          const proposeBlock = m.status !== "ADVISER_ENDORSED" ? BEFORE_GATE_1A : c?.appointed ? "The committee is already appointed." : undefined;
          return (
            <Section key={m.id} title={`${KIND_LABEL[kind]} · ${MILESTONE_LABEL[m.code] ?? m.code} Defense`}>
              {!c ? (
                <EmptyState title="No seat is proposed yet." detail="The first proposed seat makes the committee." />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={th}>Panel Member</th>
                          <th className={th}>Designation</th>
                          <th className={th}>Answer</th>
                          <th className={th}>NDA (TDW 05)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.seats.map((seat) => (
                          <tr key={seat.id}>
                            <td className={td}>{seat.fullName}</td>
                            <td className={td}>{DESIGNATION[seat.designation]}</td>
                            <td className={td}>
                              {seat.status === "proposed" && !c.appointed ? <SeatAnswerButtons seatId={seat.id} /> : STATUS[seat.status]}
                            </td>
                            <td className={td}>
                              {seat.status === "declined" ? (
                                "Not needed"
                              ) : seat.ndaLinked ? (
                                "Linked"
                              ) : (
                                <LinkForm
                                  kind="nda"
                                  targetName="seatId"
                                  targetId={seat.id}
                                  label="NDA"
                                  options={scanned
                                    .filter((r) => r.formCode === "TDW_05" && r.subjectUserId === seat.memberUserId)
                                    .map((r) => ({ id: r.id, label: `TDW 05 · ${r.state}` }))}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Appointment form ({formCode.replace("_", " ")})</h3>
                    {c.appointmentFormLinked ? (
                      <p className="text-sm text-muted-foreground">Linked.</p>
                    ) : (
                      <LinkForm
                        kind="appointment"
                        targetName="committeeId"
                        targetId={c.id}
                        label={`${formCode.replace("_", " ")} form`}
                        options={formOptions}
                        blockedReason={c.appointed ? "The committee is already appointed." : undefined}
                      />
                    )}
                  </div>
                  <AppointButton committeeId={c.id} blockedReason={c.appointBlockedReason} />
                </div>
              )}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Propose a seat</h3>
                <ProposeSeatForm thesisId={student.thesisId} milestone={m.code} pool={pool} blockedReason={proposeBlock} />
              </div>
            </Section>
          );
        }),
      )}
    </>
  );
}
