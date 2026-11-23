import { expect, test } from "@playwright/test";

// P3-E07-T06: the P0-E04 file spike is gone. Its action signed a read link for any key (INV-24, NFR-01).
test("the file spike route does not exist", async ({ page }) => {
  const res = await page.goto("/coordinator/spike-files");
  expect(res?.status()).toBe(404);
});
