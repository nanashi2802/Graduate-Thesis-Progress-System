// Database schema from spec/ERD.md. One schema `app` (ERD §1).
// This file holds no secret and no query, so drizzle-kit can load it.
import { sql } from "drizzle-orm";
import { boolean, check, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const app = pgSchema("app");

// ERD §2. Exactly one role per account (BR-03).
export const userRole = app.enum("user_role", [
  "student",
  "adviser",
  "panel_member",
  "coordinator",
]);
export type UserRole = (typeof userRole.enumValues)[number];

// ERD §4.1 `app_user`. Accounts are deactivated, never deleted (ERD §1, FR-ACC-06).
export const appUser = app.table(
  "app_user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Neon Auth user id. Empty until the account first links to Neon Auth (P0-E03).
    authUserId: text("auth_user_id").unique(),
    fullName: text("full_name").notNull(),
    // Emails go here (FR-NTF-08). Stored in lower case, so the unique key ignores case.
    email: text("email").notNull().unique(),
    role: userRole("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("app_user_email_lower", sql`${t.email} = lower(${t.email})`)],
);
export type AppUser = typeof appUser.$inferSelect;
