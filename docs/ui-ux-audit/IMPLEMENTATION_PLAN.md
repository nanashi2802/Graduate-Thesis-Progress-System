# UI/UX retrofit implementation plan

**Status:** v1.7, 27 Nov 2026. R5 approved (UX-P-05), integrated and committed (`eff07da`, `8b020e8`); R6 is written for a new session (R6.0). v1.6, 26 Nov 2026: R4 approved (UX-P-04), integrated and committed (`8a24508`, `f4f9ded`); R5 is written for a new session (R5.0). v1.5: R3.10 integrated, not committed (§10.2). v1.4: R3 approved at UX-P-03 and committed (`3b830d7`); R3.10 was written for a new session (§10.1). v1.3: R1 and R2 approved, integrated and committed (`9d663dd`, `ad2c760`). R3 is written for a new session (§10.0). v1.2: R1 approved; R1.5 and R2 were written for a new session (§8 Task R1.5, §9). Round 0, Round 1, Round H, Round 2 and the R1 preview are committed (up to `c7b7a71`). v1.1 (25 Nov 2026) added Round H and the Stage 1 tasks (§6.1). Update the "State" column of §3 and the results log in §13 as you work.
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
| 2 | `/lab` showcase and the screenshot tool | — | — | Done 25 Nov 2026. Task 2.2 committed (`a160436`). Task 2.1 not committed. |
| H | Hotfix before R1 (§6.2): UX-009 PDF error state, UX-001 focus line | — | — | H.1 (UX-D-06) and H.2 (UX-D-07) built 25 Nov 2026, not committed. Round H is complete. |
| R1 | Foundations: tokens in light and dark, theme, glyphs, base patterns | 1, 2, 3 | Dark values (UX-P-01) | **Approved 26 Nov 2026** (UX-P-01). Preview committed (`6c5c9b5`, `c7b7a71`). R1.5 integrated and committed 26 Nov 2026 (`9d663dd`, `ui/r1-integrate`). |
| R2 | Shell and system states: app shell, sidebar, top-bar panels, toast, loading and error, motion, glyphs | 4 | D-06, D-07, D-08, D-10, R2-a, R2-b, R2-c | **Approved 26 Nov 2026** (UX-P-02). R2.8 integrated 26 Nov 2026 on `ui/r2-shell`, not committed. |
| R3 | Queues, inbox, dialogs, side sheet, form field, one form-feedback contract | 5, 6, part of 9 | R3-a to R3-i (§10.0, UX-P-03) | **Approved 26 Nov 2026** (UX-P-03): R3-a A, R3-b A, R3-c A, R3-d 480 px, R3-e A, R3-f A, R3-g A, R3-h A, R3-i A, `form-field` in the registry. Preview committed (`3b830d7`). **R3.10 integrated 26 Nov 2026** on `ui/r3-patterns`, not committed (§10.2). |
| R4 | Student path: task list, step-by-step, Thesis process | 7 | R4-a B, R4-b A, R4-c B, R4-d A (UX-P-04) | **Approved 26 Nov 2026** (UX-P-04): "R4 approved, go with B, A, B, A". Preview committed (`8a24508`). **R4.6 integrated and committed 26 Nov 2026** (`f4f9ded`, `ui/r4-student`, §10.3). |
| R5 | Manuscript workspace | 8 | R5-a A, R5-b A adapted (no sticky), R5-c A, R5-d B, R5-e A (UX-P-05, feedback pass 1) | **Preview built 26 Nov 2026** (R5.1 to R5.8) on `ui/r5-workspace`, not committed. Revised after feedback pass 1. **Approved 26 Nov 2026** (UX-P-05: "accept R5"). Preview committed (`eff07da`). **R5.9 integrated 26 Nov 2026** (§10.5) and committed (`8b020e8`). |
| R6 | Forms and Defense Day | 9 | R6-a A, R6-b A, R6-c A with a Refresh button, R6-d A (owner, 27 Nov 2026, before the build) | **Brief written 27 Nov 2026** (R6.0). **Preview built 27 Nov 2026** (R6.1 to R6.7) on `ui/r6-forms`, not committed (§10.6). **Approved 27 Nov 2026** (UX-P-06: "Accept R6"), after the stepper focus fix. **R6.9 integrated 27 to 28 Nov 2026** (§10.7) and committed on `ui/r6-forms`. |
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

#### 4.5.1 Screenshot schedule (owner, 26 Nov 2026)

The full live audit (`LAB_LIVE=1 … pnpm lab:shots audit`) is deferred to R7d. Before R7d, many routes and links do not exist yet (C10, PROCESS, Audit), so the audit repeats known errors. Each round shoots only what it changed.

| Round | Shots |
| :---- | :---- |
| R4, R5, R6 | The `/lab` shots of the round (`pnpm lab:shots r4`, and so on). Then live shots of the screens the round changed, only. R4: PROCESS (after R4.6) and S3. |
| R7a, R7b, R7c | Live shots of the screens of that role only, at the end of each sub-round |
| R7d | **The full live audit**, light and dark, all viewports. Every sitemap route exists by then, so a 404 or an error in a shot is a real finding. Compare with `ui-shots/r2-live/`. |
| R8 | One last full live audit, after the old components are removed |

- Take every live shot on the production build (`pnpm build`, `pnpm start -p 3100`, `LAB_PORT=3100`), not the dev server. The dev server shows its own error screens and reloads on each file change.
- Change no files during a run.
- A shot that passes in Playwright only means the picture was saved. Read `manifest.jsonl` (HTTP status, console errors) before you write a result.

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

- [x] Write the test. Run it. Expected: FAIL.
- [x] Build the layout, the index and the lint rule. Run `pnpm test tests/unit/lab-guard.test.ts && pnpm lint`. Expected: PASS.
- [x] Add `ui-shots/` to `.gitignore`. (Done in Task 2.2.)

**As built (25 Nov 2026):** `src/app/lab/layout.tsx` (guard, header, lab-only theme switch), `src/app/lab/page.tsx` (index), `src/app/lab/_mock/pages.ts` (page list and gate states), `src/app/lab/_mock/theme-switch.tsx` (sets the `dark` class for the tab only, until `theme-toggle` in R1.2). `tests/unit/lab-guard.test.ts` also checks the lint rule with the ESLint API. `tests/e2e/lab.spec.ts` checks the 404 in the production build. `pnpm lab:shots lab` (with `LAB_PORT=3000`) took 11 shots. The Next dev indicator shows in dev shots.

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

- [x] Write the tests. Run `pnpm test tests/unit/components/tokens.test.ts tests/unit/components/contrast.test.ts`. Expected: FAIL.
- [x] Write `tokens.css` and the `.dark` set (§8.1). Run the tests and `pnpm build`. Expected: PASS. **As built:** the light look is pixel-identical (LOGIN compared with the audit shot). Added tokens: `--link` (links in dark need `maroon-300`: the primary maroon is about 2.5:1 on the dark ground), `--text-secondary`, `--divider-strong`, `--radius-card` (with `--radius-panel` kept as an alias until R8). The light set also answers to `.light`, so the `/lab` side-by-side panels work in a dark page.

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

- [x] Write the tests. Run them. Expected: FAIL. Build it. Run them. Expected: PASS. (The test and the code were written in one step; the test was not seen failing first.)
- [x] In R1, `/lab` shows the toggle. **As built:** a 3-option radio group, state in `useSyncExternalStore` (server snapshot "system"). `layout.tsx` gets `THEME_SCRIPT` only in R1.5, so no live page turns dark before the gate. The toggle moves into the live top bar in Task R1.4 (Integrate).

### Task R1.3: glyph set (old Task 2)

**Files:** create `src/components/patterns/glyphs/index.tsx`. Test: `tests/unit/components/glyphs.test.ts`.
**Interfaces:** `type GlyphName = "scan" | "verify" | "flag" | "return" | "seat" | "calendar" | "defense" | "gate" | "commit" | "clear" | "template" | "overview" | "student" | "users" | "audit" | "export" | "search" | "bell" | "done" | "todo" | "lock" | "received"`; `Glyph(props: { name: GlyphName; size?: 16 | 20 | 30; label?: string; className?: string })`. Without `label`: `aria-hidden="true"`. With it: `role="img"` and `aria-label`.

- [x] Test: each name has `viewBox="0 0 24 24"`, `stroke-width="1.5"`, round caps and joins, `stroke="currentColor"`, no `fill` except on the `.tone` element. Size 30 gives `width="30"`. Run it. Expected: FAIL.
- [x] Copy the path data from the `<symbol>` elements in `design/mockups/coordinator-mockups.html`. Map `g-mismatch` → `flag` and `g-def-a` → `defense`. The `.tone` element gets `fill="currentColor"` and `fill-opacity: var(--glyph-tone-opacity)`. Glyphs use `currentColor`, so they work in both themes. Run the test. Expected: PASS.

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

- [x] Tests: Docket shows "Step 2 of 4", the blocker line, one primary action, and the process link only when asked. IdentityLine has a serif title and "Master's" or "Doctoral". Flag in compact mode keeps the text for screen readers. EmptyState has no image. `return` variant has no solid fill. Run them. Expected: FAIL.
- [x] Build each pattern. First line `// Source: …` (the §7.4 Source column). Tokens and glyphs only. Pills keep the Lucide icons until R2 decides D-06 (`// D-06 open`).
- [x] Add each pattern's `/lab` page. Run `pnpm lab:shots r1`. **As built:** the patterns are new code. The old components are not changed and not yet re-exports, so no live page changes before the gate; R1.5 makes the old paths re-export. Also in R1.4: the label map for codes (`formLabel`, `gateLabel`, `gateResultLabel`, UX-016), `src/lib/date.ts` (`Tue 12 Jan 2027, 09:00 PHT`, UX-021), the blocked primary look (UX-008), the stamp width (UX-015), `IdentityLine` with the Student name for other roles (UX-030). The pattern pages are static folders, because the dev server failed on the dynamic route `/lab/patterns/[name]` (UX-037).

### Task R1.6: brand alignment (UX-D-10, UX-D-11: decided 26 Nov 2026)

- [x] Update `tokens.css` to the decided palette (gold, ramps, neutrals, status colors) and build the dark set from the brand colors. Run `contrast.test.ts`. **As built:** in `/lab` only, as `src/app/lab/_mock/brand-preview.css` under `.r1-preview` (test: `brand-tokens.test.ts`, light and dark contrast). R1.5 copies the values into `tokens.css`. New tokens in both files: `--progress` (the gold current step), `--wordmark` (maroon on light, white on dark).
- [x] Apply the decided font families and screen type scale (`layout.tsx` in R1.5, the `/lab` preview first). **As built:** the lab wrapper maps `font-serif` to Poppins, `font-sans` to Inter, `font-mono` to JetBrains Mono. `/lab/typography` shows set E (approved) next to A to D. Captions in the patterns use 0.8 rem (12.8 px).
- [x] Apply the decided icon stroke and fill rule to the glyph generator and its test. 1.75 px, outline only; the 20 tone shapes are removed. Status pill icons use 1.75 px too. `--glyph-tone-opacity` is unused now: remove it in R1.5.
- [x] Add a `brand-mark` pattern that shows the official artwork only (full logo, symbol, text wordmark) from `public/brand/`. It needs the master files (UX-X-19). No redraw, no recolor. **As built:** with no artwork, `full` shows the text treatment (the plain name in one weight, not the two-weight logo wordmark), and `symbol` shows nothing visible (a screen-reader name only).
- [x] `/lab/brand`: the logo treatments for LOGIN and the four role shells, light and dark, with the clear space and the 140 px rule.
- [x] Show the revised preview in UX-P-01 before R1.5. Stepper: completed maroon, current gold (`--progress`). Radius 6, 8, 12; soft maroon focus ring (preview CSS).

### Gate R1 → `UX-P-01`

Show the owner the R1 pages and shots (§4.2). Ask for: the dark values, the toggle form (menu or 3 options), the `@axe-core/playwright` proposal.

### Task R1.5: integrate R1 (approved 26 Nov 2026, UX-P-01)

**Do this first in the next session. R2 builds on it.** R1 is approved (`DESIGN_DECISIONS.md` UX-P-01). The approved values live in the `/lab` preview today; this task moves them into the live app. Work on a new branch `ui/r1-integrate` from `feat/design-system-inventory` (commit `c7b7a71`), unless the owner names another base.

**What the approval covers:** the preview at commits `6c5c9b5` and `c7b7a71`. Brand tokens: `src/app/lab/_mock/brand-preview.css` (UX-D-11). Fonts Poppins, Inter, JetBrains Mono. Glyphs 1.75 px outline. Patterns in `src/components/patterns/`. Squish theme switch (UX-D-13). Brand mark with text fallback.

**Tokens and fonts:**

- [x] `src/styles/tokens.css`: replace the `@theme` ramps (maroon, gold, neutral) and the `:root, .light` and `.dark` blocks with the values of `src/app/lab/_mock/brand-preview.css`. Keep the token names. The maroon and gold ramps now use the brand step names (maroon 500 = `#800000`, gold 500 = `#F4B41A`); `--primary` is `var(--color-maroon-500)`. Radii: `--radius-control: 6px`, `--radius-card: 8px`, `--radius-panel: 12px`, `--radius: 6px`. Move the soft focus ring rule (`:focus-visible` box shadow) into `globals.css` `@layer base`. Remove `--glyph-tone-opacity` (unused since R1.6).
- [x] Update `tests/unit/components/tokens.test.ts` to the brand values (it still expects `--color-maroon-600: #800000`, `--color-gold-400: #F4C430`, `--tone-returned-fg: #B3261E`). Then delete `brand-preview.css`, its import in `src/app/lab/layout.tsx` and the `r1-preview` class, and point `tests/unit/components/brand-tokens.test.ts` at `tokens.css` (or merge it into `tokens.test.ts` and `contrast.test.ts`).
- [x] `src/app/layout.tsx`: load Poppins (500, 600, 700), Inter (400, 500, 600) and JetBrains Mono (400, 500, 600) with `next/font/google`. Rename the font variables to `--font-display`, `--font-text`, `--font-data`, and map them in `globals.css` `@theme inline`: `--font-serif` (titles) to Poppins, `--font-sans` to Inter, `--font-mono` to JetBrains Mono. Remove Source Serif 4 and IBM Plex. Delete the `BRAND_FONTS` override in `src/app/lab/layout.tsx`. `/lab/typography` keeps its comparison fonts in `_mock/fonts.ts` (sets A to D load their own).
- [x] `src/app/layout.tsx`: `<html suppressHydrationWarning>` and `<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />` as the first child of `<head>` (`src/lib/theme.ts`).

**Live components (no screen redesign, that is R7):**

- [x] Put `ThemeToggle` (compact) in the top bar of `src/components/app-shell.tsx`, before the bell, and on `/login`.
- [x] Wordmark: `src/components/app-shell.tsx:45` shows "PUP CpE Thesis Progress". Replace it with `<BrandMark variant="text" />` (UX-D-11 item 6: "ThesIsko"). LOGIN gets `<BrandMark variant="full" descriptor />` (text fallback until the artwork arrives).
- [x] Re-exports at the old paths, only where the props are the same: `src/components/status/*` (pill, stamp, chip: same props) and `src/components/empty-state.tsx` (`detail` maps to `body`: keep a thin adapter). Do **not** re-export `ActionButton` (9 files, prop `blockedReason`), `Docket` (3 files, different props), `MilestoneStepper` (2 files, different props) or `FlagBanner` (8 files): R7 moves those screens. Record each in the `UX-P-07` notes.
- [x] Old `src/components/milestone-stepper.tsx` uses gold for completed steps. Change its classes to the approved look (completed `bg-primary`, current `bg-progress` with `border-primary`) so the live stepper matches UX-D-11 now. Its test (`tests/unit/components/stepper.test.ts`) changes with it.
- [x] UX-002: one focus rule for native `input`, `select`, `textarea`, `summary`: `focus-visible` 2 px solid `--ring`, 2 px offset, plus the soft ring. UX-003: `src/app/(auth)/login/login-form.tsx:18`, `:27`, `:49` use `border-input`.
- [x] Raw palette classes outside `/lab` (`bg-neutral-100`, `hover:bg-neutral-100`, `text-maroon-600`, `border-neutral-300` and others, about 14): change each to the semantic token when it is one class (`bg-muted`, `text-primary`, `border-divider-strong`). List any larger case for R7.
- [x] `rounded-panel` (5 files outside `/lab`) is now 12 px. Popovers and cards in the shell should be `rounded-card` (8 px). Change them.
- [x] PDF canvas: `src/components/pdf-viewer.tsx` keeps a white page in dark. Add `bg-white` on the page wrapper only (an allowed exception, UX-D-01: "the PDF page stays light"). Check with the P2 demo commit (it shows the in-place error, so check with an uploaded test PDF or the S2 flow if available).

**Documents:**

- [x] `DESIGN.md` v0.4: `git mv DESIGN.md docs/stale/DESIGN_v0.3.md`, copy, then edit (AGENTS.md §4, no overwrite). Changes: §1 plan box and §1.1 (brand guide is the identity source, UX-D-10); §2 F1 narrowed to the PUP logo and seal, the ThesIsko mark allowed, Novie exception (UX-D-11 items 6, 7); G8 (gold = achieved and the current step); §3 palette and §12 tokens to the brand values; §4 fonts and the type scale (16 base, 1.25 ratio, 12.8 caption floor, 14 px table text); §6.1 radii 6, 8, 12 and the motion note (UX-D-12, UX-D-13); §6.2 glyphs 1.75 px outline only; §7.3 the theme switch (squish switch, "Use system"); §7.4 registry adds `brand-mark`; §8.2 stepper; §10 focus (outline plus soft ring); §11 emails use the horizontal logo; §12.5 the dark set; §14 D-04 closed. Update the `AGENTS.md` §6 row to "Draft v0.4" (the owner asked for that row in UX-D-05).

**Validate (§4.5):**

- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` (full), `pnpm build`, `pnpm test:e2e` (production build; see §9.0 for the port).
- [x] New e2e test (`tests/e2e/theme.spec.ts`): `/login` with `colorScheme: "dark"` gets `html.dark`; a stored `"light"` choice wins over a dark OS; the switch has the name "Dark theme".
- [x] `LAB_LIVE=1 pnpm lab:shots audit` in light and dark (§9.0). Compare with `ui-shots/audit/`. Every screen must render in dark with readable text. List problems for R7.

**As built (26 Nov 2026, branch `ui/r1-integrate`, not committed):**

| Item | Result |
| :---- | :---- |
| Tokens | `tokens.css` holds the brand ramps, the light set and the dark set of UX-P-01. The dark set also gets `--chart-*` values (the preview had none). `--glyph-stroke` is 1.75. `brand-preview.css` and `brand-tokens.test.ts` are deleted; `tokens.test.ts` checks the brand values, `contrast.test.ts` checks both sets. |
| Fonts | `layout.tsx` loads Poppins, Inter and JetBrains Mono as `--font-display`, `--font-text`, `--font-data`. `/lab/typography` sets those three variables for each comparison set. |
| Focus | `globals.css`: the soft ring on every `:focus-visible`, and a 2 px `--ring` outline with a 2 px offset on native `input`, `select`, `textarea`, `summary` (UX-002). The base outline color is now `outline-ring` (was `outline-ring/50`). |
| Shell and LOGIN | `BrandMark variant="text"` in the top bar, `ThemeToggle compact` before the bell. LOGIN: `BrandMark variant="full" descriptor`, the switch at the top right, `border-input` on the 3 inputs (UX-003). The page title stays "PUP CpE Thesis Progress" (an e2e test checks it; R7d decides). |
| Re-exports | `src/components/status/{status-pill,document-stamp,outside-chip,tone-icon}.tsx` re-export the pattern. `src/components/empty-state.tsx` is a thin adapter (`detail` → `body`). Not re-exported (R7, see UX-P-07): `ActionButton` (9 files, `blockedReason`), `Docket` (3 files), `MilestoneStepper` (2 files), `FlagBanner` (8 files). |
| Label fix | The call sites pass `"TDW 07"` to `DocumentStamp`. The pattern's `formLabel` gave "Tdw 07". `formLabel` now keeps "TDW nn" with a space or an underscore (test added). |
| Stepper | Old `milestone-stepper.tsx`: completed `bg-primary`, current `bg-progress` with `border-primary`, lines `bg-divider-strong` (test added). |
| Classes | Raw palette classes outside `/lab`: 5 were left (the others were in the old status, stepper and empty-state code). `hover:bg-neutral-200` → `hover:bg-border` (sidebar), `hover:bg-neutral-100` → `hover:bg-muted` (2), `bg-neutral-100` → `bg-muted` (sidebar). The `Button` primary keeps `hover:bg-maroon-700`, `active:bg-maroon-800` and `focus-visible:outline-gold-400` (brand hover, no token yet: R8). `text-primary` on 12 text links and 1 icon → `text-link` (same color in light; `--primary` text is about 3:1 in dark). `rounded-panel` → `rounded-card` in 5 files. |
| PDF | `Page` gets `className="w-fit bg-white"`. Not checked with a real PDF: the P2 demo commit shows the in-place error. |
| Screenshot tool | New optional `LAB_OUT` (output folder), so a before and after pair does not overwrite `ui-shots/audit/`. |

**Commit (when told):** `feat: integrate R1: brand tokens light and dark, brand fonts, theme script and switch, brand mark, focus and border fixes (UX-P-01, UX-D-11, UX-D-13, UX-002, UX-003)`

---

## 9. Round R2: shell and system states

### 9.0 Brief for a new session

Read this before you start R2. It holds what the earlier sessions learned.

**State on 26 Nov 2026:** branch `feat/design-system-inventory`, last commit `c7b7a71`, not pushed. PR #81 (`feat/guided-ledger`) is still open, so work on top of this branch (§1). R1 is approved; R1.5 is not done yet (do it first). R2 has not started. No R2 decision is taken.

**Read first:** `AGENTS.md`; `docs/ui-ux-audit/DESIGN_DECISIONS.md` (UX-D-01 to UX-D-13, the UX-P-01 record); `DESIGN.md` (v0.4 after R1.5); `design/screens/README.md` (Sidebars table); `docs/ui-ux-audit/UI_UX_AUDIT.md` findings UX-006, UX-011, UX-026 to UX-029; the brand guide `docs/reference/brand/ThesIsko-Design-Principles-Brand-Guidelines.docx` (sections Icons, Shapes and Buttons, Sample Application: Web and Mobile). The docx holds images; extract text with a zip reader if needed.

**Environment facts (Windows, Git Bash):**

| Topic | Fact |
| :---- | :---- |
| Dev server | Only one `next dev` can run in this folder (Next 16). If port 3000 is busy, reuse it: `LAB_PORT=3000 pnpm lab:shots …`. |
| Stale dev cache | If `pnpm dev` serves old CSS or returns 500 with "Jest worker encountered 2 child process exceptions", stop it, `rm -rf .next/dev`, start again (UX-037). |
| Production check | `pnpm build && pnpm start -p 3100`, then `E2E_PORT=3100 pnpm test:e2e` (otherwise the e2e run reuses the dev server on 3000). Before a new `pnpm start`, delete `.next/server/route-cache` (old prerenders point to old chunks). |
| Stopping servers | Stopping a background `pnpm` task leaves the `next` child alive. Find it with `netstat -ano \| grep ":3100 "` and stop it with `taskkill //PID <pid> //F //T` (check the command line first with `wmic process where processid=<pid> get commandline`). |
| Live screenshots | `LAB_LIVE=1 LAB_PORT=3000 LAB_CORS_RELAY=1 LAB_MILESTONE_ID=3371ed7d-8833-49ac-bf2a-57dfd691d5c1 LAB_DEFENSE_ID=fb4a0ce9-4de2-4966-ba5a-a92608fd6fd0 pnpm lab:shots audit`. The ids are the demo Pre-Final milestone and its defense. Sessions come from `tests/e2e/auth.setup.ts` (needs `.env.local`). |
| Demo data | Do not run `pnpm db:seed-dev` (UX-X-06). The sign-ins `student@`, `adviser@`, `panel@example.test` are linked to the furthest fake thesis (Milestone 3 open). |
| Vitest and next/font | A unit test that imports a file using `next/font/google` must mock it (see `tests/unit/lab-guard.test.ts`). |
| Tailwind v4 focus | `outline-none` plus `focus-visible:outline-2` draws nothing. Always add `focus-visible:outline-solid` (`tests/unit/components/focus-ring.test.ts` checks it). |
| Lab panels | `ThemePanels` shows light and dark side by side with `.light` and `.dark` wrappers. Token blocks must name `.light` too, or the light panel falls back to old values. |
| Git | `git config` is denied by the permission settings; do not try it. Commit only when the owner says so (AGENTS.md §2). |
| Private data | One demo student account in the dev data has a real-looking name and a non-`example.test` email. Never put it in docs, tests or commit text. |

**Scope of R2 (presentation only):** the app shell and the sidebar, the top-bar panels, the toast, loading and error states, motion tokens, the status and sidebar glyphs. Routes, data contracts, access checks and server actions do not change. The only new data reads are the ones listed in Task R2.1 and approved at the gate.

**Preview:** `/lab/patterns/{app-shell,sidebar,toast,top-bar}`, `/lab/states`, `/lab/motion`, `/lab/glyphs` (new glyphs). Add each to `src/app/lab/_mock/pages.ts` and to `LAB_ROUNDS.r2` in `tests/lab/shots.spec.ts`. Pages are static folders (no dynamic `[name]` route in `/lab`, UX-037).

**Decision points for the owner at gate UX-P-02 (show 2 or 3 options each, with a recommendation):**

| ID | Decision | Recommendation to show |
| :---- | :---- | :---- |
| D-06 | Status pill glyphs: draw `active`, `pending`, `achieved` (today Lucide icons) | Draw them on the brand icon grid (24 px, 1.75 px, outline only). `achieved` must not be a star (F1). |
| D-07 | 10 sidebar glyphs: Thesis process, Manuscript, Schedule, Defense results, Submission, Advisees, Review queue, Consultations, Availability, Assignments | Draw them in the same style; reuse the brand guide icon sheet names where they match (Manuscript, Schedule, Committee). |
| D-08 | Top-bar panels: notifications, search, user menu with preferences | Notifications in a right side sheet (Base UI `drawer`), user menu as a Base UI `menu` with the email preferences in a side sheet, **no search** (no search feature exists; a route-only `/` palette is optional, show it as option B). |
| D-10 | Motion timings for state changes, overlays, drawer, toast | Option A: 120 ms state, 160 ms overlay, spring for the drawer; reduced motion: none. Align with UX-D-12 and UX-D-13 (springs on the theme switch). |
| R2-a | Sidebar look | Brand sample: white sidebar, active item with a maroon-50 fill, maroon text and a 3 px maroon left marker; locked items muted with a `lock` glyph. Option B: the v0.2 neutral-100 sidebar. |
| R2-b | "Submission" item for Adviser, Panel Member, Coordinator (many records, the route needs a milestone id) | Leave the item out of these sidebars and link SV from each queue and record row instead (no new route). Option B: keep it locked with "Open it from a record". For the Student, link the current milestone once Gate 1b is done. |
| R2-c | Content width (UX-006) | 1280 px (brand guide, Spacing and Layout), 24 px gutters; reading text keeps 72ch. |

### Task R2.1: app shell and sidebar (old Task 4)

**Files:** create `src/components/patterns/{app-shell,sidebar}/index.tsx` and `src/components/patterns/sidebar/nav.ts`. Modify later (Integrate only): `src/components/app-shell.tsx`, `src/components/nav-links.tsx`, `src/app/_components/role-shell.tsx`. Tests: `tests/unit/components/sidebar.test.ts`, `tests/unit/components/app-shell.test.ts`.

**Today:** `src/app/_components/role-shell.tsx:14` hard-codes 4 (Student), 3 (Adviser), 2 (Panel Member) and 8 (Coordinator) items; `design/screens/README.md` lists 8, 6, 5 and 11 (UX-027). Dashboards link a defense only while it is scheduled, and no page links to SV (UX-028).

**Interfaces:**
- `type NavItem = { label: string; href: string | null; glyph: GlyphName; lockedReason: string | null; count?: number }` (`href: null` only for a locked item with no target yet).
- `type NavFacts = { milestone: 1 | 2 | 3 | null; gate1bDone: boolean; sheetsVerified: boolean; defenseId: string | null; milestoneId: string | null; panelAccess: boolean; defenseStarted: boolean }`.
- `navFor(role: UserRole, facts: NavFacts): NavItem[]` (pure, in `nav.ts`, no data access).
- `Sidebar(props: { items: NavItem[]; activeHref: string; label: string })`, client component for the active state (`usePathname`).
- `AppShell(props: { brand: ReactNode; roleLabel: string; nav: ReactNode; topBar: ReactNode; children: ReactNode })`.

**Data facts (list them in the UX-P-02 block; no new data function):** the role shell computes `NavFacts` from functions that exist and check access: Student `studentTracker(ctx)` (`src/server/data/tracker.ts:91`), Adviser `adviserDashboard(ctx)` (`src/server/data/queues.ts:86`), Panel Member `panelDashboard(ctx)` (`queues.ts:218`). The Coordinator needs no facts (no locked items). If a fact is missing from these results, do not add a query: show the item open and record the gap.

**Locked reasons (word for word, SITEMAP §9 style; check `spec/SITEMAP.md` §9 first):** Clearance "Opens at Milestone 3." Submission "Opens at Gate 1b." Defense results "Opens when the Coordinator verifies the sheets." Defense Day "Opens at the scheduled start." Manuscript (Panel Member) "Opens when your appointment and NDA are recorded." Thesis process (R4) and Audit (R7d) have no route yet: leave these two items out of the sidebar until their routes exist, and note it in the UX-P-02 block.

- [x] Tests first: `navFor("student", facts)` gives the README items in order ("Thesis process" left out until R4); Clearance locked before Milestone 3 with its reason; Submission locked until `gate1bDone`, then `href` `/student/submission/<milestoneId>`; Defense results links `/student/defense/<defenseId>` once `sheetsVerified`. Adviser and Panel Member: per README and decision R2-b. A locked item: `aria-disabled="true"`, focusable (`tabIndex=0`, not a link), `lock` glyph, reason linked with `aria-describedby` and shown in a tooltip on hover and focus (Base UI `tooltip`). The active item has `aria-current="page"`. The shell's first focusable element is a skip link to `#main`, and `<main id="main">`.
- [x] Build per `DESIGN.md` v0.4 §5.1 and decision R2-a: 3 px maroon masthead rule, 56 px top bar (brand mark text treatment, role label, the D-08 controls, the theme switch, user menu), 240 px sidebar, content width per R2-c. Below 1024 px the sidebar is a Base UI `drawer` (focus trap, Escape closes, focus returns to the menu button). Brand rule: 20 px icons in navigation, label with each icon.
- [x] `/lab/patterns/app-shell` and `/lab/patterns/sidebar`: each role's sidebar with mock facts (first day, Milestone 3, after the defense), desktop and tablet (drawer open and closed), light and dark.

### Task R2.2: top-bar panels (D-08)

- [x] Build the options of D-08 in `/lab/patterns/top-bar`. Keep the behavior of today's panels: `NotificationPanel` (`src/components/notification-panel.tsx`, mark read and mark all read via `src/app/_lib/notification-actions.ts`) and `PreferencesForm` (`src/components/preferences-form.tsx`, `savePreferencesAction`). In `/lab`, pass mock actions as props (server action modules cannot be imported in `/lab`; the lint rule refuses them).
- [x] The unread count badge: 12.8 px minimum (UX-005: `text-[11px]` today).

### Task R2.3: toast

**Files:** `src/components/patterns/toast/index.tsx`. Test: `tests/unit/components/toast.test.ts`.
**Interfaces:** `ToastProvider` (root layout, Integrate only), `useToast(): { show(t: { label: string; tone: "done" | "returned" | "neutral"; glyph?: GlyphName }): void }`.

- [x] `@base-ui/react/toast` (installed, 1.9.0). 4 s timeout, `role="status"` (polite), glyph and label, tokens only, pause on hover and focus, motion per D-10 with a reduced-motion path.
- [x] Rule (UX-D-04): toast only for small confirmations (preferences saved, availability published, slot requested, file uploaded). A workflow result (Returned, Endorsed, Scheduled, Verified) stays on the screen.

### Task R2.4: one form-feedback contract (UX-011)

- [x] Today there are two `ActionForm` components: `src/app/_components/action-form.tsx` (silent success, error `role="alert"`) and `src/app/coordinator/_lib/form-parts.tsx` (ok line in a polite status). Design one contract: pending (button label and `aria-busy`, button stays focusable), success (toast for small actions, on-screen result for workflow actions), error (`role="alert"` under the form, linked to the field when the server names one). Show both cases in `/lab/states`. Integrate in R3 with the form-field pattern (UX-012); in R2 only the contract and the preview.

### Task R2.5: loading and error states (UX-026)

**Files:** `src/components/patterns/{loading,error}/index.tsx`. Modify (Integrate): `src/app/_components/page-loading.tsx` (re-export).

- [x] Loading: blocks of the content's size, no shimmer, `aria-busy="true"` on the region, hidden text "Loading".
- [x] Error: inline, names what failed and what to do, "Try again" calls `reset()`; no stack trace, no internal code. Add `error.tsx` to each role segment (`src/app/{student,adviser,panel,coordinator}/error.tsx`, client components) at Integrate, so a server error stays inside the shell. Test with a page that throws in `/lab/states`.
- [x] `/lab/states`: loading, error, empty, success toast, disabled with a reason, in both themes.

### Task R2.6: motion (D-10)

- [x] `/lab/motion`: 2 or 3 timing options side by side for a state change (pill, row), a dialog or side sheet, the drawer, the toast, with a reduced-motion switch. Entry animations of pages: none in every option. Show the theme switch springs (UX-D-13) next to them.
- [x] After the gate: `--motion-*` tokens in `tokens.css`, `DESIGN.md` §6.1. CSS transitions use the tokens; `motion/react` only where CSS cannot (springs, exit animations). The reduced-motion rule in `globals.css` stays.

### Task R2.7: glyphs (D-06, D-07)

- [x] Draw the candidate glyphs as SVG paths on the 24 px grid, 1.75 px stroke, round caps and joins, outline only (brand guide, Icons). No star, seal, laurel or torch (F1). Show 2 options for each concept in `/lab/glyphs`.
- [x] After the gate: add the approved names to `GlyphName` in `src/components/patterns/glyphs/index.tsx` and to `tests/unit/components/glyphs.test.ts` (it checks the exact name list). Replace the Lucide icons in the status pills (`// D-06 open` comment in `src/components/patterns/status/index.tsx`).

**Suggestion for later rounds (UX-D-15, UX-D-16, from UX-P-02 feedback):** each screen gets its own `loading.tsx` from the R2 shapes and presets. R3: the queue and inbox rows. R4: the task list and the Thesis process. R5: the manuscript workspace (PDF area, threads list). R6: forms and the Defense Day sheet. R7: compose the `loading.tsx` of each screen and check that no message, count or result moves the layout. Other loading motion to consider then: a thin route-change bar in the top bar, and a progress bar for file uploads.

### Gate R2 → `UX-P-02`

Show the owner (§4.2): the `/lab` links, `ui-shots/r2/` (all viewports, both themes), the decision table of §9.0 with options and recommendations, the data facts of Task R2.1, the screens that change at Integrate (all signed-in screens: the shell; the toast on small confirmations; `error.tsx` in each role segment). Stop and wait for explicit approval ("R2 approved"). Record it in `DESIGN_DECISIONS.md` (copy the UX-P-nn block).

### Task R2.8: integrate R2 (after the gate only)

- [x] Draw the approved glyphs (Task R2.7).
- [x] Put `AppShell` and `Sidebar` on the four role layouts through `role-shell.tsx`: compute `NavFacts` with the approved data calls; keep `RoleGate` as it is (access).
- [x] `ToastProvider` in `src/app/layout.tsx`; toast on the small confirmations that exist today.
- [x] `error.tsx` and the new loading blocks in each role segment.
- [x] Fix e2e selectors that used the old navigation (`tests/e2e/portals.spec.ts`).
- [x] Validate (§4.5): lint, typecheck, full test, build, e2e on the production build, `LAB_LIVE=1` audit shots in light and dark, keyboard walk of the shell (skip link, sidebar, drawer, menus, Escape and focus return), reduced motion.
- [x] Update `DESIGN.md` (new version) for D-06, D-07, D-08, D-10 and the sidebar decisions; close them in §14.

**As built (26 Nov 2026, branch `ui/r2-shell`, not committed):**

| Item | Result |
| :---- | :---- |
| Shell | `role-shell.tsx` renders the `AppShell` pattern with `LiveSidebar` and `ShellTopBar` (`src/app/_components/shell-top-bar.tsx`). `RoleGate` is unchanged. The old `src/components/app-shell.tsx` and `nav-links.tsx` are not used any more (R8 removes them). |
| Sidebar facts | `src/app/_lib/nav-facts.ts` (pure, tested): Student `studentTracker` + `submissionFor`, `sheetsVerified` from the status (CLOSED or later); Adviser `adviserDashboard`; Panel Member `panelDashboard`. A failed read gives the items with no facts; the shell never breaks. |
| Page markup | The 22 role pages that rendered their own `<main>` render a `<div>` now (one main landmark, in the shell). Their padding and the 1200 px limit moved to the shell (1280 px, R2-c). The 960 px reading widths stay. A1 has `id="queue"` for the "Review queue" item. |
| Toast | `ToastProvider` in the root layout. `useToast` outside a provider is a no-op. `ActionForm` takes `successToast`: "Slot requested.", "Topic saved.", "Availability published.", and the shell shows "Preferences saved.". File uploads use other components: no toast yet (R3). |
| States | `error.tsx` in the 4 role folders (`SegmentError`). Each `loading.tsx` uses a page preset (dashboard, record, form, queue). |
| Glyphs | The pills use the domain glyphs (D-06). The sidebar uses the D-07 glyphs. |
| e2e | No old selector broke. New `tests/e2e/shell.spec.ts` (skip link, current page, locked reasons, Escape and focus return for the sheet and the drawer). |

**Commit (when told):** `feat: app shell and sidebar with locked items, top-bar panels, toast, loading and error states, motion tokens (DESIGN.md §5.1, BR-18, UX-D-04, UX-027 to UX-029)`

---

## 10. Rounds R3 to R6: patterns

Each round: build the patterns with tests, add `/lab` pages, take the shots, pass the gate, then integrate only the re-exports. The live screens change in R7. Exception: a round can move a shared component onto its pattern at Integrate when the gate approves it (R3: the two `ActionForm` components, decision R3-h for the confirm dialog).

### 10.0 Brief for R3 (new session)

Read this before you start R3. It holds what the R1 and R2 sessions learned.

**State on 26 Nov 2026:** branch `ui/r2-shell`, last commit `ad2c760` (R2), on top of `9d663dd` (R1.5). Nothing is pushed. R1 (UX-P-01) and R2 (UX-P-02) are approved, integrated and committed. `DESIGN.md` is v0.5. PR #81 (`feat/guided-ledger`) was still open: check it first (§1 step 2).

**Branch:** make `ui/r3-patterns` from `ui/r2-shell`. Commit only when the owner says so (AGENTS.md §2).

**Read first, in this order:**

1. `AGENTS.md` (§2, §5, §7, §8, §9).
2. `docs/ui-ux-audit/DESIGN_DECISIONS.md`: UX-D-01 to UX-D-16, the UX-P-02 record (it holds the owner's words and the "keep both" rule of UX-D-16).
3. `DESIGN.md` v0.5: §2 (Guided Ledger), §5.4 (densities), §5.6 (breakpoints), §8.4 (reserved message space, fixed slots), §8.9 (dialogs, Return composer), §10 (accessibility, forms), §7.4 (registry rows `queue-table`, `kpi-strip`, `inbox`, `side-sheet`, `return-composer`, `dialog`).
4. `design/screens/C1.md`, `C2.md`, `C3.md`, `C4.md`, `C5.md` (the main users of these patterns), `A1.md`, `P1.md`. The visual reference for C1 and C4: `design/mockups/coordinator-mockups.html` v5.
5. `docs/ui-ux-audit/UI_UX_AUDIT.md` findings UX-010, UX-011, UX-012, UX-013, UX-014, UX-033, UX-034, UX-036.
6. This section and the R3 task list below.

**What R1 and R2 built that R3 uses (do not rebuild):**

| Part | Where | Use in R3 |
| :---- | :---- | :---- |
| Tokens, light and dark, motion tokens | `src/styles/tokens.css` (`--row-h-*`, `--cell-pad-x`, `--row-action-w/h`, `--kpi-*`, `--motion-*`, `--ease-drawer`) | Tables, KPI strip, dialog and sheet motion |
| Glyphs (35) | `src/components/patterns/glyphs` | Row glyphs, KPI glyphs (30 px), dialog glyphs |
| Status pill, stamp, labels | `src/components/patterns/status` (`formLabel`, `gateLabel`) | Table cells; no codes in the UI (UX-016) |
| `BlockedAction` | `src/components/patterns/blocked-action` | Row actions with a reason (compact size = 132 × 32 px) |
| `FormFeedback`, `PendingButton` | `src/components/patterns/form-feedback` | The one feedback contract (R3.7) |
| `LoadingBlocks` (`rows` shape), `PageLoadingBlocks` | `src/components/patterns/loading` | Queue and table loading |
| `useToast` | `src/components/patterns/toast` (provider in the root layout) | Small confirmations only (UX-D-04) |
| Base UI drawer, menu, tooltip, dialog | `@base-ui/react` 1.9.0 (installed) | Side sheet (drawer), dialog, cell tooltip |
| Side-sheet look | `SheetPopup` in `src/components/patterns/top-bar/index.tsx` | Move it into the new `side-sheet` pattern and import it back in `top-bar` |

**Environment facts (Windows, Git Bash). They add to §9.0:**

| Topic | Fact |
| :---- | :---- |
| Dev server | The owner's `next dev` runs on port 3000 for this folder. Reuse it: `LAB_PORT=3000 pnpm lab:shots r3`. Do not start a second dev server. |
| Production check | `pnpm build`, delete `.next/server/route-cache`, `pnpm start -p 3100`, then `E2E_PORT=3100 pnpm test:e2e`. Stop the server with `taskkill //PID <pid> //F //T` (find it with `netstat -ano \| grep ":3100 "`). The "failed" notice after you stop it is expected. |
| Load | Do not run the full unit suite while `lab:shots` or a build runs. In R2 that gave 4 data-layer timeouts at about 11 s. Run the suite alone. |
| `cacheComponents` | A `/lab` page that reads `searchParams` must read it inside `<Suspense>`, or the dev server logs "runtime data during prerendering" on every shot. |
| Busy regions | `lab:shots` waits up to 20 s for `[aria-busy="true"]` to go. A page with loading demos is slow to shoot; that is expected. |
| Server and client | A server `/lab` page must not import plain data from a `"use client"` module (it becomes a client reference). Put mock data in a plain `.ts` file (see `src/app/lab/_mock/shell-facts.ts`). Functions as props go only from a client component. |
| Regex in Python heredocs | A Python string turns `\b` into a backspace character. Write test files with the Write tool, or use raw strings, and check with `grep -nP '\x08'`. |
| Focused shots | For one demo region, use a small Playwright script with `locator.screenshot()` (the R2 one: `chromium` from `createRequire(process.cwd() + "/package.json")("@playwright/test")`). |
| Private data | One demo student account has a real-looking name and a non-`example.test` email. It appears in live C1 and C2 shots. Never put it in docs, tests or commit text. Scan staged lines for emails before a commit. |

**Rules that bind every R3 pattern:**

- UX-D-16: every message, result, count or reason has a fixed slot; a long text is clamped on the screen with the full text in the DOM; write one fact in 25 words or fewer.
- UX-D-04: a toast confirms a small action only. Verify, Return, Endorse, Close and other workflow results stay on the screen.
- G1 and G8: one maroon button in each region. No solid red button (F3). Return is a tinted or outline button.
- BR-18: a blocked action uses `aria-disabled` and shows its reason (`BlockedAction`).
- BR-17: a flag never blocks and never looks like a block.
- Both themes, WCAG 2.2 AA, `focus-visible:outline-solid` on every custom focus style, 44 px targets on tablet.
- Tokens only. No raw palette class (`bg-neutral-…`, `text-maroon-…`) and no hex outside `tokens.css`.
- Mock data only in `/lab`. Change no live page before the gate, except as R3.10 lists.

**Data:** R3 adds no data function and no data call. Facts for R7, so the gate can see them now:

| Need | Existing source | Gap |
| :---- | :---- | :---- |
| C1 KPI count | `coordinatorOverview(ctx).kpis[].count` | None |
| C1 KPI oldest age | `coordinatorOverview(ctx).queue[]` grouped by `kind`, max `daysWaiting` | None (computed in the page) |
| C1 KPI "late" | none | The threshold is decision R3-a |
| C4 scan inbox (all Students) | `coordinatorOverview(ctx).queue` items with `kind: "review_documents"`, then `deliverables(ctx, milestoneId)` for each milestone | One call for each milestone with waiting scans. If that is too slow, R7d proposes one list function for the owner's approval. |

**Decision points for the owner at gate UX-P-03 (show 2 or 3 options each, with a recommendation):**

| ID | Decision | Recommendation to show |
| :---- | :---- | :---- |
| R3-a | When an age is "late" (amber) in the KPI strip and the inbox | A: one value, 5 days. B: a value for each queue kind (scans 3 d, dates 5 d, committees 7 d). C: no late style until the owner sets the targets (AGENTS.md §4: success targets are the owner's). Recommend C for now, with A as the switch-on value. |
| R3-b | Tables on a phone (UX-036, `DESIGN.md` §5.6) | A: stacked rows (label and value pairs, the action last). B: horizontal scroll in a framed region. Recommend A. |
| R3-c | A long title in a compact row | A: one line, full text in a tooltip and on focus (`DESIGN.md` plan). B: two-line clamp. Recommend A, with the full text in the DOM (UX-D-16). |
| R3-d | Side-sheet width | A: 400 px. B: 480 px. C: 560 px. Full width below 640 px in all. Recommend B for C2, C3, C8, C9 forms. |
| R3-e | Confirm-dialog copy and button for permanent actions (UX-010) | A: a maroon confirm button named with the verb ("Verify", "Endorse"), then "Cancel"; focus starts on "Cancel". B: the same buttons; focus starts on the confirm button. Recommend A: a permanent action (BR-19) needs one more deliberate step. |
| R3-f | Row action look | A: compact outline button, maroon only for the one primary row action of the screen. B: a text link. Recommend A (equal widths, UX-014). |
| R3-g | Dark backdrop for dialogs and sheets (R2 known limit) | A: a new `--scrim` token (`rgb(15 23 42 / 0.45)` light, `rgb(2 6 23 / 0.6)` dark). B: keep `bg-foreground/30`. Recommend A. |
| R3-i | A blocked row action in a compact 48 px row (found in the preview) | A: a `lock` glyph in the button, `aria-disabled`, the reason linked with `aria-describedby` and shown in a tooltip on hover and focus (`DESIGN.md` §8.5 compact rule). B: the row grows to show the reason under the button. Recommend A (UX-D-16: fixed row height). |
| R3-h | Wire `ConfirmDialog` to the live permanent actions at R3 Integrate | A: yes, at R3.10 (UX-010 is High: Endorse, Gate 2, Record verdict, Verify, "Scan matches", Close the stage run on one click today). B: wait for R5 (gate box) and R7. Recommend A: the call sites keep their server actions; only a dialog step is added. |

**Gate UX-P-03 message (§4.2):** the `/lab` links, `ui-shots/r3/`, the decision table above with options and a recommendation each, the data facts table, the screens that change at Integrate, known limits. Stop and wait for "R3 approved".


| Pattern | Interface | Tests that must fail first |
| :---- | :---- | :---- |
| `queue-table` | `QueueTable<Row>(props: { columns: { key; label; width?; render? }[]; rows: Row[]; density: "compact" \| "comfortable"; groupBy?; action?: (r) => { label; href?; onClick?; reason? }; empty: ReactNode; sort?: { key; dir } })` | Compact uses `table-layout: fixed` and `--row-h-compact`. Every row action has the same width (`--row-action-w`). A 200-character title is one line, and the full text is in a tooltip and on focus. `empty` shows when there are no rows. Sortable headers have `aria-sort`. |
| `kpi-strip` | `KpiStrip(props: { items: { label; count; oldestDays; late; glyph; href; selected? }[] })` | The count uses `--kpi-num-size`. The age shows as "6d", with the late style when `late`. A count of 0 is muted. |
| `inbox` | `Inbox(props: { list; viewer; record })` | 300 px / flexible / 300 px at laptop. Below 1024 px the record moves under the viewer. |
| `return-composer` | `ReturnComposer(props: { onSend(reason); onCancel(); placeholder })` | Label "Reason for return". "Send return" has `aria-disabled` and "Write a reason first" while the field is empty or only spaces. No preset reasons. |
| `dialog` | `ConfirmDialog(props: { title; body; confirmLabel; onConfirm; open; onOpenChange })` | `role="dialog"`, title, body, the confirm button and "Cancel". Focus moves in, Escape closes, focus returns to the opener. Verify copy: "Verify {form} for {Student}?" and "This locks the document." |
| `side-sheet` | `SideSheet(props: { title; open; onOpenChange; children; footer })` | Opens from the right, focus trap, Escape closes. Full width below 640 px. Forms follow Stripe: label above the field, helper text under it, the error under the field and linked with `aria-describedby`. |

Use Base UI `dialog` for `dialog` and Base UI `drawer` for `side-sheet` (the R2 sheets use the drawer; keep one look). Visual reference for C1 and C4: `design/mockups/coordinator-mockups.html` v5.

**R3 tasks.** Tests first for each pattern (the table above lists the tests that must fail first). Each pattern: `src/components/patterns/<name>/index.tsx`, first line `// Source: <reference>`, a typed props contract, tokens and glyphs only, a `/lab/patterns/<name>` page with every state in light and dark, and a row in `src/app/lab/_mock/pages.ts` and in `LAB_ROUNDS.r3` of `tests/lab/shots.spec.ts`.

- [x] **R3.1 `queue-table`.** Real `<table>` markup, `th scope="col"`, sentence-case headers (UX-014), `aria-sort` on sortable headers (sort is a prop: the page sorts, the pattern shows). Densities: compact 48 px with `table-layout: fixed`, comfortable 56 px. Equal row actions (`--row-action-w`) with `BlockedAction` for a blocked row. Long text per R3-c. Phone per R3-b. `empty` slot; loading uses `LoadingBlocks shape="rows"`. Group headers (`groupBy`) as `<tbody>` with a row header. Move the two copies of `th` and `td` (`src/app/_components/dash.tsx`, `src/app/coordinator/_lib/page-header.tsx`) only at R7; leave them now.
- [x] **R3.2 `kpi-strip`.** C1: six cells (All waiting, Check scans, Confirm dates, Appoint committees, Close defenses, Check clearance). The count in `--kpi-num-size` mono, the age "6d" beside it, the 30 px glyph top right, the label below. A cell is a link that filters the queue (`aria-current` on the selected one). A count of 0 is muted. Late style per R3-a. Fixed cell height (UX-D-16): a 3-digit count does not move the strip.
- [x] **R3.3 `inbox`.** Three regions: list 300 px, viewer flexible, record 300 px at laptop; below 1024 px the record goes under the viewer. The list is a `listbox`-like list of links (one per scan, oldest first) with the stamp, the Student, the age and the milestone. The viewer slot takes the existing `PdfViewer` in `/lab` with a mock file or a placeholder (no storage call in `/lab`). The record shows the 2-step state bar and the two actions (Verify maroon, Return outline). First day text from `C4.md`.
- [x] **R3.4 `return-composer`.** Label "Reason for return". One placeholder example. "Send return" is a `BlockedAction` with "Write a reason first" while the text is empty or only spaces. "Cancel" returns focus to the Return button. No preset reasons. The result after sending stays on the screen ("Returned to <Student>", the reason in quotes, the time). The error slot is a `FormFeedback`.
- [x] **R3.5 `dialog` (`ConfirmDialog`).** Base UI dialog: `role="dialog"`, title, one-sentence body, confirm and Cancel, focus per R3-e, Escape closes, focus returns to the opener. While the action runs, the confirm button is a `PendingButton`; an error shows in a `FormFeedback` inside the dialog and the dialog stays open. Copy: "Verify {form} for {Student}?" / "This locks the document." and the same shape for Endorse, Gate 2, Record verdict, "Scan matches", Close the stage. No red fill (F3).
- [x] **R3.6 `side-sheet`.** Move `SheetPopup` out of `top-bar` into this pattern with `title`, `open`, `onOpenChange`, `children`, `footer` (sticky footer with the one primary action). Width per R3-d, full width below 640 px. Scrim per R3-g. `top-bar` imports it back (no visual change there).
- [x] **R3.7 `form-field` and one form-feedback contract (UX-011, UX-012, UX-013).** `FormField({ label, hint?, error?, children })` gives ids and wires `aria-describedby` (hint and error) and `aria-invalid` on the control; the error slot under the field is fixed height (UX-D-16). One control class set (`inputClass`, `fieldClass` and the LOGIN classes become one) for input, select and textarea, 44 px high on tablet. In `/lab/states` and `/lab/patterns/form-field`: a side-sheet form with a hint, a field error from the server, a small-action toast and a workflow result. The owner decides at the gate if `form-field` joins the registry (§6.1 row R3).
- [x] **R3.8 loading by screen (UX-D-15 suggestion).** Add the queue and inbox shapes to `loading` if R3.1 and R3.3 need them (for example an inbox preset: list, viewer block, record). The pulse is the approved effect.
- [x] **R3.9 preview.** `pnpm lab:shots r3` (all viewports, light and dark, the reduced pass). Keyboard walk in `/lab`: table sort headers, row actions, KPI links, the inbox list, the dialog (Escape, focus return), the sheet (focus trap, Escape, focus return), the composer. Then the gate message (§10.0). Stop.
- [x] **R3.10 integrate (after "R3 approved" only). R3 is approved (UX-P-03, 26 Nov 2026). Read the brief in §10.1 first; it replaces the list below where they differ.** Built 26 Nov 2026, not committed: §10.2.
  - Re-export the new patterns where an old component has the same props (none expected; list what you leave).
  - Move both `ActionForm` components (`src/app/_components/action-form.tsx`, `src/app/coordinator/_lib/form-parts.tsx`) onto `FormFeedback`, `PendingButton` and `form-field`. Keep each call site's server action, props and reset behavior. Error: `role="alert"` under the form, linked to the field when the server names one. Success: `successToast` for small actions; the on-screen result for workflow actions (UX-D-04). Before the change, list each prop, callback, state, validation, accessibility, server-facing behavior, loading and error behavior and the call sites (§4.4).
  - If R3-h is A: wrap each permanent action in `ConfirmDialog` (Endorse in `src/app/_components/workspace-controls.tsx`, Gate 2, Record verdict in `src/app/_components/defense-day.tsx`, Verify on C4 (Return uses the composer, not a dialog), "Scan matches" and Close the stage on C6). The server actions and their access checks do not change.
  - The `--scrim` token (R3-g) in `tokens.css` and its use in the R2 drawer and sheets.
  - The file-upload components get the "File uploaded." toast (R2 known limit), if they are small confirmations at that point.
  - Fix any e2e selector the change breaks. Add e2e: one permanent action opens the dialog, Escape cancels it, and nothing is recorded.
  - Validate (§4.5): lint, typecheck, the full unit suite alone, build, e2e on the production build, `LAB_LIVE=1` audit shots in light and dark (`LAB_OUT=ui-shots/r3-live`), keyboard walk of the changed forms and dialogs, reduced motion.
  - `DESIGN.md` v0.6 (git mv v0.5 to `docs/stale/` first) for the R3 decisions; AGENTS.md §6 row; this plan's §3, §13 and the R3 checkboxes; the UX-P-03 record.

**Preview commit:** `3b830d7` (26 Nov 2026), "feat: R3 patterns approved at UX-P-03: …".

### 10.1 Brief for R3.10: integrate R3 (new session)

Read this before you start R3.10. It holds what the R3 preview session learned.

**State on 26 Nov 2026:** branch `ui/r3-patterns`, last commit `3b830d7` (the R3 patterns, the `/lab` pages and the UX-P-03 record), on top of `b72ff4a` and `ad2c760` (R2). Nothing is pushed. PR #81 (`feat/guided-ledger`) was still open: check it first (§1 step 2). R3 is approved. R3.10 has not started. The live pages still use the old forms; only the top bar imports `SheetPopup` from the new `side-sheet` pattern (no visual change).

**Branch:** stay on `ui/r3-patterns`, or make `ui/r3-integrate` from it. Commit only when the owner says so (AGENTS.md §2).

**Read first, in this order:**

1. `AGENTS.md` (§2, §5, §7, §8, §9).
2. `docs/ui-ux-audit/DESIGN_DECISIONS.md`: the UX-P-03 record (the decisions, both feedback passes, "What the approval covers", the `DESIGN.md` sections to change).
3. §10.0 above (the R3 rules and the environment facts). They still apply.
4. The R3 patterns: `src/components/patterns/{queue-table,kpi-strip,inbox,return-composer,dialog,side-sheet,form-field}/index.tsx`, `dialog/copy.ts`, `kpi-strip/late.ts`, and the demos in `src/app/lab/_mock/r3-demos.tsx` (they show how to wire each pattern).

**Decisions to apply (UX-P-03, owner, 26 Nov 2026):**

| ID | Choice | Effect at R3.10 |
| :---- | :---- | :---- |
| R3-a | A: late after 5 days | `LATE_POLICIES.A` is the value for R7d (C1, C4). No live use in R3.10. |
| R3-b, R3-c, R3-f | A, A, A | Already the pattern defaults (`phone="stack"`, `longText="tooltip"`, `actionLook="button"`). |
| R3-d | 480 px | Already the `SideSheet` default. The top-bar sheets stay 400 px (they are panels, not forms). |
| R3-e | A: focus starts on Cancel | Already the `ConfirmDialog` default. |
| R3-g | A: the `--scrim` token | Change the default `scrim` of `SheetPopup`, `SideSheet` and `ConfirmDialog` to `"token"`. Change the three other backdrops: `app-shell/nav-drawer.tsx:29`, `top-bar/index.tsx:238` (route palette), and the top-bar sheets (through `SheetPopup`). Then remove the `"foreground"` option and the `SheetScrim` type if nothing uses them, and update `side-sheet.test.ts`. |
| R3-h | A: wire `ConfirmDialog` now | See "Permanent actions" below. |
| R3-i | A: a blocked row action in a compact row shows a `lock` glyph and a tooltip | Already in `queue-table`. |
| Registry | `form-field` joins `DESIGN.md` §7.4 | `DESIGN.md` v0.6. |

**Task A: one form-feedback contract on the live forms (UX-011, UX-012, UX-013).** Before you change anything, write the §4.4 list for each component (props, callbacks, state, validation, accessibility, server-facing behavior, loading and error behavior, call sites) in the UX-P-03 block or a new "R3.10 as built" table.

| Old component | Today | Call sites |
| :---- | :---- | :---- |
| `ActionForm` in `src/app/_components/action-form.tsx` | `action(form) → Result` (`{ ok?: true; error?: string }`, `src/app/_lib/run.ts:9`). Props: `submitLabel`, `blockedReason`, `variant`, `className`, `resetOnSuccess` (default true), `successToast`. Success: reset, optional toast, `router.refresh()`. Error: `role="alert"` under the button. Pending: "Saving…" with `disabled`. Also exports `Field`, `inputClass`, `areaClass`. | `availability-page.tsx`, `defense-day.tsx`, `outside-setters.tsx`, `revision-panel.tsx`, `score-sheet.tsx`, `slot-publish-form.tsx` (all in `src/app/_components/`), `adviser/consultations/page.tsx`, `adviser/dashboard/page.tsx`, `student/schedule/page.tsx` |
| `ActionForm` in `src/app/coordinator/_lib/form-parts.tsx` | `useActionState(action, {})` with `(prev, form) → FormState` (`{ ok?: string; error?: string }`). Success and error both in one polite `role="status"` line. Pending: "Saving…" with `disabled`. Also exports `Field` (with `hint`) and `fieldClass`. | `coordinator/{committees,defense/[defenseId],documents,schedule,students,templates,users}/…-forms.tsx` |

- Keep both function signatures and both result shapes. Do not change a server action. Change the markup and the feedback only.
- Pending: `PendingButton` (keeps its width, `aria-busy`, stays focusable). A blocked submit stays a `BlockedAction`-style button with its reason (BR-18).
- Error: a `FormFeedback` slot under the form (`role="alert"`). If a server error names a field, show it under that field with `FormField` (`error`, `aria-invalid`, linked). Today no server action returns a field name: keep the form-level slot, and note the gap.
- Success: `successToast` for small actions only (UX-D-04). A coordinator `ok` text is a workflow result: show it in the `FormFeedback` slot as `done`.
- Fields: replace `Field` + `inputClass` / `areaClass` / `fieldClass` with `FormField` + `control.input` / `control.select` / `control.textarea`. Keep each old export as a re-export or a thin wrapper until R8, so call sites change only where the round needs it. LOGIN keeps its own markup until R7d (§11 "LOGIN").
- `FormFeedback` reserves space (UX-D-16). Pick `lines` for each form for its longest message at its narrowest width. Check that no page jumps when a message shows (before and after shots).

**Task B: permanent actions behind `ConfirmDialog` (R3-h A, UX-010).** The server actions and their access checks do not change. Only a dialog step is added. Use `confirmCopy` (`src/components/patterns/dialog/copy.ts`) for the words. Focus returns to the opener on Cancel and Escape (Base UI does it; the R3 walk checked it in `/lab`).

| Action | Where | Today | Copy kind |
| :---- | :---- | :---- | :---- |
| Endorse (Gate 1a) | `EndorseButton` in `src/app/_components/workspace-controls.tsx:55`, rendered by `pr-workspace.tsx:106` | One click runs `endorseGate1a` | `endorse1a` |
| Endorse this commit (Gate 1b) | same, `pr-workspace.tsx:111` | One click runs `endorseCommit` | `endorse1b` (with `unlocks`) |
| Gate 2 | same, `pr-workspace.tsx:110` | One click runs `approveFinalAction`; label "Approve the final manuscript (Gate 2)" | `gate2` (confirm label "Endorse (Gate 2)"; keep the opener label until the owner decides UX-X-05) |
| Record verdict | `ActionForm` in `src/app/_components/defense-day.tsx:125` | Form submit runs `recordVerdictAction` | `verdict` |
| Verify | `ReviewForm` in `src/app/coordinator/documents/review-form.tsx` (one form, two submit buttons `name="to"`) | Submit with `to=verified` runs `reviewDocumentAction` | `verify` (form code and Student name from the row in `documents/page.tsx:112`) |
| Scan matches | `VerifySheetForm` in `src/app/coordinator/defense/[defenseId]/defense-forms.tsx` | Submit with `result=matched` runs `verifySheetAction` | `scanMatches` |
| Close the stage | `CloseForm` in the same file, rendered at `defense/[defenseId]/page.tsx:112` | Submit runs `closeDefenseAction` | `closeStage` |

- Pattern for a form action: the opener button opens the dialog (type `button`); `onConfirm` builds the same `FormData` the form sends today (hidden inputs plus `to` or `result`) and calls the same action; map the result to `{ error }` (coordinator actions take `(prev, form)`: pass `{}` as `prev`). On success, keep today's behavior (`router.refresh()`, the status line).
- "Return" on C4 and "Mismatch" on C6 stay as they are in R3.10 (the composer comes with the C4 and C6 screens in R7d).
- Not in R3-h: clearance "Close" (`src/app/coordinator/clearance/forms.tsx`), "Issue the Minutes" and "Certify" on C6. They are permanent too: list them in the R3.10 notes for R7d, and do not wire them now.
- Blocked actions keep their reason and never open the dialog.

**Task C: the file-upload toast.** `SheetScanUploader` (C6) and the Student upload controls confirm a file with a status line today. Add "File uploaded." (`useToast`, tone `done`, glyph `received`) only where the upload is a small confirmation and no workflow result follows. List each upload control and the choice.

**Task D: e2e.** Add one test: a permanent action opens the dialog, Escape closes it, focus returns to the opener, and nothing is recorded (the page shows the same state after a reload). Find a page where an e2e role has the action open in the demo data (`tests/e2e/roles.ts`, `auth.setup.ts`). Do not run `pnpm db:seed-dev` (UX-X-06). If no open permanent action exists for any e2e role, test the dialog on the open action you can reach, and record the gap. Fix any selector that the new markup breaks (`portals.spec.ts`, `shell.spec.ts`).

**Task E: validate (§4.5) and document.**

- Lint, typecheck, the full unit suite alone, build, e2e on the production build (`E2E_PORT=3100`, delete `.next/server/route-cache` first).
- `LAB_LIVE=1` audit shots in light and dark into `LAB_OUT=ui-shots/r3-live` (the command is in §9.0). Compare the forms before and after.
- Keyboard walk of the changed forms and dialogs on the live pages: pending focus, error announce, dialog focus on Cancel, Escape, focus return.
- `DESIGN.md` v0.6: `git mv` v0.5 to `docs/stale/` first, then write v0.6 with the sections listed in the UX-P-03 record. Update the AGENTS.md §6 row if the version is named there.
- This plan: §3 (R3 integrated), §13 (one results row), the R3.10 checkbox, an "R3.10 as built" table under this section.
- Never write "pass" for a check you did not run.

**Facts from the R3 preview session (they add to §9.0 and §10.0):**

| Topic | Fact |
| :---- | :---- |
| Client functions | A server page cannot call a function from a `"use client"` module (it is a client reference). Plain helpers go in a `.ts` file next to the pattern: `dialog/copy.ts`, `kpi-strip/late.ts`. |
| Base UI focus | Base UI moves focus through guard elements. A test that reads `document.activeElement` right after a Tab must wait about 80 ms. |
| Collapsed rows | `queue-table` hides the rows of a collapsed group with `hidden`. A height check must skip hidden rows. |
| Compact tables | A compact table has a minimum width (fixed columns plus 120 px) and scrolls in its frame below that. Give the first column a width that fits the longest group label (C1: 220 px). Use `hideBelowLaptop` for minor columns. |
| Stopping `lab:shots` | Stopping the background task leaves `tests/lab/run.mjs`, Playwright workers and headless browsers alive. Find `run.mjs` with `wmic process where "name='node.exe'" get processid,commandline` and stop its tree with `taskkill //PID <pid> //F //T`. The dev server is not in that tree. |
| Shot time | `pnpm lab:shots r3` takes about 34 minutes (242 shots). Do not change files while it runs: the dev server reloads them, and the shots mix old and new pages. |
| Python heredocs | `\1` in a Python string becomes a control character (octal). Edit regex tests with the Edit tool. Check with `LC_ALL=C.UTF-8 grep -nP '[\x00-\x08]'`. |

**Commit (when told):** `feat: integrate R3: one form-feedback contract on all forms, confirm dialog on permanent actions, scrim backdrop (DESIGN.md v0.6, BR-18, BR-19, UX-010 to UX-013)`

### 10.2 R3.10 as built (26 Nov 2026)

**Branch:** `ui/r3-patterns`, on top of `020802c`, not committed. The server actions, their access checks and their result shapes did not change. No data function or data call was added.

**§4.4 lists, before the change.**

| Component | Props and callbacks | State | Validation | Accessibility | Server-facing behavior | Loading and error | Call sites | After R3.10 |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| `ActionForm` (`_components/action-form.tsx`) | `action(form) → Result`, `submitLabel`, `blockedReason`, `variant`, `className`, `resetOnSuccess` (true), `successToast` | `useTransition` pending, one message | Native `required`, then the server | Error `role="alert"` under the button; blocked submit is `ActionButton` with its reason | Calls the action with the form data; `router.refresh()` after success | "Saving…" with `disabled`; error text in `text-destructive` | 9 files (§10.1 Task A) | All props kept. `PendingButton` (size `sm`), a `FormFeedback` slot of 2 lines, the same toast and refresh. New optional `confirm` (dialog copy) and `feedbackLines`. |
| `Field`, `inputClass`, `areaClass` (same file) | `label`, one child | none | none | `<label>` wraps the control | none | none | 7 files | `Field` renders `FormField` (label `for` an id from `useId`). The classes are `control.input` and `control.textarea`. |
| `ActionForm` (`coordinator/_lib/form-parts.tsx`) | `action(prev, form) → FormState`, `submit`, `variant`, `className` | `useActionState` | Native `required`, then the server | One `role="status"` polite line for both result and error | Form `action={run}` | "Saving…" with `disabled`; error and result in one line beside the button | 5 files (§10.1 Task A) | All props kept. `PendingButton`, then a 2-line `FormFeedback` slot under it: `ok` shows as "done" (`role="status"`), `error` as `role="alert"`. New optional `feedbackLines`. |
| `Field`, `fieldClass` (same file) | `label`, `htmlFor`, `hint`, one child | none | none | Label `for` the id; hint not linked | none | none | 6 files | `Field` renders `FormField`: the hint is linked with `aria-describedby`; new optional `error`. `fieldClass` is `control.input`. |
| Local `Message` / `note` lines (committees, schedule, clearance, C4 review, C6) | `state` | none | none | `role="status"` polite, also for errors | none | Error in `text-destructive` | 5 files | One `ResultSlot` (a `FormFeedback` slot): error `role="alert"`, result `role="status"`, fixed height. |
| `EndorseButton` (`workspace-controls.tsx`) | `milestoneId`, `kind`, `blockedReason` | `useRun` | none | `ActionButton` with its reason | One click runs the gate action | "Saving…"; error line | `pr-workspace.tsx` (3) | The click opens `ConfirmDialog`; confirm runs the same action; the error stays in the dialog; refresh after success. |

**What changed.**

| Area | Change | IDs |
| :---- | :---- | :---- |
| Backdrop (R3-g A) | `SCRIM = "bg-(--scrim)"` is the one backdrop: `SheetPopup`, `SideSheet`, `ConfirmDialog`, the nav drawer, the route palette and the top-bar sheets. The `scrim` prop, the `"foreground"` option and the `SheetScrim` type are removed, also from `/lab`. | R3-g, UX-P-03 |
| `PendingButton` | New optional `size` (`"sm"` for the old row forms until R7) and `className`; variant `"link"` for the coordinator forms. | UX-011 |
| Shared forms | `ActionForm` (both), `Field` (both), the old class names and `ResultSlot` as in the table above. Three width overrides use `cn` so the width wins over `w-full` (committee record select, copies count, score inputs). The Minutes textarea uses `control.textarea`. | UX-011 to UX-013, UX-D-16 |
| Permanent actions (R3-h A) | `ConfirmDialog` on Endorse (Gate 1a), Endorse this commit (Gate 1b), Gate 2 (A2, P2), Record verdict (A5, P4, through `ActionForm confirm`), Verify (C4), "Scan matches" and Close the stage (C6). The coordinator ones use one `ConfirmButton` in `form-parts.tsx`: it sends the form data with the same field (`to=verified`, `result=matched`) to the same action. | UX-010, BR-18, BR-19 |
| Dialog copy (correction) | Gate 1b: the last endorser sees "Yours is the last endorsement, so this locks the manuscript until the defense closes." and "Endorse and lock manuscript" (the owner kept this label, 26 Nov 2026). The other endorsers see "This records your endorsement, and the manuscript locks after the last endorsement." and "Endorse (Gate 1b)". New read-only data function `gate1bLocksOnEndorse` (access check through `loadAllowed`, test in `milestones.test.ts`); the PR workspace calls it once when Gate 1b is open for the user. Record verdict: "… and you can change it only until the defense is held." (was "you cannot change it"). The approved copy stated wrong facts: `endorseGate1b` locks only on the last endorsement (BR-07), and `recordVerdict` allows a new verdict until the defense is held (FR-DEF-07). **For the owner to confirm.** | UX-P-03, BR-07, FR-DEF-07 |
| Student name in dialogs | `confirmCopy` takes an optional `student` for Endorse, Gate 2 and Record verdict: the PR workspace and Defense Day data have no Student name, so the title names the record only ("Endorse this commit for defense (Gate 1b)?"). C4 and C6 pass the name and the form. | UX-010 |
| Upload toast (Task C) | `ScanUploader`, advising-form copy: "File uploaded." toast (tone `done`, glyph `received`), no status line. Kept as status lines: a required scan (it starts the Coordinator's check), `SheetScanUploader` (C6: the row then shows "Waiting for the check"), `CommitUploader` (a new commit is a workflow result). | UX-D-04 |
| Tests | New `tests/unit/components/form-contract.test.ts` (18 tests). `dialog.test.ts`: new copy and the record-only titles. `side-sheet.test.ts`: the scrim is the only backdrop of every overlay. New e2e test in `shell.spec.ts`: a blocked C4 Verify names its reason and opens no dialog; an open Verify opens the dialog, Cancel has focus, Escape closes it, focus returns, and a reload shows the same page. | UX-010, UX-011 |

**Left as they are (for R5, R7d and R8).**

- Old exports kept until R8: `Field`, `inputClass`, `areaClass` (`action-form.tsx`), `Field`, `fieldClass` (`form-parts.tsx`), `ActionButton` (`components/action-button.tsx`). No pattern has the same props as an old component, so no re-export was added.
- Not wired in R3.10 (permanent too, for R7d): clearance "Close" (`coordinator/clearance/forms.tsx`), "Issue the Minutes" and "Record the Certification" on C6. Also "Return" on C4 and "Mismatch" on C6 (the composer comes with C4 and C6 in R7d).
- The `workspace-controls.tsx` forms (Ready, Return to the Student, New thread, Reply, Resolve) keep their `useRun` line until R5 (manuscript workspace). LOGIN keeps its own markup until R7d.
- The upload progress lines (`SheetScanUploader`, `ScanUploader`, `CommitUploader`) keep one `role="status"` line that also shows errors. R5 and R7d move them to the contract.
- No server action returns a field name today, so no live form shows a field error yet. The form-level slot holds every error. A field error needs a server change (R7 or later).
- C4: Verify is now a `type="button"` opener. Enter in the reason box submits the first submit button, which is now Return (before: Verify). Return still needs a reason.
- The `FormFeedback` slot adds 40 px under each form (UX-D-16). This is the approved contract; the R7 screens can set `lines` per form.

**Gaps.**

- The live audit shots were stopped by the owner after 80 of about 350 (26 Nov 2026). Many of the 80 pages show errors (missing routes, and dev server error screens: files changed during the run). The owner deferred the full audit to R7d (§4.5.1). For R7d, with the dev server on port 3000 and no file changes during the run: `LAB_LIVE=1 LAB_PORT=3000 LAB_CORS_RELAY=1 LAB_MILESTONE_ID=3371ed7d-8833-49ac-bf2a-57dfd691d5c1 LAB_DEFENSE_ID=fb4a0ce9-4de2-4966-ba5a-a92608fd6fd0 LAB_OUT=ui-shots/r3-live pnpm lab:shots audit`. Then compare the forms with `ui-shots/r2-live/` and update the §13 row.

- No e2e role has an open permanent action in the dev data (every C4 Verify is blocked, C6 has no defense, the PR workspace shows no Endorse). The e2e test ran the blocked path only; the dialog path is in the test and runs when the data has an open Verify. The `/lab` walk of R3.9 covers the dialog focus, Escape and focus return. Do not re-seed (UX-X-06).
- The keyboard walk of a live dialog did not run, for the same reason.

### R4: Student path (old Task 7)

#### R4.0 Brief for R4 (new session)

Read this before you start R4. It holds what the R1 to R3 sessions learned.

**State on 26 Nov 2026:** branch `ui/r3-patterns`, R3.10 committed as `1717690`, then the screenshot schedule (§4.5.1). Nothing is pushed. R1 (UX-P-01), R2 (UX-P-02) and R3 (UX-P-03) are approved, integrated and committed. `DESIGN.md` is v0.6. PR #81 (`feat/guided-ledger`) was still open: check it first (§1 step 2).

**Branch:** make `ui/r4-student` from `ui/r3-patterns`. Commit only when the owner says so (AGENTS.md §2).

**Read first, in this order:**

1. `AGENTS.md` (§2, §5, §7, §8, §9).
2. `docs/ui-ux-audit/DESIGN_DECISIONS.md`: UX-D-01 to UX-D-16, the UX-P-03 record (with the R3.10 lines).
3. `DESIGN.md` v0.6: §2 (Guided Ledger, "Teach at the edges"), §2.1, §5.3 (Docket), §5.4, §6.2 (glyphs), §7.4 (rows `task-list`, `step-by-step`, `docket`, `stepper`), §8.2 (stepper), §8.11 (empty and first-day states), §8.12 (forms and "Download form"), F1 (the Novie exception).
4. `design/screens/PROCESS.md`, `S1.md`, `S3.md`, `S6.md`, `C7.md` (the users of `task-list`), `spec/SITEMAP.md` (the `/student/process` row and §9 locked reasons).
5. `docs/ui-ux-audit/UI_UX_AUDIT.md`: the findings for S1, S3 and S6.
6. §10.0, §10.1 and §10.2 above (the environment facts and the R3 parts). They still apply.

**What R1 to R3 built that R4 uses (do not rebuild):**

| Part | Where | Use in R4 |
| :---- | :---- | :---- |
| Tokens, glyphs, status stamp and labels | `src/styles/tokens.css`, `patterns/glyphs`, `patterns/status` | Task-list stamps, step glyphs (`done`) |
| `BlockedAction` | `patterns/blocked-action` | A blocked task-list action with its reason (BR-18) |
| `stepper`, `docket` | `patterns/stepper`, `patterns/docket` | S1 (already live); keep their look |
| `FormFeedback`, `PendingButton`, `FormField`, `ActionForm` (both, now on the contract) | `patterns/form-feedback`, `patterns/form-field`, `_components/action-form.tsx` | Any form on S1, S3, S6 |
| `ConfirmDialog`, `SideSheet`, `queue-table` | `patterns/dialog`, `patterns/side-sheet`, `patterns/queue-table` | Only if a task needs them |
| `LoadingBlocks` shapes and presets | `patterns/loading` | The task-list and PROCESS loading shapes (UX-D-15 suggestion) |
| Sidebar `navFor` | `patterns/sidebar/nav.ts` | Add "Thesis process" as the second Student item when the route exists (now left out, see the comment at the top) |
| Lab and shots | `src/app/lab/`, `_mock/pages.ts`, `LAB_ROUNDS` in `tests/lab/shots.spec.ts` | `/lab/patterns/task-list`, `/lab/patterns/step-by-step`, `/lab/screens/PROCESS` |

**Data facts (no new data function expected):**

| Need | Existing source | Gap |
| :---- | :---- | :---- |
| Degree level (2 or 3 Panel Members) | `studentTracker(ctx).degreeLevel` (`src/server/data/tracker.ts`) | None |
| Current step, done steps | `studentTracker(ctx)` (`current`, milestones) | None. Clearance is the fourth step. |
| Task-list items of S3 (required scans, advising forms) | the S3 page data today (`deliverables`, advising copies) | None |
| "Download form" files | the blank forms are `.doc` files in `docs/reference/tdw-forms/`, not served by the app | Decision R4-b |

**Decision points for the owner at gate UX-P-04 (show 2 or 3 options each, with a recommendation):**

| ID | Decision | Options to show |
| :---- | :---- | :---- |
| R4-a | Collapsed group in `task-list` ("Advising forms · optional") | A: native `<details>` (no script, simple). B: a disclosure button with `aria-expanded`, the same as the `queue-table` groups. Recommend B, for one look with R3. |
| R4-b | How "Download form" serves the blank TDW forms until Phase 4 | A: copy the `.doc` files to `public/forms/` (static, public). B: a Student-only route that streams the file after the role check. C: show the form number and name with no download yet. Recommend A: the blank forms are public university forms with no student data. |
| R4-c | Novie (mascot) in R4 (F1 exception, UX-D-11 item 7) | A: on the PROCESS first view and the S3 empty state only. B: no Novie until R7. Recommend B if the master artwork is still missing (UX-X-19). |
| R4-d | Step-by-step on a phone | A: the same accordion, full width. B: the current step only, with a "Show all steps" link. Recommend A. |

**Screenshots (§4.5.1):** `pnpm lab:shots r4` for the preview. After R4.6, live shots of PROCESS and S3 only, on the production build (port 3100). No full live audit until R7d.

**Rules that bind every R4 pattern:** the R3 rules (§10.0) still apply: UX-D-16 fixed slots, UX-D-04 toasts, G1 and G8 one maroon button for each region, BR-17 and BR-18, both themes, WCAG 2.2 AA, tokens only, mock data only in `/lab`. Also: PROCESS has no action except form downloads; Stage 0 is not a step; show the Student's degree level only (G2).

**R4 tasks.** Tests first for each pattern (the table below lists the tests that must fail first). Each pattern: `src/components/patterns/<name>/index.tsx`, first line `// Source: <reference>`, a typed props contract, a `/lab/patterns/<name>` page with every state in light and dark, a row in `_mock/pages.ts` and in `LAB_ROUNDS.r4`.

- [x] **R4.1 `task-list`** (interface and tests in the table below). Stamp, label, reason, actions; a collapsed group per R4-a; at most one stamp for each item.
- [x] **R4.2 `step-by-step`.** "You are here" on the current step, expanded; the other steps collapsed; `done` glyph on done steps; each step lists the gates, who acts, the defense, then its forms (mono form number, name, "Download form").
- [x] **R4.3 PROCESS preview** at `/lab/screens/PROCESS` with mock data for a Master's and a Doctoral Student (2 and 3 Panel Members). 4 steps, no Stage 0.
- [x] **R4.4 loading shapes** for the task list and PROCESS, if needed (UX-D-15).
- [x] **R4.5 preview (26 Nov 2026: shots stopped by the owner, see §13; text checks and a DOM keyboard walk instead).** `pnpm lab:shots r4` (all viewports, light and dark, the reduced pass; read `manifest.jsonl`). Keyboard walk of the disclosure buttons and the step accordion. Then the gate message (§4.2) with R4-a to R4-d. Stop.
- [x] **R4.6 integrate (after "R4 approved" only). Built 26 Nov 2026, not committed: §10.3.** The live route `/student/process` (Student only, the same role check as the other Student pages, FR-ACC-02). The sidebar item "Thesis process" (second Student item, `navFor` test first). S3 (and S1, S6 where the registry names them) move onto `task-list`; keep each call site's data and actions (§4.4 list first). e2e: the route opens for the Student and is refused for the other 3 roles. Validate (§4.5; live shots of PROCESS and S3 only, §4.5.1). `DESIGN.md` v0.7 (`git mv` v0.6 to `docs/stale/` first). This plan's §3, §13 and the R4 checkboxes; the UX-P-04 record.

**Facts from the R3 sessions (they add to §9.0 and §10.0):**

| Topic | Fact |
| :---- | :---- |
| Build type-checks tests | `pnpm build` type-checks `tests/` too. Run `pnpm typecheck` and `pnpm lint` after the last test edit, not only before. |
| `createElement` children | Passing `children` in the props object breaks the lint rule `react/no-children-prop`. Pass it as the third argument, or call a component with no hooks as a function. |
| e2e on streamed pages | `locator.all()` does not wait. Wait for the first item (`await expect(list.first()).toBeVisible()`) before you read a streamed list. |
| Sign-in on the dev server | `auth.setup.ts` can time out (5 s) on the dev server. Run e2e on the production build (`E2E_PORT=3100`). |
| Demo data | No e2e role has an open permanent action (UX-X-06: no re-seed). A test of an action that needs open data must also pass on the blocked path, and record the gap. |
| Dialog copy | Check each text against the data layer, not only the spec: R3.10 found two approved texts that stated wrong facts (Gate 1b lock, verdict change). |


| Pattern | Interface | Tests |
| :---- | :---- | :---- |
| `task-list` | `TaskList(props: { groups: { label; collapsed?; items: { stamp?; label; reason?; actions? }[] }[] })` | A collapsed group ("Advising forms · optional") is a `<details>` or a disclosure button with `aria-expanded`. Each item has at most one stamp. |
| `step-by-step` | `StepByStep(props: { steps: { title; current; done; body }[] })` | The current step shows "You are here" and is expanded. The other steps are collapsed. Done steps have the `done` glyph. |

- [x] Route `/student/process` (`spec/SITEMAP.md`, PROCESS spec): Student only (FR-ACC-02), with the same role check as the other Student pages. A Master's Student sees "2 Panel Members", a Doctoral Student "3". 4 steps, no Stage 0. Forms link to the blank forms in `docs/reference/tdw-forms` until Phase 4.
- [x] e2e: the route opens for the Student and is refused for the other 3 roles.
- [x] The route is new code, but it is in the sitemap. Its preview is `/lab/screens/PROCESS` with mock data. Build the live page only after the gate.


### 10.3 R4.6 as built (26 Nov 2026)

**Branch:** `ui/r4-student`, on top of `8a24508` (the approved preview), committed as `f4f9ded`. No server action, data function or access check changed. The live pages make the same data calls as before; PROCESS makes one existing call (`studentTracker`).

**§4.4 lists, before the change.**

| Component | Props and data | Actions | Blocked | Accessibility | Loading and error | After R4.6 |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| S3 list (`student/documents/page.tsx`) | `readableMilestones`, `deliverables`, `advisingCopies` | `ScanUploader` (required scan, advising copy) | `ActionButton` with the locked reason or "The Adviser/Coordinator uploads this form." | `<ul>` rows; advising forms in a `<details>` | `loading.tsx` (page preset); `EmptyState` | `task-list`: the same calls, uploaders and reasons. The advising forms are a collapsed group (R4-a B) with names. New: "Download form" on each TDW row (UX-032). The stamp uses `formLabel` (UX-016 on S3). The signer text shows as "On paper: …" (UX-020). |
| S1 Readiness (`student/dashboard/page.tsx`) | `studentTracker().checklist` | none | none | `<ul>`, Lucide icons | `EmptyState` | `task-list` with a status stamp ("Done", "Not done"); the same data and empty state |
| S6 checklist (`student/clearance/page.tsx`) | `clearanceView().rows` through `ClearanceList` | none | none | `<ul>`, Lucide icons | `EmptyState` | `task-list` with a status stamp ("Done", "Open") and the source as a note. C7 keeps `ClearanceList` until R7d. |
| Student sidebar (`navFor`) | `NavFacts` | — | — | — | — | "Thesis process" second, always open (test first) |

**What changed.**

| Area | Change | IDs |
| :---- | :---- | :---- |
| Route | `/student/process`: `page.tsx` (role check before the data call, the same as S1), `loading.tsx` (the `process` preset), `view.tsx` and `steps.ts` from the preview. A Student with no thesis record sees an empty state. | FR-ACC-02, FR-TRK-01 |
| Forms (R4-b A) | `public/forms/TDW-01.doc` to `TDW-13.doc`, byte copies of `docs/reference/tdw-forms` (already tracked in this public repository). `blankFormHref` in `src/lib/forms.ts`, with a test. | FR-DOC-01, UX-032 |
| Fix found in the live check | A link with `buttonVariants({ variant: "outline" })` and no `cn()` keeps the base `border-transparent`, so the outline border did not show on S3. S3 and the `/lab` demos now use `cn()`. PROCESS already did. | — |
| Tests | `sidebar.test.ts` (Thesis process second, always open), `tests/unit/lib/forms.test.ts`, e2e in `portals.spec.ts` (PROCESS opens for the Student with the sidebar item current; Access Denied for the Adviser, the Panel Member and the Coordinator). | FR-ACC-02 |

**Left as they are (for R7a and R7d).**

- S3 has no "Returned" reason under a row: `Deliverable.records` has no return reason. A data change (R7a).
- S3 has no "Completed milestones" group and no History tab: both need data calls that the page does not make today (R7a).
- The S3 upload buttons keep the full form name ("Upload Panel on Oral Defense …"), so their widths vary (UX audit, R7a).
- S1 keeps its old Docket; "See the whole process" comes with the S1 screen in R7a. The sidebar item is the entry point now.
- C7 keeps `ClearanceList` (R7d).
- The blank `.doc` files carry the author names of university staff in their file metadata. The files were already public in `docs/reference/tdw-forms`.
- Open facts (1) to (3) of UX-P-04: unchanged until the owner answers.

### R5: manuscript workspace (old Task 8)

#### R5.0 Brief for R5 (new session)

Read this before you start R5. It holds what the R1 to R4 sessions learned.

**State on 26 Nov 2026:** branch `ui/r4-student`. R4 preview committed as `8a24508`, R4.6 (integrate) as `f4f9ded`. Nothing is pushed. R1 to R4 (UX-P-01 to UX-P-04) are approved, integrated and committed. `DESIGN.md` is v0.7. PR #81 (`feat/guided-ledger`) was still open: check it first (§1 step 2).

**Branch:** make `ui/r5-workspace` from `ui/r4-student`. Commit only when the owner says so (AGENTS.md §2).

**Read first, in this order:**

1. `AGENTS.md` (§2, §5, §7 with BR-05, BR-06, BR-07, BR-19, §8, §9).
2. `docs/ui-ux-audit/DESIGN_DECISIONS.md`: UX-D-01 to UX-D-16, the UX-P-03 record (R3.10 lines: the Gate 1b dialog and the missing Student name) and the UX-P-04 record (with the 3 open facts).
3. `DESIGN.md` v0.7: §2 (G1, G4, G5, G10), §5.2 (identity line), §5.3 (S2, A2 and P2 forms of the Docket: merge box and gate box), §8.6 (locked banner), §8.9 (dialogs, Return composer), §10, §7.4 rows `workspace`, `pdf-viewer`, `commit-selector`, `thread-feed`, `merge-box`, `gate-box`.
4. `design/screens/S2.md`, `A2.md`, `P2.md` (the three users of the workspace). `spec/SITEMAP.md` §9 (the blocked messages for Upload, Mark Ready, Gate 1a, Gate 1b, Gate 2 and Defense Day threads).
5. `docs/ui-ux-audit/UI_UX_AUDIT.md`: UX-008, UX-009 (Critical, the PDF crash; Round H fixed the crash, R5 finishes it), UX-010, UX-030, UX-040.
6. §10.0 to §10.3 and the R4.0 brief above. Their environment facts still apply.

**What R1 to R4 built that R5 uses (do not rebuild):**

| Part | Where | Use in R5 |
| :---- | :---- | :---- |
| Tokens, glyphs, status pill and stamp | `tokens.css`, `patterns/glyphs`, `patterns/status` | The Ready pill, gate glyphs, the `commit` glyph |
| `identity-line` | `patterns/identity-line` | The workspace header (UX-030) |
| `BlockedAction` | `patterns/blocked-action` | Mark Ready, Upload, the gate button, New thread, each with its SITEMAP §9 reason (BR-18) |
| `ConfirmDialog`, `confirmCopy` | `patterns/dialog` | Endorse (Gate 1a, Gate 1b), Gate 2. Already live through `EndorseButton` (R3.10). Keep the copy and `gate1bLocksOnEndorse`. |
| `ReturnComposer` | `patterns/return-composer` | Return in the gate box (R5-c) |
| `SideSheet` | `patterns/side-sheet` | Only if R5-a picks B |
| `FormFeedback`, `PendingButton`, `FormField` | `patterns/form-feedback`, `patterns/form-field` | The thread, reply, Ready and Return forms |
| `task-list` collapsible group look | `patterns/task-list`, `patterns/queue-table` | The same disclosure button look, if a feed group collapses |
| `LoadingBlocks` | `patterns/loading` | A new `workspace` shape (R5.7) |
| Lab | `src/app/lab/`, `_mock/pages.ts`, `LAB_ROUNDS` | `/lab/patterns/<name>` for each pattern, `/lab/patterns/workspace?role=student\|adviser\|panel` |

**Today's workspace (the §4.4 list starts here):**

| File | Holds | Users |
| :---- | :---- | :---- |
| `src/app/_components/pr-workspace.tsx` (196 lines) | `PrWorkspace({ portal, prId, commit, page })`: the role check, `workspaceFor`, the gate blocks (`checkTransition`, `gate1bBlock`, `gate2Block`, `gate1bLocksOnEndorse`), `threadPostBlock`, `listAttempts`, then the markup | `student/pr/[prId]`, `adviser/pr/[prId]`, `panel/pr/[prId]` |
| `src/app/_components/workspace-controls.tsx` (205 lines) | `ReadyButton`, `EndorseButton` (on `ConfirmDialog` since R3.10), `ReturnForm`, `NewThreadForm` (with the page number), `ReplyForm`, `ResolveButton`. All except `EndorseButton` still use the old `useRun` line (left for R5 in §10.2). | `pr-workspace.tsx` |
| `src/components/pdf-viewer.tsx`, `src/app/_components/pdf-pane.tsx` | The react-pdf viewer, the Round H error state | `pr-workspace.tsx`, SV, C4 |
| `src/app/_components/commit-uploader.tsx` | The upload of a new commit (write-once key, a status line) | S2 |
| `src/app/_components/revision-panel.tsx` | The revision items (FR-REV-13) | A2, P2 |

**Data facts (no new data function expected):**

| Need | Existing source | Gap |
| :---- | :---- | :---- |
| Commits, the Ready mark, the lock | `workspaceFor(ctx, prId)` (through `submissionFor`) | None |
| Threads with the page number, Outdated, replies with the author role, "addressed by" | `workspaceFor().threads` (`ThreadView`, D-26 page from 1 to 9999) | None |
| Can this user resolve a thread (BR-05) | `thread.authorId === actor.id` | None (computed in the page) |
| Gate checks for the gate box | `checkTransition`, `gate1bBlock`, `gate2Block` (each gives one reason or none) | The gate box shows one row for each check. Today each function gives only the first reason. List the rows that the reasons can name; a full list of checks is a data change for later. |
| Thesis title and Student name in the identity line (UX-030) | `workspaceFor` has the milestone, not the thesis title or the Student name | **Gap.** A2 and P2 cannot name the Student before a gate action (also the R3.10 dialog gap). A read-only addition to `workspaceFor` (same access check) needs the owner's approval at UX-P-05. Do not add it in the preview. |

**Decision points for the owner at gate UX-P-05 (show 2 or 3 options each, with a recommendation):**

| ID | Decision | Options to show |
| :---- | :---- | :---- |
| R5-a | The thread feed below 1024 px | A: a tab "Threads" beside "Manuscript" (the plan's interface). B: a "Threads" button that opens a `side-sheet`. Recommend A: no overlay over the PDF, and the tab keeps the count. |
| R5-b | The upload on S2 | A: a sticky bottom bar (S2 spec). B: the upload inside the merge box. Recommend A: the S2 spec, and the merge box keeps one action. |
| R5-c | Return in the gate box (A2, Gate 1a) | A: `ReturnComposer` inline under the gate box (the same as C4). B: a dialog with a reason field. Recommend A: one Return look in the app. |
| R5-d | "p. 14" on a thread | A: the viewer moves to the page in place, and focus moves to the viewer. B: a link to `?page=14` (the page already reads `page`), so Back returns. Recommend B: Back works and the link can be shared. |
| R5-e | Integrate scope at R5.10 | A: re-exports, `pdf-viewer` moved, the `workspace-controls` forms on the form-feedback contract; the S2, A2 and P2 markup waits for R7. B: also move `PrWorkspace` onto the patterns now (one file serves 3 routes). Recommend A: "R3 to R6 build only patterns" (§10). |

**Screenshots (§4.5.1 and the owner's rule of 26 Nov 2026):** no `lab:shots` batch by default. Check each `/lab` page with a text check (HTTP 200, the expected content, no error text) and look at one shot yourself. Run a batch only when the owner asks and the pages are confirmed. Edit files with the Edit tool: an in-place Python write was not reloaded by the dev server in R4.

**Rules that bind every R5 pattern:** the R3 and R4 rules still apply (UX-D-16 fixed slots, UX-D-04 toasts, G1 and G8, BR-17, BR-18, both themes, WCAG 2.2 AA, tokens only, mock data only in `/lab`). Also: the student replies and never resolves (BR-05); no edit or delete control on a commit or a scan (BR-19); the lock banner after Gate 1b (BR-07); the PDF page stays white in dark (UX-D-01); no pin or highlight on the PDF (ADR-009, D-26); Return is never a solid red fill and never disabled in the gate box (F3).

**R5 tasks.** Tests first for each pattern (the table under this brief). Each pattern: `src/components/patterns/<name>/index.tsx`, first line `// Source: <reference>`, a typed props contract, a `/lab/patterns/<name>` page with every state in light and dark, a row in `_mock/pages.ts` and in `LAB_ROUNDS.r5`.

- [x] **R5.1 `merge-box`.** One sentence, at most one action, the locked reason in place of the action (S2 states: first day, Ready, locked).
- [x] **R5.2 `gate-box`.** One row for each check with a pass or fail glyph and the reason; the gate button `aria-disabled` with the failing reason; Return per R5-c. The gate button opens the existing `ConfirmDialog` copy.
- [x] **R5.3 `commit-selector`.** `v3` in mono, the short hash, the date (PHT), the uploader, the Ready pill. A list of links that sets `?commit=` (the page reads it today). No edit or delete.
- [x] **R5.4 `thread-feed`.** Tabs Open (first), All, Resolved with counts; "p. 14" per R5-d; Outdated tag (BR-06); "Addressed by v4" (FR-REV-08); Reply for all, Resolve only for the author (BR-05); the amber edge on the viewer's own open threads; a 65-character measure (UX-D-03). New thread and Reply on the form-feedback contract.
- [x] **R5.5 `pdf-viewer`.** Move `src/components/pdf-viewer.tsx` into the pattern folder with a re-export at the old path; the same props. Page Up and Page Down; the lock banner; the Round H error state (UX-009) and no "Page 1 of 0" (UX-040); white page in dark. In `/lab`, a mock file or the error state only (no storage call).
- [x] **R5.6 `workspace`.** Header (identity line), box (merge box or gate box), commit selector, viewer and feed: split at laptop (feed 400 px), R5-a below 1024 px; the S2 upload bar per R5-b.
- [x] **R5.7 loading shape** `workspace` (header, box, viewer block, feed lines), if needed (UX-D-15).
- [x] **R5.8 preview (26 Nov 2026: text checks, 1 shot of each page, keyboard walk 21 of 21, no batch; feedback pass 1 revised; §10.4).** `/lab/patterns/workspace?role=student|adviser|panel` with the first-day, working, Ready and locked states. Text checks, one shot of each page that you look at, a keyboard walk (tabs, thread forms, "p. 14", Page Up and Page Down, the gate dialog: focus on Cancel, Escape, focus return). Then the gate message (§4.2) with R5-a to R5-e and the identity-line data gap. Stop.
- [x] **R5.9 integrate (after "R5 approved" only). Built 26 Nov 2026, not committed: §10.5. Also: `DESIGN.md` v0.8 §8.9 and §8.3 take the one Gate 1b label "Endorse and lock manuscript" (UX-P-05, owner option A); already live in `confirmCopy` and the A2/P2 opener.** Also: `pdf-pane.tsx` passes `nextStep` (by role) and `retried` (after the first "Try again") to the viewer (UX-P-05: yes). P2 keeps no Return (UX-P-05: A, issue #84). Per R5-e. List the §4.4 items of each changed component first. The `workspace-controls` forms move onto `FormFeedback` and `PendingButton` (keep each server action, its result shape and `router.refresh()`). Validate (§4.5): lint, typecheck, the full unit suite alone, build, e2e on the production build. Live check of S2, A2 and P2 on the production build (text checks and one shot each). `DESIGN.md` v0.8 (`git mv` v0.7 to `docs/stale/` first). This plan's §3, §13 and the R5 checkboxes; the UX-P-05 record.

**Facts from the R4 session (they add to §9.0, §10.0 and R4.0):**

| Topic | Fact |
| :---- | :---- |
| Stale module | The dev server kept an old `loading/index.tsx` after an in-place Python write: HTTP 200, but an error overlay in the picture. An edit with the Edit tool reloaded it. Check the content, not only the status. |
| Error text in HTML | Every page has "This page could not be found." inside the Next.js page data (the built-in not-found fallback). A text check must not count it as an error. |
| `buttonVariants` on a link | `buttonVariants({ variant: "outline" })` without `cn()` keeps the base `border-transparent`, and the border does not show. Wrap it in `cn()`. |
| `useId` in tests | React 19 ids look like `_R_a6f5…_`. Tests that build a regex from `aria-controls` work, but do not hard-code an id. |
| Server view, client pattern | A server `view.tsx` can pass functions to its own server helpers (`formHref`), but only elements and plain data into a client pattern. |
| Student session file | `tests/e2e/.auth/student.json` (made by `auth.setup.ts`) lets a small Playwright script open live Student pages on port 3100. |



| Pattern | Interface | Tests |
| :---- | :---- | :---- |
| `gate-box` | `GateBox(props: { checks: { label; ok; reason? }[]; gateLabel; onGate; onReturn })` | One failing check gives `aria-disabled` and that check's reason. Return is never disabled and never a solid red fill. |
| `merge-box` | `MergeBox(props: { sentence; action: ReactNode \| null; lockedReason? })` | One sentence, at most one action. The locked reason shows when `action` is null. |
| `thread-feed` | `ThreadFeed(props: { threads: ThreadView[]; viewerRole; ownUserId; onJumpToPage(p); canResolve(t) })` | Tabs Open (first), All, Resolved. `page: 14` gives a "p. 14" button. `page: null` gives none. A Student sees "Reply" and no "Resolve" (BR-05). Own open threads have the amber edge. Reading width follows Notion: about 65 characters for the body text (UX-D-03). |
| `commit-selector` | `CommitSelector(props: { commits; selected; onSelect })` | `v3` in mono, the short hash, the date, the uploader, the Ready pill |
| `pdf-viewer` | Move `src/components/pdf-viewer.tsx`. Same props. | Page Up and Page Down move one page. The locked banner shows when the manuscript is locked (§8.6). The page stays white in dark. |
| `workspace` | `Workspace(props: { header; viewer; feed; box })` | Split view at laptop. Below 1024 px the thread feed is a tab. |

No pins or highlights on the PDF (ADR-009).

### 10.4 R5 preview as built (26 Nov 2026)

**Branch:** `ui/r5-workspace`, made from `ui/r4-student` (`86738b9`), not committed. PR #81 is still open; the owner named `ui/r4-student` as the base. No live page, server action, data function or access check changed. The live workspace still uses `pr-workspace.tsx` and `workspace-controls.tsx`.

| Part | Where | Note |
| :---- | :---- | :---- |
| `merge-box` | `patterns/merge-box` | One sentence, one action or its reason (it throws on neither or both). No upload in the box (UX-P-05). |
| `gate-box` | `patterns/gate-box` | `gateBlock(checks)` gives the first failing reason. Gate button opens `ConfirmDialog` with the existing `confirmCopy`. Return inline (R5-c A), never disabled, at the right end of the row. Waiting state: no rows, the button reason says it once. |
| `commit-selector` | `patterns/commit-selector` | Newest first, 3 shown, older ones behind a disclosure button (opens when the selected commit is in it). `hrefFor` is optional (default `?commit=n`). |
| `thread-feed` | `patterns/thread-feed` | Plain `FeedThread` props, not `ThreadView`: the page maps `ThreadView` at R5.9 and sets `own` and `canResolve` (functions cannot cross into a client pattern). Reply is a disclosure button (focus moves into the form; Escape and Cancel return focus). The Student never sees Resolve, whatever `canResolve` says. Page hint "From 1 to 9999.". |
| `pdf-viewer` | `patterns/pdf-viewer`, re-export at `src/components/pdf-viewer.tsx` | Same props plus an optional `locked`. Page Up, Page Down, Home, End on the focused page region. The page fits the column (up to 800 px). Page controls hide until the page count is known and under a load error (UX-040). |
| `workspace` | `patterns/workspace` | Slots. Split at 1024 px (feed 400 px). Threads tab below 1024 px (R5-a A). The S2 upload is a plain region at the foot of the Manuscript column (R5-b A adapted, owner: no sticky part). |
| Loading | `patterns/loading` | Shape and page preset `workspace`. |
| Lab | `/lab/patterns/{merge-box,gate-box,commit-selector,thread-feed,pdf-viewer,workspace}`, `_mock/r5-data.ts`, `_mock/r5-demos.tsx`, `LAB_ROUNDS.r5` | The fake PDF is built in the browser (a blob link): no file in the repository, no storage call. |
| Helper | `src/lib/tabs.ts` | `nextTab` for the two tab lists |

**Found in the checks and fixed:** a server page called `confirmCopy` through the client `dialog` module (import `dialog/copy` instead); a `sed` edit of `loading/index.tsx` was not reloaded by the dev server (the R4 fact again: re-saved with the Edit tool); "older commits" was split into text nodes; the gate waiting sentence showed twice; Return floated mid-row; every open thread showed an open reply box; the Page hint was cut off; react-pdf's "Loading PDF…" doubled the count line.

**Feedback pass 1 (26 Nov 2026):** the owner accepted every recommendation except R5-b; the upload is no longer sticky, and the options not chosen are removed (`DESIGN_DECISIONS.md` UX-P-05).

**Known limits for the gate:** the workspace tab panels keep `role="tabpanel"` at laptop width, where the tab list is hidden; P2 has no Return today (the live code shows Return only to the Adviser at Ready), but `P2.md` says "Same Return dialog as A2"; thread authors are role words (no names in `ThreadView`).

### 10.5 R5.9 integrate (26 Nov 2026)

**Scope (R5-e A):** the patterns stay in `/lab`; the S2, A2 and P2 markup moves in R7. R5.9 moves the `workspace-controls` forms onto the form-feedback contract, wires the approved PDF error line, and adds the approved identity data (thesis title and Student name) to `workspaceFor` for the gate dialogs.

**§4.4 list, before the change.**

| Component | Props and data | Server action and result | Blocked | Accessibility | Loading and error | After R5.9 |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| `ReadyButton` | `milestoneId`, `commitId`, `moveToReady`, `blockedReason` | `markReady` → `Result`; `router.refresh()` on ok | `ActionButton` with the reason | Focusable when blocked | "Saving…" label; the old `useRun` error line (`text-xs text-destructive`, grows the layout) | `PendingButton` (keeps its width) and a 2-line `FormFeedback`; the same action, result and refresh; blocked as before |
| `EndorseButton` | `milestoneId`, `kind`, `blockedReason`, `locks` | `endorseGate1a`, `endorseCommit`, `approveFinalAction` through `ConfirmDialog` (R3.10) | `ActionButton` with the reason | Dialog focus on Cancel | Error stays in the dialog | New optional `student`: the dialog title names the Student (R3.10 gap closed). Gate 1b label `GATE1B_LABEL` (UX-P-05 A). |
| `ReturnForm` | `milestoneId` | `returnToStudent(milestoneId, reason)` → `Result`; closes and refreshes on ok | never blocked | A labelled textarea, `required` | The old error line | The `ReturnComposer` pattern (R5-c A): "Reason for return", "Send return" blocked until text, Escape and Cancel return focus to the Return button; the same action, result and refresh |
| `NewThreadForm` | `commitId`, `blockedReason` | `postThreadAction(commitId, body, page)`; clears and refreshes on ok | readOnly fields and `ActionButton` with the reason | Labels; Page 1 to 9999 | The old error line | `FormField` controls, `PendingButton`, `FormFeedback`; the same action and page rule; blocked as before |
| `ReplyForm` | `threadId` | `replyAction(threadId, body)`; clears and refreshes on ok | none | A labelled textarea | The old error line | `FormField`, `PendingButton`, `FormFeedback`; the same action |
| `ResolveButton` | `threadId` | `resolveAction(threadId)`; refreshes on ok | none (shown only to the author, BR-05) | — | The old error line | `PendingButton` and `FormFeedback`; the same action |
| `PdfPane` | `commitId`, `page` | `commitUrl(commitId)` (signed link) | — | — | Round H error with "Try again" | New `role`: after a failed retry the error shows the role's next step (UX-P-05: yes) |
| `workspaceFor` | `milestone`, `pr`, `commits`, `locked`, `threads` | read only | — | — | — | Adds `identity: { title, studentName }` from `thesis_instance` and `app_user`, after the same access checks (UX-P-05) |

**As built.** No server action, access check or route changed. The page makes the same data calls; `workspaceFor` makes one more read after its access checks.

| Area | Change | IDs |
| :---- | :---- | :---- |
| Forms | `workspace-controls.tsx`: one `useAction` hook (pending, the `FormFeedback` state, `router.refresh()` after a saved action) replaces `useRun`. Mark Ready, Post thread, Send reply and Resolve use `PendingButton` and a 2-line `FormFeedback`; blocked actions use `BlockedAction` with their reason. Return is the `ReturnComposer` with "The Student sees this reason.". | UX-011, UX-D-16, BR-18, R5-c A |
| Gate dialogs | `EndorseButton` takes `student`; `pr-workspace.tsx` passes `identity.studentName`, so the Gate 1a, Gate 1b and Gate 2 dialog titles name the Student (the R3.10 gap). | UX-030, UX-P-05 |
| Copy fix | The Gate 1a dialog title said "Endorse the proposal of …". Gate 1a is also at Pre-Final, so it now says "Endorse the manuscript of … (Gate 1a)?". | — |
| PDF error | `PdfPane` takes `role` and passes `pdfNextStep(role)` and `retried` to the viewer and the error boundary. | UX-009, UX-P-05 |
| Data | `workspaceFor().identity` with tests: the Student, the Adviser and a member with access get the title and the name; a null title stays null; a member without access and another thesis's Adviser are refused. | NFR-01, BR-08 |
| Documents | `DESIGN.md` v0.8 (v0.7 in `docs/stale/`), AGENTS.md §6 version row. | — |

**Left for R7:** the S2, A2 and P2 markup (header identity line, merge box, gate box, commit selector, thread feed, workspace split and tab, the upload region) moves onto the R5 patterns with the screens (R5-e A). The live header still has no identity line. The dev data has no open Ready, Return, Reply or Resolve case (UX-X-06: no re-seed), so the live check saw only the blocked paths of those forms.

### R6: forms and Defense Day (rest of old Task 9)

#### R6.0 Brief for R6 (new session)

Read this before you start R6. It holds what the R1 to R5 sessions learned.

**State on 27 Nov 2026:** branch `ui/r5-workspace`. R5 preview committed as `eff07da`, R5.9 (integrate) as `8b020e8`. Both are pushed to `origin/ui/r5-workspace`. No pull request is open for it. R1 to R5 (UX-P-01 to UX-P-05) are approved and integrated. `DESIGN.md` is v0.8. PR #81 (`feat/guided-ledger`) is still open: check it first (§1 step 2).

**Uncommitted on `ui/r5-workspace` (27 Nov 2026, GitHub issue #85):** one session read for each request (`getSessionState` in React `cache()`, `src/server/auth/session.ts`), `<Link>` in `commit-selector`, `thread-feed` and the lab `panels.tsx`, and 2 test fixes (CRLF line ends in `form-contract.test.ts`, attribute order in `commit-selector.test.ts`). Ask the owner to commit them before you make the R6 branch.

**Branch:** make `ui/r6-forms` from `ui/r5-workspace`. Commit only when the owner says so (AGENTS.md §2).

**Read first, in this order:**

1. `AGENTS.md` (§2, §5, §7 with BR-01, BR-09, BR-15, BR-17, BR-19, §8, §9: no Defense Day autosave, no grading, no calendar file).
2. `docs/ui-ux-audit/DESIGN_DECISIONS.md`: UX-D-01 to UX-D-16 and the UX-P-05 record.
3. `DESIGN.md` v0.8: §2 (G1, G4, G5, G10, F2, F4), §7.3 (button size `defense`), §7.4 rows `slot-list`, `date-picker`, `consultation-log`, `defense-form`, `verdict`, §8.3, §8.9 (Record verdict dialog), §10.
4. `design/screens/S4.md`, `A4.md`, `P3.md` (slots and booking), `A3.md` (consultations), `A5.md`, `P4.md` (Defense Day), `C6.md` (the verdict on the Coordinator side). `spec/SITEMAP.md` §9 (the blocked messages for booking and Defense Day).
5. `docs/ui-ux-audit/UI_UX_AUDIT.md`: UX-022 (native date inputs), UX-023 (closed defense forms look editable), UX-025 (Defense Day targets below 48 px), UX-039 (a slot row does not name the Student), UX-011.
6. §10.0 to §10.5 and the R5.0 brief above. Their environment facts still apply.

**What R1 to R5 built that R6 uses (do not rebuild):**

| Part | Where | Use in R6 |
| :---- | :---- | :---- |
| `Button` size `defense` (48 px) | `src/components/ui/button.tsx` | Every Defense Day control (UX-025) |
| `BlockedAction` | `patterns/blocked-action` | Book, Save my sheet, Record verdict, each with its SITEMAP §9 reason (BR-18) |
| `ConfirmDialog`, `confirmCopy({ kind: "verdict" })` | `patterns/dialog` | Record verdict. Already live through `ActionForm` (R3.10). Keep the copy. |
| `FormFeedback`, `PendingButton`, `FormField` | `patterns/form-feedback`, `patterns/form-field` | Every R6 form |
| `queue-table` | `patterns/queue-table` | The base of `consultation-log` |
| `flag` | `patterns/flag` | "1 sheet is not saved yet." (F2, BR-17) |
| `status`, `glyphs` | `patterns/status`, `patterns/glyphs` | The `done` stamp on a verified sheet, the slot states |
| `LoadingBlocks` | `patterns/loading` | New shapes: the Defense Day sheet and the slot list (UX-D-15) |
| `@base-ui/react` | `package.json` | The `date-picker` parts. No new package. |
| Lab | `src/app/lab/`, `_mock/pages.ts`, `LAB_ROUNDS` | `/lab/patterns/<name>` for each pattern |

**Today's markup (the §4.4 list starts here):**

| File | Holds | Users |
| :---- | :---- | :---- |
| `src/app/_components/slot-list.tsx` (32 lines) | `WithdrawButton({ slotId })` and the slot rows | `availability-page.tsx` (A4, P3), `student/schedule/page.tsx` (S4) |
| `src/app/_components/slot-publish-form.tsx` (36 lines) | Publish a slot: 2 `datetime-local` inputs | A4, P3 |
| `src/app/student/schedule/page.tsx` (175 lines) | S4: the BR-09 earliest date text, a native `type="date"` input, the free periods | Student |
| `src/app/_components/score-sheet.tsx` (41 lines) | The criteria rows and the total | `defense-day.tsx` |
| `src/app/_components/defense-day.tsx` (149 lines) | A5 and P4: the sheet, `actionTaken` select, the save and the verdict | `adviser/defense/[defenseId]`, `panel/defense/[defenseId]` |
| `src/app/adviser/consultations/page.tsx` (97 lines) | A3: the consultation table | Adviser |
| `src/app/coordinator/schedule/schedule-forms.tsx`, `students/create-student-form.tsx`, `templates/template-forms.tsx` | Coordinator `date` and `datetime-local` inputs | Coordinator. Not in R6 unless R6-a picks B. |

**Tasks (build preview, §4.1). Write each test first.**

| Task | Pattern | Done when |
| :---- | :---- | :---- |
| R6.1 | `slot-list` | Same props as today. A confirmed slot names the Student (UX-039). No repeated "Confirmed" word. |
| R6.2 | `date-picker` | The interface and tests in the table below. Days before `earliest` have `aria-disabled` and the BR-09 reason. Dates in PST (UTC+8). |
| R6.3 | `defense-form` | The table below. A read-only state after the verify or the close: values as text, no field (UX-023). |
| R6.4 | `verdict` | The table below. A read-only state after the close. |
| R6.5 | `consultation-log` | On `queue-table`, comfortable density. |
| R6.6 | Loading shapes | `LoadingBlocks` shapes for the Defense Day sheet and the slot list. No layout move when the data arrives. |
| R6.7 | Lab pages | `/lab/patterns/slot-list`, `date-picker`, `defense-form`, `verdict`, `consultation-log`, each with every state in light and dark. Rows in `_mock/pages.ts` with gate `UX-P-06`. |
| R6.8 | Validate and show | §4.5 checks. The issue #85 items for R6 (shell streaming, `RoleGate` fallback, lab `<Suspense>` fallbacks, a browser timing of client navigation). Then §4.2: show the owner and stop. |
| R6.9 | Integrate (after the gate only) | §4.4 list first. Move the A3, A4, P3, S4, A5 and P4 markup that R6 owns onto the patterns. |

**Decision points for UX-P-06 (show these at the gate, each with a recommendation):**

| ID | Question | Options | Recommended |
| :---- | :---- | :---- | :---- |
| R6-a | Where does `date-picker` replace the native input? | A: S4 only (the BR-09 case). B: S4 and the Coordinator date fields. | A. The Coordinator fields have no earliest-date rule. |
| R6-b | How does a closed or verified sheet show? | A: the values as text with a `done` stamp. B: disabled fields. | A. Disabled fields still look editable (UX-023). |
| R6-c | How does the verdict panel stay current? | A: refresh every 30 s while mounted, "Updated hh:mm" (plan). B: a Refresh button only. | A, with a Refresh button as well |
| R6-d | Score input | A: a number field with 48 px minus and plus buttons. B: a number field only. | A (UX-025, tablet use) |

**Environment facts:** one `pnpm dev` at a time (§13 R4 and R5 rows). No screenshot batch without the owner (owner rule, §13 R4 preview row): check the lab links as text, then take single shots and look at them. The first dev visit to `/lab/typography` takes about 20 s (12 fonts).

#### 10.6 R6 preview as built (27 Nov 2026)

**Branch:** `ui/r6-forms`, on `8b020e8` and the uncommitted issue #85 fixes. Not committed. No live page changed.

| Task | Pattern | As built | IDs |
| :---- | :---- | :---- | :---- |
| R6.1 | `slot-list` | `SlotList({ label, slots, empty, action? })`. 3 facts: the PHT time range, the place (and the meeting link only when the page passes it), one state pill. "Requested by" or "Confirmed with" names the Student. | UX-039, G5, FR-SCH-03 |
| R6.2 | `date-picker` | `DatePicker({ id, label, name?, earliest, value, onChange, today? })`. An inline month grid, Sunday first. **Change from the R6 table:** `value` and `onChange` use a PHT day string ("yyyy-mm-dd"), not a `Date`, so no day moves across UTC+8, and the hidden input sends the format that `proposeDateAction` reads. Blocked days: `aria-disabled`, focusable, a 2 px strike, linked to "At least 7 days after Gate 1b.". No new package (Base UI 1.9 has no calendar). | BR-09, BR-18, UX-022, R6-a A |
| R6.3 | `defense-form` | `DefenseForm({ rows, mode, onSave, blockedReason?, legend?, children })`. Base UI `NumberField` steppers (48 px minus and plus), inputs named `score_<id>` (fits `saveSheetAction`). The total is the plain sum. "Saved. Sign the paper sheet." in the feedback slot after a save only. `verified` and `closed`: values as text and a `done` stamp, no field. **Change from the R6 table:** no `saved` prop: the pattern shows the line after its own save. `noValidate` on the form (the hidden step=1 input refused 12.5 and blocked the submit; found in the keyboard walk). | FR-DEF-05, BR-01, BR-15, F4, UX-023, UX-025, R6-b A, R6-d A |
| R6.4 | `verdict` | `Verdict({ members, canRecord, recordReason?, recorded?, closed?, updatedAt, onRefresh, onRecord, student? })`. A table of member, total (ink), Action Taken. "n sheet(s) not saved yet." and the "differs" row flag never block. Refresh every 30 s while mounted, a 48 px Refresh button, "Updated hh:mm PHT". Record verdict opens the R3 `ConfirmDialog` (verdict copy). Closed: the recorded verdict as text with a `done` stamp. | FR-DEF-07, BR-17, BR-18, F2, F4, R6-b A, R6-c A |
| R6.5 | `consultation-log` | `ConsultationLog({ rows, empty, action?, caption? })` on `queue-table`, comfortable: Date and time, Place or platform, Topics (one line, full text on hover and focus), Adviser confirmation (pill). | FR-SCH-05, FR-SCH-06 |
| R6.6 | Loading | `LoadingBlocks` shapes `defense` (48 px stepper rows, total, 48 px button) and `slots` (56 px rows). | UX-D-15 |
| R6.7 | Lab | `/lab/patterns/{slot-list,date-picker,defense-form,verdict,consultation-log}`, rows in `_mock/pages.ts` (UX-P-06), `pnpm lab:shots r6`. | — |
| — | `PendingButton` | New size `defense` (48 px). | UX-025 |

**Gaps for R6.9 (integrate):** (1) `defensePage` gives the verdict seat no per-member totals or names; the live verdict panel needs a read-only addition after the same access checks, like `workspaceFor().identity` in R5.9. (2) A4 slot rows need the Student name for a requested or confirmed slot; `listSlots` must give it (read only). (3) The S4 date picker needs the earliest date from the tracker (`keyDates.earliestDefenseDate`). Each needs the owner's approval as a data addition (§2).

**Environment fact:** the running dev server kept the old `loading/index.tsx` after an edit and a `touch`, so the server and the client disagreed (a hydration error on 2 pages). A content change in the file reloaded it. If a `/lab` page shows a hydration error after an edit, change the file again before you look for a bug.

#### 10.7 R6.9 integrate (27 to 28 Nov 2026)

**Data additions approved:** 27 Nov 2026, owner's words "start R6.9", in answer to the question on the 3 read-only additions (§10.6). No server action, route or write changed.

**§4.4 list, before the change.**

| Component | Props and data | Server action and result | Blocked | Loading and error | After R6.9 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `AvailabilityPage` own slots (A4, P3) | `listSlots` rows: time, mode, status, link | `withdrawSlotAction` through `WithdrawButton` | none | none | `SlotList` with `WithdrawButton` as the row action. The Student shows on a requested or confirmed slot (`studentName`, UX-039). |
| S4 "My requests" | `listBookings` | none | none | none | One state word (the booking state); the slot state is gone (UX-039). The markup moves in R7. |
| S4 defense date | native `type="date"` in `ActionForm` | `proposeDateAction` (`date`, yyyy-mm-dd) | "Locked until Gate 1b." or "A date is proposed already." | the `ActionForm` slot | `DefenseDateField` (`date-picker`, R6-a A) with `studentTracker().keyDates.earliestDefenseDate`; the same field name and action. Blocked: no calendar, the button shows its reason. |
| `ScoreSheet` and the sheet `ActionForm` (A5, P4) | `defensePage().rubric`, `own` | `saveSheetAction` → `Result`; refresh on ok | `editBlock` | the `ActionForm` slot | `DefenseSheet` (`defense-form`): verified or closed as text (R6-b A), else the form with `editBlock` as the reason; refresh on ok. TDW 10 (comments only, no scores) keeps `ActionForm` until R7. The header line "Encode your own sheet and sign the paper …" is removed (G4: the paper line shows after the save). |
| Verdict `ActionForm` and `FlagBanner` (P4) | `attempt.verdict`, `warnings`, `verdictBlock` | `recordVerdictAction` through `ConfirmDialog` (R3.10) | `verdictBlock` | the `ActionForm` slot | `VerdictPanel` (`verdict`) with `defensePage().members` (verdict seat only), the same action through `ConfirmDialog`, refresh every 30 s and on Refresh, read only after the scheduled state. "Mark the defense held" stays `ActionForm`. |
| A3 TDW 03 log | `listLogEntries` | `confirmLogAction` | "The Student adds the topic first." | the `ActionForm` slot | `ConsultationLog` table for every entry, then "Entries to confirm" with the same forms. **For the owner at R7:** a confirmed entry's recommendations show in the Topics cell (the approved columns have no Recommendations column). |

**Data (read only, with tests):**

| Function | Addition | Access | Tests |
| :---- | :---- | :---- | :---- |
| `defensePage` | `members`: each expected member's name, designation (Adviser, Lead Panel Member, Panel Chair, Panel Member), total (plain sum), Action Taken, `differs` | The verdict seat only; `[]` for every other actor | `defense.test.ts`: the seat gets 3 rows with the right values; the Panel Chair seat, the Adviser and the Student get `[]` |
| `listSlots` | `studentName` for a pending or confirmed booking | The slot owner only; `null` for the Student and for a declined booking | `consultations.test.ts` |
| S4 page | calls `studentTracker` (existing, with its own checks) for `earliestDefenseDate` | — | — |

**Live check (dev server, saved sessions):** A4, P3, S4 and A3: HTTP 200, no console error. A4 shows "Confirmed with Fake Student" (UX-039). The first S4 visit with the 23 Nov student session threw "Cookies can only be modified in a Server Action or Route Handler" once; the next visits of S4, S1 and PROCESS loaded clean (a session refresh during render, not this change). Not checked live: the S4 calendar (no thesis past Gate 1b in the dev data), A5 and P4 (no defense in the dev data, UX-X-06: no re-seed). The `/lab` walk covers those patterns.

**Left for R7 and R8:** the S4 open-slot request forms and "My requests" rows on `slot-list`; TDW 10 on a comments pattern; `score-sheet.tsx` has no caller now (remove at R8).

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
| 25 Nov 2026 | 2 (Task 2.1) | Uncommitted | Pass (0 errors, the same 1 warning) | Pass | Pass (65 files, 631 tests) | Pass (20, `E2E_PORT=3100`; `/lab` is 404) | Pass | `pnpm lab:shots lab`: 11 shots, light and dark | Not run (R1.1) | Not run | Pass (no animation) | Not run | Dark shows the old shadcn values until R1.1 |
| 25 Nov 2026 | R1 (build preview) | Uncommitted | Pass (0 errors, the same 1 warning) | Pass | Pass (70 files, 835 tests) | Not run (no live page changed; runs at R1.5) | Pass (compiled CSS has the dark set) | `pnpm lab:shots r1`: 110 shots, 0 errors | Pass (light and dark, `contrast.test.ts`) | Not run (at the gate) | Pass (reduced-motion pass) | Not run (package not approved) | Light look pixel-identical. Button `link` variant now uses `--link` (same color in light). |
| 26 Nov 2026 | R1.5 (integrate) | `c7ddc09` + uncommitted (`ui/r1-integrate`) | Pass (0 errors, the same 1 warning) | Pass | Pass (71 files, 874 tests; `brand-tokens.test.ts` merged into `tokens.test.ts`) | Pass (23, `E2E_PORT=3100` on the new build, with 3 new theme tests) | Pass | Before and after of LOGIN, S1, A1, P1, C1 (`ui-shots/r1.5-before/`, `ui-shots/r1.5-compare/`). `LAB_LIVE=1` audit: 356 shots, light and dark, 5 viewports (`ui-shots/r1.5-live/`). Only known errors: C10 and PROCESS 404 (no route yet), P2 storage 404 (UX-009 demo commit). | Pass (light and dark, `contrast.test.ts`) | Probe on LOGIN and S1, both themes: every stop has a 2 px solid outline and the soft ring. The maroon "Sign in" button shows a maroon outline, not gold (§10): note for R7. No skip link yet (R2). | Pass (reduced-motion pass) | Not run (package not approved) | Every screen renders in dark with readable text. For R7: blocked buttons faded with `opacity-60` read weaker in dark (UX-008); the outline `Button` keeps shadcn `dark:` classes; "PST" labels (UX-021). |
| 26 Nov 2026 | R2 (preview and R2.8 integrate) | `9d663dd` + uncommitted (`ui/r2-shell`) | Pass (0 errors, the same 1 warning) | Pass | Pass (77 files, 963 tests) | Pass (27, `E2E_PORT=3100`, with 4 new shell tests) | Pass | `pnpm lab:shots r2`: 121 shots, 0 errors. `LAB_LIVE=1` audit: 352 shots, light and dark (`ui-shots/r2-live/`). Only known errors: C10 and PROCESS 404, P2 storage 404. | Pass (`contrast.test.ts`) | e2e `shell.spec.ts`: skip link first, Escape closes the sheet and the drawer, focus returns | Pass (reduced-motion pass) | Not run (package not approved) | A first full unit run under load (screenshots in parallel) had 4 data-layer timeouts; alone it passes. UX-D-16 addition (fixed-height slot): 77 files, 969 tests; e2e 27; `lab:shots r2` 121 shots, 0 errors; before and after in `ui-shots/r2-feedback-compare.png`. |

| 26 Nov 2026 | R3 (build preview) | `b72ff4a` + uncommitted (`ui/r3-patterns`) | Pass (0 errors, the same 1 warning) | Pass | Pass (84 files, 1030 tests; run alone) | Pass (27, `E2E_PORT=3100` on the new build; the top bar now imports `SheetPopup` from `side-sheet`) | Pass | `pnpm lab:shots r3`: 242 shots, 0 console errors, all HTTP 200 (`ui-shots/r3/`) | Not run again (no color token changed; `--scrim` is a backdrop) | Playwright walk of the 7 `/lab` pages: 33 of 33 checks (sort headers and `aria-sort`, row actions, blocked reason on focus, long title on focus, 48 px compact rows, KPI links, inbox list, dialog focus start A and B, focus trap, Escape, focus return, composer Escape and focus return, no layout move, sheet trap and focus return, field error link) | Pass (reduced-motion pass in `lab:shots`) | Not run (package not approved) | New R3-i (blocked action in a compact row). No live page changed except the top-bar import. After feedback passes 1 and 2 (collapsible groups, column widths, option-B pages removed): test 84 files, 1034 tests; walk 36 of 36; `lab:shots r3` 176 shots, 0 console errors, all HTTP 200. |
| 26 Nov 2026 | R3.10 (integrate) | `020802c` + this commit (`ui/r3-patterns`) | Pass (0 errors, the same 1 warning) | Pass | Pass (85 files, 1053 tests, run alone, before the Gate 1b label fix; after it only `dialog`, `form-contract` and `milestones` data tests ran: all pass) | Pass (28, `E2E_PORT=3100` on the production build, with the new confirm-dialog test; blocked path only, see §10.2 gaps) | Pass | `LAB_LIVE=1` audit into `ui-shots/r3-live/`: **stopped by the owner after 80 shots** (desktop light and dark, part of laptop light). "Saved" is not "passed": many pages show errors (missing routes; dev server error screens, because files changed during the run). The full audit is deferred to R7d (§4.5.1); these 80 shots are not evidence. | Not run again (no color token changed) | Production walk of C2 and C4: labels, 44 px and 36 px fields, linked hints, 40 px slots, solid outlines (except the Chrome calendar button in the date field, as before), a blocked Verify takes focus and opens no dialog. No live dialog walk (no open permanent action in the dev data). | Not run (shots stopped) | Not run (package not approved) | Gate 1b: owner kept "Endorse and lock manuscript" and asked to fix the mismatch: new read-only `gate1bLocksOnEndorse`. |
| 26 Nov 2026 | R4 preview (R4.1 to R4.5) | `8a24508` (`ui/r4-student`, on `a140e36`) | Pass (0 errors, the same 1 warning) | Pass | Pass (88 files, 1083 tests, run alone). The new R4 tests failed first with the patterns removed. | Not run (no live page changed) | Not run (no live page changed) | `pnpm lab:shots r4` **stopped by the owner** after 69 of 110 shots: not checked, not evidence. Owner, 26 Nov 2026: take shots only when the right interface is sure. Instead: a text check of the 10 R4 page links on the dev server (HTTP 200, the expected content, no error overlay) and 4 single shots that I looked at (PROCESS at 1280 px and 390 px, task list, step-by-step). | Not run (no color token changed; tone tokens only) | Pass (`/lab`, DOM checks): group and step buttons reachable in order, 2 px solid outline, Enter and Space toggle `aria-expanded` and the region, "Show all steps" opens 4 of 4, `<details>` opens from the keyboard | Pass (chevron transition 0 s with `reducedMotion: "reduce"`) | Not run (package not approved) | The dev server kept an old `loading/index.tsx` after an in-place Python write (HTTP 200 with an error overlay). An edit with the Edit tool reloaded it. The 390 px shot showed the stepper past the right edge: PROCESS hides it below 640 px. |
| 26 Nov 2026 | R4.6 (integrate) | `f4f9ded` (`ui/r4-student`) | Pass (0 errors, the same 1 warning) | Pass | Pass (89 files, 1086 tests, run alone, before and after the S3 `cn()` fix) | Pass (32, `E2E_PORT=3100` on the production build, with the 4 new PROCESS role tests; run again after the fix: 32 pass) | Pass | No batch (owner rule, §13 R4 preview row). Live check on the production build, student session: PROCESS and S3 in light and dark, HTTP 200, no console error, DOM content as expected; 1 shot of each in light that I looked at. It found the S3 border defect, now fixed and checked again. | Not run (no color token changed) | Not run again on the live pages (the `/lab` walk covers the same patterns) | Not run on the live pages | Not run (package not approved) | `GET /forms/TDW-07.doc`: 200, `application/msword`. |
| 26 Nov 2026 | R5 preview (R5.1 to R5.8) | Uncommitted (`ui/r5-workspace`, on `86738b9`) | Pass (0 errors, the same 1 warning) | Pass | Pass (95 files, 1144 tests, run alone). The new R5 tests failed first (no pattern yet). | Not run (no live page changed) | Pass (production build, before the last pattern fixes; `/lab` is 404 there by design) | No batch (owner rule). Text check of 24 `/lab` links on the dev server: HTTP 200, the expected content, no error text. 1 shot of each page that I looked at (6 pages; the workspace as S2, A2 and P2; 800 px with R5-a A and B). | Not run (no color token changed) | Pass, 21 of 21 (Playwright on `/lab`): feed tabs (arrows, Home, End), Reply open, focus, Escape, focus return, pending, "p. 14" link (B) and in place (A, clamped, focus on the page), gate dialog focus on Cancel, Escape, focus return, blocked gate opens nothing, Return composer focus and Escape, Page Up, Page Down, Home, End, white page in dark, load error with no page controls, 800 px tabs and side sheet | Not run (no batch) | Not run (package not approved) | The old dev server on port 3000 (not started by me) logs `EPIPE` errors and compiles the viewer chunk slowly; it works after a wait. |
| 26 Nov 2026 | R5 feedback pass 1 | Uncommitted (`ui/r5-workspace`) | Pass (0 errors, the same 1 warning) | Pass | Pass (95 files, 1144 tests, run alone) | Not run (no live page changed) | Not run again | Text check of 21 `/lab` links: HTTP 200, the expected content, no `sticky` or `fixed` class in the workspace. 2 shots that I looked at (S2 working at 1280 px, S2 first day at 800 px). | Not run (no color token changed) | Not run again (the removed options had their own checks; the kept paths did not change) | Not run | Not run (package not approved) | Upload not sticky; options not chosen removed. |
| 26 Nov 2026 | R5.9 (integrate) | `eff07da` + uncommitted (`ui/r5-workspace`) | Pass (0 errors, the same 1 warning) | Pass | Pass (95 files, 1159 tests, run alone). The new contract, title and identity tests failed first. | Pass (32, `E2E_PORT=3100` on the production build) | Pass | No batch (owner rule). Live check on the production build with the saved sessions: S2, A2 and P2 HTTP 200, no console error, one shot of each that I looked at. Forms on the contract, blocked reasons shown. P2 demo commit has no stored file (known since R1.5): the error shows, "Try again" fails, then "If it still does not load, ask the Student to upload it again." shows and the page controls stay hidden. | Not run (no color token changed) | Not run on the live forms (no open action in the dev data); the `/lab` walk covers the patterns | Not run | Not run (package not approved) | Gate 1a dialog title fixed ("the manuscript", not "the proposal"). |
| 27 Nov 2026 | R6 preview (R6.1 to R6.7) | Uncommitted (`ui/r6-forms`, on `8b020e8`) | Pass (0 errors, the same 1 warning) | Pass | **Part only:** the 5 new R6 test files, `states`, `contrast`, `patterns`, `form-contract`, `commit-selector` (10 files, 218 tests, all pass). The new R6 tests failed first (no pattern yet). The full run is not done. | Not run (no live page changed) | Not run | No batch (owner rule). The 5 pages on the dev server: HTTP 200, no console error. One viewport shot of 4 pages that I looked at; it found the hidden strike on the mono digits 3 to 6 (fixed: text font, 2 px strike). | Not run (no color token changed) | Pass, 15 of 15 (Playwright on `/lab`): date grid focus start, arrows, Home, PageDown, Enter on a blocked day does nothing, Enter chooses, hidden input value, solid focus outline; stepper + and the total, 48 px stepper, Save then the paper line; verdict dialog title, focus on Cancel, Escape and focus return, a blocked Record verdict opens nothing | Not run | Not run (package not approved) | The walk found the `noValidate` bug in `defense-form`. |
| 28 Nov 2026 | R6.9 (integrate) | This commit (`ui/r6-forms`, on `8b020e8`) | Pass (0 errors, the same 1 warning) | Pass | **Pass (full run: 100 files, 1212 tests).** The new `defensePage` members and `listSlots` names tests failed first. `form-contract`: the Record verdict check now follows the `verdict` pattern (same rule: the action runs only from the `ConfirmDialog`). | Pass (32, `E2E_PORT=3100` on the production build) | Pass (inside `test:e2e`) | No batch (owner rule). Live on the dev server with the saved sessions: A4, P3, S4, A3 HTTP 200, no console error; one A4 shot that I looked at (UX-039 fixed). A5 and P4 not reachable (no defense in the dev data). | Not run (no color token changed) | The `/lab` walk (R6 preview row) covers the patterns; not run on the live pages | Not run | Not run (package not approved) | One-time S4 cookie error with the old student session (§10.7). |
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
