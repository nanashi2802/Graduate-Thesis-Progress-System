// P1-E11-T02: the Student tracker data (FR-TRK-01, FR-TRK-05, NFR-01, NFR-04, BR-09, BR-17).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { readinessChecklist, studentTracker } from "@/server/data/tracker";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const asStudent = () => ({ db, actor: actorOf(seed.student) });

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
});

describe("studentTracker", () => {
  it("gives the regions for a new Student: DRAFT, an upload next action and an empty checklist", async () => {
    const t = (await studentTracker(asStudent()))!;
    expect(t.identity).toMatchObject({ degreeLevel: seed.thesis.degreeLevel, committeeNames: [] });
    expect(t.identity.adviserName).toBe(seed.adviser.fullName);
    expect(t.stepper.map((x) => x.code)).toEqual(["proposal"]);
    expect(t.current).toMatchObject({ milestoneId: seed.milestone.id, code: "proposal", status: "DRAFT" });
    expect(t.next).toMatchObject({ actor: "student", action: "Open the manuscript" });
    expect(t.checklist.length).toBeGreaterThan(0);
    expect(t.checklist.every((i) => !i.done)).toBe(true);
    expect(t.outside).toMatchObject({ ethics: "NOT_SUBMITTED", ipmo: "NOT_SUBMITTED" });
    expect(t.defense).toBeNull();
    expect(t.keyDates).toMatchObject({ earliestDefenseDate: null, printedCopiesDue: null });
  });

  it("marks a checklist item done once its scan is locked", async () => {
    const item = (await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, seed.versions.proposal.id))).find(
      (i) => i.formCode === "TDW_07",
    )!;
    await db.insert(s.documentRecord).values({ milestoneInstanceId: seed.milestone.id, templateRequiredItemId: item.id, formCode: "TDW_07", state: "locked_as_submitted" });
    const t = (await studentTracker(asStudent()))!;
    expect(t.checklist.find((i) => i.id === "tdw07")!.done).toBe(true);
    expect(t.checklist.find((i) => i.id === "or")!.done).toBe(false);
  });

  it("shows the defense card with the printed copies due date after the date is confirmed (BR-09)", async () => {
    await db.update(s.milestoneInstance).set({ status: "DEFENSE_SCHEDULED" }).where(eq(s.milestoneInstance.id, seed.milestone.id));
    await db.insert(s.defenseAttempt).values({
      milestoneInstanceId: seed.milestone.id,
      attemptNo: 1,
      status: "scheduled",
      scheduledStartAt: new Date("2026-12-15T01:00:00Z"), // 09:00 PST
      roomOrLink: "Room 301",
    });
    const t = (await studentTracker(asStudent()))!;
    expect(t.defense).toEqual({ date: "2026-12-15", roomOrLink: "Room 301", printedCopiesDue: "2026-12-08" });
    expect(t.keyDates.printedCopiesDue).toBe("2026-12-08");
    expect(t.next.text).toContain("2026-12-15");
  });

  it("takes the printed copies due days from the template version (BR-09)", async () => {
    await db.update(s.templateVersion).set({ printedCopiesDueDays: 10 }).where(eq(s.templateVersion.id, seed.versions.proposal.id));
    await db.update(s.milestoneInstance).set({ status: "DEFENSE_SCHEDULED" }).where(eq(s.milestoneInstance.id, seed.milestone.id));
    await db.insert(s.defenseAttempt).values({ milestoneInstanceId: seed.milestone.id, attemptNo: 1, status: "scheduled", scheduledStartAt: new Date("2026-12-15T01:00:00Z"), roomOrLink: "Room 301" });
    const t = (await studentTracker(asStudent()))!;
    expect(t.defense!.printedCopiesDue).toBe("2026-12-05");
  });

  it("shows the written reason of a Return as the next action (BR-13)", async () => {
    await db.update(s.milestoneInstance).set({ returnReason: "The method chapter is missing." }).where(eq(s.milestoneInstance.id, seed.milestone.id));
    const t = (await studentTracker(asStudent()))!;
    expect(t.next.text).toContain("The method chapter is missing.");
  });

  it("is for a Student only, and a Student with no thesis gets null (NFR-01)", async () => {
    await expect(studentTracker({ db, actor: actorOf(seed.adviser) })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(studentTracker({ db, actor: actorOf(seed.coordinator) })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(studentTracker({ db, actor: { ...actorOf(seed.student), isActive: false } })).rejects.toBeInstanceOf(AccessDeniedError);
    const [other] = await db
      .insert(s.appUser)
      .values({ email: "other@example.test", fullName: "Other Student", role: "student", authUserId: "other-auth" })
      .returning();
    expect(await studentTracker({ db, actor: actorOf(other!) })).toBeNull();
  });
});

describe("readinessChecklist (C5 names the missing items, BR-18)", () => {
  it("gives the Coordinator and the thesis Student the list, and refuses a Panel Member with no seat (NFR-01)", async () => {
    const forCoordinator = await readinessChecklist({ db, actor: actorOf(seed.coordinator) }, seed.milestone.id);
    expect(forCoordinator.length).toBeGreaterThan(0);
    expect(await readinessChecklist(asStudent(), seed.milestone.id)).toEqual(forCoordinator);
    await expect(readinessChecklist({ db, actor: actorOf(seed.panel[0]!) }, seed.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
