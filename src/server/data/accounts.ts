// Account creation by the Coordinator (FR-ACC-05, BR-03, D-23). Server only.
import "server-only";
import { randomBytes } from "node:crypto";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { appUser, type AppUser, type UserRole } from "./schema";

export type NewAccount = { fullName: string; email: string; role: UserRole };

// Makes the Neon Auth user. In the app this calls `admin.createUser` with the Coordinator's
// session (AD-A-006). Tests pass a fake.
export type CreateAuthUser = (input: {
  name: string;
  email: string;
  password: string;
}) => Promise<{ authUserId: string }>;

// Open sign-up is off, so only this path makes an account (FR-ACC-04, FR-ACC-05).
export async function createAccount(
  ctx: DataContext,
  input: NewAccount,
  createAuthUser: CreateAuthUser,
  password: string = randomBytes(24).toString("base64url"),
): Promise<AppUser> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") {
    throw new AccessDeniedError("only the Coordinator makes accounts");
  }
  const email = input.email.trim().toLowerCase();
  const { authUserId } = await createAuthUser({ name: input.fullName, email, password });
  const [row] = await ctx.db
    .insert(appUser)
    .values({ fullName: input.fullName, email, role: input.role, authUserId })
    .returning();
  return row!;
}
