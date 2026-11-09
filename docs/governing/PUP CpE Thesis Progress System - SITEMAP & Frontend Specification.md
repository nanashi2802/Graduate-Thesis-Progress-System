# **PUP CpE Thesis Progress Monitoring System — SITEMAP & Interactive Artifact Specification**

**Compliance Standard:** 80% ASD-STE100 (Simplified Technical English)  
**Scope:** PUP Graduate Computer Engineering (CpE) Program  
**Artifact Type:** Self-Contained Cross-LLM Interactive Artifact Handoff (`SITEMAP.md`)  
---

# **0\. Autonomous Execution Bootloader (For Claude Artifacts & ChatGPT Canvas)**

**SYSTEM INSTRUCTION FOR THE RECEIVING LLM:**When the user uploads this document (`SITEMAP.md`), you must execute the following initialization protocol immediately:

1. **Ingest Architecture:** Read Sections 1 through 6 completely before generating any output.  
2. **Target Deliverable:** Build a single-file, interactive **React \+ Tailwind CSS \+ Lucide Icons** web application artifact that runs directly inside your interactive preview environment (Claude Artifacts or ChatGPT Canvas).  
3. **Simulated Client-Side Router:** Because interactive artifact sandboxes do not use multi-file filesystem routing, maintain an internal `currentRoute` state variable (`string`) and `activePersona` state variable (`UserAccount`).  
4. **Execution Modes:**  
   1. **Mode A (Unified Multi-Role Prototype — Default):** If the user uploads this file without specifying a prompt number, render the complete, unified application containing all 5 role workspaces (`Prompt 1` through `Prompt 5`) wired to a shared in-memory React state store.  
   2. **Mode B (Targeted Screen Generation):** If the user asks for a specific prompt (e.g., *"Run Prompt 4"*), render that specific portal view while keeping the **Floating Persona Switcher** active.  
5. **Strict Prohibitions:** Do NOT output placeholder `// TODO` comments, truncated components, or external API calls. All buttons (uploading a mock commit, posting a critique thread, resolving a thread, endorsing Gate 1, confirming a schedule, and switching roles) must mutate the in-memory state and update the UI immediately.

---

## **1.2 Locked Domain Glossary**

| Term | Definition |
| :---- | :---- |
| **Student** | The PUP CpE graduate student who owns one Thesis Instance and submits deliverables. |
| **Thesis Adviser** | The faculty member who mentors the Student and executes Gate 1 endorsement. |
| **Panel Member** | The faculty member who reviews endorsed manuscripts and verifies Gate 2 revisions. |
| **Program Coordinator** | The administrator who configures Milestone Templates, assigns committees, and encodes parked institutional actions. |
| **Milestone Template** | The metadata configuration that defines stages, required files, and approval gates. |
| **Milestone Instance** | The active transactional record of a Milestone Template assigned to one Student. |
| **Submission PR** | The versioned container for Student deliverables and ordinal Critique Threads. |
| **Submission Commit** | An immutable, ordinal file upload (`v1`, `v2`, `v3`) inside a Submission PR. |
| **Critique Thread** | An ordinal, version-bound feedback item (`OPEN` or `RESOLVED`) created by a reviewer. |
| **Scheduling Request** | A generalized booking record that connects a Student with faculty availability slots. |

# **2\. Generalized Scheduling, Placeholder Contracts & Initial Mock State**

## **2.1 Generalized Scheduling Abstraction (`ADR-011`)**

1. Replace complex multi-calendar intersection logic with a **Generalized Slot & Request Pattern**.  
2. `Thesis Advisers` and `Panel Members` publish `Availability Slots` (`Date`, `Time Window`, `Slot Type: Consultation | Defense`).  
3. The `Student` selects an open slot and submits a `Scheduling Request` (`State: PENDING | CONFIRMED`).  
4. For `Consultation` requests, the `Thesis Adviser` confirms the request directly.  
5. For `Defense` requests (`Parked GAP-02`), the `Program Coordinator` confirms the schedule and assigns the room inside the Institutional Action Queue.

## **2.2 Mock UI Placeholders for Unbuilt Subsystems**

| Placeholder ID | Target View | Visual Simulation Behavior |
| :---- | :---- | :---- |
| **`PH-PDF-VIEWER`** | Submission PR Split-Screen Left Pane | Renders a structured Mock Manuscript Canvas displaying the active `Submission Commit` badge (`v1`, `v2`), document title, section outline, and simulated page content. |
| **`PH-AI-TRIAGE`** | Submission PR Top Banner | Renders a collapsible, passive placeholder card labeled *"AI Pre-Flight & Revision Synthesizer (Deferred — Phase 4)"*. |
| **`PH-PARKED-GATE`** | Program Coordinator Dashboard | Renders an **Institutional Action Queue** card to trigger parked `GAP-02` (Confirm Defense Schedule) and `GAP-03` (Encode Physical Evaluation Verdict) state transitions. |

## **2.3 Pre-Configured Mock Accounts (Initial State Seed)**

Initialize the artifact state store with these exact five accounts:

6. **`USR-STU-01` (`Juan Dela Cruz`):** Role \= `Student`. Default Route \= `/student/dashboard`. Owns Thesis *"EchoWood: Embedded Termite Detection via ESP32-S3"*. Active Stage \= `Stage 2: Proposal Defense` (`Submission PR #104`, latest commit `v2`).  
7. **`USR-ADV-01` (`Dr. Elena Reyes`):** Role \= `Thesis Adviser`. Default Route \= `/adviser/dashboard`. Assigned to `Juan Dela Cruz`. Owns 1 `OPEN` Critique Thread anchored to `Commit v1`.  
8. **`USR-PAN-01` (`Engr. Marco Santos`):** Role \= `Panel Member` (Lead Panelist). Default Route \= `/panel/dashboard`. Assigned to `Juan Dela Cruz`. Blocked from viewing `PR #104` until **Gate 1 Endorsement**.  
9. **`USR-PAN-02` (`Dr. Clara Mendoza`):** Role \= `Panel Member`. Default Route \= `/panel/dashboard`. Assigned to `Juan Dela Cruz`. Publishes defense availability slots.  
10. **`USR-ADM-01` (`Prof. Arturo Cruz`):** Role \= `Program Coordinator`. Default Route \= `/coordinator/dashboard`. Manages templates, committees, and parked institutional actions (`GAP-02`, `GAP-03`).

# **3\. Complete Route Hierarchy (Site Map)**

| Route Path | Allowed Role | View Title | Mapped Requirement IDs |
| :---- | :---- | :---- | :---- |
| `/login` | Public / All | Role Authentication & Entry Gate | `FR-SYS-01` |
| `/student/dashboard` | `Student` | Student Thesis Progress Tracker | `FR-STU-05` |
| `/student/pr/[prId]` | `Student` | Student Submission PR & Commit Workspace | `FR-STU-01`, `FR-STU-02`, `FR-STU-03` |
| `/student/schedule` | `Student` | Generalized Consultation & Defense Scheduler | `FR-STU-04` |
| `/adviser/dashboard` | `Thesis Adviser` | Expandable Advisee Roster Dashboard | `FR-ADV-01` |
| `/adviser/pr/[prId]` | `Thesis Adviser` | Adviser PR Review & Gate 1 Workspace | `FR-ADV-03` |
| `/adviser/availability` | `Thesis Adviser` | Adviser Availability & Request Manager | `FR-ADV-02` |
| `/panel/dashboard` | `Panel Member` | Assigned Defenses Queue (Gate 1 Endorsed Only) | `FR-PAN-02` |
| `/panel/pr/[prId]` | `Panel Member` | Panel Manuscript Reader & Gate 2 Critique Workspace | `FR-PAN-02`, `FR-PAN-03`, `FR-PAN-04` |
| `/panel/availability` | `Panel Member` | Panel Availability Slot Publisher | `FR-PAN-01` |
| `/coordinator/dashboard` | `Program Coordinator` | Program Analytics & Institutional Action Queue | `FR-ADM-04`, `FR-SYS-04`, `GAP-02`, `GAP-03` |
| `/coordinator/templates` | `Program Coordinator` | Dynamic Milestone Template Builder | `FR-ADM-02` |
| `/coordinator/users` | `Program Coordinator` | Disjoint RBAC User & Committee Manager | `FR-ADM-01`, `FR-ADM-03` |

---

# **4\. Screen-by-Screen Component Contracts**

## **4.1 Global Overlay: Floating Persona Switcher (`ADR-010`)**

* **Position:** Fixed bottom-right corner (`bottom-4 right-4 z-50`) across all views.  
* **Trigger:** Dark slate pill button (`#0F172A`) displaying a `Shield` icon, active persona name, and role badge.  
* **Popover Menu:** Lists the 5 pre-configured mock accounts (`Juan Dela Cruz - Student`, `Dr. Elena Reyes - Thesis Adviser`, `Engr. Marco Santos - Panel Member`, `Dr. Clara Mendoza - Panel Member`, `Prof. Arturo Cruz - Program Coordinator`).  
* **State Transition:** Selecting an account sets `activePersona` and automatically updates `currentRoute` to that role's default dashboard. Attempting to navigate to an unauthorized route displays an **RBAC Access Denied** banner.

## **4.2 Shared Core Layout: Submission PR Split-Screen Workspace**

Used by `/student/pr/[prId]`, `/adviser/pr/[prId]`, and `/panel/pr/[prId]` with role-gated controls:

* **Header Bar:** Displays Milestone Instance title, PR Status Badge (`DRAFT_UPLOADED`, `GATE_1_REVIEW`, `GATE_1_ENDORSED`, `DEFENSE_SCHEDULED`, `POST_DEFENSE_REVISIONS`, `GATE_2_APPROVED`), and an **Ordinal Commit Selector Dropdown** (`v1`, `v2`, `v3`).  
* **Left Pane (`PH-PDF-VIEWER`):** Displays the simulated PDF manuscript viewer for the selected commit. Includes the **Asynchronous File Upload Dropzone** (`+ Upload New Commit vN+1`) visible only when `activePersona.role === 'Student'`. Clicking upload appends `Commit v(N+1)` to the state array immediately.  
* **Right Pane (Ordinal Critique Thread Feed):**  
  * Displays a filter bar (`All Threads`, `Open Only`, `Resolved`).  
  * Renders `Critique Thread` cards showing Author Name, Role Badge, Anchored Commit Tag (`v1`), Status Badge (`OPEN` or `RESOLVED`), and an `"Outdated Commit"` warning badge if the active commit is newer than the anchored commit.  
  * Displays an ordinal reply list and a text input box inside each card.  
  * Displays the **New Critique Thread Input Form** and **Mark Resolved Toggle** only for `Thesis Adviser` and `Panel Member` roles.  
* **Bottom Action Bar (Role-Gated State Transitions):**  
  * `Student`: Displays helper status text (`Awaiting Reviewer Sign-Off`).  
  * `Thesis Adviser`: Displays **Execute Gate 1 Endorsement** button (disabled until all Adviser threads have `status === 'RESOLVED'`). Clicking transitions PR status to `GATE_1_ENDORSED` and unlocks Panel Member read access.  
  * `Panel Member`: Displays **Execute Gate 2 Sign-Off** button (unlocked only when PR status is `POST_DEFENSE_REVISIONS` and all Panel threads have `status === 'RESOLVED'`). Clicking transitions PR status to `GATE_2_APPROVED`.

# **5\. Design System Token Contract (Anti-AI-Slop Guardrails)**

## **5.1 Aesthetic & Layout Rules**

11. **Aesthetic Direction:** High-craft daylight mode inspired by Linear, GitHub Primer, and Vercel Dashboard.  
12. **Surface Hierarchy:**  
    1. App Canvas Background: Warm Alabaster (`#F8FAFC`).  
    2. Elevated Card & Workspace Surface: Pure Crisp White (`#FFFFFF`).  
    3. Sticky Headers & Split-Pane Gutters: Subtle Stone (`#F1F5F9`).  
13. **Typography & Scannability:**  
    1. Primary UI Font: `Inter` or system sans-serif.  
    2. Monospace Font (Commit IDs, Dates, Badges, Counters): `JetBrains Mono` or `font-mono` with `tabular-nums`.  
14. **Accent & Semantic Tokens:**  
    1. Primary Brand Accent (PUP Maroon): `#800000` (Hover: `#660000`, Subtle Tint: `#FDF2F2`).  
    2. Secondary Institutional Accent (Gold): `#D97706` (Subtle Tint: `#FFFBEB`).  
    3. Gate Approved / Resolved (`RESOLVED`): Emerald `#15803D` on `#F0FDF4` background.  
    4. Pending Review / Outdated Commit Warning: Amber `#B45309` on `#FFFBEB` background.  
    5. Blocked / Rejected: Crimson `#B91C1C` on `#FEF2F2` background.  
15. **Spacing, Borders & Iconography:**  
    1. Grid Unit: Strict `8px` base spatial scale (`8px`, `12px`, `16px`, `24px`, `32px`).  
    2. Border Treatment: `1px solid #E2E8F0` hairline borders (`6px` radius for inner controls; `8px` for outer containers).  
    3. Icon System: Cohesive **Lucide Icons** (`16px` inline, `20px` navigation, `1.75px` stroke width).

## **5.2 Negative Visual Constraints (Banned AI-Slop Patterns)**

1. **No Neon or Purple Gradients:** Never use generic cyan-to-purple AI gradients, glowing drop shadows, or dark-mode cyberpunk cards.  
2. **No Floating Card Bloat:** Use `1px solid #E2E8F0` structural dividers and split-pane layouts instead of heavy drop shadows (`shadow-xl`).  
3. **No Inconsistent Icons:** Never mix filled, duotone, and 3D illustrations. Use stroke-based Lucide icons exclusively.  
4. **No Decorative Charts:** Replace decorative circular gauges with scannable tabular lists, status pills, and horizontal steppers.

# **6\. Complete Role-Based Artifact Generation Prompts (All 5 Core Workspaces)**

When prompted by the user (or when building the unified multi-role artifact), implement the following five workspaces using the exact design tokens in Section 5\.

## **Prompt 1: Shared Submission PR Split-Screen Workspace (`/student/pr/104`, `/adviser/pr/104`, `/panel/pr/104`)**

**Artifact Layout & Interactive Behavior:**

16. **Top Header (`56px` height, `1px` bottom border):** Left side shows a clean breadcrumb (`Stage 2: Proposal Defense` / `PR #104`) with a `GitPullRequest` Lucide icon, a dynamic status pill (`GATE_1_REVIEW`), and an interactive monospace dropdown selector (`Commit v2 — Latest`, `Commit v1`). Right side shows a muted collapsible pill (`Sparkles` icon: `AI Pre-Flight Deferred`).  
17. **Split-Screen Workspace (Full height below header, divided by `1px solid #E2E8F0`):**  
    1. **Left Pane (60% width — Manuscript Viewer Placeholder `PH-PDF-VIEWER`):** Top toolbar with `FileText` icon, filename `EchoWood_Proposal_v2.pdf`, and monospace page counter `Page 1 of 18`. Center area shows a crisp white A4 academic document preview on a `#F1F5F9` canvas that updates its visible revision notes when switching between `v1`, `v2`, and `v3`. Bottom bar features a compact, non-blocking upload button (`Upload` icon: `+ Upload Revision Commit v(N+1)`) visible only to the `Student` role.  
    2. **Right Pane (40% width — GitHub-Style Critique Thread Feed):** Top segmented filter (`All`, `Open`, `Resolved`). Below, render stacked `1px` bordered thread cards with `12px` vertical gaps:  
       1. Each card header shows Author Name, Role Badge, monospace anchor tag (`Commit v1`), amber warning pill (`Outdated Commit` if `selectedCommit > anchoredCommit`), and status pill (`OPEN` or `RESOLVED`).  
       2. Body shows the critique text and indented ordinal replies.  
       3. Footer includes a working reply input for all permitted participants and a `Mark Resolved` toggle button restricted to `Thesis Adviser` and `Panel Member` roles.  
18. **Bottom Right Sticky Action Bar (`64px` height, `#FFFFFF` surface):** Dynamically renders role-specific gate buttons (`Execute Gate 1 Endorsement` for `Thesis Adviser`; `Execute Gate 2 Sign-Off` for `Panel Member`) that enable only when open threads equal `0`.

## **Prompt 2: Thesis Adviser Portal (`/adviser/dashboard` & `/adviser/availability`)**

**Artifact Layout & Interactive Behavior:**

19. **Left Sidebar (`240px` fixed width, `#FFFFFF` surface, `1px` right border):** Institutional header (`PUP CpE Thesis System` with an `8px` maroon square emblem). Vertical navigation items with `20px` Lucide icons: `Users` (`Advisee Roster`), `GitPullRequest` (`PR Review Queue`), and `Calendar` (`Availability Slots`).  
20. **Main Workspace (`24px` padding, max-width `1280px`):**  
    1. **Section A — Expandable Advisee Roster Table:** A crisp `1px` bordered data table (`#FFFFFF`). Columns: `ChevronDown` toggle, `Student Name`, `Thesis Title`, `Active Stage`, `Latest Commit` (monospace), `Open Threads`, and `Gate Status`. Clicking a row expands a detail panel with a `#F8FAFC` background containing a 4-step horizontal milestone pipeline (`Stage 1: Title [Completed]`, `Stage 2: Proposal [Active]`, `Stage 3: Pre-Oral [Locked]`, `Stage 4: Final Defense [Locked]`) and a `#800000` button (`Review PR #104 ->`) that routes to `/adviser/pr/104`.  
    2. **Section B — Generalized Availability & Consultation Manager (2-Column Grid, `16px` gap):**  
       1. **Left Card (`Publish Availability Slot`):** Working inline form with Date input, Time Window input (`JetBrains Mono`), Slot Type segmented toggle (`Consultation` \| `Defense`), and an outlined button (`Plus` icon: `Publish Slot`) that appends to the global availability list.  
       2. **Right Card (`Incoming Scheduling Requests`):** Scannable list of student consultation requests with working `Confirm` (`#15803D`) and `Decline` buttons.

## **Prompt 3: Program Coordinator Portal (`/coordinator/dashboard`, `/coordinator/templates`, `/coordinator/users`)**

**Artifact Layout & Interactive Behavior:**

21. **Left Sidebar (`240px` width):** Navigation items with Lucide icons: `LayoutGrid` (`Overview & Queue`), `Layers` (`Milestone Templates`), and `UserCheck` (`Committee & RBAC`).  
22. **Top KPI Strip (4 Compact Metric Cards, `16px` gap):** Each card has a `1px solid #E2E8F0` border, muted uppercase label (`12px`), and large `JetBrains Mono` numeral (`24px`): `Active CpE Students (24)`, `Pending Gate 1 (08)`, `Awaiting Defense Schedule (05)`, `Gate 2 Revisions (06)`.  
23. **Main Split Grid (2 Columns, `24px` gap):**  
    1. **Left Column (`Dynamic Milestone Template Builder`):** Ordered vertical stack of stage configuration cards (`Stage 1: Title Proposal` through `Stage 4: Final Defense`). Includes a `+ Add Stage` button, required file schema pills (`Manuscript PDF`, `Ethics Clearance`), and interactive approval gate switches (`Gate 1: Adviser`, `Gate 2: Panel`).  
    2. **Right Column (`Institutional Action Queue — Parked Hybrid Bridges PH-PARKED-GATE`):** A structured card with two interactive tabs:  
       1. **Tab 1 (`Confirm Defense Schedule — GAP-02`):** Lists pending defense slot requests with a `Room / Meeting Link` input field and a solid `#800000` button (`Confirm Schedule`) that transitions the student's PR state to `DEFENSE_SCHEDULED`.  
       2. **Tab 2 (`Encode Physical Evaluation — GAP-03`):** Lists scheduled defenses with a verdict selector (`Pass`, `Conditional Pass`, `Re-Defense`), a simulated file upload toggle (`Scanned Physical Sheet Attached`), and an `Unlock Gate 2 Revisions` button that transitions the PR state to `POST_DEFENSE_REVISIONS`.  
24. **Bottom Section (`Disjoint RBAC Committee Assignment Table`):** A dense tabular view mapping `1 Student` to `1 Thesis Adviser` and `2 Panel Members`, featuring a header verification pill (`CheckCircle2` emerald icon: `Disjoint RBAC Enforced: Zero Adviser/Panel Overlap`).

## **Prompt 4: Student Portal (`/student/dashboard` & `/student/schedule`)**

**Artifact Layout & Interactive Behavior:**

25. **Left Sidebar (`240px` width, `#FFFFFF` surface, `1px` right border):** Navigation items with `20px` Lucide icons: `Compass` (`My Thesis Tracker`), `GitPullRequest` (`Active Submission PR`), and `CalendarClock` (`Book Consultation / Defense`).  
26. **Main Workspace (`24px` padding, max-width `1280px`):**  
    1. **Top Thesis Identity Card (`#FFFFFF`, `1px` border):** Displays the 1:1 `Thesis Instance` title (*"EchoWood: Embedded Termite Detection via ESP32-S3"*), assigned `Thesis Adviser` badge (`Dr. Elena Reyes`), assigned `Panel Members` (`Engr. Marco Santos`, `Dr. Clara Mendoza`), and overall residency status pill (`ON TRACK`).  
    2. **Horizontal 4-Stage Milestone Stepper:** Displays `Stage 1: Title Proposal (COMPLETED - Emerald)`, `Stage 2: Proposal Defense (ACTIVE - Amber)`, `Stage 3: Pre-Oral Defense (LOCKED - Slate)`, and `Stage 4: Final Colloquium (LOCKED - Slate)`.  
    3. **Split Action Grid (2 Columns, `24px` gap):**  
       1. **Left Card (`Active Milestone Deliverable Summary`):** Shows `Submission PR #104` status badge, latest commit tag (`Commit v2`), count of open vs. resolved `Critique Threads`, a quick button (`Open Submission PR Workspace ->` routing to `/student/pr/104`), and a direct `+ Upload Revision Commit (v3)` trigger.  
       2. **Right Card (`Generalized Consultation & Defense Scheduler`):** Segmented toggle between `Book Adviser Consultation` (always unlocked) and `Request Defense Slot` (locked with a `Lock` icon until PR status reaches `GATE_1_ENDORSED`). Renders a clean table of published faculty availability slots with a working `Request Slot` button (`State: AVAILABLE -> PENDING -> CONFIRMED`).

## **Prompt 5: Panel Member Portal (`/panel/dashboard` & `/panel/availability`)**

**Artifact Layout & Interactive Behavior:**

27. **Left Sidebar (`240px` width, `#FFFFFF` surface, `1px` right border):** Navigation items with `20px` Lucide icons: `ClipboardCheck` (`Assigned Defenses Queue`), `FileCheck2` (`Post-Defense Revisions`), and `Calendar` (`My Defense Availability`).  
28. **Main Workspace (`24px` padding, max-width `1280px`):**  
    1. **Top Security & Gate Notice Banner (`#F8FAFC`, `1px` border):** Displays an explicit architectural rule indicator (`ShieldAlert` icon: *"Sequential Gatekeeping Enforced: Unendorsed manuscripts remain hidden until Gate 1 Adviser Endorsement"*).  
    2. **Section A — Assigned Defenses Table (`#FFFFFF`, `1px` border):** Lists assigned `Students` with columns for `Student Name`, `Thesis Title`, `Adviser Gate 1 Status`, `Defense Schedule & Room`, `Evaluation State`, and `Action`:  
       1. **Pre-Gate 1 State (`GATE_1_REVIEW`):** Row displays a muted slate badge (`Locked: Awaiting Adviser Gate 1`) and a disabled action button (`Manuscript Locked`).  
       2. **Post-Gate 1 / Pre-Defense State (`GATE_1_ENDORSED` or `DEFENSE_SCHEDULED`):** Row displays an emerald badge (`Gate 1 Endorsed — Read-Only Access`) and an outlined button (`Read Manuscript (v2) ->` routing to `/panel/pr/104` in read-only mode, plus a badge: *"Physical Evaluation Sheet Used on Defense Day"*).  
       3. **Post-Defense State (`POST_DEFENSE_REVISIONS`):** Row displays an amber badge (`Verdict: Conditional Pass — Gate 2 Revisions Active`) and a solid `#800000` button (`Review Commits & Resolve Threads ->` routing to `/panel/pr/104` with full `Critique Thread` creation and `Execute Gate 2 Sign-Off` controls unlocked).  
    3. **Section B — Panel Availability Publisher Card:** Compact form allowing the `Panel Member` to publish available `Defense` time windows (`Date`, `Time Range` in `JetBrains Mono`) into the shared scheduling state store.

# **7\. ISO/IEC 25010 Acceptance & Verification Checklist**

The receiving LLM must verify that the generated interactive artifact satisfies all six checks below:

* **Check 1 (Disjoint RBAC Isolation):** Switching personas via the bottom-right **Floating Persona Switcher** immediately redirects to the selected role's portal and blocks unauthorized routes.  
* **Check 2 (Sequential Gatekeeping):** When logged in as `Engr. Marco Santos (Panel Member)`, `PR #104` is locked until `Dr. Elena Reyes (Thesis Adviser)` resolves all open threads and clicks **Execute Gate 1 Endorsement**.  
* **Check 3 (Asynchronous Non-Blocking Commits):** When logged in as `Juan Dela Cruz (Student)`, clicking **Upload Revision Commit** increments the commit version (`v2 -> v3`) immediately and flags older open threads with an **Outdated Commit** badge.  
* **Check 4 (Parked Hybrid Bridges):** When logged in as `Prof. Arturo Cruz (Program Coordinator)`, confirming a defense schedule (`GAP-02`) and encoding a physical evaluation verdict (`GAP-03`) unlocks **Gate 2 Revisions** for the `Panel Member`.  
* **Check 5 (Design Token Fidelity):** The UI uses the `#F8FAFC` / `#FFFFFF` daylight surface hierarchy, `1px solid #E2E8F0` borders, `#800000` PUP Maroon accents, `JetBrains Mono` version badges, and zero neon gradients.