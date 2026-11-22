// Map a Neon Auth user to an app account (D-23, AD-A-005). Server only.
import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import type { Actor } from "./access";
import type { Db } from "./db";
import { appUser } from "./schema";

export type AuthIdentity = { authUserId: string; email: string };

// The app account is the `app_user` row that the Coordinator made (FR-ACC-04, FR-ACC-05).
// A Neon Auth user with no such row has no account. Sign-in never makes one (D-23).
// The first sign-in links the row to the Neon Auth user id by the email address.
export async function resolveActor(db: Db, identity: AuthIdentity): Promise<Actor | null> {
  const email = identity.email.toLowerCase();
  const rows = await db
    .select()
    .from(appUser)
    .where(
      or(
        eq(appUser.authUserId, identity.authUserId),
        and(isNull(appUser.authUserId), eq(appUser.email, email)),
      ),
    );
  const row = rows.find((r) => r.authUserId === identity.authUserId) ?? rows[0];
  if (!row) return null;
  if (row.authUserId === null) {
    await db
      .update(appUser)
      .set({ authUserId: identity.authUserId })
      .where(and(eq(appUser.id, row.id), isNull(appUser.authUserId)));
  }
  return { userId: row.id, role: row.role, isActive: row.isActive };
}
