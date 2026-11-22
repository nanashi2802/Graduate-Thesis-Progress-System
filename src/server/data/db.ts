// The one database client (NFR-01). Server only: the browser never touches the database.
import "server-only";
import { Pool } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Any Drizzle Postgres database with our schema: Neon in the app, PGlite in tests (AD-A-002).
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let db: Db | undefined;

// The pooled Neon connection. The WebSocket pool supports transactions.
export function getDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    db = drizzle({ client: new Pool({ connectionString: url }), schema });
  }
  return db;
}
