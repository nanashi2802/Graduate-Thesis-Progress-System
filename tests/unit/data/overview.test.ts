// P1-E11-T03 (Coordinator part): the C1 overview (FR-TRK-04, FR-TRK-06, NFR-01, NFR-04, BR-17).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { coordinatorOverview } from "@/server/data/overview";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const coord = () => ({ db, actor: actorOf(seed.coordinator) });
const setStatus = (status: (typeof s.milestoneStatus.enumValues)[number], extra: Partial<typeof s.milestoneInstance.$inferInsert> = {}) =>
  db.update(s.milestoneInstance).set({ status, ...extra }).where(eq(s.milestoneInstance.id, seed.milestone.id));

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
});

describe("coordinatorOverview", () => {
  it("shows every group with a count of zero for a new thesis, and one Student row", async () => {
    const o = await coordinatorOverview(coord());
    expect(o.queue).toEqual([]);
    expect(o.kpis).toHaveLength(7);
    expect(o.kpis.every((k) => k.count === 0)).toBe(true);
    expect(o.students).toEqual([
      expect.objectContaining({ studentName: seed.student.fullName, adviserName: seed.adviser.fullName, milestone: "proposal", status: "DRAFT", pacingFlag: false }),
    ]);
  });

  it("queues the Coordinator steps by status, and each KPI count equals its queue", async () => {
    const cases = [
      ["ADVISER_ENDORSED", "appoint_committee"],
      ["DATE_PROPOSED", "confirm_date"],
      ["DEFENSE_HELD", "close_stage"],
      ["CLOSED", "certify"],
    ] as const;
    for (const [status, kind] of cases) {
      await setStatus(status);
      const o = await coordinatorOverview(coord());
      expect(o.queue.map((q) => q.kind), status).toEqual([kind]);
      expect(o.kpis.find((k) => k.kind === kind)!.count).toBe(1);
      expect(o.kpis.reduce((n, k) => n + k.count, 0)).toBe(1);
    }
    await setStatus("READY"); // The Adviser acts, not the Coordinator.
    expect((await coordinatorOverview(coord())).queue).toEqual([]);
  });

  it("gives the latest attempt for the link to the defense page", async () => {
    await db.insert(s.defenseAttempt).values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "held" });
    const [second] = await db.insert(s.defenseAttempt).values({ milestoneInstanceId: seed.milestone.id, attemptNo: 2, status: "held" }).returning();
    await setStatus("DEFENSE_HELD");
    expect((await coordinatorOverview(coord())).queue[0]).toMatchObject({ kind: "close_stage", attemptId: second!.id });
    await setStatus("ADVISER_ENDORSED");
    expect((await coordinatorOverview(coord())).queue[0]!.attemptId).toBe(second!.id);
  });

  it("queues the scans that wait for review, with a count", async () => {
    await db.insert(s.documentRecord).values([
      { milestoneInstanceId: seed.milestone.id, formCode: "TDW_07", state: "locked_as_submitted" },
      { milestoneInstanceId: seed.milestone.id, formCode: "OR", state: "locked_as_submitted" },
      { milestoneInstanceId: seed.milestone.id, formCode: "TDW_03", state: "verified" },
    ]);
    const o = await coordinatorOverview(coord());
    expect(o.queue).toEqual([expect.objectContaining({ kind: "review_documents", count: 2, studentName: seed.student.fullName })]);
  });

  it("counts the days a record waits from the last gate change", async () => {
    await setStatus("DATE_PROPOSED");
    await db.insert(s.gateAction).values({
      milestoneInstanceId: seed.milestone.id,
      gate: "gate_1b",
      result: "endorsed",
      actorUserId: seed.adviser.id,
      actorRole: "adviser",
      createdAt: new Date("2026-11-10T00:00:00Z"),
    });
    const o = await coordinatorOverview(coord(), new Date("2026-11-20T00:00:00Z"));
    expect(o.queue[0]!.daysWaiting).toBe(10);
  });

  it("flags a Student past the target date, as information only (FR-TRK-06, BR-17)", async () => {
    await setStatus("READY", { targetDate: "2026-11-01" });
    const o = await coordinatorOverview(coord(), new Date("2026-11-20T00:00:00Z"));
    expect(o.students[0]!.pacingFlag).toBe(true);
    await setStatus("CLOSED", { targetDate: "2026-11-01" });
    expect((await coordinatorOverview(coord(), new Date("2026-11-20T00:00:00Z"))).students[0]!.pacingFlag).toBe(false);
    await setStatus("READY", { targetDate: "2026-12-01" });
    expect((await coordinatorOverview(coord(), new Date("2026-11-20T00:00:00Z"))).students[0]!.pacingFlag).toBe(false);
  });

  it("is for the Coordinator only (NFR-01)", async () => {
    for (const u of [seed.student, seed.adviser, seed.panel[0]!]) {
      await expect(coordinatorOverview({ db, actor: actorOf(u) })).rejects.toBeInstanceOf(AccessDeniedError);
    }
    await expect(coordinatorOverview({ db, actor: { ...actorOf(seed.coordinator), isActive: false } })).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
