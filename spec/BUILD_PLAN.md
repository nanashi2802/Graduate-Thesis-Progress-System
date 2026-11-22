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
- **Depends on:** T02, P1-E07-T02 (scan upload)
- **Done when:** `[ ]` An end-to-end step proposes two seats, records the answers and marks the committee Appointed.

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
- **Depends on:** T02
- **Done when:** `[ ]` An end-to-end step uploads a TDW 07 scan, and the Coordinator verifies it.

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
- **Done when:** `[ ]` A Playwright setup project saves one session for each role, and a test opens each portal home.

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
