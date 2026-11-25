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

| Round | Scope | Result |
| :---- | :---- | :---- |
| UX-P-01 | Foundations: tokens in light and dark, the theme toggle, glyphs, base patterns | Not shown |
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
