# **PUP CpE Thesis Progress System Specification**

**Compliance Standard:** 80% ASD-STE100 (Simplified Technical English)  
**Scope:** Phase 2 Systems Analysis (DeMarco/Yourdon Level 0 DFD) and Role-Based Information Architecture  
Constraint: Zero PRD, Zero ERD, and Zero Implementation Code

---

# **1\. DeMarco/Yourdon DFD Engineering Rules**

This specification applies formal DeMarco/Yourdon Data Flow Diagram rules to the PUP CpE Graduate Thesis domain:

1. **Processes (Action-Verb Phrases):** Every process name starts with a strong transitive verb followed by a clear object (for example, `1.0 Configure Program Templates`).  
2. **Data Flows (Strict Noun Phrases):** Every arrow represents data in motion and uses a singular or specific noun phrase (for example, `Submission Commit Payload`).  
3. **Data Stores (Plural Nouns):** Every data store represents data at rest and uses a plural noun phrase (for example, `D1 Milestone Templates`).  
4. **Zero Structural Flaws:**  
   * **No Black Holes:** Every process that receives input data flows must produce at least one output data flow.  
   * **No Miracles:** Every process that produces output data flows must receive required input data flows.  
   * **No Unmediated Flows:** External Entities never send data directly to Data Stores or other External Entities without a Process.

---

# **2\. Level 0 Data Flow Diagram Specification**

## **2.1 External Entities (Actors & Subsystems)**

* **Student:** Submits thesis deliverables, books schedules, and uploads ordinal revisions.  
* **Thesis Adviser:** Mentors the Student, publishes consultation slots, logs critiques, and executes Gate 1 Endorsement.  
* **Panel Member:** Publishes defense availability, reads endorsed manuscripts, evaluates defenses, and resolves Gate 2 critiques.  
* **Program Coordinator:** Configures Milestone Templates, assigns committees, co-endorses defenses, and verifies external clearances.  
* **AI Agent:** Validates uploaded deliverables, calculates residency pacing risks, and synthesizes revision diffs under strict read-only status guardrails.

## **2.2 Data Stores (Data at Rest)**

* **D1 Milestone Templates:** Stores stage metadata, required TDW/GSR/UREC form checklists, approval sequences, and lead-time rules.  
* **D2 Thesis Instances:** Stores active student thesis records, committee assignments, eligibility flags, and 5-year residency timestamps.  
* **D3 Submission PRs:** Stores versioned submission containers, ordinal Submission Commits (v1..vN), external clearance PDFs, and AI Pre-Flight reports.  
* **D4 Critique Threads:** Stores ordinal, commit-bound feedback threads and resolution states (OPEN or RESOLVED).  
* **D5 Schedules:** Stores faculty availability slots, consultation bookings, and confirmed defense schedules.  
* **D6 Audit Logs:** Stores immutable system state transition records and administrative overrides.

## **2.3 Level 0 Processes & Data Flow Matrix**

| Process ID & Name (Action Verb) | Source (Entity / Store) | Input Data Flow (Noun Phrase) | Target (Entity / Store) | Output Data Flow (Noun Phrase) |
| :---- | :---- | :---- | :---- | :---- |
| **1.0 Configure Program and Committees** | `Program Coordinator``D1 Milestone Templates` | • `Template Configuration Data`• `Eligibility and Committee Assignment` | `D1 Milestone Templates``D2 Thesis Instances``D6 Audit Logs``Student / Thesis Adviser` | • `Updated Template Schema`• `Initialized Thesis Record`• `Configuration Audit Entry`• `Assignment Notification` |
| **2.0 Triage Deliverable Submissions** | `Student``D1 Milestone Templates``AI Agent` | • `Submission Commit Payload`• `Stage Deliverable Criteria`• `Pre-Flight Validation Result` | `AI Agent``D3 Submission PRs``Student``Thesis Adviser` | • `Unverified Document Context`• `Versioned Commit Record`• `Pre-Flight Readiness Alert`• `New Submission Notification` |
| **3.0 Execute Mentorship and Gate 1 Endorsement** | `Thesis Adviser``Program Coordinator``D3 Submission PRs``AI Agent` | • `Adviser Critique and Endorsement`• `Coordinator Co-Endorsement`• `Commit Diff Context`• `Revision Verification Brief` | `D4 Critique Threads``D3 Submission PRs``D6 Audit Logs``Student` | • `Anchored Critique Record`• `Gate 1 Endorsed PR State`• `Endorsement Audit Entry`• `Gate 1 Status Notification` |
| **4.0 Manage Consultation and Defense Schedules** | `Thesis Adviser / Panel Member``Student``Program Coordinator``D3 Submission PRs` | • `Faculty Availability Slots`• `Schedule Booking Request`• `Schedule Confirmation Decision`• `Gate 1 Approval Timestamp` | `D5 Schedules``Student / Panel Member``D6 Audit Logs` | • `Confirmed Schedule Record`• `Confirmed Defense Notice`• `Schedule Audit Entry` |
| **5.0 Evaluate Defense and Verify Clearances** | `Panel Member``Program Coordinator``Student``D3 Submission PRs` | • `Panel Critique and Sign-Off`• `Encoded Defense Verdict`• `Post-Defense Clearance Bundle`• `Endorsed Manuscript File` | `Panel Member``D4 Critique Threads``D2 Thesis Instances``D6 Audit Logs` | • `Read-Only Manuscript Stream`• `Resolved Critique State`• `Updated Milestone Status`• `Evaluation Audit Entry` |

---

# **3\. Expansion Worksheet**

Use these structured prompts to expand or challenge the Level 0 DFD template:

* **Process 1.0 Expansion:** Should we separate *Stage 0 Eligibility & Adviser Contracting (TDW Forms 01–05)* into a standalone Level 0 Process, or keep it inside `1.0 Configure Program and Committees`?  
* **Process 2.0 Expansion:** Where should External Clearance PDFs (UREC Ethics, IODE Statistician, RMO Turnitin) enter the flow—inside `2.0 Triage Deliverable Submissions` as part of the `Submission Commit Payload`, or into a separate `Verify Institutional Clearances` process?  
* **Process 4.0 Expansion:** How should the **7-Day Temporal Guard** reject invalid `Schedule Booking Requests` on the diagram?  
* **Process 5.0 Expansion:** How should we route the **Proactive Pacing Agent** (5-year residency and deadline alerts)—inside an existing process or as `6.0 Monitor Pacing and Residency Risk`?

---

# **4\. Role-Based Sitemap & Screen Hierarchy**

This sitemap aligns system screens with the five official PUP Graduate School thesis stages and the Level 0 DFD processes.

## **4.1 Global Entry & Demo Overlay**

* `/login` — **Role Authentication Gate:** Authenticates users and routes them to their isolated role portal.  
* **Global Floating Persona Switcher (Overlay):** Allows instant switching between `Student`, `Thesis Adviser`, `Panel Member`, and `Program Coordinator` test personas.

## **4.2 Student Portal (`/student/*`)**

| Route Path | Screen Title | Mapped DFD Process | Institutional Purpose & Key UI Elements |
| :---- | :---- | :---- | :---- |
| `/student/dashboard` | **Thesis Lifecycle & Residency Tracker** | Process 1.0, 5.0 | Displays the 5-stage PUP progress bar (Stage 0 to Stage 4), 5-year residency countdown timer, and active action alerts. |
| `/student/stage/[stageId]/pr` | **Submission PR & Deliverable Workspace** | Process 2.0, 3.0, 5.0 | Provides the upload dropzone for Manuscript PDFs and required TDW/GSR/UREC forms, displays the `AI Agent` Pre-Flight checklist, and lists ordinal `Critique Threads` across commits (`v1..vN`). |
| `/student/schedule` | **Consultation & Defense Scheduler** | Process 4.0 | Displays `Thesis Adviser` consultation slots and `Panel Member` defense availability. Enforces the **7-Day Lead Time Guard** before allowing defense requests. |

## **4.3 Thesis Adviser Portal (`/adviser/*`)**

| Route Path | Screen Title | Mapped DFD Process | Institutional Purpose & Key UI Elements |
| :---- | :---- | :---- | :---- |
| `/adviser/dashboard` | **Advisee Roster & Velocity Matrix** | Process 1.0, 3.0 | Lists assigned Students, current Milestone stage, `TDW Form 03` consultation count, and pending Gate 1 endorsement badges. |
| `/adviser/pr/[prId]` | **Adviser PR Review & Gate 1 Workspace** | Process 3.0 | Split-screen workspace: Manuscript/Form PDF viewer on the left; `AI Agent` Revision Verification Brief, `Critique Thread` composer, and **Gate 1 Endorsement Button** on the right. |
| `/adviser/availability` | **Adviser Availability Manager** | Process 4.0 | Publishes recurring consultation slots and defense availability blocks, and logs `TDW Form 03` consultation sessions. |

## **4.4 Panel Member Portal (`/panel/*`)**

| Route Path | Screen Title | Mapped DFD Process | Institutional Purpose & Key UI Elements |
| :---- | :---- | :---- | :---- |
| `/panel/dashboard` | **Assigned Committee Defenses Queue** | Process 4.0, 5.0 | Lists Student defenses where the `Submission PR` has passed Gate 1 Endorsement and the 7-day lead-time window has started. |
| `/panel/pr/[prId]` | **Panel Manuscript Reader & Gate 2 Workspace** | Process 5.0 | Grants read-only manuscript access 7 days pre-defense. Unlocks post-defense `Critique Thread` logging and **Gate 2 Revision Sign-Off** after defense execution. |
| `/panel/availability` | **Panel Defense Slot Publisher** | Process 4.0 | Publishes available calendar blocks for Proposal, Pre-Final, and Final Oral defenses. |

## **4.5 Program Coordinator Portal (`/coordinator/*`)**

| Route Path | Screen Title | Mapped DFD Process | Institutional Purpose & Key UI Elements |
| :---- | :---- | :---- | :---- |
| `/coordinator/dashboard` | **Program Analytics & Institutional Action Queue** | Process 3.0, 4.0, 5.0 | Displays cohort residency metrics and an action queue for **Coordinator Co-Endorsements** (`TDW Form 07`, Pre-Final, `GS Form 10T`), **External Clearance Verifications** (UREC, Turnitin, Statistician, Grammarian, IPMO), **Defense Schedule Confirmations**, and **Physical Evaluation Score Encoding**. |
| `/coordinator/templates` | **Metadata Milestone Template Builder** | Process 1.0 | Configures the 5 official PUP stages, required TDW/GSR/UREC form checklists, approval chains, and `minimum_lead_days` rules without code changes. |
| `/coordinator/committees` | **Eligibility & Committee Manager (Disjoint RBAC)** | Process 1.0 | Verifies `GSR Form 07` (Comprehensive Exam), binds the `Thesis Adviser` at Stage 0 (`TDW Form 04`), and supports **Late Binding** of `Panel Members` (`TDW Form 06`) at Stage 1\. |
| `/coordinator/audit` | **Immutable System Audit Log Viewer** | Process 1.0–5.0 | Displays chronological, read-only audit trails of all state transitions, endorsements, and administrative actions. |

