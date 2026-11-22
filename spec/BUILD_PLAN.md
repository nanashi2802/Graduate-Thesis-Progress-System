# BUILD PLAN — PUP CpE Thesis Progress Monitoring System

**Compliance standard:** Simplified Technical English (ASD-STE100) at about 80%
**Version:** 1.0 draft · 22 Nov 2026 · Change log: 22 Nov 2026, added §2.1 Phase 0 progress. 22 Nov 2026, owner approved fixes to P0-E02 to P0-E06 (D-23 sign-in, write-once and CORS checks, `sin1` region, Vercel env, cron timing, scan sizes), the Phase 0 dependencies, the §1 hook gate and the §7 `src/app/` layout. 22 Nov 2026, expanded P0-E01 into tasks (§2.2) and marked it done. pnpm chosen by the owner. §7 confirms the folders that P0-E01 made. 22 Nov 2026, the owner added §8 (two-agent tracks, `AGENTS.md` §13) and accepted two changes: the audit insert moves from P1-E12 to P1-E02, and the pure state machines of P1-E04 start early in Track B. The commit hook is on.
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
| P0 | Enforcement files exist (`AGENTS.md` §3) | **Files done. Hook on** (22 Nov 2026). Still open: the human makes the CI checks required on `main` and `dev`. |
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
- [x] The human turned on the commit hook: `git config core.hooksPath .githooks` (§1 gate).

**Epics**
- [x] P0-E01 Scaffold and tooling. Done: `.env.example`, the Next.js 16 app, Tailwind v4, shadcn/ui, Vitest, Playwright, the CI workflow, `AGENTS.md` §12 commands. The first CI run happens at the first push. Tasks: §2.2.
- [x] P0-E02 Database and data layer. Done: Drizzle ORM and drizzle-kit (AD-A-001), migration `0000_app_user` on Neon, `getUser` with an access check and PGlite tests (AD-A-002). Tasks: §2.5.
- [x] P0-E03 Sign-in. Done: email and password sign-in, the Coordinator path, the account block for sign-ins with no account, Access Denied on each portal. Open: a manual check with a real Google user. Tasks: §2.6.
- [x] P0-E04 Files. Done: signed write-once upload, hash check, CORS rule, range-request viewer, 4.5 MB+ file. Tasks: §2.7.
- [~] P0-E05 Deploy, daily job and email. Done: the Resend key, the Vercel sign-in. Not done: Vercel project, deploy, cron, test email.
- [ ] P0-E06 Measure and report.

### 2.2 P0-E01 tasks (done 22 Nov 2026)

**Decisions in this epic:** pnpm is the package manager (owner). No web font loads, and the shadcn/ui neutral theme stays, because `DESIGN.md` D-01 and D-02 are open. `next.config.ts` sets `agentRules: false`, so `next dev` does not write into `AGENTS.md`. No library was added beyond PRD §11.2.

### P0-E01-T01 — Next.js app and TypeScript strict
- **Goal:** A Next.js 16 App Router app runs from `src/app/` with pnpm.
- **Covers:** PRD §11.2
- **Reads:** PRD §11.2, `AGENTS.md` §10, §11
- **Changes:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`), `next.config.ts`, `eslint.config.mjs`, `src/app/`, `.gitignore`
- **Depends on:** none
- **Done when:**
  - [x] `pnpm dev` serves `/` on port 3000.
  - [x] `pnpm typecheck`, `pnpm lint` and `pnpm build` pass.
- **Tests:** manual check, commands

### P0-E01-T02 — Tailwind and shadcn/ui
- **Goal:** shadcn/ui runs on Tailwind v4 with Lucide icons.
- **Covers:** PRD §11.2
- **Reads:** PRD §11.2, `DESIGN.md` D-01, D-02
- **Changes:** `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- **Depends on:** P0-E01-T01
- **Done when:**
  - [x] The home page shows a shadcn/ui button with a Lucide icon.
  - [x] `pnpm build` passes.
- **Tests:** end-to-end (Playwright)

### P0-E01-T03 — Vitest
- **Goal:** Unit tests run with Vitest from `tests/unit/`.
- **Covers:** PRD §11.2, §0.2
- **Reads:** PRD §11.2
- **Changes:** `vitest.config.ts`, `tests/unit/smoke.test.ts`
- **Depends on:** P0-E01-T02
- **Done when:**
  - [x] `pnpm test` runs one test and it passes.
- **Tests:** unit (Vitest)

### P0-E01-T04 — Playwright
- **Goal:** End-to-end tests run with Playwright from `tests/e2e/`.
- **Covers:** PRD §11.2
- **Reads:** PRD §11.2
- **Changes:** `playwright.config.ts`, `tests/e2e/home.spec.ts`
- **Depends on:** P0-E01-T02
- **Done when:**
  - [x] `pnpm test:e2e` builds the app, starts it and passes on Chromium.
- **Tests:** end-to-end (Playwright)

### P0-E01-T05 — CI workflow
- **Goal:** GitHub Actions runs lint, type check, unit tests, the build and the end-to-end tests.
- **Covers:** PRD §11.2
- **Reads:** `AGENTS.md` §3
- **Changes:** `.github/workflows/ci.yml` (new). `commit-policy.yml` did not change.
- **Depends on:** P0-E01-T03, P0-E01-T04
- **Done when:**
  - [x] The workflow file is valid YAML. Each step's command passes locally.
  - [ ] The first CI run passes on GitHub (after the owner pushes). The owner makes the `ci` check required on `main`.
- **Tests:** CI

### P0-E01-T06 — Record commands and layout
- **Goal:** `AGENTS.md` §12 lists the real commands and points to the layout.
- **Covers:** `AGENTS.md` §12, §7 of this plan
- **Reads:** `AGENTS.md` §12
- **Changes:** `AGENTS.md` §12, this file (§2.1, §2.2, §7), `README.md`
- **Depends on:** P0-E01-T05
- **Done when:**
  - [x] Every command in `AGENTS.md` §12 runs.
  - [x] §2.1 shows P0-E01 as done.
- **Tests:** manual check

### 2.5 P0-E02 tasks (agent-a, done 22 Nov 2026)

**Decisions in this epic:** AD-A-001 (Drizzle ORM and drizzle-kit), AD-A-002 (PGlite for data-layer tests), AD-A-003 (Neon branch). See `spec/AGENT_DECISIONS.md`.

### P0-E02-T01 — Query and migration tool
- **Goal:** Pick and install the query and migration tool. Log the choice.
- **Covers:** NFR-01, PRD §11.3 rule 4
- **Reads:** PRD §11.2, §11.3, `ERD.md` §1
- **Changes:** `package.json`, `pnpm-lock.yaml`, `drizzle.config.ts`, `spec/AGENT_DECISIONS.md`
- **Depends on:** P0-E01
- **Done when:**
  - [x] AD-A-001 and AD-A-002 are in the decision log.
  - [x] `pnpm db:generate` writes SQL into `db/migrations/`.
- **Tests:** command

### P0-E02-T02 — First table and migration
- **Goal:** The `app` schema, the `user_role` enum and the `app_user` table migrate on Neon.
- **Covers:** BR-03, `ERD.md` §1, §2, §4.1 (`app_user`)
- **Reads:** `ERD.md` §1, §2, §4.1
- **Changes:** `src/server/data/schema.ts`, `db/migrations/`
- **Depends on:** P0-E02-T01
- **Done when:**
  - [x] `pnpm db:migrate` applies the migration on the Neon branch (AD-A-003).
  - [x] A unit test applies the same migration files to PGlite.
- **Tests:** unit (Vitest), command

### P0-E02-T03 — Server-only data layer with an access check
- **Goal:** One server-only function reads `app_user` after an access check.
- **Covers:** NFR-01, FR-ACC-03, `ERD.md` §8
- **Reads:** `ERD.md` §8, `DFD.md` TB1, TB2
- **Changes:** `src/server/data/` (client, access check, `users.ts`), `tests/unit/data/`
- **Depends on:** P0-E02-T02
- **Done when:**
  - [x] A Coordinator reads any user. A user reads their own row. Any other read throws `AccessDeniedError`.
  - [x] An inactive actor gets `AccessDeniedError` (FR-ACC-06).
  - [x] Each query module in `src/server/data/` imports `server-only`, so a client import fails the build. A unit test checks it.
- **Tests:** unit (Vitest with PGlite)

### 2.6 P0-E03 tasks (agent-a, done 22 Nov 2026)

**Decisions in this epic:** AD-A-004 (`@neon/auth`), AD-A-005 (the app account is the `app_user` row), AD-A-006 (Coordinator path and the bootstrap Coordinator).

### P0-E03-T01 — Neon Auth server and API route
- **Goal:** The app talks to Neon Auth through one server instance and the `/api/auth` route.
- **Covers:** FR-ACC-01, D-23
- **Reads:** PRD §11.2, D-23
- **Changes:** `package.json`, `src/server/auth/neon-auth.ts`, `src/app/api/auth/[...path]/route.ts`
- **Depends on:** P0-E02
- **Done when:**
  - [x] `pnpm build` passes with no Neon Auth variables (CI).
- **Tests:** command

### P0-E03-T02 — Account resolution and the Coordinator path
- **Goal:** A Neon Auth user maps to one `app_user` row. Only the Coordinator makes accounts.
- **Covers:** FR-ACC-04, FR-ACC-05, FR-ACC-06, BR-03, D-23, NFR-01
- **Reads:** `ERD.md` §4.1, §8
- **Changes:** `src/server/data/actors.ts`, `src/server/data/accounts.ts`, `src/server/auth/admin.ts`, `scripts/seed-dev.mjs`
- **Depends on:** T01
- **Done when:**
  - [x] A Neon Auth user with no `app_user` row gets no actor, and no row is made (unit test).
  - [x] The first sign-in links the row by email. A linked row never moves to another Neon Auth user (unit test).
  - [x] Only an active Coordinator can call `createAccount` (unit test).
  - [x] `pnpm db:seed-dev` makes fake users through `admin/create-user` while open sign-up is off.
- **Tests:** unit (Vitest with PGlite), command

### P0-E03-T03 — `/login`, portal gates and Access Denied
- **Goal:** Users sign in by email and password or Google. Each portal is open to its role only.
- **Covers:** FR-ACC-01, FR-ACC-02, BR-18, D-23
- **Reads:** `SITEMAP.md` §3, rule 1
- **Changes:** `src/app/(auth)/login/`, `src/app/auth/after-sign-in/`, `src/app/_components/`, `src/app/<portal>/layout.tsx`, `src/app/<portal>/dashboard/page.tsx`, `src/server/auth/session.ts`, `tests/e2e/sign-in.spec.ts`, `playwright.config.ts`
- **Depends on:** T02
- **Done when:**
  - [x] A fake Student signs in and reaches `/student/dashboard` (end-to-end, local).
  - [x] The Student sees Access Denied, with the reason, on `/coordinator/dashboard` (end-to-end, local).
  - [x] A Neon Auth user with no account is signed out at once and sees the reason (end-to-end, local).
  - [ ] A real Google user with no account is blocked. Manual check by the human: the test needs a real Google sign-in.
- **Tests:** unit, end-to-end (Playwright, local only: CI has no Neon secrets)

### 2.7 P0-E04 tasks (agent-a, done 22 Nov 2026)

**Decisions in this epic:** AD-A-007 (AWS S3 SDK), AD-A-008 (CORS rule and key prefix), AD-A-009 (spike screen and PDF viewer).
**Storage facts found (for P0-E06):** Neon Object Storage honors `If-None-Match: *` on PUT (HTTP 412 on a second write), `x-amz-checksum-sha256` (HTTP 400 `BadDigest` on other bytes), signed `content-length` and `content-type` (HTTP 403 on another size or type), range GET (HTTP 206), and returns the stored SHA-256 on HEAD with checksum mode.

### P0-E04-T01 — Signed write-once upload and hash check
- **Goal:** The server issues an upload link signed with the hash, size, type and `If-None-Match: *`, and checks the stored hash after upload.
- **Covers:** NFR-02, NFR-10, NFR-12, INV-09, BR-19, DFD T1 to T4
- **Reads:** `DFD.md` §4 (T1 to T5), PRD §11.3, FR NFR-10
- **Changes:** `package.json`, `src/server/files/rules.ts`, `src/server/files/storage.ts`, `tests/unit/files-rules.test.ts`
- **Depends on:** P0-E03
- **Done when:**
  - [x] Unit tests cover the type, size and hash rules (NFR-10, NFR-02) and the write-once key (INV-09).
  - [x] A second PUT to the same key fails with HTTP 412 on Neon storage.
  - [x] Other bytes fail with `BadDigest`. A PUT with no `If-None-Match` fails the signature.
- **Tests:** unit, end-to-end (local)

### P0-E04-T02 — CORS rule on `thesis-files`
- **Goal:** Only the app origins can use the bucket from a browser.
- **Covers:** NFR-12, DFD T2, T5
- **Changes:** `scripts/set-storage-cors.mjs`
- **Depends on:** the Vercel domain from agent-b (AD-B-001)
- **Done when:**
  - [x] `pnpm storage:cors` sets GET, HEAD and PUT for localhost, the production origin and the preview pattern. DELETE is not allowed.
  - [x] A preflight from another origin gets HTTP 403.
- **Tests:** manual check (`curl` preflight)

### P0-E04-T03 — Browser hash, direct upload and range viewer
- **Goal:** The browser hashes a fake 100-page PDF, uploads it straight to storage and views it by page ranges.
- **Covers:** NFR-02, NFR-12, PRD §11.3 rules 1 to 3, DFD T1 to T5
- **Changes:** `src/app/coordinator/spike-files/`, `tests/support/fake-pdf.ts`, `tests/e2e/files.spec.ts`
- **Depends on:** T01, T02
- **Done when:**
  - [x] A 5.3 MB, 100-page fake PDF uploads and passes the hash check (end-to-end, local).
  - [x] No request to the app carries a body of 64 KB or more (the server never receives the bytes).
  - [x] The viewer shows page 1 of 100 with range requests.
- **Tests:** end-to-end (Playwright, local only)

---

### 2.3 P0-E05 tasks (Track B, `agent-b`)

**Decisions in this epic:** `spec/AGENT_DECISIONS.md` AD-B-001 to AD-B-004.

### P0-E05-T01 — Vercel project and Git link
- **Goal:** Make the Vercel project, link it to the repository, and send `agent-a` the domain for CORS.
- **Covers:** DFD T6, NFR-12 (CORS origins for P0-E04)
- **Reads:** `PRD.md` §11.2, `AGENTS.md` §13.8
- **Changes:** Vercel project settings only
- **Depends on:** P0-E01
- **Done when:**
  - [x] `vercel project ls` shows the project. Its Git repository is this repository. The production branch is `main`.
  - [x] `agent-a` has the production origin and the preview origin pattern.
- **Tests:** manual check (`vercel project inspect`)

### P0-E05-T02 — `vercel.json`: region and cron
- **Goal:** Run functions in `sin1` and schedule the daily job in the Hobby window.
- **Covers:** FR-NTF-06, NFR-11
- **Changes:** `vercel.json`
- **Depends on:** T01
- **Done when:**
  - [x] `vercel.json` sets `regions: ["sin1"]` and one cron at `0 0 * * *` (00:00 to 00:59 UTC on Hobby).
- **Tests:** unit test reads `vercel.json`

### P0-E05-T03 — Daily job route
- **Goal:** A cron route that accepts only the Vercel cron secret and logs one line with the PST date.
- **Covers:** FR-NTF-06, NFR-11, DFD T6
- **Changes:** `src/app/api/cron/daily/route.ts`, `src/server/notify/`
- **Depends on:** T02
- **Done when:**
  - [x] A request without `Authorization: Bearer <CRON_SECRET>` gets 401.
  - [x] A good request gets 200 and logs the run with the PST date.
- **Tests:** unit (Vitest)

### P0-E05-T04 — Resend email with a link only
- **Goal:** Send one test email through the Resend API. It holds the event, the next action, the deadline and a link only.
- **Covers:** FR-NTF-02, `AGENTS.md` §10 (email content)
- **Changes:** `src/server/notify/`
- **Depends on:** T03
- **Done when:**
  - [x] A unit test checks the email body: event, next action, deadline, link, and nothing else.
  - [x] The daily job sends one test email when `NOTIFY_TEST_TO` is set.
- **Tests:** unit (Vitest), manual check of one real send

### P0-E05-T05 — Environment and production deploy
- **Goal:** Put every name in `.env.example` into Vercel with new production secrets, and deploy `dev` to production.
- **Covers:** NFR-11, `AGENTS.md` §11, §13.8
- **Changes:** Vercel environment variables
- **Depends on:** T04 merged into `dev`
- **Done when:**
  - [x] `vercel env ls` shows every name in `.env.example` for Production and Preview.
  - [x] `CRON_SECRET` and `NEON_AUTH_COOKIE_SECRET` in production are new values, not the local ones.
  - [x] `vercel deploy --prod` from a clean checkout of `dev` succeeds, and the home page loads. (22 Nov 2026, `dev` at `3705e97`, deployment `dpl_DRqirx4E673oQjobsnhPcKKCKCw9`, alias `https://thesisko-tau.vercel.app`)
  - [x] A manual run of the cron route on production logs the run and sends the test email. (`vercel crons run /api/cron/daily`: status 200, log `[daily-job] run ... PST date 2026-11-22` and `test email sent`. A request with no secret gets 401.)
- **Tests:** manual check (`vercel logs`)

### 2.4 P0-E06 tasks (Track B, `agent-b`)

### P0-E06-T01 — Fake TDW scans and MB per page
- **Goal:** Make fake scans (PDF and image) of the 13 TDW form layouts and a fake 100-page manuscript, and measure MB per page.
- **Covers:** AS-11, AS-12, NFR-10
- **Reads:** `docs/reference/tdw-forms/text/`, `PRD.md` §11.4
- **Changes:** `spec/spikes/fake_scans.py`, `spec/spikes/P0-scan-sizes.md`
- **Depends on:** none
- **Done when:**
  - [x] `python spec/spikes/fake_scans.py` makes the files and prints the size tables.
  - [x] `spec/spikes/P0-scan-sizes.md` holds the tables. No generated file is committed.
- **Tests:** manual check (run the script)

### P0-E06-T02 — Transfer-limit and file store test
- **Goal:** Check whether downloads count against the Neon 5 GB transfer limit, and record file store issues.
- **Covers:** AS-13, R12, R13, NFR-12, NFR-13
- **Depends on:** P0-E04 merged into `dev`
- **Done when:**
  - [x] A known number of MB is downloaded from `thesis-files` under the `agent-b/` prefix, and the Neon usage before and after is recorded. (100 MB on 22 Nov 2026, `spec/spikes/transfer_test.mjs`, results in `spec/spikes/P0-report.md` §3)
- **Tests:** manual check

### P0-E06-T03 — Spike report
- **Goal:** Write `spec/spikes/P0-report.md` with the answers to R12, R13, AS-11 to AS-13, and an updated capacity estimate (PRD §11.4).
- **Covers:** AS-11, AS-12, AS-13, R12, R13
- **Depends on:** T01, T02, P0-E05-T05
- **Done when:**
  - [x] The report exists and each item has an answer or a stated open point for the human.
- **Tests:** review by `agent-a` (§8 step 4)

## 3. Phase 1 — Foundation and Milestone 1

**Goal:** One Student completes the Proposal Defense and reaches `CERTIFIED`.
**Exit test (PRD §8):** An end-to-end test runs one fake Student from account creation to `CERTIFIED`, with every role.

| Epic | Name | Covers | Main spec |
| :---- | :---- | :---- | :---- |
| P1-E01 | Schema from the ERD (all Phase 1 tables) | ERD §3, §4, INV-01 to INV-11, INV-26 | `ERD.md` |
| P1-E02 | Data layer and row access, plus the audit insert (moved from P1-E12) | NFR-01, NFR-03, FR-ACC-03, BR-04, BR-08, ERD §8, INV-08, INV-24, INV-33 | `ERD.md` §8, `DFD.md` TB1, TB2, T7 |
| P1-E03 | Accounts, users and templates | FR-ACC-01 to 08, FR-TPL-01 to 05, BR-03 | `SITEMAP.md` C2, C8, C9 |
| P1-E04 | Milestone state machine and gates | FR-WFL-01 to 09, 13, 14, BR-02, BR-13, ERD §7.1, INV-17 to INV-21 | `ERD.md` §7, `USERFLOW.md` §4 |
| P1-E05 | Committee appointment | FR-CMT-01 to 06, BR-08 | `SITEMAP.md` C3, P1 |
| P1-E06 | Manuscript workspace and threads (contexts A and B) | FR-REV-01 to 07, 09, 11, BR-05 to BR-07, INV-05 to INV-07 | `SITEMAP.md` S2, A2, P2 |
| P1-E07 | Documents and compliance (Milestone 1) | FR-DOC-01 to 04, 06 to 08, 11, BR-12, BR-19 | `SITEMAP.md` S3, C4 |
| P1-E08 | Consultations and availability | FR-SCH-01 to 08, BR-16 | `SITEMAP.md` S4, A3, A4, P3 |
| P1-E09 | Defense (Milestone 1, TDW 08) | FR-DEF-01 to 12, BR-09 to BR-11, INV-12 to INV-16 | `USERFLOW.md` §6.2, §6.3, `DFD.md` §5.2 |
| P1-E10 | Certification and data gathering | FR-WFL-06, FR-WFL-11, FR-REV-13, INV-34 | `USERFLOW.md` §3 |
| P1-E11 | Dashboards | FR-TRK-01 to 04, NFR-04 | `SITEMAP.md` S1, A1, P1, C1 |
| P1-E12 | Audit log records for each event, and in-app notifications (the audit insert itself is in P1-E02) | FR-RPT-01, FR-NTF-01, NFR-03, INV-08 | `DFD.md` T7, §5.3 |
| P1-E13 | Milestone 1 end-to-end test and fake seed data | Exit test | `USERFLOW.md` §5 |

Order: E01 → E02 → E03 → E04 → (E05, E06, E07, E08 in any order) → E09 → E10 → E11, E12 → E13.

### 3.1 P1-E04 domain part (Track B, `agent-b`, look-ahead)

**Decisions:** AD-B-005 to AD-B-007. The wiring to the data layer and the gate screens stays with `agent-a` (§8 Phase 1 step 4).

### P1-E04-T01 — Milestone state machine (pure)
- **Goal:** One function decides each status change of ERD §7.1, with the actor and the guard, and gives a reason for each refusal.
- **Covers:** FR-WFL-02, FR-WFL-08, FR-WFL-09, FR-WFL-13, BR-02, BR-13, BR-18, INV-12, INV-13, INV-15 to INV-18
- **Reads:** `ERD.md` §7.1, Operational Flow v3.1 §4.7
- **Changes:** `src/server/domain/milestone.ts`, `tests/unit/domain/milestone.test.ts`
- **Depends on:** none (pure code)
- **Done when:**
  - [x] Each of the 16 rows of ERD §7.1 has a test for its actor and its guard.
  - [x] INV-17: only the Coordinator sets `CLOSED`, `CERTIFIED`, `FINAL_APPROVED` and `CLEARED`.
  - [x] Each refusal has a code and a message.
- **Tests:** unit (Vitest)

### P1-E04-T02 — Gate checks for one actor (pure)
- **Goal:** Check one actor's Gate 1a, Gate 1b, Gate 2 or Return before the data layer writes the `gate_action` row.
- **Covers:** FR-WFL-03 to FR-WFL-05, FR-WFL-07, BR-13, BR-20, INV-19 to INV-22
- **Changes:** `src/server/domain/gates.ts`, `tests/unit/domain/gates.test.ts`
- **Depends on:** T01
- **Done when:**
  - [x] Tests cover open threads, IPMO in Milestone 2, Pre-Final revision items in Milestone 3, IPMO and RPO at Gate 2, and the Return reason and purpose.
- **Tests:** unit (Vitest)

### 3.2 P1-E14 Shared UI parts (Track B, `agent-b`, §8 Phase 1 step 2)

**Decisions:** AD-B-008 to AD-B-010. **Main spec:** `DESIGN.md` §3, §4, §6, §7, §11. Screens import these parts. They hold no data access.

### P1-E14-T01 — Design tokens and fonts
- **Goal:** The app uses the `DESIGN.md` §11 colors, radii, status tones and the three fonts.
- **Covers:** NFR-04, NFR-06, `DESIGN.md` §3, §4, §11
- **Changes:** `src/app/globals.css`, `src/app/layout.tsx` (nobody owns them)
- **Done when:**
  - [x] The `@theme` ramps, the shadcn tokens of §11.2 and the tone tokens of §11.3 exist.
  - [x] `next/font/google` loads Source Serif 4, IBM Plex Sans and IBM Plex Mono.

### P1-E14-T02 — Status pill, document stamp and outside chip
- **Goal:** One map gives the label and tone for each status, and three shapes show them (`DESIGN.md` §3.4, §7.1).
- **Covers:** BR-17, `DESIGN.md` P8, WCAG 1.4.1 (icon and label on each tone)
- **Changes:** `src/components/status/`, `tests/unit/components/status.test.ts`
- **Done when:**
  - [x] Each `MilestoneStatus` has a label and a tone. `COMMITTEE_APPOINTED` shows "Panel appointed" in the Final milestone.
  - [x] Each pill has an icon and a text label.

### P1-E14-T03 — Action button with a reason (BR-18)
- **Goal:** A blocked action stays in the tab order and shows its reason under it (`DESIGN.md` §7.3, §7.4).
- **Covers:** BR-18, BR-19 (no solid red button), NFR-04
- **Changes:** `src/components/ui/button.tsx`, `src/components/action-button.tsx`, `tests/unit/components/action-button.test.ts`
- **Done when:**
  - [x] A blocked action has `aria-disabled="true"`, not `disabled`, and `aria-describedby` points to the reason.
  - [x] A blocked action with an empty reason is a type error and a runtime error.

### P1-E14-T04 — Milestone stepper
- **Goal:** Four nodes (Proposal, Pre-Final, Final, Clearance) show completed, active and locked (`DESIGN.md` §7.2).
- **Covers:** FR-TRK-01, `DESIGN.md` P9 (check, no star)
- **Changes:** `src/components/milestone-stepper.tsx`, `tests/unit/components/stepper.test.ts`
- **Done when:**
  - [x] The active node has `aria-current="step"`. Each node has a text state for screen readers.

### P1-E14-T05 — Docket, flag banner, locked banner and empty state
- **Goal:** The record screen parts of `DESIGN.md` §5.2, §7.5, §7.6 and §7.11.
- **Covers:** BR-07, BR-17, BR-18, `DESIGN.md` P1
- **Changes:** `src/components/docket.tsx`, `src/components/banners.tsx`, `src/components/empty-state.tsx`, `tests/unit/components/docket.test.ts`
- **Done when:**
  - [x] With no blocker, the Docket says "Nothing blocks this step."
  - [x] A flag banner never disables the action under it (BR-17).

### 3.3 P1-E05 Committee appointment (Track B, `agent-b`)

**Decisions:** AD-B-011. T01 is pure code and needs nothing. T02 and T03 wait for P1-E02 (data layer and row access).

### P1-E05-T01 — Committee rules (pure)
- **Goal:** Check a proposed seat, a seat status change, the appointment and the member's manuscript access.
- **Covers:** FR-CMT-01, FR-CMT-03 to FR-CMT-06, BR-03, BR-08, BR-21, INV-03, INV-24, INV-33
- **Changes:** `src/server/domain/committee.ts`, `tests/unit/domain/committee.test.ts`
- **Done when:**
  - [x] The size comes from the template for each degree level. Milestone 2 has no appointment.
  - [x] One Lead Panel Member and one Panel Chair. The Adviser never sits. A declined seat needs a new row.
  - [x] Access needs the verified form and the member's verified NDA, and ends at the BR-21 event. A substitute needs its own NDA.
- **Tests:** unit (Vitest)

### P1-E05-T02 — Appointment board data and actions (C3)
- **Goal:** The Coordinator proposes seats, records answers, links TDW 06 or TDW 11 and the NDAs, and marks the committee Appointed.
- **Covers:** FR-CMT-01 to FR-CMT-04, NFR-01, NFR-03. **Decision:** AD-B-018.
- **Changes:** `src/server/data/committees.ts`, `tests/unit/data/committees.test.ts`
- **Depends on:** T01, P1-E02
- **Done when:**
  - [x] Each write checks the Coordinator role, then the T01 rule, and writes an audit record in the same transaction.
  - [x] The board data gives workload and availability for each Panel Member (FR-CMT-02).
- **Tests:** unit (Vitest with PGlite)

### P1-E05-T03 — Member access and substitute (P1, C3)
- **Goal:** Open the manuscript to a member when `memberAccess` passes, notify the member, and record a substitute.
- **Covers:** FR-CMT-05, FR-CMT-06, BR-08, INV-24
- **Depends on:** T02, P1-E06
- **Done when:** `[ ]` A data layer test shows no signed read link without access.

### P1-E05-T04 — C3 appointment board screen
- **Goal:** `/coordinator/committees` shows the board and calls the T02 actions. Each disabled action shows its reason.
- **Covers:** FR-CMT-01 to FR-CMT-04, BR-18
- **Changes:** `src/app/coordinator/committees/` (`page.tsx`, `actions.ts`, `committee-forms.tsx`), `src/server/data/committees.ts` (`appointBlockedReason` on the board, one `appointmentProblem` check for the action and the screen)
- **Depends on:** T02, P1-E07-T02 (scan upload)
- **Done when:**
  - [x] Each disabled action shows its reason (BR-18). The reason of "Mark Appointed" comes from the same check as the action.
  - [x] After "Mark Appointed", the milestone moves to COMMITTEE_APPOINTED through `advanceMilestone` (AD-B-021). A refusal shows its reason and keeps the appointment.
  - [ ] An end-to-end step proposes two seats, records the answers and marks the committee Appointed. It waits for a local run of the Playwright setup (P1-E13).

### 3.4 P1-E07 Documents and compliance (Track B, `agent-b`)

**Decisions:** AD-B-012. T01 is pure code. T02 and later wait for P1-E02 and P0-E04.

### P1-E07-T01 — Document lifecycle (pure)
- **Goal:** One function decides each `document_record.state` change of ERD §7.2, with its actor.
- **Covers:** FR-DOC-02, FR-DOC-03, FR-DOC-06, FR-DOC-07, BR-12, BR-13, BR-19
- **Changes:** `src/server/domain/documents.ts`, `tests/unit/domain/documents.test.ts`
- **Done when:**
  - [x] Each allowed change has a test, and every other pair is refused.
  - [x] A Return needs a reason. A locked scan changes only through a Return or a Mismatch.
  - [x] A Mismatch blocks the stage close only (BR-12).
- **Tests:** unit (Vitest)

### P1-E07-T02 — Deliverables, scan upload and Coordinator review (data)
- **Goal:** The data layer lists the deliverables, takes a scan upload and records the Coordinator's review steps.
- **Covers:** FR-DOC-01, FR-DOC-03, FR-DOC-06, FR-DOC-07, FR-DOC-11, BR-12, BR-13, BR-19, NFR-01, NFR-02, NFR-03. **Decision:** AD-B-019.
- **Changes:** `src/server/data/documents.ts`, `tests/unit/data/documents.test.ts`
- **Depends on:** T01, P1-E02, P0-E04
- **Done when:**
  - [x] Each change calls `decideDocumentChange` and writes one history row for each step, plus an audit record.
  - [x] No file row without a matching stored hash (NFR-02). A locked scan changes only through a Return or a Mismatch (BR-19).
- **Tests:** unit (Vitest with PGlite, fake file store)

### P1-E07-T03 — Compliance checklist (FR-DOC-08)
- **Goal:** Compute the date-confirmation checklist for each milestone, for the `defenseChecklistComplete` fact (INV-13).
- **Covers:** FR-DOC-08, INV-13
- **Changes:** `src/server/domain/checklist.ts`, `tests/unit/domain/checklist.test.ts`. **Decision:** AD-B-013.
- **Depends on:** T01
- **Done when:**
  - [x] A test covers the list of each milestone.

### P1-E07-T04 — S3 deliverables and C4 document review screens
- **Goal:** The Student uploads scans on S3. The Coordinator reviews them on C4. Each disabled action shows its reason.
- **Covers:** FR-DOC-01, FR-DOC-03, FR-DOC-06, FR-DOC-07, FR-DOC-11, BR-18
- **Changes:** `src/app/student/documents/` (S3: `page.tsx`, `actions.ts`, `scan-uploader.tsx`), `src/app/coordinator/documents/` (C4: `page.tsx`, `actions.ts`, `review-form.tsx`), `src/server/data/documents.ts` (`readableMilestones`)
- **Depends on:** T02
- **Done when:**
  - [x] Each disabled action shows its reason (BR-18). The C4 reasons come from `decideDocumentChange`, the rule the action runs.
  - [ ] An end-to-end step uploads a TDW 07 scan, and the Coordinator verifies it. It waits for the Playwright setup (P1-E13).

### 3.4a P1-E11 Dashboards (Track B, `agent-b`)

**Decisions:** none yet. T01 is pure code. T02 and T03 wait for P1-E09 and P1-E10 (`agent-a`).

### P1-E11-T01 — Next action for each role and status (pure)
- **Goal:** One function gives the next-action card of a milestone: who acts, one sentence, and the one primary action, for each status (NFR-04).
- **Covers:** FR-TRK-01, NFR-04, BR-18
- **Reads:** `UTP` §3.2 (S1), §3.8, `src/server/domain/milestone.ts` (the transition table)
- **Changes:** `src/server/domain/next-action.ts`, `tests/unit/domain/next-action.test.ts`
- **Done when:**
  - [x] Each status of each milestone has a next action for the Student, and a test checks the list against `statusesFor`.
  - [x] The "who acts" names the role in the transition table for that step.
- **Tests:** unit (Vitest)

### P1-E11-T02 — Student tracker data (S1)
- **Goal:** One data function returns the S1 regions: identity card, stepper, next action, readiness checklist, outside chips, defense card, key dates.
- **Covers:** FR-TRK-01, FR-TRK-05, NFR-01, NFR-04, BR-17
- **Changes:** `src/server/data/tracker.ts`, `tests/unit/data/tracker.test.ts`
- **Depends on:** T01, P1-E09, P1-E10
- **Done when:**
  - [x] A test shows each region for a Student. The function reads only the signed-in Student's thesis, and any other role is refused (NFR-01).
  - [ ] The residency indicator and the printed copies status are not in the data yet. The residency date waits for R7. The printed copies status waits for `printedCopyStatus` (`agent-a`, P1-E09-T05).

### P1-E11-T03 — Queues for the Adviser, Panel Member and Coordinator (A1, P1, C1)
- **Goal:** Data functions return the action queue and the roster (A1), the assignments (P1), and the KPI strip, grouped queue and Student table (C1). Each count opens its queue.
- **Covers:** FR-TRK-02 to FR-TRK-04, NFR-01, BR-17
- **Changes:** `src/server/data/overview.ts` (C1, done), `tests/unit/data/overview.test.ts`. The Adviser (A1) and Panel Member (P1) queues come next in `src/server/data/queues.ts`.
- **Depends on:** T01, P1-E09, P1-E10
- **Done when:**
  - [x] C1: a test shows the KPI strip, the grouped queue and the Student table. Each KPI count equals its queue. The pacing flag is information only. Any other role is refused.
  - [x] A1: the action queue (Gate 1a, Gate 1b, data gathering, TDW 03, consultation requests) and the advisee roster: `adviserDashboard` in `src/server/data/queues.ts`, with tests. Gate 2 and consultation log entries are not queued yet (they wait for the Gate 2 and log screens).
  - [x] P1: the assignment list with designation, access status and reason, action required (Gate 1b, sheet, verdict) and defense schedule: `panelDashboard`, with tests.

### P1-E11-T04 — Dashboard screens S1, A1, P1, C1
- **Goal:** Each role lands on its dashboard with the next action (NFR-04). Each disabled action shows its reason.
- **Covers:** FR-TRK-01 to FR-TRK-04, NFR-04, BR-18
- **Changes:** `src/app/student/dashboard/`, `src/app/adviser/dashboard/`, `src/app/panel/dashboard/`, `src/app/coordinator/dashboard/`, `src/app/_components/dash.tsx`
- **Depends on:** T02, T03
- **Done when:**
  - [x] S1 (Docket as the next-action card, checklist, outside chips, defense card, key dates), A1 (action queue with inline TDW 03 scan upload and data gathering approval, advisee roster), P1 (assignments with the access reason) and C1 (KPI strip that opens its queue, grouped queue, Student table) are built. Each blocked item shows its reason.
  - [ ] A Playwright step opens each dashboard and finds the next-action card or the queue. It waits for a local run with `DEV_SEED_PASSWORD` (`portals.spec.ts` already opens each home and finds the `Dashboard` heading).
  - [ ] The P1 action links to the Defense Day page (P4) after `agent-a` merges #30. The S1 residency indicator waits for R7.

### 3.5 P1-E12 Audit records and in-app notifications (Track B, `agent-b`)

**Decisions:** AD-B-014. The audit insert itself is in P1-E02 (`agent-a`). T01 is pure code. T02 and T03 wait for P1-E02.

### P1-E12-T01 — Event catalog and email rules (pure)
- **Goal:** One catalog gives the fixed text, the recipients and the delivery of each of the 24 events, and the preference rule.
- **Covers:** FR-NTF-01 to FR-NTF-05, INV-29, BR-15
- **Changes:** `src/server/notify/events.ts`, `tests/unit/notify-events.test.ts`
- **Done when:**
  - [x] The 24 events of FR §4.10 exist, with reminders and digests marked.
  - [x] Only A4, B1, B2, B4, B6, B7 and C2 to C5 can be turned off (INV-29).
  - [x] No text holds a verdict, score or link (FR-NTF-03).
- **Tests:** unit (Vitest)

### P1-E12-T02 — Notification rows and the notification center (NC)
- **Goal:** Each event writes one `notification` row for each recipient, then tries the email and logs it (INV-30, FR-NTF-07). The user sees read and unread states.
- **Covers:** FR-NTF-01, FR-NTF-07, NFR-05, INV-30
- **Changes:** `src/server/data/notifications.ts`, `tests/unit/data/notifications.test.ts`. **Decision:** AD-B-020.
- **Depends on:** T01, P1-E02
- **Done when:**
  - [x] A failed email leaves the `notification` row and reports the failure (INV-30).
  - [x] A user lists, counts and marks read only their own rows.
  - [ ] The failure is an `email_log` row. It waits for the `email_log` table in P2-E04.

### P1-E12-T04 — App shell and notification center panel
- **Goal:** Each portal has the app shell (navigation, top bar, user menu) and the notification center with read and unread states.
- **Covers:** FR-NTF-01, NFR-04, NFR-01, BR-18. **Decision:** AD-B-023.
- **Changes:** `src/components/app-shell.tsx`, `nav-links.tsx`, `notification-panel.tsx`, `src/app/_components/role-shell.tsx`, `src/app/_lib/notification-actions.ts`, the four portal layouts, `tests/unit/components/notification-panel.test.ts`
- **Depends on:** P1-E12-T02
- **Done when:**
  - [x] Each portal shows the shell. The sidebar lists the routes that exist and marks the active one. The panel shows the unread count, the 10 newest rows, Mark read and Mark all read, and times in PST.
  - [ ] Wiring: each event calls `notifyEvent` after it commits, from the checked data function. It waits for the recipient resolver and for the event list that `agent-a` agrees.

### P1-E12-T03 — Audit records for each event (FR-RPT-01)
- **Goal:** Each event in FR-RPT-01 writes one `audit_record` through the P1-E02 insert.
- **Covers:** FR-RPT-01, NFR-03, INV-08
- **Depends on:** P1-E02
- **Done when:** `[ ]` A test for each event kind shows its audit record with actor, role, time and target.

### 3.6 P1-E01 Schema from the ERD (Track A, `agent-a`, done 22 Nov 2026)

**Decisions in this epic:** AD-A-011 (start Phase 1 before the §1 gates), AD-A-012 (Phase 1 table set, triggers in a custom migration).
**Scope:** every ERD §4.1 table that Phase 1 uses. Later tables come with their epics: `outside_status_event` (P2-E01), `email_template`, `email_log`, `notification_preference` (P2-E04), `clearance_item` (P3-E04), `saved_filter` (Phase 4).

### P1-E01-T01 — Enums, accounts, theses, milestones and templates
- **Goal:** All ERD §2 enums for Phase 1 and the D1 and D2 tables exist.
- **Covers:** INV-01, INV-02, INV-04, INV-18, INV-26, BR-03, BR-04, FR-ACC-07, FR-TPL-04
- **Reads:** `ERD.md` §1, §2, §4.1, §6
- **Changes:** `src/server/data/schema/`, `db/migrations/`
- **Depends on:** P0-E02
- **Done when:**
  - [x] Tests prove INV-02 (wrong role refused), INV-04 (second thesis refused), INV-18 (RETURNED with no reason refused) and INV-26 (template version cannot change).
- **Tests:** unit (Vitest with PGlite)

### P1-E01-T02 — Manuscript, commits and threads
- **Goal:** The D3, D4 and D11 tables exist.
- **Covers:** INV-05, INV-08, INV-09, INV-10, INV-11, INV-31, BR-06, BR-07, BR-19
- **Changes:** `src/server/data/schema/manuscript.ts`, `db/migrations/`
- **Depends on:** T01
- **Done when:**
  - [x] Tests prove INV-05 (no commit while locked), INV-09 (key reuse refused), INV-10 (bad hash refused), INV-11 (over 50 MB refused) and INV-31 (one target).
- **Tests:** unit (Vitest with PGlite)

### P1-E01-T03 — Schedule and committees
- **Goal:** The D5 and D6 tables exist.
- **Covers:** INV-03, FR-SCH-01 to 08, FR-CMT-01 to 06
- **Changes:** `src/server/data/schema/schedule.ts`, `committee.ts`, `db/migrations/`
- **Depends on:** T01
- **Done when:**
  - [x] Tests prove INV-03 (a seat for a non-Panel Member is refused).
- **Tests:** unit (Vitest with PGlite)

### P1-E01-T04 — Documents and defense
- **Goal:** The D7, D8 and D12 tables exist.
- **Covers:** INV-08, INV-09, INV-10, INV-11, INV-34, FR-DOC-01 to 08, FR-DEF-01 to 12, FR-REV-13
- **Changes:** `src/server/data/schema/documents.ts`, `defense.ts`, `db/migrations/`
- **Depends on:** T02
- **Done when:**
  - [x] Tests prove INV-34 (linked commit needed, same milestone, at most one of each), the document file checks, and the reason rule on `document_event`.
- **Tests:** unit (Vitest with PGlite)

### P1-E01-T05 — Gate actions, audit records and notifications
- **Goal:** The D10 and D13 tables for Phase 1 exist. Append-only tables refuse UPDATE, DELETE and TRUNCATE.
- **Covers:** INV-08, INV-19, NFR-03, BR-13, BR-19
- **Changes:** `src/server/data/schema/logs.ts`, `db/migrations/`
- **Depends on:** T04
- **Done when:**
  - [x] Tests prove INV-08 on every append-only table and INV-19 (Return with no reason refused).
  - [x] `pnpm db:migrate` applies all Phase 1 migrations on Neon.
- **Tests:** unit (Vitest with PGlite), command

### 3.7 P1-E02 Data layer, row access and audit insert (Track A, `agent-a`, done 22 Nov 2026)

**Decisions in this epic:** AD-A-013 (Panel Member scope, INV-33 hook), AD-A-014 (audit detail limit).

### P1-E02-T01 — Thesis scope for each role
- **Goal:** One function tells how the actor relates to a thesis. One SQL filter limits a thesis list to the rows the actor can read.
- **Covers:** NFR-01, FR-ACC-03, BR-04, ERD §8
- **Changes:** `src/server/data/scope.ts`, `tests/unit/data/scope.test.ts`
- **Done when:**
  - [x] Tests show each role reads only its own theses, the Coordinator reads all, and a deactivated account reads none.
  - [x] A declined seat gives no access (AD-A-013).
- **Tests:** unit (Vitest with PGlite)

### P1-E02-T02 — Manuscript access for Panel Members
- **Goal:** One check runs before every manuscript read or signed read link.
- **Covers:** INV-24, INV-33, BR-08, BR-21
- **Changes:** `src/server/data/scope.ts`, `tests/unit/data/scope.test.ts`
- **Depends on:** T01, P1-E05-T01 (`memberAccess`)
- **Done when:**
  - [x] Tests prove INV-24: no read without the verified appointment form and the member's verified NDA. A substitute needs its own NDA.
  - [x] `manuscriptAccessEnded` is the one INV-33 hook (AD-A-013).
- **Tests:** unit (Vitest with PGlite)

### P1-E02-T03 — Audit insert
- **Goal:** Each write records who, what and when in `audit_record`, in the same transaction.
- **Covers:** NFR-03, INV-08, BR-19
- **Changes:** `src/server/data/audit.ts`, `tests/unit/data/audit.test.ts`
- **Done when:**
  - [x] Tests show the row has the actor and role, long text is refused (AD-A-014), and a failed write leaves no audit row.
- **Tests:** unit (Vitest with PGlite)

### 3.8 P1-E13 seed part (Track B, `agent-b`, §8 Phase 1 step 6)

**Decisions:** AD-B-017. `agent-a` leads P1-E13. Track B makes the fake seed data and the Playwright setup.

### P1-E13-T01 — Fake seed for the Milestone 1 test
- **Goal:** One function writes the start state of the Milestone 1 test: the three templates with the FR §3 defaults, one user for each role and a Proposal milestone in DRAFT.
- **Covers:** FR-TPL-01, FR-TPL-03, FR §3 parameters, INV-25, AGENTS.md §11
- **Changes:** `tests/support/seed-m1.ts`, `tests/unit/data/seed-m1.test.ts`
- **Depends on:** P1-E01
- **Done when:**
  - [x] The seed loads on the real migrations (PGlite). Every address ends in `@example.test`.
  - [x] The rubrics total 100 (INV-25). The panel sizes give the FR §3 sheet counts.
- **Tests:** unit (Vitest with PGlite)

### P1-E13-T02 — Playwright sign-in for each role
- **Goal:** The end-to-end test signs in as each seeded role with a saved session.
- **Covers:** FR-ACC-01, FR-ACC-02, P1-E13 exit test
- **Depends on:** T01, P1-E03
- **Changes:** `playwright.config.ts` (projects `setup`, `chromium`, `portals`), `tests/e2e/auth.setup.ts`, `tests/e2e/roles.ts`, `tests/e2e/portals.spec.ts`, `.gitignore` (`tests/e2e/.auth/`)
- **Done when:**
  - [x] A Playwright setup project saves one session for each role, and a test opens each portal home and sees Access Denied on another portal. Without `DEV_SEED_PASSWORD` and `NEON_AUTH_BASE_URL` both skip, as `sign-in.spec.ts` does.
  - [ ] A local run passes. `agent-b` has no `DEV_SEED_PASSWORD` in `.env.local`, so the run is not verified yet. Run `pnpm db:seed-dev`, set the password, then `pnpm test:e2e`.

### P1-E13-T03 — Milestone 1 flow test (Track A lead, AD-A-025)
- **Goal:** One fake Student goes from account creation to CERTIFIED with every role.
- **Covers:** the exit test of PRD §8, FR-ACC-04, FR-CMT-01 to 04, FR-REV-01 to 07, FR-WFL-03, FR-WFL-04, FR-SCH-01 to 06, FR-DEF-01 to 12, FR-WFL-06, FR-WFL-11, BR-07, BR-09, BR-11, BR-12
- **Changes:** `tests/unit/flow/milestone1.test.ts`
- **Done when:**
  - [x] The flow runs on the real migrations through the data-layer functions of each screen. A wrong role, a locked manuscript, a date under 7 days, an incomplete checklist, unverified sheets and a missing Certification are each refused on the way.
  - [ ] The same flow runs in a browser with `pnpm test:e2e` (blocked: needs a seeded sign-in, AD-A-025).
- **Tests:** unit (Vitest with PGlite)

### 3.9 P1-E03 Accounts, users and templates (Track A, `agent-a`, done 22 Nov 2026)

**Decisions in this epic:** AD-A-015 (default templates as a migration), AD-A-016 (role change and deactivation rules). FR-ACC-08 (setup and reset email) comes from Neon Auth (P0-E03).

### P1-E03-T01 — Default templates
- **Goal:** Every database has the three default templates, version 1, with their forms and the rubric.
- **Covers:** FR-TPL-02, FR-TPL-03
- **Changes:** `db/migrations/0003_default_templates.sql`, `tests/unit/data/templates.test.ts`
- **Done when:**
  - [x] A test shows three templates, their required items, and rubric weights that total 100% on Proposal and Final.
- **Tests:** unit (Vitest with PGlite)

### P1-E03-T02 — Template versions and target dates (C8 data)
- **Goal:** A template change makes a new version and an audit record. Running milestones keep their version. The Coordinator sets a milestone target date.
- **Covers:** FR-TPL-01, FR-TPL-03, FR-TPL-04, FR-TPL-05, INV-26, NFR-01, NFR-03
- **Changes:** `src/server/data/templates.ts`, `tests/unit/data/templates.test.ts`
- **Done when:**
  - [x] A rubric that does not total 100% is refused (FR-TPL-03).
  - [x] A new milestone uses the latest version. An old milestone keeps its version (FR-TPL-04).
  - [x] Only the Coordinator writes. Each write has an audit record.
- **Tests:** unit (Vitest with PGlite)

### P1-E03-T03 — Student account with thesis and Milestone 1 (C2 data)
- **Goal:** One action makes the Student account, the Thesis Instance and Milestone 1 on the latest Proposal template.
- **Covers:** FR-ACC-04, FR-ACC-07, BR-03, INV-02, INV-04, NFR-03
- **Changes:** `src/server/data/students.ts`, `tests/unit/data/students.test.ts`
- **Done when:**
  - [x] A test shows the three rows and the audit record. A non-Adviser as Adviser is refused with a reason. A failed write leaves no rows.
- **Tests:** unit (Vitest with PGlite)

### P1-E03-T04 — Users: edit, role and deactivate (C9 data)
- **Goal:** The Coordinator edits a user, changes a role only when no row names the user, and deactivates or reactivates an account.
- **Covers:** FR-ACC-05, FR-ACC-06, BR-03, NFR-03
- **Changes:** `src/server/data/users.ts`, `tests/unit/data/users.test.ts`
- **Done when:**
  - [x] A role change for a user with a thesis or a seat is refused with the reason (AD-A-016).
  - [x] A Coordinator cannot deactivate their own account.
- **Tests:** unit (Vitest with PGlite)

### P1-E03-T05 — Screens C2, C8 and C9
- **Goal:** `/coordinator/students`, `/coordinator/templates` and `/coordinator/users` call the T02 to T04 functions through server actions.
- **Covers:** FR-ACC-04, FR-ACC-05, FR-TPL-01, FR-TPL-05, BR-18, NFR-01
- **Changes:** `src/app/coordinator/students/`, `templates/`, `users/`
- **Depends on:** T02 to T04
- **Done when:**
  - [x] Each action checks the session on the server and shows the refusal reason. The Final size label says "Panel Members besides the Panel Chair" (FR §3, AD-B-017).
- **Tests:** typecheck, build

---

### 3.10 P1-E04 Wiring of the state machine to the data layer (Track A, `agent-a`, §8 Phase 1 step 4)

**Decisions:** AD-A-017 (outside status table now), AD-A-018 (gate rows and the Return rule). The pure rules are in 3.1. Gate screens come after P1-E06 to P1-E09 give the facts their data.

### P1-E04-T03 — Milestone facts and outside statuses
- **Goal:** One read builds the `MilestoneFacts` of a milestone. The Coordinator records the outside statuses.
- **Covers:** FR-WFL-10, BR-14, INV-08, INV-27, NFR-01, NFR-03
- **Changes:** `src/server/data/milestone-facts.ts`, `src/server/data/outside.ts`, `src/server/data/schema/outside.ts`, `db/migrations/0004_outside_status.sql`, `db/migrations/0005_outside_status_rules.sql`
- **Done when:**
  - [x] Only the Coordinator writes an outside status. The database also refuses a wrong value and a non-Coordinator. The latest event wins.
- **Tests:** unit (Vitest with PGlite)

### P1-E04-T04 — Status changes
- **Goal:** `transitionMilestone` runs one row of ERD §7.1 with the actor, the guard, the gate row, the audit row and the lock rules.
- **Covers:** FR-WFL-02, FR-WFL-03, FR-WFL-08, FR-WFL-09, FR-WFL-13, BR-02, BR-07, BR-13, BR-18, INV-17 to INV-20
- **Changes:** `src/server/data/milestones.ts`, `tests/unit/data/milestones.test.ts`
- **Done when:**
  - [x] A wrong role, a blocked guard and a user with no access are refused with a reason. `checkTransition` gives the reason with no write.
  - [x] A Return keeps its reason and goes to DRAFT (INV-18, INV-19).
- **Tests:** unit (Vitest with PGlite)

### P1-E04-T05 — Gate 1b and Gate 2
- **Goal:** Each endorsement is one `gate_action` row. The last Gate 1b endorsement moves the milestone and locks the manuscript. Gate 2 records one approval for each member.
- **Covers:** FR-WFL-04, FR-WFL-07, BR-07, BR-20, INV-21, INV-22
- **Changes:** `src/server/data/milestones.ts`, `tests/unit/data/milestones.test.ts`
- **Done when:**
  - [x] A member with an open thread, a second endorsement and a user with no seat are refused.
  - [ ] Gate 2 and the close to CLEARED run end-to-end (P3-E03, P3-E04 give the data).
- **Tests:** unit (Vitest with PGlite)

### 3.11 P1-E06 Manuscript workspace and threads (Track A, `agent-a`, §8 Phase 1 step 5)

**Decisions:** AD-A-019 (comment contexts A and B). Context C and the Defense Day threads are P3-E02. Document comments (FR-REV-11) and the review queue (FR-REV-09) wait for the screens (the data part is in T04).

### P1-E06-T01 — Commits and the Ready mark
- **Goal:** The Student uploads a commit straight to storage, the server checks the hash, and a new commit clears the Ready mark.
- **Covers:** FR-REV-01, FR-REV-02, FR-REV-07, FR-REV-08, BR-07, INV-05, INV-06, INV-09, INV-10, INV-11, NFR-02
- **Changes:** `src/server/data/manuscript.ts`, `tests/unit/data/manuscript.test.ts`
- **Done when:**
  - [x] A locked manuscript, a hash mismatch, a bad file and a repeated key are refused. Only the Student of the thesis uploads.
- **Tests:** unit (Vitest with PGlite)

### P1-E06-T02 — Threads and replies
- **Goal:** The Adviser and the Panel Members post threads, the Student replies, only the author resolves, and an older commit shows an Outdated badge.
- **Covers:** FR-REV-04, FR-REV-05, FR-REV-06, BR-05, BR-06, INV-07, INV-24, NFR-01
- **Changes:** `src/server/data/manuscript.ts`, `tests/unit/data/manuscript.test.ts`
- **Done when:**
  - [x] Posting follows AD-A-019. A Panel Member needs the verified forms. A stranger has no access.
- **Tests:** unit (Vitest with PGlite)

### P1-E06-T03 — Screens S2, A2 and P2 (AD-A-024)
- **Goal:** The split screen with the PDF viewer and the thread panel, for the Student, the Adviser and the Panel Member.
- **Covers:** FR-REV-03, BR-18
- **Depends on:** T01, T02, P0-E04 (signed links), the shared UI parts (P1-E14)
- **Done when:**
  - [x] Each action calls the T01 and T02 functions through a server action and shows the refusal reason.
- **Tests:** typecheck, build

### 3.12 P1-E08 Consultations and availability (Track A, `agent-a`, §8 Phase 1 step 6)

**Decisions:** AD-A-020 (weekly copies, the link rule, the log milestone). Pure rules are in `src/server/data/schedule-rules.ts`. The TDW 03 signed scan is a document of P1-E07.

### P1-E08-T01 — Slots and the common free time
- **Goal:** The Adviser publishes consultation slots. The Adviser and Panel Members publish defense slots. The system finds the periods in which every required member is free.
- **Covers:** FR-SCH-01, FR-SCH-07, FR-SCH-08, NFR-01
- **Changes:** `src/server/data/schedule-rules.ts`, `src/server/data/consultations.ts`, `tests/unit/data/consultations.test.ts`
- **Done when:**
  - [x] An Online slot needs a link. A slot in the past, an overlap and a role that may not publish are refused.
- **Tests:** unit (Vitest with PGlite)

### P1-E08-T02 — Booking and the meeting link
- **Goal:** The Student requests an open slot of their Adviser with an agenda and linked threads. The Adviser confirms or declines. The link goes only to the owner and the booked Student.
- **Covers:** FR-SCH-02, FR-SCH-03, FR-SCH-04, INV-28
- **Changes:** `src/server/data/consultations.ts`, `tests/unit/data/consultations.test.ts`
- **Done when:**
  - [x] Two Students cannot take one slot. A link shows only after a confirm.
- **Tests:** unit (Vitest with PGlite)

### P1-E08-T03 — Consultation log
- **Goal:** The Adviser drafts a log entry for a held consultation, the Student adds the topic, the Adviser confirms. The log shows as the TDW 03 view.
- **Covers:** FR-SCH-05, FR-SCH-06, BR-16
- **Changes:** `src/server/data/consultations.ts`, `tests/unit/data/consultations.test.ts`
- **Done when:**
  - [x] No minimum count. A confirmed entry does not change. A Panel Member does not read the log.
- **Tests:** unit (Vitest with PGlite)

### P1-E08-T04 — Screens S4, A3, A4 and P3
- **Goal:** The booking, log and slot screens call the T01 to T03 functions.
- **Depends on:** T01 to T03, P1-E14
- **Done when:**
  - [x] Each action shows its refusal reason (BR-18). Pages: `/student/schedule` (S4, with the defense date), `/adviser/availability` (A4), `/adviser/consultations` (A3), `/panel/availability` (P3).
- **Tests:** typecheck, build

### 3.13 P1-E09 Defense (Milestone 1, TDW 08) (Track A, `agent-a`, §8 Phase 1 step 7)

**Decisions:** AD-A-021. All actions are in `src/server/data/defense.ts`. The pure sheet rules are agent-b's `src/server/domain/evaluation.ts` (AD-B-016). The same code serves Proposal (TDW 08), Pre-Final (TDW 10) and Final (TDW 13).

### P1-E09-T01 — Propose and confirm the date
- **Goal:** The Student proposes a date. The Coordinator confirms the start and the room after the checklist is complete, or Returns the request.
- **Covers:** FR-DEF-01, FR-DEF-03, BR-09, INV-12, INV-13
- **Done when:**
  - [x] A date under 7 days after Gate 1b is refused and leaves no row. An incomplete checklist blocks the confirmation.
- **Tests:** unit (Vitest with PGlite)

### P1-E09-T02 — Defense Day sheets and signed scans
- **Goal:** Each evaluator saves their own sheet from the start until it is verified. The Coordinator uploads the signed scan and marks matched or mismatch.
- **Covers:** FR-DEF-05, FR-DEF-06, FR-DEF-08, BR-10, BR-12, BR-15, INV-14, INV-25
- **Done when:**
  - [x] A sheet before the start, a sheet of another member and a score above its weight are refused. A matched sheet locks. A mismatch reopens it.
- **Tests:** unit (Vitest with PGlite)

### P1-E09-T03 — Verdict, held, Minutes and close
- **Goal:** The Lead Panel Member or the Panel Chair records the verdict and marks the defense held. The Coordinator issues the Minutes and closes the defense.
- **Covers:** FR-DEF-07, FR-DEF-09, FR-DEF-10, FR-WFL-09, BR-17, INV-15, INV-16
- **Done when:**
  - [x] A close without verified sheets, Minutes or with a Mismatch document is refused. A close unlocks the manuscript. A Disapproved defense goes back to DRAFT.
- **Tests:** unit (Vitest with PGlite)

### P1-E09-T04 — Results and attempt history
- **Goal:** Every attempt keeps its date, room, sheets, verdict and Minutes. The Student sees results after every sheet is verified.
- **Covers:** FR-DEF-11, FR-DEF-12, BR-11, BR-15
- **Done when:**
  - [x] The Student sees nothing before verification. No column or field holds a grade.
- **Tests:** unit (Vitest with PGlite)

### P1-E09-T05 — Printed copies and screens (C5, C6, S5, A5, P4)
- **Goal:** The Coordinator records the printed copies (FR-DEF-04, `printed_copy_receipt`), and the defense screens call T01 to T04.
- **Depends on:** T01 to T04, P1-E14
- **Done when:**
  - [x] The printed copies receipt and the match against the locked manuscript, with a late warning (BR-09): `recordPrintedCopies`, `checkPrintedCopies`, `printedCopyStatus` in `defense.ts`.
  - [x] S5, A5 and P4 are built (`/student/defense/[defenseId]`, `/adviser/defense/[defenseId]`, `/panel/defense/[defenseId]`). C5 and C6 are built by agent-b. Each action shows its refusal reason (BR-18).
- **Tests:** unit, typecheck, build

### 3.14 P1-E10 Certification and data gathering (Track A, `agent-a`, §8 Phase 1 step 7)

**Decisions:** AD-A-022. The status change reuses `transitionMilestone`. Revision items are P2-E03.

### P1-E10-T01 — Certification
- **Goal:** The Coordinator records CERTIFIED when every revision item is accepted and the Certification is verified with its linked commit.
- **Covers:** FR-WFL-06, BR-02, INV-17, INV-34
- **Changes:** `tests/unit/data/certification.test.ts` (the rule is in `milestone.ts`)
- **Done when:**
  - [x] A missing acceptance, a missing or unverified Certification and a wrong role are refused. The database refuses a Certification with no linked commit.
- **Tests:** unit (Vitest with PGlite)

### P1-E10-T02 — Approve data gathering
- **Goal:** The Adviser approves the start of data gathering after CERTIFIED.
- **Covers:** FR-WFL-11
- **Changes:** `src/server/data/certification.ts`, `tests/unit/data/certification.test.ts`
- **Done when:**
  - [x] Only the Adviser of the thesis approves, once, for the Proposal, after CERTIFIED.
- **Tests:** unit (Vitest with PGlite)

### P1-E10-T03 — Screens (A1, C6)
- **Depends on:** T01, T02, P1-E14
- **Done when:**
  - [ ] The A1 button shows its reason (BR-18). The C6 action calls `transitionMilestone`.
- **Tests:** typecheck, build

## 4. Phase 2 — Milestone 2 and email

**Goal:** One Student completes the Pre-Final Defense.

| Epic | Name | Covers |
| :---- | :---- | :---- |
| P2-E01 | Outside statuses (IPMO gate in Milestone 2) | FR-WFL-03, FR-WFL-10, BR-14, INV-27 |
| P2-E02 | TDW 09 and TDW 10 (comments-only sheet) | FR-DEF-02, FR-DEF-05, FR-DOC-08 |
| P2-E03 | Revision items (Proposal and Pre-Final) | FR-REV-13, INV-21 |
| P2-E04 | Event emails, digests and preferences | FR-NTF-02 to 09, NFR-05, INV-28 to INV-30 |
| P2-E05 | Milestone 2 end-to-end test | Exit test |

### 4.1 P2-E04 look-ahead (Track B, `agent-b`)

### P2-E04-T01 — Reminder rules (pure)
- **Goal:** Give the reminders due today for one thesis, from its dates (A4, B1, B2, B6).
- **Covers:** FR-NTF-06, FR §3 reminder parameters, BR-09, NFR-11. **Decision:** AD-B-015.
- **Changes:** `src/server/notify/reminders.ts`, `tests/unit/notify-reminders.test.ts`
- **Done when:**
  - [x] Each rule has a test on its day and on the days next to it.
  - [x] B2 stays off with no target date (G24).
- **Tests:** unit (Vitest)

### P2-E04-T02 — Digest grouping (pure)
- **Goal:** Group C2 to C5 into one email for each recipient and commit, and B4 and B7 into one daily email. Hold the Student's Defense Day thread emails until the defense closes.
- **Covers:** FR-NTF-04, INV-23, BR-20
- **Changes:** `src/server/notify/digest.ts`, `tests/unit/notify-digest.test.ts`
- **Done when:**
  - [x] Tests cover both group kinds and the held Defense Day items.
- **Tests:** unit (Vitest)

### 4.2 P2-E02 TDW 09 and TDW 10, with the shared sheet rules for TDW 08, 10 and 13 (Track B, `agent-b`)

**Decisions:** AD-B-016. T01 is pure code and look-ahead. P1-E09 (`agent-a`) and P3-E01 use it too.

### P2-E02-T01 — Evaluation sheet rules for TDW 08, 10 and 13 (pure)
- **Goal:** One module gives the form, the expected sheets, the edit window, the score and comment checks, and the close inputs for each milestone.
- **Covers:** FR-DEF-05, FR-DEF-06, FR-DEF-07, FR-CMT-06, INV-14, INV-16, INV-25, BR-10, BR-11, BR-15, BR-17
- **Changes:** `src/server/domain/evaluation.ts`, `tests/unit/domain/evaluation.test.ts`
- **Depends on:** none
- **Done when:**
  - [x] Tests cover the edit window (INV-14), the weights (INV-25), the score range, the TDW 10 comment boxes and the sheet part of INV-16.
  - [x] The Adviser has a sheet at Proposal and Pre-Final, and none at Final. A substitute takes the absent member's sheet.
  - [x] A different Action Taken gives a warning only (BR-17).
- **Tests:** unit (Vitest)

### P2-E02-T02 — TDW 09 endorsement and TDW 10 sheet wiring
- **Goal:** The Pre-Final endorsement form (TDW 09) and the comments-only sheet (TDW 10) work through the data layer and the P4 screen.
- **Covers:** FR-DEF-02, FR-DEF-05, FR-DOC-08
- **Depends on:** T01, P1-E09
- **Done when:** `[ ]` An end-to-end step at Pre-Final encodes a TDW 10 sheet, and the Coordinator verifies it.

### 4.3 P2-E01 and P2-E03 (Track A, `agent-a`)

**Decisions:** AD-A-017 (outside status table, done in P1-E04), AD-A-026 (revision items).

### P2-E01-T01 — Outside status setters
- **Goal:** The Coordinator sets Ethics, IPMO, RPO and Copyright. Every other role sees them read-only. In Milestone 2 Gate 1a waits for IPMO PASSED.
- **Covers:** FR-WFL-03, FR-WFL-10, BR-14, INV-27
- **Changes:** `src/server/data/outside.ts` (done), `src/app/_components/outside-setters.tsx`, `src/app/_lib/outside-actions.ts`
- **Done when:**
  - [x] The data layer and its tests are done (P1-E04, `tests/unit/data/milestones.test.ts`).
  - [x] A component shows the chips and, for the Coordinator, a selector for each kind.
  - [ ] `agent-b` mounts `OutsideSetters` on C4 (`/coordinator/documents`) and C7.
- **Tests:** unit, typecheck, build

### P2-E03-T01 — Revision items data
- **Goal:** The Coordinator enters the items of the Minutes. The Student links each to a commit. The Adviser and each accepted Panel Member accept each item.
- **Covers:** FR-REV-13, INV-21, BR-05, BR-11
- **Changes:** `src/server/data/revisions.ts`, `tests/unit/data/revisions.test.ts`
- **Done when:**
  - [x] A test shows the entry rules, the link rule, the acceptance by each member, the guard of CERTIFIED and the Student view after verification.
- **Tests:** unit (Vitest with PGlite)

### P2-E03-T02 — Revision items on the screens
- **Goal:** The PR workspace lists the items with Link commit and Accept. The Coordinator has an entry form.
- **Changes:** `src/app/_components/revision-panel.tsx`, `src/app/_lib/revision-actions.ts`, `src/app/_components/pr-workspace.tsx`
- **Done when:**
  - [x] S2, A2 and P2 show the items of the latest held attempt (Proposal and Pre-Final).
  - [ ] `agent-b` mounts `RevisionItemsForm` on C6.
- **Tests:** typecheck, build

### P2-E05-T01 — Milestone 2 flow test (Track A lead, AD-A-027)
- **Goal:** The Student of the Milestone 1 flow goes through the Pre-Final Defense with every role, and the close opens Milestone 3.
- **Covers:** the exit test of Phase 2, FR-WFL-01, FR-WFL-03, FR-CMT-01, FR-DEF-02, FR-DEF-05, FR-DOC-08, FR-REV-13, INV-20
- **Changes:** `tests/unit/flow/milestone2.test.ts`, `tests/support/flow.ts` (the Milestone 1 flow, shared), `src/server/data/milestones.ts` (`openMilestone`)
- **Done when:**
  - [x] The flow runs on the real migrations. Gate 1a waits for IPMO PASSED. No new appointment. A score on TDW 10 is refused. The close opens Milestone 3. Revision items are answered and accepted after the close.
  - [ ] The same flow runs in a browser (blocked, AD-A-025).
- **Tests:** unit (Vitest with PGlite)

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

### 5.1 P3-E02 Defense Day threads (Track A, `agent-a`)

**Decisions:** AD-A-028.

### P3-E02-T01 — Context C threads
- **Goal:** A Final Panel member posts threads on the locked commit from the scheduled start until they approve Gate 2. Before the start the panel reads only. The Student sees the threads when the defense closes.
- **Covers:** FR-REV-04, FR-REV-12, FR-REV-15, BR-20, BR-05
- **Changes:** `src/server/data/manuscript.ts`, `tests/unit/data/defense-day.test.ts`
- **Done when:**
  - [x] A test shows the read-only window with its reason, the open window for the Panel Chair and a Panel Member, the refusal of other roles, the Student view after the close, and the window closing after Gate 2.
- **Tests:** unit (Vitest with PGlite)

### P3-E02-T02 — P4 tab "Manuscript and comments"
- **Goal:** The Defense Day page of the Final links to the PR workspace (P2), where the threads are.
- **Covers:** FR-DEF-05
- **Changes:** `src/app/_components/defense-day.tsx`, `src/server/data/defense.ts` (`prId`)
- **Done when:**
  - [x] The tab shows at the Final only.
- **Tests:** typecheck, build

### 5.2 P3-E04 Clearance (Track A, `agent-a`)

**Decisions:** AD-A-029.

### P3-E04-T01 � Checklist, verify and close to CLEARED
- **Goal:** The checklist shows seven items. The Coordinator verifies three. The close to CLEARED needs all seven.
- **Covers:** FR-CLR-01, FR-CLR-03, FR-CLR-04, BR-02, BR-21, INV-33
- **Changes:** `src/server/data/schema/clearance.ts`, `db/migrations/0007_*`, `0008_*`, `src/server/data/clearance.ts`, `milestone-facts.ts`, `scope.ts`, `tests/unit/data/clearance.test.ts`
- **Done when:**
  - [x] A test shows the derived items, the refusals, the final-copy check, append-only rows, the end of Panel access and the close.
- **Tests:** unit (Vitest with PGlite)

### P3-E04-T02 � Evidence upload and the S6 and C7 screens
- **Goal:** The Student uploads evidence for each item (FR-CLR-02). S6 and C7 show the checklist.
- **Covers:** FR-CLR-02, FR-CLR-04
- **Done when:**
  - [ ] Open. Needs a form code for evidence (AD-A-029).

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

## 7. Repository layout

All code is in `src/`. Next.js reads routes from `src/app/`. P0-E01 made and confirmed the rows marked **Made**. The other rows stay `[CONFIRM]` until the epic that makes them.

| Path | Holds | Status |
| :---- | :---- | :---- |
| `src/app/` | Root layout and home page | **Made** |
| `src/app/(auth)/login` | Sign-in route | **Made** (P0-E03) |
| `src/app/student/`, `src/app/adviser/`, `src/app/panel/`, `src/app/coordinator/` | The 29 role routes (`SITEMAP.md` §3). Each portal `layout.tsx` checks the role. | **Made** (P0-E03, dashboard stubs only) |
| `src/server/data/` | The one server-side data layer. Every read and write goes here (NFR-01). | **Made** (P0-E02) |
| `src/server/domain/` | State machines and invariant checks (`ERD.md` §6, §7), with no framework code | `[CONFIRM]` P1-E04 |
| `src/server/files/` | Signed links and hash checks (P11.0) | **Made** (P0-E04) |
| `src/server/notify/` | Events, emails and the daily job (P9.0) | `[CONFIRM]` P0-E05 |
| `src/components/` | Shared UI from `DESIGN.md` | **Made** (`ui/` holds shadcn/ui parts) |
| `src/lib/` | Small shared helpers, for example `cn()` | **Made** |
| `db/migrations/` | Migrations from `ERD.md` (drizzle-kit SQL files) | **Made** (P0-E02) |
| `tests/unit/`, `tests/e2e/` | Vitest and Playwright tests | **Made** |

---

## 8. Two-agent tracks (`AGENTS.md` §13)

Each agent does its track from top to bottom. "Waits for" names work from the other track that must be merged into `dev` first. While an agent waits, it does look-ahead work: it expands the next epic into tasks, writes the INV tests first, reviews the other agent's open pull request, or makes fake seed data.

### Phase 0

| Step | Track A (`agent-a`) | Track B (`agent-b`) |
| :---- | :---- | :---- |
| 1 | P0-E02 data layer (decide the query and migration tool, log it) | P0-E05: make the Vercel project first and send `agent-a` the domain. Then `sin1`, the env, the cron and the Resend email. |
| 2 | P0-E03 sign-in | The first part of P0-E06: fake TDW scans and MB per page |
| 3 | P0-E04 files. Waits for: the Vercel domain (B step 1), for CORS. | Review A's pull requests |
| 4 | Review B's report | P0-E06 report. Waits for: P0-E04. |

### Phase 1

| Step | Track A | Track B |
| :---- | :---- | :---- |
| 1 | P1-E01 schema | P1-E04 domain part: the pure state machines in `src/server/domain/` with INV-17 to INV-21 tests |
| 2 | P1-E02 data layer, row access and audit insert | Shared UI parts from `DESIGN.md` in `src/components/` (BR-18 disabled reasons) |
| 3 | P1-E03 accounts and templates | P1-E05 committee. Waits for: P1-E02. |
| 4 | P1-E04 wiring of the domain part to the data layer and gates. Waits for: B step 1. | P1-E07 documents and compliance |
| 5 | P1-E06 manuscript and threads | P1-E12 audit records and in-app notifications |
| 6 | P1-E08 consultations | Fake seed data and the Playwright setup for P1-E13 |
| 7 | P1-E09 defense, then P1-E10 certification. Waits for: P1-E05, P1-E07. | P1-E11 dashboards. Waits for: P1-E10. |
| 8 | P1-E13 end-to-end test (lead) | P1-E13: run it, report and fix failures in Track B files |

### Phase 2

| Track A | Track B |
| :---- | :---- |
| P2-E01 outside statuses, then P2-E03 revision items, then P2-E05 end-to-end test (lead) | P2-E04 emails, digests and preferences, then P2-E02 TDW 09 and TDW 10, then help with P2-E05 |

### Phase 3

| Track A | Track B |
| :---- | :---- |
| P3-E02 Defense Day threads, then P3-E03 Gate 2, then P3-E04 clearance, then P3-E06 end-to-end test (lead) | P3-E01 Final Panel and TDW 12, TDW 13, then P3-E05 submission view and dossier, then help with P3-E06 |

Phase 4 is not in a track. The human picks it (§6).
