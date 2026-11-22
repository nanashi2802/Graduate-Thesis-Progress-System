import { expect, test } from "@playwright/test";

// P0-E03: sign-in and route access (FR-ACC-01, FR-ACC-02, D-23).
// It needs Neon Auth and the fake users from `pnpm db:seed-dev`, so it runs locally only.
// CI has no Neon secrets (AD-A-002), so it skips there.
const password = process.env.DEV_SEED_PASSWORD;
test.skip(!password || !process.env.NEON_AUTH_BASE_URL, "needs .env.local and pnpm db:seed-dev");

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("a signed-out user goes to /login", async ({ page }) => {
  await page.goto("/student/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("a Student signs in and reaches the Student portal", async ({ page }) => {
  await signIn(page, "student@example.test");
  await expect(page).toHaveURL(/\/student\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("a Student sees Access Denied on the Coordinator portal", async ({ page }) => {
  await signIn(page, "student@example.test");
  await page.waitForURL(/\/student\/dashboard$/);
  await page.goto("/coordinator/dashboard");
  await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
  await expect(page.getByText("This page is for another role.")).toBeVisible();
});

test("a wrong password does not sign in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("student@example.test");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("The email address or the password is not correct.")).toBeVisible();
});

test("a Neon Auth user with no app account is signed out at once (D-23)", async ({ page }) => {
  await signIn(page, "stranger@example.test");
  await expect(page).toHaveURL(/\/login\?error=no_account$/);
  await expect(page.getByText(/This sign-in has no account/)).toBeVisible();
  await page.goto("/student/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
