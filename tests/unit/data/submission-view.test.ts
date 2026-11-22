// P3-E05-T01: the shared submission view (FR-SUB-01 to FR-SUB-04, BR-08).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "@/server/data/db";
import { milestoneInstance, type UserRole } from "@/server/data/schema";
import { submissionView } from "@/server/data/submission-view";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { actorOf, runMilestone1 } from "../../support/flow";
import { makeTestDb } from "../../support/test-db";

let db: Db;
const as = (u: { id: string; role: UserRole }) => ({ db, actor: actorOf(u) });
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

describe("submission view", () => {
  it("is closed before Gate 1b, with a reason", async () => {
    const t = await makeThesisChain(db);
    const [m] = await db.select().from(milestoneInstance).where(eq(milestoneInstance.thesisInstanceId, t.thesis.id));
    const v = await submissionView(as(t.student), m!.id);
    expect(v.open).toBe(false);
    if (!v.open) expect(v.reason).toMatch(/Gate 1b/);
  });

  it("shows one record to the Student, Adviser, Panel Members and Coordinator, and refuses others", async () => {
    const f = await runMilestone1(db);
    for (const u of [f.student, f.adviser, f.lead, f.chair, f.coordinator]) {
      const v = await submissionView(as(u), f.milestoneId);
      expect(v.open).toBe(true);
      if (!v.open) continue;
      expect(v.lockedCommit?.ordinal).toBe(1);
      expect(v.gates.map((g) => g.gate)).toContain("gate_1b");
      expect(v.checklist.length).toBeGreaterThan(0);
      expect(v.defense?.roomOrLink).toBe("Room 101");
      expect(v.threads.open).toBe(0);
      expect(v.threads.resolved).toBeGreaterThan(0);
      expect(v.minutes?.body).toContain("approved"); // the stage is closed
    }
    // Another Student, another Adviser and a Panel Member with no seat get no view (FR-SUB-02).
    for (const role of ["student", "adviser", "panel_member"] as const) {
      await expect(submissionView(as(await makeUser(db, role)), f.milestoneId)).rejects.toThrow();
    }
  });
});
