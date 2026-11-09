# Graduate Thesis Progress System

**Program:** PUP Graduate Computer Engineering (CpE)
**Status:** Current product idea, 9 November 2026
**Build state:** Frontend prototype only. Application code has not started. Embedded AI stays deferred.

This note states what the system is meant to be: who uses it, what it is meant to do, and what still blocks a faithful process. The blockers below concentrate on document templates and the organizational process flow.

When this note and the governing specifications overlap, the sitemap screen contracts and the later architectural decisions govern the prototype. Those sources are listed at the end.

---

## What it is

The Graduate Thesis Progress System is a role-separated workspace for one graduate thesis at a time. Each Computer Engineering graduate student owns exactly one active thesis. The thesis moves through milestone stages. At each stage the student submits versioned documents, reviewers leave feedback tied to a specific version, and a named gate must pass before the next stage opens.

The working model treats a submission like a pull request:

- The student opens one submission for the active milestone and uploads version 1.
- The adviser, and later a panel member, posts critique threads anchored to that version.
- The student uploads the next version in the same submission. Older threads stay open and are marked outdated until a reviewer resolves them.
- The upload control stays available while a review is in progress.

Two gates structure the academic path:

1. **Gate 1 — Adviser endorsement.** The adviser resolves their critique threads and endorses the manuscript for defense. Until then, panel members cannot read it.
2. **Gate 2 — Panel sign-off.** After the defense and the required revisions, panel critique threads are resolved and the milestone is approved.

The prototype walks one sample thesis, *EchoWood: Embedded Termite Detection via ESP32-S3*, through Stage 2 (Proposal Defense), submission PR #104, latest commit v2, status in adviser review.

---

## Users

Each account has exactly one primary role. A thesis adviser cannot also be a panel member for any student, and a panel member cannot also be a thesis adviser. The prototype enforces this with separate portals and a persona switcher for demo accounts.

| User | What they own | What the system lets them do |
| --- | --- | --- |
| **Student** | One thesis | Submit milestone documents, upload later versions, answer critique threads, book adviser consultations, and request a defense slot after Gate 1. |
| **Thesis Adviser** | Assigned advisees | See advisee status, publish consultation and defense availability, confirm consultation bookings, review the manuscript, post and resolve critique threads, and execute Gate 1. |
| **Panel Member** | Assigned defenses | Publish defense availability. After Gate 1, read the endorsed manuscript. After the defense result is recorded, post and resolve critique threads and execute Gate 2. The prototype labels one panelist as lead panelist. That label does not yet grant extra approval power. |
| **Program Coordinator** | The program | Configure milestone templates, manage accounts, assign one adviser and multiple panel members per thesis, see program progress, and carry the parked institutional actions during the prototype: confirm the defense schedule and room, and encode the physical evaluation result. |

Demo accounts in the prototype: Juan Dela Cruz (Student), Dr. Elena Reyes (Thesis Adviser), Engr. Marco Santos (Panel Member, lead panelist), Dr. Clara Mendoza (Panel Member), Prof. Arturo Cruz (Program Coordinator).

An embedded AI subsystem is part of the later product, not a user. It would check a new upload against the milestone template, warn a student who is falling behind, and brief a reviewer on whether the latest version answers open critique threads. Those three jobs stay visible in the interface and inactive.

---

## Intended academic path

The product idea uses four academic stages inside a longer operational flow.

**Academic stages shown to the student**

| Stage | Name in the prototype | Gate |
| --- | --- | --- |
| 1 | Title Proposal | Adviser |
| 2 | Proposal Defense | Adviser and panel |
| 3 | Pre-Oral Defense | Adviser and panel |
| 4 | Final Colloquium | Adviser and panel |

Stage 1 is complete for the sample thesis. Stage 2 is active. Stages 3 and 4 stay locked until the previous gate passes.

**Operational flow around those stages**

| Step | What is supposed to happen | Where it stands |
| --- | --- | --- |
| 0. Program setup | The coordinator defines the milestone template (stages, required files, rubrics, deadlines), creates the student, creates the thesis, and assigns one adviser plus the panel. | Intended. Template content is not the real departmental set. See blockers. |
| 1. Draft and pre-flight | The student uploads version 1, including the manuscript and required forms. A later AI check would flag missing sections before the adviser is notified. | Upload and version history are in the prototype. AI pre-flight is deferred. |
| 2. Mentorship and Gate 1 | The adviser publishes consultation slots. The student books one. The adviser reviews, writes critique threads, checks the next version, resolves threads, and endorses. | Intended, and exercised in the prototype with mock state. |
| 3. Defense scheduling | Gate 1 unlocks defense booking. Faculty publish defense slots. The student requests a shared slot. Someone confirms the date and the room or meeting link. | Booking is in the prototype. Who confirms, and whether a payment receipt is required first, is parked. |
| 4. Pre-defense reading | Panel members can read the endorsed manuscript. Grading forms stay hidden until the defense. Email and calendar notices would go out. | Read access is in the prototype. Email is not in this phase. |
| 5. Defense day | The student presents in person or by hybrid conference. Panel members read the digital manuscript and write the grade, verdict, and signature on a physical evaluation sheet. | The physical sheet and the encoding step are parked. |
| 6. Revisions and Gate 2 | The verdict is recorded as Pass, Conditional Pass, or Re-Defense. The student uploads later versions until panel threads are resolved. An authorized evaluator approves Gate 2. Closing the program may also require physical clearance or a hardbound receipt. | Revision threads are in the prototype. Who may sign Gate 2, and what closes the program, is unresolved. |

Submission statuses used by the prototype: draft uploaded, in review, endorsed, defense scheduled, post-defense revisions, approved.

---

## Intended features

### Student

- Submit the files required by the active milestone.
- Keep an immutable version history (`v1`, `v2`, `v3`, and so on) inside one submission.
- Read critique threads, reply, and see which threads belong to an older version.
- Track the thesis on a stage stepper, with the adviser, the panel, and the current submission status.
- Book an adviser consultation at any time.
- Request a defense slot only after Gate 1.

### Thesis adviser

- Roster of advisees with stage, latest version, open threads, and gate status.
- Split workspace: manuscript on one side, critique threads on the other.
- Publish consultation and defense time slots, then confirm or decline consultation requests.
- Execute Gate 1 only when the adviser’s open threads are resolved.

### Panel member

- Queue of assigned students, with the manuscript locked until Gate 1.
- Read-only manuscript after endorsement, including on the defense date.
- Publish defense availability.
- After the defense result is recorded: create critique threads, resolve them, and execute Gate 2 when panel threads are resolved.

### Program coordinator

- Program counts: active students, submissions in review, defenses awaiting a date, open revisions.
- Milestone template workspace: stages, required-file labels, and which gate applies.
- Account and committee assignment with the adviser and panel kept disjoint.
- Institutional queue used by the prototype for the two parked actions: confirm defense schedule and room, and record the physical evaluation so revisions can start.

### Across the system

- Sign-in and route isolation per role.
- Immutable file versions.
- Email on state changes, bookings, and deadlines, in a later phase.
- An audit record of gate changes and grades, in a later phase.
- In-app manuscript reading. The prototype uses a mock manuscript canvas.
- Coordinator-defined templates validated as structured metadata, in a later phase. The prototype only displays example file labels.

### Explicitly later

AI pre-flight, pacing alerts, and the revision brief are reserved in the interface and have no behavior in this phase. Authentication, database storage, email, and defense-day automation are also out of this phase. The later stack named in the specifications is Next.js, React, TypeScript, Tailwind CSS, Supabase, an event worker, Resend, and the Vercel AI SDK. That stack is a plan, not a current build.

---

## Current blockers

Two gaps keep the process from being specified tightly enough to build against the real program. The interface can demonstrate the gates. It cannot yet say which official document belongs at which step, or which office owns the steps that leave the screen.

### Document templates

A milestone template, in the current idea, is metadata: the stage list, the files each stage requires, the rubric, the deadline, and which gate applies (adviser, panel, or both). The coordinator is the person who maintains it. No official PUP CpE or Graduate School template set has been ingested.

What the prototype shows is illustrative, not an approved checklist:

| Stage | Files shown on the coordinator screen | Gate label shown |
| --- | --- | --- |
| 1. Title Proposal | Concept note (PDF), adviser endorsement | Adviser |
| 2. Proposal Defense | Proposal manuscript, ethics clearance | Adviser and panel |
| 3 and 4, combined on that screen | Full manuscript, Turnitin clearance under 15% | Adviser and panel |

Those labels are not a document system yet.

- There is no collected packet of the real forms: title page, endorsement, ethics clearance, evaluation sheet, routing slip, payment receipt, clearance, or hardbound receipt.
- There is no field schema, signatory block, or rule for which copy is digital, which copy is wet-signed paper, and which paper scan must be stored.
- Rubrics are named as something the coordinator configures. No rubric criteria, score scale, or verdict mapping exists.
- Formatting rules that a later pre-flight check would use (section order, required headings, similarity threshold, file type) are not written down. The Turnitin “under 15%” pill is an example on the screen, not a confirmed program rule.
- Adding a stage in the prototype only confirms the click. It does not define a new required file or gate.
- The student view lists Stage 3 and Stage 4 separately. The template card on the coordinator view folds them into one required-file group. The real per-stage packet is unknown, so the two screens cannot yet be reconciled.
- A submission today is “a PDF plus whatever the template lists.” The product cannot yet reject a package for a missing form, a wrong form, or an unsigned form.

Until the program supplies the document packet per stage, template configuration can only store names. It cannot drive validation, routing, or archival.

### Organizational process flow

The digital mentorship loop is specified: student uploads, adviser critiques, Gate 1 opens the manuscript to the panel, revisions continue on versioned threads, Gate 2 closes the milestone. The institutional loop around that mentorship is not. These are the open questions for PUP CpE and the Graduate School.

| ID | Step | What is already assumed | What is still unresolved |
| --- | --- | --- | --- |
| GAP-01 | Committee setup | One adviser and at least two panel members. One panelist may be called lead or chair. | Does the panel chair have approval authority the other panel members do not? |
| GAP-02 | Defense scheduling | The student requests a slot from published faculty availability. In the prototype, the coordinator confirms the date and types the room or meeting link. | Who actually confirms the date? Coordinator, adviser, or Graduate School staff? Is a physical payment receipt required before confirmation? |
| GAP-03 | Defense evaluation | Grades, verdict, and signatures are written on a paper evaluation sheet. The manuscript stays digital. In the prototype, the coordinator records Pass, Conditional Pass, or Re-Defense and marks the sheet as attached, which unlocks revisions. | Who hands out and collects the sheets on defense day? Who encodes the scores and uploads the scan? |
| GAP-04 | Gate 2 | The prototype lets a panel member sign off once every panel thread on that submission is resolved. | Must every panel member approve, or does the chair or the adviser sign alone? |
| GAP-05 | Closing the program | Gate 2 completes the milestone. | Which clearance forms or hardbound-submission receipts are required before the thesis is closed, and who records them? |

Related process choices that are parked with those gaps:

- Defense may be in the room or hybrid. The product has a room-or-link field and no rule for which mode the program uses.
- Consultation booking is settled in the prototype: the adviser confirms it. Defense booking is not, and must not be treated as the same action.
- Placing GAP-02 and GAP-03 on the coordinator screen keeps the demo inside one admin role. That placement is a prototype decision. It is not confirmation that the coordinator is the institutional owner of either action.
- The verdict set (Pass, Conditional Pass, Re-Defense) is the working list. It is not yet tied to a rubric or to what the student must submit next.
- No actor is defined for distributing paper, collecting paper, or filing the scan beside the digital manuscript.

The process cannot be locked, and the template builder cannot be filled with real required files, until those five questions have an owner and an answer from the program.

---

## Sources

This note synthesizes the current governing set and the Mode A prototype. It does not replace them.

1. `docs/governing/PUP CpE Thesis Progress System - Architectural Scratchpad.md` — glossary, ADR-001 through ADR-010, and the functional requirements.
2. `docs/governing/PUP CpE Thesis Progress System - Operational Flow & Tech Stack Specification.md` — Stages 0–6 and the consultation gap matrix.
3. `docs/governing/PUP CpE Thesis Progress System - SITEMAP & Frontend Specification.md` — routes, mock accounts, screen contracts, and ADR-011 scheduling.
4. `design/stitch/document-ingestion-processor/Graduate Thesis Progress System V1.0.html` — the current single-file prototype, including the example template labels and the coordinator queues for GAP-02 and GAP-03.
