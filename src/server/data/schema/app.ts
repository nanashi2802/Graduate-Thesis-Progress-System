// One schema `app` (ERD §1). Neon Auth keeps its own schema.
import { pgSchema } from "drizzle-orm/pg-core";

export const app = pgSchema("app");
