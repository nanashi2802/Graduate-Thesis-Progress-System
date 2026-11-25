# Guided Ledger UI Implementation Plan

> **Replaced (25 Nov 2026, UX-D-05):** use `docs/ui-ux-audit/IMPLEMENTATION_PLAN.md`. It keeps these tasks and adds the audit, the `/lab` showcase, dark mode and a preview gate before each round. Keep this file as history.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app's look and screens to the Guided Ledger design from the design session: three layers (tokens, patterns, pages), a domain icon set, and one screen spec for each route.

**Architecture:** Layer 1 is `src/styles/tokens.css` (raw colors and sizes, nothing else holds them). Layer 2 is `src/components/patterns/<name>/`, one folder for each pattern in the `DESIGN.md` §7.4 registry, each with a typed props contract and a `// Source: …` first comment. Layer 3 is the pages in `src/app/**/page.tsx`, which compose patterns and data only. A lint rule enforces layer 3 at the end. Build the patterns first, then the screens role by role.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn (base-nova) as the component base inside patterns only, `motion` (`motion/react`), react-pdf, Vitest with `renderToStaticMarkup` for component tests, Playwright for e2e.

**Spec:** `DESIGN.md` v0.2 (principles, tokens, patterns, components) and `design/screens/<ID>.md` (one spec for each screen, start at `design/screens/README.md`). Mockups for reference: `design/mockups/` (history; the glyph SVGs in `coordinator-mockups.html` are the source of the icon set). Read `AGENTS.md` before you start.

**Order with the other plan:** Do `2026-11-25-design-decisions-data-changes.md` first. The C4, S2, S3, C2 and C8 screens here need its data functions (Verify or Return, thread page, title, optional copies, advisee limit).

## Global Constraints

- All UI text follows ASD-STE100 at about 80% and the terms in `AGENTS.md` §8 and `GLOSSARY.md`: "Panel Member", "Coordinator", never "panel" for a card (`DESIGN.md` §9).
- No PUP logo, seal, star, laurel, torch or other logo shape anywhere (F1). Brand = colors + the text wordmark "PUP CpE Thesis Progress".
- Maroon `#800000` only for the one action to do now; gold `#F4C430` only for a milestone achieved and the current step (G8). A verified document is green `done`, never gold.
- At most 3 cards on a screen (G6). A list row shows 3 facts at most (G5).
- Teaching text only in empty and first-day states, disabled-action reasons and dialogs. Coordinator screens have no helper lines (G4, `DESIGN.md` §2.1).
- Every disabled action uses `aria-disabled="true"` and shows its reason linked with `aria-describedby` (BR-18, `DESIGN.md` §8.4).
- Compact (Coordinator) tables: 48 px rows, 16 px cell padding, fixed column widths, row actions 132 × 32 px, all the same width. Comfortable tables: 56 px rows (`DESIGN.md` §5.4).
- Library components take our tokens; never their own palette (`DESIGN.md` §3.4).
- Every animation has a `prefers-reduced-motion` path. No counting numbers. Do not invent durations: the motion rules are on hold (D-10).
- Do **not** build the items still open in `DESIGN.md` §14: status-pill glyphs (D-06), the missing sidebar glyphs (D-07), new top-bar panel designs (D-08), new loading/error/toast patterns (D-09), React Bits components (D-11). Keep the current behavior for those and leave a `// D-0n open` comment. The owner decides them in a separate session.
- Phones are read-only on every screen for now (D-12).
- Show no grade and no grade equivalent; scores are ink numbers (F4, BR-15).
- WCAG 2.2 AA; 44 px targets on tablet, 48 px on Defense Day (`DESIGN.md` §10).

## Review Focus

1. **A first-day user.** Demo data is empty. Expect: every screen shows a designed empty state that names the next step (`DESIGN.md` §8.11, each spec's "First day" row), never a blank region. Each screen task checks its first-day state.
2. **A locked sidebar item.** Expect: the item shows with a `lock` glyph and its reason in a tooltip, it is reachable by keyboard, and the reason is readable by a screen reader. Task 4 tests this.
3. **A long thesis title or a long Return reason in a compact row.** Expect: one line, cut with an ellipsis, the full text in a tooltip and on focus; the row stays 48 px. Task 5 tests this.
4. **Keyboard only.** Expect: every action, the Verify dialog, the Return composer and the "p. 14" link work with the keyboard, with a visible focus ring. Tasks 6 and 8 test the dialog and the composer.
5. **Degree level and milestone filter (G2).** Expect: a Master's Student never sees a Doctoral count or form, and a Milestone 1 Student never sees Milestone 3 items, except on PROCESS. Task 7 tests this.

---

### Task 1: Tokens file

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css` (import the tokens; remove the ramps and tone values it holds now; remove the "D-01 and D-02 are still [CONFIRM]" comment, both are closed)
- Test: `tests/unit/components/tokens.test.ts`

**Interfaces:**
- Produces: the CSS custom properties of `DESIGN.md` §12.1 to §12.4, with these exact names and values among them: `--color-maroon-600: #800000`, `--color-gold-400: #F4C430`, `--tone-returned-fg: #B3261E`, `--row-h-comfortable: 56px`, `--row-h-compact: 48px`, `--cell-pad-x: 16px`, `--row-action-w: 132px`, `--row-action-h: 32px`, `--kpi-num-size: 36px`, `--kpi-glyph-size: 30px`, `--glyph-stroke: 1.5`, `--glyph-tone-opacity: 0.16`, `--sidebar-w: 240px`, `--topbar-h: 56px`, `--target-tablet: 44px`, `--target-defense: 48px`.

- [ ] **Step 1: Write the failing test** — read `src/styles/tokens.css` as text and assert each name and value above is present; assert `src/app/globals.css` holds no `#` hex color outside `@import` lines.
- [ ] **Step 2: Run it** — `pnpm test tests/unit/components/tokens.test.ts`. Expected: FAIL (file missing).
- [ ] **Step 3: Write `tokens.css`** from `DESIGN.md` §12 (primitive in `@theme`, semantic shadcn tokens in `:root`, status tokens, pattern tokens). Import it at the top of `globals.css`. Keep the shadcn token names that existing components use.
- [ ] **Step 4: Run** `pnpm test tests/unit/components/tokens.test.ts && pnpm build`. Expected: PASS, and the app builds.
- [ ] **Step 5: Commit** — `git commit -m "feat: token layer in src/styles/tokens.css (DESIGN.md §7.1, §12)"`

---

### Task 2: Domain glyph set

**Files:**
- Create: `src/components/patterns/glyphs/index.tsx`
- Test: `tests/unit/components/glyphs.test.ts`

**Interfaces:**
- Produces: `type GlyphName = "scan" | "verify" | "flag" | "return" | "seat" | "calendar" | "defense" | "gate" | "commit" | "clear" | "template" | "overview" | "student" | "users" | "audit" | "export" | "search" | "bell" | "done" | "todo" | "lock" | "received"`; `function Glyph(props: { name: GlyphName; size?: 16 | 20 | 30; label?: string; className?: string }): JSX.Element`. Without `label` the SVG has `aria-hidden="true"`; with it, `role="img"` and `aria-label`.

- [ ] **Step 1: Write the failing test** — for each name: the markup has `viewBox="0 0 24 24"`, `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, and no `fill` except on the `.tone` element; size 30 gives `width="30"`; no label gives `aria-hidden="true"`.
- [ ] **Step 2: Run it** — `pnpm test tests/unit/components/glyphs.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** — copy the path data from the `<symbol>` elements in `design/mockups/coordinator-mockups.html`. Map the mockup ids: `g-mismatch` → `flag`, `g-def-a` → `defense` (B and C were rejected). The `.tone` element gets `fill="currentColor"` and `fill-opacity` from `--glyph-tone-opacity`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: domain glyph set (DESIGN.md §6.2)"`

---

### Task 3: Base patterns (move and contract)

**Files:**
- Create: `src/components/patterns/{status,blocked-action,flag,empty-state,identity-line,docket,stepper}/index.tsx`
- Move from: `src/components/status/*`, `action-button.tsx`, `banners.tsx`, `empty-state.tsx`, `docket.tsx`, `milestone-stepper.tsx` (keep a re-export at the old path until Task 12)
- Test: move `tests/unit/components/{status,action-button,docket,stepper}.test.ts` to import from the new paths; add `identity-line.test.ts`, `flag.test.ts`, `empty-state.test.ts`

**Interfaces:**
- Produces:
  - `StatusPill`, `DocumentStamp`, `OutsideChip` (same props as today).
  - `BlockedAction(props: { children; reason?: string; variant?: "primary" | "secondary" | "return" | "text"; size?: "default" | "compact" | "defense" } & ButtonHTMLAttributes)`.
  - `Flag(props: { children: ReactNode; compact?: boolean })`: in compact mode, a glyph with the text in a tooltip.
  - `EmptyState(props: { title: string; body?: string; action?: ReactNode })`.
  - `IdentityLine(props: { title: string; degreeLevel: "masters" | "doctoral"; adviser?: string; committee?: string[]; ownView?: boolean })`.
  - `Docket(props: { step: 1 | 2 | 3 | 4; milestone: string; status: MilestoneStatus; blocker: string | null; action: ReactNode; formLink?: { href: string; label: string }; processLink?: boolean })`: no blocker shows "Nothing blocks this step."
  - `Stepper(props: { current: 1 | 2 | 3 | 4; completed: number[]; compact?: boolean })`.

- [ ] **Step 1: Write the new tests** (Docket: "Step 2 of 4", the blocker line, the one primary action, the process link only when asked; IdentityLine: serif title, degree label "Master's" or "Doctoral"; Flag: compact mode puts the text in `title`/tooltip; EmptyState: no illustration element).
- [ ] **Step 2: Run** `pnpm test tests/unit/components`. Expected: FAIL for the new files.
- [ ] **Step 3: Implement** — each `index.tsx` starts with `// Source: …` (see the `DESIGN.md` §7.4 Source column). Use tokens and glyphs only. Status pills use the current Lucide icons until D-06 is decided.
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: base patterns with props contracts (DESIGN.md §7.2, §7.4, §8)"`

---

### Task 4: App shell and sidebar with locked items

**Files:**
- Create: `src/components/patterns/{app-shell,sidebar}/index.tsx`, `src/components/patterns/sidebar/nav.ts`
- Modify: `src/components/app-shell.tsx`, `nav-links.tsx` (become re-exports), the four role layouts
- Test: `tests/unit/components/sidebar.test.ts`

**Interfaces:**
- Produces: `type NavItem = { label: string; href: string; glyph: GlyphName | "lucide:<name>"; lockedReason: string | null; count?: number }`; `navFor(role: UserRole, facts: NavFacts): NavItem[]` in `nav.ts`, where `NavFacts = { milestone: 1 | 2 | 3; sheetsVerified: boolean; gate1bDone: boolean; defenseStarted: boolean; panelAccess: boolean }`; `Sidebar(props: { items: NavItem[]; activeHref: string })`.
- Items, order and lock reasons: exactly the table "Sidebars" in `design/screens/README.md`. The Student list has 8 items with "Thesis process" second.

- [ ] **Step 1: Write the failing test** — `navFor("student", { milestone: 1, … })` returns 8 items in the README order; "Clearance" has `lockedReason: "Opens at Milestone 3."`; "Submission" has "Opens at Gate 1b." while `gate1bDone` is false. Rendered: a locked item has a `lock` glyph, `aria-disabled="true"`, and the reason in an element linked by `aria-describedby`. The active item carries `aria-current="page"`.
- [ ] **Step 2: Run** `pnpm test tests/unit/components/sidebar.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** — shell per `DESIGN.md` §5.1: 3 px maroon masthead rule, 56 px top bar (wordmark, search, bell, user menu; keep today's search and bell behavior, D-08), 240 px sidebar on `neutral-100`, drawer below 1024 px. Glyphs for items D-07 has not drawn yet use a Lucide icon with a `// D-07 open` comment.
- [ ] **Step 4: Run** `pnpm test && pnpm test:e2e`. Expected: PASS (fix e2e selectors that relied on the old nav).
- [ ] **Step 5: Commit** — `git commit -m "feat: app shell and sidebar with locked items and reasons (DESIGN.md §5.1, BR-18)"`

---

### Task 5: Queue table and KPI strip (compact density)

**Files:**
- Create: `src/components/patterns/{queue-table,kpi-strip}/index.tsx`
- Test: `tests/unit/components/queue-table.test.ts`, `kpi-strip.test.ts`

**Interfaces:**
- Produces: `QueueTable<Row>(props: { columns: { key: keyof Row & string; label: string; width?: string; render?: (r: Row) => ReactNode }[]; rows: Row[]; density: "compact" | "comfortable"; groupBy?: (r: Row) => { label: string; glyph: GlyphName }; action?: (r: Row) => { label: string; href?: string; onClick?: () => void; reason?: string }; empty: ReactNode })`; `KpiStrip(props: { items: { label: string; count: number; oldestDays: number | null; late: boolean; glyph: GlyphName; href: string; selected?: boolean }[] })`.

- [ ] **Step 1: Write the failing tests** — compact: `table-layout: fixed`, the row-height class or style uses `--row-h-compact`, every row action has the same width from `--row-action-w`; a cell with a 200-character title renders one line with `title` holding the full text; `empty` renders when `rows` is empty. KPI: the count uses `--kpi-num-size`, the glyph sits after the count in DOM order in the top-right grid area, the age shows as "6d" and has a "late" class when `late`; a count of 0 gets the muted class.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** — real `<table>` markup with `aria-sort` on sortable headers (`DESIGN.md` §10). Use the C1 layout of `design/mockups/coordinator-mockups.html` v5 as the visual reference.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: queue table and KPI strip patterns (DESIGN.md §5.4, §7.4)"`

---

### Task 6: Inbox, Return composer and dialogs

**Files:**
- Create: `src/components/patterns/{inbox,return-composer,dialog}/index.tsx`
- Test: `tests/unit/components/return-composer.test.ts`, `dialog.test.ts`, `inbox.test.ts`

**Interfaces:**
- Produces: `Inbox(props: { list: ReactNode; viewer: ReactNode; record: ReactNode })` (300 px / flexible / 300 px grid); `ReturnComposer(props: { onSend: (reason: string) => void; onCancel: () => void; placeholder: string })`; `ConfirmDialog(props: { title: string; body: string; confirmLabel: string; onConfirm: () => void; open: boolean; onOpenChange: (o: boolean) => void })`.

- [ ] **Step 1: Write the failing tests** — composer: label "Reason for return"; "Send return" has `aria-disabled="true"` and the reason "Write a reason first" while the field is empty or only spaces; no preset reasons list. Dialog: renders `role="dialog"` with the title, the body and two buttons (confirm label, "Cancel").
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** — the dialog uses the shadcn/base dialog inside the pattern, with focus trap and Escape. The Verify copy: title "Verify {form} for {Student}?", body "This locks the document." (`DESIGN.md` §8.9).
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: inbox, Return composer and confirm dialog patterns (DESIGN.md §8.9, BR-13, BR-19)"`

---

### Task 7: Task list, step-by-step and the Thesis process route

**Files:**
- Create: `src/components/patterns/{task-list,step-by-step}/index.tsx`
- Create: `src/app/student/process/page.tsx`
- Modify: the Student sidebar (Task 4 already lists the item)
- Test: `tests/unit/components/task-list.test.ts`, `step-by-step.test.ts`; `tests/e2e/portals.spec.ts` (the new route opens for a Student and is refused to other roles)

**Interfaces:**
- Produces: `TaskList(props: { groups: { label: string; collapsed?: boolean; items: { stamp?: { form: string; state: DocumentState }; label: string; reason?: string; actions?: ReactNode }[] }[] })`; `StepByStep(props: { steps: { title: string; current: boolean; done: boolean; body: ReactNode }[] })`.

- [ ] **Step 1: Write the failing tests** — step-by-step: the current step has "You are here" and is expanded; others are collapsed; done steps have the `done` glyph. PROCESS page data: for a Master's Student the Proposal step lists "2 Panel Members"; a Doctoral Student sees "3"; the step list has 4 steps and no Stage 0 step.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** — PROCESS per `design/screens/PROCESS.md`: gates, who acts, forms with "Download form" (blank form from `docs/reference/tdw-forms` until Phase 4). Route access: Student only (FR-ACC-02).
- [ ] **Step 4: Run** `pnpm test && pnpm test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: Thesis process route and task-list and step-by-step patterns (FR-TRK-01, FR-DOC-09)"`

---

### Task 8: Workspace patterns

**Files:**
- Create: `src/components/patterns/{workspace,merge-box,gate-box,thread-feed,commit-selector,pdf-viewer}/index.tsx` (move `src/components/pdf-viewer.tsx`)
- Test: `tests/unit/components/gate-box.test.ts`, `thread-feed.test.ts`

**Interfaces:**
- Consumes: `ThreadView.page` and `PdfViewer` prop `page` from the data plan, Task 4.
- Produces: `GateBox(props: { checks: { label: string; ok: boolean; reason?: string }[]; gateLabel: string; onGate: () => void; onReturn: () => void })` (the gate button is enabled only when all checks pass; otherwise `aria-disabled` with the first failing reason); `MergeBox(props: { sentence: string; action: ReactNode | null; lockedReason?: string })`; `ThreadFeed(props: { threads: ThreadView[]; viewerRole: UserRole; ownUserId: string; onJumpToPage: (p: number) => void; canResolve: (t: ThreadView) => boolean })` with tabs Open (first), All, Resolved; own open threads get the amber edge class.

- [ ] **Step 1: Write the failing tests** — gate box: one failing check gives `aria-disabled` and that check's reason; Return is never disabled and never a solid red fill. Thread feed: a thread with `page: 14` renders a "p. 14" button; a thread with `page: null` renders none; a Student sees "Reply" and no "Resolve" (BR-05).
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** per `DESIGN.md` §5.3, §8.6 to §8.8. No pins or highlights on the PDF (ADR-009).
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: workspace, merge box, gate box and thread feed patterns (FR-REV-04, BR-05, BR-18)"`

---

### Task 9: Form patterns

**Files:**
- Create: `src/components/patterns/{side-sheet,slot-list,date-picker,consultation-log,defense-form,verdict}/index.tsx`
- Test: `tests/unit/components/date-picker.test.ts`, `defense-form.test.ts`, `verdict.test.ts`

**Interfaces:**
- Produces: `DatePicker(props: { earliest: Date; value: Date | null; onChange: (d: Date) => void })` (days before `earliest` are disabled with the reason "At least 7 days after Gate 1b." BR-09); `DefenseForm(props: { rows: { code: string; name: string; weight: number; score: number | null }[]; onSave: () => void; saved: boolean })` (48 px number steppers, total as a number, the line "Saved. Sign the paper sheet." only after a save); `Verdict(props: { members: { name: string; total: number | null; actionTaken: string | null }[]; canRecord: boolean; recordReason?: string; updatedAt: Date; onRefresh: () => void })` (a missing sheet is a `Flag`, never a block; refresh every 30 s while mounted).

- [ ] **Step 1: Write the failing tests** — date picker: a day before `earliest` has `aria-disabled` and the reason; defense form: no grade word and no color class on scores (F4), the total equals the sum; verdict: a member with `total: null` shows the flag "1 sheet is not saved yet." and the record control stays enabled when `canRecord`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** per `DESIGN.md` §8.10 and the specs S4, A3, A4, P4.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: side sheet, slot list, date picker, consultation log, Defense Day form and verdict patterns (BR-09, BR-15, BR-17)"`

---

### Task 10: Screens, one role at a time

Do this as four sub-tasks, each with its own commit: **10a Student** (S1 to S6, PROCESS is done), **10b Adviser** (A1 to A5), **10c Panel Member** (P1 to P4), **10d Coordinator** (C1 to C10) and **SV** with whichever role you finish last.

**Files (for each screen):** the route's `page.tsx` and its local components in `src/app/<role>/<route>/`. **Spec:** `design/screens/<ID>.md`. **Test:** a component or page test for the screen's states (at least "First day" and one working state), plus the e2e smoke in `tests/e2e/portals.spec.ts`.

For each screen:

- [ ] **Step 1:** Read `design/screens/<ID>.md`. Write a test for its "First day" state (the exact empty-state text in the spec) and for one rule in its "Rules" section.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Rebuild the page from patterns only: regions top to bottom as the spec's "Regions" table, each region with the pattern it names. Apply the spec's "Changes from the mockup".
- [ ] **Step 4:** Run `pnpm test && pnpm typecheck`. Expected: PASS.

At the end of each role:

- [ ] **Step 5:** Run `pnpm test:e2e`. Expected: PASS.
- [ ] **Step 6: Commit** — for example `git commit -m "feat: Student screens on the Guided Ledger patterns (design/screens S1 to S6)"`

Screen notes that the specs alone do not decide:
- **C4** uses the data plan's `reviewDocument(…, { to: "verified" | "returned" })`. Verify opens `ConfirmDialog`. Return opens `ReturnComposer` inline. "File details" is always shown (no disclosure).
- **C6** sheets: label the existing `match_result` actions "Verify" (`matched`) and "Return" (`mismatch`, with a reason). No schema change.
- **C10** (`/coordinator/audit`) has no page yet. Build it on `queue-table` with the filters and the CSV export from `src/server/data/audit.ts` (FR-RPT-01, FR-RPT-02). If no data function lists audit rows with filters, add `listAudit(ctx, filters)` with a Coordinator-only access check and tests first.
- **S1** title edit and **C2** title field use the data plan, Task 5. **S3** advising copies use Task 6. **C8** and **A1**/**C3** advisee flags use Task 7.

---

### Task 11: Layer rule and clean-up

**Files:**
- Modify: `eslint.config.mjs` (or the existing ESLint config file)
- Check: `src/app/coordinator/spike-files/` is gone (it was removed on `dev` before this plan; if it is back, delete it)
- Delete: the re-exports left at old component paths in Task 3 and Task 4
- Test: `pnpm lint`

- [ ] **Step 1:** Add a `no-restricted-imports` rule for `src/app/**/page.tsx`: refuse `@/components/ui/*`, `lucide-react`, `motion/react` and any `@base-ui*` import, with the message "Pages use patterns only (DESIGN.md §7.1)."
- [ ] **Step 2:** Run `pnpm lint`. Expected: FAIL on any page that still imports them. Move that code into a pattern.
- [ ] **Step 3:** Delete the old re-exports. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`. Expected: all PASS.
- [ ] **Step 4: Commit** — `git commit -m "chore: enforce the page layer rule, remove the spike route and old component paths (DESIGN.md §7.1)"`
