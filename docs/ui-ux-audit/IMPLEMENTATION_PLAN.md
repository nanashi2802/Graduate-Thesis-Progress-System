# UI/UX retrofit implementation plan

**Status:** v1.1, 25 Nov 2026. Round 0, Round 1 (Stage 1 audit) and Task 2.2 are done and not yet committed. v1.1 adds Round H and the Stage 1 tasks (§6.1). Update the "State" column of §3 and the results log in §13 as you work.
**Replaces:** `docs/superpowers/plans/2026-11-25-guided-ledger-ui.md`. This plan keeps its tasks and adds an audit, the `/lab` showcase, dark mode and a preview gate before each round.
**Goal:** Make the app feel complete, consistent, accessible and easy to use in light and dark. Keep every screen, route, flow, role and data contract as it is. Usability first, consistency always, decoration last.

**Read these first, in this order:**

1. `AGENTS.md`: commit rules (§2), ASD-STE100 (§5), domain rules (§7), terms (§8), deferred items (§9).
2. `docs/ui-ux-audit/DESIGN_DECISIONS.md`: decisions UX-D-01 to UX-D-05 and the round log.
3. `DESIGN.md` v0.2 (the baseline, UX-D-02), then `design/screens/README.md` and the screen spec for the work.
4. `docs/ui-ux-audit/UI_UX_AUDIT.md`: the findings and the component inventory.
5. This file.

---

## 1. Start of each session

1. Run `git status` and `git branch --show-current`. Do not touch changes that you did not make.
2. Check that PR #81 (`feat/guided-ledger` into `dev`) is merged: `gh pr view 81 --json state`. If it is not merged, work on top of `feat/design-system-inventory`. The UI needs the D-24 to D-28 data functions.
3. Keep the agent runner (`scripts/agents.sh`) stopped until PR #81 merges. Neon has migrations up to 0015.
4. Find the current round in §3. Read its "Gate" row in `DESIGN_DECISIONS.md` §3. Do not start the Integrate step of a round whose preview is not approved.
5. Run `pnpm install`, then `pnpm lint && pnpm typecheck && pnpm test` to get a clean baseline. Write any failure in §13 before you change code.

**Git (AGENTS.md §2):** commit, push and open a pull request only when the owner tells you to in the current request. Use `--base dev`, never `main`. No amend, rebase, merge, force push or `--no-verify`. No AI attribution. Suggested branches: one for each round, `ui/r1-foundations`, `ui/r2-shell` and so on.

---

## 2. Global constraints

These apply to every task. A task can add to them, never remove one.

**Keep (retrofit plan §4):** routes, screen jobs, flows, roles, access checks, the data layer, server actions, the database. A page keeps its data calls and its server actions. Only the markup that shows them changes.
**Exception:** C10 needs a read function (`listAudit`). Task R7d.1 adds it with a Coordinator access check and tests. It changes no existing contract.

| Rule | Source |
| :---- | :---- |
| All UI text in ASD-STE100 at about 80%. "Panel Member", "Coordinator", "Endorse", "Return". Say "recorded" or "verified", never "signed". | AGENTS.md §5, §8; `DESIGN.md` §9 |
| No PUP logo, seal, star, laurel, torch or other logo shape. The brand is the colors and the text wordmark. | F1 |
| Maroon only for the one action to do now: one maroon button in each region. Gold only for a milestone achieved and the current step. A verified document is green. | G1, G8 |
| At most 3 cards on a screen. At most 3 facts in a list row. | G5, G6 |
| Teaching text only in empty states, first-day states, disabled-action reasons and dialogs. No helper lines on Coordinator screens. | G4, `DESIGN.md` §2.1 |
| Every disabled action uses `aria-disabled="true"` and shows its reason, linked with `aria-describedby`. | G10, BR-18, `DESIGN.md` §8.4 |
| A flag never blocks and never looks like a block. | F2, BR-17 |
| No solid red button. Return is a tinted or outline button. | F3, BR-19 |
| Scores are ink numbers. No grade, no grade word, no color on a score. | F4, BR-15 |
| The same status looks the same on every screen. | F5 |
| Library components take our tokens, never their own palette. | `DESIGN.md` §3.4 |
| No raw hex color outside `src/styles/tokens.css`. | `DESIGN.md` §7.1 |
| Both themes on every pattern and screen. The PDF page, emails and printed views stay light. | UX-D-01 |
| A toast confirms small actions only. A workflow result stays on the screen. | UX-D-04 |
| No animation until R2 sets the timings (D-10). After that: CSS first, `motion/react` only where CSS cannot do it, a reduced-motion path for each animation, no counting numbers. | UX-D-04, `DESIGN.md` §6.1 |
| WCAG 2.2 AA in both themes. A visible focus ring. 44 px targets on tablet, 48 px on Defense Day. A skip link. Real table markup. Color is never the only cue. | `DESIGN.md` §10 |
| Phones are read only (D-12 stays open). | `DESIGN.md` §5.6 |
| Do not build a deferred item: e-signature, grading, outside-office workflows, AI features, compare view, print-match cover sheet, Defense Day autosave, calendar file download. | AGENTS.md §9 |
| No new package without a row in `DESIGN_DECISIONS.md` §4 and the owner's approval. | UX-D-05, AGENTS.md §10 |

**Layers (`DESIGN.md` §7.1):**

| Layer | Place | Holds |
| :---- | :---- | :---- |
| 1. Tokens | `src/styles/tokens.css` | All raw colors and sizes, for light and dark |
| 2. Patterns | `src/components/patterns/<name>/index.tsx` | One folder for each pattern in `DESIGN.md` §7.4. The first line is `// Source: <reference>`. A typed props contract. Tokens and glyphs only. |
| 3. Pages | `src/app/**/page.tsx` and a `view.tsx` beside it | `page.tsx` loads data and passes it, with the server actions, to `view.tsx`. `view.tsx` composes patterns only. |

**Why `view.tsx`:** `/lab` renders the real `view.tsx` with mock props. The owner then approves the real screen markup before it replaces the live page. `view.tsx` takes server actions as props, so it imports nothing from `src/server/` except types.

---

## 3. Rounds and state

Each round has the same 4 steps: **Build preview → Gate → Integrate → Validate** (§4). The Gate is the owner's explicit approval, recorded in `DESIGN_DECISIONS.md` §3.

| Round | Scope | Old plan task | Decisions closed here | State |
| :---- | :---- | :---- | :---- | :---- |
| 0 | Documents: `DESIGN.md` v0.3, AGENTS.md §6 row | — | D-04, D-09, D-11 (text) | Done 25 Nov 2026, not committed |
| 1 | Stage 1 audit | — | — | Done 25 Nov 2026, not committed. 38 findings, 1 Critical (`UI_UX_AUDIT.md` §8). |
| 2 | `/lab` showcase and the screenshot tool | — | — | Task 2.2 done 25 Nov 2026 (not committed). Task 2.1 not started. |
| H | Hotfix before R1 (§6.2): UX-009 PDF error state, UX-001 focus line | — | — | H.1 (UX-D-06) and H.2 (UX-D-07) built 25 Nov 2026, not committed. Round H is complete. |
| R1 | Foundations: tokens in light and dark, theme, glyphs, base patterns | 1, 2, 3 | Dark values (UX-P-01) | Not started |
| R2 | Shell and system states: app shell, sidebar, toast, loading and error, motion | 4 | D-06, D-07, D-08, D-10 | Not started |
| R3 | Queues, inbox, dialogs, side sheet | 5, 6, part of 9 | — | Not started |
| R4 | Student path: task list, step-by-step, Thesis process | 7 | — | Not started |
| R5 | Manuscript workspace | 8 | — | Not started |
| R6 | Forms and Defense Day | 9 | — | Not started |
| R7a to R7d | Screens: Student, Adviser, Panel Member, Coordinator, with SV and LOGIN | 10 | — | Not started |
| R8 | Layer rule, clean-up, full validation | 11 | — | Not started |

R3 to R6 build only patterns. Their previews show the patterns in `/lab` with mock data. R7 moves the real screens onto the patterns.

---

## 4. The round protocol

### 4.1 Build preview

1. Build the patterns of the round in `src/components/patterns/`. Write the tests first (§4.5).
2. Add a `/lab` page for each pattern: every variant and state, in light and dark (Task 2.1).
3. Run `pnpm lab:shots <round>` (Task 2.2). It saves screenshots for each viewport and theme in `ui-shots/<round>/`.
4. Do not change a live page in this step. Old components stay as they are.

### 4.2 Show it to the owner

Give the owner, in one message:

- The `/lab` links to open with `pnpm dev` (http://localhost:3000/lab/...).
- The screenshot folder (`ui-shots/<round>/`) and the viewports and themes in it.
- What changed and why, with the `DESIGN.md` and finding IDs (`UX-nnn`).
- The screens that will change when the round is integrated (from the `DESIGN.md` §7.4 registry).
- Known limits, and any dependency proposal.
- The decision points of the round, each with 2 or 3 options and a recommendation.

Then stop and wait. The owner gives feedback in words or on annotated screenshots. Revise, take new screenshots, and show again. Log each pass in the round's `UX-P-nn` block.

### 4.3 Gate

- The round passes only when the owner writes an explicit approval, for example "R1 approved". Record the exact words and the date in `DESIGN_DECISIONS.md` §3.
- If the round changed a `DESIGN.md` rule or closed a `D-nn` point, update `DESIGN.md` v0.3 in the same step (§5, Task 0.1).

### 4.4 Integrate

- Move the old components to the pattern folders. Leave a re-export at each old path until R8.
- Change call sites only as far as the round needs. Before you replace a component, list its props, callbacks, state, validation, accessibility, server-facing behavior, loading and error behavior, and call sites (retrofit plan §4.4). Keep each one, or record the change in the round's `UX-P-nn` block.
- No unrelated refactors.

### 4.5 Validate (each round)

| Check | Command or method | Pass |
| :---- | :---- | :---- |
| Lint | `pnpm lint` | No new error |
| Types | `pnpm typecheck` | Pass |
| Unit tests | `pnpm test` (full run, never part) | Pass |
| End-to-end | `pnpm test:e2e` | Pass |
| Build | `pnpm build` | Pass |
| Screens and themes | `pnpm lab:shots <round>` and the live pages the round changed | Owner-approved look in both themes, every viewport |
| Contrast | `tests/unit/components/contrast.test.ts` (Task R1.1) | Pass |
| Keyboard | Tab through each changed region in `/lab` and the live page | Every control reachable, visible focus, logical order, Escape closes overlays, focus returns |
| Reduced motion | Playwright with `reducedMotion: "reduce"` in `lab:shots` | No animation runs |
| Accessibility | `@axe-core/playwright` on the round's `/lab` pages, if the owner approves the package (§4 of `DESIGN_DECISIONS.md`) | No serious or critical issue |

Write the results in §13. Do not write "pass" for a check that you did not run.

---

## 5. Round 0: documents

### Task 0.1: `DESIGN.md` v0.3

**Files:** move `DESIGN.md` to `docs/stale/DESIGN_v0.2.md` (`git mv`), then write the new `DESIGN.md` v0.3 from it. AGENTS.md §4 forbids overwriting an approved document.

- [ ] Status line: "Draft v0.3 (date). v0.2 plus the retrofit decisions UX-D-01 to UX-D-05." Add a change-log entry.
- [ ] §1.1: add the rows from UX-D-03. Linear: shell, sidebar, status marks. Notion: reading comfort in the workspace and the thread feed. Stripe: forms, validation messages, confirm dialogs.
- [ ] §7.3: replace "There is no runtime theme switch." with the theme rule from UX-D-01.
- [ ] New §12.5 "Dark tokens": write "Values approved in UX-P-01" as a placeholder. Task R1.5 fills it.
- [ ] §14: D-04 closed (UX-D-01). D-09 closed with the proposal text (UX-D-04). D-11 closed: no React Bits, Base UI Toast (UX-D-04). D-10: "Decided in preview round UX-P-02."
- [ ] Add `theme-toggle`, `loading` and `error` to the §7.4 registry. Change the `toast` row to Base UI Toast.
- [ ] Update the pointers in `AGENTS.md` §6, `README.md` and `design/screens/README.md` if they name the version.

### Task 0.2: AGENTS.md §6 row

The owner asked for this row in UX-D-05.

- [ ] Add a row to the §6 table: "UI/UX retrofit | `docs/ui-ux-audit/` (`UI_UX_AUDIT.md`, `IMPLEMENTATION_PLAN.md`, `DESIGN_DECISIONS.md`) | Audit, build order and the approval log of the retrofit".
- [ ] Change the "Design system" row from "Draft v0.1" to "Draft v0.3".
- [ ] Edit nothing else in AGENTS.md.

### Task 0.3: old plan pointer

- [ ] The old plan already has a line that points here. Check that it is there.

**Commit (when told):** `docs: DESIGN.md v0.3 with dark mode and merged references, retrofit documents (UX-D-01 to UX-D-05)`

---

## 6. Round 1: Stage 1 audit

Autonomous. Read and run only. Do not change any app code in this round (retrofit plan §14, Stage 1).

### Task 1.1: run the app and take screenshots

- [x] Seed the demo data with `pnpm db:seed-dev` (needs `.env.local`). Run `pnpm dev`. **25 Nov 2026:** not run. The demo seed had already linked the sign-ins to the fake flow users, and `db:seed-dev` could break that link (`UI_UX_AUDIT.md` UX-X-06). The audit used a production build on port 3100, because the owner's dev server holds port 3000 and failed on 7 routes (UX-037).
- [x] Use the e2e sign-in setup (`tests/e2e/auth.setup.ts` saves one session for each role in `tests/e2e/.auth/`). Task 2.2 adds the screenshot tool. For the audit, use it in "live" mode: it opens each route of `spec/SITEMAP.md` with the saved session of its role.
- [x] Save the screenshots to `ui-shots/audit/<ID>-<viewport>-light.png`. Dark mode does not exist yet, so the audit checks light only and notes "dark: not built".
- [x] For routes with an id (`[prId]`, `[defenseId]`, `[id]`), take the ids from the seed. The tool finds them on the dashboards. No page links to SV or to a closed defense, so those ids come from `LAB_MILESTONE_ID` and `LAB_DEFENSE_ID` (UX-028).

Task 2.2 is small. Build it first, before Task 1.1, if that is easier. It changes no app code.

### Task 1.2: foundations (`UI_UX_AUDIT.md` §2)

- [x] Read `globals.css`, `layout.tsx`, `components.json` and `src/components/ui/button.tsx`.
- [x] List each raw hex value outside the token block, each spacing or size value that does not fit the scale, and each font size outside `DESIGN.md` §4.1. Use `Grep` for `#[0-9a-fA-F]{3,8}`, `text-\[`, `p-\[`, `h-\[`, `w-\[` in `src/`.
- [x] Check the focus ring on each control type.
- [x] Write one finding for each problem.

### Task 1.3: components (`UI_UX_AUDIT.md` §3)

- [x] Check each row of §3.1 to §3.5 against the code. Correct the row if the code changed.
- [x] Fill §3.6. For each control, list where it is used and check each state.
- [x] Note each control that two or more pages build on their own. That is a pattern candidate. Do not add a pattern to the registry without the owner.

### Task 1.4: role layouts (`UI_UX_AUDIT.md` §4)

- [x] Compare the four role layouts and `src/app/_components/role-shell.tsx`.
- [x] Compare each sidebar with the "Sidebars" table in `design/screens/README.md`.
- [x] Check that the next action is visible on each dashboard at 1024 × 768 without a scroll.

### Task 1.5: screens (`UI_UX_AUDIT.md` §5)

- [x] Fill one row for each route. Leave no route out. Report the route count for UX-X-02 to the owner. Do not change AGENTS.md.
- [x] For each screen, compare it with its `design/screens/<ID>.md`: regions, states, rules, first-day text.
- [x] Note repeated problems as one component finding, not as one finding on each screen.

### Task 1.6: workflows (`UI_UX_AUDIT.md` §6)

- [ ] Walk each flow in `spec/USERFLOW.md` with the demo accounts. **25 Nov 2026:** only consultation booking was walked live. The other flows were checked by code and screenshots (`UI_UX_AUDIT.md` §6). The rest waits for the owner (UX-X-06). At minimum: manuscript upload and a new commit, threads and replies, Ready and the gates, consultation booking, defense scheduling, Defense Day sheets and verdict, document Verify and Return, clearance.
- [x] For each action, compare the feedback with the retrofit plan §9 table. Check that each workflow result stays on the screen.
- [x] Undo nothing in the demo data by hand. Seed again if you need a clean state.

### Task 1.7: priorities

- [x] Score each finding (§1.3 of the audit). Escalate Critical findings to the owner at once.
- [x] Map each finding to a round in §3 of this plan. Add a task to the round if no task covers it.
- [x] Show the owner the top 10 findings and the changed rounds. This is the end of Stage 1.

**Commit (when told):** `docs: UI/UX audit, Stage 1 findings`

### 6.1 Stage 1 result: tasks added to the rounds

Task 1.7 mapped each finding in `UI_UX_AUDIT.md` to a round. The rows below are new tasks. Findings that an existing task already covers are listed in the audit only.

| Round | New task | Findings |
| :---- | :---- | :---- |
| H | H.1 PDF error state (§6.2) | UX-009 |
| H | H.2 Focus line (approved, UX-D-07): add `focus-visible:outline-solid` where `outline-none` is followed by `focus-visible:outline-2` (`button.tsx`, `form-parts.tsx`, `app-shell.tsx`, `nav-links.tsx`). One class in each place. | UX-001 |
| R1 | R1.1 adds a `--focus-*` token and one focus rule for every form control. The contrast test checks the ring at 3:1. | UX-001, UX-002 |
| R1 | R1.4 `BlockedAction`: a blocked primary is a neutral button with the reason, never a faded maroon fill. One reason for each row in compact tables. | UX-008, UX-024 |
| R1 | R1.4 `status`: one label map for document codes (`SIGNED_FINAL_MANUSCRIPT`, `CONFERENCE_CERT` …), gate kinds (`gate_1a` …) and statuses. The stamp is `w-fit`. | UX-015, UX-016 |
| R1 | R1.4 date formatter: `Tue 12 Jan 2027, 09:00 PHT`. Labels say "PHT", never "PST". | UX-021 |
| R1 | R1.4 `identity-line` also goes into the workspace header (R5) and S1 (R7a), with the thesis title (PRD D-25). | UX-030 |
| R1 | R1.5 LOGIN inputs use `border-input` (one-class change). | UX-003 |
| R1 | R1.1 `title` token: Source Serif 4 28/36. Map `text-lg` and `text-3xl` to the scale. | UX-004, UX-005 |
| R2 | R2.1 content region: one width rule (1200 px, reading text 72ch). | UX-006 |
| R2 | R2.1 sidebar items give the entry points to S5, A5, P4, C6 and SV after the event. | UX-027, UX-028 |
| R2 | R2.1 skip link to `#main`, `id="main"`, a Base UI drawer below 1024 px, the role label on a phone. | UX-029 |
| R2 | R2.2 and R2.3: one `ActionForm` contract (pending, success, error). Toast for small actions. `error.tsx` in each role segment. | UX-011, UX-026 |
| R3 | R3 form field (label, control, hint, error with `aria-describedby`), used by the side sheet. It is a pattern candidate: the owner decides at the R3 gate if it joins the registry. | UX-012, UX-013 |
| R3 | `queue-table`: sentence-case headers, `th scope`, `aria-sort`, stacked rows on a phone. `kpi-strip` per C1. | UX-014, UX-033, UX-036 |
| R3, R5, R7 | `ConfirmDialog` on every permanent action: Endorse, Gate 2, Record verdict, Verify (C4, C6 sheets), Close the stage. | UX-010 |
| R5 | Restart the dev server and check S2, A2, P2 and SV in `pnpm dev` before the R5 preview. | UX-037 |
| R6 | Read-only state for `defense-form` and `verdict` after the close. 48 px targets. A slot row names the Student. | UX-023, UX-025, UX-039 |
| R7 | Copy pass: no rule IDs in UI text, "Panel Member" for "Evaluator", S3 template sentences, spec empty-state texts, the "approve" words after UX-X-05. | UX-017, UX-018, UX-019, UX-020, UX-035 |
| R7a | S3 "Download form", only if the owner approves it (UX-X-07). | UX-032 |

### 6.2 Round H: hotfix before R1 (approved, UX-D-06)

**Why:** UX-009 is Critical. The fix is small and does not wait for R5.
**Gate:** the owner approves it in words, because it changes error handling (Behavior). A preview is the P2 page with the demo data, which shows the crash today.

- [x] Test first (`tests/unit/components/pdf-viewer.test.ts`): a document load error renders an inline message with "Try again". It does not throw.
- [x] `src/components/pdf-viewer.tsx`: pass `onLoadError` and an `error` element to `Document`, or set `suspense={false}`. Add an error boundary around the viewer in `pdf-pane.tsx`. "Try again" asks for a new signed link (`commitUrl`), so an expired link recovers. **As built:** `onLoadError` alone is not enough, because react-pdf calls it and then still throws while `suspense` is on. `Document` and `Page` both get `suspense={false}` and `error={<PdfLoadError onRetry />}`. New file `src/components/pdf-load-error.tsx` holds `PdfLoadError` and the backstop `PdfErrorBoundary`.
- [x] Check P2 with the demo data: the page stays, the threads and gate actions stay, the viewer shows the message. Checked for a storage 404 and for a CORS refusal (`ui-shots/round-h/`). "Try again" fetched a new signed link (2 different signatures) with no page error.
- [x] Validate (§4.5). Write the result in §13.

**Commit (when told):** `fix: the PDF viewer shows a load error in place and keeps the workspace (UX-009, FR-REV-03)`

#### Task H.2: focus line (approved, UX-D-07)

- [x] Test first (`tests/unit/components/focus-ring.test.ts`): every class string in `src/` with `outline-none` and `focus-visible:outline-<n>` also has `focus-visible:outline-solid`. Every `Button` variant renders it. 7 of 8 checks failed before the fix.
- [x] Add `focus-visible:outline-solid` in the 6 class strings: `src/components/ui/button.tsx`, `src/components/app-shell.tsx` (2), `src/components/nav-links.tsx`, `src/components/notification-panel.tsx`, `src/app/coordinator/_lib/form-parts.tsx`.
- [x] Check in a browser: sidebar links and Coordinator fields show a solid 2 px maroon outline. A maroon button shows the gold outline (`DESIGN.md` §10). Close-ups in `ui-shots/round-h/focus-*.png`.
- [x] Validate (§4.5). Native inputs without own focus classes still show the faint ring (UX-002, R1).

**Commit (when told):** `fix: visible focus outline on buttons, links and Coordinator fields (UX-001, DESIGN.md §10, WCAG 2.4.7)`

---

## 7. Round 2: the `/lab` showcase

### Task 2.1: `/lab` route

**Files:**
- Create: `src/app/lab/layout.tsx`, `src/app/lab/page.tsx` (index), `src/app/lab/_mock/` (mock data and mock-only components), `src/app/lab/[...slug]/` or one folder for each page
- Create: `tests/unit/lab-guard.test.ts`
- Modify: `eslint.config.mjs`, `.gitignore`

**Rules:**
- `layout.tsx` calls `notFound()` when `process.env.NODE_ENV === "production"`. `pnpm build && pnpm start` and Vercel then return a 404. The e2e run uses a production build, so it never sees `/lab`.
- `/lab` has no sign-in and needs none, because it shows mock data only.
- ESLint rule for `src/app/lab/**`: `no-restricted-imports` refuses `@/server/*`, `@/app/_lib/*` and every `actions` module. Allow type-only imports (`allowTypeImports: true` in `@typescript-eslint/no-restricted-imports`).
- Mock data uses fake names and the shapes of the real view-model types. Put it in `src/app/lab/_mock/`.
- Each page has a theme switch (light, dark, system) at the top, and the list of the states it shows.

**Pages (add more in each round):**

| Path | Content | Round |
| :---- | :---- | :---- |
| `/lab` | Index of all pages, with the round and the gate state of each | 2 |
| `/lab/foundations` | Ramps, semantic tokens, status tones, type scale, spacing, radius, focus ring, both themes side by side | R1 |
| `/lab/glyphs` | All glyphs at 16, 20 and 30 px, with names, in both themes | R1 |
| `/lab/patterns/<name>` | One page for each pattern: every variant and state | R1 to R6 |
| `/lab/states` | Loading, error, empty, success, toast, disabled with a reason | R2 |
| `/lab/motion` | The 2 or 3 timing options of D-10, side by side, with a reduced-motion switch | R2 |
| `/lab/screens/<ID>` | The real `view.tsx` of a screen with mock props, in its "First day" state and one working state | R7 |

**Tests:** `lab-guard.test.ts` sets `NODE_ENV` to `production`, calls the layout and expects the `notFound` error. With `development`, it renders the children.

- [ ] Write the test. Run it. Expected: FAIL.
- [ ] Build the layout, the index and the lint rule. Run `pnpm test tests/unit/lab-guard.test.ts && pnpm lint`. Expected: PASS.
- [ ] Add `ui-shots/` to `.gitignore`.

### Task 2.2: the screenshot tool

**Files:**
- Create: `playwright.lab.config.ts`, `tests/lab/shots.spec.ts`
- Modify: `package.json` (script `lab:shots`)

**Rules:**
- The config has its own `webServer`: `pnpm dev -p 3100`. The main `playwright.config.ts` does not change, so CI does not run it.
- Projects for the viewports in `UI_UX_AUDIT.md` §1.2. Each shot runs once with `colorScheme: "light"` and once with `"dark"`, and the reduced-motion pass uses `reducedMotion: "reduce"`.
- `lab:shots <round>` takes the list of `/lab` paths from a table in `tests/lab/shots.spec.ts`, keyed by round.
- "Live" mode (`LAB_LIVE=1`) opens real routes with the saved role sessions from `tests/e2e/.auth/` (Task 1.1). It reads `.env.local` like the main config. It never prints a secret.
- Output: `ui-shots/<round>/<page>-<viewport>-<theme>.png`, full page.

- [x] Build it. Run `pnpm lab:shots lab`. Expected: shots of `/lab` for each viewport and theme. **25 Nov 2026:** built. `/lab` does not exist until Task 2.1, so the tool was checked in live mode (`LAB_LIVE=1 … pnpm lab:shots audit`: 172 shots passed, then 28 for the defense routes).

**As built (25 Nov 2026):**

| Item | Value |
| :---- | :---- |
| Files | `playwright.lab.config.ts`, `tests/lab/shots.spec.ts`, `tests/lab/run.mjs` (passes the round in `LAB_ROUND`, because Playwright reads extra arguments as file filters), `package.json` script `lab:shots`, `ui-shots/` in `.gitignore` |
| Variables | `LAB_LIVE=1`, `LAB_THEMES` (`light`, `dark`), `LAB_VIEWPORTS` (`desktop`, `laptop`, `laptop-sm`, `tablet`, `phone`), `LAB_PORT` (default 3100), `LAB_WORKERS` (default 2), `LAB_MILESTONE_ID` (SV routes), `LAB_DEFENSE_ID` (defense routes with no link), `LAB_CORS_RELAY=1` |
| Port | Next 16 allows one `next dev` for each folder. If the owner already runs `pnpm dev` on port 3000, set `LAB_PORT=3000`, or run `pnpm build && pnpm start -p 3100`. |
| CORS relay | The file store allows only the origins of `scripts/set-storage-cors.mjs`. On another port, `LAB_CORS_RELAY=1` relays each file request in the test browser and adds the CORS header. It changes nothing on the file store. |
| Output | `ui-shots/<round>/<page>-<viewport>-<theme>.png` (full page), a reduced-motion pass at the first viewport (`<theme>-reduced`), and `ui-shots/<round>/manifest.jsonl` (final URL, HTTP status, `h1`, console and page errors). The tool removes the query string of each URL in a message, so no signed link reaches the disk. |

**Commit (when told):** `feat: development-only /lab showcase and screenshot tool (UX-D-05)`

---

## 8. Round R1: foundations

**Preview:** `/lab/foundations`, `/lab/glyphs`, `/lab/patterns/{status,blocked-action,flag,empty-state,identity-line,docket,stepper,theme-toggle}`.
**Decision points for the owner:** the dark values (§8.1 has a start set). Whether to add `@axe-core/playwright`.

### Task R1.1: tokens file (old Task 1)

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css`: import the tokens. Remove the ramps, tone values and the shadcn `.dark` block. Remove the "D-01 and D-02 are still [CONFIRM]" comment.
- Test: `tests/unit/components/tokens.test.ts`, `tests/unit/components/contrast.test.ts`

**Interfaces:** the custom properties of `DESIGN.md` §12.1 to §12.4 with these exact names and values among them: `--color-maroon-600: #800000`, `--color-gold-400: #F4C430`, `--tone-returned-fg: #B3261E`, `--row-h-comfortable: 56px`, `--row-h-compact: 48px`, `--cell-pad-x: 16px`, `--row-action-w: 132px`, `--row-action-h: 32px`, `--kpi-num-size: 36px`, `--kpi-glyph-size: 30px`, `--glyph-stroke: 1.5`, `--glyph-tone-opacity: 0.16`, `--sidebar-w: 240px`, `--topbar-h: 56px`, `--target-tablet: 44px`, `--target-defense: 48px`. Keep the status token names that components use today (`--color-tone-*`), mapped to `--tone-*`.

**Dark theme structure:**
- The primitive ramps do not change between themes. The semantic tokens (§12.2) and the status tokens (§12.3) get a second value set under `.dark`.
- Change the variant in `globals.css` to `@custom-variant dark (&:where(.dark, .dark *));`, so the `.dark` class on `<html>` works.
- A component never uses `dark:` classes for colors. It uses the semantic tokens, and the tokens change.

**Tests:**
- `tokens.test.ts`: read `tokens.css` as text and check each name and value above. Check that `globals.css` holds no hex color. Check that each semantic and status token has a value in `:root` and in `.dark`.
- `contrast.test.ts`: parse both value sets. Compute the WCAG ratio. Each text pair (foreground on background, card, popover; muted on card; each tone fg on its bg; primary-foreground on primary) needs 4.5:1 or more. The input border and the focus ring need 3:1 or more on the surface they sit on.

- [ ] Write the tests. Run `pnpm test tests/unit/components/tokens.test.ts tests/unit/components/contrast.test.ts`. Expected: FAIL.
- [ ] Write `tokens.css` and the `.dark` set (§8.1). Run the tests and `pnpm build`. Expected: PASS.

### 8.1 Dark start set (a proposal for UX-P-01, not approved)

Warm neutrals, not an inversion. Maroon is too dark for text on a dark surface, so links and the focus ring use `maroon-300`. The ratios below were computed on 25 Nov 2026. The contrast test checks them again.

| Token | Light (v0.2) | Dark start value | Ratio in dark |
| :---- | :---- | :---- | :---- |
| `--background` (ground) | `neutral-50` | `#161112` | — |
| `--card` (surface) | `neutral-0` | `#1E1819` | — |
| `--popover` (raised) | `neutral-0` | `#262021` | — |
| `--secondary`, `--muted` (sunken) | `neutral-100` | `#120E0F` | — |
| `--foreground` (ink) | `neutral-900` | `#F4EFEF` | 16.42 on ground, 15.37 on surface |
| secondary text | `neutral-700` | `#D6CDCE` | 11.24 on surface |
| `--muted-foreground` | `neutral-600` | `#B3A8AA` | 7.58 on surface |
| `--border` (hairline) | `neutral-200` | `#3A3133` | — |
| divider strong | `neutral-300` | `#4D4345` | — |
| `--input` | `neutral-500` | `#8C8082` | 4.60 on surface |
| `--primary` / `--primary-foreground` | `maroon-600` / white | `maroon-500` `#9E2B2B` / white | 7.41 (label). The fill is 2.52 on ground: the preview decides if it needs an edge. |
| link and `--ring` | `maroon-600` | `maroon-300` `#D69393` | 7.53 on ground, 7.05 on surface |
| `--accent` / `--accent-foreground` | `maroon-50` / `maroon-700` | `#2A1414` / `#E9BFBF` | 10.48 |
| tone `neutral` fg / bg / line | §12.3 | `#C9BFC0` / `#262021` / `#3A3133` | 8.92 |
| tone `active` | §12.3 | `#9DBDF0` / `#14233A` / `#2B4670` | 8.24 |
| tone `pending` | §12.3 | `#F2B877` / `#33210D` / `#5C3D17` | 8.72 |
| tone `done` | §12.3 | `#84CFA4` / `#10291C` / `#24503A` | 8.44 |
| tone `returned` | §12.3 | `#F49A92` / `#3A1412` / `#6B2722` | 7.67 |
| tone `locked` | §12.3 | `#C9BFC0` / `#2A2324` / `#4D4345` | 8.57 |
| tone `achieved` | §12.3 | same as light: `#3D0505` on `#F4C430`, line `#D9A600` | 10.46 |

**Warning:** gold text on the dark ground has 11.38:1, but G8 still applies. Use gold only for `achieved` and the current step.

### Task R1.2: theme mechanism and `theme-toggle`

**Files:**
- Create: `src/components/patterns/theme-toggle/index.tsx`, `src/lib/theme.ts`
- Modify: `src/app/layout.tsx`
- Test: `tests/unit/components/theme.test.ts`

**Interfaces:**
- `src/lib/theme.ts`: `type ThemeChoice = "light" | "dark" | "system"`; `THEME_KEY = "theme"`; `resolveTheme(choice: ThemeChoice | null, prefersDark: boolean): "light" | "dark"`; `THEME_SCRIPT: string`. The script reads `localStorage` in a `try` block, falls back to `matchMedia("(prefers-color-scheme: dark)")`, and sets or removes the `dark` class and `color-scheme` on `<html>`.
- `layout.tsx`: `<html suppressHydrationWarning>`, and `<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />` as the first child of `<head>`. The CSP allows inline scripts today (`next.config.ts`). If a CSP with `script-src` is added later, it needs a hash for this script.
- `ThemeToggle(props: { compact?: boolean })`: a client component. A Base UI menu or a 3-option radio group with the labels "Light", "Dark" and "System". The accessible name is "Theme". The choice writes `localStorage` and the class at once. In "system" mode it follows changes of the OS setting.

**Tests:** `resolveTheme` for each of the 6 cases. The script string sets `dark` when the stored choice is "dark", and leaves it out for "light" (run it in a `jsdom` or a fake `document`). The toggle has the accessible name "Theme" and 3 options.

- [ ] Write the tests. Run them. Expected: FAIL. Build it. Run them. Expected: PASS.
- [ ] In R1, `/lab` shows the toggle. The toggle moves into the live top bar in Task R1.4 (Integrate).

### Task R1.3: glyph set (old Task 2)

**Files:** create `src/components/patterns/glyphs/index.tsx`. Test: `tests/unit/components/glyphs.test.ts`.
**Interfaces:** `type GlyphName = "scan" | "verify" | "flag" | "return" | "seat" | "calendar" | "defense" | "gate" | "commit" | "clear" | "template" | "overview" | "student" | "users" | "audit" | "export" | "search" | "bell" | "done" | "todo" | "lock" | "received"`; `Glyph(props: { name: GlyphName; size?: 16 | 20 | 30; label?: string; className?: string })`. Without `label`: `aria-hidden="true"`. With it: `role="img"` and `aria-label`.

- [ ] Test: each name has `viewBox="0 0 24 24"`, `stroke-width="1.5"`, round caps and joins, `stroke="currentColor"`, no `fill` except on the `.tone` element. Size 30 gives `width="30"`. Run it. Expected: FAIL.
- [ ] Copy the path data from the `<symbol>` elements in `design/mockups/coordinator-mockups.html`. Map `g-mismatch` → `flag` and `g-def-a` → `defense`. The `.tone` element gets `fill="currentColor"` and `fill-opacity: var(--glyph-tone-opacity)`. Glyphs use `currentColor`, so they work in both themes. Run the test. Expected: PASS.

### Task R1.4: base patterns (old Task 3)

**Files:**
- Create: `src/components/patterns/{status,blocked-action,flag,empty-state,identity-line,docket,stepper}/index.tsx`
- Move from: `src/components/status/*`, `action-button.tsx`, `banners.tsx`, `empty-state.tsx`, `docket.tsx`, `milestone-stepper.tsx`. Leave a re-export at each old path until R8.
- Tests: move `tests/unit/components/{status,action-button,docket,stepper}.test.ts` to the new paths. Add `identity-line.test.ts`, `flag.test.ts`, `empty-state.test.ts`.

**Interfaces:**
- `StatusPill`, `DocumentStamp`, `OutsideChip`: the same props as today.
- `BlockedAction(props: { children; reason?: string; variant?: "primary" | "secondary" | "return" | "text"; size?: "default" | "compact" | "defense" } & ButtonHTMLAttributes)`.
- `Flag(props: { children: ReactNode; compact?: boolean })`: compact is a glyph with the text in a tooltip, and the text is also readable by a screen reader.
- `EmptyState(props: { title: string; body?: string; action?: ReactNode })`.
- `IdentityLine(props: { title: string; degreeLevel: "masters" | "doctoral"; adviser?: string; committee?: string[]; ownView?: boolean })`.
- `Docket(props: { step: 1 | 2 | 3 | 4; milestone: string; status: MilestoneStatus; blocker: string | null; action: ReactNode; formLink?: { href: string; label: string }; processLink?: boolean })`. No blocker shows "Nothing blocks this step."
- `Stepper(props: { current: 1 | 2 | 3 | 4; completed: number[]; compact?: boolean })`.

- [ ] Tests: Docket shows "Step 2 of 4", the blocker line, one primary action, and the process link only when asked. IdentityLine has a serif title and "Master's" or "Doctoral". Flag in compact mode keeps the text for screen readers. EmptyState has no image. `return` variant has no solid fill. Run them. Expected: FAIL.
- [ ] Build each pattern. First line `// Source: …` (the §7.4 Source column). Tokens and glyphs only. Pills keep the Lucide icons until R2 decides D-06 (`// D-06 open`).
- [ ] Add each pattern's `/lab` page. Run `pnpm lab:shots r1`.

### Gate R1 → `UX-P-01`

Show the owner the R1 pages and shots (§4.2). Ask for: the dark values, the toggle form (menu or 3 options), the `@axe-core/playwright` proposal.

### Task R1.5: integrate R1

- [ ] Put the approved dark values in `tokens.css`. Fill `DESIGN.md` v0.3 §12.5.
- [ ] Put `ThemeToggle` in the top bar of `src/components/app-shell.tsx` and on the login page.
- [ ] Switch the call sites of the moved components to the pattern paths where it is a one-line import change. Leave the rest to R7.
- [ ] Check each live screen in dark. A screen that uses a raw color class (for example `bg-white`, `text-black`, `bg-neutral-100`) is a finding. Fix it with the semantic token if it is a one-class change. Otherwise list it for R7.
- [ ] The PDF canvas keeps a white page in dark. Check `pdf-viewer.tsx`.
- [ ] Validate (§4.5). Add an e2e test: `/login` with `colorScheme: "dark"` gets the `dark` class, and a stored "light" choice wins over the OS setting.

**Commit (when told):** `feat: token layer with light and dark themes, theme toggle, glyph set, base patterns (DESIGN.md §6.2, §7, §12, UX-D-01)`

---

## 9. Round R2: shell and system states

**Preview:** `/lab/patterns/{app-shell,sidebar,toast}`, `/lab/states`, `/lab/motion`.
**Decision points:** D-06 (pill glyphs: draw `active`, `pending`, `achieved`), D-07 (draw the 10 sidebar glyphs), D-08 (top-bar panels), D-10 (timings). Show each with 2 or 3 options.

### Task R2.1: app shell and sidebar (old Task 4)

**Files:** create `src/components/patterns/{app-shell,sidebar}/index.tsx`, `src/components/patterns/sidebar/nav.ts`. Modify `src/components/app-shell.tsx`, `nav-links.tsx` (re-exports), the four role layouts. Test: `tests/unit/components/sidebar.test.ts`, `app-shell.test.ts`.

**Interfaces:** `type NavItem = { label: string; href: string; glyph: GlyphName; lockedReason: string | null; count?: number }`; `navFor(role: UserRole, facts: NavFacts): NavItem[]`, with `NavFacts = { milestone: 1 | 2 | 3; sheetsVerified: boolean; gate1bDone: boolean; defenseStarted: boolean; panelAccess: boolean }`; `Sidebar(props: { items: NavItem[]; activeHref: string })`.

- [ ] Tests: `navFor("student", …)` gives the 8 items of `design/screens/README.md` in order, "Thesis process" second. "Clearance" has "Opens at Milestone 3." "Submission" has "Opens at Gate 1b." while `gate1bDone` is false. A locked item has a `lock` glyph, `aria-disabled="true"`, and its reason linked with `aria-describedby`, and it can take keyboard focus. The active item has `aria-current="page"`. The shell has a skip link as its first focusable element, to `#main`.
- [ ] Build per `DESIGN.md` §5.1: 3 px maroon masthead rule, 56 px top bar (wordmark, search, bell, theme toggle, user menu), 240 px sidebar, drawer below 1024 px. The drawer is a Base UI dialog with a focus trap. `rounded-panel` → `rounded-card`.
- [ ] The search, bell and preferences behavior stays as it is today until the owner decides D-08 at the gate. Then build the approved form. Do not add a search feature that does not exist. A `/` command palette that only moves between routes is presentation, but it still needs the gate.
- [ ] `navFor` takes facts from existing data calls in the role layouts. Add no new data call without listing it in the round's `UX-P-02` block.

### Task R2.2: toast

**Files:** create `src/components/patterns/toast/index.tsx`. Test: `tests/unit/components/toast.test.ts`.
**Interfaces:** `ToastProvider` (in the root layout), `useToast(): { show(t: { label: string; tone: "done" | "returned" | "neutral"; glyph?: GlyphName }): void }`.

- [ ] Use `@base-ui/react/toast`. 4 s timeout. `role="status"` (polite). A glyph and a text label. Tokens only, both themes. Pause on hover and focus.
- [ ] Rule: use it only for small confirmations (preferences saved, availability saved, file uploaded). Every workflow result also shows on the screen.

### Task R2.3: loading and error states

**Files:** create `src/components/patterns/{loading,error}/index.tsx`. Modify `src/app/_components/page-loading.tsx` (re-export). Add `loading.tsx` and `error.tsx` to each role segment only where the audit found a gap.

- [ ] Loading: blocks of the size of the content, no shimmer, `aria-busy="true"` on the region, a hidden "Loading" text.
- [ ] Error: an inline message with "Try again" (`reset()` in `error.tsx`). The message names what failed and what to do. No stack trace, no internal code.

### Task R2.4: motion (D-10)

- [ ] `/lab/motion` shows 2 or 3 timing options for: a state change (pill, row), a dialog and side sheet, a drawer, a toast. Proposal: A = 120 ms state and 160 ms overlay, B = 150 ms and 200 ms, C = no motion except overlays. Entry animations of pages: none in all options.
- [ ] After the gate, put the approved values in `tokens.css` as `--motion-*` tokens and in `DESIGN.md` v0.3 §6.1. CSS transitions use the tokens. The reduced-motion rule in `globals.css` stays.

### Gate R2 → `UX-P-02`. Task R2.5: integrate

- [ ] Draw the approved D-06 and D-07 glyphs into the glyph set and the tests. Remove the `// D-06 open` and `// D-07 open` comments.
- [ ] Put the shell and sidebar on all four role layouts. Put the toast on the small confirmations that exist today.
- [ ] Fix e2e selectors that used the old navigation. Validate (§4.5).

**Commit (when told):** `feat: app shell and sidebar with locked items, toast, loading and error states, motion tokens (DESIGN.md §5.1, BR-18, UX-D-04)`

---

## 10. Rounds R3 to R6: patterns

Each round: build the patterns with tests, add `/lab` pages, take the shots, pass the gate, then integrate only the re-exports. The live screens change in R7.

### R3: queues, inbox, dialogs, side sheet (old Tasks 5, 6, and the side sheet of 9)

| Pattern | Interface | Tests that must fail first |
| :---- | :---- | :---- |
| `queue-table` | `QueueTable<Row>(props: { columns: { key; label; width?; render? }[]; rows: Row[]; density: "compact" \| "comfortable"; groupBy?; action?: (r) => { label; href?; onClick?; reason? }; empty: ReactNode; sort?: { key; dir } })` | Compact uses `table-layout: fixed` and `--row-h-compact`. Every row action has the same width (`--row-action-w`). A 200-character title is one line, and the full text is in a tooltip and on focus. `empty` shows when there are no rows. Sortable headers have `aria-sort`. |
| `kpi-strip` | `KpiStrip(props: { items: { label; count; oldestDays; late; glyph; href; selected? }[] })` | The count uses `--kpi-num-size`. The age shows as "6d", with the late style when `late`. A count of 0 is muted. |
| `inbox` | `Inbox(props: { list; viewer; record })` | 300 px / flexible / 300 px at laptop. Below 1024 px the record moves under the viewer. |
| `return-composer` | `ReturnComposer(props: { onSend(reason); onCancel(); placeholder })` | Label "Reason for return". "Send return" has `aria-disabled` and "Write a reason first" while the field is empty or only spaces. No preset reasons. |
| `dialog` | `ConfirmDialog(props: { title; body; confirmLabel; onConfirm; open; onOpenChange })` | `role="dialog"`, title, body, the confirm button and "Cancel". Focus moves in, Escape closes, focus returns to the opener. Verify copy: "Verify {form} for {Student}?" and "This locks the document." |
| `side-sheet` | `SideSheet(props: { title; open; onOpenChange; children; footer })` | Opens from the right, focus trap, Escape closes. Full width below 640 px. Forms follow Stripe: label above the field, helper text under it, the error under the field and linked with `aria-describedby`. |

Use Base UI `dialog` for `dialog` and `side-sheet`. Visual reference for C1 and C4: `design/mockups/coordinator-mockups.html` v5.

### R4: Student path (old Task 7)

| Pattern | Interface | Tests |
| :---- | :---- | :---- |
| `task-list` | `TaskList(props: { groups: { label; collapsed?; items: { stamp?; label; reason?; actions? }[] }[] })` | A collapsed group ("Advising forms · optional") is a `<details>` or a disclosure button with `aria-expanded`. Each item has at most one stamp. |
| `step-by-step` | `StepByStep(props: { steps: { title; current; done; body }[] })` | The current step shows "You are here" and is expanded. The other steps are collapsed. Done steps have the `done` glyph. |

- [ ] Route `/student/process` (`spec/SITEMAP.md`, PROCESS spec): Student only (FR-ACC-02), with the same role check as the other Student pages. A Master's Student sees "2 Panel Members", a Doctoral Student "3". 4 steps, no Stage 0. Forms link to the blank forms in `docs/reference/tdw-forms` until Phase 4.
- [ ] e2e: the route opens for the Student and is refused for the other 3 roles.
- [ ] The route is new code, but it is in the sitemap. Its preview is `/lab/screens/PROCESS` with mock data. Build the live page only after the gate.

### R5: manuscript workspace (old Task 8)

| Pattern | Interface | Tests |
| :---- | :---- | :---- |
| `gate-box` | `GateBox(props: { checks: { label; ok; reason? }[]; gateLabel; onGate; onReturn })` | One failing check gives `aria-disabled` and that check's reason. Return is never disabled and never a solid red fill. |
| `merge-box` | `MergeBox(props: { sentence; action: ReactNode \| null; lockedReason? })` | One sentence, at most one action. The locked reason shows when `action` is null. |
| `thread-feed` | `ThreadFeed(props: { threads: ThreadView[]; viewerRole; ownUserId; onJumpToPage(p); canResolve(t) })` | Tabs Open (first), All, Resolved. `page: 14` gives a "p. 14" button. `page: null` gives none. A Student sees "Reply" and no "Resolve" (BR-05). Own open threads have the amber edge. Reading width follows Notion: about 65 characters for the body text (UX-D-03). |
| `commit-selector` | `CommitSelector(props: { commits; selected; onSelect })` | `v3` in mono, the short hash, the date, the uploader, the Ready pill |
| `pdf-viewer` | Move `src/components/pdf-viewer.tsx`. Same props. | Page Up and Page Down move one page. The locked banner shows when the manuscript is locked (§8.6). The page stays white in dark. |
| `workspace` | `Workspace(props: { header; viewer; feed; box })` | Split view at laptop. Below 1024 px the thread feed is a tab. |

No pins or highlights on the PDF (ADR-009).

### R6: forms and Defense Day (rest of old Task 9)

| Pattern | Interface | Tests |
| :---- | :---- | :---- |
| `slot-list` | Move `src/app/_components/slot-list.tsx`. Same props. | Check against S4, A4 and P3 |
| `date-picker` | `DatePicker(props: { earliest: Date; value: Date \| null; onChange(d) })` | A day before `earliest` has `aria-disabled` and "At least 7 days after Gate 1b." (BR-09). Full keyboard grid (arrows, Home, End, Page Up, Page Down). Dates in PST (UTC+8). Build it on Base UI parts. No new package without the gate. |
| `defense-form` | `DefenseForm(props: { rows: { code; name; weight; score }[]; onSave; saved })` | 48 px number steppers. The total is the sum. No grade word, no color class on a score (F4). "Saved. Sign the paper sheet." only after a save. No autosave (AGENTS.md §9). |
| `verdict` | `Verdict(props: { members: { name; total; actionTaken }[]; canRecord; recordReason?; updatedAt; onRefresh })` | A member with `total: null` gives the flag "1 sheet is not saved yet.", and the record control stays enabled when `canRecord` (F2, BR-17). Refresh every 30 s while mounted, "Updated hh:mm". |
| `consultation-log` | `ConsultationLog(props: { rows; empty })` on `queue-table` | Carbon-style columns, comfortable density |

**Commit for each round (when told):** for example `feat: queue table, KPI strip, inbox, Return composer, dialog and side sheet patterns (DESIGN.md §5.4, §8.9, BR-13, BR-19)`.

---

## 11. Round R7: screens, one role at a time (old Task 10)

Sub-rounds: **R7a Student** (S1 to S6, PROCESS from R4), **R7b Adviser** (A1 to A5), **R7c Panel Member** (P1 to P4), **R7d Coordinator** (C1 to C10), with **SV** and **LOGIN** in the last sub-round.

**For each screen:**

1. Read `design/screens/<ID>.md` and the audit findings for the screen.
2. Write a test for its "First day" state (the exact empty-state text in the spec) and for one rule in its "Rules" section. Run it. Expected: FAIL.
3. Split the route: `page.tsx` keeps the access check, the data calls and the server actions, and passes them to a new `view.tsx`. `view.tsx` composes patterns only. Its props are the page's data and the actions.
4. Add `/lab/screens/<ID>` with the real `view.tsx` and mock props, in the "First day" state and one working state.

**At the end of each sub-round:**

5. Run `pnpm lab:shots r7a` (and `LAB_LIVE=1` for the live pages, after the gate).
6. **Gate `UX-P-07a` (and so on).** Do not replace the live `page.tsx` markup before it passes. Steps 2 to 4 are in the branch, but the old page still renders its old markup until the gate.
7. Integrate: `page.tsx` renders `view.tsx`. Remove the old markup.
8. Validate (§4.5), with `pnpm test:e2e`.

**Notes that the specs do not settle:**
- **C4:** uses `reviewDocument(…, { to: "verified" | "returned" })`. Verify opens `ConfirmDialog`. Return opens `ReturnComposer` inline. "File details" always shows.
- **C6 sheets:** label the existing `match_result` actions "Verify" (`matched`) and "Return" (`mismatch`, with a reason). No schema change.
- **C10 (R7d.1):** `/coordinator/audit` (FR-RPT-01, FR-RPT-02, AS-06). If no data function lists audit rows with filters, add `listAudit(ctx, filters)` to `src/server/data/audit.ts` with a Coordinator-only access check (NFR-01). Write its tests first: a refused role gets `AccessDeniedError` and makes no query, and the filters work. Then build the page on `queue-table`, with the CSV export. Tell the owner about this data function in the R7d preview.
- **S1 title edit, C2 title field, S3 advising copies, C8 advisee limit, A1 and C3 flags:** use the data functions from PR #81 (D-24 to D-28).
- **LOGIN:** has the theme toggle. Keep the sign-in behavior and the error messages exactly as they are.
- **SV:** one `view.tsx` for the four routes, with the role as a prop.

**Commit for each sub-round (when told):** for example `feat: Student screens on the Guided Ledger patterns, light and dark (design/screens S1 to S6, PROCESS)`.

---

## 12. Round R8: layer rule, clean-up, full validation (old Task 11)

- [ ] `eslint.config.mjs`: a `no-restricted-imports` rule for `src/app/**/page.tsx` and `src/app/**/view.tsx` refuses `@/components/ui/*`, `lucide-react`, `motion/react` and `@base-ui*`, with the message "Pages use patterns only (DESIGN.md §7.1)." `/lab/_mock/` is out of scope of this rule.
- [ ] Run `pnpm lint`. Move each refused import into a pattern.
- [ ] Delete the re-exports at the old component paths.
- [ ] Check that `src/app/coordinator/spike-files/` does not exist.
- [ ] Full validation: every row of §4.5 on every route of `UI_UX_AUDIT.md` §5, in both themes and all viewports. Fill the §5 table of the audit.
- [ ] Check the definition of done (§14).

**Commit (when told):** `chore: enforce the page layer rule, remove old component paths (DESIGN.md §7.1)`

---

## 13. Results log

Fill one row for each validation run. Never write "pass" for a check you did not run.

| Date | Round | Commit | lint | typecheck | test | test:e2e | build | shots | contrast | keyboard | reduced motion | axe | Notes |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 25 Nov 2026 | Baseline (§1 step 5) | `b1c38e4` + uncommitted docs | Pass (0 errors, 1 warning: unused `loadMilestoneContext` in `src/server/data/manuscript.ts`) | Pass | Pass (62 files, 612 tests) | Not run | Not run | — | — | — | — | — | Before any change |
| 25 Nov 2026 | 0, 1, 2.2 | Uncommitted | Not run again | Pass (inside `pnpm build`) | Not run again (no app code changed) | Not run | Pass (after a type fix in `playwright.lab.config.ts`) | Audit shots: 200 taken (light, 5 viewports, reduced-motion pass) | Not run (R1.1) | Probe: no visible focus (UX-001), no skip link | Pass (no animation exists) | Not run (package not approved) | Stage 1. P2 crashes (UX-009). Dev server fails on 7 routes (UX-037). |
| 25 Nov 2026 | H (H.1) | Uncommitted | Pass (0 errors, the same 1 warning) | Pass | Pass (63 files, 617 tests; the 2 viewer tests fail without the fix) | Pass (19, `E2E_PORT=3100` on the new build) | Pass | P2 desktop and tablet, storage 404 and CORS refusal (`ui-shots/round-h/`) | Not run (R1.1) | "Try again" is a real button | Not run | Not run | UX-009 fixed. A stale `.next/server/route-cache` from an older `next start` gave a CSS 404 until it was cleared. |
| 25 Nov 2026 | H (H.2) | Uncommitted | Pass (0 errors, the same 1 warning) | Pass | Pass (64 files, 625 tests) | Pass (19, `E2E_PORT=3100`) | Pass | Focus close-ups (`ui-shots/round-h/focus-*.png`) | Not run (R1.1) | Probe: `outline-style: solid` on links, buttons and Coordinator fields | Not run | Not run | UX-001 fixed. UX-002 stays for R1. |

---

## 14. Definition of done

- [ ] Every route in `spec/SITEMAP.md` has a filled row in `UI_UX_AUDIT.md` §5.
- [ ] Every flow in `spec/USERFLOW.md` has a checked row in `UI_UX_AUDIT.md` §6.
- [ ] Every pattern in the `DESIGN.md` §7.4 registry is in `src/components/patterns/`, with a `// Source:` comment, a props contract, tests and a `/lab` page.
- [ ] Light and dark work on every screen. The contrast test passes.
- [ ] Desktop, laptop and tablet are checked. Phones are checked as read only.
- [ ] Keyboard, focus, screen-reader names, reduced motion and WCAG 2.2 AA are checked and recorded.
- [ ] Every round has an approved `UX-P-nn` record in `DESIGN_DECISIONS.md`.
- [ ] No unapproved preview is integrated.
- [ ] Routes, flows, roles, access checks and data contracts are the same as before, except the approved `listAudit` read.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` and `pnpm build` pass on the last commit.
- [ ] `DESIGN.md`, `UI_UX_AUDIT.md` and this file describe the code as it is.
