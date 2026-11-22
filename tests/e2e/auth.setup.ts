import { expect, test as setup } from "@playwright/test";
import { AUTH_FILE, ROLES } from "./roles";

// P1-E13-T02: sign in once for each role and save the session (FR-ACC-01, FR-ACC-02).
// It needs Neon Auth and the fake users from `pnpm db:seed-dev`, so it runs locally only.
// CI has no Neon secrets (AD-A-002), so it skips there.
const password = process.env.DEV_SEED_PASSWORD;
setup.skip(!password || !process.env.NEON_AUTH_BASE_URL, "needs .env.local and pnpm db:seed-dev");

for (const role of ROLES) {
  setup(`sign in as ${role.name}`, async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(role.email);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${role.home}$`));
    await page.context().storageState({ path: AUTH_FILE(role.name) });
  });
}
