// Fake seed data for the Milestone 1 end-to-end test (P1-E13-T01, AD-B-017).
// Fake data only (AGENTS.md §11): every address ends in @example.test.
// It writes the start state of USERFLOW §5: the three milestone templates with the
// FR §3 defaults, one user for each role, a Master's thesis and its Proposal milestone
// in DRAFT. The test itself makes the committee, the commits and the documents.
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";

type MilestoneCode = s.MilestoneCodeValue;
type FormCode = (typeof s.formCode.enumValues)[number];
type Role = (typeof s.userRole.enumValues)[number];

/** FR §3 rubric weights for TDW 08 and TDW 13. They total 100 (INV-25). */
export const RUBRIC = [
  { code: "A1", label: "Indicator A1", weightPct: 10 },
  { code: "A2", label: "Indicator A2", weightPct: 20 },
  { code: "A3", label: "Indicator A3", weightPct: 20 },
  { code: "A4", label: "Indicator A4", weightPct: 10 },
  { code: "B1", label: "Indicator B1", weightPct: 10 },
  { code: "B2", label: "Indicator B2", weightPct: 10 },
  { code: "B3", label: "Indicator B3", weightPct: 20 },
] as const;

type Item = { formCode: FormCode; label: string; uploaderRole: Role; neededForDateConfirmation: boolean };
const item = (formCode: FormCode, label: string, uploaderRole: Role, needed = true): Item => ({
  formCode,
  label,
  uploaderRole,
  neededForDateConfirmation: needed,
});

/**
 * One version of each template. Panel sizes count every seat (AD-B-017): Proposal
 * 2 / 3 Panel Members (FR §3, Adviser not counted). Final 4 / 5 seats, the Panel Chair
 * plus 3 / 4, so the seats match the Final sheet count. Pre-Final has no appointment
 * and keeps the Proposal size. Printed copies 5 / 6 for each milestone ([CONFIRM] FR §3
 * gives only the Proposal count).
 */
export const TEMPLATES: Record<
  MilestoneCode,
  { name: string; panel: [number, number]; rubric: boolean; items: Item[] }
> = {
  proposal: {
    name: "Proposal Defense",
    panel: [2, 3],
    rubric: true,
    items: [
      item("TDW_03", "TDW 03", "adviser"),
      item("TDW_06", "TDW 06 appointment form", "coordinator"),
      item("TDW_05", "TDW 05 NDA for each member", "coordinator"),
      item("TDW_07", "TDW 07 endorsement", "student"),
      item("OR", "Official receipt", "student"),
      item("CERTIFICATION", "Certification", "student", false),
    ],
  },
  pre_final: {
    name: "Pre-Final Defense",
    panel: [2, 3],
    rubric: false,
    items: [
      item("TDW_03", "TDW 03", "adviser"),
      item("TDW_09", "TDW 09 endorsement", "student"),
      item("OR", "Official receipt", "student"),
    ],
  },
  final: {
    name: "Final Defense",
    panel: [4, 5],
    rubric: true,
    items: [
      item("TDW_03", "TDW 03", "adviser"),
      item("TDW_11", "TDW 11 appointment form", "coordinator"),
      item("TDW_05", "TDW 05 NDA for each member", "coordinator"),
      item("TDW_12", "TDW 12 endorsement", "student"),
      item("OR", "Official receipt", "student"),
      item("SIGNED_FINAL_MANUSCRIPT", "Signed final manuscript", "student", false),
    ],
  },
};

const MILESTONES: MilestoneCode[] = ["proposal", "pre_final", "final"];

/** Writes version 1 of each template, with its required items and rubric. */
export async function seedTemplates(db: Db, createdByUserId: string) {
  const versions = {} as Record<MilestoneCode, typeof s.templateVersion.$inferSelect>;
  for (const code of MILESTONES) {
    const t = TEMPLATES[code];
    const [tpl] = await db.insert(s.milestoneTemplate).values({ code, name: t.name }).returning();
    const [version] = await db
      .insert(s.templateVersion)
      .values({
        milestoneTemplateId: tpl!.id,
        versionNo: 1,
        panelSizeMasters: t.panel[0],
        panelSizeDoctoral: t.panel[1],
        printedCopiesMasters: 5,
        printedCopiesDoctoral: 6,
        createdByUserId,
      })
      .returning();
    await db.insert(s.templateRequiredItem).values(t.items.map((i) => ({ ...i, templateVersionId: version!.id })));
    if (t.rubric) {
      await db.insert(s.rubricIndicator).values(RUBRIC.map((r) => ({ ...r, templateVersionId: version!.id })));
    }
    versions[code] = version!;
  }
  return versions;
}

async function user(db: Db, role: Role, key: string, fullName: string) {
  const [u] = await db
    .insert(s.appUser)
    .values({ fullName, email: `${key}@example.test`, role })
    .returning();
  return u!;
}

/**
 * The start state for P1-E13: one user for each role, five Panel Members (two seats for
 * the Evaluation Committee, the rest for a substitute and later the Final Panel), the
 * templates, a Master's thesis and its Proposal milestone in DRAFT.
 */
export async function seedMilestone1(db: Db) {
  const coordinator = await user(db, "coordinator", "coordinator", "Fake Coordinator");
  const student = await user(db, "student", "student.m1", "Fake Student M1");
  const adviser = await user(db, "adviser", "adviser.m1", "Fake Adviser M1");
  const panel = [];
  for (let i = 1; i <= 5; i++) panel.push(await user(db, "panel_member", `panel.${i}`, `Fake Panel Member ${i}`));
  const versions = await seedTemplates(db, coordinator.id);
  const [thesis] = await db
    .insert(s.thesisInstance)
    .values({
      studentUserId: student.id,
      adviserUserId: adviser.id,
      title: "Fake thesis for the Milestone 1 test",
      degreeLevel: "masters",
      programStartTerm: "2025-1",
      writing1Course: "RSH_641",
      createdByUserId: coordinator.id,
    })
    .returning();
  const [milestone] = await db
    .insert(s.milestoneInstance)
    .values({ thesisInstanceId: thesis!.id, templateVersionId: versions.proposal.id, milestoneCode: "proposal" })
    .returning();
  return { coordinator, student, adviser, panel, versions, thesis: thesis!, milestone: milestone! };
}
