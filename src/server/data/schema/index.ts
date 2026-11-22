// The database schema from spec/ERD.md (AD-A-012). It holds no secret and no query, so
// drizzle-kit can load it. Triggers are in the custom migration in db/migrations/.
export * from "./app";
export * from "./enums";
export * from "./accounts";
export * from "./manuscript";
export * from "./schedule";
export * from "./committee";
export * from "./documents";
export * from "./defense";
export * from "./logs";
