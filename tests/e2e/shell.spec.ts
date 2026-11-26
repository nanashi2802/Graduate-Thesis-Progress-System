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

// R3.10 (R3-h A, UX-010, BR-18, BR-19): a permanent action asks once more. Escape closes the dialog, focus returns
// to the opener, and nothing is recorded. A blocked action keeps its reason and never opens the dialog.
// The dev data (UX-X-06: no re-seed) may have no open Verify; then only the blocked path runs, and the test says so.
test.describe("confirm dialog on C4 Verify", () => {
  test.use({ storageState: AUTH_FILE("coordinator") });

  test("a blocked Verify names its reason; an open Verify opens the dialog, Escape records nothing", async ({ page }, info) => {
    await page.goto("/coordinator/documents");
    // The list streams in: wait for it before reading it.
    const links = page.getByRole("link", { name: /^Review documents/ });
    await expect(links.first()).toBeVisible();
    const students = await links.all();
    const hrefs = await Promise.all(students.map((l) => l.getAttribute("href")));
    let checkedBlocked = false;
    for (const href of hrefs) {
      await page.goto(href!);
      await expect(page.getByRole("link", { name: "All Students" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      const verify = page.getByRole("button", { name: "Verify", exact: true });
      if ((await verify.count()) === 0) continue;
      const blocked = verify.and(page.locator('[aria-disabled="true"]'));
      if (!checkedBlocked && (await blocked.count()) > 0) {
        const b = blocked.first();
        const id = await b.getAttribute("aria-describedby");
        expect(id).toBeTruthy();
        await expect(page.locator(`[id="${id}"]`)).not.toBeEmpty();
        await b.click({ force: true });
        await expect(page.getByRole("dialog")).toHaveCount(0);
        checkedBlocked = true;
      }
      const open = verify.and(page.locator(':not([aria-disabled="true"])'));
      if ((await open.count()) > 0) {
        const before = await page.locator("main").innerText();
        const opener = open.first();
        await opener.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", { name: /^Verify .+ for .+\?$/ });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused();
        await page.reload();
        expect(await page.locator("main").innerText()).toBe(before);
        return;
      }
    }
    expect(checkedBlocked, "the dev data has no Verify on C4").toBe(true);
    info.annotations.push({ type: "gap", description: "No open Verify in the dev data: the dialog path did not run (R3.10 notes)." });
  });
});
