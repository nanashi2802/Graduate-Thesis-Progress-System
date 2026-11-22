// Migration config (AD-A-001). Migrations use the direct (unpooled) connection.
import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI and Vercel set the variables directly.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/data/schema.ts",
  out: "./db/migrations",
  schemaFilter: ["app"],
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
});
