import { appendFileSync, mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { AUTH_FILE, type RoleName } from "../e2e/roles";

// Screenshot tool of the UI/UX retrofit (IMPLEMENTATION_PLAN.md, Task 2.2).
// `pnpm lab:shots <round>` takes one page list below. Output: ui-shots/<round>/<page>-<viewport>-<theme>.png
// and one line for each shot in ui-shots/<round>/manifest.jsonl (final URL, HTTP status, console errors).

type LabPage = { id: string; path: string };
type LivePage = {
  id: string;
  role: RoleName | null;
  /** A fixed path, or a path with one id that the tool finds on `from` with `match`. */
  path?: string;
  from?: string;
  match?: RegExp;
  /** An id from an environment variable, for routes that no page links to. */
  env?: { name: string; template: (id: string) => string };
};

// /lab pages, keyed by round. Add the pages of each round here (IMPLEMENTATION_PLAN.md §7, Task 2.1).
const LAB_ROUNDS: Record<string, LabPage[]> = {
  lab: [{ id: "lab-index", path: "/lab" }],
  r1: [
    { id: "foundations", path: "/lab/foundations" },
    { id: "glyphs", path: "/lab/glyphs" },
    { id: "typography", path: "/lab/typography" },
    { id: "brand", path: "/lab/brand" },
    ...["status", "blocked-action", "flag", "empty-state", "identity-line", "docket", "stepper", "theme-toggle"].map(
      (p) => ({ id: p, path: `/lab/patterns/${p}` }),
    ),
  ],
  r2: [
    ...["app-shell", "sidebar", "top-bar", "toast"].map((p) => ({ id: p, path: `/lab/patterns/${p}` })),
    { id: "app-shell-coordinator", path: "/lab/patterns/app-shell?role=coordinator" },
    { id: "app-shell-drawer", path: "/lab/patterns/app-shell?drawer=open" },
    { id: "app-shell-neutral", path: "/lab/patterns/app-shell?look=neutral&width=1200" },
    { id: "top-bar-open", path: "/lab/patterns/top-bar?open=notifications" },
    { id: "states", path: "/lab/states" },
    { id: "motion", path: "/lab/motion" },
    { id: "glyphs", path: "/lab/glyphs" },
  ],
  r3: [
    ...["queue-table", "kpi-strip", "inbox", "return-composer", "dialog", "side-sheet", "form-field"].map((p) => ({ id: p, path: `/lab/patterns/${p}` })),
    ...["return", "returned", "verified", "empty"].map((s) => ({ id: `inbox-${s}`, path: `/lab/patterns/inbox?state=${s}` })),
    { id: "dialog-verify", path: "/lab/patterns/dialog?open=verify" },
    { id: "dialog-gate1b", path: "/lab/patterns/dialog?open=endorse1b" },
    { id: "side-sheet-open", path: "/lab/patterns/side-sheet?open=1" },
    { id: "side-sheet-field-error", path: "/lab/patterns/side-sheet?open=1&error=1" },
    { id: "states", path: "/lab/states" },
  ],
  r4: [
    ...["task-list", "step-by-step"].map((p) => ({ id: p, path: `/lab/patterns/${p}` })),
    { id: "task-list-details", path: "/lab/patterns/task-list?disclosure=details" },
    { id: "step-by-step-phone-current", path: "/lab/patterns/step-by-step?phone=current" },
    { id: "PROCESS-masters", path: "/lab/screens/PROCESS" },
    { id: "PROCESS-doctoral-first-day", path: "/lab/screens/PROCESS?degree=doctoral&at=1" },
    { id: "PROCESS-masters-clearance", path: "/lab/screens/PROCESS?at=4" },
    { id: "PROCESS-cleared", path: "/lab/screens/PROCESS?at=cleared" },
    { id: "PROCESS-forms-c", path: "/lab/screens/PROCESS?forms=c" },
    { id: "PROCESS-phone-current", path: "/lab/screens/PROCESS?phone=current" },
  ],
  // R5 (§4.5.1, owner 26 Nov 2026): no batch by default. Run it only when the owner asks and the pages are confirmed.
  r5: [
    ...["merge-box", "gate-box", "commit-selector", "thread-feed", "pdf-viewer"].map((p) => ({ id: p, path: `/lab/patterns/${p}` })),
    ...["student", "adviser", "panel"].flatMap((r) =>
      ["first-day", "working", "ready", "locked"].map((s) => ({ id: `workspace-${r}-${s}`, path: `/lab/patterns/workspace?role=${r}&state=${s}` })),
    ),
    { id: "workspace-identity", path: "/lab/patterns/workspace?identity=proposed" },
  ],
  r6: ["slot-list", "date-picker", "defense-form", "verdict", "consultation-log"].map((p) => ({ id: p, path: `/lab/patterns/${p}` })),
};

// Live routes of spec/SITEMAP.md (LAB_LIVE=1), with the saved session of the role.
const SV_ID = { name: "LAB_MILESTONE_ID" };
const DEF_ID = { name: "LAB_DEFENSE_ID" };
const LIVE_ROUNDS: Record<string, LivePage[]> = {
  audit: [
    { id: "LOGIN", role: null, path: "/login" },
    { id: "LOGIN-reset", role: null, path: "/login/reset" },
    { id: "S1", role: "student", path: "/student/dashboard" },
    { id: "S2", role: "student", from: "/student/dashboard", match: /^\/student\/pr\/[^/?#]+/ },
    { id: "S3", role: "student", path: "/student/documents" },
    { id: "S4", role: "student", path: "/student/schedule" },
    { id: "S5", role: "student", from: "/student/dashboard", match: /^\/student\/defense\/[^/?#]+/, env: { ...DEF_ID, template: (id) => `/student/defense/${id}` } },
    { id: "S6", role: "student", path: "/student/clearance" },
    { id: "SV-student", role: "student", env: { ...SV_ID, template: (id) => `/student/submission/${id}` } },
    { id: "A1", role: "adviser", path: "/adviser/dashboard" },
    { id: "A2", role: "adviser", from: "/adviser/dashboard", match: /^\/adviser\/pr\/[^/?#]+/ },
    { id: "A3", role: "adviser", path: "/adviser/consultations" },
    { id: "A4", role: "adviser", path: "/adviser/availability" },
    { id: "A5", role: "adviser", from: "/adviser/dashboard", match: /^\/adviser\/defense\/[^/?#]+/, env: { ...DEF_ID, template: (id) => `/adviser/defense/${id}` } },
    { id: "SV-adviser", role: "adviser", env: { ...SV_ID, template: (id) => `/adviser/submission/${id}` } },
    { id: "P1", role: "panel", path: "/panel/dashboard" },
    { id: "P2", role: "panel", from: "/panel/dashboard", match: /^\/panel\/pr\/[^/?#]+/ },
    { id: "P3", role: "panel", path: "/panel/availability" },
    { id: "P4", role: "panel", from: "/panel/dashboard", match: /^\/panel\/defense\/[^/?#]+/, env: { ...DEF_ID, template: (id) => `/panel/defense/${id}` } },
    { id: "SV-panel", role: "panel", env: { ...SV_ID, template: (id) => `/panel/submission/${id}` } },
    { id: "C1", role: "coordinator", path: "/coordinator/dashboard" },
    { id: "C2", role: "coordinator", path: "/coordinator/students" },
    { id: "C3", role: "coordinator", path: "/coordinator/committees" },
    { id: "C4", role: "coordinator", path: "/coordinator/documents" },
    { id: "C5", role: "coordinator", path: "/coordinator/schedule" },
    { id: "C6", role: "coordinator", from: "/coordinator/schedule", match: /^\/coordinator\/defense\/[^/?#]+/, env: { ...DEF_ID, template: (id) => `/coordinator/defense/${id}` } },
    { id: "C7", role: "coordinator", path: "/coordinator/clearance" },
    { id: "C8", role: "coordinator", path: "/coordinator/templates" },
    { id: "C9", role: "coordinator", path: "/coordinator/users" },
    { id: "C10", role: "coordinator", path: "/coordinator/audit" },
    { id: "SV-coordinator", role: "coordinator", env: { ...SV_ID, template: (id) => `/coordinator/submission/${id}` } },
    { id: "PROCESS", role: "student", path: "/student/process" },
  ],
};

const ROUND = process.env.LAB_ROUND ?? "";
const LIVE = process.env.LAB_LIVE === "1";
// LAB_OUT: another output folder, for example a before and after pair of the same round.
const OUT = process.env.LAB_OUT ?? `ui-shots/${ROUND}`;

// Signed file links carry a key id and a signature in the query string. Never write them to disk.
const redact = (text: string) => text.replace(/(https?:\/\/[^\s?'"]+)\?[^\s'"]*/g, "$1?<query removed>").slice(0, 300);

async function settle(page: Page) {
  // Wait for the network and for loading.tsx blocks to go. Some pages poll, so do not fail on a timeout.
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"]'), undefined, { timeout: 20_000 })
    .catch(() => {});
}

// LAB_CORS_RELAY=1: the file store allows only the origins in scripts/set-storage-cors.mjs. On another
// port, relay each file request and add the CORS header, so the PDF viewer loads as on port 3000.
async function relayFiles(page: Page) {
  if (process.env.LAB_CORS_RELAY !== "1") return;
  await page.route(/\.storage\..*\.neon\.tech\//, async (route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, HEAD" } });
    }
    const res = await route.fetch();
    await route.fulfill({ response: res, headers: { ...res.headers(), "access-control-allow-origin": "*", "access-control-expose-headers": "*" } });
  });
}

async function shoot(page: Page, id: string, url: string, viewport: string, theme: string, errors: string[]) {
  await relayFiles(page);
  const res = await page.goto(url, { waitUntil: "load" });
  await settle(page);
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/${id}-${viewport}-${theme}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const line = {
    id,
    viewport,
    theme,
    requested: url,
    final: new URL(page.url()).pathname,
    status: res?.status() ?? null,
    title: await page.title(),
    h1: await page.locator("h1").first().textContent({ timeout: 1000 }).catch(() => null),
    consoleErrors: errors.slice(0, 5),
    file,
  };
  appendFileSync(`${OUT}/manifest.jsonl`, `${JSON.stringify(line)}\n`);
}

test.describe.configure({ mode: "parallel" });

if (!ROUND) {
  test("lab:shots needs a round", () => {
    throw new Error("Run `pnpm lab:shots <round>`. Rounds: " + [...Object.keys(LAB_ROUNDS), ...Object.keys(LIVE_ROUNDS)].join(", "));
  });
} else if (LIVE) {
  const pages = LIVE_ROUNDS[ROUND];
  if (!pages) throw new Error(`No live page list "${ROUND}". Live rounds: ${Object.keys(LIVE_ROUNDS).join(", ")}`);
  for (const p of pages) {
    test.describe(p.id, () => {
      if (p.role) test.use({ storageState: AUTH_FILE(p.role) });
      test(`${ROUND} ${p.id}`, async ({ page }, info) => {
        const { viewport, theme } = info.project.metadata as { viewport: string; theme: string };
        const errors: string[] = [];
        page.on("console", (m) => m.type() === "error" && errors.push(redact(m.text())));
        page.on("pageerror", (e) => errors.push(redact(`pageerror: ${e.message}`)));
        let url = p.path;
        // 1. A link on the source page. 2. An id from the environment (routes that no page links to).
        if (p.from && p.match) {
          await page.goto(p.from, { waitUntil: "load" });
          await settle(page);
          const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
          url = hrefs.find((h) => p.match!.test(h));
        }
        if (!url && p.env && process.env[p.env.name]) url = p.env.template(process.env[p.env.name]!);
        test.skip(!url, `no link on ${p.from ?? "any page"} for ${p.id}${p.env ? `; set ${p.env.name}` : ""}`);
        expect(url).toBeTruthy();
        await shoot(page, p.id, url!, viewport, theme, errors);
      });
    });
  }
} else {
  const pages = LAB_ROUNDS[ROUND];
  if (!pages) throw new Error(`No /lab page list "${ROUND}". Rounds: ${Object.keys(LAB_ROUNDS).join(", ")}`);
  for (const p of pages) {
    test(`${ROUND} ${p.id}`, async ({ page }, info) => {
      const { viewport, theme } = info.project.metadata as { viewport: string; theme: string };
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(redact(m.text())));
      page.on("pageerror", (e) => errors.push(redact(`pageerror: ${e.message}`)));
      await shoot(page, p.id, p.path, viewport, theme, errors);
    });
  }
}
