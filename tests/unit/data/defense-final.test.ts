// P3-E01: a Final defense takes TDW 13 scored sheets from the Final Panel only, and the Coordinator verifies them (FR-DEF-05, FR-DEF-06, BR-15).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor, DataContext } from "@/server/data/access";
import { confirmSheetUpload, saveSheet, verifySheet } from "@/server/data/defense";
import type { Db } from "@/server/data/db";
import type { FilePort } from "@/server/data/documents";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: { userId: u.id, role: u.role, isActive: true } as Actor });
const files: FilePort = {
  createUploadLink: async () => ({ key: "agent-b/test/scan/x.pdf", url: "https://store.test/put", headers: {} }),
  checkStoredFile: async () => true,
};

async function finalWorld() {
  const t = await makeThesisChain(db);
  const chair = await makeUser(db, "panel_member");
  const member = await makeUser(db, "panel_member");
  const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "final"));
  const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, tpl!.id));
  const [m3] = await db
    .insert(s.milestoneInstance)
    .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "final", status: "DEFENSE_SCHEDULED" })
    .returning();
  const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "final_panel" }).returning();
  await db.insert(s.committeeMember).values([
    { committeeId: com!.id, memberUserId: chair.id, designation: "panel_chair", status: "accepted" },
    { committeeId: com!.id, memberUserId: member.id, designation: "none", status: "accepted" },
  ]);
  const [attempt] = await db
    .insert(s.defenseAttempt)
    .values({ milestoneInstanceId: m3!.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date(Date.now() - 3_600_000) })
    .returning();
  const rubric = await db.select().from(s.rubricIndicator).where(eq(s.rubricIndicator.templateVersionId, v!.id));
  return { ...t, chair, member, attempt: attempt!, scores: rubric.map((r) => ({ indicatorId: r.id, score: r.weightPct })) };
}

describe("TDW 13 sheet at Final (FR-DEF-05, FR-DEF-06)", () => {
  it("takes scored sheets from the Panel Chair and a Panel Member, none from the Adviser, and the Coordinator verifies", async () => {
    const w = await finalWorld();
    expect(w.scores.length).toBeGreaterThan(0);
    const sheet = { actionTaken: "approved" as const, comments: [] };
    // The Adviser completes no sheet at the Final (FR-DEF-06).
    await expect(saveSheet(as(w.adviser), w.attempt.id, { ...sheet, scores: w.scores })).rejects.toThrow();
    // A score above the indicator weight is refused (FR-DEF-05).
    await expect(saveSheet(as(w.member), w.attempt.id, { ...sheet, scores: [{ indicatorId: w.scores[0]!.indicatorId, score: 999 }] })).rejects.toThrow();
    const a = await saveSheet(as(w.chair), w.attempt.id, { ...sheet, scores: w.scores });
    const b = await saveSheet(as(w.member), w.attempt.id, { ...sheet, scores: w.scores });
    expect(a.total).not.toBeNull();
    for (const e of [a, b]) {
      await confirmSheetUpload(as(w.coordinator), e.entryId, { key: `agent-b/test/scan/${crypto.randomUUID()}.pdf`, sha256: "c".repeat(64), size: 10, contentType: "application/pdf" }, files);
      await verifySheet(as(w.coordinator), e.entryId, "matched");
    }
    const rows = await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, w.attempt.id));
    expect(rows.map((r) => r.form)).toEqual(["TDW_13", "TDW_13"]);
    expect(rows.every((r) => r.verifiedAt !== null && r.sheetMatch === "matched")).toBe(true);
  });
});
