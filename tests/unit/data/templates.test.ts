// P1-E03-T01, T02: default templates, versions and target dates
// (FR-TPL-01 to FR-TPL-05, INV-26, AD-A-015).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import {
  latestVersionId,
  listTemplates,
  rubricProblem,
  saveTemplateVersion,
  setTargetDate,
  type TemplateVersionInput,
} from "@/server/data/templates";
import { makeThesisChain } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let c: Awaited<ReturnType<typeof makeThesisChain>>;
let coordinator: Actor;

beforeEach(async () => {
  ({ db } = await makeTestDb());
  c = await makeThesisChain(db);
  coordinator = { userId: c.coordinator.id, role: "coordinator", isActive: true };
});

const RUBRIC = [
  { code: "A1", label: "Contribution", weightPct: 40 },
  { code: "A2", label: "Substance", weightPct: 60 },
];
const input = (over: Partial<TemplateVersionInput> = {}): TemplateVersionInput => ({
  minNoticeDays: 7,
  printedCopiesDueDays: 7,
  panelSizeMasters: 2,
  panelSizeDoctoral: 3,
  printedCopiesMasters: 5,
  printedCopiesDoctoral: 6,
  reviewerWaitDays: null,
  items: [{ formCode: "TDW_07", label: "Endorsement", paperSigners: null, uploaderRole: "student", neededForDateConfirmation: true }],
  rubric: RUBRIC,
  changeNote: "Test change",
  ...over,
});

describe("default templates (FR-TPL-02, AD-A-015)", () => {
  it("ships three templates with forms, sizes and a 100% rubric on Proposal and Final", async () => {
    const list = await listTemplates({ db, actor: coordinator });
    const byCode = Object.fromEntries(list.map((t) => [t.code, t]));
    expect(list.map((t) => t.code)).toEqual(["proposal", "pre_final", "final"]);
    expect(byCode.proposal!.items.map((i) => i.formCode).sort()).toEqual(
      ["OR", "TDW_03", "TDW_05", "TDW_06", "TDW_07", "TDW_08"].sort(),
    );
    expect(byCode.final!.version).toMatchObject({ panelSizeMasters: 3, panelSizeDoctoral: 4 });
    expect(byCode.pre_final!.rubric).toHaveLength(0);
    for (const code of ["proposal", "final"]) {
      expect(byCode[code]!.rubric.reduce((sum, r) => sum + r.weightPct, 0)).toBe(100);
    }
  });
});

describe("rubricProblem (FR-TPL-03)", () => {
  it("refuses weights that do not total 100% and a duplicate code", () => {
    expect(rubricProblem("proposal", RUBRIC)).toBeNull();
    expect(rubricProblem("proposal", [{ code: "A1", label: "x", weightPct: 90 }])).toMatch(/90%/);
    expect(rubricProblem("final", [...RUBRIC, { code: "A1", label: "y", weightPct: 0 }])).toMatch(/own code/);
    expect(rubricProblem("proposal", [])).not.toBeNull();
    expect(rubricProblem("pre_final", [])).toBeNull();
    expect(rubricProblem("pre_final", RUBRIC)).toMatch(/TDW 10/);
  });
});

describe("saveTemplateVersion (FR-TPL-04)", () => {
  it("makes version 2 with an audit record, and the old milestone keeps its version", async () => {
    const res = await saveTemplateVersion({ db, actor: coordinator }, "proposal", input());
    expect(res.versionNo).toBe(2);
    expect(await latestVersionId(db, "proposal")).toBe(res.versionId);
    const [m] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, c.milestone.id));
    expect(m!.templateVersionId).toBe(c.version.id);
    const audits = await db.select().from(s.auditRecord);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ action: "template.version", targetId: res.versionId });
  });

  it("refuses a bad rubric and writes nothing", async () => {
    await expect(
      saveTemplateVersion({ db, actor: coordinator }, "proposal", input({ rubric: [{ code: "A1", label: "x", weightPct: 50 }] })),
    ).rejects.toThrow(InputProblem);
    expect(await db.select().from(s.auditRecord)).toHaveLength(0);
  });

  it("denies every role except the Coordinator", async () => {
    const adviser: Actor = { userId: c.adviser.id, role: "adviser", isActive: true };
    await expect(saveTemplateVersion({ db, actor: adviser }, "proposal", input())).rejects.toThrow(AccessDeniedError);
    await expect(listTemplates({ db, actor: adviser })).rejects.toThrow(AccessDeniedError);
  });
});

describe("setTargetDate (FR-TPL-05)", () => {
  it("sets and clears the date with an audit record", async () => {
    await setTargetDate({ db, actor: coordinator }, c.milestone.id, "2027-03-15");
    let [m] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, c.milestone.id));
    expect(m!.targetDate).toBe("2027-03-15");
    await setTargetDate({ db, actor: coordinator }, c.milestone.id, null);
    [m] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, c.milestone.id));
    expect(m!.targetDate).toBeNull();
    expect(await db.select().from(s.auditRecord)).toHaveLength(2);
  });

  it("refuses a bad date and a non-Coordinator", async () => {
    await expect(setTargetDate({ db, actor: coordinator }, c.milestone.id, "15/03/2027")).rejects.toThrow(InputProblem);
    const student: Actor = { userId: c.student.id, role: "student", isActive: true };
    await expect(setTargetDate({ db, actor: student }, c.milestone.id, "2027-03-15")).rejects.toThrow(AccessDeniedError);
  });
});
