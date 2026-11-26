// `/coordinator/defense/[defenseId]` (C6): sheets, signed scans, Minutes, close and Certification
// (FR-DEF-05 to FR-DEF-10, FR-WFL-06, BR-11, BR-12, BR-15, BR-18, BR-19). The id is the defense attempt.
// A mismatch is a warning and never stops the defense (BR-12). No grade is shown (BR-15).
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlagBanner } from "@/components/banners";
import { EmptyState } from "@/components/empty-state";
import { InputProblem } from "@/server/data/coordinator";
import { defenseDetail } from "@/server/data/defense-view";
import { evaluationFormFor } from "@/server/domain/evaluation";
import { RevisionItemsForm } from "@/app/_components/revision-panel";
import { sessionContext } from "../../_lib/action";
import { PageHeader, Section, td, th } from "../../_lib/page-header";
import { CertifyForm, CloseForm, MinutesForm, SheetScanUploader, VerifySheetForm } from "./defense-forms";

const MILESTONE_LABEL: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };
const VERDICT: Record<string, string> = { approved: "Approved", approved_with_revisions: "Approved with revisions", disapproved: "Disapproved" };
const MATCH: Record<string, string> = { pending: "Waiting for the check", matched: "Matched", mismatch: "Mismatch" };
const PST = { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" } as const;

export default async function Page({ params }: PageProps<"/coordinator/defense/[defenseId]">) {
  const { defenseId } = await params;
  const ctx = await sessionContext();
  const d = await defenseDetail(ctx, defenseId).catch((e) => {
    if (e instanceof InputProblem) notFound();
    throw e;
  });
  const mismatches = d.sheets.filter((s) => s.sheetMatch === "mismatch" && !s.verified);

  return (
    <div className="mx-auto flex flex-col gap-12">
      <PageHeader
        title={`${d.studentName} · ${MILESTONE_LABEL[d.milestone] ?? d.milestone} Defense, attempt ${d.attemptNo}`}
        detail={`${d.scheduledStartAt ? new Intl.DateTimeFormat("en-PH", PST).format(d.scheduledStartAt) : "No start time"} · ${d.roomOrLink ?? "No room"}`}
      />
      <p className="text-sm">
        <Link className="font-medium text-link underline-offset-4 hover:underline" href="/coordinator/schedule">
          Back to the schedule
        </Link>
      </p>

      <Section title="Verdict">
        <p className="text-sm">
          {d.verdict ? VERDICT[d.verdict] : "No verdict yet. The Lead Panel Member or the Panel Chair records it on or after the defense date."}
        </p>
      </Section>

      <Section title="Sheets">
        {mismatches.length > 0 ? (
          <FlagBanner>
            A signed scan does not match the encoded sheet: {mismatches.map((m) => m.name).join(", ")}. The member corrects the sheet. This does not stop the
            defense (BR-12).
          </FlagBanner>
        ) : null}
        {d.sheets.length === 0 ? (
          <EmptyState title="No sheet is expected." detail="The sheets follow the committee of this defense." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Evaluator</th>
                  <th className={th}>Action Taken</th>
                  <th className={th}>Total</th>
                  <th className={th}>Signed scan</th>
                  <th className={th}>Verify</th>
                </tr>
              </thead>
              <tbody>
                {d.sheets.map((s) => (
                  <tr key={s.memberUserId}>
                    <td className={td}>{s.name}</td>
                    <td className={td}>{s.actionTaken ? VERDICT[s.actionTaken] : "Not saved"}</td>
                    <td className={td}>{s.total ?? "None"}</td>
                    <td className={td}>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm">{s.verified ? "Verified and locked" : s.hasScan ? MATCH[s.sheetMatch] : "No scan"}</span>
                        <SheetScanUploader entryId={s.entryId} name={s.name} blockedReason={s.verifyBlockedReason} />
                      </div>
                    </td>
                    <td className={td}>
                      <VerifySheetForm entryId={s.entryId} blockedReason={s.verifyBlockedReason} form={evaluationFormFor(d.milestone)} student={d.studentName} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Minutes">
        {d.minutes ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Issued {new Intl.DateTimeFormat("en-PH", PST).format(d.minutes.issuedAt)}. They cannot change.</p>
            <p className="max-w-[72ch] whitespace-pre-wrap text-sm">{d.minutes.body}</p>
          </div>
        ) : (
          <MinutesForm attemptId={d.attemptId} blockedReason={d.minutesBlockedReason} />
        )}
      </Section>

      {d.verdict === "approved_with_revisions" ? (
        <Section title="Revision items">
          <RevisionItemsForm attemptId={d.attemptId} />
        </Section>
      ) : null}

      <Section title="Close the stage">
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          The stage closes after the verdict, each verified sheet and the Minutes. A returned document also blocks the close (BR-12).
        </p>
        <CloseForm milestoneId={d.milestoneId} blockedReason={d.closeBlockedReason} student={d.studentName} />
      </Section>

      {d.showCertify ? (
        <Section title="Certification">
          <p className="max-w-[72ch] text-sm text-muted-foreground">
            The Coordinator records the Certification after each revision item is accepted and the signed Certification is verified (FR-WFL-06).
          </p>
          <CertifyForm milestoneId={d.milestoneId} blockedReason={d.certifyBlockedReason} />
        </Section>
      ) : null}
    </div>
  );
}
