import { expect, test } from "@playwright/test";
import { AUTH_FILE, ROLES } from "./roles";

// P1-E13-T02: each role opens its own portal home with the saved session (FR-ACC-02).
// The `setup` project writes the sessions. Without Neon secrets this file skips.
test.skip(!process.env.DEV_SEED_PASSWORD || !process.env.NEON_AUTH_BASE_URL, "needs .env.local and pnpm db:seed-dev");

for (const role of ROLES) {
  test.describe(role.name, () => {
    test.use({ storageState: AUTH_FILE(role.name) });

    test(`opens ${role.home}`, async ({ page }) => {
      await page.goto(role.home);
      await expect(page).toHaveURL(new RegExp(`${role.home}$`));
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    test("sees Access Denied on another portal", async ({ page }) => {
      const other = ROLES.find((r) => r.name !== role.name)!;
      await page.goto(other.home);
      await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
    });

    // R4.6 (PROCESS, FR-ACC-02): the Thesis process page is for the Student only.
    test(role.name === "student" ? "opens the Thesis process page" : "is refused the Thesis process page", async ({ page }) => {
      await page.goto("/student/process");
      if (role.name === "student") {
        await expect(page.getByRole("heading", { level: 1, name: "Thesis process" })).toBeVisible();
        await expect(page.getByText("You are here")).toBeVisible();
        const nav = page.getByRole("navigation", { name: "Student menu" });
        await expect(nav.getByRole("link", { name: "Thesis process" })).toHaveAttribute("aria-current", "page");
      } else {
        await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Thesis process" })).toHaveCount(0);
      }
    });
  });
}
