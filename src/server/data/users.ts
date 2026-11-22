// Reads and Coordinator edits of `app_user` (ERD §4.1, FR-ACC-05, FR-ACC-06, C9).
// Each function checks access first (NFR-01).
import "server-only";
import { and, asc, eq, ne, or } from "drizzle-orm";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { DuplicateEmailError } from "./accounts";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import { appUser, auditRecord, committeeMember, defenseSubstitute, thesisInstance, type AppUser, type UserRole } from "./schema";

// ERD §8: the Coordinator reads all rows. Other roles read their own account only.
export async function getUser(ctx: DataContext, userId: string): Promise<AppUser | null> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator" && ctx.actor.userId !== userId) {
    throw new AccessDeniedError("only the Coordinator reads other accounts");
  }
  const [row] = await ctx.db.select().from(appUser).where(eq(appUser.id, userId));
  return row ?? null;
}

// The user table on C9.
export async function listUsers(ctx: DataContext): Promise<AppUser[]> {
  requireCoordinator(ctx, "reads the user table");
  return ctx.db.select().from(appUser).orderBy(asc(appUser.role), asc(appUser.fullName));
}

// The active users of one role, for pickers (for example the Adviser on C2).
export async function listActiveUsers(ctx: DataContext, role: UserRole): Promise<Pick<AppUser, "id" | "fullName">[]> {
  requireCoordinator(ctx, "reads the user table");
  return ctx.db
    .select({ id: appUser.id, fullName: appUser.fullName })
    .from(appUser)
    .where(and(eq(appUser.role, role), eq(appUser.isActive, true)))
    .orderBy(asc(appUser.fullName));
}

// AD-A-016: a row names the user in their role, so the role cannot change.
async function roleInUse(ctx: DataContext, userId: string): Promise<boolean> {
  const checks = await Promise.all([
    ctx.db
      .select({ id: thesisInstance.id })
      .from(thesisInstance)
      .where(
        or(
          eq(thesisInstance.studentUserId, userId),
          eq(thesisInstance.adviserUserId, userId),
          eq(thesisInstance.createdByUserId, userId),
        ),
      )
      .limit(1),
    ctx.db.select({ id: committeeMember.id }).from(committeeMember).where(eq(committeeMember.memberUserId, userId)).limit(1),
    ctx.db
      .select({ id: defenseSubstitute.id })
      .from(defenseSubstitute)
      .where(eq(defenseSubstitute.substituteUserId, userId))
      .limit(1),
    ctx.db.select({ id: auditRecord.id }).from(auditRecord).where(eq(auditRecord.actorUserId, userId)).limit(1),
  ]);
  return checks.some((rows) => rows.length > 0);
}

export type UserEdit = { fullName?: string; email?: string; role?: UserRole };

// FR-ACC-05: the Coordinator edits a user. FR-ACC-06, BR-03: one role, and a role in use stays.
export async function updateUser(ctx: DataContext, userId: string, edit: UserEdit): Promise<AppUser> {
  requireCoordinator(ctx, "edits users");
  const [user] = await ctx.db.select().from(appUser).where(eq(appUser.id, userId));
  if (!user) throw new InputProblem("This user does not exist.");
  const set: Partial<typeof appUser.$inferInsert> = {};
  const detail: Record<string, string> = {};

  if (edit.fullName !== undefined && edit.fullName.trim() !== user.fullName) {
    if (!edit.fullName.trim()) throw new InputProblem("Enter the name.");
    set.fullName = edit.fullName.trim();
    detail.fullName = "changed";
  }
  if (edit.email !== undefined) {
    const email = edit.email.trim().toLowerCase();
    if (email !== user.email) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new InputProblem("Enter a valid email address.");
      const [taken] = await ctx.db
        .select({ id: appUser.id })
        .from(appUser)
        .where(and(eq(appUser.email, email), ne(appUser.id, userId)));
      if (taken) throw new DuplicateEmailError();
      set.email = email;
      detail.email = "changed";
    }
  }
  if (edit.role !== undefined && edit.role !== user.role) {
    if (userId === ctx.actor.userId) throw new InputProblem("You cannot change your own role.");
    if (await roleInUse(ctx, userId)) {
      throw new InputProblem(
        "This account already acts in its role. Deactivate it and make a new account for the other role (BR-03).",
      );
    }
    set.role = edit.role;
    detail.role = edit.role;
  }
  if (Object.keys(set).length === 0) return user;

  return ctx.db.transaction(async (tx) => {
    const [row] = await tx.update(appUser).set(set).where(eq(appUser.id, userId)).returning();
    await recordAudit({ db: tx, actor: ctx.actor }, { action: "user.update", targetTable: "app_user", targetId: userId, detail });
    return row!;
  });
}

// FR-ACC-05, FR-ACC-06: deactivate or reactivate. A deactivated account can do nothing.
export async function setUserActive(ctx: DataContext, userId: string, isActive: boolean): Promise<void> {
  requireCoordinator(ctx, "deactivates users");
  if (!isActive && userId === ctx.actor.userId) throw new InputProblem("You cannot deactivate your own account.");
  await ctx.db.transaction(async (tx) => {
    const rows = await tx.update(appUser).set({ isActive }).where(eq(appUser.id, userId)).returning({ id: appUser.id });
    if (!rows.length) throw new InputProblem("This user does not exist.");
    await recordAudit(
      { db: tx, actor: ctx.actor },
      { action: isActive ? "user.reactivate" : "user.deactivate", targetTable: "app_user", targetId: userId },
    );
  });
}
