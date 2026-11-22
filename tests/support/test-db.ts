// A fresh in-memory Postgres with the real migrations (AD-A-002).
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/server/data/db";
import * as schema from "@/server/data/schema";

export async function makeTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "db/migrations" });
  return { db, close: () => client.close() };
}
