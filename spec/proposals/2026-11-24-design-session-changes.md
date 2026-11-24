# Change proposals from the design session (24 Nov 2026)

**Status:** Approved by the owner, 24 Nov 2026. Recorded as PRD D-24 to D-28. Applied in Functional Requirements v1.2, Unified Thesis Process v1.2 and ERD 1.2. The code changes are not done yet.
**Origin:** The grilling session on screens and design (`DESIGN.md` v0.2, `design/screens/`).
**Rule:** These proposals change no document by themselves. After approval, write new versions of the affected documents (AGENTS.md §4, no overwrite).

| ID | Title | Affects | Blocks a screen spec |
| :---- | :---- | :---- | :---- |
| CP-01 | Who sets the thesis title | FR (C2, S1), UTP | C2, S1 |
| CP-02 | Optional upload of the advising forms (Stage 0) | UTP v1.2, FR-DOC | S3 |
| CP-03 | Page reference on comments | ADR-009, FR-REV-04, ERD `critique_thread` | S2, A2, P2 |
| CP-04 | Advisee-limit flag as a template parameter | FR-TPL, FR-TRK-06 | C8, A1, C3 |
| CP-05 | Verify or Return only for documents | FR-DOC-02, BR-12, ERD document states | C4, C5, C6, C7, S3 |

---

## CP-01 · Who sets the thesis title

| Item | Detail |
| :---- | :---- |
| Now | The data has a thesis title field (`accounts.ts`, `title`). No FR says who sets it or when it can change. |
| Proposal | The Coordinator sets the working title when they create the Student account (C2). The Student can edit it until Gate 1b. After Gate 1b, the title is locked with the manuscript (BR-07). |
| Reason | The identity line on every record screen shows the title. A title must exist from day one. |
| Affects | A new FR in the account group (FR-ACC). C2 create form. S1 identity line. |
| Risk | Low. The field exists. |

## CP-02 · Optional upload of the advising forms (Stage 0)

| Item | Detail |
| :---- | :---- |
| Now | UTP v1.1 says "The Student uploads no Stage 0 documents". TDW 01, TDW 04 and TDW 02 are done on paper before Milestone 1 (Guidelines A.1 to A.4, in the order 01, 04, 02). |
| Proposal | S3 shows an "Advising forms · optional" group. The Student may upload a copy of each form. The upload is write-once, never verified by the Coordinator, and never blocks a step. |
| Reason | The owner wants the Student to keep the forms they already have in the system. |
| Affects | UTP v1.2 (Stage 0 text). FR-DOC: a new optional document kind with no verification. |
| Risk | Low. It must stay optional and unverified, or it becomes a new gate. |

## CP-03 · Page reference on comments

| Item | Detail |
| :---- | :---- |
| Now | ADR-009 keeps Critique Threads at the PR level, not pinned to the PDF. `critique_thread` has no page field. The viewer runs with no text layer. |
| Proposal | A reviewer can add an optional page number to a thread. The thread shows "p. 14". A click moves the viewer to that page. No text highlight and no pin on the PDF. Text highlight goes on the later list. |
| Reason | Reviewers and Students need to find the place a comment talks about. A page number is cheap and needs no text layer. |
| Affects | ADR-009 (amendment). FR-REV-04. ERD: a nullable integer `page` on `critique_thread`, checked against the commit's page count. |
| Risk | Low. A page number of an old commit may point to different content in a new commit. The thread already shows its commit. |

## CP-04 · Advisee-limit flag as a template parameter

| Item | Detail |
| :---- | :---- |
| Now | TDW 04 certifies that the Adviser is "within the allowable number of advisees". Our copy of the Guidelines gives no number. |
| Proposal | C8 gets a parameter "Advisee limit: Off / number". Default: Off. When on, C3 and A1 show a flag when an Adviser goes over the number. The flag never blocks (BR-17). The number is `[CONFIRM]`. |
| Reason | The owner wants the check to exist and to be easy to turn on later. |
| Affects | FR-TPL (a new parameter). FR-TRK-06 (pacing flags). |
| Risk | Low while Off. |

## CP-05 · Verify or Return only for documents

| Item | Detail |
| :---- | :---- |
| Now | FR-DOC-02 lists 8 states: Not started, Prepared, Scan uploaded, Locked as submitted, Physical received, Verified, Mismatch, Returned. BR-12 says a paper mismatch does not stop a defense, and the stage cannot close until the author corrects the file and the Coordinator verifies it. |
| Proposal | The Coordinator has two actions on a document: Verify or Return. Remove "Physical received" and "Mismatch". Verify means "I compared the signed paper with the scan, and it is final". A mismatch becomes a Return with a free-text reason. The states become: Not started, Prepared, Scan uploaded, Locked as submitted, Verified, Returned. |
| BR-12 new text | "A Returned document does not stop a defense. The stage cannot close until the author uploads a corrected scan and the Coordinator verifies it." |
| Reason | The owner wants one simple decision for each document, with no checklist and no separate flag. |
| Affects | FR-DOC-02, BR-12, ERD document state enum and its state machine, SITEMAP §6 document chip, C4 and S3 specs. Flags elsewhere (residency, late copies, missing sheets) do not change (BR-17). |
| Risk | Medium. The built code uses the two states: 59 matches in 23 files on 24 Nov 2026, including `schema/enums.ts`, `domain/documents.ts`, `data/documents.ts`, `data/defense.ts` and the C4, C5 and C6 pages. The change needs a migration and an update of the document state machine and its tests. |
