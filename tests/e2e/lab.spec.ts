import { expect, test } from "@playwright/test";

// Task 2.1 (UX-D-05): the e2e run uses a production build, so /lab must not exist there.
test("/lab returns a 404 in a production build", async ({ page }) => {
  const res = await page.goto("/lab");
  expect(res?.status()).toBe(404);
});
