// Reads of `app_user` (ERD §4.1). Each function checks access first (NFR-01).
import "server-only";
import { eq } from "drizzle-orm";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { appUser, type AppUser } from "./schema";

// ERD §8: the Coordinator reads all rows. Other roles read their own account only.
// P1-E02 widens this (for example, an Adviser reads the accounts of their Students).
export async function getUser(ctx: DataContext, userId: string): Promise<AppUser | null> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator" && ctx.actor.userId !== userId) {
    throw new AccessDeniedError("only the Coordinator reads other accounts");
  }
  const [row] = await ctx.db.select().from(appUser).where(eq(appUser.id, userId));
  return row ?? null;
}
