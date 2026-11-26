import { expect, test } from "@playwright/test";
import { AUTH_FILE } from "./roles";

// R2.8 (DESIGN.md §5.1, §10, BR-18): the app shell. Skip link first, the sidebar marks the current page,
// a locked item names its reason, the drawer and the sheets close with Escape and give focus back.
test.skip(!process.env.DEV_SEED_PASSWORD || !process.env.NEON_AUTH_BASE_URL, "needs .env.local and pnpm db:seed-dev");

test.describe("shell", () => {
  test.use({ storageState: AUTH_FILE("student") });

  test("starts with a skip link to the main region", async ({ page }) => {
    await page.goto("/student/dashboard");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", "#main");
    await expect(page.locator("main#main")).toHaveCount(1);
  });

  test("marks the current page in the sidebar and gives each locked item a reason", async ({ page }) => {
    await page.goto("/student/dashboard");
    const nav = page.getByRole("navigation", { name: "Student menu" });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    const locked = nav.locator('[aria-disabled="true"]');
    for (const el of await locked.all()) {
      const id = await el.getAttribute("aria-describedby");
      expect(id).toBeTruthy();
      await expect(page.locator(`[id="${id}"]`)).not.toBeEmpty();
    }
  });

  test("closes the notification sheet with Escape and returns focus to the bell", async ({ page }) => {
    await page.goto("/student/dashboard");
    const bell = page.getByRole("button", { name: /^Notifications/ });
    await bell.click();
    await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Notifications" })).toBeHidden();
    await expect(bell).toBeFocused();
  });

  test.describe("tablet", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("opens the sidebar drawer, closes it with Escape and returns focus", async ({ page }) => {
      await page.goto("/student/dashboard");
      const open = page.getByRole("button", { name: "Open menu" });
      await open.click();
      const drawer = page.getByRole("dialog", { name: "Student menu" });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
      await expect(open).toBeFocused();
    });
  });
});
