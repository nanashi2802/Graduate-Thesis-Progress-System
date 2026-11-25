// `pnpm lab:shots <round> [playwright options]`: pass the round to the screenshot tool
// (IMPLEMENTATION_PLAN.md, Task 2.2). Playwright reads extra arguments as file filters,
// so the round goes in the LAB_ROUND environment variable instead.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const [round, ...rest] = process.argv.slice(2);
if (!round || round.startsWith("-")) {
  console.error("Usage: pnpm lab:shots <round> [playwright options]. Live routes: LAB_LIVE=1 pnpm lab:shots audit");
  process.exit(1);
}
// Run the Playwright CLI with Node, not through a shell, so arguments such as `-g "S1|S2"` stay whole.
const cli = createRequire(import.meta.url).resolve("@playwright/test/cli");
const r = spawnSync(process.execPath, [cli, "test", "--config", "playwright.lab.config.ts", ...rest], {
  stdio: "inherit",
  env: { ...process.env, LAB_ROUND: round },
});
process.exit(r.status ?? 1);
