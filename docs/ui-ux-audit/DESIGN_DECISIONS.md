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
- **Result:** Waiting
- **Approved on:**
- **Rules changed in DESIGN.md:**

| Round | Scope | Result |
| :---- | :---- | :---- |
| UX-P-01 | Foundations: tokens in light and dark, the theme toggle, glyphs, base patterns | Waiting (preview built 25 Nov 2026) |
| UX-P-02 | Shell and system states: app shell, sidebar, top-bar panels (D-08), status glyphs (D-06), sidebar glyphs (D-07), toast, loading and error, motion (D-10) | Not shown |
| UX-P-03 | Queues, inbox and dialogs | Not shown |
| UX-P-04 | Student path: task list, step-by-step, Thesis process | Not shown |
| UX-P-05 | Manuscript workspace | Not shown |
| UX-P-06 | Forms and Defense Day | Not shown |
| UX-P-07a to 07d | Screens by role: Student, Adviser, Panel Member, Coordinator (with SV and LOGIN) | Not shown |

## 4. Dependency proposals

| Package | Use | Why not an existing package | Status |
| :---- | :---- | :---- | :---- |
| `@axe-core/playwright` (dev only) | Automatic accessibility checks on `/lab` and the e2e pages | Nothing in the repository checks WCAG rules automatically | Proposed. Ask at UX-P-01. |

## 5. Constraints for later work

- Keep the routes, screens, flows, roles, data layer and API contracts as they are. A retrofit change is presentation only, unless the plan names a data function (for example `listAudit` for C10) and the owner approves it.
- A pattern that the owner approved changes only through a new preview round.
- Never record "Approved" without the owner's exact words and the date.
