import { defineConfig, devices, type Project } from "@playwright/test";

// Screenshot tool of the UI/UX retrofit (docs/ui-ux-audit/IMPLEMENTATION_PLAN.md, Task 2.2).
// Run it with `pnpm lab:shots <round>`. CI does not run it: the main playwright.config.ts
// does not include tests/lab/.
//
// LAB_ROUND   the key of a page list in tests/lab/shots.spec.ts (set by tests/lab/run.mjs)
// LAB_LIVE=1  open real routes with the saved role sessions of tests/e2e/.auth/
// LAB_THEMES  "light", "dark" or "light,dark" (default)
// LAB_VIEWPORTS  a comma list of viewport names (default: all)
// LAB_PORT    the dev server port (default 3100)
// LAB_OUT     the output folder (default ui-shots/<round>)

const PORT = Number(process.env.LAB_PORT ?? 3100);
const LIVE = process.env.LAB_LIVE === "1";

// Live mode signs in with the fake users of `pnpm db:seed-dev`. It reads .env.local like the
// main config, and it never prints a value from it.
if (LIVE) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}

// The viewports of UI_UX_AUDIT.md §1.2.
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "laptop-sm", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "phone", width: 390, height: 844 },
] as const;

const pick = (value: string | undefined, all: readonly string[]) =>
  value ? value.split(",").map((s) => s.trim()).filter((s) => all.includes(s)) : [...all];

const themes = pick(process.env.LAB_THEMES, ["light", "dark"]) as ("light" | "dark")[];
const viewports = VIEWPORTS.filter((v) => pick(process.env.LAB_VIEWPORTS, VIEWPORTS.map((x) => x.name)).includes(v.name));

const shotProjects: Project[] = [];
for (const v of viewports) {
  for (const theme of themes) {
    shotProjects.push({
      name: `${v.name}-${theme}`,
      testMatch: /shots\.spec\.ts/,
      dependencies: LIVE ? ["auth"] : [],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: v.width, height: v.height },
        colorScheme: theme,
        reducedMotion: "no-preference",
      },
      metadata: { viewport: v.name, theme },
    });
  }
}
// One reduced-motion pass at the first viewport (IMPLEMENTATION_PLAN.md §4.5).
const v = viewports[0];
if (v && themes[0]) {
  shotProjects.push({
    name: `${v.name}-${themes[0]}-reduced`,
    testMatch: /shots\.spec\.ts/,
    dependencies: LIVE ? ["auth"] : [],
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: v.width, height: v.height },
      colorScheme: themes[0],
      reducedMotion: "reduce",
    },
    metadata: { viewport: v.name, theme: `${themes[0]}-reduced` },
  });
}

export default defineConfig({
  testDir: "tests/lab",
  outputDir: "test-results/lab",
  fullyParallel: true,
  workers: Number(process.env.LAB_WORKERS ?? 2),
  retries: 0,
  reporter: "list",
  timeout: 180_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    navigationTimeout: 150_000,
  },
  projects: [
    // Live mode: sign in once for each role with the e2e setup (tests/e2e/auth.setup.ts).
    ...(LIVE ? [{ name: "auth", testDir: "tests/e2e", testMatch: /auth\.setup\.ts/ }] : []),
    ...shotProjects,
  ],
  webServer: {
    command: `pnpm dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
