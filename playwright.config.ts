import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);

// Local runs read .env.local (for the sign-in test). CI has no such file.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    // The setup project saves one session for each role (P1-E13-T02).
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "chromium", testIgnore: [/auth\.setup\.ts/, /portals\.spec\.ts/, /shell\.spec\.ts/], use: { ...devices["Desktop Chrome"] } },
    { name: "portals", testMatch: /(portals|shell)\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
