import { expect, test } from "@playwright/test";
import { makeFakePdf } from "../support/fake-pdf";

// P0-E04: signed write-once upload, hash check and range-request viewer
// (NFR-02, NFR-10, NFR-12, INV-09, BR-19, DFD T1 to T5).
// It needs Neon Auth, Neon storage and `pnpm db:seed-dev`, so it runs locally only.
const password = process.env.DEV_SEED_PASSWORD;
test.skip(!password || !process.env.S3_ENDPOINT, "needs .env.local and pnpm db:seed-dev");

test("a 100-page PDF over 4.5 MB goes straight to storage, once, and the viewer loads ranges", async ({ page }) => {
  test.setTimeout(120_000);
  const pdf = makeFakePdf(100);
  expect(pdf.length).toBeGreaterThan(4.5 * 1024 * 1024);

  const storageHost = new URL(process.env.S3_ENDPOINT!).host;
  const appBodies: number[] = [];
  const rangeReads: string[] = [];
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.host === "localhost:3000") appBodies.push(r.postDataBuffer()?.length ?? 0);
    if (url.host === storageHost && r.method() === "GET") rangeReads.push(r.headers()["range"] ?? "none");
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill("coordinator@example.test");
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/coordinator\/dashboard$/);

  await page.goto("/coordinator/spike-files");
  // Wait for hydration, so the file input has its change handler.
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Manuscript PDF").setInputFiles({ name: "fake.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(page.getByRole("status")).toContainText("Hash checked", { timeout: 60_000 });
  await expect(page.getByTestId("page-count")).toHaveText("Page 1 of 100", { timeout: 30_000 });

  // NFR-12: the server never receives the bytes. No request to the app carries a large body.
  expect(Math.max(...appBodies)).toBeLessThan(64 * 1024);
  // DFD T5: the viewer reads byte ranges, not the whole file.
  expect(rangeReads.some((r) => r.startsWith("bytes="))).toBe(true);

  // INV-09, BR-19: a second write to the same key fails.
  await page.getByRole("button", { name: "Upload again to the same key (must fail)" }).click();
  await expect(page.getByRole("status")).toHaveText("Second upload to the same key: HTTP 412");
});
