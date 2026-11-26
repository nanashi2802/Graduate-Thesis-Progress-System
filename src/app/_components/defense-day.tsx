// The Defense Day page for the Adviser (A5) and the Panel Member (P4): the own evaluation sheet, the verdict and the
// held step (FR-DEF-05 to FR-DEF-07, BR-10, BR-17, BR-18, INV-14, INV-15). The sheet opens at the scheduled start.
import type { UserRole } from "@/server/data/schema";
import Link from "next/link";
import { ActionForm, areaClass, Field, inputClass } from "@/app/_components/action-form";
import { ScoreSheet } from "@/app/_components/score-sheet";
import { confirmCopy } from "@/components/patterns/dialog/copy";
import { pst } from "@/app/_lib/format";
import { markHeldAction, recordVerdictAction, saveSheetAction } from "@/app/_lib/defense-actions";
import { AccessDenied } from "@/app/_components/access-denied";
import { FlagBanner } from "@/components/banners";
import { EmptyState } from "@/components/empty-state";
import { MilestoneStatusPill } from "@/components/status";
import { getRoleState } from "@/server/auth/session";
import { AccessDeniedError } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { defensePage } from "@/server/data/defense";

const FORM_NAME = { TDW_08: "TDW 08 Proposal evaluation", TDW_10: "TDW 10 Pre-Final evaluation", TDW_13: "TDW 13 Final evaluation" } as const;
const VERDICT = { approved: "Approved", approved_with_revisions: "Approved with Revisions", disapproved: "Disapproved" } as const;
const TDW10_BOXES: [string, string][] = [
  ["title_prelims", "Title and preliminary pages"],
  ["chapter_1", "Chapter 1"],
  ["chapter_2", "Chapter 2"],
  ["chapter_3", "Chapter 3"],
  ["chapter_4", "Chapter 4"],
  ["chapter_5", "Chapter 5"],
  ["references_appendices", "References and appendices"],
  ["remarks", "Remarks"],
];

export async function DefenseDay({ portal, attemptId }: { portal: UserRole; attemptId: string }) {
  const state = await getRoleState(portal);
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  let page: Awaited<ReturnType<typeof defensePage>>;
  try {
    page = await defensePage(ctx, attemptId);
  } catch (e) {
    if (e instanceof AccessDeniedError) return <AccessDenied reason="You cannot open this defense. It belongs to another thesis." />;
    if (e instanceof InputProblem) return <div className="mx-auto max-w-[960px]"><EmptyState title="This defense was not found." detail="Open it from your dashboard." /></div>;
    throw e;
  }
  const { attempt, milestone, form, rubric, own } = page;
  const rubricForm = form !== "TDW_10";

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Defense Day</h1>
          <MilestoneStatusPill status={milestone.status} milestone={milestone.code} />
        </div>
        <p className="text-sm text-muted-foreground">
          {attempt.scheduledStartAt ? `${pst(attempt.scheduledStartAt)}${attempt.roomOrLink ? ` · ${attempt.roomOrLink}` : ""}` : "The date is not confirmed."} · Attempt {attempt.attemptNo}
        </p>
        <p className="text-sm text-muted-foreground">{FORM_NAME[form]}. Encode your own sheet and sign the paper. You can edit until the Coordinator verifies it.</p>
      </header>

      {milestone.code === "final" && page.prId ? (
        <nav aria-label="Defense Day tabs" className="flex gap-4 border-b border-border pb-2 text-sm">
          <span aria-current="page" className="font-semibold">
            My evaluation
          </span>
          <Link href={`/panel/pr/${page.prId}`} className="text-link underline-offset-4 hover:underline">
            Manuscript and comments
          </Link>
        </nav>
      ) : null}

      <section aria-labelledby="sheet" className="flex flex-col gap-3">
        <h2 id="sheet" className="text-lg font-semibold">
          My evaluation sheet
        </h2>
        {!page.isEvaluator ? (
          <p className="text-sm text-muted-foreground">{page.editBlock}</p>
        ) : (
          <ActionForm action={saveSheetAction.bind(null, attempt.id)} submitLabel="Save my sheet" blockedReason={page.editBlock ?? undefined} resetOnSuccess={false} className="flex flex-col gap-4">
            {rubricForm ? (
              <>
                <ScoreSheet rubric={rubric} initial={own?.scores ?? {}} readOnly={page.editBlock !== null} />
                <Field label="General observations">
                  <textarea name="comment_general_observations" defaultValue={own?.comments.general_observations ?? ""} className={areaClass} readOnly={page.editBlock !== null} />
                </Field>
              </>
            ) : (
              <fieldset className="flex flex-col gap-3" disabled={page.editBlock !== null}>
                <legend className="text-sm font-medium">Comments (no scores on this form)</legend>
                {TDW10_BOXES.map(([key, label]) => (
                  <Field key={key} label={label}>
                    <textarea name={`comment_${key}`} defaultValue={own?.comments[key] ?? ""} className={areaClass} />
                  </Field>
                ))}
              </fieldset>
            )}
            <Field label="Action Taken">
              <select name="actionTaken" defaultValue={own?.entry.actionTaken ?? ""} className={inputClass} disabled={page.editBlock !== null}>
                <option value="">Choose</option>
                {Object.entries(VERDICT).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {own?.entry.verifiedAt ? <p className="text-sm">The Coordinator verified your sheet.</p> : null}
          </ActionForm>
        )}
        <p className="text-xs text-muted-foreground">
          {page.sheetsSaved} of {page.sheetsExpected} sheets are saved.
        </p>
      </section>

      {page.verdictSeat ? (
        <section aria-labelledby="verdict" className="flex flex-col gap-3">
          <h2 id="verdict" className="text-lg font-semibold">
            Verdict
          </h2>
          {attempt.verdict ? <p className="text-sm">Recorded verdict: <span className="font-medium">{VERDICT[attempt.verdict]}</span></p> : null}
          {page.warnings.length > 0 ? (
            <FlagBanner>
              {page.warnings.length} member{page.warnings.length > 1 ? "s" : ""} chose an Action Taken that differs from the verdict. You can still continue.
            </FlagBanner>
          ) : null}
          <ActionForm
            action={recordVerdictAction.bind(null, milestone.id)}
            submitLabel="Record verdict"
            blockedReason={page.verdictBlock ?? undefined}
            resetOnSuccess={false}
            confirm={confirmCopy({ kind: "verdict" })}
          >
            <Field label="Collective verdict">
              <select name="verdict" defaultValue={attempt.verdict ?? ""} className={inputClass} required>
                <option value="">Choose</option>
                {Object.entries(VERDICT).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </ActionForm>
          <ActionForm action={markHeldAction.bind(null, milestone.id)} submitLabel="Mark the defense held" variant="outline" blockedReason={page.heldBlock ?? undefined} />
        </section>
      ) : null}
    </div>
  );
}
