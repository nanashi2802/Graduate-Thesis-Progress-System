# DESIGN.md — PUP CpE Thesis Progress Monitoring System

**Status:** Draft v0.7 (26 Nov 2026). v0.6 plus the Student path of preview round UX-P-04 (R4-a to R4-d): the task list, the step-by-step and the Thesis process screen. Task R4.6 builds it.
**Change log:** v0.7, 26 Nov 2026 (decisions in `docs/ui-ux-audit/DESIGN_DECISIONS.md`, approved in UX-P-04):
- **Task list:** a collapsed group is a disclosure button with `aria-expanded`, the same look as the queue-table groups (R4-a B). One stamp for each item. A reason has a fixed 2-line slot with "Show more" (§7.4).
- **Step-by-step:** the same accordion on a phone, full width (R4-d A). The step marks follow the stepper. PROCESS hides the stepper below 640 px (§7.4).
- **Forms:** "Download form" links to the blank forms in `public/forms/` (R4-b A, §8.12).
- **Novie:** not used before R7 (R4-c B, F1).

v0.6, 26 Nov 2026 (decisions in `docs/ui-ux-audit/DESIGN_DECISIONS.md`, approved in UX-P-03):
- **Tables:** compact rows have equal outline row actions, maroon only for the one next step (R3-f). A long title is one line with the full text in a tooltip and on focus (R3-c). A blocked row action in a compact row shows a `lock` glyph and its reason in a tooltip (R3-i). Group headers can collapse (§5.4).
- **Breakpoints:** tables become stacked rows on a phone (R3-b). A compact table has a minimum width and scrolls in its frame below it; a minor column can hide below 1024 px (§5.6).
- **Dialogs and sheets:** a permanent action opens a confirm dialog, and focus starts on Cancel (R3-e, R3-h). One `--scrim` backdrop for every dialog, sheet and drawer (R3-g). The side-sheet form is 480 px (R3-d) (§8.9, §12.4).
- **Forms:** one form-feedback contract and the `form-field` pattern (UX-011 to UX-013, §8.4, §10).
- **KPI strip:** an age is late after 5 days (R3-a, §7.4).
- **Registry:** new pattern `form-field`; `queue-table`, `side-sheet`, `dialog` and `form-feedback` change (§7.4).

v0.5 is in `docs/stale/DESIGN_v0.5.md`.

v0.5, 26 Nov 2026 (decisions in `docs/ui-ux-audit/DESIGN_DECISIONS.md`, approved in UX-P-02):
- **Shell:** the sidebar is white with a maroon-50 active fill (R2-a). The content is 1280 px wide with 24 px gutters (R2-c). Record-based items stay out of the Adviser, Panel Member and Coordinator sidebars (R2-b) (§5.1).
- **Top bar:** notifications in a right side sheet, a user menu with the email preferences in a side sheet. A route or command palette is decided; its scope is open (D-08, §5.1, §14).
- **Motion:** option A timings as `--motion-*` tokens (D-10, §6.1, §12.4). Loading blocks pulse (UX-D-15).
- **Glyphs:** 3 status glyphs and 10 sidebar glyphs (D-06, D-07, §6.2).
- **Theme switch:** light or dark only, no "Use system" link (UX-D-14, §7.3).
- **Messages:** every message slot has one fixed height; a long message is clamped on the screen with "Show more" (UX-D-16, §8.4).
- **Registry:** new patterns `top-bar` and `form-feedback`; `loading` changes (§7.4).

v0.4 is in `docs/stale/DESIGN_v0.4.md`.

v0.4, 26 Nov 2026 (decisions in `docs/ui-ux-audit/DESIGN_DECISIONS.md`, approved in UX-P-01):
- **Brand:** the ThesIsko brand guide v1.0 is the source for identity (§1, §1.1, UX-D-10). F1 narrows to the PUP logo and seal. The ThesIsko mark is allowed. Novie is an exception for R4 and R7 (§2, UX-D-11 items 6 and 7).
- **Color:** the brand palette replaces D-01 and D-02: Golden Yellow, the brand maroon and gold ramps, cool neutrals, Success and Error (§3, §12, UX-D-11 item 1). The dark set is in §12.5.
- **Type:** Poppins, Inter and JetBrains Mono replace Source Serif 4 and IBM Plex. The scale has a 16 px base and a ratio of 1.25 (§4, UX-D-11 item 3).
- **Shape and icons:** radius 6, 8 and 12 px (§6.1). Glyphs have a 1.75 px stroke, outline only (§6.2, UX-D-11 items 4 and 5).
- **Stepper:** completed steps maroon, the current step gold (§8.2, G8, UX-D-08, UX-D-11 item 2).
- **Theme switch:** a squish switch with a sun-to-moon thumb (§7.3, UX-D-13). Focus adds a soft maroon ring (§10).
- **Registry:** new pattern `brand-mark` (§7.4).

v0.3 is in `docs/stale/DESIGN_v0.3.md`.


v0.3, 25 Nov 2026:
- **Dark mode:** light and dark themes are both first-class. The OS setting is the default, and a manual toggle overrides it (§7.3, UX-D-01). D-04 is closed. The dark values come in preview round UX-P-01 (§12.5).
- **References:** Linear, Notion and Stripe join the reference owners (§1.1, UX-D-03).
- **System states:** loading blocks, inline errors and a Base UI toast (§7.4, UX-D-04). D-09 and D-11 are closed. D-10 closes in preview round UX-P-02.
- **Registry:** new patterns `theme-toggle`, `loading` and `error` (§7.4).

v0.2, 24 Nov 2026:
- **Principles:** the Guided Ledger set (§2) replaces P1 to P8. It adds "Teach at the edges" and a text budget.
- **Modular system:** a three-layer system (§7) and a Pattern registry (§7.4).
- **Icons:** a domain glyph set replaces Lucide for thesis concepts (§6.2).
- **Coordinator density:** 48 px rows and equal row actions.
- **C4 actions:** Verify or Return only (PRD D-28).
- **Page references:** page references on comments (PRD D-26). This fixes the old §7.8 page-anchor note.
- **Motion:** the motion duration rules are on hold (D-10).

v0.2 is in `docs/stale/DESIGN_v0.2.md`. v0.1 is in `docs/stale/DESIGN_v0.1.md`.
**Change path (UX-D-02):** a change to a rule in this file needs a preview, the owner's approval and a record in `docs/ui-ux-audit/DESIGN_DECISIONS.md`. Then it goes into a new version of this file.
**Scope:** The visual and interaction design of the web app (31 routes) and the system emails. One spec for each screen is in `design/screens/<ID>.md`. This file holds the principles, the tokens, the patterns and the rules that all screens share.
**Not a source:** The Google Stitch screens in `design/stitch/` are a prototype only. This file does not derive from them.
**Fixed input from the owner:** Use the brand colors (PUP Maroon and Golden Yellow). Do not use the PUP logo or seal (intellectual property constraint, F1). The ThesIsko mark is allowed.
**Sources:** the ThesIsko brand guide (`docs/reference/brand/ThesIsko-Design-Principles-Brand-Guidelines.docx` v1.0) and its reconciliation (`docs/reference/brand/THESISKO_BRAND_GUIDELINE_RECONCILIATION.md`) for identity, Unified Thesis Process v1.2, Functional Requirements v1.2, `spec/SITEMAP.md`, `GLOSSARY.md`, the change proposals in `spec/proposals/2026-11-24-design-session-changes.md`.

> **Replaces UTP v1.1 §1.7 visual guidance.** v0.4 follows the brand guide: Inter for text, cool neutrals and a defined Error red for "returned" (UX-D-11). It replaces the v0.2 choices (IBM Plex Sans, warm neutrals, vermilion). UTP v1.2 must point to this file.

---

## 1. The design plan

```
Name:      Guided Ledger
Purpose:   Four roles track one thesis through three defenses and clearance.
           Students check weekly. The Coordinator works the queues every day.
           Panel Members use a tablet on Defense Day.
Treatment: Utility, leaning product. Calm and exact. A registrar's ledger that
           also shows each user the next step.
Brand:     ThesIsko (brand guide v1.0). Identity from the guide, product rules
           from this file (UX-D-10).
Type:      Poppins (titles) / Inter (text and UI) / JetBrains Mono (data)
Color:     ground Canvas #F8FAFC, ink #0F172A, action PUP Maroon #800000,
           achieved and current step Golden Yellow #F4B41A
Layout:    Identity line, then the Docket (where am I, what blocks me, what can
           I do now), then ruled sections. At most 3 cards on a screen.
Density:   Comfortable for Students and Advisers. Compact for the Coordinator.
           Large targets on Defense Day.
```

### 1.1 Reference owners

Each kind of screen borrows from one proven public system. The reference sets the pattern, not the look. The look comes from this file. The brand guide is the source for the identity: name, palette, logo, typography roles and mascot (UX-D-10). This file records how that identity applies to the product.

| Screens | Reference | What we take |
| :---- | :---- | :---- |
| Student screens (S1, S3 to S6, PROCESS) | GOV.UK Design System, USWDS | Step-by-step navigation, task lists, plain words, one thing per page |
| Coordinator, Adviser and Panel Member queues and lists | Linear, with IBM Carbon for table details | Dense queues, one action for each row, keyboard first, filters as chips |
| Manuscript workspace and submission view (S2, A2, P2, SV) | GitHub Primer | Pull-request layout, merge box, commit list, comment threads |
| App shell, sidebar and status marks (all signed-in screens) | Linear | The main reference for the shell, the sidebar and the status marks (UX-D-03) |
| Reading in the workspace and the thread feed (S2, A2, P2, SV) | Notion | Reading comfort: measure, line height, calm comment threads (UX-D-03). Primer keeps the layout. |
| Forms, validation messages and confirm dialogs | Stripe | Label above the field, helper text under it, the error under the field, short confirm dialogs (UX-D-03) |
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
| G8 | **Maroon is action, gold is earned** | Maroon marks the thing to do now and the completed stepper steps. Gold marks a milestone achieved and the current step. Neither is decoration. | UTP 1.7, UX-D-08, UX-D-11 |
| G9 | **Paper is the record** | The screen is the index of the signed paper. The UI says "recorded" or "verified", never "signed". | BR-01 |
| G10 | **Every blocked action explains itself** | A disabled action shows its reason next to it (§8.4). | BR-18 |
| G11 | **Plain words** | ASD-STE100 at about 80%. No enum names, codes or system words in the UI. | AGENTS.md §5 |
| G12 | **Accessible by default** | WCAG 2.2 AA. 44 px targets on tablet (§10). | NFR-09 |

**Fixed rules.** These come from the domain rules. No design change may break them.

| # | Rule | Source |
| :---- | :---- | :---- |
| F1 | Use no PUP logo or seal anywhere: app, emails, favicon, documents. No icon may copy or suggest a part of the PUP logo or seal (no star, laurel or torch). The ThesIsko mark is allowed: official artwork only, never redrawn or recolored (§7.4 `brand-mark`). Exception: the mascot Novie may appear in empty states and milestone moments (R7, not before: R4-c B), never on a serious outcome (Returned, a failed check). | Owner (intellectual property), UX-D-10, UX-D-11 items 6 and 7 |
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
| `maroon-500` (**PUP Maroon**) | `#800000` | Primary buttons, links, focus ring, active navigation marker, masthead rule, completed stepper steps |
| `maroon-700` (**Deep Maroon**) | `#5C0B0F` | Primary hover |
| `gold-500` (**Golden Yellow**) | `#F4B41A` | Achieved pills, the current stepper step, the focus ring on maroon surfaces |
| Ink, Slate, Line, Canvas | `#0F172A`, `#475569`, `#E2E8F0`, `#F8FAFC` | Text, muted text, hairlines, the page ground |
| Success, Error | `#15803D`, `#B91C1C` | The `done` and `returned` tone text |

Source: the brand guide v1.0, Brand Colors and Supporting Colors (UX-D-11 item 1).

> **Warning:** Golden Yellow on white has a contrast of about 1.9:1. Never put gold text on a light surface. Never use a gold fill without an ink label on it.

### 3.2 Ramps

Maroon and gold use the brand step names: step 500 is the brand color.

| Step | Maroon | Gold | Neutral (cool) |
| :---- | :---- | :---- | :---- |
| 0 | | | `#FFFFFF` surface |
| 50 | `#F7F0F0` | `#FEFBF1` | `#F8FAFC` ground (Canvas) |
| 100 | `#EDDBDB` | `#FDF5DF` | `#F1F5F9` sunken |
| 200 | `#D9B3B3` | `#FCE9BA` | `#E2E8F0` hairline (Line) |
| 300 | `#C28585` | `#FADB91` | `#CBD5E1` divider strong |
| 400 | `#A64D4D` | `#F7CB5F` | `#94A3B8` disabled text (non-essential only) |
| 500 | `#800000` PUP Maroon | `#F4B41A` Golden Yellow | `#64748B` input border (3:1 or more) |
| 600 | `#720406` | `#CA9210` | `#475569` muted text (Slate) |
| 700 | `#5C0B0F` Deep Maroon, hover | `#8A5F00` | `#334155` secondary text |
| 800 | `#3C070A` pressed | `#5A3E00` | `#1E293B` |
| 900 | `#2A0507` | | `#0F172A` ink (Ink) |

### 3.3 Semantic tones

Statuses use seven tones. Each pill always has a glyph and a text label, so color is never the only cue (WCAG 1.4.1).

| Tone | Text | Fill | Border | Glyph | Meaning |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `neutral` | `#475569` | `#F1F5F9` | `#E2E8F0` | `todo` [D-06] | Not started. Draft. |
| `active` | `#1E40AF` | `#EFF6FF` | `#BFDBFE` | [D-06] | In progress. The next step is with someone. |
| `pending` | `#8F4A06` | `#FCEEDD` | `#F1CFA6` | [D-06] | Waiting for a person. Provisional. Flag. |
| `done` | `#15803D` | `#F0FDF4` | `#BBF7D0` | `done` [D-06] | Approved, resolved, verified. |
| `returned` | `#B91C1C` | `#FEF2F2` | `#FECACA` | `return` [D-06] | Sent back with a written reason. |
| `locked` | `#334155` | `#EEF2F6` | `#CBD5E1` | `lock` [D-06] | Cannot change until an event. |
| `achieved` | `#0F172A` | `#F4B41A` | `#CA9210` | [D-06] | A milestone is achieved. Gold, earned. |

These are the light values. The dark values are in §12.5. All text and fill pairs pass WCAG AA (4.5:1 or more) in light and dark. `tests/unit/components/contrast.test.ts` checks them.

- **Pending is orange:** gold belongs to `achieved`, so "waiting" never reads as "achieved". This is a product refinement of the brand guide.
- **Returned is the brand Error red:** maroon is the action color. "Returned" appears only as a tinted pill, text or an outline button, never as a solid button (F3).
- **Verified is green:** a verified document uses `done`. Gold is only for a milestone achieved.

### 3.4 Colors in third-party components

A component from a library (shadcn, Base UI or other) takes our tokens. It never keeps its own palette. Map its color props to the semantic tokens in §12: surface, ink, maroon for action, and the tone colors for status. If a component cannot take our tokens, do not use it.

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
| Title and heading | Poppins | Page titles, headings, the thesis title, large figures, the Defense Day header. Weights 500, 600 and 700. |
| Text and UI | Inter | Paragraphs, tables, forms and all UI text. Weights 400, 500 and 600. |
| Data | JetBrains Mono | Revision numbers, commit tags, form numbers (TDW 07), dates and times, IDs, file hashes, counters. Weights 400 to 600. |

Source: the brand guide v1.0, Typography and Font Sizes for Web and Mobile (UX-D-11 item 3). All three fonts use the SIL Open Font License. Load them with `next/font/google` in `src/app/layout.tsx`. They are self-hosted at build time (NFR-06). The CSS variables are `--font-display`, `--font-text` and `--font-data`. The Tailwind classes keep their names: `font-serif` is Poppins, `font-sans` is Inter, `font-mono` is JetBrains Mono.

### 4.1 Scale

| Token | Size / line height | Font, weight | Use |
| :---- | :---- | :---- | :---- |
| `kpi` | 39 / 47 (2.441 rem) | Mono 600 | KPI strip counts (C1) |
| `display` | 39 / 47 (2.441 rem) | Poppins 600 | Thesis title on the Student dashboard |
| `title` | 31 / 37 (1.953 rem) | Poppins 600 | Page title |
| `heading` | 25 / 30 (1.563 rem) | Poppins 500 | Section heading |
| `subheading` | 20 / 24 (1.25 rem) | Inter 600 | Region heading, dialog title |
| `body` | 16 / 24 | Inter 400 | Default text, forms, threads |
| `ui` | 14 / 20 | Inter 400 or 500 | Table text and table metadata, buttons, navigation, pills |
| `caption` | 12.8 / 16 (0.8 rem) | Inter 500 | Disabled-action reasons, timestamps in lists |
| `mono` | 13 / 20 | JetBrains Mono 400 | Commit tags, form numbers, dates |

The scale has a 16 px base (1 rem) and a ratio of 1.25. Line height is 1.2 for headings and 1.5 for body text. Body text is never below 16 px. Captions and table metadata are never below 12.8 px. On phones, each heading drops one step. Use rem units. The `ui` size (14 or 15 px) stays open for a later round (UX-D-09). R7 moves the screens to this scale.

### 4.2 Rules

- Use sentence case for headings, buttons and labels.
- Use tabular figures for scores, counts, dates and the KPI strip.
- Write dates in Philippine Standard Time, in one format: `Tue 12 Jan 2027, 09:00 PHT`. Use relative time ("6d") only next to an absolute date or in a queue age column (NFR-11).
- Keep reading text between 45 and 72 characters for each line. Critique threads use a 60-character measure.
- Use `text-wrap: balance` for titles and `text-wrap: pretty` for body text.
- Truncate a thesis title in tables at one line. Show the full title in a tooltip and on focus.

---

## 5. Layout

### 5.1 App shell

```
┌──────────────────────────────────────────────────────────────────────┐ 3 px maroon masthead rule
│ ThesIsko                     [D-08 controls]   [theme] [bell] [user] │ top bar 56 px
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
| Sidebar | 240 px, card-white fill (`--sidebar`) with a hairline right border (R2-a). Each item has a 20 px domain glyph and a label. The active item has a maroon-50 fill (`--sidebar-accent`), maroon text and a 3 px maroon left marker. Items are 44 px high. The sidebar shows **every** item of the role. An item that is not open yet shows a `lock` glyph, and its reason in a tooltip ("Opens at Gate 1b"). Below 1024 px, the sidebar becomes a drawer (Base UI drawer: focus trap, Escape closes it, focus returns to the menu button). Items that need one record (Submission for the Adviser, the Panel Member and the Coordinator; the Coordinator Defense) are not in the sidebar: they open from a record row (R2-b). With many records, Defense Day and Manuscript link the record with the next defense, else the first. "Thesis process" and "Audit" join when their routes exist. |
| Top bar | The brand mark (`brand-mark`, text treatment until the artwork arrives), the role label, the theme switch, the notification bell (a right side sheet), the user menu (Base UI menu: Email preferences in a side sheet, Sign out). Card fill with a hairline bottom border. A route or command palette comes later; its scope is open (D-08). |
| Content | `<main id="main">`, maximum 1280 px wide (R2-c, brand guide Spacing and Layout). Gutters: 24 px from 640 px, 16 px on phone. Reading text keeps a 72ch measure. A skip link ("Skip to content") is the first focusable element. |

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

| Rule (UX-P-03) | Detail |
| :---- | :---- |
| Row action look (R3-f A) | A compact outline button. Maroon only for the one primary row action of the screen. |
| Long text (R3-c A) | One line in a compact row. The full text is in the DOM, in a tooltip on hover and on focus. |
| Blocked row action (R3-i A) | In a compact row, the button shows a `lock` glyph, keeps `aria-disabled`, and links its reason with `aria-describedby`. The reason shows in a tooltip on hover and focus, so the row keeps 48 px (UX-D-16). A comfortable row keeps the reason under the button (§8.4). |
| Group headers | A group header is a row header of its `<tbody>`. It can be a disclosure button (`aria-expanded`, `aria-controls`) with a chevron and the count. The first column is wide enough for the longest group label (C1: 220 px). |

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
| phone | < 640 | One column. Tables become stacked rows: label and value pairs, the action last (R3-b A). **Read only on every screen for now** (D-12). |
| tablet | 640 to 1023 | Sidebar drawer. Thread feed tab. Defense Day is fully supported. 44 px targets. A compact table has a minimum width (its fixed columns plus 120 px for the flexible column) and scrolls inside its frame below that. A minor column can hide below 1024 px (`hideBelowLaptop`). |
| laptop | ≥ 1024 | Full shell. Split workspace. |

---

## 6. Shape, depth, motion and icons

### 6.1 Shape, depth and motion

| Item | Rule |
| :---- | :---- |
| Radius | Controls 6 px. Cards, popovers and menus 8 px. Panels and dialogs 12 px. Status pills and avatars fully round. Document stamps 2 px. (Brand guide, Shapes and Buttons; UX-D-11 item 5.) |
| Borders | 1 px hairline `--border` between regions. Inputs use `--input` (3:1 or more on the card). |
| Shadow | None on the page. Popovers, menus, toasts and dialogs only: `0 8px 24px rgb(15 23 42 / 0.12)`. |
| Motion | Use the `motion` package (`motion/react`) for animation. Respect `prefers-reduced-motion`: every animation must have a reduced-motion path. No counting numbers. Use CSS for simple changes and `motion/react` only where CSS cannot do it (UX-D-04). Timings (D-10 option A, UX-P-02): 120 ms for a state change (`--motion-state`), 160 ms for a dialog, menu or tooltip (`--motion-overlay`) and a toast (`--motion-toast`), 280 ms with a spring-like ease for the drawer and side sheets (`--motion-drawer`, `--ease-drawer`). No page entry animation. No decorative motion on working screens. Loading blocks pulse in 1.6 s (`--motion-pulse`, UX-D-15). The reduced-motion rule in `globals.css` sets every duration to 0. Also approved: the theme switch (UX-D-13) uses a velocity spring, a squash at the end and a sun-to-moon morph. With reduced motion it changes at once. |
| Gradients | None. |

### 6.2 Icons: the domain glyph set

Thesis concepts use custom glyphs. Generic UI uses Lucide.

| Rule | Value |
| :---- | :---- |
| Grid | 24 × 24 |
| Stroke | 1.75 px, round caps, round joins (brand guide, Icons; UX-D-11 item 4) |
| Fill | None. Outline only. No filled, two-tone or 3D icons. |
| Sizes | 16 px in text, 20 px in buttons and the sidebar, 30 px in the KPI strip |
| Labels | A glyph sits with a label in navigation and buttons. An icon alone needs a tooltip and an accessible name. |
| Color | Maroon on white, white on maroon, ink in dense tables. Gold only for the milestone icon and highlights on dark grounds. |
| Forbidden shapes | No star, seal, laurel, torch or other part of the PUP logo or seal (F1) |
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
| `active` | Status: in progress (D-06) | An arrow in a circle |
| `pending` | Status: waiting for someone (D-06) | An hourglass |
| `achieved` | Status: milestone achieved (D-06) | A trophy (not a star, seal or laurel) |
| `process` | Thesis process (D-07) | A path between two nodes |
| `manuscript` | Manuscript (D-07) | A page with a folded corner and lines |
| `schedule` | Schedule (D-07) | A calendar with time marks |
| `results` | Defense results (D-07) | A clipboard with a check |
| `submission` | Submission (D-07) | An archive box |
| `advisees` | Advisees (D-07) | Two people |
| `queue` | Review queue (D-07) | An inbox tray |
| `consult` | Consultations (D-07) | Two speech bubbles |
| `availability` | Availability (D-07) | A calendar with a clock |
| `assignments` | Assignments (D-07) | A clipboard with a person |

The first SVG source of every approved glyph is in `design/mockups/coordinator-mockups.html` (the `<symbol>` elements). The `defense` glyph is `g-def-a`. Options B and C (`g-def-b`, `g-def-c`) were not chosen. R1.6 redrew them at 1.75 px with no tone fill (`src/components/patterns/glyphs/`).

The status pills use the domain glyphs for every tone: `todo`, `active`, `pending`, `done`, `return`, `lock`, `achieved` (D-06). The candidates that were not chosen are in `src/app/lab/_mock/glyph-candidates.tsx`.

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

**Themes (UX-D-01):** the app has a light theme and a dark theme. Both are first-class.

- The OS setting (`prefers-color-scheme`) is the default.
- A manual switch in the top bar and on LOGIN overrides it (`theme-toggle`, UX-D-13). It is a squish switch (`role="switch"`, name "Dark theme"). Its thumb is a sun in light and morphs into a crescent moon in dark. It offers light or dark only (UX-D-14): the OS setting applies until the first click, and no link returns to it. The browser keeps the choice in `localStorage`.
- A small inline script (`THEME_SCRIPT` in `src/lib/theme.ts`) sets the theme before the first paint. It is the first child of `<head>` in `src/app/layout.tsx`. The app does not use `next-themes`. If a CSP with `script-src` is added later, it needs a hash for this script.
- A theme changes only the semantic and status tokens (§12.2, §12.3, §12.5). A component never uses `dark:` classes for colors.
- The PDF page, the emails and the printed views stay light. The PDF page uses `bg-white`, the one allowed exception.

### 7.4 Pattern registry

| Pattern | Folder | Source | Screens |
| :---- | :---- | :---- | :---- |
| App shell (skip link, masthead, top bar, drawer) | `app-shell` | Linear, Primer | All signed-in screens |
| Sidebar with locked items (`navFor` in `sidebar/nav.ts`) | `sidebar` | Linear | All signed-in screens |
| Top bar: notification sheet, user menu, preferences sheet | `top-bar` | Primer side sheet, Base UI drawer and menu (D-08) | All signed-in screens |
| Identity line | `identity-line` | Primer repository header | S1 to S6, A2, P2, C6, SV |
| Docket | `docket` | GOV.UK notification banner, own | S1 |
| Merge box | `merge-box` | Primer pull-request merge box | S2 |
| Gate box | `gate-box` | Primer merge box with checks | A2, P2 |
| Milestone stepper | `stepper` | Own (ledger) | S1, A1, P1, PROCESS |
| Step-by-step | `step-by-step` | GOV.UK step-by-step navigation: a heading with a disclosure button for each step, "You are here" (`aria-current="step"`) open at first, the other steps closed, "Show all steps", step marks as in the stepper (done maroon with the `done` glyph, current gold), the same accordion on a phone (R4-d A) | PROCESS |
| Task list | `task-list` | GOV.UK task list: groups with a heading and a count, at most one stamp for each item (document stamp, outside chip or status pill), the label, one reason in a fixed 2-line slot with "Show more" (the Coordinator's returned reason word for word), the actions on the right; a collapsed group is a disclosure button with `aria-expanded` (R4-a B) | S1, S3, S6 (integrated in R4.6), C7 (R7d) |
| Queue table | `queue-table` | Linear, Carbon data table: compact 48 px or comfortable 56 px rows, `aria-sort`, equal row actions, collapsible groups, stacked rows on a phone, a minimum width on tablet | A1, P1, C1, C2, C3, C8, C9, C10 |
| KPI strip | `kpi-strip` | Linear, own: a link for each queue, the count, the oldest age, late after 5 days (R3-a A, `LATE_POLICIES.A`) | C1 |
| Inbox (list, viewer, record) | `inbox` | Linear triage, Primer file view | C4, C5, C6 |
| Side-sheet form | `side-sheet` | Primer side sheet, Base UI drawer: 480 px forms (R3-d), 400 px top-bar panels, full width below 640 px, a sticky footer, the `--scrim` backdrop | C2, C3, C8, C9, A4, P3, top bar |
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
| Dialog (gate, Return, Verify) | `dialog` | Primer dialog, Base UI dialog: `ConfirmDialog` and `confirmCopy`, focus starts on Cancel (R3-e A), the error stays in the dialog | A2, P2, A5, P4, C4 to C7 |
| Status pill, document stamp, outside chip | `status` | Own | All |
| Disabled action with reason | `blocked-action` | Own (BR-18) | All |
| Flag line | `flag` | Own (BR-17) | S1, C1, C5, P4 |
| Empty state | `empty-state` | Vercel Geist | All |
| Glyph | `glyphs` | Own | All |
| Theme switch (light or dark) | `theme-toggle` | React Bits SquishSwitch, adapted (UX-D-13) | Top bar of all signed-in screens, LOGIN |
| Brand mark (full logo, symbol, text treatment) | `brand-mark` | ThesIsko brand guide, Logo (UX-D-10, UX-D-11 item 6) | LOGIN (full), top bar of the role shells (text or symbol), compact navigation (symbol) |
| Loading blocks (shapes, page presets, spinner) | `loading` | Own (UX-D-15): rows, cards, docket, form, list; presets dashboard, queue, record, form; a 1.6 s pulse; still with reduced motion | All |
| Inline error with "Try again" | `error` | Own (UX-D-04) | All |
| Form feedback (pending, error, result) | `form-feedback` | Own (UX-011, UX-D-16): a fixed-height message slot (3 lines by default, 2 in the row forms), a pending button that keeps its width | All forms (integrated in R3.10) |
| Form field (label, control, hint, field error) | `form-field` | Stripe forms (UX-012, UX-013): the label above, one fixed-height slot for the hint or the field error, `aria-describedby` and `aria-invalid`, one control class set (44 px on tablet, 36 px at laptop) | All forms except LOGIN (R7d) |
| Toast | `toast` | Base UI Toast (`@base-ui/react/toast`, UX-D-04): 4 s, `role="status"`, a glyph and a label. Small actions only. | All |

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
| Completed | A maroon-filled circle (`--primary`) with a white check |
| Active (current) | A gold-filled circle (`--progress`) with a 2 px maroon border, and the label in `subheading` |
| Locked | A `--divider-strong` outline circle with a `lock` glyph, and the label in muted text |

The line between nodes is maroon after a completed node and `--divider-strong` after other nodes. No star or other shape from the PUP logo (F1). Source: the brand guide sample (UX-D-08, UX-D-11 item 2).

### 8.3 Buttons

| Kind | Look | Use |
| :---- | :---- | :---- |
| Primary | Maroon fill, white text. Hover Deep Maroon `maroon-700`. Pressed `maroon-800`. | One for each region. Gate actions, Verify, Confirm. |
| Secondary | Card fill, `--input` border, ink text | Upload, Download form, row actions |
| Return | White fill, `returned` text and border, `return` glyph | Return. It opens the Return dialog or the inline Return composer. |
| Text | No fill, maroon text, underline on hover | Low actions |

- Heights: 36 px default, 32 px for compact row actions, 48 px on Defense Day.
- No gold button for now (UX-D-11 item 5).
- Labels are verbs that name the result: "Endorse for defense", not "Submit". Gate buttons name the gate: "Endorse (Gate 1b)".

### 8.4 Disabled action with a reason

- Use `aria-disabled="true"`, not `disabled`, so the button stays in the tab order.
- Show the reason under the button in `caption`, with a `lock` glyph. Example: "Locked until Gate 1b."
- Link the reason with `aria-describedby`.

**Reserve the message space (UX-D-16).** A region that shows a message, a result, an error or a count keeps the space for it, so the layout does not move.

- A form message slot (`form-feedback`) has one fixed height in every state: idle, pending, error and done. The default is 3 lines (60 px). A form sets 2 or 4 lines with `lines`, sized for its longest message at its narrowest width. No minimum height.
- A message never gets cut so that the user cannot read it. A longer message is clamped on the screen only. The full text stays in the DOM, so screen readers and the field link (`aria-describedby`) read all of it. A "Show more" toggle shows the full text over the next content.
- Write each message as one fact in 25 words or fewer (§9), so it fits the slot in most cases.
- An error keeps `role="alert"`; a result keeps `role="status"`. The glyph sits on the first line.
- A pending button keeps its width (both labels in one grid cell) and shows a spinner.
- A row that holds an action which can go away (for example "Mark all read") keeps its height.
- A field message slot (`form-field`) is 1 line (20 px) or 2 lines, the same height in every state. It holds the field error, else the hint. With an error, the hint stays in the DOM for screen readers.

### 8.5 Flags (BR-17)

A flag is a `pending` line with the `flag` glyph. It sits near the record it concerns. The action stays enabled. On compact screens, the flag shows as a glyph in the row, and its reason is in the tooltip. Examples: the residency warning, the Action Taken difference on the Verdict tab, a missing evaluation sheet, a late printed copy.

### 8.6 Locked manuscript

When the manuscript is locked (BR-07), the viewer shows a `locked` banner across its top: "Locked at Gate 1b on Mon 4 Jan 2027. Unlocks when the defense closes." The upload control shows its reason (8.4).

### 8.7 Commit selector

Each commit shows `v3` in JetBrains Mono, the short hash in muted mono, the date and the uploader. The commit marked Ready has an `active` pill. No commit has a delete or edit control (BR-19).

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
| Confirm dialog (R3-e A, R3-h A) | Every permanent action (BR-19) asks once more: Endorse (Gate 1a, Gate 1b), Gate 2, Record verdict, Verify, "Scan matches", Close the stage. The title names the action and the record; the body is one sentence on the effect; the confirm button repeats the verb; then Cancel. Focus starts on Cancel. Escape closes it, and focus returns to the opener. A server error stays in the dialog. A blocked action never opens it. |
| Gate dialog | The title names the gate. A list can show what the gate unlocks. The confirm button repeats the action. Gate 1b: only the last endorsement locks the manuscript (BR-07), so the last endorser sees "Endorse and lock manuscript" and the others see "Endorse (Gate 1b)" (R3.10). |
| Backdrop (R3-g A) | The `--scrim` token, for every dialog, side sheet, the nav drawer and the route palette. |
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
- "Download form" gives the blank form now: a static file in `public/forms/` (`TDW-01.doc` to `TDW-13.doc`, a byte copy of `docs/reference/tdw-forms`, link from `blankFormHref` in `src/lib/forms.ts`; R4-b A). After Phase 4 (FR-DOC-04, FR-DOC-05) it gives the prefilled form. The control does not change. It is a secondary button with an accessible name that names the form.

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
| Focus | A 2 px `--ring` outline with a 2 px offset, plus a soft ring (`box-shadow: 0 0 0 4px` of `--ring` at 22%). In light `--ring` is maroon. In dark it is `#C28585`. On maroon fills, a gold outline. Native `input`, `select`, `textarea` and `summary` get the same outline from `globals.css` (UX-002). Never remove the focus outline. (Brand guide, Shapes and Buttons; UX-D-11 item 5.) |
| Targets | 24 × 24 px minimum. 32 px for compact row actions. 44 px on tablet. 48 px on Defense Day. |
| Color | Every status has a glyph and a label (§3.3). |
| Tables | Real `<table>` markup. Sortable headers use `aria-sort`. |
| Forms | Labels are visible. Errors sit under the field, are linked with `aria-describedby`, and name the fix. One contract (UX-011): pending is a `PendingButton` (keeps its width, `aria-busy`, stays focusable); an error the server names for a field shows under that field (`role="alert"`, `aria-invalid`); every other error shows in the form's `FormFeedback` slot (`role="alert"`); a small action gets a toast (UX-D-04); a workflow result stays on the screen in the slot (`role="status"`). |
| Live updates | Toasts and saved states use `role="status"`. |
| Motion | Every animation has a `prefers-reduced-motion` path. |
| Keyboard | All actions work with the keyboard. The PDF viewer supports page up and page down. A skip link goes to the main content. |

---

## 11. Email (React Email)

Emails hold the event, the next action, the deadline and a link only (AGENTS.md §10).

| Part | Rule |
| :---- | :---- |
| Header | A 3 px maroon rule and the horizontal ThesIsko logo (official artwork, UX-D-11 item 6). Until the artwork arrives, the text "ThesIsko · Graduate Thesis Progress". No PUP logo or seal (F1). |
| Body | Inter with system fallbacks, 16 px, ink on white, 560 px wide |
| Action | One maroon button with the verb. The full link appears as text below it. |
| Not allowed | Manuscript text, comments, scores, verdicts, any image other than the ThesIsko logo (F1) |

---

## 12. Tokens

All tokens live in `src/styles/tokens.css` (§7.1). `globals.css` imports it.

### 12.1 Primitive tokens (Tailwind v4 theme)

The font families are mapped in `globals.css` (`@theme inline`) from the `next/font` variables (§4).

```css
@theme {
  --color-maroon-50: #F7F0F0;  --color-maroon-100: #EDDBDB; --color-maroon-200: #D9B3B3;
  --color-maroon-300: #C28585; --color-maroon-400: #A64D4D; --color-maroon-500: #800000;
  --color-maroon-600: #720406; --color-maroon-700: #5C0B0F; --color-maroon-800: #3C070A;
  --color-maroon-900: #2A0507;

  --color-gold-50: #FEFBF1;  --color-gold-100: #FDF5DF; --color-gold-200: #FCE9BA;
  --color-gold-300: #FADB91; --color-gold-400: #F7CB5F; --color-gold-500: #F4B41A;
  --color-gold-600: #CA9210; --color-gold-700: #8A5F00; --color-gold-800: #5A3E00;

  --color-neutral-0: #FFFFFF;   --color-neutral-50: #F8FAFC;  --color-neutral-100: #F1F5F9;
  --color-neutral-200: #E2E8F0; --color-neutral-300: #CBD5E1; --color-neutral-400: #94A3B8;
  --color-neutral-500: #64748B; --color-neutral-600: #475569; --color-neutral-700: #334155;
  --color-neutral-800: #1E293B; --color-neutral-900: #0F172A;

  --radius-stamp: 2px; --radius-control: 6px; --radius-card: 8px; --radius-panel: 12px;
  --shadow-popover: 0 8px 24px rgb(15 23 42 / 0.12);
}
```

### 12.2 Semantic tokens (shadcn)

| shadcn token | Value |
| :---- | :---- |
| `--background` | `neutral-50` |
| `--foreground` | `neutral-900` |
| `--card`, `--popover` | `#FFFFFF` |
| `--primary` / `--primary-foreground` | `maroon-500` / `#FFFFFF` |
| `--secondary` / `--secondary-foreground` | `neutral-100` / `neutral-900` |
| `--muted` / `--muted-foreground` | `neutral-100` / `neutral-600` |
| `--accent` / `--accent-foreground` | `maroon-50` / `maroon-700` |
| `--destructive` | `returned` text `#B91C1C` (tinted use only, F3) |
| `--border` / `--divider-strong` | `neutral-200` / `neutral-300` |
| `--input` | `neutral-500` |
| `--ring`, `--link` | `maroon-500` |
| `--text-secondary` | `neutral-700` |
| `--progress` | `gold-500` (the current stepper step) |
| `--wordmark` | `maroon-500` (the brand mark text treatment) |
| `--radius` | `6px` |

Use `text-link` for text links, not `text-primary`. In dark, the primary fill is too dark for text.

### 12.3 Status tokens

```css
:root {
  --tone-neutral-fg: #475569;  --tone-neutral-bg: #F1F5F9;  --tone-neutral-line: #E2E8F0;
  --tone-active-fg: #1E40AF;   --tone-active-bg: #EFF6FF;   --tone-active-line: #BFDBFE;
  --tone-pending-fg: #8F4A06;  --tone-pending-bg: #FCEEDD;  --tone-pending-line: #F1CFA6;
  --tone-done-fg: #15803D;     --tone-done-bg: #F0FDF4;     --tone-done-line: #BBF7D0;
  --tone-returned-fg: #B91C1C; --tone-returned-bg: #FEF2F2; --tone-returned-line: #FECACA;
  --tone-locked-fg: #334155;   --tone-locked-bg: #EEF2F6;   --tone-locked-line: #CBD5E1;
  --tone-achieved-fg: #0F172A; --tone-achieved-bg: #F4B41A; --tone-achieved-line: #CA9210;
}
```

### 12.4 Pattern tokens

```css
:root {
  --row-h-comfortable: 56px;  --row-h-compact: 48px;
  --cell-pad-x: 16px;
  --row-action-w: 132px;      --row-action-h: 32px;
  --kpi-num-size: 36px;       --kpi-glyph-size: 30px;
  --glyph-stroke: 1.75;
  --sidebar-w: 240px;         --topbar-h: 56px;
  --target-tablet: 44px;      --target-defense: 48px;

  /* Motion, D-10 option A (UX-P-02) */
  --motion-state: 120ms;      --motion-overlay: 160ms;
  --motion-drawer: 280ms;     --motion-toast: 160ms;
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --motion-pulse: 1.6s;

  /* Backdrop, R3-g option A (UX-P-03). Dark: rgb(2 6 23 / 0.6) */
  --scrim: rgb(15 23 42 / 0.45);
}
```

### 12.5 Dark tokens

Values approved in UX-P-01 (26 Nov 2026). The set is built from the brand colors ("White on Ink", "Golden Yellow on Ink"). It is a product refinement of the brand guide (UX-D-01, UX-D-11).

- The primitive ramps (§12.1) do not change between themes. The semantic tokens (§12.2) and the status tokens (§12.3) get a second value set under `.dark`.
- The same contrast rules apply in dark: 4.5:1 for text, 3:1 for the input border and the focus ring. `contrast.test.ts` checks them.
- The primary fill is lighter in dark (`#A64D4D`), so its white label keeps 4.5:1 and the fill stands out from the ground. Links use `--link` (`#D9B3B3`).

| Token | Dark value |
| :---- | :---- |
| `--background` / `--foreground` | `#0F172A` / `#F8FAFC` |
| `--card` / `--popover` | `#172033` / `#1E293B` |
| `--secondary`, `--muted` | `#0B1222` |
| `--muted-foreground` / `--text-secondary` | `#94A3B8` / `#CBD5E1` |
| `--primary` / `--primary-foreground` | `#A64D4D` / `#FFFFFF` |
| `--accent` / `--accent-foreground` | `#3C070A` / `#EDDBDB` |
| `--destructive` | `#FCA5A5` |
| `--border` / `--divider-strong` | `#334155` / `#475569` |
| `--input` | `#7C8BA1` |
| `--ring` / `--link` | `#C28585` / `#D9B3B3` |
| `--progress` / `--wordmark` | `#F4B41A` / `#F8FAFC` |

```css
.dark {
  --tone-neutral-fg: #CBD5E1;  --tone-neutral-bg: #1E293B;  --tone-neutral-line: #334155;
  --tone-active-fg: #93C5FD;   --tone-active-bg: #172554;   --tone-active-line: #1E3A8A;
  --tone-pending-fg: #F2B877;  --tone-pending-bg: #33210D;  --tone-pending-line: #5C3D17;
  --tone-done-fg: #86EFAC;     --tone-done-bg: #052E16;     --tone-done-line: #166534;
  --tone-returned-fg: #FCA5A5; --tone-returned-bg: #450A0A; --tone-returned-line: #7F1D1D;
  --tone-locked-fg: #CBD5E1;   --tone-locked-bg: #1E293B;   --tone-locked-line: #475569;
  --tone-achieved-fg: #0F172A; --tone-achieved-bg: #F4B41A; --tone-achieved-line: #CA9210;
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
| Use the official ThesIsko artwork (or its text treatment) and the brand colors. | Use the PUP logo or seal, a star, or a redrawn or recolored ThesIsko mark (F1). |

---

## 14. Open points

D-06 to D-08 and D-10 were decided in preview round UX-P-02 (26 Nov 2026).

| ID | Point |
| :---- | :---- |
| D-01 | Replaced (26 Nov 2026, UX-D-11). Golden Yellow `#F4B41A` from the brand guide. |
| D-02 | Replaced (26 Nov 2026, UX-D-11). Inter, cool neutrals and the brand Error red. |
| D-03 | Closed. No PUP logo or seal (F1, narrowed in v0.4). |
| D-04 | Closed (25 Nov 2026, UX-D-01). Light and dark themes, with the OS default and a manual switch (§7.3). The dark values were approved in UX-P-01 on 26 Nov 2026 (§12.5). |
| D-05 | Closed. Replaced by F1. |
| D-06 | Closed (26 Nov 2026, UX-P-02). The pills use domain glyphs; new `active` (arrow in a circle), `pending` (hourglass), `achieved` (trophy) (§6.2). |
| D-07 | Closed (26 Nov 2026, UX-P-02). 10 sidebar glyphs drawn and approved (§6.2). |
| D-08 | Closed in part (26 Nov 2026, UX-P-02). Notifications in a right side sheet, a user menu with preferences in a side sheet (§5.1). A route or command palette is decided, but its features and scope are open for a later discussion. Clickable notifications are a feature change: issue #82. |
| D-09 | Closed (25 Nov 2026, UX-D-04; loading motion changed by UX-D-15). System states: loading blocks of the content's size (now with a 1.6 s pulse), inline errors with "Try again", and a 4 s `role="status"` toast with a glyph and a label. A toast confirms small actions only. A workflow result (Returned, Endorsed, Scheduled, Verified) stays on the screen. |
| D-10 | Closed (26 Nov 2026, UX-P-02). Option A: 120, 160 and 280 ms, no page entry animation, a reduced-motion path for each animation (§6.1, §12.4). |
| D-11 | Closed (25 Nov 2026, UX-D-04). No React Bits. The toast uses Base UI Toast (`@base-ui/react/toast`, already installed). |
| D-12 | Phone write access. Phones are read only for now. Upload on S3 from a phone can come later. |
