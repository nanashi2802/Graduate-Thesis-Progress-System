"use server";
// C8 actions (FR-TPL-01, FR-TPL-03 to FR-TPL-05). The data layer checks the role (NFR-01).
import { revalidatePath } from "next/cache";
import { InputProblem } from "@/server/data/coordinator";
import type { MilestoneCodeValue } from "@/server/data/schema";
import { listTemplates, saveTemplateVersion, setTargetDate } from "@/server/data/templates";
import { int, optionalText, runAction, text, type FormState } from "../_lib/action";

export async function saveTemplateAction(_prev: FormState, form: FormData): Promise<FormState> {
  const result = await runAction(async (ctx) => {
    const code = text(form, "code") as MilestoneCodeValue;
    const current = (await listTemplates(ctx)).find((t) => t.code === code);
    if (!current) throw new InputProblem("This template does not exist.");
    const wait = optionalText(form, "reviewerWaitDays");
    // FR-TRK-06, D-27: only the Proposal form shows the advisee limit. Empty is Off. Other templates keep their value.
    const limit = code === "proposal" ? optionalText(form, "adviseeLimit") : null;
    const adviseeLimit = code === "proposal" ? (limit === null ? null : Number(limit)) : current.version.adviseeLimit;
    const { versionNo } = await saveTemplateVersion(ctx, code, {
      minNoticeDays: int(form, "minNoticeDays"),
      printedCopiesDueDays: int(form, "printedCopiesDueDays"),
      panelSizeMasters: int(form, "panelSizeMasters"),
      panelSizeDoctoral: int(form, "panelSizeDoctoral"),
      printedCopiesMasters: int(form, "printedCopiesMasters"),
      printedCopiesDoctoral: int(form, "printedCopiesDoctoral"),
      reviewerWaitDays: wait === null ? null : Number(wait),
      adviseeLimit,
      // The required items carry over to the new version unchanged.
      items: current.items.map((i) => ({
        formCode: i.formCode,
        label: i.label,
        paperSigners: i.paperSigners,
        uploaderRole: i.uploaderRole,
        neededForDateConfirmation: i.neededForDateConfirmation,
      })),
      rubric: current.rubric.map((r) => ({ code: r.code, label: r.label, weightPct: int(form, `weight-${r.code}`) })),
      changeNote: text(form, "changeNote"),
    });
    return `Version ${versionNo} saved. Running milestones keep their version. New milestones use version ${versionNo}.`;
  });
  if (result.ok) revalidatePath("/coordinator/templates");
  return result;
}

export async function setTargetDateAction(_prev: FormState, form: FormData): Promise<FormState> {
  const result = await runAction(async (ctx) => {
    const date = optionalText(form, "targetDate");
    await setTargetDate(ctx, text(form, "milestoneId"), date);
    return date ? "Target date saved." : "Target date cleared.";
  });
  if (result.ok) revalidatePath("/coordinator/templates");
  return result;
}
