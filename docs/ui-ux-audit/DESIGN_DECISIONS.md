# UI/UX design decisions

**Status:** Started 25 Nov 2026. This file is the approval log of the UI/UX retrofit.
**Rules:** `DESIGN.md` holds the design rules. This file records only who approved what, on which preview, and why. When a decision changes a rule, the same task also updates `DESIGN.md`.
**Approval:** Only the owner approves. Approval applies to a real preview (screenshots and the live `/lab` page), not to a written description. Silence, a page visit or vague feedback is not approval.

## 1. Decision IDs

| Prefix | Use |
| :---- | :---- |
| `UX-D-nn` | A decision about the retrofit: process, scope, precedence |
| `UX-P-nn` | A preview round: what the owner saw, the feedback, the result |
| `D-nn` | An open point in `DESIGN.md` §14. When the owner closes it, record the `UX-` entry here and close it in `DESIGN.md`. |

## 2. Decisions

| ID | Date | Decision | Options the owner did not take | Effect |
| :---- | :---- | :---- | :---- | :---- |
| UX-D-01 | 25 Nov 2026 | **Dark mode now.** Light and dark themes are both first-class. The OS setting is the default. A manual toggle in the top bar overrides it and is kept in `localStorage`. No `next-themes`: a small inline script sets the theme before first paint. The PDF page, emails and printed views stay light. | Keep it deferred. Dark tokens now, toggle later. | Closes `DESIGN.md` D-04. Removes "There is no runtime theme switch" (§7.3). The dark token values are approved in preview round UX-P-01. |
| UX-D-02 | 25 Nov 2026 | **`DESIGN.md` v0.2 is the baseline.** The agreed work stays. A change to a v0.2 rule needs a preview, the owner's approval and a record here. Then it goes into a new `DESIGN.md` version. | v0.2 with no change path. The retrofit plan wins and only the palette is strict. | The retrofit plan sets the process. `DESIGN.md` and `design/screens/` set the content. |
| UX-D-03 | 25 Nov 2026 | **Merged references.** The §1.1 owners keep the structure: GOV.UK and USWDS for the Student path, Linear with Carbon for queues, Primer for the workspace. Linear is also the main reference for the shell, sidebar and status marks. Notion is the reference for reading comfort in the workspace and the thread feed. Stripe is the reference for forms, validation messages and confirm dialogs. | Keep §1.1 only. Replace it with Linear, Notion and Stripe. | `DESIGN.md` §1.1 gets the two new rows. |
| UX-D-04 | 25 Nov 2026 | **System states, toast and motion.** D-09: loading blocks of the content's size with no shimmer, inline errors with "Try again", and a 4 s `role="status"` toast with a glyph and a label. A toast confirms small actions only. A workflow result (Returned, Endorsed, Scheduled, Verified) stays on the screen. D-11: no React Bits. The toast uses Base UI Toast (`@base-ui/react/toast`, already installed). D-10: the owner picks the motion timings from 2 or 3 options in a preview. CSS for simple changes, `motion/react` only where CSS cannot do it, and a reduced-motion path for each animation. | Keep D-09 to D-11 blocked. | Closes D-09 and D-11 in `DESIGN.md` §14. D-10 closes in preview round UX-P-02. There is no autosave: "Saving a draft" means the save buttons that exist today. |
| UX-D-05 | 25 Nov 2026 | **Documents.** The retrofit uses only the three files in `docs/ui-ux-audit/`. `design/INVENTORY.md` moves into `UI_UX_AUDIT.md` §3. `IMPLEMENTATION_PLAN.md` replaces `docs/superpowers/plans/2026-11-25-guided-ledger-ui.md` and adds a preview gate before each round. This file is the approval log only. The owner asked for the AGENTS.md §6 row that lists these files. | Keep the old inventory and plan. Use the three files with no defined roles. | `UI_UX_AUDIT.md`, `IMPLEMENTATION_PLAN.md`, this file. Task 0.2 adds the AGENTS.md row. |

| UX-D-06 | 25 Nov 2026 | **Round H (hotfix before R1).** The owner approved a new round for the Critical finding UX-009 (a PDF load failure crashes the workspace). Owner's words: "Yes add the new round. Since we found a critical system breaking error when pdf crashes, we need to introduce the fix." Scope: Task H.1 only (the PDF error state). H.2 (the focus line, UX-001) was not part of this approval. | Wait for R5. | `IMPLEMENTATION_PLAN.md` §6.2. The viewer shows a load error in place with "Try again". The rest of the workspace stays. |

| UX-D-07 | 25 Nov 2026 | **Round H, Task H.2.** The owner added the focus-line fix (UX-001) to Round H. Owner's words: "add to round H". Scope: the class strings where `outline-none` cancels `focus-visible:outline-2`. The faint ring on native controls (UX-002) stays in R1. | Leave it for R1. | `IMPLEMENTATION_PLAN.md` §6.1 and §6.2. Focused buttons, links and fields show the 2 px maroon outline of `DESIGN.md` §10. |

| UX-D-08 | 25 Nov 2026 | **Stepper in maroon.** Completed and current steps use PUP Maroon (`--primary`), not gold. Gold stays for the `achieved` status only. Seen in the UX-P-01 preview (`/lab/patterns/stepper`). Owner's words: "yes maroon is right" (to the question "is maroon the red you meant for the stepper?"). | Gold (v0.2 §8.2). The vermilion "returned" red. | Changes `DESIGN.md` G8 and §8.2. The edit goes in with R1.5. |
| UX-D-09 | 25 Nov 2026 | **Font set B, the Source family.** Titles Source Serif 4, UI Source Sans 3, data Source Code Pro. Seen in the UX-P-01 preview (`/lab/typography`), against A (current), C (Civic) and D (Legibility). Owner's words: "B". | A: IBM Plex Sans and Plex Mono. C: Newsreader, Public Sans. D: Atkinson Hyperlegible Next and Mono. | Changes `DESIGN.md` §1 and §4 (and §12.1 font tokens). The UI text size (14 or 15 px) is still open for the gate. The edit and the `layout.tsx` font change go in with R1.5. |

| UX-D-10 | 25 Nov 2026 | **Brand guide reconciliation and the hybrid logo strategy.** Source: `THESISKO_BRAND_GUIDELINE_RECONCILIATION.md` (status "Approved product-design decision", given by the owner on 25 Nov 2026). The brand guide `ThesIsko-Design-Principles-Brand-Guidelines.docx` (v1.0, November 2026) is the source for brand identity: name, palette, logo, typography roles, mascot. The retrofit documents record how that identity applies to the product. Logo: full symbol and wordmark on the landing and login pages; symbol or text-only wordmark in the four role shells; symbol only in compact navigation. Official artwork only, no redraw, no recolor. Decorative branding (page curve, book pattern, gradients, mascot, animation) is selective and secondary to usability. | Rewrite the brand guide. Apply it everywhere with no product refinement. | Opens the brand conflicts in `UI_UX_AUDIT.md` §7 (UX-X-08 to UX-X-19). R1 stays open until the owner decides them. The two source files are outside the repository today (UX-X-19). |

| UX-D-11 | 25 Nov 2026 | **Brand alignment of R1 (closes UX-X-08 to UX-X-19).** Owner's words: "approve the decisions and proceed with the recommendations." 1) Palette from the brand guide: Golden Yellow `#F4B41A`, the brand maroon and gold ramps (hover Deep Maroon `#5C0B0F`), cool neutrals (Ink `#0F172A`, Slate `#475569`, Line `#E2E8F0`, Canvas `#F8FAFC`, White), Success `#15803D`, Error `#B91C1C`; `pending` stays orange; inputs keep a 3:1 edge. Replaces D-01 and D-02. 2) Stepper as in the brand sample: completed steps maroon, the current step gold. Revises UX-D-08. 3) Fonts Poppins (titles, headings), Inter (text, tables, forms, UI), JetBrains Mono (revision numbers, dates, IDs, counters); body 16 px, caption floor 12.8 px, ratio 1.25; table text 14 px as table metadata. Replaces UX-D-09. 4) Glyphs 1.75 px stroke, outline only, no fill. 5) Radius 6 px controls, 8 px cards, 12 px panels; focus keeps the maroon outline and adds a soft maroon ring; no gold button for now. 6) `DESIGN.md` F1 narrows to the PUP logo and seal; the ThesIsko mark is allowed; the wordmark is "ThesIsko · Graduate Thesis Progress"; emails use the horizontal logo. 7) Novie is deferred to R4 and R7 (empty states, milestones), never on serious outcomes; F1 gets an exception for Novie. 8) The brand guide, the reconciliation and the master artwork go under `docs/reference/brand/`. | Keep D-01, D-02, UX-D-08, UX-D-09 and the v0.3 shapes and icons. | R1.6 builds it in `/lab` (scoped `.r1-preview` tokens). R1.5 moves it into `tokens.css`, `layout.tsx` and `DESIGN.md`. The logo needs the master SVG files from the owner. |

| UX-D-12 | 26 Nov 2026 | **Theme toggle motion.** Owner's words: "use framer motion for the theme toggle, and only one of the icons can be seen at a time." The pill switch uses `motion/react` (the Framer Motion package, already installed): the thumb slides with a spring (stiffness 500, damping 32) and the icon turns and fades in 0.18 s; `AnimatePresence mode="wait"` keeps one icon at a time. With `prefers-reduced-motion: reduce`, every change is instant. | Wait for D-10 in UX-P-02. CSS only. | First motion in the app, ahead of D-10. D-10 still sets the other timings in UX-P-02 and can align this one. |

| UX-D-13 | 26 Nov 2026 | **Squish switch with a sun-to-moon thumb.** Owner's words: "https://reactbits.dev/micro/squish-switch. Can you use this? but instead of a circle, it is a sun or a moon morphing into the other upon toggle" and "I can give you the component itself." The owner supplied the React Bits `SquishSwitch` source. `theme-toggle` adapts it: the velocity stretch and end squash, drag, tap, Escape to cancel, hover swell; the thumb is one SVG shape that morphs from a sun into a crescent moon (rays turn away, the disc grows, a mask cutout slides in). Theme logic, "Use system" and tokens stay. Reduced motion: no stretch, no swell, instant. Replaces UX-D-12. **Open risk:** React Bits is MIT + Commons Clause, which forbids redistributing the components themselves, and this repository is public. The file header keeps the copyright and license notice. **Risk accepted (26 Nov 2026):** the owner chose option A, "commit it as is", over B (make the repository private) and C (rewrite as original code). Owner's words: "do A." | Keep the UX-D-12 pill. Build the effect in-house with no React Bits code. | Reverses D-11 ("No React Bits", UX-D-04) for this one component. |
| UX-D-14 | 26 Nov 2026 | **Theme switch: light or dark only.** Owner's words (UX-P-02): "Remove the \"Use System\" text on the theme toggle, just light or dark." The switch has no link back to the OS setting. The OS setting still applies until the first click (theme script, UX-D-01). | Keep "Use system" after a choice. | Built on `ui/r2-shell`. This changes the live shell and LOGIN at once (the switch is live since R1.5). `DESIGN.md` §7.3 and §7.4 change at R2.8. |
| UX-D-15 | 26 Nov 2026 | **Loading blocks with motion, by screen kind.** Owner's words (UX-P-02): "for the loading skeletons, also do specific loading skeletons depending on what is in the screen, as well as loading skeleton animations and other loading animations". Replaces "no shimmer" of UX-D-04 (D-09). R2 gives the shapes (rows, cards, docket, form, list), 4 page presets (dashboard, queue, record, form), the effect (pulse, option A, or shimmer, option B; 1.6 s) and an inline spinner. With reduced motion, nothing moves. | Keep still blocks (UX-D-04). | Each screen composes its own `loading.tsx` from these in R3 to R7 (`IMPLEMENTATION_PLAN.md` §10, §11). The pulse or shimmer choice is open at UX-P-02. |
| UX-D-16 | 26 Nov 2026 | **Reserve space for every message.** Owner's words (UX-P-02): "For the feedback (and anything that writes something or response to the user), make sure its shell/container has enough space/padding to include the message, so it wouldnt resize the whole container." A form message slot has one **fixed height** in every state (idle, pending, error, done): 3 lines by default (`h-15`), or 2 or 4 with `lines`. Size it for the longest message at the narrowest width. A longer message is clamped on the screen only (`line-clamp-*`); the full text stays in the DOM for screen readers and the field link, and a "Show more" toggle shows it all over the next content, so nothing moves. A pending button keeps its width (both labels in one grid cell). Addition (owner, 26 Nov 2026): "the message slot must keep one fixed height". | Let the layout grow when a message appears. Or a minimum height (`min-h-10`, the first build). | Applies to every later pattern that shows a result, an error or a count (R3 to R7). Clamp or shorten: both (owner, 26 Nov 2026: "keep both"). The clamp with "Show more" is the safety net; one fact in 25 words or fewer is the writing rule. |

### 2.1 Smaller points applied with the decisions above

| Point | Rule |
| :---- | :---- |
| Phones | Read only on every screen (D-12 stays open). The retrofit checks phones last. |
| Terms | The UI says Endorse and Return, never "approve" or "reject" (AGENTS.md §8, `DESIGN.md` §9). |
| Showcase | The development-only route `/lab`. It returns a 404 in a production build. It uses mock data only, imports nothing from `src/server/` at run time, and adds no sign-in bypass. |
| Dependencies | No new package without an entry in §4 and the owner's approval. |

## 3. Preview rounds

Copy this block for each round. Fill it after the owner reviews.

```markdown
### UX-P-nn: <round name>

- **Date shown:**
- **Branch and commit:**
- **Shown:** /lab pages, screenshots folder, viewports, themes
- **Feedback:** (owner's words, short)
- **Revisions:** (what changed, with the commit)
- **Result:** Approved | Approved with changes | Rejected | Waiting
- **Approved on:** (date, and the owner's exact approval words)
- **Rules changed in DESIGN.md:** (section and new version)
```

### UX-P-01: Foundations (R1)

- **Date shown:** 25 Nov 2026
- **Branch and commit:** `feat/design-system-inventory`, on top of `a160436`, not committed
- **Shown:** `/lab/foundations`, `/lab/glyphs`, `/lab/patterns/{status,blocked-action,flag,empty-state,identity-line,docket,stepper,theme-toggle}`. Screenshots in `ui-shots/r1/` (110: 10 pages × 5 viewports × light and dark, plus a reduced-motion pass). Each page shows light and dark side by side.
- **Decision points:** the dark values (`IMPLEMENTATION_PLAN.md` §8.1, plus `--link`, `--text-secondary`, `--divider-strong`). The toggle form (3-option radio group as built, or a menu). The `@axe-core/playwright` dev package (§4).
- **Feedback:** (25 Nov 2026) "I want our milestone stepper to be red instead of the gold. Aside from that, I want you to reconsider our choices of typography, particularly in fonts."
- **Revisions:** (25 Nov 2026, not committed) The stepper uses maroon (`--primary`): a solid maroon circle with a white check when completed, a maroon ring with a dot when current. Read as PUP Maroon, not the vermilion of "Returned". Gold stays for the `achieved` status only. (26 Nov 2026) Brand alignment R1.6 per UX-D-11: brand palette in a scoped `/lab` token set, Poppins, Inter and JetBrains Mono, 1.75 px outline glyphs, radius 6, 8, 12, soft maroon focus ring, stepper completed maroon and current gold, `brand-mark` pattern and `/lab/brand` (artwork pending). New page `/lab/typography` compares 4 font sets on real screen parts: A current (Source Serif 4, IBM Plex Sans, IBM Plex Mono), B Source family (Source Serif 4, Source Sans 3, Source Code Pro, recommended), C Civic (Newsreader, Public Sans, IBM Plex Mono), D Legibility (Source Serif 4, Atkinson Hyperlegible Next and Mono). If approved, the stepper change edits `DESIGN.md` G8 and §8.2, and a font change edits §1 and §4.
- **Feedback 2:** (26 Nov 2026) "Lets do E for the typography options. Lets make the theme toggle prettier. I am thinking of some kind of pill switch that will show a moon when dark mode and sun when light mode."
- **Revisions 2:** (26 Nov 2026, not committed) Typography E is UX-D-11 (already in the preview). `theme-toggle` is now a pill switch (`role="switch"`, name "Dark theme", tooltip): the thumb shows a deep-gold sun in light and a Golden Yellow moon in dark; both icons sit faintly in the track. It follows the OS until clicked; then a "Use system" link returns to the OS setting, so UX-D-01 keeps its System choice. Replaces the 3-option radio group. (26 Nov 2026) Motion and one icon at a time: UX-D-12.
- **Result:** Approved
- **Approved on:** 26 Nov 2026. Owner's words: "Approve the R1, then lets proceed with writing the implementation of R2, designed and written for a new session."
- **What the approval covers:** everything shown in UX-P-01 at commits `6c5c9b5` and `c7b7a71`: the brand-aligned light and dark token sets of `src/app/lab/_mock/brand-preview.css` (UX-D-11), the fonts Poppins, Inter and JetBrains Mono, the 1.75 px outline glyphs, the base patterns, the stepper (completed maroon, current gold), the squish theme switch (UX-D-13), the brand mark with its text fallback.
- **Not decided at this gate:** `@axe-core/playwright` (§4, still proposed). The master logo SVG files (still missing, UX-X-19).
- **Rules changed in DESIGN.md:** in R1.5: a new `DESIGN.md` v0.4 (palette, dark tokens §12.5, fonts §1 and §4, type scale, icons §6.2, radii §6.1, focus §10, F1 narrowed, stepper §8.2, G8, theme toggle §7.3, brand mark in §7.4).

### UX-P-02: Shell and system states (R2)

- **Date shown:** 26 Nov 2026
- **Branch and commit:** `ui/r2-shell`, on top of `9d663dd` (R1.5), not committed
- **Shown:** `/lab/patterns/{app-shell,sidebar,top-bar,toast}`, `/lab/states`, `/lab/motion`, `/lab/glyphs#candidates`. Screenshots in `ui-shots/r2/` (5 viewports × light and dark, plus a reduced-motion pass). Mock data only. No live page changed.
- **Decision points:** D-06, D-07, D-08, D-10, R2-a, R2-b, R2-c (`IMPLEMENTATION_PLAN.md` §9.0). Sidebar data facts of Task R2.1 (below).
- **Feedback:** (26 Nov 2026) "Status Glyphs: Use option B, except for pending. Sidebar Glyphs: use option A except for Availability. Remove the \"Use System\" text on the theme toggle, just light or dark." Notifications: "let them be clickable so the user can just click the notification … and it will bring them to the matter. No need to implement, you can write this as a gh issue." "D-08: Lets also do a route/command palette. But for its features and scope, lets leave it for later discussion." Reserve space for messages, and loading skeletons for each screen with animations. "D-10: Lets do A. R2-a: Option A. R2-b: Option A. R2-c: A."
- **Decisions taken in this feedback:** D-06: active B (arrow in a circle), pending A (hourglass), achieved B (trophy). D-07: option A for all, Availability B. D-08: option A plus a route or command palette; the palette scope is open (later discussion). D-10: option A. R2-a: A. R2-b: A. R2-c: A (1280 px). New: UX-D-14, UX-D-15, UX-D-16. Issue #82 (clickable notifications, a feature change).
- **Revisions:** (26 Nov 2026, not committed) The 13 chosen glyphs are in `GLYPHS` and in the sidebar; the pills switch from Lucide at R2.8. `--motion-*` tokens (D-10 A) in `tokens.css`; the patterns use them. The theme switch has no "Use system" link (UX-D-14). Loading shapes, page presets, pulse or shimmer, spinner (UX-D-15). `FormFeedback` keeps two lines free and `PendingButton` keeps its width (UX-D-16). New screenshots in `ui-shots/r2/`.
- **Open at the gate, closed with the recommendation:** the owner approved without an answer to the 2 open points, so the recommendations apply: the loading effect is the pulse (option A); the Student shell makes one more call, `submissionFor(ctx, milestoneId)` (Manuscript link), and derives `sheetsVerified` from the milestone status (CLOSED or later), with no `defenseDetail` call. The owner can change either at any time.
- **Result:** Approved
- **Approved on:** 26 Nov 2026. Owner's words: "R2 Approved".
- **What the approval covers:** the R2 preview on `ui/r2-shell` as shown after feedback pass 1: app shell, sidebar (R2-a A, R2-b A, R2-c A), top bar (D-08 A plus a palette with open scope), toast, loading (UX-D-15, pulse), error, form feedback (UX-D-16), motion (D-10 A), glyphs (D-06, D-07 as chosen), theme switch without "Use system" (UX-D-14).
- **Rules changed in DESIGN.md:** at R2.8: §5.1 (sidebar look, content width 1280 px), §6.1 (motion tokens, loading motion), §6.2 (new glyphs), §7.3 and §7.4 (theme switch without "Use system"), §8.4 (reserved message space), §14 (D-06, D-07, D-08, D-10).

### UX-P-03: Queues, inbox and dialogs (R3)

- **Date shown:** 26 Nov 2026
- **Branch and commit:** `ui/r3-patterns`, on top of `b72ff4a`, not committed
- **Shown:** `/lab/patterns/{queue-table,kpi-strip,inbox,return-composer,dialog,side-sheet,form-field}` and `/lab/states` (R3.7 contract). Screenshots in `ui-shots/r3/` (5 viewports × light and dark, plus a reduced-motion pass). Mock data only. No live page changed.
- **Decision points:** R3-a to R3-h (`IMPLEMENTATION_PLAN.md` §10.0), and R3-i (new, below). `form-field` in the registry (§6.1 row R3). The data facts of §10.0 (no new data function).
- **R3-i (new, found in the preview):** a blocked row action in a compact (48 px) row. The reason under the button (`BlockedAction`) makes the row taller and breaks UX-D-16. Option A (built, recommended): the button shows a `lock` glyph, stays focusable with `aria-disabled`, and the reason is linked with `aria-describedby` and shown in a tooltip on hover and focus (the `DESIGN.md` §8.5 compact rule). Option B: the row grows to show the reason under the button. Comfortable rows keep the reason under the button.
- **Contract detail (R3.7):** an error that the server names for a field shows under that field (`role="alert"`, linked, `aria-invalid`), per `DESIGN.md` §10. Every other error and every result show in the form's `FormFeedback` slot.
- **Changes to approved R2 parts:** `SheetPopup` moved from `top-bar` into `side-sheet` (top bar unchanged: 400 px, R2 backdrop). `PendingButton` gets an optional `form` attribute (a footer button outside its form). The `--scrim` token is in `tokens.css` for the R3-g preview; nothing live uses it yet.
- **Feedback:** (26 Nov 2026) "For the Queue table, I want to be able to collapse or expand the sub-headers (Check scans, Confirm dates, etc.). Then select A for R3-b,c,f. R3-a: Choose option A. R3-e: Choose A. R3-g: Choose A, scrim token. R3-d: Use 480px, as recommended."
- **Decisions taken in this feedback:** R3-a A (late after 5 days, one value). R3-b A (stacked rows on a phone). R3-c A (one line, full text in a tooltip and on focus). R3-d B (480 px). R3-e A (focus starts on Cancel). R3-f A (outline row actions, maroon for the one next step). R3-g A (the `--scrim` token). New: collapsible group headers in `queue-table`.
- **Closed at the gate:** R3-h A (wire `ConfirmDialog` to the live permanent actions at R3.10), R3-i A (a blocked row action in a compact row shows a `lock` glyph, and its reason in a tooltip linked with `aria-describedby`), `form-field` joins the `DESIGN.md` §7.4 registry.
- **Revisions:** (26 Nov 2026, not committed) `queue-table`: `groupBy.collapsible` makes each group header a disclosure button (`aria-expanded`, `aria-controls` on the rows of the group, a chevron that turns with `--motion-state`, still with reduced motion); `groupBy.defaultCollapsed` starts groups closed; the count stays. The `/lab` pages show the chosen options by default (dialog and sheets with `--scrim`, the sheet at 480 px, the KPI strip with option A). The live top bar keeps the R2 backdrop until R3.10. New screenshots in `ui-shots/r3/`.
- **Feedback 2:** (26 Nov 2026) "notice how the subheaders under student overlaps with the Form column. Can you widen the columns so it looks uniform?"
- **Revisions 2:** (26 Nov 2026, not committed) The C1 Student column is 220 px, so every group label (chevron, glyph, label, count) ends inside it (12 px or more before the Form column). The pattern note says the first column must fit the longest group label. Found in the same check: at tablet width the fixed columns were wider than the table, and "Request" overlapped "Milestone". Fix: a compact table has a minimum width (its fixed columns plus 120 px for the flexible column) and scrolls inside its frame below that; a column can hide below 1024 px (`hideBelowLaptop`, G5), used for Milestone on C1. Phones keep the stacked rows (R3-b A).
- **Result:** Approved
- **Approved on:** 26 Nov 2026. Owner's words: "R3 approved, go with A, A and yes" (A for R3-h, A for R3-i, yes for `form-field` in the registry).
- **What the approval covers:** the R3 preview on `ui/r3-patterns` after feedback pass 2: `queue-table` (collapsible groups, minimum width, laptop-only columns, R3-b A, R3-c A, R3-f A, R3-i A), `kpi-strip` (R3-a A, late after 5 days), `inbox`, `return-composer`, `dialog` (R3-e A), `side-sheet` (R3-d 480 px, R3-g A `--scrim`), `form-field` and the one form-feedback contract, the R3.8 loading shapes.
- **Rules changed in DESIGN.md:** at R3.10 (`DESIGN.md` v0.6): §5.4 (row actions, blocked row action R3-i, collapsible groups), §5.6 (tables on a phone R3-b, tablet minimum width), §7.4 (new `form-field` row; `queue-table`, `side-sheet`, `dialog` details), §8.4 (field message slot), §8.9 (dialog focus R3-e, `--scrim` R3-g), §10 Forms (the contract), §12.4 (`--scrim`).

**Sidebar data facts (Task R2.1).** No new data function. The role shell reads these at Integrate:

| Fact | Role | Existing function | Field | Gap |
| :---- | :---- | :---- | :---- | :---- |
| `milestone`, `milestoneId` | Student | `studentTracker(ctx)` | `current.code`, `current.milestoneId` | None |
| `gate1bDone` | Student | `studentTracker(ctx)` | `keyDates.earliestDefenseDate !== null` (set from Gate 1b) | None |
| `defenseId` | Student | `studentTracker(ctx)` | `defense.attemptId` | None |
| `prId` | Student | `submissionFor(ctx, milestoneId)` | `pr.id` (the dashboard calls it today for "Open the manuscript") | One more call in the shell |
| `sheetsVerified` | Student | `defenseDetail(ctx, attemptId)` | every `sheets[].verified` | One more call in the shell. Option: derive it from `current.status` (CLOSED or later), with no call |
| `defenseId`, `prId` | Adviser | `adviserDashboard(ctx)` | `advisees[].attemptId`, `advisees[].prId` | Many advisees: R2-b picks the record |
| `defenseStarted` | Adviser | none | `AdviseeRow` has no start time | Item shows open; the A5 page keeps its own block |
| `prId`, `panelAccess`, `defenseId`, `defenseStarted` | Panel Member | `panelDashboard(ctx)` | `assignments[].prId`, `.access.open`, `.attemptId`, `.defense.startsAt <= now` | Many assignments: R2-b picks the record |
| none | Coordinator | none | No locked item | None |

| Round | Scope | Result |
| :---- | :---- | :---- |
| UX-P-01 | Foundations: tokens in light and dark, the theme toggle, glyphs, base patterns | **Approved 26 Nov 2026** |
| UX-P-02 | Shell and system states: app shell, sidebar, top-bar panels (D-08), status glyphs (D-06), sidebar glyphs (D-07), toast, loading and error, motion (D-10) | **Approved 26 Nov 2026** |
| UX-P-03 | Queues, inbox, dialogs, side sheet, form field (R3) | **Approved 26 Nov 2026** |
| UX-P-04 | Student path: task list, step-by-step, Thesis process | Not shown |
| UX-P-05 | Manuscript workspace | Not shown |
| UX-P-06 | Forms and Defense Day | Not shown |
| UX-P-07a to 07d | Screens by role: Student, Adviser, Panel Member, Coordinator (with SV and LOGIN) | Not shown |

### Notes for UX-P-07 (from Task R1.5, 26 Nov 2026)

These old components have props that differ from their patterns, so R1.5 did not re-export them. R7 moves their screens onto the patterns.

| Old component | Call sites | Difference |
| :---- | :---- | :---- |
| `ActionButton` (`src/components/action-button.tsx`) | 8 files | Prop `blockedReason`; the pattern `BlockedAction` uses `reason` and `variant` |
| `Docket` (`src/components/docket.tsx`) | 1 file | Different props from the `docket` pattern |
| `MilestoneStepper` (`src/components/milestone-stepper.tsx`) | 1 file | Props `current` (0 to 3) and `allDone`; the pattern uses `current` (1 to 4) and `completed`. Its colors already match UX-D-11. |
| `FlagBanner` (`src/components/banners.tsx`) | 7 files | Different props from the `flag` pattern |

## 4. Dependency proposals

| Package | Use | Why not an existing package | Status |
| :---- | :---- | :---- | :---- |
| `@axe-core/playwright` (dev only) | Automatic accessibility checks on `/lab` and the e2e pages | Nothing in the repository checks WCAG rules automatically | Proposed. Ask at UX-P-01. |

## 5. Constraints for later work

- Keep the routes, screens, flows, roles, data layer and API contracts as they are. A retrofit change is presentation only, unless the plan names a data function (for example `listAudit` for C10) and the owner approves it.
- A pattern that the owner approved changes only through a new preview round.
- Never record "Approved" without the owner's exact words and the date.
