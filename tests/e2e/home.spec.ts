import { expect, test } from "@playwright/test";

// Proves that the app builds, starts and serves the home page (P0-E01-T04).
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("PUP CpE Thesis Progress");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("PUP CpE Thesis Progress");
  await expect(page.getByRole("button", { name: "Scaffold ready" })).toBeVisible();
});
