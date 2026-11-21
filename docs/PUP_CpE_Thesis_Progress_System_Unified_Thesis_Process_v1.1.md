# PUP CpE Thesis Progress System: Unified Thesis Process, Screens and Sitemap

**Version 1.1 · 22 November 2026 · Master's and Doctoral programs**

**Change in v1.1:** Terms. "Evaluator" is now "Panel Member". "Lead Evaluator" is now "Lead Panel Member". "Final Panel Chair" is now "Panel Chair". v1.0 stays unchanged as history.

**Sync in v1.1 (22 Nov 2026):** This version also adds the owner decisions of 17 and 18 Nov 2026. They were already in the Functional Requirements v1.1 and the Operational Flow v3.1. The changes: 30 routes (C10 audit, shared submission view), three comment contexts, Defense Day threads at the Final Defense (BR-20, FR-REV-12), revision items at Proposal and Pre-Final only (FR-REV-13), Gate 2 needs the member's own threads resolved (FR-WFL-07), Panel Members can Return (FR-WFL-05), consultation mode and meeting link (FR-SCH-01 to 04), notifications (FR-NTF), key dates and pacing flags (FR-TRK-05, 06). The owner made no new decision in this sync. One owner decision (22 Nov 2026) is added: RETURNED goes back to DRAFT. The Student sees the written reason.

**Status:** All earlier recommendations are accepted. Items for the Graduate School keep a default answer (see Part 5).

**Source order:** (1) the 13 official TDW forms, (2) the official Guidelines on the Implementation of the Modified Thesis/Dissertation Writing Courses, (3) the Graduate School forms page, (4) the project decisions. The Institutional Alignment Report and the prototype are secondary.

**Style:** Simplified Technical English at about 80%.

## How to read this document

| Part | Content | Use it to |
| --- | --- | --- |
| 1. Proposal | Purpose, principles, journey, tone | Understand the intent before the details |
| 2. Process flow | Roles, statuses, the defense cycle, each milestone, clearance | Know what happens, who acts and what blocks |
| 3. Screens | Every screen: layout, components, actions, rules | Design or build the interface |
| 4. Sitemap | All 30 routes | See how the screens connect |
| 5. Decision register | Locked rules, accepted items, Graduate School questions | Track what is final and what is open |
| Appendices | Forms matrix, Guidelines mapping, change list, sources | Check the details |

# Part 1: Proposal

## 1.1 Purpose

This proposal describes how the PUP CpE Thesis Progress System will support one Student from the first manuscript draft to final clearance. It sets the intent first. Parts 2 to 4 then describe the process flow, the screens and the sitemap that follow from it.

The system is a **coordination layer**. It shows each person where the thesis stands, what blocks it and what happens next. The signed paper stays the official record.

## 1.2 What the system is and is not

| The system is | The system is not |
| --- | --- |
| A tracker of milestone status for each Student | The legal record. The wet-signed paper is the record. |
| A versioned manuscript repository, like a shared drive | An e-signature tool |
| A place for faculty to comment on one specific version | A grading system. The Adviser encodes the subject grade elsewhere. |
| A checklist of the official TDW forms and attachments | An ethics review system |
| A scheduler for consultations and defense dates | An IPMO, RPO or copyright system. It shows their status only. |
| An audit trail of who approved what, and when | An enrollment or registrar system |

## 1.3 Goals

| No. | Goal | How the system meets it |
| --- | --- | --- |
| 1 | Every person knows the next step | A next-action card and a readiness checklist on every dashboard |
| 2 | Faculty feedback stays tied to one manuscript version | Critique threads are bound to a commit |
| 3 | Paper stays the record, but nobody chases it | Two-layer approval, scan uploads and a paper-to-file match check |
| 4 | The official sequence is enforced | Gates, a status ladder and blocked actions that explain why |
| 5 | One accountable owner closes each stage | Only the Coordinator closes a stage |
| 6 | One system serves Master's and Doctoral | Degree level sets the committee size, panel size and copy count |

## 1.4 Guiding principles

| No. | Principle |
| --- | --- |
| 1 | **Official sources first.** The forms and the Guidelines decide the sequence. |
| 2 | **Two layers of approval.** An in-system action is process intent. The wet-signed paper is the record. |
| 3 | **A scan is provisional.** It becomes verified only when the Coordinator checks the paper. |
| 4 | **The paper must match the file.** The check happens when the printed manuscript arrives. For signed forms it happens on the defense day. |
| 5 | **Only the Coordinator closes a stage.** Other actions are conditions. |
| 6 | **A reviewer resolves the reviewer's own critique threads.** The Student cannot. |
| 7 | **A return needs a written reason.** Valid reasons are compliance or eligibility only. |
| 8 | **Outside offices show status only.** This covers ethics, IPMO, RPO and copyright. |
| 9 | **The subject grade is out of scope.** |
| 10 | **The Coordinator creates the Student account after eligibility.** The Student uploads no Stage 0 documents. |
| 11 | **The Coordinator is one role:** Program Chair and Graduate School Secretary. |
| 12 | **Defense dates need 7 days of notice.** The system enforces the minimum. |
| 13 | **No minimum number of consultations** is enforced. |
| 14 | **Committee members must encode their evaluation** on the Defense Day page on the defense day. |

## 1.5 The thesis journey at a glance

| Milestone | Official phase | Key forms | Ends when |
| --- | --- | --- | --- |
| 1. Proposal Defense | Thesis or Dissertation Writing 1 (RSH 641 or RSH 741) | TDW 03, 05, 06, 07, 08 | Status `CERTIFIED` and the Adviser approves data gathering |
| 2. Pre-Final Defense | Writing 2, first defense | TDW 03, 09, 10 | Status `CLOSED` |
| 3. Final Defense and Clearance | Writing 2, second defense and clearance | TDW 03, 11, 12, 13 | Status `CLEARED` |

The journey starts when the Coordinator creates the Student account. The concept paper, Adviser appointment, units and comprehensive exam happen before that, outside the system.

## 1.6 What each person should experience

| Person | Experience in one sentence | First thing they see |
| --- | --- | --- |
| Student | I always know my one next step and what blocks it. | Next-action card and readiness checklist |
| Adviser | I review, endorse and sign off without chasing paper. | Action queue: endorsements, log entries, uploads |
| Panel Member | I read the right version, comment on it, and encode my evaluation on the defense day. | Assignments with access status |
| Coordinator | I see every blocked item and clear it in one place. | Action queue grouped by what to verify, confirm or return |

## 1.7 Visual and interaction guidance

These rules keep the design tokens of the existing SITEMAP (Section 5).

- Calm daylight interface. Canvas Alabaster `#F8FAFC`. White surfaces. Hairline borders `1px #E2E8F0`.
- PUP Maroon `#800000` for primary actions. Emerald for approved or resolved. Amber for pending or outdated. Crimson for blocked or returned.
- Inter for text. A monospace font for commit tags, dates and form numbers.
- Stroke-based icons only. No gradients, no heavy shadows, no decorative charts. Use tables, pills and steppers.
- Every screen answers three questions: where am I, what blocks me, what can I do now.
- A disabled action always shows its reason. Example: Locked until Gate 1b.
- Status pills and document chips look the same on every screen.

## 1.8 Scope

| In the system | Outside the system |
| --- | --- |
| Milestones 1 to 3 and clearance | Stage 0: concept paper, Adviser appointment, comprehensive exam, enrollment |
| Manuscript versions and critique threads | Ethics board review (status only) |
| Consultation log and scheduling | IPMO check, RPO editing, copyright registration (status only) |
| Forms checklist, scans and the paper match | Statistician (IDSA), translation, questionnaire editing |
| Defense Day evaluation entry and verdicts | Subject grade, e-signatures |

# Part 2: Process Flow

## 2.1 Roles

| Role | Who | Main actions |
| --- | --- | --- |
| Student | Candidate | Writes, books consultations, marks Ready, picks the defense date, uploads signed scans and the OR, hands in printed copies, uploads clearance evidence |
| Adviser | Faculty | Reviews, posts threads, endorses (Gate 1a and 1b), confirms and signs the consultation log, completes the evaluation sheet at Proposal and Pre-Final, supervises revisions, approves the start of data gathering, approves the final manuscript (Gate 2) |
| Panel Member (Evaluation Committee) | Faculty: 2 for Master's, 3 for Doctoral | Reviews, endorses (Gate 1b), completes the evaluation sheet at Proposal and Pre-Final, approves the final manuscript (Gate 2) |
| Lead Panel Member (designation) | One Evaluation Committee Panel Member named by the Coordinator | Records the collective verdict at Proposal and Pre-Final |
| Panel Chair (designation) | Faculty named on TDW 11 | Completes a TDW 13 sheet. Records the collective verdict at Final. |
| Panel Member (Final Panel) | Faculty named on TDW 11: 3 for Master's, 4 for Doctoral, besides the Chair | Reads, completes a TDW 13 sheet, approves the final manuscript (Gate 2) |
| Coordinator | Program Chair and Graduate School Secretary | Creates accounts, records committees and panels, checks compliance, confirms date and room, receives printed copies and forms, uploads evaluation sheets, issues the Minutes, sets outside statuses, closes stages |
| Dean | Not a system user | Assigns committees and panels. Signs forms. The Coordinator records the signatures. |

The Adviser is a committee member and never a Panel Member. Evaluation Committee Panel Members are usually also Final Panel members. Lead Panel Member and Panel Chair are designations, not roles.

| Group | Master's | Doctoral |
| --- | --- | --- |
| Evaluation Committee (Proposal, Pre-Final) | Adviser plus 2 Panel Members | Adviser plus 3 Panel Members |
| Evaluation sheets at Proposal and Pre-Final | 3 | 4 |
| Final Defense Panel | Chair plus 3 Members | Chair plus 4 Members |
| Evaluation sheets at Final (TDW 13) | 4 | 5 |
| Printed proposal copies | 5 | 6 |

## 2.2 Authority matrix

| Action | Who acts | Layer |
| --- | --- | --- |
| Create the Student account | Coordinator | Record |
| Mark a commit Ready | Student | Intent |
| Resolve a critique thread | The reviewer who wrote it | Intent |
| Gate 1a: endorse for committee review | Adviser | Intent |
| Gate 1b: endorse for the defense | Adviser and every Panel Member | Intent, then paper |
| Return a file | Adviser, Panel Member or Coordinator, with a written reason (FR-WFL-05) | Intent |
| Confirm date and room | Coordinator | Record |
| Record the collective verdict | Lead Panel Member (Proposal, Pre-Final) or Panel Chair (Final) | Intent |
| Verify evaluation sheets and papers | Coordinator | Record |
| Gate 2: approve the final manuscript | Committee and Final Panel | Intent, then paper |
| Close a stage | Coordinator | Record |

## 2.3 Statuses

### Milestone status

| Status | Set by | Meaning |
| --- | --- | --- |
| `DRAFT` | System | The Student is writing. New commits are allowed. |
| `READY` | Student | One commit is marked for review. A new commit clears the mark. |
| `ADVISER_ENDORSED` | Adviser | Gate 1a is done. |
| `COMMITTEE_APPOINTED` | Coordinator | The committee (Milestone 1) or Final Panel (Milestone 3) form and NDAs are recorded. One status for both (FR-WFL-02). Milestone 2 has no new appointment. |
| `COMMITTEE_ENDORSED` | Adviser and Panel Members | Gate 1b is done. The manuscript is **locked**. |
| `DATE_PROPOSED` | Student | The Student picked a date. The endorsement form is being signed. |
| `DEFENSE_SCHEDULED` | Coordinator | Date and room are confirmed. |
| `DEFENSE_HELD` | Lead Panel Member or Panel Chair | The collective verdict is recorded. |
| `CLOSED` | Coordinator | Evaluation sheets are verified. The Minutes are issued. The manuscript unlocks for revisions. |
| `CERTIFIED` | Coordinator | Milestone 1 only. All committee members accepted the revisions. |
| `FINAL_APPROVED` | Coordinator | Milestone 3 only. Gate 2 is complete. |
| `CLEARED` | Coordinator | Milestone 3 only. Every clearance item is verified. |
| `RETURNED` | Adviser, Panel Member or Coordinator | A written reason is attached. The milestone then goes back to `DRAFT`. The Student sees the reason. |

### Outside statuses (set by the Coordinator)

| Field | Used in | Values |
| --- | --- | --- |
| Ethics | Milestone 1 | `NOT_SUBMITTED`, `UNDER_REVIEW`, `CHANGES_REQUIRED`, `APPROVED` |
| IPMO similarity check | Milestones 2 and 3 | `NOT_SUBMITTED`, `UNDER_CHECK`, `FAILED`, `PASSED` |
| RPO editing | Milestone 3 | `NOT_SUBMITTED`, `UNDER_EDITING`, `DONE` |
| Copyright | Milestone 3 | `NOT_APPLIED`, `APPLIED`, `REGISTERED` |

### Document lifecycle

| State | Meaning |
| --- | --- |
| Not started | The item has no file yet. |
| Prepared | The system produced the form with the data it knows (for example, the date). |
| Scan uploaded | A provisional copy. The uploader can still replace it. |
| Locked as submitted | The file can no longer change silently. |
| Physical received | The Coordinator received the paper. |
| Verified | The Coordinator confirmed that the paper matches the locked file. |
| Mismatch | The paper differs. The author must correct it. The defense is not stopped. |
| Returned | A reviewer sent it back with a written reason. |

## 2.4 The common defense cycle

All three defenses follow the same 14-step cycle. Section 2.5 lists what changes in each milestone.

| No. | Step | Actor | Rule |
| --- | --- | --- | --- |
| 1 | Write and consult | Student, Adviser | The Student uploads commits. The Student can list an agenda and link threads before a slot. An Online slot shows a meeting link. The system drafts a log entry when the Adviser confirms a booked slot. The Student adds the topic. The Adviser confirms it. No minimum count. |
| 2 | Review and reply | Adviser, Student | This is comment context A (Section 2.12). Critique threads are bound to a commit. A new commit marks older open threads as Outdated. Each reviewer resolves their own threads. |
| 3 | Mark Ready | Student | The Student marks one commit. A new commit clears the mark. |
| 4 | **Gate 1a** | Adviser | Endorse for committee review, or Return with a reason. The Adviser's own threads must be resolved. |
| 5 | Appoint the committee or panel | Coordinator, Dean | Record the appointment form and the NDAs. Upload the scans. A member reads the manuscript only after the form and that member's NDA are recorded. A member who declines gets a replacement. |
| 6 | Committee review | Panel Members, Student | Panel Members read, post threads and reply. The Student answers and uploads commits. |
| 7 | **Gate 1b** | Adviser, each Panel Member | Each member's own threads must be resolved. All members must endorse. The manuscript locks. |
| 8 | Choose a date | Student | The calendar shows dates when all required members are free. It blocks dates less than 7 days after Gate 1b. |
| 9 | Prepare the endorsement form | Student | The system fills the form with the date. The Student collects signatures: committee, Program Chair (noted) and Dean (approved). The Student scans it and uploads it with the OR. The scan is provisional. |
| 10 | Check and confirm | Coordinator | Run the compliance check. Confirm date and room, or Return with a written reason. |
| 11 | Hand in printed copies | Student, Coordinator | Due at least 7 days before the defense. The Coordinator matches them against the locked manuscript and passes them on. |
| 12 | **Defense Day** | Each member | The page opens at the scheduled start. Each member encodes their own evaluation and signs the paper sheet. At the Final Defense, Panel Members can also post threads from the start (Section 2.12, context C). |
| 13 | Record the verdict | Lead Panel Member or Panel Chair | Allowed on or after the defense date. The verdict is collective. The system warns if a member's Action Taken differs. |
| 14 | Verify and close | Coordinator | Upload every sheet scan. Check each against its encoded entry. Check printed documents against locked files. Issue the Minutes. Close the defense. The manuscript unlocks. |

## 2.5 What changes in each milestone

| Item | Milestone 1: Proposal | Milestone 2: Pre-Final | Milestone 3: Final |
| --- | --- | --- | --- |
| Entry | The Coordinator creates the account after eligibility | Milestone 1 is `CERTIFIED` and the Adviser approved data gathering | Milestone 2 is `CLOSED` |
| Manuscript | Chapters 1 to 3 | Chapters 1 to 5 | Revised full manuscript |
| Consultation log | TDW 03 (Proposal phase). The Adviser uploads it. | TDW 03 (Pre-Final phase) | TDW 03 (Final phase) |
| Extra condition for Gate 1a | None | IPMO status `PASSED` | None |
| Appointment | Evaluation Committee: TDW 06. NDA (TDW 05). | No new appointment. The NDA carries over. | Final Defense Panel: TDW 11. New NDA. |
| Outside status before date confirmation | Ethics `APPROVED` | None | None |
| Extra at Gate 1b | None | None | Each member marks the Pre-Final revisions as accepted |
| Endorsement form | TDW 07. The ethics certification goes with the paper. | TDW 09. Attach the printed manuscript, the Minutes of the Proposal Defense and the IPMO result. | TDW 12. Attach the final manuscript and the Minutes of the Pre-Final Defense. |
| Compliance check | TDW 03, TDW 06 and NDAs, TDW 07 scan, ethics `APPROVED`, OR verified | TDW 03, TDW 09 scan, IPMO `PASSED`, OR verified | TDW 03, TDW 11 and NDAs, TDW 12 scan, OR verified |
| Evaluation form | TDW 08. One sheet per committee member, Adviser included. | TDW 10. One sheet per committee member, Adviser included. No scores. | TDW 13. One sheet per Final Panel member. The Adviser completes none. |
| Verdict recorded by | Lead Panel Member | Lead Panel Member | Panel Chair |
| Minutes | Minutes of the Proposal Defense | Minutes of the Pre-Final Defense | Minutes of the Final Defense |
| After the defense | Revise. The Coordinator lists revision items from the Minutes (FR-REV-13). Each committee member accepts the items and signs the Certification of Proposal Approval. The Coordinator records it (`CERTIFIED`). The Adviser approves data gathering. | Revise. The Coordinator lists revision items from the Minutes. The Adviser and committee check them in Milestone 3. No Certification. | Revise using the Defense Day threads (Section 2.12). No revision items. Then the clearance in Section 2.9. |
| Printed copies | 5 (Master's) or 6 (Doctoral) | Count to confirm | Count to confirm |
| Ends when | `CERTIFIED` and the Adviser approves data gathering | `CLOSED` | `CLEARED` |

## 2.6 Evaluation fields on the Defense Day page

### TDW 08 and TDW 13 (rubric)

| Indicator | Weight |
| --- | --- |
| A1 Contribution to the field | 10% |
| A2 Substance and content | 20% |
| A3 Methodology | 20% |
| A4 Form and writing style | 10% |
| B1 Organization | 10% |
| B2 Delivery and oral articulation | 10% |
| B3 Mastery of the topic | 20% |
| **Total** | **100%** |

Each sheet also has a comments and suggestions box, and Action Taken (Approved, Approved with Revisions, Disapproved). The system adds up the total. It does not show or compute the grade equivalent.

### TDW 10 (no scores)

| Field | Note |
| --- | --- |
| Comments: Title and Preliminaries | One box |
| Comments: Chapters 1 to 5 | One box for each chapter |
| Comments: Partial References and Appendices | One box |
| Remarks and other specific concerns | One box |
| General observations for approval or disapproval | One box |
| Action Taken | Approved, Approved with Revisions, Disapproved |

## 2.7 Outcomes and new attempts

| Collective verdict | Defense status | Next |
| --- | --- | --- |
| Approved | `CLOSED` | Proposal: the Certification is signed. Pre-Final: Milestone 3 opens. Final: clearance starts. |
| Approved with Revisions | `CLOSED` | The manuscript unlocks. The Student revises. The revisions are checked as shown in Section 2.5. At the Final Defense, the threads track them. |
| Disapproved | Stays open | The Student revises. The cycle restarts at step 2. A new attempt starts. The system keeps every attempt in the history. |

The number of allowed attempts and any re-defense fee are not known (see Part 5).

## 2.8 Substitute panelist

A substitute may attend a defense. The rule:

1. The Coordinator records the substitute before the defense.
2. The substitute signs the NDA and gets read access to the locked manuscript.
3. The substitute completes the absent member's evaluation sheet on the Defense Day page.
4. The Graduate School decides if TDW 06 or TDW 11 needs a paper amendment (see Part 5).

## 2.9 Clearance after the Final Defense

These steps follow the Final Defense. They come from the Guidelines (C.18 to C.27) and the Graduate School forms page.

| No. | Step | Actor | Rule |
| --- | --- | --- | --- |
| 1 | Revise using the Defense Day threads and the Minutes of the Final Defense | Student, Adviser, Panel Members | The manuscript unlocks. The Student replies and uploads new commits. Each Panel Member resolves their own threads. The Adviser supervises. Skipped if the verdict is Approved without revisions. |
| 2 | Run the similarity check, then send the manuscript to the IPMO with the Adviser's written endorsement (outside the system) | Student, Adviser | The Coordinator sets the IPMO status. `FAILED` means resubmit. |
| 3 | Endorse the manuscript to the RPO for editing (outside the system). Revise after the editing. | Coordinator, Student, Adviser | The Coordinator sets the RPO status. The Adviser supervises the revision. |
| 4 | **Gate 2** | Committee, Final Panel, Coordinator | Each member marks the final manuscript as approved. All sign the approval sheet on paper. The Dean signs. The Coordinator records it. Needs IPMO `PASSED`, RPO `DONE` and no open threads for that member (BR-20). Result: `FINAL_APPROVED`. |
| 5 | Apply for copyright registration (outside the system) | Student, Coordinator | The Coordinator sets the copyright status. |
| 6 | Give the final copy to the Coordinator | Student, Coordinator | The Coordinator records receipt and checks it against the approved manuscript. |
| 7 | Upload the conference presentation certification | Student | The Coordinator verifies it. |
| 8 | Upload the journal publication copy or acceptance | Student | The Coordinator verifies it. |
| 9 | Close the milestone | Coordinator | Every item is verified. The system shows the Certificate of Compliance checklist. Result: `CLEARED`. |

Steps 5 to 8 can happen in any order.

## 2.10 Gates summary

| Gate | Who | Needs | Result |
| --- | --- | --- | --- |
| Gate 1a | Adviser | Own threads resolved. In Milestone 2: IPMO `PASSED`. | The committee or panel can be appointed. |
| Gate 1b | Adviser and every Panel Member | Each member's own threads resolved. In Milestone 3: Pre-Final revisions accepted. | The manuscript locks. The Student can pick a date. |
| Date confirmation | Coordinator | The milestone compliance check | The defense is scheduled. |
| Verdict | Lead Panel Member or Panel Chair | The defense date has arrived | `DEFENSE_HELD` |
| Stage close | Coordinator | Every sheet verified. Minutes issued. | `CLOSED` |
| Certification (Milestone 1) | Each committee member | Revisions accepted | `CERTIFIED` |
| Gate 2 (Milestone 3) | Committee and Final Panel | IPMO `PASSED`, RPO `DONE`, the member's own threads resolved | `FINAL_APPROVED` |
| Clearance close | Coordinator | Every clearance item verified | `CLEARED` |

## 2.11 What the Student does

| Milestone | The Student must |
| --- | --- |
| 1. Proposal | Upload Chapters 1 to 3. Consult. Mark Ready. Pick a date. Upload TDW 07 and the OR. Hand in the printed copies. Attend. Revise. Wait for the Certification. |
| 2. Pre-Final | Gather data. Upload Chapters 1 to 5. Run the similarity check and send it to the IPMO. Mark Ready. Pick a date. Upload TDW 09 and the OR. Hand in the printed copies. Attend. Revise. |
| 3. Final and clearance | Revise. Mark Ready. Pick a date. Upload TDW 12 and the OR. Hand in the printed copies. Attend. Reply to the Defense Day threads and revise. Complete the IPMO check, RPO editing, copyright, final copy, conference and journal evidence. |

## 2.12 Comment contexts

| Context | Who | Window | Screens | Resolve |
| --- | --- | --- | --- | --- |
| **A. Iteration** | Adviser, Student | Before Gate 1a. Also after a Return. | S2, A2. Consultation notes in S4, A3. | The Adviser resolves their own threads. The Student replies. |
| **B. Committee review** (Milestones 1 and 2) | Panel Members, Student | After the appointment. Before Gate 1b. | P2, S2 | Each Panel Member resolves their own threads. |
| **C. Defense Day** (Milestone 3) | Panel Chair, Panel Members, Student | From the scheduled start of the Final Defense until Gate 2 (BR-20) | P4 tab "Manuscript and comments", P2, S2 | Each Panel Member resolves their own threads after checking a new commit. |

- Panel Members are appointed after Gate 1a. They cannot comment in context A.
- In context C, the Student sees the threads when the defense closes and the manuscript unlocks. Gate 2 is blocked while a member has open threads.
- Revision items (from the Minutes) track revisions at Proposal and Pre-Final only. At the Final, the threads are the tracker.
- In Milestones 1 and 2, a Panel Member can also comment on a form scan or a supporting file (FR-REV-11).

## 2.13 Notifications and email

- The system records an in-app notification for each event. Most events also send an email (24 use cases, FR-NTF-01 to FR-NTF-10).
- An email holds the event, the next action, the deadline and a link only. It holds no manuscript text, comments, scores, verdicts or meeting links.
- Thread and comment events group into one email per commit per day. Reminders group into one daily email.
- A user can turn off reminders and digests. A failed email never blocks a step.

# Part 3: Screens

This part describes each screen: its purpose, its layout regions, its components and the rules that govern its actions. It follows the visual guidance in Section 1.7. These are screen specifications. They are not final visual designs.

## 3.1 Shared layout and components

| Component | What it shows or does |
| --- | --- |
| App shell | A left sidebar (240 px) with the role's navigation. A top bar with the breadcrumb, milestone pill, status pill and user menu. |
| Milestone stepper | Three milestones and clearance. Each shows Completed, Active or Locked. |
| Next-action card | One sentence that names the next step and who must act. It has one primary button. |
| Readiness checklist | Each required item with a state chip and the reason if it blocks. |
| Status pill | The milestone status. The colors are the same everywhere. |
| Document chip | The document lifecycle state (Section 2.3). |
| Outside-status chip | Ethics, IPMO, RPO or copyright status. |
| Manuscript workspace | A split screen. Left: the manuscript viewer with a commit selector. Right: the critique thread feed. Bottom: the actions for the role. |
| Return dialog | A required text box for the reason. The receiver sees the reason. |
| Gate dialog | Names the gate, lists what it unlocks and asks for a confirmation. |
| Blocked-action note | Every disabled button shows why it is disabled. |
| Activity log | A time-stamped list of actions on the record. |

## 3.2 Student screens

### S1. Dashboard (`/student/dashboard`)

Purpose: show where the thesis stands and the next step.

| Region | Components | Actions and rules |
| --- | --- | --- |
| Identity card | Thesis title, degree level, Adviser, committee or panel names once appointed, residency indicator | The residency indicator shows a warning only. |
| Milestone stepper | Milestones 1 to 3 and clearance | A click opens the milestone detail. |
| Next-action card | The next step and who acts | One primary button, for example Mark Ready. |
| Readiness checklist | The items for the current milestone, each with a document chip | Each blocked item shows its reason. |
| Outside statuses | Ethics, IPMO, RPO and copyright chips | Read only. The Coordinator sets them. |
| Defense card | Date, room, printed copies due date, countdown | Appears after the Coordinator confirms the date. |
| Key dates panel | Earliest defense date, printed-copy due date, target dates, residency warning date | Information only (FR-TRK-05). |

### S2. Manuscript workspace (`/student/pr/[prId]`)

Purpose: write, upload versions and answer faculty comments.

| Region | Components | Actions and rules |
| --- | --- | --- |
| Header | Milestone name, status pill, commit selector (v1, v2, v3), Mark Ready button | Mark Ready is disabled when the manuscript is locked. |
| Left pane | Manuscript viewer with a toolbar (file name, page counter) | Switching commits shows that version. |
| Right pane | Filter (All, Open, Resolved). Thread cards. | A card shows the author, role badge, commit tag, Outdated badge, status and replies. |
| Thread card | Critique text, replies, reply box | The Student can reply. The Student cannot resolve. |
| Bottom bar | Upload new commit. Change note and Addressed tag. Comment-response export (PDF, CSV). | An upload adds the next commit, clears the Ready mark and marks older open threads as Outdated. The tag does not change the thread state (FR-REV-08, FR-REV-14). |
| Lock banner | Appears after Gate 1b | New commits are blocked until the defense is closed. |

### S3. Documents (`/student/documents`)

Purpose: show every deliverable and collect the uploads.

| Region | Components | Actions and rules |
| --- | --- | --- |
| Deliverables table | Item, form, signers, document chip, action | Rows follow the milestone in Section 2.5. |
| Upload actions | Download the prefilled form. Upload the signed scan. Upload the OR. | The prefilled endorsement form needs the date. A scan locks when uploaded. A replacement needs a Return from the Coordinator. |
| Read-only rows | Minutes, evaluation sheets, Certification | They appear after the Coordinator verifies them. |
| Form pack and forms guide | One download of the prefilled forms. A forms guide tab. | FR-DOC-05, FR-DOC-09. |
| History tab | Documents of earlier milestones | Read only. |

### S4. Schedule (`/student/schedule`)

Purpose: book consultations and choose the defense date.

| Region | Components | Actions and rules |
| --- | --- | --- |
| Consultation tab | Table of the Adviser's published slots. Request button. Agenda and linked threads. | A slot moves from Available to Pending to Confirmed. The meeting link of an Online slot shows after the slot is Confirmed (FR-SCH-03). |
| Defense date tab | A calendar of dates when all required members are free | The tab is locked until Gate 1b. Dates less than 7 days after Gate 1b are greyed out with the reason. |
| Date confirmation | Selected date and a Propose date button | After the proposal the status becomes `DATE_PROPOSED`. The screen lists the next steps. |

### S5. Defense results (`/student/defense/[defenseId]`)

Purpose: show the result after the Coordinator verifies the sheets.

| Region | Components | Actions and rules |
| --- | --- | --- |
| Verdict banner | The collective verdict | Shown after verification. |
| Member results | For each member: the rubric scores and total (Proposal, Final), or the chapter comments (Pre-Final). Comments and Action Taken. | The grade equivalent is not shown. |
| Minutes | The Minutes with the consolidated recommendations | Download. |
| Attempt history | One row for each attempt | Read only. |
| Next steps | What the Student does now | For example: revise, or wait for the Certification. |

### S6. Clearance (`/student/clearance`)

Purpose: track the clearance after the Final Defense.

| Region | Components | Actions and rules |
| --- | --- | --- |
| Status list | IPMO, RPO, Gate 2 and copyright chips | Read only. |
| Final copy | Receipt state | The Coordinator records receipt. |
| Evidence uploads | Conference certification. Journal copy or acceptance. | The Student uploads. The Coordinator verifies. |
| Exit checklist | The Certificate of Compliance checklist | Shown when all items are verified. |

## 3.3 Adviser screens

### A1. Dashboard (`/adviser/dashboard`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Action queue | Gate 1a, Gate 1b and Gate 2 waiting. Log entries to confirm. TDW 03 to upload. Data gathering to approve. | Each item opens the right screen. |
| Review queue | Commits and threads waiting, with the days waiting | FR-REV-09. |
| Advisee roster | Student, thesis title, milestone, status, latest commit, open threads, pacing flags | A row expands to show the milestone stepper and a Review button. Flags are information only (BR-17). |
| Data gathering | An Approve button after the Student is `CERTIFIED` | Records the Adviser's approval. The Coordinator then opens Milestone 2. |

### A2. Manuscript workspace (`/adviser/pr/[prId]`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Workspace | The shared split screen | The Adviser posts threads and resolves their own threads. |
| Bottom bar | Gate 1a, Gate 1b or Gate 2 button. Return button. | A gate button is enabled only when its conditions are met. The blocker shows beside it (for example, 2 of your threads are open, or IPMO not passed). |
| Revision check | A checkbox: Pre-Final revisions accepted | Milestone 3, Gate 1b only. |
| Return dialog | A required reason | Compliance or eligibility reasons only. |

### A3. Consultations (`/adviser/consultations`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Log table | For each Student: date and time, place or platform, topic (from the Student), recommendations | The Adviser confirms or edits each entry. |
| Form view | The compiled TDW 03 for the current phase | The Adviser prints it and signs each row on paper. |
| Upload | The signed scan | Needed before date confirmation. |

### A4. Availability (`/adviser/availability`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Publish slot | Date, time window, slot type (Consultation or Defense), mode (In person or Online), meeting link for Online | Adds the slot to the shared list. One-off or recurring (FR-SCH-01). |
| Requests | Incoming consultation requests | Confirm or Decline. |

### A5. Defense Day page (`/adviser/defense/[defenseId]`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Proposal and Pre-Final | The member entry form (Section 2.6) | Opens at the scheduled start. The Adviser encodes their own sheet and signs the paper. Editable until the Coordinator verifies. |
| Final | A read-only results view | The Adviser completes no TDW 13 sheet. |

## 3.4 Panel Member screens

### P1. Dashboard (`/panel/dashboard`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Assignments | Student, milestone, my designation (Panel Member, Lead Panel Member or Panel Chair), access status, action required | Access shows Locked until the appointment form and my NDA are recorded. |
| Defense schedule | Date, room, countdown | Opens the Defense Day page on the defense date. |

### P2. Manuscript workspace (`/panel/pr/[prId]`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Workspace | The shared split screen | Panel Members post threads and resolve their own threads. |
| Final Panel members | A read-only banner before the scheduled start of the Final Defense | They read only before the start. From the start until Gate 2, they post and resolve their own threads (BR-20, FR-REV-15). |
| Bottom bar | Gate 1b (committee members). Gate 2 (committee and Final Panel). Return. | Enabled only when the conditions are met. |

### P3. Availability (`/panel/availability`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Publish slot | Date and time range | Adds a defense slot to the shared list. |

### P4. Defense Day page (`/panel/defense/[defenseId]`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Header | Student, title, schedule, committee or panel names, substitute banner if any | Opens at the scheduled start. |
| My evaluation tab | The fields for the form: rubric scores with weights and an automatic total (TDW 08, 13), or chapter comments (TDW 10). Comments. Action Taken. | The member saves their entry and signs the paper. Editable until the Coordinator verifies. |
| Manuscript and comments tab | The P2 split screen. Final Defense only. | Panel Members post Defense Day threads (FR-REV-12). |
| Verdict tab | The collective verdict selector. Each member's Action Taken. | Only the Lead Panel Member (Proposal, Pre-Final) or Panel Chair (Final). The system warns if an Action Taken differs. Allowed on or after the defense date. |

## 3.5 Coordinator screens

### C1. Dashboard (`/coordinator/dashboard`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| KPI strip | Active Students. Waiting for appointment. Waiting for confirmation. Waiting for verification. | Each count opens its queue. |
| Action queue | Grouped: appoint, check and confirm, verify, return, close | Each item opens the right screen. |
| Student table | Name, degree level, milestone, status, blocker, residency warning, pacing flags | Sortable. Key dates panel. CSV exports (FR-RPT-03). |

### C2. Students (`/coordinator/students`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Create account | Name, degree level, program start term, comprehensive exam date, Writing 1 enrollment (RSH 641 or RSH 741), Adviser | Done only after eligibility. |
| Student list | All accounts with milestone and status | Open or edit. |

### C3. Committees (`/coordinator/committees`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Appointment board | Proposed members, with the required size for the degree level | Choose faculty. The Adviser cannot be a Panel Member. Show workload and availability. |
| Member status | Proposed, Accepted, Declined | A declined seat needs a replacement. |
| Paper | TDW 06 or TDW 11 scan. NDA scans. | Upload, then mark Appointed. |
| Substitute | Record a substitute for a defense | The substitute signs the NDA and gets read access. |

### C4. Documents (`/coordinator/documents`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Compliance checklist | The items for the milestone (Section 2.5) with chips | Set the ethics or IPMO status. Verify the OR. |
| Scan viewer | The uploaded scan | Mark Verified, or Return with a reason. |
| Forms guide tab | Purpose, signers, uploader and timing of each form | FR-DOC-09. |
| Return dialog | A required reason | Compliance or eligibility reasons only. |

### C5. Schedule (`/coordinator/schedule`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Date requests | Proposed dates with the checklist state | Confirm date and room (room or meeting link). Blocked until the checklist is complete. |
| Printed copies | Due date, received, match result | Mark received. Mark matched or mismatch. A late-copies warning shows after the due date. |

### C6. Defense (`/coordinator/defense/[defenseId]`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Entry tracker | For example: 2 of 3 sheets encoded | Shows who has not encoded. |
| Sheets | One row for each member: encoded entry, scan upload, match result | Upload each scan. Mark Match or Mismatch. |
| Verdict | The collective verdict and each member's Action Taken | Read only. |
| Minutes | A draft compiled from the encoded entries | Edit, then issue. |
| Close | Close defense | Needs every sheet verified and the Minutes issued. |
| Certification (Milestone 1) | Each member's acceptance. Scan upload. | Mark `CERTIFIED`. Then open Milestone 2 after the Adviser approves data gathering. |

### C7. Clearance (`/coordinator/clearance`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Statuses | IPMO, RPO and copyright selectors | The Coordinator sets them. |
| Gate 2 tracker | Each member's approval and the paper record | Record the paper and the Dean's signature. |
| Evidence | Final copy receipt. Conference certification. Journal copy or acceptance. | Verify each item. |
| Close | Close milestone | Needs every item verified. Result: `CLEARED`. |

### C8. Templates (`/coordinator/templates`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Milestone templates | Required items and forms for each milestone | Edit lists. |
| Parameters | Minimum notice (7 days), committee and panel sizes by degree level, printed copy counts, rubric weights, target dates, reviewer wait threshold | Edit values. A change makes a new template version (FR-TPL-04). |
| Email wording | The fixed email templates | Edit wording. Versions are kept (FR-NTF-10). |

### C9. Users (`/coordinator/users`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| User table | Name, role, status | Add, edit or deactivate. |
| Faculty roles | Adviser, Panel Member | The Adviser of a Student can never be that Student's Panel Member. |

### C10. Audit (`/coordinator/audit`)

| Region | Components | Actions and rules |
| --- | --- | --- |
| Filters | Student, actor, action, date | FR-RPT-02. |
| Result table | Audit records, including email events | Read only. Export as CSV. |

## 3.6 Shared submission view (SV)

Routes: `/student/submission/[id]`, `/adviser/submission/[id]`, `/panel/submission/[id]`, `/coordinator/submission/[id]`. One screen (FR-SUB-01 to 05).

| Region | Components | Actions and rules |
| --- | --- | --- |
| Submission | Locked manuscript viewer, gate record, document checklist with status, defense date and room or link, thread counts, document comments, Minutes after close | Opens at Gate 1b. Panel Members still need the appointment form and NDA. No gate or edit action. Links to the user's own workspace. |
| Dossier export | All commits, scans, Minutes and logs, with an index | Coordinator only (FR-DOC-10). |

## 3.7 Page-frame panels (no route)

| Panel | Purpose |
| --- | --- |
| Notification center | List of in-app events with read and unread state |
| Preferences | Turn off reminders and digests |
| Search and saved filters | Find Students, documents and threads the user can access |

## 3.8 Blocked-action messages

| Action | Blocked when | Message |
| --- | --- | --- |
| Upload a commit | The manuscript is locked | Locked until the defense is closed. |
| Mark Ready | The manuscript is locked | Locked until the defense is closed. |
| Gate 1a | The Adviser has open threads | You have open threads. Resolve them first. |
| Gate 1a (Milestone 2) | IPMO is not `PASSED` | The IPMO check has not passed. |
| Gate 1b | The member has open threads | You have open threads. Resolve them first. |
| Gate 1b (Milestone 3) | Revisions not accepted | Accept the Pre-Final revisions first. |
| Choose a date | Gate 1b is not done | Locked until Gate 1b. |
| Confirm date and room | The checklist is incomplete | An item is missing. The screen names it. |
| Defense Day page | The start time has not come | Opens at the scheduled start. |
| Record the verdict | The defense date has not come | Allowed on or after the defense date. |
| Gate 2 | IPMO or RPO not complete | A clearance item is incomplete. |
| Gate 2 | The member has open threads | You have open threads. Resolve them first. |
| Post a Defense Day thread | The Final Defense has not started | Opens at the scheduled start. |
| Post a Defense Day thread | Gate 2 is passed | The comment window is closed. |
| Close a stage | A sheet is not verified | A sheet is not verified. |

# Part 4: Sitemap

The system has 30 routes: 17 new, 9 changed and 4 unchanged compared with the existing SITEMAP. The four SV routes use one screen.

## 4.1 Route table

| Route | Role | View | Screen | Compared with the SITEMAP |
| --- | --- | --- | --- | --- |
| `/login` | Public | Sign in | None | Existing |
| `/student/dashboard` | Student | Thesis tracker | S1 | Changed |
| `/student/pr/[prId]` | Student | Manuscript workspace | S2 | Changed |
| `/student/documents` | Student | Deliverables and uploads | S3 | **New** |
| `/student/schedule` | Student | Consultations and defense calendar | S4 | Changed |
| `/student/defense/[defenseId]` | Student | Defense results | S5 | **New** |
| `/student/clearance` | Student | Post-defense clearance | S6 | **New** |
| `/adviser/dashboard` | Adviser | Advisee roster and action queue | A1 | Changed |
| `/adviser/pr/[prId]` | Adviser | Review and gates | A2 | Changed |
| `/adviser/consultations` | Adviser | Consultation log | A3 | **New** |
| `/adviser/availability` | Adviser | Slots and requests | A4 | Existing |
| `/adviser/defense/[defenseId]` | Adviser | Defense Day page | A5 | **New** |
| `/panel/dashboard` | Panel Member | Assignments | P1 | Changed |
| `/panel/pr/[prId]` | Panel Member | Manuscript reader and gates | P2 | Changed |
| `/panel/availability` | Panel Member | Defense availability | P3 | Existing |
| `/panel/defense/[defenseId]` | Panel Member | Defense Day page and verdict | P4 | **New** |
| `/coordinator/dashboard` | Coordinator | Overview and action queue | C1 | Changed |
| `/coordinator/students` | Coordinator | Accounts and eligibility data | C2 | **New** |
| `/coordinator/committees` | Coordinator | Committees, panels and NDAs | C3 | **New** |
| `/coordinator/documents` | Coordinator | Compliance and verification | C4 | **New** |
| `/coordinator/schedule` | Coordinator | Date confirmation and printed copies | C5 | **New** |
| `/coordinator/defense/[defenseId]` | Coordinator | Sheets, Minutes, close | C6 | **New** |
| `/coordinator/clearance` | Coordinator | Clearance and Gate 2 record | C7 | **New** |
| `/coordinator/templates` | Coordinator | Milestone templates and parameters | C8 | Existing |
| `/coordinator/users` | Coordinator | Users and roles | C9 | Changed |
| `/coordinator/audit` | Coordinator | Audit trail and CSV export | C10 | **New** |
| `/student/submission/[id]` | Student | Shared submission view | SV | **New** |
| `/adviser/submission/[id]` | Adviser | Shared submission view | SV | **New** |
| `/panel/submission/[id]` | Panel Member | Shared submission view | SV | **New** |
| `/coordinator/submission/[id]` | Coordinator | Shared submission view | SV | **New** |

## 4.2 Navigation by role

| Role | Sidebar items |
| --- | --- |
| Student | Thesis Tracker, Manuscript, Documents, Schedule, Defense Results, Clearance, Submission |
| Adviser | Advisees, Review Queue, Consultations, Availability, Defense Day, Submission |
| Panel Member | Assignments, Manuscript, Availability, Defense Day, Submission |
| Coordinator | Overview, Students, Committees, Documents, Schedule, Defense, Clearance, Templates, Users, Audit, Submission |

## 4.3 Access rules

- Each route is open only to its role. Any other access shows an Access Denied banner.
- An Adviser sees only their own advisees. A Panel Member sees only assigned Students.
- The manuscript is locked to a Panel Member until the appointment form and that member's NDA are recorded.
- A Defense Day page opens only at the scheduled start.
- Defense results show only after the Coordinator verifies the sheets.
- The clearance screens appear from Milestone 3.
- The shared submission view opens at Gate 1b.
- At the Final Defense, Panel Members comment from the scheduled start until Gate 2.
- The meeting link of an online consultation shows only to the Adviser and the booked Student.
- The notification center, the preferences panel and search are panels in the page frame. They have no route.
- Every disabled action shows its reason.

## 4.4 A Student's path through the screens

| Step | Screen |
| --- | --- |
| See the next step | S1 Dashboard |
| Write and upload commits | S2 Manuscript workspace |
| Book a consultation | S4 Schedule |
| Mark Ready | S2 Manuscript workspace |
| Choose a defense date | S4 Schedule |
| Upload the endorsement form and the OR | S3 Documents |
| Read the result | S5 Defense results |
| Reply to Final Defense threads and upload new commits | S2 Manuscript workspace |
| Complete the clearance | S6 Clearance |

# Part 5: Decision Register

## 5.1 Decisions made

The principles are in Section 1.4. The decisions below are final in this version.

| ID | Decision |
| --- | --- |
| Account | The Coordinator creates the account after eligibility. The Student uploads no Stage 0 documents. |
| Scope | Master's and Doctoral programs. The subject grade is out of scope. |
| Consultations | No minimum count is enforced. |
| Role | The Coordinator is the Program Chair and the Graduate School Secretary. |
| R1 | Gate 1a is the Adviser. Gate 1b is the Adviser and every Panel Member. |
| R2 | The Adviser has committee powers for the Student. The Adviser is never that Student's Panel Member. |
| R3 | A member's access opens when the appointment form and that member's NDA are recorded. |
| R4 | The manuscript locks at Gate 1b. An endorsement-form scan locks when uploaded. |
| R5 | The Student picks the date before the endorsement form is printed. The date is at least 7 days after Gate 1b. |
| R6 | Three outcomes, as on the forms. The Lead Panel Member records the verdict at Proposal and Pre-Final. The Panel Chair records it at Final. |
| R7 | The Adviser uploads TDW 03. It is needed before date confirmation. |
| R8 | The ethics certification goes with TDW 07. Ethics status must be `APPROVED` before date confirmation. |
| R9 | Each defense needs an OR from the registrar. The Student uploads it. The Coordinator verifies it. |
| R12 | The committee signs the Certification of Proposal Approval after the Proposal revisions. |
| R13 | Ethics, IPMO, RPO and copyright show status only. The Coordinator sets them. |
| R14 | Printed copies are due at least 7 days before the defense. The Coordinator matches them on arrival. |
| P12 | The Defense Day entry is required. |
| Calendar | The calendar shows only dates when all required members are free. |
| Results | The Student sees scores, comments, the verdict and the Minutes after the Coordinator verifies the sheets. |
| Sheets | The Adviser completes a TDW 08 and a TDW 10 sheet. The Adviser completes no TDW 13 sheet. |
| M2 | The IPMO check shows status only. IPMO `PASSED` is needed before Gate 1a. There is no Certification at Pre-Final. |
| M3 | Clearance is part of Milestone 3. The Final Panel reads only before the defense. Gate 2 is process intent, with the paper approval sheet as the record. IPMO, RPO and copyright show status only. |
| Data gathering | One Adviser mark records approval to start data gathering. It follows `CERTIFIED`. |
| Left out | IDSA statistician endorsement, questionnaire editing by the RPO, and translation. These stay outside the system. |
| Substitute | The Coordinator records the substitute. The substitute signs the NDA, gets read access and completes the absent member's sheet. |

## 5.2 Questions for the Graduate School

Each question has a default in this document. None blocks the work.

| No. | Question | Default |
| --- | --- | --- |
| G3 | When is the honorarium paid? (An OR from the registrar is assumed as proof.) | The OR is uploaded before date confirmation. |
| G5 | How many attempts are allowed after Disapproved? Is there a re-defense fee? | A new attempt is allowed. The history is kept. |
| G6, G17 | Who proposes the defense date? Does the Dean approve it? | The Student picks. The Coordinator confirms. The Dean signs the endorsement form. |
| G10 | What is the similarity threshold? Is a re-check needed if the manuscript changes? | The IPMO decides. The system tracks the status only. |
| G12 | Is the residency limit a block or only a warning? (The 5-year and 7-year values are unverified.) | Warning only. |
| G13 | What happens if the printed copies arrive late? | The Coordinator sees a warning. |
| G14 | Which ethics board applies to the CpE program (GSREB or CREB)? Who sets the status? | The Coordinator sets it. |
| G15 | Does the Certification of Proposal Approval have an official form? | It is not one of the 13 TDW forms. The paper form is whatever the Graduate School supplies. |
| G16 | How many printed copies are needed at Pre-Final and Final, and when are they due? | At least 7 days before. The count is not defined. |
| G18 | Does the Adviser complete a TDW 13 sheet? | No. |
| G19 | Do the conference and journal items block the clearance? In which order? | Both are required, in any order. |
| G20 | Who issues the Certificate of Compliance? What does its checklist hold? | The system shows the checklist as the exit view. |
| G21 | How many final copies are needed, and in which format? | Not defined. |
| G22 | Which office handles the copyright application? | The system tracks the status only. |
| G23 | Is GS Form 08 (Application for Graduation) part of this flow? | It is not in the flow. |
| PK2 | Does a substitute panelist need a paper amendment to TDW 06 or TDW 11? | The Coordinator records the substitute. The paper rule follows the Graduate School. |

# Appendices

## Appendix A: Forms matrix

| Form | Title | In the system | Signers (paper) | Uploaded by |
| --- | --- | --- | --- | --- |
| TDW 01 | Concept Paper Adviser Endorsement Form | No. Stage 0. | Not tracked | None |
| TDW 02 | Thesis/Dissertation Advising Contract | No. Stage 0. | Not tracked | None |
| TDW 03 | Consultation and Monitoring Form | Milestones 1, 2 and 3 (one form for each phase) | Adviser signs each row | Adviser |
| TDW 04 | Adviser Appointment and Acknowledgement Form | No. Stage 0. | Not tracked | None |
| TDW 05 | Confidentiality and Non-Disclosure Agreement | Milestone 1 (committee) and Milestone 3 (Final Panel) | Member and University representative | Coordinator |
| TDW 06 | Committee Appointment and Acceptance Form | Milestone 1 | Adviser and Panel Members accept. Program Chair recommends. Dean approves. | Coordinator |
| TDW 07 | Proposal Defense Endorsement Form | Milestone 1 | Adviser and Panel Members. Program Chair noted. Dean approved. | Student |
| TDW 08 | Proposal Evaluation Sheet | Milestone 1 | One sheet for each committee member | Coordinator |
| TDW 09 | Pre-Final Defense Endorsement Form | Milestone 2 | Adviser and Panel Members. Program Chair noted. Dean approved. | Student |
| TDW 10 | Pre-Final Defense Evaluation Sheet | Milestone 2 | One sheet for each committee member | Coordinator |
| TDW 11 | Panel on Oral Defense Appointment and Acceptance Form | Milestone 3 | Chair and Members accept. Program Chair recommends. Dean approves. | Coordinator |
| TDW 12 | Final Defense Endorsement Form | Milestone 3 | Adviser and Panel Members. Program Chair noted. Dean approved. | Student |
| TDW 13 | Final Defense Evaluation Sheet | Milestone 3 | One sheet for each Final Panel member | Coordinator |

Clearance forms from the Graduate School forms page ("For Approved Candidates for Graduation"): Similarity Checking Services Endorsement, Thesis-Dissertation Editing Service Procedure, Procedures of Copyright Application and the copyright application forms, Journal Publication Format, PUPGS CD Labels, and the Requirement Checklist for Issuance of Certificate of Compliance.

## Appendix B: Guidelines steps and the system

| Guidelines step | In the system |
| --- | --- |
| B.1 to B.3 Enroll in Writing 1 and write the proposal | Eligibility data at account creation. Chapters 1 to 3 in the workspace. |
| B.4 Submit the proposal to the Program Chair. The Chair recommends Panel Members. | Ready mark, Gate 1a, committee proposal |
| B.5 to B.7 Dean assigns the committee. NDA. | Committee appointment (TDW 06, TDW 05) |
| B.8 Ethics review | Ethics status |
| B.9 Printed copies. The Program Chair endorses the proposal for defense. | Printed copies. Endorsement form (TDW 07). Compliance check. |
| B.10, B.11 Defense. Forms to the Secretary. | Defense Day page. Sheet upload by the Coordinator. |
| B.12, B.16 Certification of Proposal Approval | Certification (Milestone 1) |
| B.13 Minutes of the Proposal Defense | Minutes issued by the Coordinator |
| B.14 Statistician endorsement (IDSA) | Outside the system |
| B.15, B.17 Revision. Revised proposal with the Certification. | Revision commits. Certification recorded. |
| B.18, B.19 Questionnaire editing. Translation. | Outside the system |
| B.20 Permission to gather data. Adviser approval. | Adviser mark: data gathering approved |
| C.1, C.2 Similarity check and IPMO | IPMO status |
| C.3, C.4 Adviser endorses. Program Chair endorses to the Dean. | Gate 1a. Endorsement form note. |
| C.5 The Secretary receives copies and schedules the Pre-Final Defense. | Date confirmation. Printed copies. |
| C.6 to C.8 Pre-Final Defense. Forms. Minutes. | Defense Day page (TDW 10). Minutes. |
| C.9 Revision | Revision commits |
| C.10, C.11 Endorse for the Final Defense | Gate 1a (Milestone 3). Coordinator check. |
| C.12 to C.14 Final Panel. Schedule. NDA. | Final Panel appointment (TDW 11, TDW 05) |
| C.15 to C.17 Final Defense. Rating sheet. Minutes. | Defense Day page (TDW 13). Minutes. |
| C.18 Publishable article | Outside the system. The evidence is in C.26 and C.27. |
| C.19, C.20 Final similarity check | IPMO status |
| C.21, C.22 Full manuscript editing | RPO status |
| C.23 Final manuscript signed | Gate 2 |
| C.24 Copyright registration | Copyright status |
| C.25 Final copy | Final copy receipt |
| C.26, C.27 Conference. Journal. | Evidence uploads |

## Appendix C: Changes from the earlier artifacts

| Area | Earlier artifacts | This document |
| --- | --- | --- |
| Source of truth | The Institutional Alignment Report | The official forms and Guidelines |
| Gate 1 | The Adviser alone | Gate 1a by the Adviser. Gate 1b by the full committee. |
| Committee | Assigned at the start. Or its own stage. | Appointed after Gate 1a. Final Panel appointed in Milestone 3. |
| Panel size | Three panelists besides the Adviser (Report) | Adviser plus 2 or 3 Panel Members. Final Panel of Chair plus 3 or 4. |
| Panel access | Opens at Gate 1 | Opens after the appointment form and the NDA |
| Student step | None before Gate 1 | The Ready mark |
| Verdict | The Coordinator encodes it | Members encode their sheets. The Lead Panel Member or Panel Chair records the verdict. The Coordinator verifies against the paper. |
| Ethics | UREC, after the Proposal (Report) | Status only, before the defense |
| Revision sign-off | Gate 2 by the Panel (SITEMAP) | Certification (Proposal). Gate 1b and Gate 1a (Pre-Final to Final). Gate 2 (Final). |
| Printed copies | On the defense day | At least 7 days before |
| Secretary | Not modeled | One role with the Coordinator |
| Stage 0 | The Student uploads documents | The Coordinator enters eligibility data |
| Clearance | Report stage 4 | Guidelines C.18 to C.27 and the forms page |
| Documents | One status for each file | Scan, lock and verified-against-paper states |

## Appendix D: Sources

- The 13 official TDW forms (TDW 01 to TDW 13).
- Guidelines on the Implementation of the Modified Thesis/Dissertation Writing Courses (controlled copy).
- PUP Graduate School forms page (https://www.pup.edu.ph/gs/forms).
- The project decisions made during the design sessions.
- Secondary: the Institutional Alignment Report, the SITEMAP and the `code.html` prototype.
