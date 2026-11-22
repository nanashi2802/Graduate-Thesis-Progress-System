// P1-E09-T05 (C6 part): the Coordinator's defense page data (FR-DEF-05 to 10, NFR-01, BR-11, BR-15, BR-18).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { defenseDetail } from "@/server/data/defense-view";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
let attemptId: string;
const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const coord = () => ({ db, actor: actorOf(seed.coordinator) });

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
  const [c] = await db.insert(s.committee).values({ thesisInstanceId: seed.thesis.id, kind: "evaluation_committee" }).returning();
  await db.insert(s.committeeMember).values([
    { committeeId: c!.id, memberUserId: seed.panel[0]!.id, designation: "lead_panel_member", status: "accepted" },
    { committeeId: c!.id, memberUserId: seed.panel[1]!.id, designation: "panel_chair", status: "accepted" },
  ]);
  await db.update(s.milestoneInstance).set({ status: "DEFENSE_SCHEDULED" }).where(eq(s.milestoneInstance.id, seed.milestone.id));
  const [a] = await db
    .insert(s.defenseAttempt)
    .values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date("2026-11-20T01:00:00Z"), roomOrLink: "Room 2" })
    .returning();
  attemptId = a!.id;
});

describe("defenseDetail", () => {
  it("lists one sheet row for each expected evaluator, with the reason each action is blocked (BR-18)", async () => {
    await db.insert(s.evaluationEntry).values([
      { defenseAttemptId: attemptId, memberUserId: seed.adviser.id, form: "TDW_08", actionTaken: "approved", sheetFileKey: "agent-b/test/scan/a.pdf" },
      { defenseAttemptId: attemptId, memberUserId: seed.panel[0]!.id, form: "TDW_08", actionTaken: "approved" },
    ]);
    const d = await defenseDetail(coord(), attemptId);
    expect(d).toMatchObject({ attemptNo: 1, attemptStatus: "scheduled", milestone: "proposal", studentName: seed.student.fullName, roomOrLink: "Room 2" });
    expect(d.sheets.map((x) => x.memberUserId).sort()).toEqual([seed.adviser.id, seed.panel[0]!.id, seed.panel[1]!.id].sort());
    const by = (id: string) => d.sheets.find((x) => x.memberUserId === id)!;
    expect(by(seed.adviser.id)).toMatchObject({ hasScan: true, verified: false, verifyBlockedReason: null, total: null });
    expect(by(seed.panel[0]!.id).verifyBlockedReason).toBe("Upload the signed scan first.");
    expect(by(seed.panel[1]!.id)).toMatchObject({ entryId: null, verifyBlockedReason: "The member has not saved the sheet yet." });
  });

  it("blocks Close until the defense is held, and Minutes until it is held (BR-18)", async () => {
    const d = await defenseDetail(coord(), attemptId);
    expect(d.closeBlockedReason).toContain("not held yet");
    expect(d.minutesBlockedReason).toBe("The Minutes follow a held defense.");
    expect(d.showCertify).toBe(false);
    await db.update(s.milestoneInstance).set({ status: "DEFENSE_HELD" }).where(eq(s.milestoneInstance.id, seed.milestone.id));
    await db.update(s.defenseAttempt).set({ status: "held" }).where(eq(s.defenseAttempt.id, attemptId));
    const held = await defenseDetail(coord(), attemptId);
    expect(held.minutesBlockedReason).toBeNull();
    expect(held.closeBlockedReason).not.toBeNull(); // The sheets and the verdict are missing.
    expect(held.closeBlockedReason).not.toContain("not held yet");
  });

  it("shows the Certification step after a closed Proposal, with its reason", async () => {
    await db.update(s.milestoneInstance).set({ status: "CLOSED" }).where(eq(s.milestoneInstance.id, seed.milestone.id));
    await db.update(s.defenseAttempt).set({ status: "closed" }).where(eq(s.defenseAttempt.id, attemptId));
    const d = await defenseDetail(coord(), attemptId);
    expect(d.showCertify).toBe(true);
    expect(d.closeBlockedReason).toBe("The stage is closed.");
    expect(d.certifyBlockedReason).not.toBeNull(); // The Certification is not verified yet.
  });

  it("is for the Coordinator only, and refuses an unknown attempt (NFR-01)", async () => {
    for (const u of [seed.student, seed.adviser, seed.panel[0]!]) {
      await expect(defenseDetail({ db, actor: actorOf(u) }, attemptId)).rejects.toBeInstanceOf(AccessDeniedError);
    }
    await expect(defenseDetail(coord(), "00000000-0000-4000-8000-000000000000")).rejects.toThrow("does not exist");
  });
});
