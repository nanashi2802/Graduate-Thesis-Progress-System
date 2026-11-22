# AGENT DECISIONS — autonomous build mode log

**Rule:** `AGENTS.md` §13.3. The agents write here. The human reads it to check and undo decisions.
**Undo a decision:** run `git log --grep <ID>` to find its commits, then `git revert` them. Check later decisions that cite its ID.

## Phase summaries

(`agent-a` adds one summary at the end of each phase, newest first: the decisions made, the risky ones, and what the human must check.)

## Decisions

Copy this block for each decision. Newest last. IDs: `AD-A-nnn` for `agent-a`, `AD-B-nnn` for `agent-b`.

```markdown
### AD-A-001 — <short name>
- **Task:** <task ID>
- **Options:** <option 1>; <option 2>
- **Decision and reason:** <the option, with spec IDs>
- **Risk:** low / medium / high, and why
- **Undo:** <what to revert or change>
```

### AD-A-001 — Query and migration tool: Drizzle ORM and drizzle-kit
- **Task:** P0-E02-T01
- **Options:** Drizzle ORM + drizzle-kit (SQL migration files); Kysely + hand-written SQL migrations; Prisma; plain `@neondatabase/serverless` with raw SQL.
- **Decision and reason:** Drizzle ORM with the `@neondatabase/serverless` driver, and drizzle-kit for migrations. The migrations are plain SQL files in `db/migrations/`, so a human can read and edit them, and triggers and grants for append-only tables (`ERD.md` §1, BR-19) go in as custom SQL. Drizzle gives typed queries for the one server-side data layer (NFR-01). It has no engine binary and no paid service, and it runs on Vercel functions (PRD §11.2). Prisma needs an engine and is heavier. Kysely needs a separate migration runner.
- **Risk:** low. The schema is standard Postgres. The SQL files stay valid with any other tool.
- **Undo:** revert the commits with AD-A-001. Keep `db/migrations/*.sql` and run them with another runner.

### AD-A-002 — Data-layer tests run on PGlite, not on Neon
- **Task:** P0-E02-T02, P0-E02-T03
- **Options:** tests on a Neon branch (needs a secret in CI); tests on PGlite (Postgres compiled to WASM, in memory); mock the database.
- **Decision and reason:** PGlite (`@electric-sql/pglite`, dev dependency only). The tests apply the real migration files, so they test the real SQL. CI needs no secret (`ci.yml` says it needs none), and the public repository holds no database URL (AGENTS.md §11). Mocks would not test access checks against real rows (NFR-01).
- **Risk:** low. PGlite is real Postgres 17, but it lacks some extensions. Neon-only behavior (Neon Auth schema) needs a manual check on Neon.
- **Undo:** revert the commits with AD-A-002. Point the test helper at a Neon branch URL.

### AD-A-003 — Neon branch for agent-a in Phase 0
- **Task:** P0-E02-T02
- **Options:** make a Neon branch `agent-a` now (AGENTS.md §13.8); use the URL in `.env.local` (branch `main`) until agent-b also needs the database.
- **Decision and reason:** Use the existing `.env.local` URL for Phase 0. §13.8 asks for own branches only "when both builders need the database". In Phase 0, agent-b works on Vercel, email and the spike report, not on the database. No Neon API key or `neonctl` sign-in is available to make a branch. The first migration adds only the `app` schema, one enum and one empty table.
- **Risk:** medium. A migration runs on the database of branch `main`. Before Phase 1, the human (or agent-a, with a Neon API key) must make branches `agent-a` and `agent-b` and put their URLs into each worktree `.env.local`.
- **Undo:** on Neon `main`, run `DROP SCHEMA app CASCADE; DROP SCHEMA drizzle CASCADE;`.

### AD-A-004 — Neon Auth SDK package: `@neon/auth`
- **Task:** P0-E03-T01
- **Options:** `@neon/auth` 0.8 (the Neon docs reference page); `@neondatabase/auth` 0.7 beta (the older name in the neon-js guide)
- **Decision and reason:** `@neon/auth`. The Neon docs for the Next.js server SDK use it, and it is the newer version. It wraps Better Auth (PRD §11.2: "Neon Auth (managed Better Auth)"). The server makes the instance on first use, so `next build` works in CI with no secrets.
- **Risk:** low. The SDK is pre-1.0, so its API can change. The SDK is used only in `src/server/auth/` and the login form.
- **Undo:** revert the commits with AD-A-004.

### AD-A-005 — The app account is the `app_user` row, not the Neon Auth user
- **Task:** P0-E03-T02, P0-E03-T03
- **Options:** block unknown Google users in the Neon Auth settings; block them in the app
- **Decision and reason:** Block in the app. Neon Auth has `disableSignUp` for email and password (it is on), but the Neon project settings show no such switch for the shared Google provider. So a Google sign-in with a new email can make a row in `neon_auth.user`. The app treats only an `app_user` row that the Coordinator made as an account (FR-ACC-04, FR-ACC-05, D-23). After each sign-in, a user with no `app_user` row, or a deactivated one, is signed out at once and sees the reason. The first sign-in links `app_user.auth_user_id` by the email address. A linked row never moves to another Neon Auth user.
- **Risk:** medium. A stray `neon_auth.user` row can stay for a Google user who has no account. It has no access, because each portal and each data-layer call needs an `app_user` row. The human must check with a real Google user (P0-E03-T03, open item). Linking by email trusts the email that Neon Auth gives. For Google, Google verifies the email.
- **Undo:** revert the commits with AD-A-005. If Neon adds a Google sign-up switch, turn it on as well.

### AD-A-006 — Coordinator path and the bootstrap Coordinator
- **Task:** P0-E03-T02
- **Options:** the Neon REST API (`POST /projects/{id}/branches/{id}/auth/users`, needs a Neon API key); the Better Auth admin plugin (`admin/create-user`, needs an admin session); write the users into the Neon Auth tables
- **Decision and reason:** The app makes users with `admin/create-user` and the signed-in Coordinator's session (`src/server/auth/admin.ts`, `createAccount`). The Coordinator's Neon Auth user has the role `admin`. This needs no extra secret. The first Coordinator cannot come from the app, and no Neon API key is available. So `pnpm db:seed-dev` writes the fake bootstrap Coordinator into `neon_auth.user` and `neon_auth.account` (Better Auth scrypt password format), then makes the other fake users through `admin/create-user`. Fake users use `@example.test` and the password in `DEV_SEED_PASSWORD` (`.env.local` only).
- **Risk:** medium. The direct write depends on the Neon Auth table shape, and it is for a development branch only. For the pilot, the human makes the first real Coordinator in the Neon console (Auth, Users) and selects "Make admin". `neonCreateAuthUser` is not yet run live from the app. P1-E03 runs it from `/coordinator/users`.
- **Undo:** revert the commits with AD-A-006. Remove the fake users in the Neon console.

### AD-A-007 — Storage client: AWS SDK for JavaScript v3
- **Task:** P0-E04-T01
- **Options:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`; a small S3 signer such as `aws4fetch`; hand-written SigV4
- **Decision and reason:** The AWS SDK. Neon Object Storage is S3-compatible (PRD §11.2), and the SDK signs `If-None-Match`, `x-amz-checksum-sha256`, size and type into the link. Tests on Neon storage proved each guard (`spec/BUILD_PLAN.md` §2.7). It is used only in `src/server/files/` and one script. No paid service.
- **Risk:** low. The SDK is large, but only server code loads it.
- **Undo:** revert the commits with AD-A-007. Replace `storage.ts` with another signer.

### AD-A-008 — CORS rule and test key prefix on `thesis-files`
- **Task:** P0-E04-T02
- **Options:** keep the bucket rule `*` (it allowed all origins and DELETE); allow only the app origins
- **Decision and reason:** Only `http://localhost:3000`, `https://thesisko-tau.vercel.app` and `https://thesisko-*-yushinbjornmatsuda-9110s-projects.vercel.app` (AD-B-001). Methods GET, HEAD and PUT. No DELETE, because the app never deletes (BR-19). The rule is in `scripts/set-storage-cors.mjs` (`pnpm storage:cors`). Test files use the new `FILE_KEY_PREFIX` (`agent-a` in this worktree, AGENTS.md §13.8).
- **Risk:** low. The preview pattern lets any preview of this Vercel project use the bucket, which is intended. A new domain needs a new rule. CORS does not stop a holder of a valid signed link outside a browser; the short link life does.
- **Undo:** edit the origin list and run `pnpm storage:cors` again.

### AD-A-009 — Spike screen `/coordinator/spike-files` and the PDF viewer
- **Task:** P0-E04-T03
- **Options:** a test-only route; a spike screen in the Coordinator portal
- **Decision and reason:** A spike screen in the Coordinator portal, so the portal gate and the server-side Coordinator check (NFR-01) protect it. It is not in `SITEMAP.md`. P1-E06 removes it when commit uploads exist. The viewer uses `react-pdf` (PRD §11.2) and `pdfjs-dist` at the same version, with `disableAutoFetch` and `disableStream`, so pdf.js reads only the byte ranges of the page in view (PRD §11.3 rule 2).
- **Risk:** low. Spike code only.
- **Undo:** delete `src/app/coordinator/spike-files/`.
### AD-B-001 — Vercel project name, settings and origins
- **Task:** P0-E05-T01
- **Options:** name `thesisko` (same as the Neon project); a longer name from the repository
- **Decision and reason:** Project `thesisko` in the personal Hobby scope. Vercel gave the production domain `thesisko-tau.vercel.app`, because `thesisko.vercel.app` is taken. Framework preset `nextjs`. Node.js `24.x` (the current LTS; `package.json` asks for 22 or newer). The Git production branch stays `main` (`AGENTS.md` §13.8). CORS origins sent to `agent-a`: the production origin, `https://thesisko-*-yushinbjornmatsuda-9110s-projects.vercel.app` for previews, and `http://localhost:3000`.
- **Risk:** low. The domain name can change later with a custom domain. Then the CORS rule must change too.
- **Undo:** Rename or delete the Vercel project. Update the CORS rule on `thesis-files`.

### AD-B-002 — Resend through its REST API, with no SDK
- **Task:** P0-E05-T04
- **Options:** add the `resend` package; call `https://api.resend.com/emails` with `fetch`
- **Decision and reason:** `fetch`. One POST is all Phase 0 needs. It adds no dependency (`AGENTS.md` §10) and needs no change to `package.json`.
- **Risk:** low. P2-E04 can add the SDK if batch sends or webhooks need it.
- **Undo:** Replace `sendEmail` in `src/server/notify/email.ts`.

### AD-B-003 — Daily job time and access
- **Task:** P0-E05-T02, P0-E05-T03
- **Options:** schedule `0 0 * * *`; another hour
- **Decision and reason:** `0 0 * * *`. Hobby runs it between 00:00 and 00:59 UTC, which is 08:00 to 08:59 PST, at the start of the work day (NFR-11). The route accepts only `Authorization: Bearer <CRON_SECRET>`. With no `CRON_SECRET`, it refuses every request (fail closed).
- **Risk:** low.
- **Undo:** Change `vercel.json`.

### AD-B-004 — Test email through `NOTIFY_TEST_TO`
- **Task:** P0-E05-T04
- **Options:** a separate test route; an optional variable that makes the daily job send one email
- **Decision and reason:** The optional variable `NOTIFY_TEST_TO` in `.env.example`. It adds no new route to secure. It proves the cron and the email in one run. The email holds the event, the next action, the deadline and a link only (FR-NTF-02, `AGENTS.md` §10). Remove the variable in Vercel after the spike.
- **Risk:** low. In Vercel, `NOTIFY_TEST_TO` is `delivered@resend.dev`, the Resend test address. It proves the send and puts no personal address in Vercel. With `onboarding@resend.dev`, Resend sends only to that address or to the account owner.
- **Undo:** Remove the variable, and remove the test branch in `src/server/notify/daily.ts`.

### AD-B-005 — Start the P1-E04 domain part before the Phase 1 gates
- **Task:** P1-E04-T01, P1-E04-T02
- **Options:** wait for the Phase 1 gates (`BUILD_PLAN.md` §1: ERD v1.1 approved, spike report accepted); write the pure code now as look-ahead work
- **Decision and reason:** Write it now. §8 says Track B starts Phase 1 with this part, and the code has no database, no route and no dependency. It follows ERD v1.1 §7.1 as written. If the human changes the ERD, only `src/server/domain/` and its tests change.
- **Risk:** low. The code is pure and nothing calls it yet.
- **Undo:** Revert the commits with this ID. Delete `src/server/domain/`.

### AD-B-006 — Return purpose for the Coordinator (BR-13)
- **Task:** P1-E04-T02
- **Options:** trust the Coordinator with no check; ask the Coordinator to pick a purpose (`compliance`, `eligibility`) when they Return
- **Decision and reason:** `checkReturn` takes a `purpose`. A Coordinator Return must be `compliance` or `eligibility` (BR-13, INV-19). The Adviser and Panel Members can Return for content. ERD v1.1 has no column for the purpose. `agent-a` decides whether `gate_action` stores it (P1-E04 wiring). Until then the purpose is a UI choice only.
- **Risk:** medium. The purpose is not stored, so an audit cannot show it. The human must check whether BR-13 needs it on the record.
- **Undo:** Remove the `purpose` check in `src/server/domain/gates.ts`.

### AD-B-007 — `DEFENSE_HELD` needs the verdict
- **Task:** P1-E04-T01
- **Options:** set `DEFENSE_HELD` at the start time and the verdict later; set `DEFENSE_HELD` when the Lead Panel Member or Panel Chair records the verdict
- **Decision and reason:** The verdict. ERD §7.1 gives the actor as the Lead Panel Member or Panel Chair with guard INV-15, which is the verdict rule. So the verdict and the status change happen together. A Disapproved verdict then moves the milestone back to `DRAFT` (system step, FR-WFL-09), and `CLOSED` refuses a Disapproved attempt.
- **Risk:** low. It matches ERD §7.1 and §7.2 (`defense_attempt` stays `held` when Disapproved).
- **Undo:** Change the `DEFENSE_SCHEDULED` to `DEFENSE_HELD` guard in `src/server/domain/milestone.ts`.

### AD-A-010 — The auth proxy blocks admin, sign-up and delete paths
- **Task:** P0-E03 (fix from the agent-r review of #4)
- **Options:** pass every path to Neon Auth; block the paths the browser never needs
- **Decision and reason:** `/api/auth/admin/*`, `/api/auth/sign-up/email` and `/api/auth/delete-user` return 404 (`src/server/auth/blocked-paths.ts`). The Coordinator's Neon Auth role is `admin` (AD-A-006), so without the block the browser could call remove-user or impersonate. That breaks "accounts are deactivated, never deleted" (FR-ACC-06, ERD §1, BR-19). Sign-up is off anyway (D-23). The server still calls `admin/create-user` directly with the SDK.
- **Risk:** medium. The block covers only this app's proxy. The Neon Auth base URL is public, so a Coordinator session token sent straight to Neon Auth could still call admin paths. Only the Coordinator has that token. P1-E03 must check whether the session cookie works on the Neon Auth host directly, and log the result.
- **Undo:** revert the commits with AD-A-010.
