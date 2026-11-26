# UI/UX audit

**Status:** Stage 1 done (25 Nov 2026). Tasks 1.1 to 1.7 of `IMPLEMENTATION_PLAN.md` filled this file. §3.1 to §3.5 started as a code snapshot (it was `design/INVENTORY.md`). Task 1.3 checked each row again.
**Baseline:** `DESIGN.md` v0.3 (v0.2 plus UX-D-01 to UX-D-05). This file holds findings and evidence only. It holds no rules.
**Sources (do not copy them here):** `DESIGN.md`, `design/screens/<ID>.md`, `spec/SITEMAP.md` (screen inventory), `spec/USERFLOW.md` (flow inventory), `AGENTS.md`.

---

## 1. Scope and method

- **Scope:** all 31 routes in `spec/SITEMAP.md`, all flows in `spec/USERFLOW.md`, both themes, and the viewports in §1.2.
- **Order:** 5 layers. Foundations (§2), components (§3), role layouts (§4), screens (§5), flows (§6). Fix a problem at the lowest layer where it occurs.
- **Evidence:** a route, a file and line, a screenshot path in `ui-shots/` (git-ignored), or steps to reproduce. Write "Observed" or "Hypothesis" on each finding. Do not invent a finding.

### 1.1 Finding format

Each finding has one row in the table of its layer.

| Field | Content |
| :---- | :---- |
| ID | `UX-nnn`, in order, never reused |
| Where | Screen ID or pattern name, and the file |
| Role | Student, Adviser, Panel Member, Coordinator, or All |
| Issue | What happens. Observed or Hypothesis. |
| Why it matters | The user effect, or the rule ID it breaks (G1 to G10, F1 to F5, BR, FR, WCAG) |
| Evidence | Route, `file:line`, screenshot, steps |
| Severity | Critical, High, Medium, Low |
| Score | Weighted score (§1.3) |
| Fix | The recommended change and the round in `IMPLEMENTATION_PLAN.md` |
| Kind | Presentation only, or Behavior. A Behavior finding needs the owner's approval before a fix. |

### 1.2 Viewports and themes

| Name | Size | Note |
| :---- | :---- | :---- |
| desktop | 1440 × 900 | Main target |
| laptop | 1280 × 800 and 1024 × 768 | 1024 is the `laptop` breakpoint (`DESIGN.md` §5.6). The tool calls 1024 × 768 `laptop-sm`. |
| tablet | 768 × 1024 | Sidebar drawer, 44 px targets |
| phone | 390 × 844 | Read only (D-12). Check that nothing breaks. |

Check each screen in light and dark, and with `prefers-reduced-motion: reduce`.

### 1.3 Priority

Score each factor from 0 to 5, then add the weighted values: user impact 30%, workflow and functional safety 25%, accessibility 20%, visual consistency 15%, technical quality 10%. The score is out of 5.00.
**Severity from the score:** High 3.00 or more, Medium 2.00 to 2.99, Low below 2.00. A WCAG AA failure or a break of an AGENTS.md §8 term is Medium at least.
**Warning:** a security, permission, data or workflow regression is Critical at any score. Report it to the owner at once.

### 1.4 How Stage 1 ran (25 Nov 2026)

| Item | Value |
| :---- | :---- |
| Branch | `feat/design-system-inventory` (PR #81 is still open, so the plan says to work here) |
| App | Production build (`pnpm build && pnpm start -p 3100`). The dev server could not render S2, A2, P2 and SV (UX-037). |
| Data | The Neon dev branch in `.env.local`, as the demo seed (`tests/demo/seed-demo.test.ts`) left it. The sign-ins `student@`, `adviser@` and `panel@example.test` point to the fake thesis that is furthest along (Milestone 3 open, Pre-Final closed). `pnpm db:seed-dev` was not run (UX-X-06). |
| Tool | `LAB_LIVE=1 LAB_THEMES=light LAB_PORT=3100 LAB_CORS_RELAY=1 LAB_MILESTONE_ID=<pre-final id> LAB_DEFENSE_ID=<pre-final defense id> pnpm lab:shots audit` |
| Shots | 192 route shots in `ui-shots/audit/` (32 route checks × 5 viewports, plus a reduced-motion pass at desktop), 5 focus close-ups (`focus-*.png`), 5 flow shots (`flow-booking-*.png`). `ui-shots/audit/manifest.jsonl` holds the final URL, HTTP status and console errors of each shot. |
| Dark | Not built. Every dark cell in §5 says "Not built". |
| Not done | No screen-reader pass. No axe run (the package needs the owner, `DESIGN_DECISIONS.md` §4). Only one flow was walked live (§6). |

---

### 1.5 Live screenshots in later rounds (26 Nov 2026)

The Stage 1 screenshots (`ui-shots/audit/`) stay the baseline. The owner deferred the next full live audit to R7d, when every sitemap route exists. Until then, each round shoots only the screens it changed, on the production build. The schedule and the run rules are in `IMPLEMENTATION_PLAN.md` §4.5.1.

- A shot that Playwright marks "ok" only means the picture was saved. Check the HTTP status and the console errors in `manifest.jsonl` before you use a shot as evidence.
- The R3.10 live run (`ui-shots/r3-live/`, 80 shots, stopped) is not evidence: it ran on the dev server while files changed.

## 2. Layer 1: design foundations

Facts known on 25 Nov 2026 (checked again in Task 1.2, all still true):

- All tokens are in `src/app/globals.css`. `src/styles/tokens.css` does not exist.
- `globals.css` holds the shadcn default `.dark` block (grey `oklch` values, a blue sidebar primary). No code sets the `.dark` class. These values are not the brand palette.
- The comment "D-01 and D-02 are still [CONFIRM]" in `globals.css` is out of date. Both are closed.
- `--radius-panel` must become `--radius-card` (`DESIGN.md` §12.1).
- The pattern tokens of `DESIGN.md` §12.4 are missing.
- `src/app/layout.tsx` loads Source Serif 4, IBM Plex Sans and IBM Plex Mono with `next/font`.
- The CSP in `next.config.ts` is only `frame-ancestors 'none'`, so an inline theme script works.
- No raw hex color exists outside `globals.css` (Grep, 25 Nov 2026). 14 raw palette classes (`bg-neutral-100`, `text-maroon-600` and others) are in components. They change nothing in light, but they will not follow a dark theme. R1.5 fixes them.
- Only `src/components/ui/button.tsx` uses `dark:` classes (3).

| ID | Where | Role | Issue | Why it matters | Evidence | Severity | Score | Fix | Kind |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| UX-001 | Focus ring: `Button`, sidebar links, top-bar summaries, Coordinator fields | All | Observed. A focused button, link or Coordinator field shows no focus indicator. The classes are `outline-none … focus-visible:outline-2`. In Tailwind v4, `outline-none` sets `--tw-outline-style: none`, and `outline-2` reuses that variable, so no line is drawn. | Keyboard users cannot see where they are. WCAG 2.4.7 (AA). `DESIGN.md` §10: "Never remove the focus outline". | `src/components/ui/button.tsx:7`, `src/app/coordinator/_lib/form-parts.tsx:10`, `src/components/app-shell.tsx:38`, `:48`, `src/components/nav-links.tsx`. Computed style while focused: `outline-style: none`. `ui-shots/audit/focus-login-signin-button.png`, `focus-sidebar-link.png`, `focus-coord-input.png` | High | 3.55 | **Fixed 25 Nov 2026 in Round H (UX-D-07), not committed.** Add `focus-visible:outline-solid` (or a focus token) in each place. R1 (R1.1 focus token, R1.4 patterns). A one-class hotfix is possible before R1 (§3 of the plan, Round H). | Presentation |
| UX-002 | Native inputs, selects, text areas, `<summary>` with no own focus style | All | Observed. They fall back to the base rule `* { outline-ring/50 }`: a 1 px `auto` ring in maroon at 50% alpha. Hypothesis: the ring has less than 3:1 on white (estimate about 2.9:1). | WCAG 2.4.7 and 1.4.11. `DESIGN.md` §10 asks for a 2 px maroon outline with a 2 px offset. | `src/app/globals.css` (`@layer base`, `outline-ring/50`), `src/app/_components/action-form.tsx:78` (`inputClass` has no focus classes). `ui-shots/audit/focus-login-email.png` | Medium | 2.80 | One focus rule for all form controls, from a token. R1.1 and R3 (form field). | Presentation |
| UX-003 | LOGIN inputs | Public | Observed. The inputs use `border` with the default color `--border` (`#E7E1E1`) on `#FAF8F8`. The edge is about 1.2:1. | WCAG 1.4.11 asks for 3:1 for an input edge. `DESIGN.md` §6.1: inputs use `neutral-500`. | `src/app/(auth)/login/login-form.tsx:18`, `:27`, `:49`. `ui-shots/audit/LOGIN-desktop-light.png` | Medium | 2.45 | Use `border-input`. R1.5 (one-class change), then R7d LOGIN. | Presentation |
| UX-004 | Page titles | All | Observed. 19 `h1` elements use IBM Plex Sans `text-2xl` (24 px). `DESIGN.md` §4.1 asks for Source Serif 4 at 28/36. Only the wordmark uses the serif. | The title scale and the "ledger" voice of the design are missing on every screen. | `grep '<h1 className="text-2xl font-semibold"'` (16), `text-xl` (1), `text-lg` (1) | Low | 1.40 | A `title` token and one page-header pattern. R1, applied in R7. | Presentation |
| UX-005 | Type scale | All | Observed. Sizes outside `DESIGN.md` §4.1: `text-lg` 18 px (20 uses), `text-3xl` 30 px (1), `text-[11px]` on the notification badge (below the 12 px caption). | One scale makes hierarchy predictable. | `grep text-lg src`, `src/components/notification-panel.tsx:19` | Low | 1.15 | Map to `heading` (20) and `subheading` (16). R1 tokens, R7 pages. | Presentation |
| UX-006 | Content width | All | Observed. Pages use five widths: `max-w-[1200px]` (13), `max-w-[960px]` (15), `max-w-[72ch]` (18), `640px` (4), `720px` (1). S1, A1 and C1 fill the content area. S3 to S6, A3 to A5 and P4 sit in a 960 px column with a left offset. | The content jumps sideways between screens of one role. `DESIGN.md` §5.1: content maximum 1200 px, one gutter rule. | `ui-shots/audit/S1-desktop-light.png` and `S3-desktop-light.png` | Low | 1.40 | The content region of the `app-shell` pattern sets the width. Reading text keeps 72ch inside it. R2. | Presentation |
| UX-007 | Token layer | All | Observed. See the fact list above: no `tokens.css`, the grey shadcn `.dark` block, the old comment, `--radius-panel`, no pattern tokens. | `DESIGN.md` §7.1, §12. Dark mode (UX-D-01) needs semantic tokens first. | `src/app/globals.css` | Low | 1.15 | R1.1 as planned. | Presentation |
| UX-008 | Disabled primary buttons | All | Observed. A blocked primary button keeps the maroon fill at 60% opacity. C6 shows 4 such buttons in one region (3 × "Scan matches", "Close the stage"). | G8: maroon marks the thing to do now. A pink-maroon button reads as available. G1: one maroon button in each region. | `src/components/ui/button.tsx:7` (`aria-disabled:opacity-60`). `ui-shots/audit/S2-desktop-light.png`, `S4-…`, `C6-…`, `P4-…` | Medium | 2.40 | `BlockedAction` shows a blocked primary as a neutral button with the reason. R1.4. | Presentation |

---

## 3. Layer 2: component inventory and gaps

Snapshot of 25 Nov 2026, checked against `DESIGN.md` §7.4. Task 1.3 checked each row again on 25 Nov 2026. Changes are marked "(1.3)".
**Key:** Built = follows `DESIGN.md` and only needs to move into a pattern folder. Partial = parts are missing. Missing = no code. Decided = it was blocked, and `DESIGN_DECISIONS.md` now settles it.

`src/components/patterns/` does not exist. No component has a `// Source:` comment or a props contract yet.

### 3.1 Base and shell

| Pattern | Today | Status | Gap | Round |
| :---- | :---- | :---- | :---- | :-- |
| `glyphs` | None. Lucide everywhere. | Missing | 22 glyphs from `design/mockups/coordinator-mockups.html`. Sidebar glyphs (D-07) and 3 status glyphs (D-06) are not drawn. | R1 |
| `status` (pill, stamp, chip) | `src/components/status/*`, `tone-icon.tsx` | Partial (1.3) | Move it. Pill glyphs are decided in R2 (D-06). Dark tone values. (1.3) The stamp stretches to the row width (UX-015). Raw codes reach the stamp and other labels (UX-016). | R1, R2 |
| `blocked-action` | `src/components/action-button.tsx` (`aria-disabled`) | Partial | `return` and `text` variants, `compact` and `defense` sizes, the `lock` glyph on the reason. (1.3) Blocked primary look (UX-008). The reason repeats on every control (UX-024). | R1 |
| `flag` | `FlagBanner` in `src/components/banners.tsx` | Partial | Compact mode: a glyph in the row, the text in a tooltip | R1 |
| `empty-state` | `src/components/empty-state.tsx` | Built | Move it. Contract: `title`, `body`, `action`. (1.3) Today the props are `title` and `detail`. | R1 |
| `identity-line` | Inline in S1 and the workspace header | Missing | Serif title, degree label, Adviser, committee. (1.3) S1 shows "Your thesis", not the title. The workspace header names no Student (UX-030). | R1 |
| `docket` | `src/components/docket.tsx` ("Nothing blocks this step.") | Partial | "Step n of 4", form link, process link. (1.3) The first-step line sits under the Docket, not in it (UX-031). | R1 |
| `stepper` | `src/components/milestone-stepper.tsx` | Partial | `lock` glyph in place of the Lucide lock. Compact mode. | R1 |
| `theme-toggle` | None | Missing | Light, dark, system. New with UX-D-01. | R1 |
| `app-shell` | `src/components/app-shell.tsx` | Partial | Skip link (§10). `rounded-panel` → `rounded-card`. Top-bar panels (D-08). (1.3) No `id` on `<main>`. The tablet menu is a `<details>` popover with no focus trap or Escape. Below 640 px the role label hides and the wordmark wraps (UX-029). Content width (UX-006). | R2 |
| `sidebar` | `src/components/nav-links.tsx`, items in `src/app/_components/role-shell.tsx:14` | Partial | Locked items with the reason on `aria-describedby`. Items and order from `design/screens/README.md`. (1.3) Each role lists only its open routes (UX-027). | R2 |
| `toast` | None | Decided | Base UI Toast, 4 s, `role="status"` (UX-D-04) | R2 |
| `loading` and `error` | `src/app/_components/page-loading.tsx` only | Partial | Loading blocks of the content's size, inline error with "Try again" (UX-D-04). (1.3) Loading is one "Loading…" line. No route has an `error.tsx` (UX-026). | R2 |

### 3.2 Queues, inbox and dialogs

| Pattern | Today | Status | Gap | Round |
| :---- | :---- | :---- | :---- | :-- |
| `queue-table` | Own `<table>` on 9 pages. `th` and `td` strings in two copies: `src/app/_components/dash.tsx:13` and `src/app/coordinator/_lib/page-header.tsx:21` (1.3) | Missing | 48 px and 56 px rows, fixed columns, equal row actions, cut text with a tooltip, `aria-sort`. (1.3) Headers are uppercase, with no `scope` (UX-014). | R3 |
| `kpi-strip` | (1.3) C1 shows 7 counts with labels in one card | Partial (1.3) | Glyph, oldest age "6d", late state, muted 0 (UX-033) | R3 |
| `inbox` | None. C4 is a Student chooser, then a list. | Missing | 300 px / flexible / 300 px grid | R3 |
| `return-composer` | A reason box next to the C4 buttons | Missing | "Reason for return". "Send return" blocked with "Write a reason first". No preset reasons. | R3 |
| `dialog` | None. The app has no dialog (Grep: no `role="dialog"`, `<dialog>` or `confirm(`). | Missing | Focus trap, Escape, focus return. "Verify {form} for {Student}?" (1.3) Permanent actions run on one click today (UX-010). | R3 |
| `side-sheet` | None. Forms are inline. | Missing | Primer side sheet for C2, C3, C8, C9, A4, P3 | R3 |

### 3.3 Student path

| Pattern | Today | Status | Gap | Round |
| :---- | :---- | :---- | :---- | :-- |
| `task-list` | Own lists on S1, S3, S6 | Missing | Groups, one stamp for each item, reason, actions, collapsed groups. (1.3) S3 has no "Download form" (UX-032). | R4 |
| `step-by-step` | None | Missing | "You are here", one expanded step, done glyphs | R4 |
| Route `/student/process` | None (in `spec/SITEMAP.md`). Returns 404 (1.3). | Missing | Student only. Panel Member count follows the degree level (G2). | R4 |

### 3.4 Manuscript workspace

| Pattern | Today | Status | Gap | Round |
| :---- | :---- | :---- | :---- | :-- |
| `workspace` | `src/app/_components/pr-workspace.tsx` (one large server component) | Partial | Split into the patterns below. (1.3) The header names the milestone only, not the Student or the thesis (UX-030). | R5 |
| `merge-box` | Ready button inline | Missing | One sentence, one action, the locked reason | R5 |
| `gate-box` | Endorse buttons inline | Missing | Check list. The gate opens only when all checks pass. Return is never solid red (F3). | R5 |
| `thread-feed` | Inline | Partial | Open, All, Resolved tabs. Amber edge on own open threads. "p. N" link exists (D-26). | R5 |
| `commit-selector` | Version links inline | Partial | `v3` in mono, short hash, date, uploader, Ready pill | R5 |
| `pdf-viewer` | `src/components/pdf-viewer.tsx`, `src/app/_components/pdf-pane.tsx` | Partial | Locked banner (§8.6), Page Up and Page Down. The page stays light in dark mode. (1.3) A load failure crashes the whole page (UX-009, Critical). | R5 (hotfix first) |

### 3.5 Forms, defense and records

| Pattern | Today | Status | Gap | Round |
| :---- | :---- | :---- | :---- | :-- |
| `slot-list` | `src/app/_components/slot-list.tsx` | Partial | Move it. Check it against S4, A4, P3. (1.3) A confirmed slot does not name the Student on A4 (UX-039). | R6 |
| `date-picker` | Native date and `datetime-local` inputs | Missing | Days before the earliest date blocked with "At least 7 days after Gate 1b." (BR-09). (1.3) The native input shows `mm/dd/yyyy` (UX-022). | R6 |
| `defense-form` | `score-sheet.tsx`, `defense-day.tsx` | Partial | 48 px steppers, total as a number, no color on scores (F4), "Saved. Sign the paper sheet." (1.3) A closed defense still shows editable fields (UX-023). Buttons are 36 px (UX-025). | R6 |
| `verdict` | In `defense-day.tsx` | Partial | Missing sheet is a flag, not a block (F2). Refresh every 30 s, "Updated hh:mm". | R6 |
| `consultation-log` | A3 page markup | Partial | Carbon-style table on `queue-table` | R6 |

### 3.6 Generic controls (retrofit plan §12, Layer 2)

Checked in light only (dark is not built). "States" lists what Task 1.3 saw: default, hover, focus, active, disabled with a reason, loading.

| Control | Today | Used on | Status | Gap |
| :---- | :---- | :---- | :---- | :---- |
| Button and icon button | `src/components/ui/button.tsx` (shadcn base-nova on Base UI), `ActionButton` for blocked actions | All screens | Partial | Focus: none (UX-001). Blocked primary keeps maroon (UX-008). Loading: label "Saving…" with native `disabled` (it leaves the tab order). Sizes `xs`, `sm`, `lg` are not in `DESIGN.md` §8.3. `destructive` variant exists but F3 allows no destructive button. |
| Input, textarea, select, checkbox, radio, switch | Native elements with three class sets: `inputClass` and `areaClass` (`src/app/_components/action-form.tsx:78`), `fieldClass` (`src/app/coordinator/_lib/form-parts.tsx:9`), inline on LOGIN | All forms | Partial | Three styles (UX-013). Focus too faint or none (UX-001, UX-002). LOGIN edge contrast (UX-003). Native date inputs (UX-022). No checkbox, radio or switch pattern. |
| Form field, helper text, validation message | `Field` in two copies (`action-form.tsx`, `form-parts.tsx`), two `ActionForm` copies | All forms | Partial | Hints and errors are not linked with `aria-describedby` (UX-012). Two feedback behaviors (UX-011). |
| Tabs | None | — | Missing | The thread feed (R5) and the tablet workspace need tabs. |
| Menu, popover, tooltip | `<details>` in the top bar (menu, notifications, user menu). No tooltip. | Top bar, LOGIN "Forgot password", S3 advising forms, C4, C5 | Partial | No Escape, no outside click, no focus return. No tooltip exists, so G5 "details on demand" and the locked-item reasons have no control (D-08). |
| Pagination, sort, filter, search | None | — | Missing | No list sorts or filters. The top-bar search of `DESIGN.md` §5.1 is absent (D-08). |
| Upload and progress | `src/app/student/documents/scan-uploader.tsx`, `src/app/_components/commit-uploader.tsx` | S2, S3, C6 | Partial | Hidden file input (1 × 1 px) behind a button. Upload labels repeat the full form name ("Upload Panel on Oral Defense Appointment and Acceptance Form"), so widths vary. Not walked live (a real upload writes a write-once key). |
| Skeleton and progress | `src/app/_components/page-loading.tsx` | All `loading.tsx` | Partial | One text line, no blocks (UX-026) |

**Pattern candidates (Task 1.3, not added to the registry):** a form field (label, control, hint, error) built in three places, and a page header (title, helper line, status) built in each page. The owner decides at the R3 gate whether they become patterns.

### 3.7 Findings

| ID | Where | Role | Issue | Why it matters | Evidence | Severity | Score | Fix | Kind |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| UX-009 | `pdf-viewer` (S2, A2, P2) | Student, Adviser, Panel Member | Observed. When the PDF does not load, the whole page changes to Next's "This page couldn't load". The threads, the gate actions and the navigation go away. Cause (confirmed in code): react-pdf 11 sets `suspense = true` by default, so a load error is thrown to the nearest error boundary. `PdfViewer` sets no `onLoadError`, and no route has an `error.tsx`. Hypothesis (not tested): signed read links last 300 s, and pdf.js asks for page ranges later with the same link, so turning a page after 5 minutes can cause the same crash. | A broken workflow: a reviewer loses the page and any comment not yet posted. Storage outages, expired links or a missing file all end in a full crash. | `/panel/pr/4dfb2742-…` with the demo data (the commit has no file: storage 404). `ui-shots/audit/P2-desktop-light.png`, `manifest.jsonl` (`pageerror`). `src/components/pdf-viewer.tsx:26`, `node_modules/react-pdf/dist/Document.js:113` (`suspense = true`), `src/server/files/storage.ts:11` (`LINK_SECONDS = 300`) | **Critical** | 3.70 | **Fixed 25 Nov 2026 in Round H (UX-D-06), not committed.** Hotfix before R1 (Round H): an inline error in the viewer with "Try again" that asks for a new signed link, and `onLoadError`. R5 makes it the `pdf-viewer` error state. | Behavior (error handling). Needs the owner's approval. |
| UX-010 | Permanent actions: Endorse (Gate 1a, Gate 1b), Approve (Gate 2), Record verdict, "Scan matches" on C6, Verify on C4, Close the stage | Adviser, Panel Member, Coordinator | Observed. Each runs on one click. The app has no dialog. | BR-19: these records never change. Gate 1b locks the manuscript (BR-07). `DESIGN.md` §8.9 asks for a gate dialog and a Verify dialog. | Grep: no `role="dialog"`, `<dialog>` or `confirm(` in `src/`. `src/app/_components/workspace-controls.tsx` (`EndorseButton`), `src/app/coordinator/defense/[defenseId]/` | High | 3.00 | `ConfirmDialog` (R3), used in R5 (gate box) and R7 (C4, C6). | Presentation (the dialog is in `DESIGN.md`) |
| UX-011 | Action feedback: two `ActionForm` components | All | Observed. Student, Adviser and Panel Member forms (`src/app/_components/action-form.tsx`) say nothing on success: the form resets and the page refreshes. Coordinator forms (`src/app/coordinator/_lib/form-parts.tsx`) show an "ok" line in a polite status. Errors are `role="alert"` in one and `role="status"` in the other. | Users cannot tell if a small action worked. UX-D-04: a toast for small actions, the result on the screen for workflow actions. F5-style consistency. | Booking walk (§6): `ui-shots/audit/flow-booking-1b-after-publish.png`, `flow-booking-3-adviser-after-confirm.png`. The script found an empty status after each action. | Medium | 2.80 | One `ActionForm` contract. Toast for small actions (R2.2). Workflow results stay on screen (R5, R6, R7). | Presentation |
| UX-012 | Form fields | All | Observed. Hints (`Field hint`) have no `id`, and no input has `aria-describedby`. Errors appear next to the submit button, not under the field. | `DESIGN.md` §10 Forms. Stripe form reference (UX-D-03). WCAG 1.3.1, 3.3.1. | `src/app/coordinator/_lib/form-parts.tsx:12` to `:22`. Keyboard probe: every C2 input has an empty `aria-describedby`. | Medium | 2.55 | Form-field pattern with linked hint and error. R3 (side sheet and forms). | Presentation |
| UX-013 | Input styles | All | Observed. Three class sets for the same control (see §3.6). `inputClass` uses `px-2`, `fieldClass` uses `px-3` and a focus style, LOGIN uses `rounded-md border px-3 py-2`. | One control must look the same everywhere (F5, `DESIGN.md` §7.1). | §3.6 | Medium | 2.00 | One form-field pattern. R3. | Presentation |
| UX-014 | Tables | All | Observed. Two copies of the cell styles. Headers are uppercase (`DESIGN.md` §4.2 asks for sentence case). No `th scope`. No `aria-sort`. Rows are about 43 px, not 48 or 56 px. | `DESIGN.md` §5.4, §10 (real tables, `aria-sort`) | `src/app/_components/dash.tsx:13`, `src/app/coordinator/_lib/page-header.tsx:21`. Keyboard probe: C2 table has 5 `th`, 0 `scope`. | Low | 1.90 | `queue-table`. R3. | Presentation |
| UX-015 | Document stamp | Student, Coordinator | Observed. On S3 the stamp box stretches to the width of the text above it ("TDW 11 · Not started" is about 480 px wide). | A stamp is a fixed small mark (`DESIGN.md` §8.1). | `ui-shots/audit/S3-desktop-light.png`, `src/components/status/document-stamp.tsx` | Low | 0.85 | `inline-flex w-fit`. R1.4. | Presentation |
| UX-016 | Labels from codes | All | Observed. Codes reach the UI: S3 stamps "SIGNED FINAL_MANUSCRIPT", "CONFERENCE CERT", "FINAL COPY", "JOURNAL PUB". SV lists "gate_1a: endorsed", "date_confirmation", "stage_close", "TDW_03". C2 shows "DRAFT". A reason says "(FINAL_APPROVED)". | G11: no enum names or codes in the UI. F5: C1 shows the same status as a pill. | `ui-shots/audit/S3-…`, `SV-student-…`, `C2-desktop-light.png`. `grep "FINAL_APPROVED)" src/app` | Medium | 2.15 | One label map for document codes, gate kinds and statuses in the `status` pattern. R1.4, used in R7. | Presentation |
| UX-017 | Rule IDs in UI text | All | Observed. "(BR-09)" on S4, "(BR-12)" on C6, "(BR-01)" on C3, "(FR-ACC-09)" and "(FR-ACC-07)" on C2. | G11. The Coordinator text budget allows no helper lines (`DESIGN.md` §2.1). | Screenshots of S4, C2, C3, C6 | Low | 1.35 | Remove the IDs. Keep the rule in plain words once. R7. | Presentation |
| UX-018 | C6 sheets table | Coordinator | Observed. The column header says "Evaluator". | AGENTS.md §8: "Panel Member", never "Evaluator". | `ui-shots/audit/C6-desktop-light.png` | Medium | 1.15 | "Panel Member" (or "Member", since the Adviser also has a sheet). R7d. | Presentation |
| UX-019 | Gate labels | Adviser, Panel Member, Coordinator | Observed. "Approve data gathering" and "Approve the final manuscript (Gate 2)". | `DESIGN_DECISIONS.md` §2.1: the UI says Endorse and Return, never "approve". UTP names may differ (UX-X-05). | `grep '"Approve' src/app` | Low | 1.10 | Owner decides the words (UX-X-05). R7. | Presentation |
| UX-020 | S3 row text | Student | Observed. Broken sentences: "Signed by Adviser signs each row.", "Signed by One sheet for each Final Panel member.", "Dean approves..", "Dean approved..". "Panel member" in lower case. Hypothesis: the page puts "Signed by" in front of template text that is already a sentence. | G11, `DESIGN.md` §9. The Student reads this on the main Documents screen. | `ui-shots/audit/S3-desktop-light.png` | Low | 1.65 | Show the template text as it is, with one label. R7a. Check the C8 template text. | Presentation |
| UX-021 | Dates and times | All | Observed. Dates show as "Nov 25, 2026, 4:02 AM". Field labels say "(PST)". | `DESIGN.md` §4.2 format: `Tue 12 Jan 2027, 09:00 PHT`. "PST" also means Pacific Standard Time. NFR-11. | `src/app/_lib/format.ts` (`pst`), A4 and P3 labels | Low | 1.70 | One date formatter with `PHT`. R1.4 (helper), R7 (pages). | Presentation |
| UX-022 | Date inputs | Student, Adviser, Panel Member, Coordinator | Observed. Native inputs show `mm/dd/yyyy`. S4 does not block days before the earliest date. | `DESIGN.md` §7.4 `date-picker`, BR-09 | S4, A4, P3, C2 screenshots | Medium | 2.00 | `date-picker`. R6. | Presentation |
| UX-023 | Defense Day forms after the close | Adviser, Panel Member | Observed. On a closed defense, A5 and P4 show every text area and select as editable. Only "Save my sheet" is blocked. | A user can type and lose the text. The record is locked (BR-19). | `ui-shots/audit/A5-desktop-light.png`, `P4-desktop-light.png` | Medium | 2.10 | Read-only state in `defense-form` and `verdict`. R6. | Presentation |
| UX-024 | Repeated reasons | Coordinator | Observed. C6 repeats "This sheet is verified. It cannot change." 3 times in each row (9 times on the screen). | `DESIGN.md` §2.1: say a rule once. G5. | `ui-shots/audit/C6-desktop-light.png` | Low | 1.05 | One reason for each row. R7d. | Presentation |
| UX-025 | Defense Day targets | Adviser, Panel Member | Observed. Defense Day buttons are 28 to 36 px high. | `DESIGN.md` §8.3, §10: 48 px on Defense Day (tablet use). | A5 and P4 screenshots | Medium | 2.10 | `size="defense"`. R6. | Presentation |
| UX-026 | Loading and error states | All | Observed. Loading is one "Loading…" line. No route has an `error.tsx`, so a server error shows the bare Next error page, outside the app shell, with no "Try again" in context. | UX-D-04 (D-09) | `src/app/_components/page-loading.tsx`. `find src/app -name error.tsx` finds none. | Medium | 2.45 | R2.3. | Presentation |

---

## 4. Layer 3: role layouts

All four role layouts use `RoleShell` (`src/app/_components/role-shell.tsx`) and `AppShell`. The shell is the same for each role: maroon rule, 56 px top bar, 240 px sidebar, a `<details>` menu below 1024 px. The next action is visible without a scroll at 1024 × 768 on S1 (Docket button) and C1 (counts). A1 and P1 had no pending action in the demo data.

**Sidebars compared with `design/screens/README.md`:**

| Role | README items | Code items | Missing | Label differences |
| :---- | :---- | :---- | :---- | :---- |
| Student | 8 | 4: Dashboard, Documents, Schedule, Clearance | Thesis process, Manuscript, Defense results, Submission | — |
| Adviser | 6 | 3: Dashboard, Consultations, Availability | Review queue, Defense Day, Submission | "Dashboard" for Advisees |
| Panel Member | 5 | 2: Dashboard, Availability | Manuscript, Defense Day, Submission | "Dashboard" for Assignments |
| Coordinator | 11 | 8 | Defense, Audit, Submission | "Dashboard" for Overview, "Accounts" for Students |

No item is locked with a reason. Clearance shows as open to the Student before Milestone 3.

| ID | Where | Role | Issue | Why it matters | Evidence | Severity | Score | Fix | Kind |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| UX-027 | `sidebar` | All | Observed. Each sidebar lists only the open routes (table above). No locked item, no reason. | G3 (show the whole path), BR-18, `design/screens/README.md` Sidebars, `spec/SITEMAP.md` | `src/app/_components/role-shell.tsx:14` to `:50` | High | 3.00 | R2.1 (`navFor`, locked items) | Presentation |
| UX-028 | Entry points to records | All | Observed. No page links to the SV routes (Grep: no link to `/submission/`). The dashboards link to a defense only while it is scheduled: after the close, S1 has no link to S5, P1 says "Defense: Not scheduled" for the held Pre-Final Defense, and C5 lists only scheduled defenses. S5, A5, P4, C6 and SV open only by URL. | A workflow result must stay reachable (UX-D-04). The Student cannot find the defense results. | `ui-shots/audit/P1-desktop-light.png`. The screenshot tool had to take these ids from the database. | High | 3.00 | Sidebar items (UX-027) give the entry points. Add the SV link where the spec puts it. R2 and R7. | Presentation |
| UX-029 | `app-shell` | All | Observed. No skip link. `<main>` has no `id`. The tablet menu is a `<details>` popover: no focus trap, no Escape. On a phone the role label hides and the wordmark wraps to two lines. | `DESIGN.md` §10 (skip link), §5.1 (drawer) | Keyboard probe: `skipLink=false`, `mainId=""` on all 6 pages. `ui-shots/audit/C6-phone-light.png` | Medium | 2.15 | R2.1 | Presentation |
| UX-030 | Identity on record screens | All | Observed. S1 shows "Your thesis", not the thesis title (PRD D-25). The workspace header on S2, A2 and P2 says only "Final manuscript": it does not name the Student or the thesis. An Adviser or Panel Member with several advisees sees no name before a permanent gate action. | `DESIGN.md` §5.2. Workflow safety with BR-19. | `src/app/_components/pr-workspace.tsx:87`. `ui-shots/audit/S1-…`, `A2-desktop-light.png` | High | 3.05 | `identity-line` (R1.4) on S1, A2, P2, SV (R5, R7) | Presentation |
| UX-031 | `docket` on S1 | Student | Observed. No "Step n of 4". The first-step sentence ("Upload your manuscript, then mark it Ready …") sits under the Docket card. No "See the whole process" link (PROCESS is not built). | `DESIGN.md` §5.3, `design/screens/S1.md` | `ui-shots/audit/S1-desktop-light.png` | Low | 1.40 | R1.4 docket, R4 PROCESS | Presentation |

---

## 5. Layer 4: screens

One row for each route in `spec/SITEMAP.md`, plus `/login/reset`. "Exists" means a `page.tsx` is on the branch. "Shot" means `ui-shots/audit/<ID>-<viewport>-light.png` exists and the page rendered. Every screen has the focus problem UX-001 in the Keyboard column. First day: the demo data is not a first day for most screens, so the column compares the empty states that did show.

**Route count for UX-X-02:** `spec/SITEMAP.md` lists 31 routes (1 public, 8 Student, 6 Adviser, 5 Panel Member, 11 Coordinator). 29 of them have a `page.tsx`. `/student/process` and `/coordinator/audit` do not. The code also has `/login/reset` and `/`, which the sitemap does not count (UX-X-04).

| ID | Route | Exists | Light | Dark | Desktop | Laptop | Tablet | Keyboard | First day | Findings |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| LOGIN | `/login` | Yes | Shot | Not built | OK | OK | OK | UX-001, UX-002 | — | UX-003. No wordmark and no masthead rule on this page. |
| — | `/login/reset` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | Not in the sitemap (UX-X-04) |
| S1 | `/student/dashboard` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Not seen (data) | UX-030, UX-031, UX-027 |
| PROCESS | `/student/process` | No | — | — | — | — | — | — | — | 404. Built in R4. |
| S2 | `/student/pr/[prId]` | Yes | Shot (Final, no commit) | Not built | OK | OK | OK | UX-001 | "No commit yet." matches the idea | UX-008, UX-030. Crash risk UX-009 when a commit exists. |
| S3 | `/student/documents` | Yes | Shot | Not built | Issue | Issue | OK | UX-001 | Differs: no "Download form" | UX-015, UX-016, UX-020, UX-032 |
| S4 | `/student/schedule` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Differs from S4 spec text | UX-017, UX-021, UX-022, UX-039 |
| S5 | `/student/defense/[defenseId]` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | UX-028 (no entry point). The verdict has no status pill (F5). |
| S6 | `/student/clearance` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | Open before Milestone 3 (UX-027) |
| A1 | `/adviser/dashboard` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Differs: "Nothing waits for you." (UX-035) | UX-014 |
| A2 | `/adviser/pr/[prId]` | Yes | Shot (Final, no commit) | Not built | OK | OK | OK | UX-001 | — | UX-030, UX-010. Crash risk UX-009. |
| A3 | `/adviser/consultations` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Differs from A3 spec text | UX-021 |
| A4 | `/adviser/availability` | Yes | Shot | Not built | OK | OK | OK | UX-001, UX-002 | — | UX-021 ("PST"), UX-022, UX-039 |
| A5 | `/adviser/defense/[defenseId]` | Yes | Shot (closed defense) | Not built | OK | OK | OK | UX-001 | — | UX-023, UX-025, UX-028 |
| P1 | `/panel/dashboard` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | UX-028 ("Not scheduled" after the defense) |
| P2 | `/panel/pr/[prId]` | Yes | **Crash** | Not built | Crash | Crash | Crash | — | — | **UX-009 (Critical)** |
| P3 | `/panel/availability` | Yes | Shot | Not built | OK | OK | OK | UX-001, UX-002 | — | UX-021, UX-022 |
| P4 | `/panel/defense/[defenseId]` | Yes | Shot (closed defense) | Not built | OK | OK | OK | UX-001 | — | UX-023, UX-025, UX-008 ("This status change is not allowed." is a vague reason) |
| C1 | `/coordinator/dashboard` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Differs: no "Add faculty" action | UX-033, UX-014 |
| C2 | `/coordinator/students` | Yes | Shot | Not built | OK | OK | OK | UX-001, UX-012 | — | UX-016 ("DRAFT"), UX-017, inline form (side sheet in R3). "Thesis Instance" is a system word in the helper line. |
| C3 | `/coordinator/committees` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | UX-017, UX-014 |
| C4 | `/coordinator/documents` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Differs: Student chooser, not the scan inbox (UX-034) | UX-010 |
| C5 | `/coordinator/schedule` | Yes | Shot | Not built | OK | OK | OK | UX-001 | Close to the spec | UX-028 (no held or closed defenses listed) |
| C6 | `/coordinator/defense/[defenseId]` | Yes | Shot (closed defense) | Not built | OK | OK | OK | UX-001 | — | UX-008, UX-010, UX-017, UX-018, UX-024. Score shows "None" as text. |
| C7 | `/coordinator/clearance` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | UX-016 |
| C8 | `/coordinator/templates` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | UX-014 |
| C9 | `/coordinator/users` | Yes | Shot | Not built | OK | OK | OK | UX-001 | — | UX-012 |
| C10 | `/coordinator/audit` | No | — | — | — | — | — | — | — | 404. Built in R7d. |
| SV | `/{student,adviser,panel,coordinator}/submission/[id]` | Yes (4) | Shot (4) | Not built | OK | OK | OK | UX-001 | — | UX-016, UX-028. Three "gate_1b" rows with no actor name. |

**Phone (390 × 844):** every page renders read only. Tables do not become stacked rows: C6 cuts its table and scrolls inside it (UX-036).
**Reduced motion:** the reduced-motion pass rendered the same as the normal pass. The app has no animation today, and `globals.css` sets transitions to 0 ms for `reduce`.

| ID | Where | Role | Issue | Why it matters | Evidence | Severity | Score | Fix | Kind |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| UX-032 | S3 | Student | Observed. No row has "Download form". | `design/screens/S3.md` first day: every row shows "Not started" and "Download form". `DESIGN.md` §8.12. | `ui-shots/audit/S3-desktop-light.png` | Low | 1.65 | Add the link to the blank forms in `docs/reference/tdw-forms` (UX-X-07). R4 task list, R7a. | Behavior (new control). Needs the owner. |
| UX-033 | C1 KPI counts | Coordinator | Observed. Counts have no glyph and no oldest age. A 0 is not muted. "Record a Certification" uses a capital C. The empty queue does not name "Add faculty" as the one maroon action. | `design/screens/C1.md`, `DESIGN.md` §7.4 `kpi-strip` | `ui-shots/audit/C1-desktop-light.png` | Low | 1.50 | `kpi-strip`. R3, R7d. | Presentation |
| UX-034 | C4 | Coordinator | Observed. C4 opens a Student chooser, then a list. The spec asks for a scan inbox with "No scans are waiting. …". | `design/screens/C4.md` | `ui-shots/audit/C4-desktop-light.png` | Low | 1.60 | `inbox`. R3, R7d. | Presentation |
| UX-035 | A1, A3, S4 empty states | Adviser, Student | Observed. The empty-state texts differ from the specs (for example A1: "Nothing waits for you." against "No requests are waiting. Requests appear here when an advisee marks a version Ready."). | `DESIGN.md` §8.11, the screen specs | Screenshots of A1, A3, S4 | Low | 1.00 | Use the spec text. R7. | Presentation |
| UX-036 | Tables on a phone | All | Observed. Tables keep their columns at 390 px. C6 cuts the table. | `DESIGN.md` §5.6: tables become stacked rows on a phone | `ui-shots/audit/C6-phone-light.png` | Low | 1.20 | `queue-table` stacked mode. R3. Phones are checked last. | Presentation |
| UX-037 | Dev server | — | Observed. `pnpm dev` (the owner's server on port 3000) returned HTTP 500 for S2, A2, P2 and all four SV routes. The log says "Jest worker encountered 2 child process exceptions" and "write EPIPE". The production build renders S2, A2 and SV. Hypothesis: the dev render worker crashes on these routes, or the long-running dev server was in a bad state. Not checked after a restart. **R1 (25 Nov 2026):** the same crash hit the new dynamic route `/lab/patterns/[name]`, while the static `/lab` routes worked. Every route that failed has a dynamic segment. Stronger hypothesis: the dev worker for dynamic routes crashes. **Resolved 25 Nov 2026:** the cause was a stale Turbopack cache in `.next/dev` (814 MB). A new dev server still served the old `globals.css` until the cache was deleted. After `rm -rf .next/dev` and a restart, S2, A2, P2, S5, C6 and the 4 SV routes returned 200 in dev. Fix for the future: stop `pnpm dev`, delete `.next/dev`, start it again. | `/lab` previews run on the dev server. R5 previews need these routes. | `.next/dev/logs/next-development.log`, `ui-shots/audit-dev-smoke/` | Low (resolved) | 1.35 | Restart the dev server and check again before R5. If it still fails, diagnose it in R5. | Presentation (tooling) |
| UX-039 | Slot lists | Student, Adviser | Observed. A4 lists a confirmed slot as "In person · Confirmed" with no Student name. S4 shows "Confirmed · In person · Confirmed". | G5: the row must say whose slot it is. Repeated words. | `ui-shots/audit/flow-booking-3-adviser-after-confirm.png`, `S4-desktop-light.png` | Low | 1.20 | `slot-list`. R6. | Presentation |

| UX-040 | `pdf-viewer` pager | Student, Adviser, Panel Member | Observed (Round H check). When the PDF does not load, the pager still shows "Page 1 of 0" with its buttons. | The pager suggests a document that is not there. | `ui-shots/round-h/P2-desktop-relay1.png` | Low | 0.95 | Hide the pager until the page count is known. R5 `pdf-viewer`. | Presentation |

UX-038 is not used (merged into UX-011 during scoring).

---

## 6. Layer 5: workflows

Task 1.6 walked one flow live (consultation booking) and checked the others by code, screenshots and the existing flow tests (`tests/unit/flow/`). A live walk of the other flows needs writes that the demo data cannot undo (write-once file keys, permanent gates). The plan says to seed again for a clean state, but `tests/demo/seed-demo.test.ts` renames earlier users and adds a new thesis each run. So the owner decides when to walk the rest live (UX-X-06).

| Flow (USERFLOW.md section) | Roles | Checked | Feedback today | Findings |
| :---- | :---- | :---- | :---- | :---- |
| 6.1 Consultation booking | Adviser, Student | **Live walk** (25 Nov 2026): A4 Publish, S4 Request this slot, A4 Confirm | The button says "Saving…" (native `disabled`), then the page refreshes. No success message. The new slot and the confirmation appear in the lists. A notification arrives (bell count 1). | UX-011, UX-039 |
| 2 The defense cycle, manuscript upload and new commit (S2) | Student | Code and screenshot | Upload control, then a refresh. Not walked: a real upload writes a write-once key. | UX-011, UX-030 |
| 2 Threads and replies (S2, A2, P2) | All three | Code | Inline forms in the workspace. P2 could not render (UX-009). | UX-009, UX-012 |
| 2 Ready and the gates (S2, A2, P2) | Student, Adviser, Panel Member | Code | "Mark Ready" is blocked with a reason. Endorse buttons run on one click, then a refresh. | UX-010, UX-008, UX-030 |
| 6.2 Defense date and confirmation (S4, C5) | Student, Coordinator | Code and screenshots | S4 "Propose this date" is blocked with "Locked until Gate 1b.". C5 shows empty states. | UX-022, UX-017 |
| 6.3 Defense Day to close (A5, P4, C6) | Adviser, Panel Member, Coordinator | Screenshots of a closed defense | Blocked controls with reasons. The verdict shows as text. Fields stay editable after the close. | UX-023, UX-025, UX-024, UX-010 |
| Document Verify and Return (S3, C4) | Student, Coordinator | Code and screenshots | Verify runs on one click. Return has a reason box (C4). S3 shows each blocked upload with a reason. | UX-010, UX-016, UX-020, UX-032 |
| 6.4 Clearance (S6, C7) | Student, Coordinator | Screenshots | A list of 7 items with "Open. …" reasons. No action for the Student. | UX-016, UX-027 |
| 5.1 to 5.4 Flows by role (dashboards to records) | All | Screenshots and links | Dashboards link to the current records only. | UX-027, UX-028 |
| 7 Exception flows (Return, failed defense, substitutes) | All | Not checked | — | Walk in R7 with fresh data |
| 8 Comment contexts | All | Code (SV counts threads and document comments) | — | — |
| 9 Notifications along the flow | All | Live (one notification after the booking) | The bell shows a count. The panel is a `<details>` popover. | D-08 (R2) |

---

## 7. Discrepancies between documents and code

Report each one here. Do not fix it on your own.

| ID | Documents say | Code does | Owner decision |
| :---- | :---- | :---- | :---- |
| UX-X-01 | `spec/SITEMAP.md` lists `/student/process` and `/coordinator/audit` | Neither route has a page (both 404, 25 Nov 2026) | Planned: R4 and R7d |
| UX-X-02 | `spec/SITEMAP.md` §3 and `design/screens/README.md` say 31 routes. `AGENTS.md` §6 says 30 routes for the sitemap and for Operational Flow v3.1. | 29 of the 31 sitemap routes exist. The code also has `/login/reset` and `/`. | Open (owner). Task 0.2 did not change it. |
| UX-X-03 | The FR v1.2 header says "Status: Draft for approval". Its change log records the approval. | — | Open (owner) |
| UX-X-04 | `spec/SITEMAP.md` counts 1 public route | `/login/reset` is a second public page (set a password) | Open (owner): add it to the sitemap, or treat it as part of LOGIN |
| UX-X-05 | `DESIGN_DECISIONS.md` §2.1 and `DESIGN.md` §9: the UI says Endorse and Return, never "approve" | "Approve data gathering", "Approve the final manuscript (Gate 2)", and the verdict names "Approved", "Approved with Revisions" | Open (owner): keep the UTP names for verdicts and Gate 2, or change the labels |
| UX-X-06 | `IMPLEMENTATION_PLAN.md` Task 1.1: seed with `pnpm db:seed-dev` | The demo sign-ins now point to flow users (`tests/demo/seed-demo.test.ts`). `seed-dev.mjs` upserts `app_user` by email, and the old seeded emails are renamed `retired.*`. Hypothesis: running it inserts new, empty app accounts for the same sign-ins and breaks the demo link. Not run. | Open (owner): correct Task 1.1 to name the demo seed, or keep `db:seed-dev` |
| UX-X-07 | `design/screens/S3.md` first day: every row shows "Download form" | S3 has upload buttons only | Open (owner): UX-032 is a new control (Behavior) |
| UX-X-08 | Brand guide, Brand Colors: Golden Yellow `#F4B41A`, exact values | `DESIGN.md` D-01 (owner, 24 Nov 2026) and `tokens.css`: PUP Gold `#F4C430` | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-09 | Brand guide, Supporting Colors: maroon ramp 50 `#F7F0F0` … 500 `#800000`, 600 `#720406`, 700 `#5C0B0F` (Deep Maroon, hover), 800 `#3C070A`; gold ramp 50 to 800 | `tokens.css`: own ramp, `#800000` is step 600, hover `#6B0000` | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-10 | Brand guide, Supporting Colors: cool neutrals. Ink `#0F172A`, Slate `#475569`, Line `#E2E8F0`, Canvas `#F8FAFC`, White as the main background | `DESIGN.md` D-02 (owner, 24 Nov 2026): warm neutrals (`#1E1617` ink, `#FAF8F8` ground). The dark proposal is warm too. | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-11 | Brand guide, Supporting Colors: Success `#15803D`, Error `#B91C1C` (blocked, re-defense). Color Combinations: Deep Gold on white for "pending labels". | `tokens.css`: done `#1B6B45`, returned `#B3261E`, pending orange `#8F4A06` (`DESIGN.md` §3.3: "pending is orange, gold belongs to achieved") | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-12 | Brand guide, Brand Idea and principle 03: Golden Yellow marks progress and the next thing to do, the current step, milestones. Graphic Elements: the stepper uses milestone dots, the last dot gold. The sample app: completed steps maroon, current step gold. | UX-D-08 (owner, today): stepper all maroon. `DESIGN.md` G8: maroon is action, gold is earned. | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-13 | Brand guide, Typography: Poppins (titles, headings, large figures), Inter (text, tables, forms, interface), JetBrains Mono (revision numbers, dates, IDs, counters) | UX-D-09 (owner, today): Source Serif 4, Source Sans 3, Source Code Pro. `DESIGN.md` D-02 had replaced Inter with IBM Plex Sans. | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-14 | Brand guide, Font Sizes for Web and Mobile: 16 px base, ratio 1.25, body never below 16 px, captions and table metadata never below 12.8 px, line height 1.5 body and 1.2 headings, rem units | `DESIGN.md` §4.1: `ui` 14 px, `caption` 12 px, `mono` 13 px, title 28, display 36 | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-15 | Brand guide, Icons: 1.75 px stroke, outline only, no fills, no two-tone; maroon on white, ink in dense tables, gold for the milestone icon | `DESIGN.md` §6.2 and the R1 glyphs: 1.5 px stroke with a 16% tone fill (two-tone) | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-16 | Brand guide, Shapes and Buttons: radius 6 px controls, 8 px cards, 12 px panels; focus is a maroon border with a soft maroon ring; one gold accent button for a single high-value action | `DESIGN.md` §6.1: 4 px controls, 6 px cards, 2 px stamps; 2 px maroon outline with a 2 px offset; no gold button | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-17 | Brand guide, Logo and the hybrid strategy (UX-D-10): ThesIsko symbol and wordmark ("Thes" Poppins Medium, "Isko" Poppins Bold, descriptor "Graduate Thesis Progress") | `DESIGN.md` F1: no image symbol anywhere (app, emails, favicon); the brand is the text wordmark "PUP CpE Thesis Progress". `DESIGN.md` §11: emails have no logo. | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-18 | Brand guide, Mascot (Novie): a golden star for onboarding, empty states, milestones and tips | `DESIGN.md` F1: no star shape; §8.11: no illustrations in empty states | Decided: UX-D-11 (25 Nov 2026) |
| UX-X-19 | The reconciliation says to reference the exact brand-guide file and section | The brand guide and the reconciliation are in the owner's Downloads folder, not in the repository. No logo or mascot artwork files (SVG) exist; the guide holds only raster sample sheets. | Decided: UX-D-11 (25 Nov 2026) |

---

## 8. Stage 1 priorities (Task 1.7)

All 38 findings, sorted by score. Critical findings come first at any score.

| Rank | ID | Severity | Score | Short title | Round |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | UX-009 | Critical | 3.70 | A PDF load failure crashes the whole workspace page | H (hotfix), then R5 |
| 2 | UX-001 | High | 3.55 | No visible focus on buttons, links and Coordinator fields | R1 (hotfix possible in H) |
| 3 | UX-030 | High | 3.05 | Workspace header names no Student or thesis before permanent gates | R1, R5, R7 |
| 4 | UX-010 | High | 3.00 | Permanent actions run on one click, with no dialog | R3, R5, R7 |
| 5 | UX-027 | High | 3.00 | Sidebars hide most items, no locked items with reasons | R2 |
| 6 | UX-028 | High | 3.00 | Defense results, Defense Day and SV have no entry point after the event | R2, R7 |
| 7 | UX-002 | Medium | 2.80 | Native controls fall back to a faint 50% maroon focus ring | R1, R3 |
| 8 | UX-011 | Medium | 2.80 | Two action-feedback behaviors, silent success for 3 roles | R2, R3 |
| 9 | UX-012 | Medium | 2.55 | Hints and errors not linked to their fields | R3 |
| 10 | UX-026 | Medium | 2.45 | No error boundary in any route, loading is one text line | R2 |
| 11 | UX-003 | Medium | 2.45 | LOGIN input edges at about 1.2:1 | R1.5, R7d |
| 12 | UX-008 | Medium | 2.40 | Blocked primary buttons stay maroon | R1 |
| 13 | UX-016 | Medium | 2.15 | Codes and enum names in the UI | R1, R7 |
| 14 | UX-029 | Medium | 2.15 | No skip link, tablet menu has no focus trap | R2 |
| 15 | UX-023 | Medium | 2.10 | Closed defense forms still look editable | R6 |
| 16 | UX-025 | Medium | 2.10 | Defense Day targets below 48 px | R6 |
| 17 | UX-013 | Medium | 2.00 | Three input styles | R3 |
| 18 | UX-022 | Medium | 2.00 | Native date inputs, no BR-09 limit in the picker | R6 |
| 19 | UX-018 | Medium | 1.15 | "Evaluator" on C6 (AGENTS.md §8, Medium by rule) | R7d |
| 20–38 | UX-014, UX-021, UX-020, UX-032, UX-034, UX-033, UX-004, UX-006, UX-031, UX-017, UX-037, UX-036, UX-039, UX-005, UX-007, UX-019, UX-024, UX-035, UX-015 | Low | 1.90 to 0.85 | See §2 to §5 | R1 to R7 |

---

## 9. Brand guide compliance (R1, 25 Nov 2026)

Source: `ThesIsko-Design-Principles-Brand-Guidelines.docx` v1.0 (section names below), with `THESISKO_BRAND_GUIDELINE_RECONCILIATION.md` (UX-D-10). This section records findings only. The brand rules stay in the brand guide.

### 9.1 Already satisfied

| Brand guide section | Requirement | Where |
| :---- | :---- | :---- |
| Brand Colors | Maroon `#800000` is the primary color: primary buttons, headings, active navigation | `tokens.css` `--primary`, `--ring` |
| Color Combinations | White on maroon and maroon on white (10.95:1) | Primary button, links |
| Shapes and Buttons | One maroon primary button for each view; secondary actions outlined | `BlockedAction`, `DESIGN.md` G1 |
| Shapes and Buttons | Status pills: light tint with dark text from the same family, always with a word | `status` pattern, contrast test |
| Shapes and Buttons | Never remove the focus style | Round H, Task H.2 (UX-001) |
| Principle 04 | WCAG AA text contrast; color never the only signal | `contrast.test.ts` (light and dark), glyph and label on each pill |
| Spacing and Layout | 8-point system with 4 and 12 px allowed; 24 px card padding; 240 px sidebar | `DESIGN.md` §5.5, Docket, `--sidebar-w` |
| Icons | 24 px grid, round caps and joins, outline icons, label with each icon in navigation | `glyphs` pattern |
| Graphic Elements | No gradients in curves; the product stepper uses dots on a straight line | `DESIGN.md` §6.1, `stepper` pattern |
| Logo Animation | Not looped, no sound; not used in the working app | No animation in R1 (D-10) |
| Reconciliation §2 | Light and dark themes, system default, manual toggle in the shared header | UX-D-01, `theme-toggle` |

### 9.2 Not yet applied, or applied differently

See UX-X-08 to UX-X-19 for each conflict. Summary: palette values (gold, ramps, neutrals, status colors), the gold role and the stepper, the typography families and the screen type scale, icon stroke and fill, radii and focus ring, the logo and the wordmark text, the mascot.

### 9.3 Product refinements (the brand applied to the app, not a conflict)

| Item | Refinement | Reason |
| :---- | :---- | :---- |
| Input edge | Inputs keep a darker edge than the brand Line color | Line `#E2E8F0` on white is 1.23:1; WCAG 1.4.11 needs 3:1 for an input edge |
| Dark theme | The brand defines only "White on Ink" and "Golden Yellow on Ink" for dark surfaces; the retrofit defines a full dark token set (UX-D-01) | The brand guide has no dark theme; build the dark set from the brand colors |
| Status tones | `active` (blue), `locked` and `neutral` have no brand equivalent and stay product tones | They carry workflow meaning (F5) |
| Color proportion | 60/30/10 is a reference, not a per-screen ratio | Reconciliation §2 |
| Decoration | Page curve, book pattern, mascot and logo animation only on public brand surfaces (LOGIN) and meaningful moments, never on working surfaces | Reconciliation §2, `DESIGN.md` G4 |
| Landing page | The reconciliation names a landing page. `spec/SITEMAP.md` has none (`/` is a Phase 0 placeholder). Screens are locked, so the full logo goes on LOGIN only until the owner adds a landing page. | Locked routes |
