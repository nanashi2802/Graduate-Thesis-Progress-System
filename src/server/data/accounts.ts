// Account creation by the Coordinator (FR-ACC-05, BR-03, D-23). Server only.
import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { appLink } from "@/server/notify/link";
import { notifyEvent, type EmailPort } from "./notifications";
import { appUser, type AppUser, type UserRole } from "./schema";

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email address already exists.");
    this.name = "DuplicateEmailError";
  }
}

export type NewAccount = { fullName: string; email: string; role: UserRole };

// Makes the Neon Auth user. In the app this calls `admin.createUser` with the Coordinator's
// session (AD-A-006). Tests pass a fake.
export type CreateAuthUser = (input: {
  name: string;
  email: string;
  password: string;
}) => Promise<{ authUserId: string }>;

// E1 and the set-password link run after the account commits. A failure never undoes the account (INV-30).
// `sendSetLink` asks Neon Auth to email the set-password link (AD-A-034). `sendMail` is the E1 email port.
export type AfterCreate = { sendSetLink?: (email: string) => Promise<void>; sendMail?: EmailPort | null };

// Open sign-up is off, so only this path makes an account (FR-ACC-04, FR-ACC-05).
export async function createAccount(
  ctx: DataContext,
  input: NewAccount,
  createAuthUser: CreateAuthUser,
  password: string = randomBytes(24).toString("base64url"),
  after: AfterCreate = {},
): Promise<AppUser> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") {
    throw new AccessDeniedError("only the Coordinator makes accounts");
  }
  const email = input.email.trim().toLowerCase();
  // Check first, so a duplicate email leaves no Neon Auth user without an account.
  const [taken] = await ctx.db.select({ id: appUser.id }).from(appUser).where(eq(appUser.email, email));
  if (taken) throw new DuplicateEmailError();
  const { authUserId } = await createAuthUser({ name: input.fullName, email, password });
  const [row] = await ctx.db
    .insert(appUser)
    .values({ fullName: input.fullName, email, role: input.role, authUserId })
    .returning();
  await afterAccountCreated(ctx, row!.id, email, after);
  return row!;
}

export async function afterAccountCreated(ctx: DataContext, userId: string, email: string, after: AfterCreate): Promise<void> {
  try {
    await after.sendSetLink?.(email);
  } catch {
    console.error("Set-password link failed for a new account.");
  }
  try {
    // The email holds the event, the next step and a link only. It never holds a password (FR-NTF-03).
    await notifyEvent(ctx, { code: "E1", recipientUserIds: [userId], link: appLink("/login") }, after.sendMail ?? null);
  } catch {
    console.error("Notice for event E1 failed.");
  }
}
