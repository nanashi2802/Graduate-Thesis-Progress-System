// P2-E02-T02: a Pre-Final defense takes TDW 10 comments-only sheets, and the Coordinator verifies them (FR-DEF-05, FR-DEF-06, FR-DOC-08, INV-14, BR-15).
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

async function preFinalWorld() {
  const t = await makeThesisChain(db);
  const member = await makeUser(db, "panel_member");
  const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "pre_final"));
  const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, tpl!.id));
  const [m2] = await db
    .insert(s.milestoneInstance)
    .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "pre_final", status: "DEFENSE_SCHEDULED" })
    .returning();
  const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
  await db.insert(s.committeeMember).values({ committeeId: com!.id, memberUserId: member.id, designation: "lead_panel_member", status: "accepted" });
  const [attempt] = await db
    .insert(s.defenseAttempt)
    .values({ milestoneInstanceId: m2!.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date(Date.now() - 3_600_000) })
    .returning();
  return { ...t, member, attempt: attempt! };
}

describe("TDW 10 sheet at Pre-Final (FR-DEF-05, FR-DEF-06, FR-DOC-08)", () => {
  it("takes chapter comments from the Adviser and a member, refuses scores, and the Coordinator verifies", async () => {
    const w = await preFinalWorld();
    const comments = [{ section: "chapter_1" as const, body: "Tighten the problem statement." }];
    // TDW 10 has no scores and no general observations box.
    await expect(saveSheet(as(w.member), w.attempt.id, { actionTaken: "approved", scores: [{ indicatorId: crypto.randomUUID(), score: 1 }], comments })).rejects.toThrow();
    const a = await saveSheet(as(w.adviser), w.attempt.id, { actionTaken: "approved_with_revisions", scores: [], comments });
    const b = await saveSheet(as(w.member), w.attempt.id, { actionTaken: "approved", scores: [], comments });
    expect(a.total).toBeNull();
    // The Student never completes a sheet.
    await expect(saveSheet(as(w.student), w.attempt.id, { actionTaken: "approved", scores: [], comments })).rejects.toThrow();
    for (const e of [a, b]) {
      await confirmSheetUpload(as(w.coordinator), e.entryId, { key: `agent-b/test/scan/${crypto.randomUUID()}.pdf`, sha256: "b".repeat(64), size: 10, contentType: "application/pdf" }, files);
      await verifySheet(as(w.coordinator), e.entryId, "matched");
    }
    const rows = await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, w.attempt.id));
    expect(rows.map((r) => [r.form, r.sheetMatch])).toEqual([["TDW_10", "matched"], ["TDW_10", "matched"]]);
    expect(rows.every((r) => r.verifiedAt !== null)).toBe(true);
  });
});
