# Screen specs

One file for each screen. `DESIGN.md` holds the shared principles, tokens and patterns. A screen spec holds only what is particular to that screen.

**Status:** Draft v1 (24 Nov 2026), from the design session. The owner reviews each screen in the real app and asks for changes screen by screen.
**Rule:** If a spec and the Functional Requirements disagree, the Functional Requirements win. The change proposals CP-01 to CP-05 were approved on 24 Nov 2026 (PRD D-24 to D-28) and are in Functional Requirements v1.2.
**Mockups:** The HTML mockups from the session are in `design/mockups/`. They are history only, except the glyph SVGs in `coordinator-mockups.html`. Each spec lists its changes from its mockup. C1 and C4 follow the Coordinator mockup (v5). C4 also adds the Verify dialog, which the mockup does not show.

## Spec shape

Each file has: route, role, density, FRs, job, regions (top to bottom, with the pattern from `DESIGN.md` §7.4), states, rules, and changes from the mockup.

## Index (31 routes, 28 specs)

| ID | Route | Role | Spec |
| :---- | :---- | :---- | :---- |
| LOGIN | `/login` | Public | [LOGIN.md](LOGIN.md) |
| S1 | `/student/dashboard` | Student | [S1.md](S1.md) |
| PROCESS | `/student/process` (new) | Student | [PROCESS.md](PROCESS.md) |
| S2 | `/student/pr/[prId]` | Student | [S2.md](S2.md) |
| S3 | `/student/documents` | Student | [S3.md](S3.md) |
| S4 | `/student/schedule` | Student | [S4.md](S4.md) |
| S5 | `/student/defense/[defenseId]` | Student | [S5.md](S5.md) |
| S6 | `/student/clearance` | Student | [S6.md](S6.md) |
| A1 | `/adviser/dashboard` | Adviser | [A1.md](A1.md) |
| A2 | `/adviser/pr/[prId]` | Adviser | [A2.md](A2.md) |
| A3 | `/adviser/consultations` | Adviser | [A3.md](A3.md) |
| A4 | `/adviser/availability` | Adviser | [A4.md](A4.md) |
| A5 | `/adviser/defense/[defenseId]` | Adviser | [A5.md](A5.md) |
| P1 | `/panel/dashboard` | Panel Member | [P1.md](P1.md) |
| P2 | `/panel/pr/[prId]` | Panel Member | [P2.md](P2.md) |
| P3 | `/panel/availability` | Panel Member | [P3.md](P3.md) |
| P4 | `/panel/defense/[defenseId]` | Panel Member | [P4.md](P4.md) |
| C1 | `/coordinator/dashboard` | Coordinator | [C1.md](C1.md) |
| C2 | `/coordinator/students` | Coordinator | [C2.md](C2.md) |
| C3 | `/coordinator/committees` | Coordinator | [C3.md](C3.md) |
| C4 | `/coordinator/documents` | Coordinator | [C4.md](C4.md) |
| C5 | `/coordinator/schedule` | Coordinator | [C5.md](C5.md) |
| C6 | `/coordinator/defense/[defenseId]` | Coordinator | [C6.md](C6.md) |
| C7 | `/coordinator/clearance` | Coordinator | [C7.md](C7.md) |
| C8 | `/coordinator/templates` | Coordinator | [C8.md](C8.md) |
| C9 | `/coordinator/users` | Coordinator | [C9.md](C9.md) |
| C10 | `/coordinator/audit` | Coordinator | [C10.md](C10.md) |
| SV | `/{student,adviser,panel,coordinator}/submission/[id]` | All four | [SV.md](SV.md) |

**Route removed:** `/coordinator/spike-files` was a spike page, not a screen. It is no longer on `dev` (checked 25 Nov 2026).

## Sidebars

Each sidebar shows every item of the role. An item that is not open yet shows a `lock` glyph and its reason in a tooltip (`DESIGN.md` §5.1).

| Role | Items (in order) | Locked until |
| :---- | :---- | :---- |
| Student | Dashboard, Thesis process, Manuscript, Documents, Schedule, Defense results, Clearance, Submission | Defense results: the Coordinator verifies the sheets (BR-11). Clearance: Milestone 3 (FR-CLR-01). Submission: Gate 1b (FR-SUB-01). |
| Adviser | Advisees, Review queue, Consultations, Availability, Defense Day, Submission | Defense Day: the scheduled start (BR-10). Submission: Gate 1b. |
| Panel Member | Assignments, Manuscript, Availability, Defense Day, Submission | Manuscript: the appointment form and the member's NDA are recorded (BR-08). Defense Day: the scheduled start. Submission: Gate 1b. |
| Coordinator | Overview, Students, Committees, Documents, Schedule, Defense, Clearance, Templates, Users, Audit, Submission | None |
