# PUP CpE Thesis Progress System — Functional Requirements (v1)

**Compliance standard:** Simplified Technical English (ASD-STE100) at about 80%
**Scope:** PUP CpE Graduate Program — Master's and Doctoral
**Source of truth:** *Unified Thesis Process, Screens and Sitemap* v1.1 (22 Nov 2026)
**Companion files:** `PUP_CpE_Thesis_Progress_System_Operational_Flow_DFD_Sitemap_v3.1.md` (flow, DFD, sitemap)
**Status:** Draft for approval. Input for the PRD, the updated DFD and the first ERD.
**Change log:** 17 Nov 2026 — AS-01 closed (Defense Day threads, FR-REV-12). Revision tracker: Option A (FR-REV-13). BR-20 added. NF-04 pre-check paused (Section 1.4). Role model: one role per account (AS-04 closed). "Evaluator" renamed to "Panel Member". AS-02, AS-03, AS-05, AS-06, AS-08, AS-10 confirmed. 18 Nov 2026 — free-tier platform rules: NFR-06 rewritten, NFR-10 size set, NFR-12 and NFR-13 added, digest window set to one day, daily job time added, AS-11 to AS-13 added. Stack confirmed by the owner (see PRD Section 11). AS-11 and AS-12 stay open. 22 Nov 2026 (v1.1) — references only: companion file set to Operational Flow v3.1, source of truth set to Unified v1.1, FR-WFL-02 and FR-WFL-13 point to Operational Flow v3.1. Owner decision: RETURNED goes back to DRAFT with the reason shown (FR-WFL-02).
**Rule for this file:** It holds requirements only. It holds no code, no table design and no technology choice.

---

## 1. How to read this file

### 1.1 Conventions

| Item | Meaning |
| :---- | :---- |
| **ID** | `FR-<module>-<number>`. `BR-` is a business rule. `NFR-` is a quality requirement. `AS-` is an assumption to confirm. |
| **Pri** | **M** = Must (the process fails without it). **S** = Should (high value). **C** = Could (add if time allows). |
| **Origin** | `FR-xxx-nn` = earlier FR list. `UD` = Unified Doc. `NF-nn` = selected new feature. |
| **Screen** | `S1..S6`, `A1..A5`, `P1..P4`, `C1..C9` = Unified Doc screens. `SV` = shared submission view. `NC` = notification center. `C10` = audit viewer (proposed). |
| **Proc** | DFD process ID. `1.0` to `8.0` are from DFD v2. `9.0` and `10.0` are new (Section 6.1). |
| **Wording** | "must" = required. "can" = allowed. "must not" = forbidden. |

### 1.2 Modules

| Module | Name | FR count |
| :---- | :---- | :---- |
| ACC | Accounts and access | 8 |
| TPL | Templates and parameters | 5 |
| WFL | Workflow and gates | 14 |
| CMT | Committees and panels | 6 |
| REV | Manuscript and review | 14 (+1 deferred) |
| DOC | Documents and forms | 11 |
| SCH | Consultations and availability | 8 |
| DEF | Defense | 12 |
| CLR | Clearance | 4 |
| NTF | Notifications and email | 10 |
| TRK | Dashboards and tracking | 6 |
| RPT | Audit, reports and search | 4 |
| SUB | Shared submission view | 5 |
| | **Total** | **107 (+1 deferred)** |

### 1.3 Out of scope

| Item | Reason |
| :---- | :---- |
| AI Agent features (FR-AIA-01 to 03) | Deferred (ADR-007). NF-12 gives a rule-based substitute for the Pacing Agent. The pre-check (NF-04) is paused: see Section 1.4. |
| NF-02 (compare view), NF-05 (print-match cover sheet), NF-16 (Defense Day autosave and private notes) | Not selected |
| NF-23 and all "news" emails | Deferred. Other messaging apps do this. |
| Calendar file download | Removed from NF-11 |
| E-signature | Paper stays the record (BR-01) |
| Subject grade and grade equivalent | Out of scope (BR-15) |
| Work done by outside offices (ethics, IPMO, RPO, copyright, statistics, editing) | The system shows status only (BR-14) |
| GS Form 08 (Application for Graduation) | Not in the flow |
| Dean as a user | The Dean signs on paper. The Coordinator records it. |

### 1.4 Deferred features (paused)

| Feature | IDs | Status | Reason |
| :---- | :---- | :---- | :---- |
| Submission pre-check | NF-04, FR-REV-10, AS-07, AS-09 | **Paused** | The architecture needs more thought. |

**What stays in v1**
- The upload (FR-REV-02) keeps the basic file type and size check (NFR-10).
- The Ready mark, the review flow and all gates do not depend on the pre-check.
- The ID FR-REV-10 stays reserved. It is not reused.

**Notes saved for when the work resumes**

| Topic | Note |
| :---- | :---- |
| Purpose | Catch simple completeness errors before the Student marks a commit Ready. It replaces the deferred AI Pre-Flight Agent (FR-AIA-01). |
| Text source | Option A: read the PDF text layer, warn when none is found. Option B: add OCR. Option C: drop the heading check. |
| Rule set | Heading names and accepted variants for each milestone are not defined. |
| Where it runs | In the app or in the background. The time limit is not set. |
| Draft guardrails | G1 checks structure only, not quality. G2 the warning says it is not a review. G3 never changes the file. G4 does not notify the Adviser or change status. G5 stores the result, not the extracted text. G6 runs on every commit. G7 the Student sees the full result, the Adviser sees a short status. G8 the Coordinator defines headings and variants in C8. G9 a failed check never blocks the upload. |
| Existing guardrails | Warning only (BR-17). No outside service (NFR-06). |

### 1.5 Roles and terms

| Term | Meaning |
| :---- | :---- |
| **Student** | The candidate. Owns one Thesis Instance. |
| **Adviser** | Faculty member. A committee member for that Student. Never a Panel Member. |
| **Panel Member** | Faculty member on the Evaluation Committee (Proposal, Pre-Final) or the Final Panel (Final). Never an Adviser. |
| **Lead Panel Member** | A designation. One Panel Member named by the Coordinator. Records the verdict at Proposal and Pre-Final. |
| **Panel Chair** | A designation. The Panel Member named as Chair on TDW 11. Records the verdict at Final. |
| **Coordinator** | Program Chair and Graduate School Secretary. The only role that closes a stage. Never an Adviser or Panel Member. |
| **Dean** | Not a system user. Signs forms on paper. The Coordinator records the signatures. |
| **Evaluation Committee** | Adviser plus 2 Panel Members (Master's) or 3 (Doctoral). Used at Proposal and Pre-Final. |
| **Final Panel** | Panel Chair plus 3 Panel Members (Master's) or 4 (Doctoral). Used at Final. |

Each account has one role. "Lead Panel Member" and "Panel Chair" are designations given for one Student. They are not roles.

---

## 2. Business rules (shared by all modules)

| ID | Rule |
| :---- | :---- |
| BR-01 | **Two-layer approval.** An in-system action shows intent. The wet-signed paper is the record. The system never replaces a signature. |
| BR-02 | Only the Coordinator sets CLOSED, CERTIFIED, FINAL_APPROVED and CLEARED. |
| BR-03 | **One role per account.** Each account has exactly one role: Student, Adviser, Panel Member or Coordinator. No account holds two roles. An Adviser is never a Panel Member, and the reverse. The Coordinator is neither. |
| BR-04 | Each Student has one Thesis Instance and one Adviser. A Student sees only their own data. An Adviser sees only their own advisees. A member sees only assigned Students. |
| BR-05 | Each reviewer resolves only their own threads. The Student replies but never resolves. |
| BR-06 | A thread is tied to one commit. A newer commit marks it Outdated. It stays OPEN until its author resolves it. |
| BR-07 | The manuscript **locks** at Gate 1b. It unlocks when the Coordinator closes the defense. |
| BR-08 | A panel member can open the manuscript only after the appointment form and that member's NDA are recorded. |
| BR-09 | The defense date must be at least **7 days** after Gate 1b. Printed copies are due at least **7 days** before the defense. |
| BR-10 | The Defense Day page opens at the scheduled start. The verdict is allowed on or after the defense date. |
| BR-11 | The Student sees defense results only after the Coordinator verifies the sheets. |
| BR-12 | A paper mismatch does not stop a defense. The stage cannot close until the author corrects the file and the Coordinator verifies it. |
| BR-13 | Every Return needs a written reason. A Coordinator Return is for compliance or eligibility only. |
| BR-14 | Ethics, IPMO, RPO and copyright are status fields. The Coordinator sets them. Other roles read them. |
| BR-15 | The system shows no subject grade and no grade equivalent. |
| BR-16 | The system sets no minimum number of consultations. |
| BR-17 | Flags never block an action. This covers the pacing flags (NF-12) and any future pre-check (NF-04, paused). |
| BR-18 | Every disabled action shows its reason on screen. |
| BR-19 | Commits, locked scans and audit records are never changed or deleted. |
| BR-20 | The Final Panel comment window runs from the scheduled start of the Final Defense until Gate 2. Before the start, the panel reads only. The Student sees the threads when the defense closes. |

---

## 3. Parameters (set by the Coordinator in C8 unless noted)

| Parameter | Default | Note |
| :---- | :---- | :---- |
| Minimum days, Gate 1b to defense | 7 | BR-09 |
| Printed copies due before defense | 7 days | BR-09 |
| Panel Members on the Evaluation Committee, Master's / Doctoral | 2 / 3 | Adviser not counted |
| Panel Members on the Final Panel besides the Chair, Master's / Doctoral | 3 / 4 | |
| Evaluation sheets, Proposal and Pre-Final (Master's / Doctoral) | 3 / 4 | Adviser included |
| Evaluation sheets, Final (Master's / Doctoral) | 4 / 5 | Adviser excluded |
| Printed proposal copies, Master's / Doctoral | 5 / 6 | Pre-Final and Final counts: to confirm |
| Rubric weights (TDW 08, 13) | A1 10, A2 20, A3 20, A4 10, B1 10, B2 10, B3 20 | Total must be 100% |
| Residency limit, Master's / Doctoral | 5 / 7 years | Unverified. Warning only. |
| Digest window for thread and comment emails | 1 day (the free-tier cron runs once per day) | NTF-04 |
| Reminder days: defense | 3 days and 1 day before | A4 |
| Reminder days: printed copies | 7 days before the defense | B1 |
| Daily job time | About 08:00 Philippine time (00:00 UTC). It runs within that hour. | NTF-06 |
| Target date per milestone | None until set | TPL-05 |
| Reviewer wait threshold (B7) | To be set in the PRD | AS-05 |
| File size limit | To be set | NFR-10 |

---

## 4. Functional requirements

### 4.1 ACC — Accounts and access

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-ACC-01 | The system must let a user sign in with an email address and a password. | M | FR-SYS-01 | `/login` | 1.0 |
| FR-ACC-02 | Each route must be open to its role only. Other users see an Access Denied banner. | M | FR-SYS-01, UD | All | 1.0 |
| FR-ACC-03 | The system must apply the data scope in BR-04 to every read and write, not only to screens. | M | FR-SYS-01, UD | All | All |
| FR-ACC-04 | The Coordinator must be able to create a Student account. The form must hold: name, degree level, program start term, comprehensive exam date, Writing 1 enrollment (RSH 641 or RSH 741) and Adviser. The system must then create one Thesis Instance and Milestone 1. | M | FR-ADM-01, UD | C2 | 1.0 |
| FR-ACC-05 | The Coordinator must be able to add, edit and deactivate users. Each user has one role (BR-03). Faculty accounts are Adviser or Panel Member. The Coordinator must enter each user's email address. | M | FR-ADM-01, UD | C9 | 1.0 |
| FR-ACC-06 | The system must block a second role on one account and any assignment outside the user's role, and show the reason. | M | ADR-001, UD | C3, C9 | 4.0 |
| FR-ACC-07 | The system must give each Student exactly one Adviser. | M | UD | C2 | 1.0 |
| FR-ACC-08 | The system must send the first sign-in setup and password reset by email. | S | NF (E1) | `/login` | 9.0 |

### 4.2 TPL — Templates and parameters

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-TPL-01 | The Coordinator must be able to define a Milestone Template. It holds: required deliverables and forms with their signers, outside-status needs, committee and panel sizes by degree level, printed-copy counts, rubric indicators and weights, and the parameters in Section 3. | M | FR-ADM-02, UD | C8 | 1.0 |
| FR-TPL-02 | The system must ship three default templates (Proposal, Pre-Final, Final and Clearance) with the TDW forms listed in the Unified Doc. | M | UD | C8 | 1.0 |
| FR-TPL-03 | The system must reject a rubric whose weights do not total 100%. | M | UD | C8 | 1.0 |
| FR-TPL-04 | When a template changes, the system must create a new version and log the change. A running Milestone Instance must keep the version it started with. New instances use the latest version. | S | NF-19 | C8 | 1.0 |
| FR-TPL-05 | The Coordinator must be able to set a target date for each milestone. | S | NF-09, NF-12 | C8 | 1.0 |

### 4.3 WFL — Workflow and gates

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-WFL-01 | The system must open Milestone 1 at account creation. It must open Milestone 2 when Milestone 1 is CERTIFIED and the Adviser has approved data gathering. It must open Milestone 3 when Milestone 2 is CLOSED. | M | UD | S1, C1 | 5.0 |
| FR-WFL-02 | The system must keep one status for each Milestone Instance: DRAFT, READY, ADVISER_ENDORSED, COMMITTEE_APPOINTED, COMMITTEE_ENDORSED, DATE_PROPOSED, DEFENSE_SCHEDULED, DEFENSE_HELD, CLOSED, RETURNED. Milestone 1 adds CERTIFIED. Milestone 3 adds FINAL_APPROVED and CLEARED. Each change must follow the flow in the Operational Flow v3.1 and come from an allowed actor. RETURNED must go back to DRAFT, and the system must show the written reason to the Student. | M | UD | All | 5.0 |
| FR-WFL-03 | **Gate 1a.** The Adviser must be able to endorse a Ready commit for committee review, or Return it. The system must block the endorsement while the Adviser has open threads. In Milestone 2 it must also block it until IPMO is PASSED. | M | FR-ADV-03, UD | A2 | 5.0 |
| FR-WFL-04 | **Gate 1b.** The Adviser and every Panel Member must each endorse the commit. The system must block a member's endorsement while that member has open threads. In Milestone 3 each member must also mark the Pre-Final revisions as accepted. When all endorse, the system must lock the manuscript (BR-07) and set COMMITTEE_ENDORSED. | M | FR-ADV-03, FR-PAN-04, UD | A2, P2 | 5.0 |
| FR-WFL-05 | The Adviser, a Panel Member and the Coordinator must be able to Return an item with a written reason (BR-13). The system must notify the author of the item. | M | UD | A2, P2, C4, C5 | 5.0 |
| FR-WFL-06 | **Certification (Milestone 1).** Each committee member must be able to accept the Proposal revisions. When all accept and the paper is received, the Coordinator must be able to record CERTIFIED. | M | UD | P2, A2, C6 | 5.0 |
| FR-WFL-07 | **Gate 2 (Milestone 3).** Each member of the committee and the Final Panel must be able to mark the final manuscript approved. The system must block Gate 2 until IPMO is PASSED, RPO is DONE and the member has no open threads (BR-20). After the paper approval sheet is received, the Coordinator must be able to record FINAL_APPROVED. | M | FR-PAN-04, UD | P2, A2, C7 | 5.0 |
| FR-WFL-08 | The system must allow only the Coordinator to set CLOSED, CERTIFIED, FINAL_APPROVED and CLEARED (BR-02). | M | UD | C6, C7 | 5.0 |
| FR-WFL-09 | When the verdict is Disapproved, the system must keep the defense open and restart the cycle at the review step. It must keep every attempt in the history. | M | UD | C6, S5 | 5.0 |
| FR-WFL-10 | The Coordinator must be able to set the outside statuses. **Ethics:** NOT_SUBMITTED, UNDER_REVIEW, CHANGES_REQUIRED, APPROVED. **IPMO:** NOT_SUBMITTED, UNDER_CHECK, FAILED, PASSED. **RPO:** NOT_SUBMITTED, UNDER_EDITING, DONE. **Copyright:** NOT_APPLIED, APPLIED, REGISTERED. Other roles must see them read-only. In Milestone 1 the system must block date confirmation until Ethics is APPROVED. | M | UD | C7, S1 | 5.0 |
| FR-WFL-11 | After Milestone 1 is CERTIFIED, the Adviser must be able to approve the start of data gathering. | M | UD | A1 | 5.0 |
| FR-WFL-12 | The system must calculate the residency end date from the program start term and degree level. It must show a warning near the end date. It must not block any action. | S | UD | S1, C1 | 10.0 |
| FR-WFL-13 | The system must show the reason for each blocked action. The messages are in Operational Flow v3.1, Section 4.7. | M | UD | All | All |
| FR-WFL-14 | The system must store a gate record for each gate action: actor, role, result and time. | M | FR-SYS-04 | SV, C10 | 5.0 |

### 4.4 CMT — Committees and panels

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-CMT-01 | After Gate 1a, the Coordinator must be able to propose the Evaluation Committee (Milestone 1) and the Final Panel (Milestone 3) at the size set for the degree level. The Coordinator must name one Lead Panel Member and one Panel Chair. Milestone 2 has no new appointment. | M | FR-ADM-03, UD | C3 | 4.0 |
| FR-CMT-02 | The appointment board must show each faculty member's workload and availability. | S | UD | C3 | 4.0 |
| FR-CMT-03 | Each proposed member must have a status: Proposed, Accepted or Declined. A declined seat needs a replacement. | M | UD | C3 | 4.0 |
| FR-CMT-04 | The Coordinator must be able to upload the TDW 06 or TDW 11 scan and the NDA scans, then mark the member Appointed. The Dean assigns on paper. | M | UD | C3 | 4.0 |
| FR-CMT-05 | The system must open the manuscript to a member when the form and that member's NDA are both recorded (BR-08). It must notify the member. | M | FR-PAN-02, UD | P1, C3 | 4.0 |
| FR-CMT-06 | Before the defense, the Coordinator must be able to record a substitute panelist. The substitute must be an existing Panel Member account. The substitute must sign an NDA and gets read access to the locked manuscript. The system must let the substitute complete the absent member's sheet. | M | UD | C3, P4 | 4.0 |

### 4.5 REV — Manuscript and review

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-REV-01 | The system must give each Milestone Instance one Submission PR. | M | FR-STU-01 | S2 | 2.0 |
| FR-REV-02 | The Student must be able to upload a manuscript as a new commit (v1, v2, v3 ...). The system must store each commit unchanged with a SHA-256 hash. The system must block uploads while the manuscript is locked (BR-07). | M | FR-STU-02, FR-SYS-02, UD | S2 | 2.0 |
| FR-REV-03 | The system must show any commit in an in-app PDF viewer next to the thread panel. | M | FR-PAN-02, UD | S2, A2, P2 | 2.0 |
| FR-REV-04 | The Adviser and Panel Members must be able to post general threads tied to a commit. At the Final Defense, Panel Members post threads under FR-REV-12 only. A thread holds the author, role, commit, ordinal replies and a state: OPEN or RESOLVED. | M | FR-ADV-03, FR-PAN-04, ADR-003, ADR-009 | A2, P2 | 2.0 |
| FR-REV-05 | When a newer commit exists, the system must show an Outdated badge on older open threads (BR-06). | M | ADR-008 | S2, A2, P2 | 2.0 |
| FR-REV-06 | The system must let only the thread author resolve a thread. The Student must be able to reply (BR-05). | M | FR-STU-03, UD | S2, A2, P2 | 2.0 |
| FR-REV-07 | The Student must be able to mark one commit Ready. A new commit must clear the mark. | M | UD | S2 | 2.0 |
| FR-REV-08 | The Student must be able to add a short change note to a commit and tag the threads it addresses. The tag must show to the reviewer. It must not change the thread state. | S | NF-01 | S2, A2, P2 | 2.0 |
| FR-REV-09 | Each reviewer must see a review queue: commits and threads waiting, with the days waiting. | S | NF-03 | A1, P1 | 2.0 |
| FR-REV-10 | **Deferred.** The submission pre-check (NF-04) is paused. See Section 1.4. This ID stays reserved. | Deferred | NF-04 | S2 | 2.0 |
| FR-REV-11 | In Milestones 1 and 2, a Panel Member must be able to add a comment to any document the Panel Member can open: a manuscript commit, a form scan or a supporting file. The author resolves their own comment. Student, Adviser, Coordinator and the Student's committee can read it. Final Panel comments follow FR-REV-12. | S | NF-22 | S2, A2, P2, SV | 2.0 |
| FR-REV-12 | **Defense Day threads.** A Panel Chair or Panel Member of the Final Panel must be able to post threads on the locked manuscript commit from the scheduled start of the Final Defense until Gate 2 (BR-20). A thread has the same form as FR-REV-04. The Student sees the threads when the defense closes and the manuscript unlocks. The Student replies and uploads new commits. Only the author resolves a thread. A newer commit marks older open threads Outdated. | M | NF-22, UD | P4, P2, S2 | 2.0 |
| FR-REV-13 | After a Proposal or Pre-Final defense, the Coordinator must be able to enter the Minutes recommendations as revision items. The Student must be able to link each item to a commit. Each member must be able to mark an item accepted. Accepted items drive the Certification and the Milestone 3 Gate 1b check. The Final Defense uses no revision items. Its threads are the tracker (FR-REV-12). | S | NF-14 | C6, S2, P2 | 2.0 |
| FR-REV-14 | The Student must be able to export a comment-response table: thread, reply, commit. Formats: PDF and CSV. | S | NF-15 | S2 | 2.0 |
| FR-REV-15 | Before the scheduled start of the Final Defense, the Final Panel must see a read-only banner and must not be able to comment. At the scheduled start, the comment controls open (FR-REV-12). | M | UD | P2 | 2.0 |

### 4.6 DOC — Documents and forms

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-DOC-01 | The system must show the deliverables for each milestone from the template, with the signers and a status for each. | M | FR-STU-01, UD | S3 | 6.0 |
| FR-DOC-02 | Each document must have one state: Not started, Prepared, Scan uploaded, Locked as submitted, Physical received, Verified, Mismatch, Returned. | M | UD | S3, C4 | 6.0 |
| FR-DOC-03 | The Student must be able to upload a signed scan and the OR. The scan is provisional. It locks on upload. A replacement needs a Return (BR-19). | M | UD | S3 | 6.0 |
| FR-DOC-04 | The system must prefill a form with the data it holds (for example, the defense date) and set the state Prepared. The user downloads it and signs on paper. | M | UD | S3 | 6.0 |
| FR-DOC-05 | The system must offer one download per milestone that bundles the prefilled forms (TDW 03, 06, 07/09/12, 11) and the named blank evaluation sheets. The layouts must follow the official Graduate School files (AS-08). | S | NF-06 | S3, C3 | 6.0 |
| FR-DOC-06 | The Coordinator must be able to Verify or Return each document. A Return needs a reason (BR-13). | M | UD | C4 | 6.0 |
| FR-DOC-07 | The Coordinator must be able to mark a document Mismatch. The system must apply BR-12. | M | UD | C4, C6 | 6.0 |
| FR-DOC-08 | The system must show a compliance checklist for date confirmation. **Milestone 1:** TDW 03, TDW 06 and NDAs, TDW 07 scan, Ethics APPROVED, OR verified. **Milestone 2:** TDW 03, TDW 09 scan, IPMO PASSED, OR verified. **Milestone 3:** TDW 03, TDW 11 and NDAs, TDW 12 scan, OR verified. | M | UD | C4, C5 | 6.0 |
| FR-DOC-09 | The system must show a forms guide: for each form, its purpose, signers, who uploads it and when. | S | NF-08 | S3, C4 | 6.0 |
| FR-DOC-10 | The Coordinator must be able to export a Student dossier: all commits, scans, Minutes and logs, with an index. | S | NF-07 | SV, C7 | 10.0 |
| FR-DOC-11 | The system must show the upload and state history of each document. | S | UD | S3 | 6.0 |

### 4.7 SCH — Consultations and availability

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-SCH-01 | The Adviser must be able to publish consultation slots, one-off or recurring. Each slot has a mode: **In person** or **Online**. An Online slot has one meeting link field. | M | FR-ADV-02, NF-11 | A4 | 3.0 |
| FR-SCH-02 | The Student must be able to request an open slot. The Adviser must be able to confirm or decline. A slot has one status: Available, Pending or Confirmed. | M | FR-STU-04, FR-ADV-02 | S4, A4 | 3.0 |
| FR-SCH-03 | After a slot is Confirmed, the system must show the meeting link to the Adviser and the booked Student only. | M | NF-11 | S4, A4 | 3.0 |
| FR-SCH-04 | Before a slot, the Student must be able to list an agenda and link threads. The Adviser must be able to record recommendations. Both feed the log entry. | S | NF-13 | S4, A3 | 3.0 |
| FR-SCH-05 | When the Adviser confirms a held consultation, the system must draft a log entry. The Student adds the topic. The Adviser confirms. The system must set no minimum count (BR-16). | M | UD | A3, S4 | 3.0 |
| FR-SCH-06 | The system must compile the log into a TDW 03 view. The Adviser must be able to upload the signed scan. | M | UD | A3 | 3.0 |
| FR-SCH-07 | The Adviser and Panel Members must be able to publish defense availability slots. | M | FR-PAN-01, FR-ADV-02 | A4, P3 | 3.0 |
| FR-SCH-08 | The system must calculate the dates on which all required members are free. | M | FR-STU-04, UD | S4 | 3.0 |

### 4.8 DEF — Defense

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-DEF-01 | After Gate 1b, the Student must be able to propose a defense date from the common free dates. The system must block dates earlier than 7 days after Gate 1b and show the reason (BR-09). | M | FR-STU-04, UD | S4 | 7.0 |
| FR-DEF-02 | The system must prepare the endorsement form (TDW 07, 09 or 12) with the date. The Student collects the signatures on paper and uploads the scan and the OR. | M | UD | S3 | 7.0 |
| FR-DEF-03 | The Coordinator must be able to confirm the date and the room or meeting link, or Return the request with a reason. The system must block the confirmation until the checklist in FR-DOC-08 is complete. | M | UD | C5 | 7.0 |
| FR-DEF-04 | The Coordinator must be able to record the receipt of printed copies and the match against the locked manuscript. The system must warn when copies are late (BR-09). | M | UD | C5 | 7.0 |
| FR-DEF-05 | The Defense Day page must open for each member at the scheduled start (BR-10). It must show the evaluation form for the milestone: **TDW 08 and TDW 13** with the seven weighted indicators, a total and a comments box; **TDW 10** with comment boxes only. Each form has Action Taken: Approved, Approved with Revisions or Disapproved. At the Final Defense, P4 also has a third tab, "Manuscript and comments", with the P2 split screen (FR-REV-12). | M | FR-PAN-03, UD | A5, P4 | 7.0 |
| FR-DEF-06 | Each member must be able to encode their own sheet and edit it until the Coordinator verifies it. The sheet count follows the parameters in Section 3. The Adviser completes a sheet at Proposal and Pre-Final, and none at Final. | M | FR-PAN-03, UD | A5, P4 | 7.0 |
| FR-DEF-07 | The Lead Panel Member (Proposal, Pre-Final) or the Panel Chair (Final) must be able to record the collective verdict on or after the defense date. The system must warn when a member's Action Taken differs from the verdict. | M | UD | P4 | 7.0 |
| FR-DEF-08 | The Coordinator must be able to upload each signed sheet scan and check it against the encoded entry. | M | UD | C6 | 8.0 |
| FR-DEF-09 | The Coordinator must be able to check the printed documents against the locked files and issue the Minutes. | M | UD | C6 | 8.0 |
| FR-DEF-10 | The Coordinator must be able to close the defense when every sheet is verified and the Minutes are issued. The system must then unlock the manuscript. | M | UD | C6 | 8.0 |
| FR-DEF-11 | The Student must see the defense results, the Minutes and the attempt history after verification (BR-11), with no grade equivalent (BR-15). | M | UD | S5 | 8.0 |
| FR-DEF-12 | The system must keep every defense attempt with its date, room or link, entries, verdict and Minutes. | M | UD | C6, S5 | 7.0 |

### 4.9 CLR — Clearance (Milestone 3)

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-CLR-01 | The system must show a clearance checklist: IPMO, RPO, Gate 2, copyright, final copy to the Coordinator, conference presentation certification, journal publication copy or acceptance. | M | UD | S6, C7 | 8.0 |
| FR-CLR-02 | The Student must be able to upload the evidence for each item. The Coordinator must be able to verify each item. The last four items can be done in any order. | M | UD | S6, C7 | 8.0 |
| FR-CLR-03 | The Coordinator must be able to record receipt of the final copy and check it against the approved manuscript. | M | UD | C7 | 8.0 |
| FR-CLR-04 | When every item is verified, the Coordinator must be able to set CLEARED. The system must show the Certificate of Compliance checklist as the exit view. | M | UD | C7, S6 | 8.0 |

### 4.10 NTF — Notifications and email

**Email use cases (24).** "Auto" means the system sends it without a human step.

| ID | Trigger | Recipient | Mode |
| :---- | :---- | :---- | :---- |
| A1 | Student proposes a defense date | Coordinator | Auto |
| A2 | Coordinator confirms date and room or link | Student, Adviser, members | Auto |
| A3 | Date returned with a reason, or changed | Student, affected members | Auto |
| A4 | Defense in 3 days and in 1 day | Student, Adviser, members | Auto reminder |
| A5 | Substitute panelist recorded | Substitute, Student | Auto |
| A6 | Results available (no verdict in the email) | Student | Auto |
| B1 | Printed copies due in 7 days | Student | Auto reminder |
| B2 | Milestone target date near or passed | Student, Adviser | Auto reminder |
| B3 | Document returned with a reason | Student | Auto |
| B4 | Revision item waiting for acceptance | Student, members | Auto digest |
| B5 | Clearance item missing or verified | Student | Auto |
| B6 | Residency warning date near | Student, Coordinator | Auto reminder |
| B7 | Commit waiting too long for review | Reviewer | Auto digest |
| C1 | Commit marked Ready | Adviser, or Panel Members | Auto |
| C2 | New thread | Student | Auto digest |
| C3 | Reply in a thread | Thread author | Auto digest |
| C4 | Thread resolved | Student | Auto digest |
| C5 | New document comment | Student, Adviser | Auto digest |
| C6 | Gate 1a, Gate 1b or Gate 2 done | Student, Coordinator | Auto |
| E1 | Account created, password reset | User | Auto |
| E2 | Manuscript access opened | Member | Auto |
| E3 | Committee appointed, or a member declines | Coordinator, Student | Auto |
| F1 | Consultation requested | Adviser | Auto (added: AS-03) |
| F2 | Consultation confirmed or declined | Student | Auto (added: AS-03) |

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-NTF-01 | The system must record an in-app notification for every event in the table above and show it in a notification center with read and unread states. | S | NF-10 | NC | 9.0 |
| FR-NTF-02 | The system must send an email for each use case in the table. Each email uses a fixed template with fields. No user writes free text. | M | FR-SYS-03 | — | 9.0 |
| FR-NTF-03 | Each email must hold the event, the next action, the deadline and a link only. It must not hold manuscript text, comments, scores, verdicts or meeting links. The link opens the app. Sign-in is required. | M | FR-SYS-03 | — | 9.0 |
| FR-NTF-04 | The system must group digest events (C2 to C5) for one commit into one email per digest window. It must group B4 and B7 into one daily email. For Final Defense threads, it must start the Student emails (C2 to C4) when the defense closes. | S | FR-SYS-03 | — | 9.0 |
| FR-NTF-05 | A user must be able to turn off reminders and digests (A4, B1, B2, B4, B6, B7, C2 to C5). All other emails must stay on. | S | FR-SYS-03 | UP | 9.0 |
| FR-NTF-06 | The system must create reminders from the dates in the Operational Flow and the parameters in Section 3. | M | FR-SYS-03 | — | 9.0 |
| FR-NTF-07 | The system must log each email with event, recipient, time and result. When a send fails, the log must show it. The in-app notification must still show the event (NFR-05). | M | FR-SYS-03, FR-SYS-04 | C10 | 9.0 |
| FR-NTF-08 | The system must send emails to the address the Coordinator entered (FR-ACC-05). | M | FR-SYS-03 | C9 | 9.0 |
| FR-NTF-09 | A user must have a notification preferences panel in the user menu. | S | FR-SYS-03 | UP | 9.0 |
| FR-NTF-10 | The Coordinator can edit the wording of an email template. The system keeps versions (FR-TPL-04). | C | NF-19 | C8 | 9.0 |

### 4.11 TRK — Dashboards and tracking

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-TRK-01 | The Student tracker must show: identity card, milestone stepper, one next-action card, readiness checklist, outside-status chips and defense card. | M | FR-STU-05, UD | S1 | 10.0 |
| FR-TRK-02 | The Adviser dashboard must show an action queue (Gate 1a, 1b, 2, logs, TDW 03, data gathering) and an advisee table. | M | FR-ADV-01, UD | A1 | 10.0 |
| FR-TRK-03 | The Panel Member dashboard must show each assignment with role, access status, action required and defense schedule. | M | FR-PAN-02, UD | P1 | 10.0 |
| FR-TRK-04 | The Coordinator overview must show a KPI strip, a grouped action queue and a Student table. Each count must open its queue. | M | FR-ADM-04, UD | C1 | 10.0 |
| FR-TRK-05 | The system must show a key dates panel: earliest defense date (Gate 1b + 7 days), printed-copy due date, target dates and residency warning date. | S | NF-09 | S1, C1 | 10.0 |
| FR-TRK-06 | The system must show pacing flags: days in the milestone against the target date, days since the last commit and days since the last consultation. The flags are information only (BR-16, BR-17). | S | NF-12 | A1, C1 | 10.0 |

### 4.12 RPT — Audit, reports and search

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-RPT-01 | The system must keep an append-only audit log of: gate actions, Returns with reasons, scan uploads, replacements and verifications, outside-status changes, appointments, verdicts, closes, account changes and email events. Each record holds actor, role, time and target. | M | FR-SYS-04 | — | 10.0 |
| FR-RPT-02 | The Coordinator must be able to filter the audit log by Student, actor, action and date, and export it as CSV. | S | NF-17 | C10 | 10.0 |
| FR-RPT-03 | The Coordinator must be able to export CSV reports: Students by milestone, status and blocker; aging; outside statuses; sheets waiting for verification. | S | NF-18, FR-ADM-04 | C1 | 10.0 |
| FR-RPT-04 | A user must be able to search the Students, documents and threads they can access. The user must be able to save filters. | S | NF-20 | All | 10.0 |

### 4.13 SUB — Shared submission view

| ID | Requirement | Pri | Origin | Screen | Proc |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR-SUB-01 | The system must give each Milestone Instance one read-only submission view. It opens when Gate 1b is passed. (Confirmed: AS-02.) | S | NF-21 | SV | 10.0 |
| FR-SUB-02 | The view must be open to the owning Student, that Student's Adviser, the assigned members and the Coordinator. BR-08 still applies to members. | S | NF-21 | SV | 10.0 |
| FR-SUB-03 | The view must show: the locked manuscript, the gate record, the document checklist with status, the defense date and room or link, thread counts (including Final Defense threads), document comments and the Minutes after close. | S | NF-21 | SV | 10.0 |
| FR-SUB-04 | The view must hold no gate or edit action. It must link to the user's own workspace. | S | NF-21 | SV | 10.0 |
| FR-SUB-05 | The system must serve the view on four routes that use one screen: `/student/submission/[id]`, `/adviser/submission/[id]`, `/panel/submission/[id]`, `/coordinator/submission/[id]`. This keeps route isolation (FR-ACC-02). | S | NF-21 | SV | 10.0 |

---

## 5. Quality requirements

| ID | Requirement |
| :---- | :---- |
| NFR-01 | The server must check access on every read and write (FR-ACC-03). The screen is not enough. |
| NFR-02 | The system must keep the SHA-256 hash of each commit and locked scan and detect a change. |
| NFR-03 | The audit log must be append-only (BR-19). |
| NFR-04 | Each role must have one landing screen that shows the next action. |
| NFR-05 | An email failure must never block a workflow step. The in-app event must always be recorded. |
| NFR-06 | The system must use one third-party feature service only: a transactional mail service. Hosting, database, authentication and file storage are infrastructure. All infrastructure must run on free tiers. PDF reading and file bundling run inside the app. |
| NFR-07 | Email and logs must hold the least personal data the flow needs. The retention period is to be set. |
| NFR-08 | The PRD must set response-time and availability targets. They are not set here. |
| NFR-09 | The Defense Day page and the manuscript viewer must work on laptop and tablet screen widths. |
| NFR-10 | The manuscript must be a PDF. Scans must be PDF or image. The system must reject other file types and files over 50 MB at upload. (Proposed limit. See AS-11.) |
| NFR-11 | All dates and times use Philippine Standard Time (UTC+8). (Confirmed: AS-10.) |
| NFR-12 | The browser must upload files directly to file storage with short-lived signed links. The server must not receive file bytes. The viewer must read files through short-lived signed links. |
| NFR-13 | The system must stay within the free-tier limits of its platforms. The PRD lists the limits and the capacity estimate. |

---

## 6. Impact on the DFD, sitemap and ERD

### 6.1 DFD changes (from DFD v2)

| Item | Change |
| :---- | :---- |
| New process **9.0** | Manage notifications and email. Reads events from 2.0 to 8.0. Writes D13. Sends mail to all roles. |
| New process **10.0** | Track, report, audit and view. Read-only. Covers dashboards, pacing, search, exports, audit log and the shared view. |
| New store **D11** | Document comments (FR-REV-11) |
| New store **D12** | Revision items (FR-REV-13). Proposal and Pre-Final only. |
| New store **D13** | Notifications, email log and user preferences (NTF) |
| Changed **D2** | Adds template versions and target dates |
| Changed **D3** | Adds change note |
| Changed **D4** | Adds the "Addressed" tag and the Final Defense threads |
| Changed **D5** | Adds slot mode and meeting link |
| New external entity | Mail service (the only outside service) |

### 6.2 Sitemap changes (from 25 routes)

| Change | Routes |
| :---- | :---- |
| Shared submission view | +4 (FR-SUB-05) |
| Audit viewer | +1, `/coordinator/audit` (C10, confirmed: AS-06) |
| Notification center | Panel in the page frame. No route. |
| Notification preferences | Panel in the user menu. No route. |
| Forms guide | Tab in S3 and C4. No route. |
| **New total** | **30 routes** |

### 6.3 Candidate entities for the first ERD

This list is a start. It holds no keys and no relations.

| Candidate entity | Main facts | FR source |
| :---- | :---- | :---- |
| User | Name, email, active flag, role | ACC |
| Student record (Thesis Instance) | Degree level, start term, exam date, Writing 1 enrollment, Adviser | ACC-04, ACC-07 |
| Milestone Template, Template Version | Required items, forms, parameters, rubric | TPL |
| Milestone Instance | Template version, status, attempts | WFL |
| Gate Action | Gate, actor, result, time | WFL-14 |
| Return Record | Item, reason, author | WFL-05, DOC-06 |
| Outside Status | Type, value, set by, time | WFL-10 |
| Committee Assignment | Member, status, designation (Lead Panel Member or Panel Chair) | CMT |
| NDA and Appointment Record | Member, scan, recorded time | CMT-04 |
| Commit | Number, file, hash, Ready flag, change note | REV-02, REV-07, REV-08 |
| Thread, Thread Reply | Commit, author, context (iteration, committee review or Final Defense), state, Outdated flag, Addressed tag | REV-04 to REV-06, REV-12 |
| Document Comment | Document or commit, author, state | REV-11 |
| Revision Item | Minutes item, linked commit, acceptances | REV-13 |
| Document Record, Document File | Form, state, scan, hash, history | DOC |
| Slot | Owner, type (consultation or defense), mode, link, status | SCH |
| Consultation Booking and Log Entry | Slot, topic, agenda, recommendations, confirmation | SCH-04, SCH-05 |
| Defense Attempt | Date, room or link, status, verdict | DEF |
| Evaluation Entry | Member, indicator scores, comments, Action Taken, verified flag | DEF-05, DEF-06 |
| Sheet Scan | Entry, file, match result | DEF-08 |
| Printed Copy Receipt | Count, date, match result | DEF-04 |
| Minutes | Defense attempt, recommendations | DEF-09, REV-13 |
| Clearance Item | Type, evidence, verified flag | CLR |
| Notification, Email Log | Event, recipient, time, result | NTF |
| Notification Preference | User, event type, on or off | NTF-05 |
| Saved Filter | User, scope, criteria | RPT-04 |
| Audit Record | Actor, role, action, target, time | RPT-01 |

---

## 7. Traceability from the earlier FR list

| Earlier FR | New FR |
| :---- | :---- |
| FR-STU-01 | REV-01, DOC-01 |
| FR-STU-02 | REV-02 |
| FR-STU-03 | REV-06 |
| FR-STU-04 | SCH-02, SCH-08, DEF-01 |
| FR-STU-05 | TRK-01, SCH-08 |
| FR-ADV-01 | TRK-02 |
| FR-ADV-02 | SCH-01, SCH-02, SCH-07 |
| FR-ADV-03 | WFL-03, WFL-04, REV-04 |
| FR-PAN-01 | SCH-07 |
| FR-PAN-02 | CMT-05, REV-03, TRK-03 |
| FR-PAN-03 | DEF-05, DEF-06 |
| FR-PAN-04 | WFL-04, WFL-07, REV-04 |
| FR-ADM-01 | ACC-04, ACC-05 |
| FR-ADM-02 | TPL-01 |
| FR-ADM-03 | CMT-01 to CMT-04 |
| FR-ADM-04 | TRK-04, RPT-03 |
| FR-SYS-01 | ACC-01 to ACC-03 |
| FR-SYS-02 | REV-02, NFR-02 |
| FR-SYS-03 | NTF-01 to NTF-10 |
| FR-SYS-04 | WFL-14, RPT-01, RPT-02 |
| FR-AIA-01 to 03 | Deferred. See NF-04 (REV-10) and NF-12 (TRK-06). |

| Selected feature | FR |
| :---- | :---- |
| NF-01 | REV-08 |
| NF-03 | REV-09 |
| NF-04 | REV-10 (deferred) |
| NF-06 | DOC-05 |
| NF-07 | DOC-10 |
| NF-08 | DOC-09 |
| NF-09 | TRK-05, TPL-05 |
| NF-10 | NTF-01 |
| NF-11 | SCH-01, SCH-03 |
| NF-12 | TRK-06 |
| NF-13 | SCH-04 |
| NF-14 | REV-13 |
| NF-15 | REV-14 |
| NF-17 | RPT-02, NTF-07 |
| NF-18 | RPT-03 |
| NF-19 | TPL-04, NTF-10 |
| NF-20 | RPT-04 |
| NF-21 | SUB-01 to SUB-05 |
| NF-22 | REV-11, REV-12 |

---

## 8. Assumptions and open items

### 8.1 Assumptions (all closed, confirmed or deferred)

| ID | Assumption | Affects |
| :---- | :---- | :---- |
| AS-01 | **Closed.** Final Panel threads run from the scheduled start of the Final Defense to Gate 2. Defense Day comments apply to the Final Defense only. Tell me if they must also apply at Proposal and Pre-Final. | REV-12, REV-15 |
| AS-02 | **Confirmed.** The shared submission view opens at Gate 1b. It uses four routes and one screen. | SUB |
| AS-03 | **Confirmed.** Consultation request and confirmation emails (F1, F2) are in scope. | NTF |
| AS-04 | **Closed.** One role per account. Adviser, Panel Member and Coordinator are mutually exclusive (BR-03). Consequence: a faculty member cannot advise one Student and sit on another Student's panel. | ACC-05, ACC-06 |
| AS-05 | **Confirmed.** The "commit waiting too long" threshold (B7) is a Coordinator parameter in C8. The value is set in the PRD. | NTF, REV-09, TPL-01 |
| AS-06 | **Confirmed.** The audit viewer has its own route, `/coordinator/audit` (C10). | RPT-02 |
| AS-07 | **Deferred** with FR-REV-10. The pre-check rule set is not defined. | REV-10 |
| AS-08 | **Confirmed.** The form pack needs the official Graduate School form files. Action: the owner will upload them to a repository. | DOC-05 |
| AS-09 | **Deferred** with FR-REV-10. The pre-check would read the PDF text layer. | REV-10 |
| AS-10 | **Confirmed.** All times use Philippine Standard Time (UTC+8). | NFR-11 |
| AS-11 | **Open.** MB per page (manuscript and TDW forms) stays open until the owner uploads the real files to a repository. The 50 MB file limit is proposed. | NFR-10, PRD Section 11.4 |
| AS-12 | **Open.** TDW form page counts and commits per milestone are unverified. | PRD Section 11.4 |
| AS-13 | The file store is a new service. Prototype it before Phase 1. Check whether file downloads count against the free transfer limit. | NFR-12, NFR-13 |

### 8.2 Open Graduate School questions that affect requirements

| ID | Question | Default used here |
| :---- | :---- | :---- |
| G3 | When is the honorarium paid? | OR is uploaded before date confirmation (DEF-02, DEF-03) |
| G5 | How many attempts after Disapproved? Is there a re-defense fee? | New attempt allowed. History kept. (WFL-09) |
| G6, G17 | Who proposes the date? Does the Dean approve it? | Student proposes. Coordinator confirms. (DEF-01, DEF-03) |
| G10 | Similarity threshold? | IPMO decides. Status only. (WFL-10) |
| G12 | Is the residency limit a block or a warning? | Warning only. (WFL-12) |
| G13 | Late printed copies? | Coordinator sees a warning. (DEF-04) |
| G14 | Which ethics board applies? | Coordinator sets the status. (WFL-10) |
| G15 | Official form for the Certification of Proposal Approval? | Paper form from the Graduate School. (WFL-06) |
| G16, G21 | Printed copy and final copy counts and due dates | Count not defined. (DEF-04, CLR-03) |
| G18 | Does the Adviser complete a TDW 13 sheet? | No. (DEF-06) |
| G19 | Do conference and journal items block clearance? | Both required, any order. (CLR-02) |
| G20 | Who issues the Certificate of Compliance? | Checklist shown as the exit view. (CLR-04) |
| G22 | Which office handles copyright? | Status only. (WFL-10) |
| G23 | Is GS Form 08 in this flow? | Not in the flow. |
| PK2 | Does a substitute need a paper amendment? | Coordinator records the substitute. (CMT-06) |

---

## 9. Next steps (phase gates)

| Gate | Output | Needs from you |
| :---- | :---- | :---- |
| 1 | Approve this file. AS-01 to AS-10 are closed, confirmed or deferred. | **Done** |
| 2 | PRD (goals, users, scope, success measures, release phases) | Your go-ahead |
| 3 | DFD v3 (processes 9.0 and 10.0, stores D11 to D13) | **Done.** See `Operational_Flow_DFD_Sitemap_v3.md`. |
| 4 | First ERD (from Section 6.3) | PRD, or your go-ahead |
