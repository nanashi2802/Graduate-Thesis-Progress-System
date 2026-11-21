# **PUP CpE Thesis Progress Monitoring System \- Architectural Scratchpad**

**Compliance Standard:** 80% ASD-STE100 (Simplified Technical English)  
**Scope:** PUP Graduate Computer Engineering (CpE) Program  
Current Phase: Phase 1 — AI-Native PRD & Quality Attributes

---

# **1\. Locked Domain Glossary (Term Locking)**

| Term | Definition |
| :---- | :---- |
| **Student** | The PUP CpE graduate student who submits deliverables and schedules defenses. |
| **Thesis Adviser** | The faculty member who mentors the Student and executes Gate 1 endorsement. |
| **Panel Member** | The faculty member who reviews endorsed manuscripts and evaluates the defense at Gate 2\. |
| **Program Coordinator** | The administrator who configures workflow templates, rubrics, and user accounts. |
| **AI Agent** | The embedded software subsystem that triages deliverables, tracks deadlines, and synthesizes revisions. |
| **Milestone Template** | The metadata configuration that defines stages, required files, and approval gates. |
| **Milestone Instance** | The active transactional record of a Milestone Template assigned to a specific Student. |
| **Submission Pull Request (Submission PR)** | The versioned container for Student deliverables and ordinal critique threads. |
| **Critique Thread** | An ordinal, version-bound feedback item created by a Thesis Adviser or Panel Member. |

---

# **2\. Architectural Decision Records (ADRs)**

## **ADR-001: Strict Role Separation Between Thesis Adviser and Panel Member**

* **Context:** The system requires clear access boundaries for faculty members.  
* **Decision:** Enforce strict global Role-Based Access Control (RBAC) separation between Thesis Adviser and Panel Member.  
* **Rules:**  
  1. A Thesis Adviser cannot hold the Panel Member role for any other Student or group.  
  2. A Panel Member cannot hold the Thesis Adviser role for any other Student or group.  
  3. Each user account binds to exactly one primary role in the RBAC schema.

## **ADR-002: Two-Stage Sequential Gatekeeping with Defense-Day Gate 2 Unlock**

* **Context:** Panel Members need early read access to manuscripts, but evaluation forms must wait until the defense date.  
* **Decision:** Implement a sequential state machine with a time-gated evaluation trigger.  
* **Rules:**  
  1. **Gate 1 (Adviser Endorsement):** The Thesis Adviser reviews the Submission PR and approves it for defense.  
  2. **Pre-Defense Read Access:** After Gate 1 approval, Panel Members receive read-only access to the manuscript and related documents.  
  3. **Defense-Day Trigger:** The system unlocks evaluation forms and rubric grading for Panel Members only on the scheduled defense timestamp.  
  4. **Gate 2 (Panel Sign-Off):** Panel Members submit evaluation forms, log Critique Threads, and record final milestone grades after the defense.

## **ADR-003: GitHub PR-Style Ordinal Revision & Critique Engine**

* **Context:** Flat comment sections lose feedback context across multiple document revisions.  
* **Decision:** Model document submissions after GitHub Pull Requests with ordinal version commits and stateful Critique Threads.  
* **Rules:**  
  1. The Student opens a Submission PR for a Milestone Instance and uploads Version 1 (`v1`).  
  2. The Thesis Adviser or Panel Member posts Critique Threads anchored to `v1` (`State: OPEN`).  
  3. The Student uploads Version 2 (`v2`) as a new ordinal commit inside the same Submission PR.  
  4. The reviewer inspects `v2`, verifies the fix, and either marks the thread `RESOLVED` or appends a follow-up comment in ordinal sequence.

---

# **3\. Core Functional Capabilities (Ingested from Initial Blueprint)**

## **3.1 Student Module**

* **FR-STU-01:** Submit thesis deliverables against dynamic Milestone Instances via a Submission PR.  
* **FR-STU-02:** Upload ordinal document revisions (`v1`, `v2`, `v3`) and maintain immutable version history.  
* **FR-STU-03:** View and respond to ordinal Critique Threads on submissions.  
* **FR-STU-04:** Book consultation slots with the Thesis Adviser and request defense schedules.  
* **FR-STU-05:** Track overall thesis progress via a visual deliverable tracker and calendar.

## **3.2 Thesis Adviser Module**

* **FR-ADV-01:** Monitor all assigned advisees via an expandable status dashboard.  
* **FR-ADV-02:** Configure consultation availability slots and approve or reject booking requests.  
* **FR-ADV-03:** Review Student submissions, post ordinal Critique Threads, and execute Gate 1 endorsement.

## **3.3 Panel Member Module**

* **FR-PAN-01:** Configure defense availability slots and respond to schedule requests.  
* **FR-PAN-02:** View Gate 1 endorsed manuscripts prior to the scheduled defense date.  
* **FR-PAN-03:** Access evaluation forms and grading rubrics unlocked on the day of the defense.  
* **FR-PAN-04:** Post ordinal Critique Threads, verify revision commits, and execute Gate 2 approval and grading.

## **3.4 Program Coordinator (Admin) Module**

* **FR-ADM-01:** Manage user accounts and enforce strict role assignment (Student, Thesis Adviser, Panel Member).  
* **FR-ADM-02:** Define and maintain dynamic Milestone Templates, deliverable schemas, and evaluation rubrics.  
* **FR-ADM-03:** Manage the available Panel Member pool and assign committees.  
* **FR-ADM-04:** Generate program-wide progress reports and analytics visualizations.

## **3.5 System-Wide & Quality Capabilities**

* **FR-SYS-01:** Authenticate users and enforce strict RBAC permissions.  
* **FR-SYS-02:** Maintain immutable version control for all uploaded files.  
* **FR-SYS-03:** Dispatch automated email notifications for state changes, bookings, and deadlines.  
* **FR-SYS-04:** Record immutable audit logs for all state transitions and grading actions.

## **3.6 Embedded AI Agent Capabilities**

* **FR-AIA-01 (Deliverable Pre-Flight Agent):** Validate uploaded manuscripts against Milestone Template requirements before notifying the Thesis Adviser.  
* **FR-AIA-02 (Proactive Pacing Agent):** Calculate Student velocity against academic deadlines and send risk alerts.  
* **FR-AIA-03 (Revision Synthesizer Agent):** Compare ordinal document versions (`vN` vs `vN+1`) against open Critique Threads and generate a verification brief for reviewers.

---

# **4\. Updated Architectural Decision Records (ADR-004 to ADR-006)**

## **ADR-004: Strictly Individual Student Thesis Cardinality (1:1)**

* **Context:** Academic programs vary between group capstones and individual graduate theses.  
* **Decision:** Enforce a strict 1:1 relationship between a Student and a Thesis Instance.  
* **Rules:**  
  1. Each Student owns exactly one active Thesis Instance.  
  2. Each Submission PR belongs to one Student.

## **ADR-005: Coordinator-Confirmed Defense Scheduling (Parked for Consultation)**

* **Context:** Defense scheduling requires alignment between Student requests, Faculty availability, and institutional room/date approval.  
* **Status:** PARKED (Option B Baseline).  
* **Baseline Rule:** The Student proposes a defense slot based on Thesis Adviser and Panel Member availability. The Program Coordinator (or Thesis Adviser) confirms the final schedule. Requires PUP Graduate School consultation to lock final authority.

## **ADR-006: Hybrid Physical-Digital Defense Evaluation (Parked for Consultation)**

* **Context:** Panel Members use physical evaluation sheets during the live defense rather than real-time digital grading forms.  
* **Status:** PARKED (Hybrid Physical-to-Digital Bridge Needed).  
* **Baseline Rule:** Panel Members view digital manuscripts in the system before and during the defense, but record scores on physical evaluation sheets. The mechanism for encoding physical scores and signatures back into the system requires PUP Graduate School consultation.

---

# **5\. End-to-End Hybrid Operational Scenario Flow & Gap Matrix**

* **Stage 0 (Program Setup):** The Program Coordinator configures Milestone Templates, deliverable schemas, and committee assignments.  
* **Stage 1 (Deliverable Drafting & AI Pre-Flight):** The Student opens a Submission PR and uploads v1. The AI Agent validates completeness and generates a Pre-Flight Report.  
* **Stage 2 (Gate 1 Mentorship & Endorsement):** The Thesis Adviser reviews v1, logs Critique Threads, verifies v2 revisions, and executes Gate 1 Endorsement.  
* **Stage 3 (Defense Scheduling \- Parked):** The Student selects an available slot from Thesis Adviser and Panel Member calendars. Confirmation authority awaits institutional consultation.  
* **Stage 4 (Pre-Defense Read Access):** Panel Members receive read-only access to the Gate 1 endorsed manuscript prior to the defense date.  
* **Stage 5 (Physical Defense Execution \- Parked):** The Student presents live. Panel Members read the digital manuscript on their devices and fill out physical evaluation sheets.  
* **Stage 6 (Post-Defense Encoding & Gate 2 Revisions):** Physical evaluation outcomes enter the system (actor TBD). Panel Members and the Student resolve post-defense Critique Threads via ordinal commits (v3..vN) until Gate 2 Sign-Off.

---

# **6\. Feature-to-Technology Stack Mapping Report**

* **Frontend & UI Layer:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, TanStack Table, React-PDF.  
* **Backend & Database Layer:** Supabase (PostgreSQL 3NF Relational Engine), Supabase Auth \+ Row-Level Security (RLS), Supabase Storage (Immutable Object Buckets).  
* **Asynchronous Workflow & Event Engine:** Inngest or Trigger.dev (Event-driven state machine, temporal defense-day triggers, and background AI jobs), Resend \+ React Email (Transactional notifications).  
* **Embedded AI Engineering Layer:** Vercel AI SDK (Structured JSON outputs with Zod schemas), LLM API with PDF/Vision parsing, pgvector (RAG over Milestone Templates and rubrics).

---

# **7\. Architectural Decision Record: ADR-007 (AI Subsystem Deferral & Frontend-First Blueprinting)**

* **Context:** The core human workflow and frontend navigation boundaries must stabilize before introducing backend infrastructure or AI automation.  
* **Decision:** Defer the Embedded AI Agent subsystem (`FR-AIA-01` to `FR-AIA-03`) and backend implementation. Proceed with a Frontend-Only Information Architecture (Site Map) and Structural Wireframe specification.  
* **Rules:**  
  1. Reserve UI container slots for future AI Agent reports without active backend triggers.  
  2. Model all data interactions using deterministic Frontend Mock State Contracts.  
  3. Enforce Zero Implementation Code (no raw React/HTML/CSS code in architectural specs).

---

# **8\. Role-Based Information Architecture (Site Map) & Frontend State Contracts**

## **8.1 Global Navigation & Role Isolation**

* `/login` — Role-aware authentication entry view.  
* `/student/*` — Isolated portal for the Student role.  
* `/adviser/*` — Isolated portal for the Thesis Adviser role.  
* `/panel/*` — Isolated portal for the Panel Member role.  
* `/coordinator/*` — Isolated portal for the Program Coordinator role.

## **8.2 Student Portal (`/student`)**

* **Dashboard (**`/student/dashboard`**):** Displays the active Thesis Instance, current Milestone Instance progress bar, and upcoming consultation or defense schedules.  
* **Milestone PR View (**`/student/milestones/[milestoneId]/pr`**):** Displays the active Submission PR, ordinal Submission Commit history (`v1..vN`), file upload dropzone, and Critique Thread list.  
* **Scheduler (**`/student/schedule`**):** Displays Thesis Adviser consultation slots and overlapping Panel Member availability for defense booking requests.

## **8.3 Thesis Adviser Portal (`/adviser`)**

* **Advisee Roster Dashboard (**`/adviser/dashboard`**):** Displays an expandable table of all assigned Students, active Milestone Instance statuses, and pending Gate 1 action badges.  
* **Submission PR Review Workspace (**`/adviser/pr/[prId]`**):** Displays a split-screen view with the PDF manuscript reader on the left and ordinal Critique Threads plus the Gate 1 Endorsement action bar on the right.  
* **Availability Manager (**`/adviser/availability`**):** Allows the Thesis Adviser to define recurring or one-off consultation and defense time slots.

## **8.4 Panel Member Portal (`/panel`)**

* **Assigned Defenses Dashboard (**`/panel/dashboard`**):** Lists assigned Students whose Submission PRs have passed Gate 1 Endorsement.  
* **Manuscript & Critique Workspace (**`/panel/pr/[prId]`**):** Provides read-only access to the Gate 1 endorsed manuscript prior to the defense, and unlocks post-defense Critique Thread creation and resolution controls (`Gate 2`).  
* **Availability Manager (**`/panel/availability`**):** Allows the Panel Member to publish available time blocks for defense scheduling.

## **8.5 Program Coordinator Portal (`/coordinator`)**

* **Program Analytics Overview (**`/coordinator/dashboard`**):** Displays aggregate Student distribution across Milestone Instances and completion velocity charts.  
* **Workflow Template Builder (**`/coordinator/templates`**):** Provides a metadata configuration workspace to define Milestone Templates, required deliverable schemas, and approval gates.  
* **Account & Committee Manager (**`/coordinator/users`**):** Manages user accounts and assigns exactly one Thesis Adviser and multiple Panel Members to each Student Thesis Instance while enforcing Disjoint RBAC.

---

# **9\. Architectural Decision Records: ADR-008 to ADR-010 (Frontend Interaction & Demo Architecture)**

## **ADR-008: Asynchronous Non-Blocking Commit Model**

* **Context:** A Student may upload a new Submission Commit (`v2`) while a Thesis Adviser or Panel Member reviews an older commit (`v1`).  
* **Decision:** Implement an asynchronous, non-blocking commit model similar to GitHub Pull Requests.  
* **Rules:**  
  1. The system never locks the Student upload dropzone during active reviews.  
  2. Each Critique Thread binds permanently to the specific Submission Commit ID (`v1`) active when the reviewer posted it.  
  3. When the Student uploads `v2`, the UI displays an "Outdated Commit" badge on threads anchored to `v1`, but keeps those threads `OPEN` until the reviewer resolves them.

## **ADR-009: PR-Level General Critique Threads**

* **Context:** Pinning comments to exact PDF coordinates creates fragile UI state across document revisions.  
* **Decision:** Model Critique Threads as general PR-level feedback items attached to a Submission Commit ID.  
* **Rules:**  
  1. Reviewers write general text comments in the right-hand Critique Thread panel without clicking inside the PDF canvas.  
  2. Each Critique Thread stores the author role, commit reference (`v1..vN`), ordinal comment list, and resolution state (`OPEN` or `RESOLVED`).

## **ADR-010: Strict RBAC Enforcement with Floating Persona Switcher**

* **Context:** The frontend-only prototype requires end-to-end testing across all four isolated portals without a live authentication backend.  
* **Decision:** Enforce strict route-level RBAC isolation and provide a floating popover Persona Switcher for demo testing.  
* **Rules:**  
  1. The application blocks cross-portal navigation (e.g., a Student session cannot access `/adviser/*` routes).  
  2. A floating popover button allows the tester to switch active pre-configured mock accounts (`Student`, `Thesis Adviser`, `Panel Member`, `Program Coordinator`).  
  3. Parked institutional actions (`GAP-02` Defense Schedule Confirmation and `GAP-03` Physical Evaluation Outcome Encoding) reside inside the `Program Coordinator` portal to maintain strict RBAC boundaries during demos.