# DESIGN.md — PUP CpE Thesis Progress Monitoring System

**Status:** Draft v0.1 (22 Nov 2026). No UI code exists yet.
**Scope:** The visual and interaction design of the web app (30 routes) and the system emails.
**Fixed input from the owner:** Use the PUP colors (dark maroon and golden yellow). Do not use the PUP logo, seal or any image symbol (intellectual property constraint). Everything else in this file is a proposal.
**Sources:** Unified Thesis Process v1.1 (Sections 1.6, 1.7, 2.3, 3), Functional Requirements v1.1 (NFR-04, NFR-09, BR-01, BR-07, BR-15, BR-17, BR-18, BR-19), [PUP Logo and Symbols](https://www.pup.edu.ph/about/logosymbols).

> **[CONFIRM] This file replaces the visual guidance in Unified Thesis Process v1.1, Section 1.7.** It changes three items: the text font (Inter becomes IBM Plex Sans), the neutrals (cool slate becomes warm neutrals) and the red for "returned" (now a defined vermilion that is different from maroon). All other Section 1.7 rules stay. If the owner approves, Unified Thesis Process v1.2 must point to this file.

---

## 1. The design plan

```
Purpose:   Four roles track one thesis through three defenses. Students check
           weekly. The Coordinator works the queues every day. Panel Members
           use a tablet on Defense Day.
Treatment: Utility, leaning product. Calm and exact. A registrar's ledger,
           not a dashboard.
Type:      Source Serif 4 (titles) / IBM Plex Sans (UI) / IBM Plex Mono
           (commit tags, form numbers, dates)
Color:     ground #FAF8F8, ink #1E1617, action PUP Maroon #800000,
           achieved PUP Gold #F4C430 [CONFIRM hex]
Layout:    Each record screen opens with the Docket: where am I, what blocks
           me, what can I do now. Ruled sections below it, not card grids.
Density:   Compact for Coordinator tables. Comfortable for Student and
           Adviser screens. Large targets on the Defense Day page.
```

### 1.1 Why these choices

| Choice | Reason |
| :---- | :---- |
| **Ledger, not dashboard** | The system tracks paper (BR-01). The signed paper is the record. The screen is the index of that paper. Hairline rules, form numbers and stamps come from the registrar's desk. Decorative charts do not. |
| **Maroon for action only** | PUP's dark maroon is the color of the one thing the user can do now. If maroon is on every surface, it loses that meaning. |
| **Gold is earned** | Golden yellow is one of the two traditional PUP colors. In this app, gold appears only when a milestone is achieved (Certified, Final approved, Cleared) and on the current step of the stepper. Gold is never decoration. |
| **Serif for titles** | A thesis is an academic document. Source Serif 4 is a text serif in the academic-press tradition. It gives the thesis title and page titles authority. It is not used for UI text. |
| **IBM Plex for UI** | This is a Computer Engineering program. The workflow uses Git terms (Commit, Submission PR). Plex Sans and Plex Mono are one engineered family, so commit tags and UI text match. Both have tabular figures for scores and dates. |
| **Warm neutrals** | The grays lean slightly toward the maroon hue. Pure cool slate (the Tailwind default) looks inherited, not chosen. |
| **Color and words, no symbols** | The brand appears only as color and as the text wordmark "PUP CpE Thesis Progress". The app uses no logo, seal, emblem, mascot or image symbol of PUP (Section 2, P9). |

### 1.2 Self-critique of the plan

| Line | Risk | Change made |
| :---- | :---- | :---- |
| Color | "Maroon sidebar with white text" is the default look of every school portal. | The sidebar is a light warm neutral. Maroon goes to actions, the masthead rule and the active navigation marker only. |
| Type | Inter, which Section 1.7 names, is the generated-UI default. | IBM Plex Sans, for the CpE and Git reason above. |
| Layout | A role dashboard drifts to "card soup". | Only one object is a card: the Next-action card. Other regions are ruled sections. |

---

## 2. Principles

| # | Principle | Source |
| :---- | :---- | :---- |
| P1 | Every screen answers three questions: where am I, what blocks me, what can I do now. | UTP 1.7 |
| P2 | Each screen has one primary action at most. It is maroon. | NFR-04 |
| P3 | A disabled action always shows its reason, next to the action. | BR-18, UTP 3.6 |
| P4 | A flag warns. It never blocks and never looks like a block. | BR-17 |
| P5 | Paper is the record. The UI says "recorded" or "verified", never "signed". | BR-01 |
| P6 | Nothing is deleted, so no destructive (solid red) button exists. | BR-19 |
| P7 | Scores are numbers only. No grade, no grade equivalent, no color on scores. | BR-15 |
| P8 | The same status looks the same on every screen. | UTP 1.7 |
| P9 | Use no PUP logo, seal, emblem or image symbol in the app, the emails, the favicon or the documents. Use the colors and the text wordmark only. No icon may copy or suggest a part of the PUP logo. | Owner (intellectual property) |

---

## 3. Color

### 3.1 Brand

| Token | Hex | Use |
| :---- | :---- | :---- |
| `maroon-600` (**PUP Maroon**) | `#800000` | Primary buttons, links, focus ring, active navigation marker, masthead rule |
| `gold-400` (**PUP Gold**) | `#F4C430` [CONFIRM] | Achieved pills, the current stepper step, the focus ring on maroon surfaces |

The PUP site names the colors "dark maroon" and "golden yellow" but gives no hex values. `#800000` comes from UTP 1.7. Check `#F4C430` against the PUP Branding and Style Guideline (linked from the PUP Logo and Symbols page).

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

Statuses use six tones. Each pill always has an icon and a text label, so color is never the only cue (WCAG 1.4.1).

| Tone | Text | Fill | Border | Icon (Lucide) | Meaning |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `neutral` | `#5B5052` | `#F4F1F1` | `#E7E1E1` | `circle-dashed` | Not started. Draft. |
| `active` | `#1F4E8C` | `#E7EEF8` | `#BCD0EC` | `circle-dot` | In progress. The next step is with someone. |
| `pending` | `#8F4A06` | `#FCEEDD` | `#F1CFA6` | `clock` | Waiting for a person. Provisional. Flag. |
| `done` | `#1B6B45` | `#E5F3EA` | `#B7DDC5` | `circle-check` | Approved, resolved, verified. |
| `returned` | `#B3261E` | `#FCE9E7` | `#F2BDB8` | `undo-2` | Sent back with a written reason. |
| `locked` | `#4A3F41` | `#EFEBEB` | `#D3CBCB` | `lock` | Cannot change until an event. |
| `achieved` | `#3D0505` | `#F4C430` | `#D9A600` | `badge-check` | A milestone is achieved. Gold, earned. |

All text and fill pairs pass WCAG AA (4.5:1 or more). The lowest pair is `returned` at 5.59:1.

**Why `pending` is orange, not yellow:** Gold belongs to the `achieved` tone. Pending uses a burnt orange, so "waiting" never reads as "achieved".
**Why `returned` is vermilion:** Maroon is the action color. "Returned" is a brighter red-orange (`#B3261E`) and appears only as a tinted pill or text, never as a solid button (P6).

### 3.4 Status mapping

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

| State | Tone |
| :---- | :---- |
| Not started | neutral |
| Prepared | neutral |
| Scan uploaded | pending |
| Locked as submitted | locked |
| Physical received | active |
| Verified | done |
| Mismatch | pending (a flag, BR-17) |
| Returned | returned |

---

## 4. Typography

| Role | Font | Notes |
| :---- | :---- | :---- |
| Title | Source Serif 4 (variable, `opsz`) | Page titles, thesis title, Defense Day header. Weight 600. Never below 22 px. |
| UI and body | IBM Plex Sans | All UI text. Weights 400, 500 and 600 only. |
| Data | IBM Plex Mono | Commit tags, form numbers (TDW 07), dates and times, file hashes. Weight 400 or 500. |

All three fonts use the SIL Open Font License. Load them with `next/font/google`. The fonts are self-hosted at build time, so no extra service is added (NFR-06).

### 4.1 Scale

| Token | Size / line height | Font, weight | Use |
| :---- | :---- | :---- | :---- |
| `display` | 36 / 44 | Serif 600 | Thesis title on the Student dashboard |
| `title` | 28 / 36 | Serif 600 | Page title |
| `heading` | 20 / 28 | Sans 600 | Section heading |
| `subheading` | 16 / 24 | Sans 600 | Region heading, dialog title |
| `body` | 16 / 24 | Sans 400 | Default text, forms, threads |
| `ui` | 14 / 20 | Sans 400 or 500 | Tables, buttons, navigation, pills |
| `caption` | 12 / 16 | Sans 500 | Helper text, timestamps in lists |
| `mono` | 13 / 20 | Mono 400 | Commit tags, form numbers, dates |

### 4.2 Rules

- Use sentence case for headings, buttons and labels. Use uppercase only for the commit hash prefix and enum values in logs.
- Use tabular figures (`font-variant-numeric: tabular-nums`) for scores, counts, dates and the KPI strip.
- Write dates in Philippine Standard Time, in one format: `Tue 12 Jan 2027, 09:00 PHT`. Use relative time ("in 9 days") only next to an absolute date (NFR-11).
- Keep reading text at 72 characters or fewer for each line. Critique threads use a 60-character measure.
- Use `text-wrap: balance` for titles. Use `text-wrap: pretty` for body text.
- Truncate a thesis title in tables at one line, and show the full title in a tooltip and on focus.

---

## 5. Layout

### 5.1 App shell

```
┌──────────────────────────────────────────────────────────────────────┐ 3px maroon masthead rule
│ PUP CpE Thesis Progress    │ Students / J. Dela Cruz / Milestone 2   [user]│ top bar 56px
├────────────┬─────────────────────────────────────────────────────────┤
│ Dashboard  │ ┌ DOCKET ─────────────────────────────────────────────┐ │
│▌Manuscript │ │ ①──②──③──◇  Pre-Final · Ready for review            │ │ where am I
│ Documents  │ │ Blocks: IPMO check has not passed.                  │ │ what blocks me
│ Schedule   │ │                              [ Endorse (Gate 1a) ]  │ │ what can I do
│            │ └─────────────────────────────────────────────────────┘ │
│ sidebar    │ ─── Readiness ───────────────────────────────────────── │ ruled sections
│ 240px      │ ...                                                     │
└────────────┴─────────────────────────────────────────────────────────┘
```

| Region | Rule |
| :---- | :---- |
| Masthead rule | A 3 px PUP Maroon line at the top of every page. This is the only full-width brand color. |
| Sidebar | 240 px. Fill `neutral-100`. The active item has a 3 px maroon left marker and maroon text. Below 1024 px, the sidebar becomes a drawer. |
| Top bar | Breadcrumb, then milestone pill and status pill, then the user menu. Fill white with a hairline bottom border. |
| Content | Maximum 1200 px wide. Gutters: 32 px on desktop, 24 px on tablet, 16 px on phone. |

### 5.2 The Docket (signature component)

The Docket is the first region of every record screen. It is the only card on the page.

| Row | Content |
| :---- | :---- |
| 1. Where am I | The milestone stepper and the status pill |
| 2. What blocks me | One sentence from UTP 3.6. If nothing blocks, the row says "Nothing blocks this step." |
| 3. What can I do now | One primary button. Secondary actions are text buttons to its left. |

On the Student dashboard, the Docket is the Next-action card (UTP 3.1). On the Coordinator dashboard, the Docket becomes the KPI strip, because the Coordinator acts on queues, not on one record.

### 5.3 Screen patterns

| Pattern | Screens | Layout |
| :---- | :---- | :---- |
| Overview | S1, A1, P1, C1 | Docket, then ruled sections. No card grid. |
| Queue | C1 to C5, C7, C9 | TanStack Table. Rows 40 px. Group headers are ruled rows in `subheading`. |
| Manuscript workspace | S2, A2, P2 | Split screen. The PDF viewer on a `neutral-100` field (flexible width). The thread feed is 400 px on the right. The role actions are in a sticky bottom bar. Below 1024 px, the thread feed becomes a tab. |
| Defense Day | A5, P4, C6 | One column, 880 px maximum. Tabs: My evaluation, Verdict. Targets 48 px. Works on tablet in portrait and landscape (NFR-09). |
| Form | Availability, dialogs, settings | One column, 640 px maximum. Labels above fields. |

### 5.4 Spacing

Use a 4 px base. Tokens: `4, 8, 12, 16, 24, 32, 48, 64`. Each step is at least 25% larger than the last one.

| Relationship | Space |
| :---- | :---- |
| Label to field | 8 |
| Field to field | 16 |
| Inside a section | 24 |
| Section to section | 48, with a hairline rule |
| Docket padding | 24 |

### 5.5 Breakpoints

| Name | Width | Change |
| :---- | :---- | :---- |
| phone | < 640 | One column. Tables become stacked rows. Read only for most screens. |
| tablet | 640 to 1023 | Sidebar drawer. Thread feed tab. Defense Day is fully supported. |
| laptop | ≥ 1024 | Full shell. Split workspace. |

---

## 6. Shape, depth and motion

| Item | Rule |
| :---- | :---- |
| Radius | Controls 4 px. The Docket and dialogs 6 px. Status pills fully round. Document stamps 2 px. |
| Borders | 1 px hairline `neutral-200` between regions. Inputs use `neutral-500` (3.80:1). |
| Shadow | None on the page. Popovers, menus and dialogs only: `0 8px 24px rgb(30 22 23 / 0.12)`. |
| Motion | 150 ms ease-out for hover, focus and state changes. 200 ms for a dialog. No entry animations, no page transitions, no counting numbers. Respect `prefers-reduced-motion`. |
| Gradients | None. |
| Icons | Lucide, stroke 1.5 px, 16 px in text and 20 px in buttons. Icons sit with a label, except in the icon buttons that have an `aria-label`. |

---

## 7. Components

### 7.1 Three status shapes

Three shapes show three kinds of status. The user learns the shape once.

| Component | Shape | Shows |
| :---- | :---- | :---- |
| **Status pill** | Round, tinted fill, icon + label | Milestone status |
| **Document stamp** | 2 px radius, 1 px border, white fill, form number in mono + state | Document lifecycle. Example: `TDW 07` · Verified |
| **Outside chip** | Round, **dashed** border, no fill | Ethics, IPMO, RPO, copyright. The dashed line means "outside the system, set by the Coordinator". |

### 7.2 Milestone stepper

Four nodes: Proposal, Pre-Final, Final, Clearance.

| Node state | Look |
| :---- | :---- |
| Completed | A gold-filled circle with a maroon check (`check`) |
| Active | A gold-filled circle with a maroon border, and the label in `subheading` |
| Locked | A `neutral-300` outline circle with a lock icon, and the label in muted text |

The line between nodes is maroon after a completed node and `neutral-300` after other nodes. Do not use a star or any other shape from the PUP logo (P9).

### 7.3 Buttons

| Kind | Look | Use |
| :---- | :---- | :---- |
| Primary | Maroon fill, white text. Hover `maroon-700`. Pressed `maroon-800`. | One per screen region. Gate actions, Mark Ready, Confirm. |
| Secondary | White fill, `neutral-500` border, ink text | Upload, Save draft, Export |
| Return | White fill, `returned` text and border, `undo-2` icon | Return. It always opens the Return dialog. |
| Text | No fill, maroon text, underline on hover | Low actions in tables and bars |

- Heights: 36 px default, 48 px on the Defense Day page.
- Labels are verbs that name the result: "Endorse for defense", not "Submit". Gate buttons name the gate in brackets: "Endorse (Gate 1b)".

### 7.4 Disabled action with a reason

- Use `aria-disabled="true"`, not `disabled`, so the button stays in the tab order. A screen reader can then read the reason.
- Show the reason under the button in `caption`, with a `lock` icon. Example: "Locked until Gate 1b."
- Link the reason with `aria-describedby`.

### 7.5 Flags (BR-17)

A flag is a `pending` banner with a `triangle-alert` icon. It sits above the action that it concerns. The action stays enabled. Examples: the residency warning, the Action Taken mismatch on the Verdict tab, a document Mismatch.

### 7.6 Locked manuscript

When the manuscript is locked (BR-07), the viewer shows a `locked` banner across its top: "Locked at Gate 1b on Mon 4 Jan 2027. Unlocks when the defense closes." The upload control shows its reason (7.4).

### 7.7 Commit selector

Each commit shows `v3` in Plex Mono, the short hash `a1b2c3d` in muted mono, the date and the uploader. The commit that is marked Ready has an `active` pill. A commit is never shown with a delete or edit control (BR-19).

### 7.8 Critique thread

| Part | Rule |
| :---- | :---- |
| Header | The reviewer's name, the role and designation, the page anchor (`p. 14`) in mono, and the status (Open or Resolved) |
| Body | `body` text, 60-character measure |
| Resolve | Only on the reviewer's own threads (BR-05). The Student sees "Reply" only. |
| Resolved | The thread collapses to one line with a `done` icon. A click expands it. |

### 7.9 Dialogs

- **Gate dialog:** The title names the gate. A list shows what the gate unlocks. The confirm button repeats the action. Example: "Endorse and lock manuscript".
- **Return dialog:** The reason field is required. Its label says "The Student sees this reason." The confirm button stays disabled with a reason (7.4) until the field has text.

### 7.10 Defense Day evaluation (TDW 08, TDW 13)

- Show each rubric row with its indicator code (`A1`) in mono, the name and the weight.
- Use a number input with a stepper, 48 px tall.
- Show the automatic total in `heading` with tabular figures. Show no grade and no grade equivalent (BR-15).
- Do not color the scores. Use ink for all scores (P7).
- The Save button says "Save my evaluation". The note under it says "Sign the paper sheet. The paper is the record." (BR-01)

### 7.11 Empty states

Each empty region says what is missing, why, and the next step. Example for the Adviser queue: "No endorsements are waiting. New items appear when a Student marks a commit Ready." No illustrations.

---

## 8. Voice and copy

| Rule | Example |
| :---- | :---- |
| Follow AGENTS.md Section 5 (ASD-STE100 at about 80%). Short sentences, active voice. | "The Coordinator confirms the date." |
| Use the terms in AGENTS.md Section 8 only. | "Panel Member", never "Evaluator". "Coordinator", never "Admin". |
| Blocked messages come from UTP 3.6, word for word. | "Locked until the defense is closed." |
| Say "recorded" and "verified", not "signed" or "approved" for in-system actions (BR-01). | "Endorsement recorded. Sign TDW 07." |
| Success messages name what changed and what comes next. | "Gate 1b done. The manuscript is locked. The Student can now pick a date." |

---

## 9. Accessibility

| Item | Rule |
| :---- | :---- |
| Standard | WCAG 2.2 AA |
| Focus | A 2 px maroon outline with a 2 px offset on light surfaces. On maroon fills, use a gold outline (6.67:1). Never remove the focus outline. |
| Targets | 24 × 24 px minimum. 36 px for standard controls. 48 px on the Defense Day page. |
| Color | Every status has an icon and a label (Section 3.3). |
| Tables | Real `<table>` markup. Sortable headers use `aria-sort`. |
| Forms | Labels are visible. Errors sit under the field, are linked with `aria-describedby`, and name the fix. |
| Live updates | Toasts and saved states use `role="status"`. |
| Keyboard | All actions work with the keyboard. The PDF viewer supports page up and page down. A skip link goes to the main content. |

---

## 10. Email (React Email)

Emails hold the event, the next action, the deadline and a link only (AGENTS.md Section 10).

| Part | Rule |
| :---- | :---- |
| Header | A 3 px maroon rule and the text wordmark "PUP CpE Thesis Progress" in serif. No logo. |
| Body | Plex Sans with system fallbacks, 16 px, ink on white, 560 px wide |
| Action | One maroon button with the verb. The full link appears as text below it. |
| Not allowed | Manuscript text, comments, scores, verdicts, images of any kind (no logo, no seal, P9) |

---

## 11. Tokens

### 11.1 Tailwind v4 theme

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

  --radius-stamp: 2px; --radius-control: 4px; --radius-panel: 6px;
}
```

### 11.2 shadcn/ui semantic tokens

| shadcn token | Value |
| :---- | :---- |
| `--background` | `neutral-50` |
| `--foreground` | `neutral-900` |
| `--card`, `--popover` | `neutral-0` |
| `--primary` / `--primary-foreground` | `maroon-600` / `neutral-0` |
| `--secondary` / `--secondary-foreground` | `neutral-100` / `neutral-900` |
| `--muted` / `--muted-foreground` | `neutral-100` / `neutral-600` |
| `--accent` / `--accent-foreground` | `maroon-50` / `maroon-700` |
| `--destructive` | `returned` text `#B3261E` (tinted use only, P6) |
| `--border` | `neutral-200` |
| `--input` | `neutral-500` |
| `--ring` | `maroon-600` |
| `--radius` | `4px` |

### 11.3 Status tokens

```css
:root {
  --tone-neutral-fg: #5B5052;  --tone-neutral-bg: #F4F1F1;  --tone-neutral-line: #E7E1E1;
  --tone-active-fg: #1F4E8C;   --tone-active-bg: #E7EEF8;   --tone-active-line: #BCD0EC;
  --tone-pending-fg: #8F4A06;  --tone-pending-bg: #FCEEDD;  --tone-pending-line: #F1CFA6;
  --tone-done-fg: #1B6B45;     --tone-done-bg: #E5F3EA;     --tone-done-line: #B7DDC5;
  --tone-returned-fg: #B3261E; --tone-returned-bg: #FCE9E7; --tone-returned-line: #F2BDB8;
  --tone-locked-fg: #4A3F41;   --tone-locked-bg: #EFEBEB;   --tone-locked-line: #D3CBCB;
  --tone-achieved-fg: #3D0505;     --tone-achieved-bg: #F4C430;     --tone-achieved-line: #D9A600;
}
```

---

## 12. Do and do not

| Do | Do not |
| :---- | :---- |
| Use one maroon button in each region. | Put maroon on large fills, the sidebar or headers. |
| Use gold only for the `achieved` tone and the current step. | Use gold for warnings, highlights or decoration. |
| Use ruled sections and hairlines. | Wrap every section in a bordered, rounded card. |
| Show the reason next to every disabled action. | Hide a blocked action or show it without a reason. |
| Use mono for commit tags, form numbers and dates. | Use mono for body text or labels. |
| Show the rubric total as a number. | Show a grade, a grade equivalent or colored scores. |
| Use tables, pills, stamps and steppers. | Add decorative charts, gradients, emoji or illustrations. |
| Use the text wordmark and the PUP colors. | Use the PUP logo, seal, emblem, a star or any image symbol (P9). |

---

## 13. Open points

| ID | Point |
| :---- | :---- |
| D-01 | [CONFIRM] The exact hex of PUP Gold. Check it against the PUP Branding and Style Guideline. |
| D-02 | [CONFIRM] Approve the change from UTP 1.7 (Inter to IBM Plex Sans, slate to warm neutrals). |
| D-03 | Closed. No PUP logo, seal or image symbol (P9). The stepper uses a check, not a star. |
| D-04 | Dark mode is not in v0.1. The tokens are semantic, so a dark theme can be added later. |
| D-05 | Closed. Replaced by P9. |
