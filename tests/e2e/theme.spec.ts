import { expect, test } from "@playwright/test";

// R1.5 (UX-D-01, UX-D-13, DESIGN.md §7.3): the theme script sets the theme before the first paint.
// The OS setting is the default. A stored choice wins over it. LOGIN has the theme switch.
test.describe("theme", () => {
  test("a dark OS setting gives html.dark on /login", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await context.close();
  });

  test("a stored light choice wins over a dark OS setting", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    await context.addInitScript(() => localStorage.setItem("theme", "light"));
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await context.close();
  });

  test("the switch has the name \"Dark theme\" and turns the page dark", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/login");
    const toggle = page.getByRole("switch", { name: "Dark theme" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
    expect(errors).toEqual([]);
    await context.close();
  });
});
