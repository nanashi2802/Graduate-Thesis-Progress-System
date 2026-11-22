// The fake users of `pnpm db:seed-dev` and the home page of each portal (SITEMAP §3).
export const ROLES = [
  { name: "student", email: "student@example.test", home: "/student/dashboard" },
  { name: "adviser", email: "adviser@example.test", home: "/adviser/dashboard" },
  { name: "panel", email: "panel@example.test", home: "/panel/dashboard" },
  { name: "coordinator", email: "coordinator@example.test", home: "/coordinator/dashboard" },
] as const;

export type RoleName = (typeof ROLES)[number]["name"];

/** The saved session of a role. Write it in `auth.setup.ts`. Use it with `test.use({ storageState })`. */
export const AUTH_FILE = (role: RoleName) => `tests/e2e/.auth/${role}.json`;
