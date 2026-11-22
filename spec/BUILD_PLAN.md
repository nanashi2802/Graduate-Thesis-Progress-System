# BUILD PLAN — PUP CpE Thesis Progress Monitoring System

**Compliance standard:** Simplified Technical English (ASD-STE100) at about 80%
**Version:** 1.0 draft · 22 Nov 2026 · Change log: 22 Nov 2026, added §2.1 Phase 0 progress. 22 Nov 2026, owner approved fixes to P0-E02 to P0-E06 (D-23 sign-in, write-once and CORS checks, `sin1` region, Vercel env, cron timing, scan sizes), the Phase 0 dependencies, the §1 hook gate and the §7 `src/app/` layout.
**Derived from:** `PRD.md` §8 (release phases, approved as D-22), `ERD.md`, `DFD.md`, `SITEMAP.md`, `USERFLOW.md`, Functional Requirements v1.1
**Rule for this file:** This plan orders the work. It adds no requirement. The FR, BR, NFR and INV IDs it cites are the scope. If this plan and a spec file disagree, the spec file wins. Correct this plan.

---

## 0. How to use and expand this plan (for agents)

This plan is a skeleton. It has three levels. Expand one level at a time, only for the work that starts next.

| Level | ID form | Example | Expand when |
| :---- | :---- | :---- | :---- |
| Phase | `P0` to `P4` | `P1` Foundation and Milestone 1 | Fixed. Do not add phases. |
| Epic | `P<n>-E<nn>` | `P1-E03` Accounts and templates | At the start of the phase |
| Task | `P<n>-E<nn>-T<nn>` | `P1-E03-T02` Create Student account | At the start of the epic |

**Expansion steps:**
1. Pick the next epic whose dependencies are done.
2. Read every spec section the epic cites. Read `AGENTS.md` first.
3. Split the epic into tasks of about half a day each. Use the task template (§0.1).
4. Show the tasks to the human. Wait for approval (AGENTS.md §4).
5. Do one task. Meet its "Done when" list. Then do the next task.

**Expansion rules:**
- Each task cites at least one FR, BR, NFR or INV ID. A task with no ID is out of scope. Ask the human.
- Each task has a "Done when" list that a test or a command can check.
- Write the test first when the task enforces an `INV-nn` or a state change (`ERD.md` §6, §7).
- Do not build deferred items (`AGENTS.md` §9). Do not add a dependency or a service without asking (`AGENTS.md` §10).
- When a task changes a spec file, write a new version or a change-log line. Do not change a rule without the human.

### 0.1 Task template

```markdown
### P<n>-E<nn>-T<nn> — <short name>
- **Goal:** <one sentence>
- **Covers:** <FR-..., BR-..., NFR-..., INV-...>
- **Reads:** <spec file and section>
- **Changes:** <files or folders>
- **Depends on:** <task IDs, or "none">
- **Done when:**
  - [ ] <checkable result, for example "test X passes">
  - [ ] <checkable result>
- **Tests:** <unit (Vitest) / end-to-end (Playwright) / manual check>
```

### 0.2 Definition of done (every task)

- [ ] Type check, lint and tests pass (commands in `AGENTS.md` §12, after P0-E01).
- [ ] The server data layer checks access for every new read and write (NFR-01).
- [ ] Every disabled action shows its reason (BR-18).
- [ ] UI text and docs follow ASD-STE100 at about 80% (`AGENTS.md` §5). Terms follow `AGENTS.md` §8.
- [ ] Times show in Philippine Standard Time (NFR-11).
- [ ] No secret, real student data or real manuscript is in the repository (`AGENTS.md` §11).
- [ ] The commit message names the IDs it covers. It has no AI attribution (`AGENTS.md` §2).

---

## 1. Gates before each phase

| Before | Needs | Owner |
| :---- | :---- | :---- |
| P0 | Release phases approved | **Done** (D-22) |
| P0 | Enforcement files exist (`AGENTS.md` §3) | **Files done.** Still open: the human turns on the hook once (`git config core.hooksPath .githooks`). It was not on at 22 Nov 2026. The human makes the CI check required on `main`. |
| P1 | `ERD.md` v1.1 approved | Owner |
| P1 | BR-21 and INV-33 default accepted (access ends at the final copy) | Owner |
| P1 | `DESIGN.md` D-01 (PUP Gold) and D-02 (font and neutrals) decided | Owner |
| P1 | P0 spike report accepted (P0-E06) | Owner |
| P2 | Official form layouts in hand for the form pack (AS-08) | Owner |
| Pilot | Success targets (PRD §9, Q3). Retention period (Q8). | Owner, PUP Data Protection Officer |

---

## 2. Phase 0 — Technical spike

**Goal:** Prove the free-tier stack works for our hard parts. Answer R12, R13, AS-11, AS-12 and AS-13.
**Exit test (PRD §8):** The spike report (P0-E06) answers R12 and R13 and settles AS-11.
**Rule:** Spike code is throwaway unless the human says to keep it. It uses fake data only.

| Epic | Name | Covers | Done when |
| :---- | :---- | :---- | :---- |
| P0-E01 | Scaffold and tooling | PRD §11.2 | A Next.js 16 app with TypeScript strict, Tailwind, shadcn/ui, Vitest and Playwright runs locally. `AGENTS.md` §12 lists the real commands. `.env.example` exists. CI runs lint, type check and tests. |
| P0-E02 | Database and data-layer choice | NFR-01, PRD §11.5 rule 4 | `[CONFIRM]` The human picks the query and migration tool before E02 starts (none is chosen in the PRD). The agent gives a short comparison first. One table migrates on Neon. One server-only data-layer function reads it with an access check and a test. |
| P0-E03 | Sign-in | FR-ACC-01, FR-ACC-02, FR-ACC-04, FR-ACC-05, BR-03, D-23 | A fake user signs in with Neon Auth by email and password. The server makes a fake user while open sign-up is off (Coordinator path). A Google user with no account made by the Coordinator cannot sign in and gets no account. A route for one role shows Access Denied to another role. |
| P0-E04 | Files: signed upload, hash check, PDF view | NFR-02, NFR-10, NFR-12, INV-09, BR-19, DFD T1 to T5 | The browser hashes a fake 100-page PDF, uploads it with a signed write-once link, and the server checks the hash. A second upload to the same key fails (test `If-None-Match` or an equal guard on Neon storage). CORS on `thesis-files` allows only the app origins. The viewer loads pages by range requests. The server never receives the bytes. A 4.5 MB+ file works. |
| P0-E05 | Deploy, daily job and email | FR-NTF-02, FR-NTF-06, NFR-11, DFD T6 | The Vercel project exists and links to the repository. Functions run in region `sin1` (`vercel.json`), near the Neon database. Vercel has every name in `.env.example`, with new production secrets. The app deploys to Vercel Hobby. The daily cron runs between 00:00 and 00:59 UTC (Hobby timing) and logs. One Resend email sends with a link only. |
| P0-E06 | Measure and report | AS-11, AS-12, AS-13, R12, R13 | A spike report in `spec/spikes/P0-report.md` gives: MB per page from sample files, sizes and page counts of fake scans (PDF and image) of the TDW forms (layouts from `docs/reference/tdw-forms/`; the blank `.doc` files are not the measure), whether downloads count against the transfer limit, file store issues, and an updated capacity estimate (PRD §11.4). |

Dependencies: E01 → E02 → E03 → E04. E01 → E05. E04 and E05 → E06.

### 2.1 Phase 0 progress (updated 22 Nov 2026)

`[x]` = done and checked. `[~]` = started. `[ ]` = not started. An epic is done only when all its "Done when" items are done.

**Service setup (before P0-E01)**
- [x] Neon org `ThesIsko` and project `ThesIsko` exist, in `aws-ap-southeast-1`, Postgres 17, Free plan.
- [x] Neon Auth is on for branch `main`. Email and password are on. Open sign-up is off (FR-ACC-04, FR-ACC-05).
- [x] Google sign-in is on with the shared Neon key for development (D-23).
- [x] Neon Object Storage has one private bucket, `thesis-files`. It holds all files, sorted by key prefix (NFR-12).
- [x] Resend account and API key exist. It sends from `onboarding@resend.dev` only.
- [x] The human signed in to the Vercel CLI. No Vercel project exists yet.
- [x] `.env.example` exists. `.env.local` is filled and ignored by git (AGENTS.md §11).
- [ ] The human turns on the commit hook: `git config core.hooksPath .githooks` (§1 gate). It is not on in this clone.

**Epics**
- [~] P0-E01 Scaffold and tooling. Done: `.env.example`. Not done: app, Tailwind, shadcn/ui, Vitest, Playwright, CI jobs, `AGENTS.md` §12 commands.
- [~] P0-E02 Database and data layer. Done: the Neon database exists. Not done: the `[CONFIRM]` tool choice, one migration, one data-layer read with a test.
- [~] P0-E03 Sign-in. Done: Neon Auth is set up. Not done: a fake user signs in, the Access Denied route.
- [~] P0-E04 Files. Done: the bucket exists. Not done: signed upload, hash check, range-request viewer.
- [~] P0-E05 Deploy, daily job and email. Done: the Resend key, the Vercel sign-in. Not done: Vercel project, deploy, cron, test email.
- [ ] P0-E06 Measure and report.

---

## 3. Phase 1 — Foundation and Milestone 1

**Goal:** One Student completes the Proposal Defense and reaches `CERTIFIED`.
**Exit test (PRD §8):** An end-to-end test runs one fake Student from account creation to `CERTIFIED`, with every role.

| Epic | Name | Covers | Main spec |
| :---- | :---- | :---- | :---- |
| P1-E01 | Schema from the ERD (all Phase 1 tables) | ERD §3, §4, INV-01 to INV-11, INV-26 | `ERD.md` |
| P1-E02 | Data layer and row access | NFR-01, FR-ACC-03, BR-04, BR-08, ERD §8, INV-24, INV-33 | `ERD.md` §8, `DFD.md` TB1, TB2 |
| P1-E03 | Accounts, users and templates | FR-ACC-01 to 08, FR-TPL-01 to 05, BR-03 | `SITEMAP.md` C2, C8, C9 |
| P1-E04 | Milestone state machine and gates | FR-WFL-01 to 09, 13, 14, BR-02, BR-13, ERD §7.1, INV-17 to INV-21 | `ERD.md` §7, `USERFLOW.md` §4 |
| P1-E05 | Committee appointment | FR-CMT-01 to 06, BR-08 | `SITEMAP.md` C3, P1 |
| P1-E06 | Manuscript workspace and threads (contexts A and B) | FR-REV-01 to 07, 09, 11, BR-05 to BR-07, INV-05 to INV-07 | `SITEMAP.md` S2, A2, P2 |
| P1-E07 | Documents and compliance (Milestone 1) | FR-DOC-01 to 04, 06 to 08, 11, BR-12, BR-19 | `SITEMAP.md` S3, C4 |
| P1-E08 | Consultations and availability | FR-SCH-01 to 08, BR-16 | `SITEMAP.md` S4, A3, A4, P3 |
| P1-E09 | Defense (Milestone 1, TDW 08) | FR-DEF-01 to 12, BR-09 to BR-11, INV-12 to INV-16 | `USERFLOW.md` §6.2, §6.3, `DFD.md` §5.2 |
| P1-E10 | Certification and data gathering | FR-WFL-06, FR-WFL-11, FR-REV-13, INV-34 | `USERFLOW.md` §3 |
| P1-E11 | Dashboards | FR-TRK-01 to 04, NFR-04 | `SITEMAP.md` S1, A1, P1, C1 |
| P1-E12 | Audit log and in-app notifications | FR-RPT-01, FR-NTF-01, NFR-03, INV-08 | `DFD.md` T7, §5.3 |
| P1-E13 | Milestone 1 end-to-end test and fake seed data | Exit test | `USERFLOW.md` §5 |

Order: E01 → E02 → E03 → E04 → (E05, E06, E07, E08 in any order) → E09 → E10 → E11, E12 → E13.

---

## 4. Phase 2 — Milestone 2 and email

**Goal:** One Student completes the Pre-Final Defense.

| Epic | Name | Covers |
| :---- | :---- | :---- |
| P2-E01 | Outside statuses (IPMO gate in Milestone 2) | FR-WFL-03, FR-WFL-10, BR-14, INV-27 |
| P2-E02 | TDW 09 and TDW 10 (comments-only sheet) | FR-DEF-02, FR-DEF-05, FR-DOC-08 |
| P2-E03 | Revision items (Proposal and Pre-Final) | FR-REV-13, INV-21 |
| P2-E04 | Event emails, digests and preferences | FR-NTF-02 to 09, NFR-05, INV-28 to INV-30 |
| P2-E05 | Milestone 2 end-to-end test | Exit test |

---

## 5. Phase 3 — Milestone 3 and clearance

**Goal:** One Student reaches `CLEARED`.

| Epic | Name | Covers |
| :---- | :---- | :---- |
| P3-E01 | Final Panel appointment (TDW 11) and TDW 12, TDW 13 | FR-CMT-01, FR-DEF-05, FR-DEF-06 |
| P3-E02 | Defense Day threads (context C) | FR-REV-12, FR-REV-15, BR-20, INV-23 |
| P3-E03 | Gate 2 and the signed final manuscript | FR-WFL-07, INV-22, INV-34 |
| P3-E04 | Clearance checklist and close | FR-CLR-01 to 04, BR-21 |
| P3-E05 | Shared submission view and dossier export | FR-SUB-01 to 05, FR-DOC-10 |
| P3-E06 | Milestone 3 end-to-end test | Exit test |

---

## 6. Phase 4 — Enhancements (chosen by value)

The human picks from this list. Each item already has an FR.

| Item | Covers |
| :---- | :---- |
| Change notes and Addressed tags | FR-REV-08 |
| Comment-response export | FR-REV-14 |
| Form pack and forms guide | FR-DOC-05, FR-DOC-09 |
| Key dates and pacing flags | FR-TRK-05, FR-TRK-06 (needs G24) |
| Audit viewer and CSV reports | FR-RPT-02, FR-RPT-03 |
| Template versioning and email wording | FR-TPL-04, FR-NTF-10 |
| Search and saved filters | FR-RPT-04 |

---

## 7. Proposed repository layout `[CONFIRM]`

P0-E01 confirms this layout and records it in `AGENTS.md` §12. All code is in `src/`. Next.js reads routes from `src/app/`.

| Path | Holds |
| :---- | :---- |
| `src/app/(auth)/login` | Sign-in route |
| `src/app/student/`, `src/app/adviser/`, `src/app/panel/`, `src/app/coordinator/` | The 29 role routes (`SITEMAP.md` §3) |
| `src/server/data/` | The one server-side data layer. Every read and write goes here (NFR-01). |
| `src/server/domain/` | State machines and invariant checks (`ERD.md` §6, §7), with no framework code |
| `src/server/files/` | Signed links and hash checks (P11.0) |
| `src/server/notify/` | Events, emails and the daily job (P9.0) |
| `src/components/` | Shared UI from `DESIGN.md` |
| `db/migrations/` | Migrations from `ERD.md` |
| `tests/unit/`, `tests/e2e/` | Vitest and Playwright tests |
