// Milestone Templates, versions and target dates (FR-TPL-01 to FR-TPL-05, INV-26, C8). Server only.
import "server-only";
import { and, asc, desc, eq, max } from "drizzle-orm";
import type { DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import type { Db } from "./db";
import {
  milestoneInstance,
  milestoneTemplate,
  rubricIndicator,
  templateRequiredItem,
  templateVersion,
  type FormCode,
  type MilestoneCodeValue,
  type UserRole,
} from "./schema";

export type TemplateParams = {
  minNoticeDays: number;
  printedCopiesDueDays: number;
  panelSizeMasters: number;
  panelSizeDoctoral: number;
  printedCopiesMasters: number;
  printedCopiesDoctoral: number;
  reviewerWaitDays: number | null;
};
export type RequiredItemInput = {
  formCode: FormCode;
  label: string;
  paperSigners: string | null;
  uploaderRole: UserRole;
  neededForDateConfirmation: boolean;
};
export type RubricInput = { code: string; label: string; weightPct: number };
export type TemplateVersionInput = TemplateParams & {
  items: RequiredItemInput[];
  rubric: RubricInput[];
  changeNote: string;
};

// FR-TPL-03: a rubric totals 100%. Pre-Final (TDW 10) has no scores, so an empty rubric is allowed there only.
export function rubricProblem(code: MilestoneCodeValue, rubric: readonly RubricInput[]): string | null {
  if (rubric.length === 0) return code === "pre_final" ? null : "Add the rubric indicators. The weights must total 100%.";
  if (code === "pre_final") return "Pre-Final uses TDW 10, which has no scores. Remove the rubric.";
  const codes = new Set(rubric.map((r) => r.code.trim()));
  if (codes.size !== rubric.length) return "Each rubric indicator needs its own code.";
  const total = rubric.reduce((sum, r) => sum + r.weightPct, 0);
  if (total !== 100) return `The rubric weights total ${total}%. They must total 100%.`;
  return null;
}

function paramsProblem(p: TemplateParams): string | null {
  const counts = [p.panelSizeMasters, p.panelSizeDoctoral, p.printedCopiesMasters, p.printedCopiesDoctoral];
  if (counts.some((n) => !Number.isInteger(n) || n < 1)) return "Sizes and copy counts must be whole numbers of 1 or more.";
  const days = [p.minNoticeDays, p.printedCopiesDueDays, p.reviewerWaitDays ?? 0];
  if (days.some((n) => !Number.isInteger(n) || n < 0)) return "Day counts must be whole numbers of 0 or more.";
  return null;
}

// The latest version of a template. Call only after an access check.
export async function latestVersionId(db: Db, code: MilestoneCodeValue): Promise<string> {
  const [row] = await db
    .select({ id: templateVersion.id })
    .from(templateVersion)
    .innerJoin(milestoneTemplate, eq(milestoneTemplate.id, templateVersion.milestoneTemplateId))
    .where(eq(milestoneTemplate.code, code))
    .orderBy(desc(templateVersion.versionNo))
    .limit(1);
  if (!row) throw new Error(`No template version for ${code}. Run the migrations (FR-TPL-02).`);
  return row.id;
}

export type TemplateSummary = {
  code: MilestoneCodeValue;
  name: string;
  version: typeof templateVersion.$inferSelect;
  items: (typeof templateRequiredItem.$inferSelect)[];
  rubric: (typeof rubricIndicator.$inferSelect)[];
};

// The latest version of each template, with its items and rubric (C8).
export async function listTemplates(ctx: DataContext): Promise<TemplateSummary[]> {
  requireCoordinator(ctx, "manages templates");
  const templates = await ctx.db.select().from(milestoneTemplate);
  const order: MilestoneCodeValue[] = ["proposal", "pre_final", "final"];
  templates.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
  const out: TemplateSummary[] = [];
  for (const t of templates) {
    const [version] = await ctx.db
      .select()
      .from(templateVersion)
      .where(eq(templateVersion.milestoneTemplateId, t.id))
      .orderBy(desc(templateVersion.versionNo))
      .limit(1);
    if (!version) continue;
    const items = await ctx.db
      .select()
      .from(templateRequiredItem)
      .where(eq(templateRequiredItem.templateVersionId, version.id));
    const rubric = await ctx.db
      .select()
      .from(rubricIndicator)
      .where(eq(rubricIndicator.templateVersionId, version.id))
      .orderBy(asc(rubricIndicator.code));
    out.push({ code: t.code, name: t.name, version, items, rubric });
  }
  return out;
}

// FR-TPL-04: a change makes a new version. Running milestones keep theirs (INV-26).
export async function saveTemplateVersion(
  ctx: DataContext,
  code: MilestoneCodeValue,
  input: TemplateVersionInput,
): Promise<{ versionId: string; versionNo: number }> {
  requireCoordinator(ctx, "manages templates");
  const problem = paramsProblem(input) ?? rubricProblem(code, input.rubric);
  if (problem) throw new InputProblem(problem);
  if (!input.changeNote.trim()) throw new InputProblem("Write a short note about the change.");
  if (input.items.some((i) => !i.label.trim())) throw new InputProblem("Each required item needs a label.");

  return ctx.db.transaction(async (tx) => {
    const [tpl] = await tx.select().from(milestoneTemplate).where(eq(milestoneTemplate.code, code));
    if (!tpl) throw new InputProblem("This template does not exist.");
    const [{ last } = { last: 0 }] = await tx
      .select({ last: max(templateVersion.versionNo) })
      .from(templateVersion)
      .where(eq(templateVersion.milestoneTemplateId, tpl.id));
    const versionNo = (last ?? 0) + 1;
    const [version] = await tx
      .insert(templateVersion)
      .values({
        milestoneTemplateId: tpl.id,
        versionNo,
        minNoticeDays: input.minNoticeDays,
        printedCopiesDueDays: input.printedCopiesDueDays,
        panelSizeMasters: input.panelSizeMasters,
        panelSizeDoctoral: input.panelSizeDoctoral,
        printedCopiesMasters: input.printedCopiesMasters,
        printedCopiesDoctoral: input.printedCopiesDoctoral,
        reviewerWaitDays: input.reviewerWaitDays,
        changeNote: input.changeNote.trim(),
        createdByUserId: ctx.actor.userId,
      })
      .returning();
    if (input.items.length) {
      await tx.insert(templateRequiredItem).values(input.items.map((i) => ({ ...i, templateVersionId: version!.id })));
    }
    if (input.rubric.length) {
      await tx.insert(rubricIndicator).values(input.rubric.map((r) => ({ ...r, templateVersionId: version!.id })));
    }
    await recordAudit(
      { db: tx, actor: ctx.actor },
      { action: "template.version", targetTable: "template_version", targetId: version!.id, detail: { code, versionNo } },
    );
    return { versionId: version!.id, versionNo };
  });
}

// FR-TPL-05: the Coordinator sets or clears a milestone target date (YYYY-MM-DD, PST calendar day).
export async function setTargetDate(ctx: DataContext, milestoneInstanceId: string, date: string | null): Promise<void> {
  requireCoordinator(ctx, "sets target dates");
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new InputProblem("Enter the date as YYYY-MM-DD.");
  await ctx.db.transaction(async (tx) => {
    const rows = await tx
      .update(milestoneInstance)
      .set({ targetDate: date })
      .where(and(eq(milestoneInstance.id, milestoneInstanceId)))
      .returning({ id: milestoneInstance.id });
    if (!rows.length) throw new InputProblem("This milestone does not exist.");
    await recordAudit(
      { db: tx, actor: ctx.actor },
      { action: "milestone.target_date", targetTable: "milestone_instance", targetId: milestoneInstanceId, detail: { date } },
    );
  });
}
