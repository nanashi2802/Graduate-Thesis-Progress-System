# DESIGN.md — PUP CpE Thesis Progress Monitoring System

**Status:** Draft v0.2 (24 Nov 2026). The owner agreed to it in a grilling session. It is not yet built.
**Change log:** v0.2, 24 Nov 2026:
- **Principles:** the Guided Ledger set (§2) replaces P1 to P8. It adds "Teach at the edges" and a text budget.
- **Modular system:** a three-layer system (§7) and a Pattern registry (§7.4).
- **Icons:** a domain glyph set replaces Lucide for thesis concepts (§6.2).
- **Coordinator density:** 48 px rows and equal row actions.
- **C4 actions:** Verify or Return only (PRD D-28).
- **Page references:** page references on comments (PRD D-26). This fixes the old §7.8 page-anchor note.
- **Motion:** the motion duration rules are on hold (D-10).

v0.1 is in `docs/stale/DESIGN_v0.1.md`.
**Scope:** The visual and interaction design of the web app (31 routes) and the system emails. One spec for each screen is in `design/screens/<ID>.md`. This file holds the principles, the tokens, the patterns and the rules that all screens share.
**Not a source:** The Google Stitch screens in `design/stitch/` are a prototype only. This file does not derive from them.
**Fixed input from the owner:** Use the PUP colors (dark maroon and golden yellow). Do not use the PUP logo, seal or any image symbol (intellectual property constraint).
**Sources:** Unified Thesis Process v1.2, Functional Requirements v1.2, `spec/SITEMAP.md`, `GLOSSARY.md`, the change proposals in `spec/proposals/2026-11-24-design-session-changes.md`.

> **Replaces UTP v1.1 §1.7 visual guidance.** The owner confirmed the three changes: IBM Plex Sans instead of Inter, warm neutrals instead of cool slate, and a defined vermilion for "returned". UTP v1.2 must point to this file.

---

## 1. The design plan

```
Name:      Guided Ledger
Purpose:   Four roles track one thesis through three defenses and clearance.
           Students check weekly. The Coordinator works the queues every day.
           Panel Members use a tablet on Defense Day.
Treatment: Utility, leaning product. Calm and exact. A registrar's ledger that
           also shows each user the next step.
Type:      Source Serif 4 (titles) / IBM Plex Sans (UI) / IBM Plex Mono (data)
Color:     ground #FAF8F8, ink #1E1617, action PUP Maroon #800000,
           achieved PUP Gold #F4C430
Layout:    Identity line, then the Docket (where am I, what blocks me, what can
           I do now), then ruled sections. At most 3 cards on a screen.
Density:   Comfortable for Students and Advisers. Compact for the Coordinator.
           Large targets on Defense Day.
```

### 1.1 Reference owners

Each kind of screen borrows from one proven public system. The reference sets the pattern, not the look. The look comes from this file.

| Screens | Reference | What we take |
| :---- | :---- | :---- |
| Student screens (S1, S3 to S6, PROCESS) | GOV.UK Design System, USWDS | Step-by-step navigation, task lists, plain words, one thing per page |
| Coordinator, Adviser and Panel Member queues and lists | Linear, with IBM Carbon for table details | Dense queues, one action for each row, keyboard first, filters as chips |
| Manuscript workspace and submission view (S2, A2, P2, SV) | GitHub Primer | Pull-request layout, merge box, commit list, comment threads |
| Empty and first-day states | Vercel Geist | Empty states that teach the next step |
| Review checklist | ui-ux-pro-max skill (`.claude/skills/ui-ux-pro-max/`) | "Accessible and ethical, minimalism and Swiss" checks. We do not use its palette, fonts or layout patterns. |

---

## 2. Principles (Guided Ledger)

| # | Principle | Rule | Source |
| :---- | :---- | :---- | :---- |
| G1 | **One job per screen** | Each screen has one primary job. The Docket names it. Each region has one maroon button at most. | NFR-04, UTP 1.7 |
| G2 | **Show only what is relevant** | A user sees only their own degree level, their current milestone and their own role. No Doctoral forms for a Master's Student. No Milestone 3 items in Milestone 1. | Owner |
| G3 | **Always show the whole path** | The stepper shows all four steps. Future steps are visible but locked. The Student's Thesis process screen shows every step in full. | Owner |
| G4 | **Teach at the edges** | See §2.1. | Owner |
| G5 | **Details on demand** | A list row shows 3 facts at most. More facts go behind a hover, a "?" or a link to the record. | Owner |
| G6 | **Space first, rules second, cards last** | Group with space. Separate with hairline rules. Use a card only for a region that must stand apart. At most 3 cards on a screen. | Owner |
| G7 | **Two densities** | Comfortable for Students and Advisers. Compact for the Coordinator (§5.4). | Owner |
| G8 | **Maroon is action, gold is earned** | Maroon marks the thing to do now. Gold marks a milestone achieved and the current step. Neither is decoration. | UTP 1.7 |
| G9 | **Paper is the record** | The screen is the index of the signed paper. The UI says "recorded" or "verified", never "signed". | BR-01 |
| G10 | **Every blocked action explains itself** | A disabled action shows its reason next to it (§8.4). | BR-18 |
| G11 | **Plain words** | ASD-STE100 at about 80%. No enum names, codes or system words in the UI. | AGENTS.md §5 |
| G12 | **Accessible by default** | WCAG 2.2 AA. 44 px targets on tablet (§10). | NFR-09 |

**Fixed rules.** These come from the domain rules. No design change may break them.

| # | Rule | Source |
| :---- | :---- | :---- |
| F1 | Use no PUP logo, seal, emblem or image symbol anywhere: app, emails, favicon, documents. No icon may copy or suggest a part of the PUP logo. | Owner (intellectual property) |
| F2 | A flag warns. It never blocks and never looks like a block. | BR-17 |
| F3 | Nothing is deleted, so no solid red (destructive) button exists. | BR-19 |
| F4 | Scores are numbers only. No grade, no grade equivalent, no color on scores. | BR-15 |
| F5 | The same status looks the same on every screen. | UTP 1.7 |

### 2.1 Teach at the edges

The system teaches the user, but only at the edges of the work. The working surface carries labels, not sentences.

| Teaching text appears only in | Example |
| :---- | :---- |
| Empty and first-day states | "No scans are waiting. New scans appear here when a Student uploads one." |
| The reason next to a disabled action | "Locked until Gate 1b." |
| Dialogs | "Verify TDW 12 for Dino Aquino? This locks the document." |

**Text budget:**

| Surface | Budget |
| :---- | :---- |
| Comfortable screens (Student, Adviser, Panel Member) | One helper line in each region at most |
| Compact screens (Coordinator) | No helper lines. Labels only. |
| List rows | 3 facts at most (G5). Reasons and full titles go in a tooltip. |
| Any rule | Say it once. A rule that a dialog explains is not repeated on the page. |

---

## 3. Color

### 3.1 Brand

| Token | Hex | Use |
| :---- | :---- | :---- |
| `maroon-600` (**PUP Maroon**) | `#800000` | Primary buttons, links, focus ring, active navigation marker, masthead rule |
| `gold-400` (**PUP Gold**) | `#F4C430` | Achieved pills, the current stepper step, the focus ring on maroon surfaces |

> **Warning:** Gold on white has a contrast of 1.64:1. Never put gold text on a light surface. Never use a gold fill without a maroon or ink label on it.

### 3.2 Ramps

| Step | Maroon | Gold | Neutral (warm) |
| :---- | :---- | :---- | :---- |
| 0 | | | `#FFFFFF` surface |
| 50 | `#FBF3F3` | `#FFFBEB` | `#FAF8F8` ground |
| 100 | `#F5E1E1` | `#FFF6D6` | `#F4F1F1` sunken |
| 200 | `#E9BFBF` | `#FCE7A1` | `#E7E1E1` hairline |
| 300 | `#D69393` | `#F8D35E` | `#D3CBCB` divider strong |
| 400 | `#BA5F5F` | `#F4C430` | `#A59A9C` disabled text on white (non-essential only) |
| 500 | `#9E2B2B` | `#D9A600` | `#8C8082` input border (3.80:1) |
| 600 | `#800000` | `#A87F00` | `#6E6264` muted text (5.84:1) |
| 700 | `#6B0000` hover | `#7A5C00` | `#4A3F41` secondary text (10.10:1) |
| 800 | `#560000` pressed | | `#2E2426` |
| 900 | `#3D0505` | | `#1E1617` ink (16.79:1 on ground) |

### 3.3 Semantic tones

Statuses use seven tones. Each pill always has a glyph and a text label, so color is never the only cue (WCAG 1.4.1).

| Tone | Text | Fill | Border | Glyph | Meaning |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `neutral` | `#5B5052` | `#F4F1F1` | `#E7E1E1` | `todo` [D-06] | Not started. Draft. |
| `active` | `#1F4E8C` | `#E7EEF8` | `#BCD0EC` | [D-06] | In progress. The next step is with someone. |
| `pending` | `#8F4A06` | `#FCEEDD` | `#F1CFA6` | [D-06] | Waiting for a person. Provisional. Flag. |
| `done` | `#1B6B45` | `#E5F3EA` | `#B7DDC5` | `done` [D-06] | Approved, resolved, verified. |
| `returned` | `#B3261E` | `#FCE9E7` | `#F2BDB8` | `return` [D-06] | Sent back with a written reason. |
| `locked` | `#4A3F41` | `#EFEBEB` | `#D3CBCB` | `lock` [D-06] | Cannot change until an event. |
| `achieved` | `#3D0505` | `#F4C430` | `#D9A600` | [D-06] | A milestone is achieved. Gold, earned. |

All text and fill pairs pass WCAG AA (4.5:1 or more). The lowest pair is `returned` at 5.59:1.

- **Pending is orange:** gold belongs to `achieved`, so "waiting" never reads as "achieved".
- **Returned is vermilion:** maroon is the action color. "Returned" appears only as a tinted pill, text or an outline button, never as a solid button (F3).
- **Verified is green:** a verified document uses `done`. Gold is only for a milestone achieved.

### 3.4 Colors in third-party components

A component from a library (shadcn, React Bits or other) takes our tokens. It never keeps its own palette. Map its color props to the semantic tokens in §12: surface, ink, maroon for action, and the tone colors for status. If a component cannot take our tokens, do not use it.

### 3.5 Status mapping

**Milestone status (UTP 2.3).** Show the label, not the enum.

| Enum | Label | Tone |
| :---- | :---- | :---- |
| `DRAFT` | Draft | neutral |
| `READY` | Ready for review | active |
| `ADVISER_ENDORSED` | Adviser endorsed | active |
| `COMMITTEE_APPOINTED` / `PANEL_APPOINTED` | Committee appointed / Panel appointed | active |
| `COMMITTEE_ENDORSED` | Endorsed, manuscript locked | locked |
| `DATE_PROPOSED` | Date proposed | pending |
| `DEFENSE_SCHEDULED` | Defense scheduled | active |
| `DEFENSE_HELD` | Defense held | active |
| `CLOSED` | Stage closed | done |
| `CERTIFIED` | Certified | achieved |
| `FINAL_APPROVED` | Final approved | achieved |
| `CLEARED` | Cleared | achieved |
| `RETURNED` | Returned | returned |

**Outside statuses (Ethics, IPMO, RPO, copyright).** `NOT_SUBMITTED` and `NOT_APPLIED` are neutral. `UNDER_*` and `APPLIED` are pending. `CHANGES_REQUIRED` and `FAILED` are returned. `APPROVED`, `PASSED`, `DONE` and `REGISTERED` are done.

**Document lifecycle.**

| State | Tone | Note |
| :---- | :---- | :---- |
| Not started | neutral | |
| Prepared | neutral | |
| Scan uploaded | pending | |
| Locked as submitted | locked | |
| Verified | done | The signed paper matches the scan and is final (FR-DOC-06). |
| Returned | returned | Includes a paper difference (FR-DOC-07) |

---

## 4. Typography

| Role | Font | Notes |
| :---- | :---- | :---- |
| Title | Source Serif 4 (variable, `opsz`) | Page titles, thesis title, Defense Day header. Weight 600. Never below 22 px. |
| UI and body | IBM Plex Sans | All UI text. Weights 400, 500 and 600 only. |
| Data | IBM Plex Mono | Commit tags, form numbers (TDW 07), dates and times, file hashes, KPI counts. Weight 400 to 600. |

All three fonts use the SIL Open Font License. Load them with `next/font/google`. They are self-hosted at build time (NFR-06).

### 4.1 Scale

| Token | Size / line height | Font, weight | Use |
| :---- | :---- | :---- | :---- |
| `kpi` | 36 / 36 | Mono 600 | KPI strip counts (C1) |
| `display` | 36 / 44 | Serif 600 | Thesis title on the Student dashboard |
| `title` | 28 / 36 | Serif 600 | Page title |
| `heading` | 20 / 28 | Sans 600 | Section heading |
| `subheading` | 16 / 24 | Sans 600 | Region heading, dialog title |
| `body` | 16 / 24 | Sans 400 | Default text, forms, threads |
| `ui` | 14 / 20 | Sans 400 or 500 | Tables, buttons, navigation, pills |
| `caption` | 12 / 16 | Sans 500 | Disabled-action reasons, timestamps in lists |
| `mono` | 13 / 20 | Mono 400 | Commit tags, form numbers, dates |

### 4.2 Rules

- Use sentence case for headings, buttons and labels.
- Use tabular figures for scores, counts, dates and the KPI strip.
- Write dates in Philippine Standard Time, in one format: `Tue 12 Jan 2027, 09:00 PHT`. Use relative time ("6d") only next to an absolute date or in a queue age column (NFR-11).
- Keep reading text at 72 characters or fewer for each line. Critique threads use a 60-character measure.
- Use `text-wrap: balance` for titles and `text-wrap: pretty` for body text.
- Truncate a thesis title in tables at one line. Show the full title in a tooltip and on focus.

---

## 5. Layout

### 5.1 App shell

```
┌──────────────────────────────────────────────────────────────────────┐ 3 px maroon masthead rule
│ PUP CpE Thesis Progress   [Find a Student or form  /]      [bell] [user] │ top bar 56 px
├────────────┬─────────────────────────────────────────────────────────┤
│ Dashboard  │ Identity line: thesis title · Master's · Adviser          │
│ Process    │ ┌ DOCKET ─────────────────────────────────────────────┐ │
│▌Manuscript │ │ Step 2 of 4 · Pre-Final · Ready for review           │ │ where am I
│ Documents  │ │ Blocks: your Adviser has open comments.              │ │ what blocks me
│ Schedule   │ │                                   [ Open manuscript ]│ │ what can I do
│ 🔒 Clearance│ └─────────────────────────────────────────────────────┘ │
│ sidebar    │ ─── This milestone ──────────────────────────────────── │ ruled sections
└────────────┴─────────────────────────────────────────────────────────┘
```

| Region | Rule |
| :---- | :---- |
| Masthead rule | A 3 px PUP Maroon line at the top of every page. The only full-width brand color. |
| Sidebar | 240 px, fill `neutral-100`. Each item has a domain glyph. The active item has a 3 px maroon left marker and maroon text. The sidebar shows **every** item of the role. An item that is not open yet shows a `lock` glyph, and its reason in a tooltip ("Opens at Gate 1b"). Below 1024 px, the sidebar becomes a drawer. |
| Top bar | Wordmark, search, notification bell, user menu. Fill white with a hairline bottom border. |
| Content | Maximum 1200 px wide. Gutters: 32 px on desktop, 24 px on tablet, 16 px on phone. |

### 5.2 Identity line

The first line of a record screen. It names whose thesis the screen shows: the thesis title (serif), the degree level, the Adviser and, when appointed, the committee. On the Student's own screens it shows the title and the degree level only.

### 5.3 The Docket

The Docket is the first card of a record screen.

| Row | Content |
| :---- | :---- |
| 1. Where am I | "Step x of 4", the milestone name and the status pill |
| 2. What blocks me | One short reason from SITEMAP §9. If nothing blocks: "Nothing blocks this step." |
| 3. What can I do now | One primary button. A direct "Download form" link when the step needs a form. |

| Screen | Docket form |
| :---- | :---- |
| S1 | Full Docket. On day one it adds a "See the whole process" link. |
| S2, A2, P2 | A compact merge box (Primer) above the workspace. On A2 and P2 it is the gate box: each condition with a pass or fail glyph, then the gate button. |
| C1 | The KPI strip, because the Coordinator acts on queues, not on one record. |

### 5.4 Densities

| Item | Comfortable (Student, Adviser, Panel Member) | Compact (Coordinator) |
| :---- | :---- | :---- |
| Table row height | 56 px | 48 px |
| Cell padding | 16 px | 16 px, fixed column widths |
| Row action | Text button or secondary button | Secondary button, fixed width 132 × 32 px, one or two words ("Check scan", "Confirm date") |
| Helper lines | One for each region at most | None |
| Facts for each row | 3 at most | 3 at most, with a separate Form column for form numbers |

All row actions in one table have the same width. Only the single next step on a first-day screen is maroon.

### 5.5 Spacing

Use a 4 px base. Tokens: `4, 8, 12, 16, 24, 32, 48, 64`. Each step is at least 25% larger than the last one.

| Relationship | Space |
| :---- | :---- |
| Label to field | 8 |
| Field to field | 16 |
| Inside a section | 24 |
| Section to section | 48, with a hairline rule |
| Docket padding | 24 |

### 5.6 Breakpoints

| Name | Width | Change |
| :---- | :---- | :---- |
| phone | < 640 | One column. Tables become stacked rows. **Read only on every screen for now** (D-12). |
| tablet | 640 to 1023 | Sidebar drawer. Thread feed tab. Defense Day is fully supported. 44 px targets. |
| laptop | ≥ 1024 | Full shell. Split workspace. |

---

## 6. Shape, depth, motion and icons

### 6.1 Shape, depth and motion

| Item | Rule |
| :---- | :---- |
| Radius | Controls 4 px. Cards and dialogs 6 px. Status pills fully round. Document stamps 2 px. |
| Borders | 1 px hairline `neutral-200` between regions. Inputs use `neutral-500` (3.80:1). |
| Shadow | None on the page. Popovers, menus, toasts and dialogs only: `0 8px 24px rgb(30 22 23 / 0.12)`. |
| Motion | Use the `motion` package (`motion/react`) for animation. Respect `prefers-reduced-motion`: every animation must have a reduced-motion path. No counting numbers. The durations and the entry-animation rule are **on hold** (D-10). |
| Gradients | None. |

### 6.2 Icons: the domain glyph set

Thesis concepts use custom glyphs. Generic UI uses Lucide.

| Rule | Value |
| :---- | :---- |
| Grid | 24 × 24 |
| Stroke | 1.5 px, round caps, round joins |
| Fill | One tone fill on the object (class `tone`, `currentColor` at 16% opacity) |
| Sizes | 16 px in text, 20 px in buttons and the sidebar, 30 px in the KPI strip |
| Labels | A glyph sits with a label, except in an icon button that has an `aria-label` |
| Forbidden shapes | No star, seal, laurel, torch or other part of the PUP logo (F1) |
| Location | `src/components/patterns/glyphs/`. The set can be swapped in one place. |
| Lucide | Only for generic UI: search, chevrons, close, menu, external link |

**Approved glyphs:**

| Glyph | Concept | Picture |
| :---- | :---- | :---- |
| `scan` | Check a scan | A page on a scanner bed |
| `verify` | Verify | A scan over paper, with a check |
| `flag` | Flag (BR-17) | A pennant, not an alarm |
| `return` | Return | Back to the sender's tray |
| `seat` | Committee seat | A chair to fill |
| `calendar` | Defense date | A calendar with a check |
| `defense` | Defense | A presentation screen on a stand |
| `gate` | Gate (1a, 1b, 2) | A gate with posts |
| `commit` | Commit | A node on a line |
| `clear` | Clearance | A checked stack of paper |
| `template` | Template | A blank form |
| `overview`, `student`, `users`, `audit`, `export`, `search`, `bell`, `done`, `todo`, `lock`, `received` | Shell and status | As drawn in the Coordinator mockup |

The SVG source of every approved glyph is in `design/mockups/coordinator-mockups.html` (the `<symbol>` elements). The `defense` glyph is `g-def-a`. Options B and C (`g-def-b`, `g-def-c`) were not chosen.

The glyphs for the Student, Adviser and Panel Member sidebars and three status glyphs are still to draw (D-06, D-07).

---

## 7. The modular design system

The UI must change one part at a time. The owner reviews each screen in the real app and asks for changes for each screen. So the system has three layers. A page never reaches past its layer.

### 7.1 Layers

| Layer | Location | Holds | Rule |
| :---- | :---- | :---- | :---- |
| 1. Tokens | `src/styles/tokens.css` | Primitive tokens (ramps), semantic tokens (surface, ink, action, tones), pattern tokens (row height, row-action width, KPI size) | Only this file holds raw colors and sizes |
| 2. Patterns | `src/components/patterns/<name>/` | One folder for each pattern in §7.4 | Uses tokens only. Has a fixed props contract. |
| 3. Pages | `src/app/**/page.tsx` | Composition of patterns and data | Uses patterns only. No raw colors, no direct shadcn or library import. |

### 7.2 Pattern contract

Each pattern folder holds:
- `index.tsx`: the component. Its first comment names the reference source, for example `// Source: GOV.UK task list`.
- A typed props contract. To replace a pattern, write a new implementation of the same contract.
- No data access. Patterns take data through props.

A lint rule can enforce layer 3: no import from `@/components/ui/*` or a library inside `src/app/**/page.tsx`.

### 7.3 How a change works

1. The owner names a screen and the change.
2. If the change is local to one screen, change the page composition.
3. If the change concerns a pattern, change the pattern. Every screen in its registry row changes with it.
4. If the change concerns a color or a size, change a token.

There is no runtime theme switch.

### 7.4 Pattern registry

| Pattern | Folder | Source | Screens |
| :---- | :---- | :---- | :---- |
| App shell | `app-shell` | Linear, Primer | All signed-in screens |
| Sidebar with locked items | `sidebar` | Linear | All signed-in screens |
| Identity line | `identity-line` | Primer repository header | S1 to S6, A2, P2, C6, SV |
| Docket | `docket` | GOV.UK notification banner, own | S1 |
| Merge box | `merge-box` | Primer pull-request merge box | S2 |
| Gate box | `gate-box` | Primer merge box with checks | A2, P2 |
| Milestone stepper | `stepper` | Own (ledger) | S1, A1, P1, PROCESS |
| Step-by-step | `step-by-step` | GOV.UK step-by-step navigation | PROCESS |
| Task list | `task-list` | GOV.UK task list | S1, S3, S6, C7 |
| Queue table | `queue-table` | Linear, Carbon data table | A1, P1, C1, C2, C3, C8, C9, C10 |
| KPI strip | `kpi-strip` | Linear, own | C1 |
| Inbox (list, viewer, record) | `inbox` | Linear triage, Primer file view | C4, C5, C6 |
| Side-sheet form | `side-sheet` | Primer side sheet | C2, C3, C8, C9, A4, P3 |
| Manuscript workspace | `workspace` | Primer pull request | S2, A2, P2 |
| PDF viewer | `pdf-viewer` | Own (react-pdf) | S2, A2, P2, C4, SV |
| Commit selector | `commit-selector` | Primer commit list | S2, A2, P2, SV |
| Thread feed | `thread-feed` | Primer review comments | S2, A2, P2 |
| Slot list | `slot-list` | GOV.UK radios, Linear list | S4, A4, P3 |
| Date picker with limits | `date-picker` | USWDS date picker | S4 |
| Consultation log | `consultation-log` | Carbon table | A3 |
| Defense Day form | `defense-form` | GOV.UK form, own | A5, P4 |
| Verdict panel | `verdict` | Own | P4, C6 |
| Return composer (inline reason) | `return-composer` | Own | C4, C5, C6, C7 |
| Dialog (gate, Return, Verify) | `dialog` | Primer dialog | A2, P2, C4 to C7 |
| Status pill, document stamp, outside chip | `status` | Own | All |
| Disabled action with reason | `blocked-action` | Own (BR-18) | All |
| Flag line | `flag` | Own (BR-17) | S1, C1, C5, P4 |
| Empty state | `empty-state` | Vercel Geist | All |
| Glyph | `glyphs` | Own | All |
| Toast | `toast` | [D-09, D-11] | All |

---

## 8. Components

### 8.1 Three status shapes

| Component | Shape | Shows |
| :---- | :---- | :---- |
| **Status pill** | Round, tinted fill, glyph + label | Milestone status |
| **Document stamp** | 2 px radius, 1 px border, white fill, form number in mono + state | Document lifecycle. Example: `TDW 07` · Verified |
| **Outside chip** | Round, **dashed** border, no fill | Ethics, IPMO, RPO, copyright. The dashed line means "outside the system, set by the Coordinator". |

### 8.2 Milestone stepper

Four nodes: Proposal, Pre-Final, Final, Clearance. Stage 0 (the advising forms) is not a node.

| Node state | Look |
| :---- | :---- |
| Completed | A gold-filled circle with a maroon check |
| Active | A gold-filled circle with a maroon border, and the label in `subheading` |
| Locked | A `neutral-300` outline circle with a `lock` glyph, and the label in muted text |

The line between nodes is maroon after a completed node and `neutral-300` after other nodes. No star or other shape from the PUP logo (F1).

### 8.3 Buttons

| Kind | Look | Use |
| :---- | :---- | :---- |
| Primary | Maroon fill, white text. Hover `maroon-700`. Pressed `maroon-800`. | One for each region. Gate actions, Verify, Confirm. |
| Secondary | White fill, `neutral-500` border, ink text | Upload, Download form, row actions |
| Return | White fill, `returned` text and border, `return` glyph | Return. It opens the Return dialog or the inline Return composer. |
| Text | No fill, maroon text, underline on hover | Low actions |

- Heights: 36 px default, 32 px for compact row actions, 48 px on Defense Day.
- Labels are verbs that name the result: "Endorse for defense", not "Submit". Gate buttons name the gate: "Endorse (Gate 1b)".

### 8.4 Disabled action with a reason

- Use `aria-disabled="true"`, not `disabled`, so the button stays in the tab order.
- Show the reason under the button in `caption`, with a `lock` glyph. Example: "Locked until Gate 1b."
- Link the reason with `aria-describedby`.

### 8.5 Flags (BR-17)

A flag is a `pending` line with the `flag` glyph. It sits near the record it concerns. The action stays enabled. On compact screens, the flag shows as a glyph in the row, and its reason is in the tooltip. Examples: the residency warning, the Action Taken difference on the Verdict tab, a missing evaluation sheet, a late printed copy.

### 8.6 Locked manuscript

When the manuscript is locked (BR-07), the viewer shows a `locked` banner across its top: "Locked at Gate 1b on Mon 4 Jan 2027. Unlocks when the defense closes." The upload control shows its reason (8.4).

### 8.7 Commit selector

Each commit shows `v3` in Plex Mono, the short hash in muted mono, the date and the uploader. The commit marked Ready has an `active` pill. No commit has a delete or edit control (BR-19).

### 8.8 Critique thread

| Part | Rule |
| :---- | :---- |
| Header | The reviewer's name, the role and designation, the status (Open or Resolved) |
| Page reference | Optional "p. 14" link in mono. A click moves the viewer to that page (FR-REV-04, PRD D-26). Threads stay PR-level (ADR-009). No highlights or pins on the PDF. |
| Body | `body` text, 60-character measure |
| Resolve | Only on the reviewer's own threads (BR-05). The Student sees "Reply" only. |
| Own threads | On A2 and P2, the reviewer's own open threads have an amber edge, because they block the reviewer's gate. |
| Resolved | The thread collapses to one line with a `done` glyph. A click expands it. |

### 8.9 Dialogs and the Return composer

| Item | Rule |
| :---- | :---- |
| Gate dialog | The title names the gate. A list shows what the gate unlocks. The confirm button repeats the action: "Endorse and lock manuscript". |
| Verify dialog | Verify is permanent (BR-19), so it opens a small dialog: "Verify TDW 12 for Dino Aquino? This locks the document." Buttons: Verify, Cancel. |
| Return dialog (A2, P2) | A required reason. The label says "The Student sees this reason." The confirm button stays disabled with a reason until the field has text. |
| Return composer (C4 to C7) | Inline in the record panel, no dialog. One free-text field, "Reason for return", with one placeholder example. "Send return" stays disabled with "Write a reason first" until the field has text. The Student sees the reason word for word. No preset reasons. |
| Coordinator Return reasons | Compliance or eligibility only (BR-13). |

### 8.10 Defense Day evaluation (TDW 08, TDW 13)

- Show each rubric row with its indicator code (`A1`) in mono, the name and the weight.
- Use a number input with a stepper, 48 px tall.
- Show the automatic total in `heading` with tabular figures. No grade and no grade equivalent (F4).
- Do not color the scores (F4).
- The Save button says "Save my evaluation". After a save, the status line says "Saved. Sign the paper sheet." (BR-01)
- The Verdict tab (Lead Panel Member or Panel Chair, on or after the defense date) loads the saved sheets when it opens. It has a Refresh button with "Updated hh:mm" and refreshes every 30 s while open. A missing sheet is a flag, never a block (F2).

### 8.11 Empty and first-day states

Demo data stays empty, so the first day is a designed state on every screen. Each empty region says what will appear, from where, and the next step. No illustrations. Example for the Adviser queue: "No requests are waiting. Requests appear here when an advisee marks a version Ready."

### 8.12 Forms (TDW)

- The 13 TDW forms ship as defaults from `docs/reference/tdw-forms`. The Coordinator can replace each one on C8.
- "Download form" gives the blank form now. After Phase 4 (FR-DOC-04, FR-DOC-05) it gives the prefilled form. The control does not change.

---

## 9. Voice and copy

| Rule | Example |
| :---- | :---- |
| Follow AGENTS.md §5 (ASD-STE100 at about 80%). Short sentences, active voice. | "The Coordinator confirms the date." |
| Use the terms in AGENTS.md §8 and `GLOSSARY.md` only. | "Panel Member", never "Evaluator". "Coordinator", never "Admin". Never "panel" for a card. |
| Blocked messages come from SITEMAP §9, word for word. | "Locked until the defense is closed." |
| Say "recorded" and "verified", not "signed" or "approved" for in-system actions (BR-01). | "Endorsement recorded. Sign TDW 07." |
| Labels, not sentences, on working surfaces (G4). | "Physical copy", not "Waiting for the physical copy to arrive at the office." |

---

## 10. Accessibility

| Item | Rule |
| :---- | :---- |
| Standard | WCAG 2.2 AA |
| Focus | A 2 px maroon outline with a 2 px offset on light surfaces. On maroon fills, a gold outline (6.67:1). Never remove the focus outline. |
| Targets | 24 × 24 px minimum. 32 px for compact row actions. 44 px on tablet. 48 px on Defense Day. |
| Color | Every status has a glyph and a label (§3.3). |
| Tables | Real `<table>` markup. Sortable headers use `aria-sort`. |
| Forms | Labels are visible. Errors sit under the field, are linked with `aria-describedby`, and name the fix. |
| Live updates | Toasts and saved states use `role="status"`. |
| Motion | Every animation has a `prefers-reduced-motion` path. |
| Keyboard | All actions work with the keyboard. The PDF viewer supports page up and page down. A skip link goes to the main content. |

---

## 11. Email (React Email)

Emails hold the event, the next action, the deadline and a link only (AGENTS.md §10).

| Part | Rule |
| :---- | :---- |
| Header | A 3 px maroon rule and the text wordmark "PUP CpE Thesis Progress" in serif. No logo. |
| Body | Plex Sans with system fallbacks, 16 px, ink on white, 560 px wide |
| Action | One maroon button with the verb. The full link appears as text below it. |
| Not allowed | Manuscript text, comments, scores, verdicts, images of any kind (F1) |

---

## 12. Tokens

All tokens live in `src/styles/tokens.css` (§7.1). `globals.css` imports it.

### 12.1 Primitive tokens (Tailwind v4 theme)

```css
@theme {
  --font-serif: "Source Serif 4", Georgia, serif;
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --color-maroon-50: #FBF3F3;  --color-maroon-100: #F5E1E1;
  --color-maroon-200: #E9BFBF; --color-maroon-300: #D69393;
  --color-maroon-400: #BA5F5F; --color-maroon-500: #9E2B2B;
  --color-maroon-600: #800000; --color-maroon-700: #6B0000;
  --color-maroon-800: #560000; --color-maroon-900: #3D0505;

  --color-gold-50: #FFFBEB;  --color-gold-100: #FFF6D6;
  --color-gold-200: #FCE7A1; --color-gold-300: #F8D35E;
  --color-gold-400: #F4C430; --color-gold-500: #D9A600;
  --color-gold-600: #A87F00; --color-gold-700: #7A5C00;

  --color-neutral-0: #FFFFFF;   --color-neutral-50: #FAF8F8;
  --color-neutral-100: #F4F1F1; --color-neutral-200: #E7E1E1;
  --color-neutral-300: #D3CBCB; --color-neutral-400: #A59A9C;
  --color-neutral-500: #8C8082; --color-neutral-600: #6E6264;
  --color-neutral-700: #4A3F41; --color-neutral-800: #2E2426;
  --color-neutral-900: #1E1617;

  --radius-stamp: 2px; --radius-control: 4px; --radius-card: 6px;
}
```

### 12.2 Semantic tokens (shadcn)

| shadcn token | Value |
| :---- | :---- |
| `--background` | `neutral-50` |
| `--foreground` | `neutral-900` |
| `--card`, `--popover` | `neutral-0` |
| `--primary` / `--primary-foreground` | `maroon-600` / `neutral-0` |
| `--secondary` / `--secondary-foreground` | `neutral-100` / `neutral-900` |
| `--muted` / `--muted-foreground` | `neutral-100` / `neutral-600` |
| `--accent` / `--accent-foreground` | `maroon-50` / `maroon-700` |
| `--destructive` | `returned` text `#B3261E` (tinted use only, F3) |
| `--border` | `neutral-200` |
| `--input` | `neutral-500` |
| `--ring` | `maroon-600` |
| `--radius` | `4px` |

### 12.3 Status tokens

```css
:root {
  --tone-neutral-fg: #5B5052;  --tone-neutral-bg: #F4F1F1;  --tone-neutral-line: #E7E1E1;
  --tone-active-fg: #1F4E8C;   --tone-active-bg: #E7EEF8;   --tone-active-line: #BCD0EC;
  --tone-pending-fg: #8F4A06;  --tone-pending-bg: #FCEEDD;  --tone-pending-line: #F1CFA6;
  --tone-done-fg: #1B6B45;     --tone-done-bg: #E5F3EA;     --tone-done-line: #B7DDC5;
  --tone-returned-fg: #B3261E; --tone-returned-bg: #FCE9E7; --tone-returned-line: #F2BDB8;
  --tone-locked-fg: #4A3F41;   --tone-locked-bg: #EFEBEB;   --tone-locked-line: #D3CBCB;
  --tone-achieved-fg: #3D0505; --tone-achieved-bg: #F4C430; --tone-achieved-line: #D9A600;
}
```

### 12.4 Pattern tokens

```css
:root {
  --row-h-comfortable: 56px;  --row-h-compact: 48px;
  --cell-pad-x: 16px;
  --row-action-w: 132px;      --row-action-h: 32px;
  --kpi-num-size: 36px;       --kpi-glyph-size: 30px;
  --glyph-stroke: 1.5;        --glyph-tone-opacity: 0.16;
  --sidebar-w: 240px;         --topbar-h: 56px;
  --target-tablet: 44px;      --target-defense: 48px;
}
```

---

## 13. Do and do not

| Do | Do not |
| :---- | :---- |
| Use one maroon button in each region. | Put maroon on large fills, the sidebar or headers. |
| Use gold only for the `achieved` tone and the current step. | Use gold for warnings, highlights, decoration or a verified document. |
| Use space and hairline rules. At most 3 cards. | Wrap every section in a bordered, rounded card. |
| Show the reason next to every disabled action. | Hide a blocked action or show it without a reason. |
| Teach in empty states, reasons and dialogs. | Put helper sentences on a Coordinator working surface. |
| Use the same width for every row action in a table. | Size row actions by their label length. |
| Use domain glyphs for thesis concepts. | Use a stock icon for a thesis concept. |
| Map library components to our tokens. | Keep a library's own palette. |
| Use mono for commit tags, form numbers, dates and counts. | Use mono for body text or labels. |
| Show the rubric total as a number. | Show a grade, a grade equivalent or colored scores. |
| Use the text wordmark and the PUP colors. | Use the PUP logo, seal, emblem, a star or any image symbol (F1). |

---

## 14. Open points

The owner will decide D-06 to D-11 in a separate design-system session.

| ID | Point |
| :---- | :---- |
| D-01 | Closed (24 Nov 2026). The owner confirmed PUP Gold `#F4C430`. |
| D-02 | Closed (24 Nov 2026). The owner confirmed IBM Plex Sans, warm neutrals and vermilion. |
| D-03 | Closed. No PUP logo, seal or image symbol (F1). |
| D-04 | Deferred. No dark mode yet. The tokens are semantic, so a dark theme can come later. |
| D-05 | Closed. Replaced by F1. |
| D-06 | Status pill glyphs. Proposal: the pills use domain glyphs (`todo`, `done`, `return`, `lock`), plus new glyphs for `active`, `pending` and `achieved`. |
| D-07 | Missing glyphs: Thesis process, Manuscript, Schedule, Defense results, Submission, Advisees, Review queue, Consultations, Availability, Assignments. Draw them for one approval. |
| D-08 | Top-bar panels. Proposal: notifications in a right side sheet (Primer), search as a `/` command palette (Linear), preferences in a side sheet. |
| D-09 | System states. Proposal: loading blocks of the content's size with no shimmer, inline errors with "Try again", and a 4 s `role="status"` toast with a glyph and a label. |
| D-10 | Motion rules: the durations for state changes and dialogs, and whether entry animations are allowed. On hold by owner decision (24 Nov 2026). |
| D-11 | React Bits components. Swipe Toast (toast), Status Mark (task-list status) and Glide Select (filter chips) are candidates. Call Chip is not recommended: it is made for AI tool calls (out of scope) and its progress is an estimate. Any adopted component takes our tokens (§3.4). |
| D-12 | Phone write access. Phones are read only for now. Upload on S3 from a phone can come later. |
