# ThesIsko — PUP CpE Thesis Progress System

A role-separated academic progress monitoring system for the Polytechnic University of the Philippines (PUP) Graduate School — Department of Computer Engineering (MSCpE and D.Eng with CpE Specialization).

The candidate submits a versioned manuscript, the adviser and appointed evaluation committee review specific revisions through commit-anchored critique threads, and strict gates govern progression across 3 milestones and post-defense institutional clearance.

---

## 1. Prototype & Screen Artifacts

> **Prototype only. Not a reference.** The screens below are the initial design from Google Stitch. They are not a source for the design, the process or the system behavior. Use [`DESIGN.md`](DESIGN.md), the `spec/` files and the `docs/` files instead. See [`design/stitch/README.md`](design/stitch/README.md).

### A. Master Interactive Prototype
Open [`design/stitch/document-ingestion-processor/code.html`](design/stitch/document-ingestion-processor/code.html) directly in any modern browser.
- **Zero build or install step**: Runs directly in the browser via CDN dependencies (Tailwind CSS, Inter, JetBrains Mono, Lucide Icons).
- **Interactive Persona Switcher** (fixed at bottom-right) allows seamless role switching across all 6 sample accounts with strict 1-role-per-account compliance (`BR-03`).
- **Interactive Features**: 30 navigable routes, Gate 1a/1b endorsements, locked manuscript state (`BR-07`), defense date proposal & confirmation, defense day evaluation rubrics (TDW 08 / 10 / 13), collective verdict recording, stage closing, clearance checklists, in-app Notification Center (24 use cases), preferences modal, and global search (<kbd>Ctrl</kbd>+<kbd>K</kbd>).

### B. Standalone User Screens & Sitemap Catalog
For design reviews, embedding, or documentation, all 30 routes have been modularized into 28 standalone HTML files located in [`design/stitch/document-ingestion-processor/screens/`](design/stitch/document-ingestion-processor/screens/):

- **[Screen Directory Hub (index.html)](design/stitch/document-ingestion-processor/screens/index.html)** — Directory catalog with direct links to all screen files and route specifications.
- **Student Portal**:
  - [`screens/student/s1_dashboard.html`](design/stitch/document-ingestion-processor/screens/student/s1_dashboard.html) — **S1**: Candidate Lifecycle & 3-Milestone Stepper
  - [`screens/student/s2_manuscript.html`](design/stitch/document-ingestion-processor/screens/student/s2_manuscript.html) — **S2**: Manuscript Workspace & Critique Threads
  - [`screens/student/s3_documents.html`](design/stitch/document-ingestion-processor/screens/student/s3_documents.html) — **S3**: Deliverables Checklist & Form Uploads
  - [`screens/student/s4_schedule.html`](design/stitch/document-ingestion-processor/screens/student/s4_schedule.html) — **S4**: Consultations & Defense Scheduler
  - [`screens/student/s5_defense_results.html`](design/stitch/document-ingestion-processor/screens/student/s5_defense_results.html) — **S5**: Defense Results & Minutes
  - [`screens/student/s6_clearance.html`](design/stitch/document-ingestion-processor/screens/student/s6_clearance.html) — **S6**: Post-Defense Institutional Clearance
- **Adviser Portal**:
  - [`screens/adviser/a1_dashboard.html`](design/stitch/document-ingestion-processor/screens/adviser/a1_dashboard.html) — **A1**: Advisee Roster & Action Queue
  - [`screens/adviser/a2_review.html`](design/stitch/document-ingestion-processor/screens/adviser/a2_review.html) — **A2**: Manuscript Review & Gate 1a Endorsement
  - [`screens/adviser/a3_consultations.html`](design/stitch/document-ingestion-processor/screens/adviser/a3_consultations.html) — **A3**: TDW Form 03 Certificate of Consultation Log
  - [`screens/adviser/a4_availability.html`](design/stitch/document-ingestion-processor/screens/adviser/a4_availability.html) — **A4**: Availability Slots Publisher
  - [`screens/adviser/a5_defense.html`](design/stitch/document-ingestion-processor/screens/adviser/a5_defense.html) — **A5**: Defense Day Evaluation Sheet
- **Panel Member Portal**:
  - [`screens/panel/p1_dashboard.html`](design/stitch/document-ingestion-processor/screens/panel/p1_dashboard.html) — **P1**: Assigned Defense Committees & Queue
  - [`screens/panel/p2_manuscript.html`](design/stitch/document-ingestion-processor/screens/panel/p2_manuscript.html) — **P2**: Manuscript Reader & Gate 1b Endorsement
  - [`screens/panel/p3_availability.html`](design/stitch/document-ingestion-processor/screens/panel/p3_availability.html) — **P3**: Defense Availability Matrix
  - [`screens/panel/p4_defense.html`](design/stitch/document-ingestion-processor/screens/panel/p4_defense.html) — **P4**: Defense Day Evaluation & Collective Verdict
- **Coordinator Portal**:
  - [`screens/coordinator/c1_dashboard.html`](design/stitch/document-ingestion-processor/screens/coordinator/c1_dashboard.html) — **C1**: Program Chair Overview & KPIs
  - [`screens/coordinator/c2_students.html`](design/stitch/document-ingestion-processor/screens/coordinator/c2_students.html) — **C2**: Student Accounts & Eligibility
  - [`screens/coordinator/c3_committees.html`](design/stitch/document-ingestion-processor/screens/coordinator/c3_committees.html) — **C3**: Committee Appointments & NDAs
  - [`screens/coordinator/c4_compliance.html`](design/stitch/document-ingestion-processor/screens/coordinator/c4_compliance.html) — **C4**: Document Compliance & Verification
  - [`screens/coordinator/c5_schedule.html`](design/stitch/document-ingestion-processor/screens/coordinator/c5_schedule.html) — **C5**: Defense Scheduling & Printed Copies
  - [`screens/coordinator/c6_defense.html`](design/stitch/document-ingestion-processor/screens/coordinator/c6_defense.html) — **C6**: Defense Verification, Minutes & Stage Close
  - [`screens/coordinator/c7_clearance.html`](design/stitch/document-ingestion-processor/screens/coordinator/c7_clearance.html) — **C7**: Clearance Management & Outside Statuses
  - [`screens/coordinator/c8_templates.html`](design/stitch/document-ingestion-processor/screens/coordinator/c8_templates.html) — **C8**: Milestone Templates & Parameters
  - [`screens/coordinator/c9_users.html`](design/stitch/document-ingestion-processor/screens/coordinator/c9_users.html) — **C9**: Faculty & User Registry
  - [`screens/coordinator/c10_audit.html`](design/stitch/document-ingestion-processor/screens/coordinator/c10_audit.html) — **C10**: System Audit Trail & CSV Export
- **Shared & Authentication**:
  - [`screens/shared/submission_view.html`](design/stitch/document-ingestion-processor/screens/shared/submission_view.html) — **SV**: Candidate Submission Dossier (Shared View across 4 roles)
  - [`screens/auth/login.html`](design/stitch/document-ingestion-processor/screens/auth/login.html) — Public Sign-In Screen with 1-click Demo Logins

---

## 2. Core Architecture & Operating Principles

### A. The 3-Milestone + Clearance Model
Replaces older 5-stage/7-stage flows. Stage 0 (concept paper, enrollment, units) occurs outside the system.
1. **Milestone 1: Proposal Defense** (Writing 1: RSH 641/741 • TDW 03, 05, 06, 07, 08; ends when `CERTIFIED` and Adviser approves data gathering).
2. **Milestone 2: Pre-Final Defense** (Writing 2 First Defense • TDW 03, 09, 10; requires IPMO similarity check `PASSED`; ends when `CLOSED`).
3. **Milestone 3: Final Defense and Clearance** (Writing 2 Second Defense & Clearance • TDW 03, 11, 12, 13; ends when `CLEARED`).

### B. Strict One-Role-Per-Account (`BR-03`)
Each account has exactly one primary role:
- **Student**: Candidate owning one Thesis Instance.
- **Adviser**: Faculty member directing the student. Never a Panel Member for that or other students.
- **Panel Member**: Faculty evaluation committee member (2 for Master's, 3 for Doctoral; or Final Panel: 3 for Master's, 4 for Doctoral, plus Chair). Never an Adviser.
- **Coordinator**: Program Chair & Graduate School Secretary. Only role that closes stages and verifies official records.
- **Designations** (assigned per thesis, not distinct roles):
  - *Lead Panel Member*: Designated panelist who records collective verdict at Proposal and Pre-Final.
  - *Panel Chair*: Designated panelist who completes TDW 13 and records collective verdict at Final Defense.

### C. Gate & Document Lifecycle
- **Two-Layer Approval (`BR-01`)**: System actions capture intent; wet-signed paper remains the legal record.
- **Gate 1a**: Adviser endorses Ready commit for committee review (blocked if Adviser has open critique threads; in M2 blocked until IPMO `PASSED`).
- **Gate 1b**: Unanimous endorsement by Adviser and all Panel Members. Manuscript **locks** (`BR-07`).
- **Defense Scheduling**: Student proposes date at least 7 days after Gate 1b from common free dates (`BR-09`). Coordinator confirms room/link.
- **Defense Day**: Opened at scheduled start (`BR-10`). Each member encodes evaluation. Collective verdict recorded on or after defense date.
- **Gate 2 (Milestone 3 only)**: Committee and Final Panel sign approval sheet after IPMO `PASSED`, RPO `DONE`, and threads resolved.
- **Clearance**: 7 items (IPMO, RPO, Gate 2, Copyright, Hardbound copies, Conference presentation cert, Journal publication) verified before granting `CLEARED`.

---

## 3. Demo Persona Roster

Switch between personas via the floating button at bottom-right in `code.html`:

| Account | Role | Degree / Sub-Role | Default View | Sample Thesis Context |
| :--- | :--- | :--- | :--- | :--- |
| **Juan Dela Cruz** | Student | Master's (MSCpE) | `/student/dashboard` | *EchoWood* (Milestone 1, Gate 1b completed, proposing defense date) |
| **Engr. Liza Navarro, PECE** | Student | Doctoral (D.Eng - CpE) | `/student/dashboard` | *Urban Estero Telemetry* (Milestone 3, defense held, post-defense clearance) |
| **Dr. Elena C. Reyes, PECE** | Adviser | Professor VI | `/adviser/dashboard` | Advisees roster, Gate 1a review queue, consultation logger |
| **Engr. Marco V. Santos, PECE, Ph.D.** | Panel Member | Associate Professor IV | `/panel/dashboard` | Lead Panelist (M1) & Panel Chair (M3); encodes rubrics & collective verdicts |
| **Dr. Clara M. Mendoza** | Panel Member | Professor III | `/panel/dashboard` | Cognate Specialist; committee manuscript reader & evaluations |
| **Dr. Arturo S. Cruz** | Coordinator | Program Chair & GS Secretary | `/coordinator/dashboard` | Program overview, eligibility accounts, compliance, defense verification, clearance |

---

## 4. Documentation Sources of Truth

Governing documents live in [`docs/`](docs/). Agent rules live in [`AGENTS.md`](AGENTS.md) (`CLAUDE.md` points to it).

| Document | Role |
| :--- | :--- |
| [`spec/PRD.md`](spec/PRD.md) | Goals, scope, stack, risks, decision log (v2.0 draft) |
| [`spec/USERFLOW.md`](spec/USERFLOW.md) | Journey, 14-step defense cycle, role flows, exceptions |
| [`spec/SITEMAP.md`](spec/SITEMAP.md) | 30 routes, navigation, screens, access rules |
| [`spec/DFD.md`](spec/DFD.md) | Data flow diagram: elements, flows, trust boundaries |
| [`spec/ERD.md`](spec/ERD.md) | Data model: tables, enums, invariants, state machines |
| [`spec/BUILD_PLAN.md`](spec/BUILD_PLAN.md) | Build phases, epics and tasks |
| [`PUP_CpE_Thesis_Progress_System_Functional_Requirements_v1.1.md`](docs/PUP_CpE_Thesis_Progress_System_Functional_Requirements_v1.1.md) | FR, BR, NFR and AS IDs. The spec. |
| [`PUP_CpE_Thesis_Progress_System_Operational_Flow_DFD_Sitemap_v3.1.md`](docs/PUP_CpE_Thesis_Progress_System_Operational_Flow_DFD_Sitemap_v3.1.md) | Process, data flows, 30 routes |
| [`PUP_CpE_Thesis_Progress_System_Unified_Thesis_Process_v1.1.md`](docs/PUP_CpE_Thesis_Progress_System_Unified_Thesis_Process_v1.1.md) | Source of truth for the thesis process |

If two documents disagree, the Unified Thesis Process wins for process rules. The Functional Requirements win for system behavior.

Old documents are in [`docs/stale/`](docs/stale/). They are history only. Do not use them as a source.
