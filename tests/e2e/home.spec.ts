import { expect, test } from "@playwright/test";

// The landing page loads, offers one way in (Sign in) and no sign-up (FR-ACC-01, FR-ACC-04).
test("landing page loads and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("ThesIsko — PUP CpE Thesis Progress System");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your thesis. One clear path.");

  // Every way in goes to the sign-in page; there is no sign-up or demo link.
  const signIn = page.getByRole("link", { name: "Sign in" });
  await expect(signIn.first()).toBeVisible();
  for (const link of await signIn.all()) {
    await expect(link).toHaveAttribute("href", "/login");
  }
  await expect(page.getByRole("link", { name: /sign up|register|get started|demo/i })).toHaveCount(0);
});

test("landing page has no horizontal scroll on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test("role pills switch the role tile", async ({ page }) => {
  await page.goto("/");
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Student");

  await page.getByRole("tab", { name: "Panel Member" }).click();
  await expect(page.getByRole("tab", { name: "Panel Member" })).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Panel Member");

  // Arrow keys move to the next pill and select it.
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Coordinator" })).toBeFocused();
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Coordinator");
});
