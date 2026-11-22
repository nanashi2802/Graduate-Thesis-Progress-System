// Student accounts with their Thesis Instance and Milestone 1 (FR-ACC-04, FR-ACC-07, C2). Server only.
import "server-only";
import { randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { DataContext } from "./access";
import type { CreateAuthUser } from "./accounts";
import { DuplicateEmailError } from "./accounts";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import {
  appUser,
  milestoneInstance,
  thesisInstance,
  type DegreeLevelValue,
  type MilestoneStatusValue,
  type Writing1CourseValue,
} from "./schema";
import { latestVersionId } from "./templates";

export type NewStudent = {
  fullName: string;
  email: string;
  degreeLevel: DegreeLevelValue;
  programStartTerm: string;
  comprehensiveExamDate: string | null;
  writing1Course: Writing1CourseValue;
  adviserUserId: string;
};

export type CreatedStudent = { userId: string; thesisId: string; milestoneId: string };

function inputProblem(input: NewStudent): string | null {
  if (!input.fullName.trim()) return "Enter the Student's name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim())) return "Enter a valid email address.";
  if (!input.programStartTerm.trim()) return "Enter the program start term.";
  if (input.comprehensiveExamDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(input.comprehensiveExamDate)) {
    return "Enter the comprehensive exam date as YYYY-MM-DD.";
  }
  return null;
}

// FR-ACC-04: one action makes the account, the Thesis Instance and Milestone 1.
export async function createStudent(
  ctx: DataContext,
  input: NewStudent,
  createAuthUser: CreateAuthUser,
  password: string = randomBytes(24).toString("base64url"),
): Promise<CreatedStudent> {
  requireCoordinator(ctx, "makes accounts");
  const problem = inputProblem(input);
  if (problem) throw new InputProblem(problem);
  const email = input.email.trim().toLowerCase();

  // Check first, so a refusal leaves no Neon Auth user without an account.
  const [adviser] = await ctx.db.select().from(appUser).where(eq(appUser.id, input.adviserUserId));
  if (!adviser || adviser.role !== "adviser") throw new InputProblem("Pick an Adviser account (FR-ACC-07).");
  if (!adviser.isActive) throw new InputProblem("This Adviser account is deactivated. Pick an active Adviser.");
  const [taken] = await ctx.db.select({ id: appUser.id }).from(appUser).where(eq(appUser.email, email));
  if (taken) throw new DuplicateEmailError();

  const { authUserId } = await createAuthUser({ name: input.fullName.trim(), email, password });
  const versionId = await latestVersionId(ctx.db, "proposal");
  return ctx.db.transaction(async (tx) => {
    const [user] = await tx
      .insert(appUser)
      .values({ fullName: input.fullName.trim(), email, role: "student", authUserId })
      .returning();
    const [thesis] = await tx
      .insert(thesisInstance)
      .values({
        studentUserId: user!.id,
        adviserUserId: adviser.id,
        degreeLevel: input.degreeLevel,
        programStartTerm: input.programStartTerm.trim(),
        comprehensiveExamDate: input.comprehensiveExamDate,
        writing1Course: input.writing1Course,
        createdByUserId: ctx.actor.userId,
      })
      .returning();
    const [milestone] = await tx
      .insert(milestoneInstance)
      .values({ thesisInstanceId: thesis!.id, templateVersionId: versionId, milestoneCode: "proposal" })
      .returning();
    await recordAudit(
      { db: tx, actor: ctx.actor },
      {
        action: "student.create",
        targetTable: "thesis_instance",
        targetId: thesis!.id,
        detail: { studentUserId: user!.id, adviserUserId: adviser.id, degreeLevel: input.degreeLevel },
      },
    );
    return { userId: user!.id, thesisId: thesis!.id, milestoneId: milestone!.id };
  });
}

export type StudentRow = {
  thesisId: string;
  studentName: string;
  email: string;
  isActive: boolean;
  adviserName: string;
  degreeLevel: DegreeLevelValue;
  programStartTerm: string;
  writing1Course: Writing1CourseValue;
  milestones: { id: string; code: string; status: MilestoneStatusValue; targetDate: string | null }[];
};

// The Student list on C2. The Coordinator reads all rows (ERD §8).
export async function listStudents(ctx: DataContext): Promise<StudentRow[]> {
  requireCoordinator(ctx, "reads the Student list");
  const student = alias(appUser, "student");
  const adviser = alias(appUser, "adviser");
  const rows = await ctx.db
    .select({
      thesisId: thesisInstance.id,
      studentName: student.fullName,
      email: student.email,
      isActive: student.isActive,
      adviserName: adviser.fullName,
      degreeLevel: thesisInstance.degreeLevel,
      programStartTerm: thesisInstance.programStartTerm,
      writing1Course: thesisInstance.writing1Course,
    })
    .from(thesisInstance)
    .innerJoin(student, eq(student.id, thesisInstance.studentUserId))
    .innerJoin(adviser, eq(adviser.id, thesisInstance.adviserUserId))
    .orderBy(asc(student.fullName));
  const milestones = await ctx.db
    .select({
      id: milestoneInstance.id,
      thesisId: milestoneInstance.thesisInstanceId,
      code: milestoneInstance.milestoneCode,
      status: milestoneInstance.status,
      targetDate: milestoneInstance.targetDate,
    })
    .from(milestoneInstance)
    .orderBy(asc(milestoneInstance.openedAt));
  return rows.map((r) => ({
    ...r,
    milestones: milestones
      .filter((m) => m.thesisId === r.thesisId)
      .map((m) => ({ id: m.id, code: m.code, status: m.status, targetDate: m.targetDate })),
  }));
}
