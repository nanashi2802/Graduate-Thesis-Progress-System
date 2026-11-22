// Access checks for the data layer (NFR-01, FR-ACC-03, ERD §8).
import "server-only";
import type { Db } from "./db";
import type { UserRole } from "./schema";

// The signed-in user who asks for a read or write.
export type Actor = { userId: string; role: UserRole; isActive: boolean };

// Every data-layer function gets the database and the actor.
export type DataContext = { db: Db; actor: Actor };

export class AccessDeniedError extends Error {
  constructor(reason: string) {
    super(`Access denied: ${reason}`);
    this.name = "AccessDeniedError";
  }
}

// A deactivated account can do nothing (FR-ACC-06).
export function requireActive(actor: Actor): void {
  if (!actor.isActive) throw new AccessDeniedError("the account is deactivated");
}
