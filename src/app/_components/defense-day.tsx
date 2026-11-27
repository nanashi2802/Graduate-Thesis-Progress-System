// The Defense Day page for the Adviser (A5) and the Panel Member (P4): the own evaluation sheet, the verdict and the
// held step (FR-DEF-05 to FR-DEF-07, BR-10, BR-17, BR-18, INV-14, INV-15). The sheet opens at the scheduled start.
// R6.9 (UX-P-06): the rubric sheet is the `defense-form` pattern (48 px steppers, read only after the verify or the
// close, R6-b A, R6-d A) and the verdict is the `verdict` pattern (flags never block, 30 s refresh, R6-c A).
import type { UserRole } from "@/server/data/schema";
import Link from "next/link";
import { ActionForm, areaClass, Field, inputClass } from "@/app/_components/action-form";
import { DefenseSheet, VerdictPanel } from "@/app/_components/defense-panels";
import { pst } from "@/app/_lib/format";
import { markHeldAction, recordVerdictAction, saveSheetAction } from "@/app/_lib/defense-actions";
import { AccessDenied } from "@/app/_components/access-denied";
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
  // R6-b A: a verified sheet or a closed defense shows its values as text. Other blocks keep Save with its reason.
  const sheetMode = own?.entry.verifiedAt ? "verified" : page.editBlock === "The defense is not open for sheets." ? "closed" : "edit";
  const rows = rubric.map((r) => ({ id: r.id, code: r.code, name: r.label, weight: r.weightPct, score: own?.scores[r.id] ?? null }));
  const actionTaken = own?.entry.actionTaken ? VERDICT[own.entry.actionTaken] : "Not chosen";

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
        ) : rubricForm ? (
          <DefenseSheet
            rows={rows}
            mode={sheetMode}
            legend={FORM_NAME[form]}
            save={saveSheetAction.bind(null, attempt.id)}
            blockedReason={sheetMode === "edit" ? (page.editBlock ?? undefined) : undefined}
          >
            {sheetMode === "edit" ? (
              <>
                <Field label="General observations">
                  <textarea name="comment_general_observations" defaultValue={own?.comments.general_observations ?? ""} className={areaClass} />
                </Field>
                <ActionTakenField value={own?.entry.actionTaken ?? ""} />
              </>
            ) : (
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="font-medium">General observations</dt>
                  <dd className="m-0 max-w-[65ch]">{own?.comments.general_observations || "None."}</dd>
                </div>
                <div>
                  <dt className="font-medium">Action Taken</dt>
                  <dd className="m-0">{actionTaken}</dd>
                </div>
              </dl>
            )}
          </DefenseSheet>
        ) : (
          // TDW 10 has comments only, no scores: it keeps the form until R7 (no rubric for the defense-form pattern).
          <ActionForm action={saveSheetAction.bind(null, attempt.id)} submitLabel="Save my sheet" blockedReason={page.editBlock ?? undefined} resetOnSuccess={false} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-3" disabled={page.editBlock !== null}>
              <legend className="text-sm font-medium">{FORM_NAME[form]}: comments (no scores on this form)</legend>
              {TDW10_BOXES.map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea name={`comment_${key}`} defaultValue={own?.comments[key] ?? ""} className={areaClass} />
                </Field>
              ))}
            </fieldset>
            <ActionTakenField value={own?.entry.actionTaken ?? ""} disabled={page.editBlock !== null} />
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
          <VerdictPanel
            members={page.members}
            canRecord={page.verdictBlock === null}
            recordReason={page.verdictBlock ?? undefined}
            recorded={attempt.verdict}
            closed={milestone.status !== "DEFENSE_SCHEDULED"}
            updatedAt={new Date()}
            record={recordVerdictAction.bind(null, milestone.id)}
          />
          <ActionForm action={markHeldAction.bind(null, milestone.id)} submitLabel="Mark the defense held" variant="outline" blockedReason={page.heldBlock ?? undefined} />
        </section>
      ) : null}
    </div>
  );
}

function ActionTakenField({ value, disabled = false }: { value: string; disabled?: boolean }) {
  return (
    <Field label="Action Taken">
      <select name="actionTaken" defaultValue={value} className={inputClass} disabled={disabled}>
        <option value="">Choose</option>
        {Object.entries(VERDICT).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </Field>
  );
}
