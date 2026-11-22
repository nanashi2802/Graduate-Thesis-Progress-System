// P1-E13-T01: the fake seed loads on the real migrations and matches FR §3 and the domain rules.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { checkAppointment, type PanelSizes } from "@/server/domain/committee";
import { checkRubricWeights, expectedEvaluators } from "@/server/domain/evaluation";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;

beforeAll(async () => {
  ({ db, close } = await makeTestDb());
  seed = await seedMilestone1(db);
});
afterAll(() => close());

describe("Milestone 1 seed (P1-E13-T01)", () => {
  it("makes one account for each role, with fake addresses only (AGENTS.md §11)", async () => {
    const users = await db.select().from(s.appUser);
    expect(new Set(users.map((u) => u.role))).toEqual(new Set(["coordinator", "student", "adviser", "panel_member"]));
    expect(users.every((u) => u.email.endsWith("@example.test"))).toBe(true);
  });

  it("starts the Proposal milestone in DRAFT", () => {
    expect(seed.milestone.status).toBe("DRAFT");
    expect(seed.milestone.milestoneCode).toBe("proposal");
  });

  it("gives TDW 08 and TDW 13 rubrics that total 100, and none for TDW 10 (INV-25)", async () => {
    for (const code of ["proposal", "final"] as const) {
      const rows = await db.select().from(s.rubricIndicator).where(eq(s.rubricIndicator.templateVersionId, seed.versions[code].id));
      expect(rows).toHaveLength(7);
      expect(checkRubricWeights(rows.map((r) => ({ id: r.code, weightPct: r.weightPct })))).toEqual({ ok: true });
    }
    const preFinal = await db
      .select()
      .from(s.rubricIndicator)
      .where(eq(s.rubricIndicator.templateVersionId, seed.versions.pre_final.id));
    expect(preFinal).toHaveLength(0);
  });

  it("sets panel sizes that give the FR §3 sheet counts (AD-B-017)", () => {
    const v = seed.versions;
    const sizes: PanelSizes = {
      masters: { proposal: v.proposal.panelSizeMasters, final: v.final.panelSizeMasters },
      doctoral: { proposal: v.proposal.panelSizeDoctoral, final: v.final.panelSizeDoctoral },
    };
    const sheets = (milestone: "proposal" | "pre_final" | "final", seats: number) =>
      expectedEvaluators({
        milestone,
        adviserUserId: "adv",
        memberUserIds: Array.from({ length: seats }, (_, i) => `p${i}`),
        substitutes: [],
      }).length;
    // FR §3: Proposal and Pre-Final 3 / 4 sheets (Adviser included), Final 4 / 5 (Adviser excluded).
    expect(sheets("proposal", sizes.masters.proposal)).toBe(3);
    expect(sheets("proposal", sizes.doctoral.proposal)).toBe(4);
    expect(sheets("pre_final", sizes.masters.proposal)).toBe(3);
    expect(sheets("final", sizes.masters.final)).toBe(4);
    expect(sheets("final", sizes.doctoral.final)).toBe(5);
  });

  it("has enough Panel Members for a valid Evaluation Committee", () => {
    const [lead, chair] = seed.panel;
    const v = seed.versions;
    const decision = checkAppointment({
      actorRole: "coordinator",
      milestone: "proposal",
      level: "masters",
      sizes: {
        masters: { proposal: v.proposal.panelSizeMasters, final: v.final.panelSizeMasters },
        doctoral: { proposal: v.proposal.panelSizeDoctoral, final: v.final.panelSizeDoctoral },
      },
      adviserUserId: seed.adviser.id,
      seats: [
        { memberUserId: lead!.id, designation: "lead_panel_member", status: "accepted" },
        { memberUserId: chair!.id, designation: "panel_chair", status: "accepted" },
      ],
    });
    expect(decision).toEqual({ ok: true });
  });

  it("lists the FR-DOC-08 forms as items needed for the date confirmation", async () => {
    const rows = await db
      .select()
      .from(s.templateRequiredItem)
      .where(eq(s.templateRequiredItem.templateVersionId, seed.versions.proposal.id));
    const needed = rows.filter((r) => r.neededForDateConfirmation).map((r) => r.formCode);
    expect(needed.sort()).toEqual(["OR", "TDW_03", "TDW_05", "TDW_06", "TDW_07"]);
  });
});
