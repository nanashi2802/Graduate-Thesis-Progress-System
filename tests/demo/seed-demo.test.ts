// Local demo data for a visual check (fake data only, AGENTS.md §11). Not part of CI.
// Run: pnpm exec vitest run --config tests/demo/vitest.demo.config.ts
// It runs the flow helpers against the Neon branch in .env.local, then links the seeded sign-ins
// (student@, adviser@, panel@example.test) to the Student who is furthest along.
import { and, eq, like, or, sql } from "drizzle-orm";
import { test } from "vitest";
import { getDb } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { createStudent } from "@/server/data/students";
import { as, nextKey, runMilestone1, runMilestone2 } from "../support/flow";

test("seed demo data", { timeout: 900_000 }, async () => {
  process.loadEnvFile(".env.local");
  const db = getDb();

  // The flow helpers use fixed emails. Rename the ones from earlier runs so they can run again.
  const tag = `d${Date.now()}.`;
  // File keys are write-once (INV-09) and the flow counter starts at 1, so move it past earlier runs.
  for (let i = Date.now() % 1_000_000; i > 0; i--) nextKey();
  await db
    .update(s.appUser)
    .set({ email: sql`${tag} || ${s.appUser.email}` })
    .where(or(eq(s.appUser.email, "flow.student@example.test"), sql`${s.appUser.email} ~ '^(coordinator|adviser|panel_member|student)\\.[0-9]+@example\\.test$'`));

  // Student 3: Milestone 3 open (Milestones 1 and 2 closed). Made once. The sign-ins go to this thesis.
  const [final] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.milestoneCode, "final")).limit(1);
  if (!final) await runMilestone2(db);
  // Student 2: Milestone 1 certified, Milestone 2 open.
  await runMilestone1(db);

  const [m3] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.milestoneCode, "final")).limit(1);
  const [thesis] = await db.select().from(s.thesisInstance).where(eq(s.thesisInstance.id, m3!.thesisInstanceId));
  const [lead] = await db
    .select({ id: s.committeeMember.memberUserId })
    .from(s.committeeMember)
    .innerJoin(s.committee, eq(s.committee.id, s.committeeMember.committeeId))
    .where(and(eq(s.committee.thesisInstanceId, thesis!.id), eq(s.committeeMember.designation, "lead_panel_member")))
    .limit(1);
  const [coordinator] = await db.select().from(s.appUser).where(and(eq(s.appUser.role, "coordinator"), like(s.appUser.email, "%coordinator.%"))).limit(1);

  // Student 1: new, Milestone 1 in DRAFT, under the same Adviser as Student 3.
  await createStudent(
    as(coordinator!),
    {
      fullName: "Fake New Student",
      email: `demo.new.${Date.now()}@example.test`,
      degreeLevel: "doctoral",
      programStartTerm: "2026-1",
      comprehensiveExamDate: null,
      writing1Course: "RSH_641",
      adviserUserId: thesis!.adviserUserId,
    },
    async () => ({ authUserId: crypto.randomUUID() }),
  );

  // Link each seeded Neon Auth sign-in to the flow user. The old seeded app account is retired.
  for (const [email, targetId] of [
    ["student@example.test", thesis!.studentUserId],
    ["adviser@example.test", thesis!.adviserUserId],
    ["panel@example.test", lead!.id],
  ] as const) {
    const res = (await db.execute(sql`select id from neon_auth."user" where email = ${email}`)) as unknown as { rows: { id: string }[] };
    const [auth] = res.rows;
    if (!auth) throw new Error(`no Neon Auth user ${email}: run pnpm db:seed-dev`);
    await db
      .update(s.appUser)
      .set({ authUserId: null, isActive: false, email: `retired.${Date.now()}.${email}` })
      .where(eq(s.appUser.authUserId, auth.id));
    await db.update(s.appUser).set({ authUserId: auth.id }).where(eq(s.appUser.id, targetId));
  }
  console.log("demo ready", { thesis: thesis!.id });
});
