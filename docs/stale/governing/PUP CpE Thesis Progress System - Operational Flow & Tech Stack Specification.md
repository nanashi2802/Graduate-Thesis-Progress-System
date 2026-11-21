# **PUP CpE Thesis Progress Monitoring System — Operational Flow & Technology Stack Specification**

**Compliance Standard:** 80% ASD-STE100 (Simplified Technical English)  
**Scope:** PUP Graduate Computer Engineering (CpE) Program  
Phase: Phase 1 — AI-Native PRD, Hybrid Scenario Flow, and Technology Architecture

# **1\. Locked Domain Glossary**

| Term | Definition |
| :---- | :---- |
| **Student** | The PUP CpE graduate student who owns one Thesis Instance and submits deliverables. |
| **Thesis Adviser** | The faculty member who mentors the Student and executes Gate 1 endorsement. |
| **Panel Member** | The faculty member who reviews endorsed manuscripts and evaluates the defense at Gate 2\. |
| **Program Coordinator** | The administrator who configures Milestone Templates, rubrics, and user accounts. |
| **AI Agent** | The embedded software subsystem that validates files, tracks pacing, and synthesizes revisions. |
| **Milestone Template** | The metadata configuration that defines stages, required files, and approval gates. |
| **Milestone Instance** | The active transactional record of a Milestone Template assigned to one Student. |
| **Submission PR** | The versioned container for Student deliverables and ordinal Critique Threads. |
| **Submission Commit** | An immutable, ordinal file upload (`v1`, `v2`, `v3`) inside a Submission PR. |
| **Critique Thread** | An ordinal, version-bound feedback item created by a Thesis Adviser or Panel Member. |

# **2\. End-to-End Hybrid Operational Scenario Flow (ASD-STE100)**

## **Stage 0: Program Configuration & Initialization (Digital)**

1. The Program Coordinator creates the Milestone Template in the system.  
2. The Milestone Template defines required document types, evaluation rubrics, and target deadlines.  
3. The Program Coordinator registers the Student account.  
4. The system creates one Thesis Instance for the Student (`1:1 Cardinality`).  
5. The Program Coordinator assigns one Thesis Adviser and multiple Panel Members to the Thesis Instance.  
6. The system enforces strict role separation (`Disjoint RBAC`). A Thesis Adviser cannot act as a Panel Member.

## **Stage 1: Deliverable Drafting & AI Pre-Flight Triage (Digital)**

1. The Student opens a Submission PR for the active Milestone Instance.  
2. The Student uploads `Submission Commit v1` (Manuscript PDF and required forms).  
3. The AI Agent scans `Submission Commit v1` against the Milestone Template criteria.  
4. The AI Agent generates a Pre-Flight Readiness Report.  
5. If `Submission Commit v1` lacks required sections, the AI Agent alerts the Student immediately.  
6. The Student can upload a corrected file before the system notifies the Thesis Adviser.

## **Stage 2: Gate 1 Mentorship & Adviser Endorsement (Digital \+ Consultation)**

1. The Thesis Adviser publishes available consultation time slots in the system.  
2. The Student selects an open slot and books a consultation session.  
3. The Thesis Adviser inspects `Submission Commit v1` in the in-app PDF viewer.  
4. The Thesis Adviser records feedback as ordinal Critique Threads (`State: OPEN`).  
5. The Student revises the manuscript and uploads `Submission Commit v2` to the same Submission PR.  
6. The AI Agent compares `v1` and `v2` against all open Critique Threads.  
7. The AI Agent generates a Revision Verification Brief for the Thesis Adviser.  
8. The Thesis Adviser verifies the changes and marks each Critique Thread as `RESOLVED`.  
9. When zero open threads remain, the Thesis Adviser executes **Gate 1 Endorsement**.

## **Stage 3: Defense Scheduling & Logistics (Hybrid — PARKED FOR CONSULTATION)**

1. Gate 1 Endorsement unlocks the defense scheduling module for the Student.  
2. The Thesis Adviser and Panel Members enter their available defense time slots.  
3. The Student selects a common free slot and submits a Defense Schedule Request.  
4. **\[PARKED — GAP-02\]:** The designated scheduling authority confirms the final defense date and room.  
5. **\[CONSULTATION NEEDED\]:** Confirm whether the Program Coordinator, Thesis Adviser, or Graduate School staff approves the final schedule.  
6. **\[CONSULTATION NEEDED\]:** Confirm whether the Student must submit physical payment receipts before schedule confirmation.

## **Stage 4: Pre-Defense Manuscript Distribution (Digital)**

1. After Gate 1 Endorsement, the system grants Panel Members read-only access to the endorsed manuscript (`Commit v2`).  
2. The system hides digital grading rubrics and evaluation forms prior to the defense date.  
3. The system sends automated email notifications with calendar invites to the Student, Thesis Adviser, and Panel Members.

## **Stage 5: Live Defense & Physical Evaluation (Physical \+ Digital — PARKED FOR CONSULTATION)**

1. **Physical Action:** The Student presents the thesis defense in person or via hybrid conference.  
2. **Digital Action:** Panel Members read the digital manuscript (`Commit v2`) in the system during the defense.  
3. **Digital Action:** Panel Members log required manuscript revisions as digital Critique Threads (`State: OPEN`).  
4. **Physical Action \[PARKED — GAP-03\]:** Panel Members write grades, verdicts, and signatures on physical paper evaluation sheets.  
5. **\[CONSULTATION NEEDED\]:** Identify who distributes and collects the physical evaluation sheets on the defense date.  
6. **\[CONSULTATION NEEDED\]:** Identify which actor encodes the physical evaluation verdict and uploads the scanned physical sheet into the system.

## **Stage 6: Post-Defense Ordinal Revisions & Gate 2 Sign-Off (Digital)**

1. The system records the official defense verdict (`Pass`, `Conditional Pass`, or `Re-Defense`) from the physical evaluation.  
2. The Student reviews all open Critique Threads created by the Panel Members.  
3. The Student revises the manuscript and uploads `Submission Commit v3` to the Submission PR.  
4. The AI Agent compares `Commit v2` and `Commit v3` against the open Critique Threads.  
5. The AI Agent generates an updated Revision Verification Brief for the Panel Members.  
6. Each Panel Member inspects `Commit v3` in ordinal order:  
   * If the revision satisfies the critique, the Panel Member sets the Critique Thread state to `RESOLVED`.  
   * If the revision is incomplete, the Panel Member appends a follow-up comment in the thread.  
7. The Student uploads subsequent ordinal commits (`v4..vN`) until all Critique Threads reach `RESOLVED`.  
8. **\[UNCLEAR — GAP-04\]:** Once all threads resolve, the authorized evaluator executes **Gate 2 Approval** to complete the Milestone Instance.

# **3\. Stakeholder Consultation Gap Matrix**

| Gap ID | Workflow Stage | Current Status | Question for PUP CpE Consultation |
| :---- | :---- | :---- | :---- |
| **GAP-01** | Stage 0: Committee Setup | **Unclear** | Does the Panel Chair hold higher system approval authority than regular Panel Members? |
| **GAP-02** | Stage 3: Defense Scheduling | **Parked (ADR-005)** | Who confirms the final defense date and assigns the physical room or meeting link? |
| **GAP-03** | Stage 5: Physical Evaluation | **Parked (ADR-006)** | Who encodes the physical evaluation sheet scores and uploads the scanned copy into the system? |
| **GAP-04** | Stage 6: Gate 2 Sign-Off | **Missing** | Must all Panel Members click approve for Gate 2, or does the Panel Chair / Thesis Adviser sign off alone? |
| **GAP-05** | Stage 6: Final Archiving | **Missing** | What physical clearance forms or hardbound submission receipts are required to close the thesis program? |

# **4\. Feature-to-Technology Stack Mapping Report**

## **4.1 Frontend & User Interface Layer**

| System Feature | Selected Technology | Engineering Purpose (ISO/IEC 25010\) |
| :---- | :---- | :---- |
| **Role-Based Web Portals** (`FR-STU-05`, `FR-ADV-01`, `FR-ADM-04`) | **Next.js (App Router), React, TypeScript** | Enforces strict type safety and server-side access checks per role. |
| **UI Components & Progress Visuals** (`FR-STU-05`, `FR-SYS-04`) | **Tailwind CSS, Lucide Icons, Tremor / Recharts** | Renders expandable advisee status tables and program analytics charts. |
| **In-App Manuscript Reader** (`FR-STU-02`, `FR-PAN-02`) | **React-PDF (`pdfjs-dist`)** | Displays PDF commits side-by-side with ordinal Critique Threads. |
| **Dynamic Template Forms** (`FR-ADM-02`) | **React Hook Form \+ Zod** | Validates dynamic Milestone Template schemas created by the Program Coordinator. |

## **4.2 Transactional Backend, Security & Storage Layer**

| System Feature | Selected Technology | Engineering Purpose (ISO/IEC 25010\) |
| :---- | :---- | :---- |
| **3NF Relational Database** (`FR-STU-01`, `FR-ADM-02`) | **Supabase (PostgreSQL)** | Stores 3NF transactional records and `JSONB` metadata templates. |
| **Authentication & Disjoint RBAC** (`FR-SYS-01`, `ADR-001`) | **Supabase Auth \+ PostgreSQL Row-Level Security (RLS)** | Enforces database-level isolation so Panel Members cannot read unendorsed drafts. |
| **Immutable Document Storage** (`FR-STU-02`, `FR-SYS-02`) | **Supabase Storage (Immutable Buckets)** | Stores ordinal file commits (`v1..vN`) with SHA-256 integrity hashes. |

## **4.3 Event-Driven Workflow & Notification Layer**

| System Feature | Selected Technology | Engineering Purpose (ISO/IEC 25010\) |
| :---- | :---- | :---- |
| **State Machine & Temporal Triggers** (`ADR-002`, `FR-PAN-03`) | **Inngest** or **Trigger.dev** | Runs background jobs, deadline checks, and defense-day state transitions reliably. |
| **Availability & Slot Matching** (`FR-STU-04`, `FR-ADV-02`, `FR-PAN-01`) | **FullCalendar \+ `date-fns`** | Calculates overlapping free time slots across Thesis Adviser and Panel Member calendars. |
| **Automated Email Alerts** (`FR-SYS-03`) | **Resend \+ React Email** | Sends transactional emails for PR commits, Gate 1 endorsements, and schedule updates. |

## **4.4 Embedded AI Engineering Layer (Pillar 3\)**

| System Feature | Selected Technology | Engineering Purpose (ISO/IEC 25010\) |
| :---- | :---- | :---- |
| **Deterministic AI Outputs** (`FR-AIA-01..03`) | **Vercel AI SDK (`generateObject`) \+ Zod** | Constrains LLM responses to strict JSON schemas for Pre-Flight and Revision reports. |
| **Manuscript Text & Layout Extraction** (`FR-AIA-01`, `FR-AIA-03`) | **LlamaParse / Unstructured** or **Multimodal PDF Vision** | Extracts headings, sections, and text from PDF commits for accurate version comparison. |
| **Template & Rubric Retrieval (RAG)** (`FR-AIA-01`) | **Supabase `pgvector`** | Stores vector embeddings of PUP thesis formatting rules and Milestone Template criteria. |
| **AI Fault Isolation & Logging** (Reliability) | **Asynchronous Worker Queue \+ Langfuse** | Isolates AI failures from core database commits and logs token usage and latency. |

