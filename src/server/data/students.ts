// Student accounts with their Thesis Instance and Milestone 1 (FR-ACC-04, FR-ACC-07, C2). Server only.
import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { afterAccountCreated, type AfterCreate, type CreateAuthUser } from "./accounts";
import { DuplicateEmailError } from "./accounts";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import {
  appUser,
  gateAction,
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
  /** FR-ACC-04, D-24: the working thesis title. The Student can edit it until Gate 1b (FR-ACC-09). */
  title: string;
};

export type CreatedStudent = { userId: string; thesisId: string; milestoneId: string };

const TITLE_MAX = 300;
const TITLE_PROBLEM = `Write a thesis title of 1 to ${TITLE_MAX} characters.`;
const titleOk = (title: string) => title.trim().length > 0 && title.trim().length <= TITLE_MAX;

function inputProblem(input: NewStudent): string | null {
  if (!input.fullName.trim()) return "Enter the Student's name.";
  if (!titleOk(input.title)) return TITLE_PROBLEM;
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
  after: AfterCreate = {},
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
  const created = await ctx.db.transaction(async (tx) => {
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
        title: input.title.trim(),
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
  await afterAccountCreated(ctx, created.userId, email, after);
  return created;
}

/**
 * FR-ACC-09, BR-07, D-24: the Student edits the working title of their own thesis.
 * The title locks for good at the first Gate 1b of any milestone of the thesis.
 * Only the Student edits it. The Coordinator sets it only in `createStudent`.
 */
export async function updateThesisTitle(ctx: DataContext, input: { title: string }): Promise<void> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "student") throw new AccessDeniedError("only the Student edits the thesis title");
  if (!titleOk(input.title)) throw new InputProblem(TITLE_PROBLEM);
  const title = input.title.trim();
  await ctx.db.transaction(async (tx) => {
    const [thesis] = await tx.select().from(thesisInstance).where(eq(thesisInstance.studentUserId, ctx.actor.userId));
    if (!thesis) throw new AccessDeniedError("the Student has no thesis");
    if (await titleLocked(tx, thesis.id)) throw new InputProblem(TITLE_LOCKED);
    await tx.update(thesisInstance).set({ title }).where(eq(thesisInstance.id, thesis.id));
    await recordAudit(
      { db: tx, actor: ctx.actor },
      { action: "thesis.title", targetTable: "thesis_instance", targetId: thesis.id, detail: { from: thesis.title, to: title } },
    );
  });
}

export const TITLE_LOCKED = "The title is locked since Gate 1b.";

/** D-24: true after the first Gate 1b of any milestone of the thesis. The title is then a record. */
export async function titleLocked(db: DataContext["db"], thesisId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: gateAction.id })
    .from(gateAction)
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, gateAction.milestoneInstanceId))
    .where(and(eq(milestoneInstance.thesisInstanceId, thesisId), eq(gateAction.gate, "gate_1b")))
    .limit(1);
  return row !== undefined;
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
