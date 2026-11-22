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

### AD-B-008 — Shared UI parts get the epic ID P1-E14
- **Task:** P1-E14 (Track B, Phase 1 step 2)
- **Options:** put the tasks under P1-E11 (dashboards); add a new epic P1-E14
- **Decision and reason:** A new epic P1-E14. `spec/BUILD_PLAN.md` §8 names the work, but §3 has no epic for it. P1-E11 waits for P1-E10, and the shared parts are needed earlier by P1-E05 to P1-E09. The ID rule of §0 needs an epic ID for each task.
- **Risk:** low. It is a label in the plan only.
- **Undo:** Move the tasks of §3.2 into another epic and rename the IDs in the commit messages.

### AD-B-009 — Apply the DESIGN.md v0.1 tokens and fonts now
- **Task:** P1-E14-T01
- **Options:** wait for the owner to close DESIGN.md D-01 (gold hex) and D-02 (IBM Plex Sans, warm neutrals); apply the draft values now
- **Decision and reason:** Apply the draft values now: PUP Gold `#F4C430`, Source Serif 4, IBM Plex Sans and IBM Plex Mono through `next/font/google` (self-hosted at build, NFR-06), and the warm neutral ramp. Every screen from P1-E03 on needs the tokens. All values sit in `src/app/globals.css` and `src/app/layout.tsx`, so a later change is one place.
- **Risk:** low. D-01 and D-02 are still `[CONFIRM]`. If the owner picks other values, only the token values change.
- **Undo:** Change the values in `src/app/globals.css` (`@theme` and `:root`) and the fonts in `src/app/layout.tsx`.

### AD-B-010 — Component tests render to static HTML, with no new test library
- **Task:** P1-E14-T02 to T05
- **Options:** add `@testing-library/react` and `jsdom`; render with `react-dom/server` `renderToStaticMarkup` in the Node test environment
- **Decision and reason:** `renderToStaticMarkup`. The shared parts are mostly markup: labels, tones, `aria-disabled`, `aria-describedby`. Static HTML checks these with no new dependency (AGENTS.md §10) and no change to `package.json`, which `agent-a` owns. Click behavior comes from Base UI `focusableWhenDisabled`, and the P1-E13 end-to-end tests cover it.
- **Risk:** low. Interaction tests come later with Playwright.
- **Undo:** Add the test library in a later task. The static tests stay valid.

### AD-A-011 — Start Phase 1 before the §1 gates are signed
- **Task:** P1-E01
- **Options:** wait for the human to approve ERD v1.1, BR-21 and INV-33, DESIGN D-01 and D-02, and the P0 spike report (`BUILD_PLAN.md` §1); build on the drafts now
- **Decision and reason:** Build now on `ERD.md` v1.1 as written, with the BR-21 / INV-33 default (access ends at the `final_copy` record). AGENTS.md §13.3 says to decide the §1 gates. AD-B-005 and AD-B-009 already did the same for the domain code and the design tokens. The P0 report (P0-E06) is not done yet. The only Phase 1 schema input from it is the 50 MB limit (AS-11), which stays as the proposed value in one constant.
- **Risk:** medium. If the human changes the ERD, the migrations need a new migration on top (never an edit of an applied one).
- **Undo:** revert the commits with AD-A-011, or add a migration that changes the tables.

### AD-A-012 — Phase 1 table set, with triggers in a custom migration
- **Task:** P1-E01-T01 to T05
- **Options:** all ERD tables now; only the tables each epic needs; the Phase 1 tables now
- **Decision and reason:** The Phase 1 tables now (`BUILD_PLAN.md` §3.3 scope). P1-E01 says "all Phase 1 tables". Later tables wait for their epics, so the schema has no unused tables. Drizzle writes tables, keys and checks. Rules that need a trigger (INV-02, INV-03, INV-05, INV-08, INV-26, INV-34) go into one custom SQL migration. INV-08 uses triggers that refuse UPDATE, DELETE and TRUNCATE, not grants, because the app and the migrations use the same Neon role now.
- **Risk:** low. Triggers are plain Postgres. A separate app role with INSERT and SELECT only is still a good second layer later.
- **Undo:** revert the commits with AD-A-012.

### AD-B-011 — The Coordinator records a seat's Accepted or Declined status
- **Task:** P1-E05-T01
- **Options:** the Panel Member accepts or declines in the system; the Coordinator records the member's answer
- **Decision and reason:** The Coordinator. FR-CMT-03 lists only screen C3 (Coordinator). The Dean assigns on paper (FR-CMT-04), so the answer comes to the office, not to the system. The pure check `checkSeatStatus` takes the actor role, so a later change is one line.
- **Risk:** low. If the owner wants members to answer in the system, add `panel_member` (own seat only) to the check and a P1 screen action.
- **Undo:** Change `checkSeatStatus` in `src/server/domain/committee.ts`.

### AD-B-012 — Document states follow ERD §7.2 strictly, with three actors
- **Task:** P1-E07-T01
- **Options:** allow `not_started` to `scan_uploaded` for documents with no prefill (for example the OR); keep the ERD path, where each document passes `prepared`
- **Decision and reason:** Keep the ERD path. The data layer sets `prepared` (actor `system`) when it opens a deliverable that has no prefilled form. The actors are `system` (prefill, lock on upload), `uploader` (the Student, or the Coordinator for TDW 05, 06 and 11, FR-CMT-04) and `coordinator` (received, verified, mismatch, Return). A strict path is easier to loosen later than to tighten.
- **Risk:** low. The data layer must write the `prepared` step for the OR and other blank uploads. P1-E07 wiring must do this.
- **Undo:** Add a `not_started` to `scan_uploaded` row in `src/server/domain/documents.ts`.

### AD-B-013 — What "done" means for each checklist item (FR-DOC-08)
- **Task:** P1-E07-T03
- **Options:** every item must be `verified`; scans count once locked, and only the appointment form, the NDAs and the OR must be `verified`
- **Decision and reason:** The second option. FR-DOC-08 says "TDW 07 scan" and "OR verified", so it treats the scan and the OR differently. The appointment form and the NDAs must be verified because BR-08 opens the manuscript only after they are recorded. A scan in `mismatch` still counts, because BR-12 says a mismatch never stops a defense. TDW 03 counts once locked.
- **Risk:** medium. The owner may want TDW 03 or the defense-form scan verified before the date is confirmed. Then the date waits for the Coordinator's paper check.
- **Undo:** Change `submitted(...)` to `verified(...)` for that item in `src/server/domain/checklist.ts`.

### AD-B-014 — Event texts live in code until FR-NTF-10
- **Task:** P1-E12-T01
- **Options:** store the email texts in the ERD template table (`event_code`, `version_no`) now; keep fixed texts in `src/server/notify/events.ts` now
- **Decision and reason:** Fixed texts in code. FR-NTF-10 (edit and version the wording) is priority C and sits in Phase 4 (`spec/BUILD_PLAN.md` §6). FR-NTF-02 needs fixed templates with no free text, and constants meet it. A test checks that no text holds a verdict, score or link word (FR-NTF-03, BR-15).
- **Risk:** low. When Phase 4 adds FR-NTF-10, the constants become the first template version.
- **Undo:** Load the texts from the template table in `buildNotificationEmail`.

### AD-B-015 — Reminder days that FR §3 leaves open (B2, B6)
- **Task:** P2-E04-T01 (look-ahead)
- **Options:** for B2 and B6, any days, because FR §3 gives none
- **Decision and reason:** B2 fires 7 days before the target date and 1 day after it. B6 fires 90 and 30 days before the residency end date. Each rule fires on exact days, so one daily run sends each reminder once with no extra state. All days sit in `REMINDER_DAYS` in `src/server/notify/reminders.ts`. B1 is not open: FR §3 sets it to 7 days before the defense. The code follows FR §3, and the deadline in the email is the printed-copies due date. The B1 text is "Printed copies are due soon", so it stays true when the due days change.
- **Correction (22 Nov 2026, after the agent-r review of #8):** the first version sent B1 7 days before the due date (14 days before the defense). That broke FR-NTF-06, and no B1 was sent when the date was confirmed less than 14 days ahead.
- **Risk:** low. B2 stays off until a target date exists (G24). B6 uses the unverified residency limit (R7).
- **Undo:** Change `REMINDER_DAYS`, or move the days into `template_version`.

### AD-B-016 — One pure module for the TDW 08, TDW 10 and TDW 13 sheet rules
- **Task:** P2-E02-T01 (look-ahead). P1-E09 (`agent-a`) and P3-E01 use it too.
- **Options:** each epic writes its own sheet rules (P1-E09 TDW 08, P2-E02 TDW 10, P3-E01 TDW 13); one pure module in `src/server/domain/evaluation.ts` for all three forms now
- **Decision and reason:** One module now. The three forms share INV-14, INV-16, BR-11 and FR-DEF-07. Only the score part differs (TDW 10 has comment boxes only). `src/server/domain/` belongs to `agent-b`, and P1-E09 is the next user of the rules. The expected sheets come from the appointed members, plus the Adviser at Proposal and Pre-Final (FR-DEF-06). A substitute takes the absent member's sheet (FR-CMT-06). So the count follows FR §3 when the committee has its template size. Scores are from 0 to the line weight (ERD `evaluation_score.score`). The total is the plain sum, with no grade equivalent (BR-15).
- **Risk:** low. `agent-a` can wire it in P1-E09 or keep its own rules. The verdict and the close stay in `milestone.ts`.
- **Undo:** revert the commits with AD-B-016.

### AD-B-017 — The Final Panel has one seat more than its size: the Panel Chair
- **Task:** P1-E13-T01 (look-ahead). It changes `seatCount` in `src/server/domain/committee.ts` (P1-E05-T01).
- **Options:** store 4 / 5 in the Final template and relabel the C8 field; or keep the FR §3 and ERD value (3 / 4, "besides the Chair") and add the Chair seat in `seatCount`
- **Decision and reason:** Keep the spec value. FR §3 defines the Final size as the Panel Members besides the Chair (3 / 4), and the ERD `template_version` gives the same values. FR-CMT-01 needs a Panel Chair seat. So `seatCount` returns the size + 1 at Final. Then the seats match the FR §3 Final sheet count (4 / 5). The Proposal size (2 / 3) already counts every seat. The seed uses 3 / 4. Printed copies are 5 / 6 for each milestone, because FR §3 gives only the Proposal count (`[CONFIRM]` Pre-Final and Final).
- **Correction (22 Nov 2026, after the agent-r review of #12):** the first version stored 4 / 5 and asked for a new C8 label. That changed the meaning of an FR §3 parameter. A Coordinator who entered 3 would get `wrong_size` on every valid Final Panel.
- **Risk:** low. The default templates (P1-E03, migration 0003) must store 3 / 4 for Final.
- **Undo:** revert the commits with AD-B-017.

### AD-A-013 — Row access: who counts as a Panel Member of a thesis, and when access ends
- **Task:** P1-E02-T01, T02
- **Options:** any `committee_member` row gives thesis read (ERD §8 literal); only seats that are not `declined`, plus substitutes. For INV-33: wait for `clearance_item` (P3-E04); use one function that answers "not ended" until P3-E04 adds the table.
- **Decision and reason:** A `declined` seat gives no access. A declined member never joins the committee (FR-CMT-03), so no reason exists to show them the thesis. Manuscript read uses agent-b's `memberAccess` (P1-E05-T01) with facts from the database: appointment form `verified`, the member's NDA `verified`. `manuscriptAccessEnded` returns false until P3-E04 adds `clearance_item`. P3-E04 must change only this one function.
- **Risk:** medium. Until P3-E04, a Panel Member keeps manuscript read after the `final_copy` record. No `final_copy` record can exist before P3-E04, so the gap is not reachable in the app.
- **Undo:** revert the commits with AD-A-013.

### AD-A-014 — The audit insert keeps no long text
- **Task:** P1-E02-T03
- **Options:** free JSON in `audit_record.detail`; a flat object of short values only
- **Decision and reason:** A flat object. Each value is a string of 200 characters or fewer, a number, a boolean or null. NFR-03 needs who, what and when, not content. The limit stops a caller from copying manuscript text or comments into the audit table, which is never deleted (BR-19). `recordAudit` takes the transaction of the write, so the audit row and the change commit together.
- **Risk:** low. A later event that needs more detail can point to its own row by `target_id`.
- **Undo:** revert the commits with AD-A-014.

### AD-A-015 — Default templates ship as a migration, with values for the gaps
- **Task:** P1-E03-T01
- **Options:** a seed script the Coordinator runs; a data migration that every database gets
- **Decision and reason:** A migration (`0003_default_templates.sql`). FR-TPL-02 says the system ships the templates, so each new database must have them. Sizes: Proposal and Pre-Final 2 (Master's) and 3 (Doctoral) Panel Members; Final 3 and 4 Panel Members besides the Panel Chair (ERD, FR §3, AD-B-017 as corrected). `seatCount` adds the Panel Chair. Printed copies: 5 and 6 for all three, because the Unified Process gives the count only for Proposal (G16). Rubric A1 to B3 on Proposal and Final only. Pre-Final (TDW 10) has no scores.
- **Risk:** medium. The Pre-Final and Final copy counts are a guess (G16). The Coordinator can change them in C8, which makes version 2.
- **Undo:** revert the commits with AD-A-015, or save a new template version in C8.

### AD-A-016 — Role change and deactivation rules for users (C9)
- **Task:** P1-E03-T04
- **Options:** allow any role change; allow a role change only while the user has no thesis, seat or record that depends on the role
- **Decision and reason:** The second option. BR-03 makes roles exclusive, and INV-02 and INV-03 check the role only when the row is written. A role change after that would leave a Student row on an Adviser, for example. So the data layer refuses a role change when any row names the user. The Coordinator deactivates the account and makes a new one instead. A Coordinator cannot deactivate their own account, so at least one active Coordinator stays.
- **Risk:** low. A typo in the role is fixed the same day, before any row names the user.
- **Undo:** revert the commits with AD-A-016.

### AD-B-018 — Appointment board: data functions first, paper links, and when "Appointed" is allowed
- **Task:** P1-E05-T02
- **Options:** for "Appointed": need the appointment form and each NDA linked, or need them verified; for the scope: build the C3 screen in the same task, or split it out
- **Decision and reason:** `markAppointed` needs the seats to pass `checkAppointment`, the TDW 06 or TDW 11 record linked, and an NDA record linked for each active seat. It does not need them verified. FR-CMT-04 says "upload ... then mark the member Appointed", and verification is a separate Coordinator step (FR-DOC-04). Manuscript access still needs both records verified (`memberAccess`, BR-08), so no member reads early. Seats are proposed and appointed only while the milestone is `ADVISER_ENDORSED` (after Gate 1a, FR-CMT-01). The milestone status change to `COMMITTEE_APPOINTED` stays in the P1-E04 wiring (`agent-a`). A refused rule returns `{ ok: false, code, reason }` so the screen can show the reason (BR-18). A wrong actor throws `AccessDeniedError` (NFR-01). Workload is the count of seats that are not declined. Availability is the count of future `available` defense slots (FR-CMT-02). The C3 screen is a new task, P1-E05-T04, because the scan upload comes from P1-E07-T02.
- **Risk:** low. If the owner wants verified paper before "Appointed", add two state checks in `markAppointed`.
- **Undo:** revert the commits with AD-B-018.

### AD-A-017 — The outside status table comes with P1-E04, not P2-E01
- **Task:** P1-E04-T03 (the milestone facts need `ipmo`, `rpo` and `ethics`). Plan §3.10 owns the work.
- **Options:** facts read fixed "not submitted" values until P2-E01; the table and its write function now, the Coordinator screen in P2-E01
- **Decision and reason:** Table `outside_status_event` (ERD §4.1) and `setOutsideStatus` now (migrations 0004, 0005). INV-20 and INV-22 read IPMO and RPO, and the TDW 08 checklist reads the ethics status. A fixed value would make those guards untestable. The screen, the notices and the Milestone 2 gate flow stay in P2-E01.
- **Risk:** low. INV-27 is a database check and a trigger (role) plus a data-layer check. The table is append-only (INV-08).
- **Undo:** revert the commits with AD-A-017 (the migrations too, before any database has them).

### AD-A-018 — Gate rows and the Return rule in `transitionMilestone`
- **Task:** P1-E04-T04, T05
- **Options:** one `gate_action` row for every status change; a gate row only where ERD §7.1 names a gate, an audit row for the rest
- **Decision and reason:** Every change writes an audit row (NFR-03). A `gate_action` row is added for Gate 1a, the date confirmation, the stage close, the certification, the Final approval and the clearance close. A Return writes a `returned` gate row with the reason, then moves the milestone to DRAFT in the same transaction (INV-18). The Return also unlocks the manuscript and clears the Ready mark (BR-07 names only the close as an unlock, so this is a decision; without it a Return at DATE_PROPOSED blocks Gate 1b for good). Gate 1b rows before the last `returned` gate row do not count, so a new round starts from zero. The Student marks Ready again. Gate 1b and Gate 2 have one row for each person, so they have their own functions and the status moves when the last person endorses.
- **Risk:** low (was medium before the review of #17). A Return at DATE_PROPOSED discards the locked state and the earlier endorsements. The Return reason tells the Student why.
- **Undo:** revert the commits with AD-A-018.

### AD-B-019 — Document data layer: the file store as a parameter, and how a scan key is checked
- **Task:** P1-E07-T02
- **Options:** for the store: import `src/server/files/storage.ts` directly, or take the two calls as a parameter; for the key: store each signed key until the upload is confirmed (new table), sign a token with a new secret, or check the key shape and that no file row uses it yet
- **Decision and reason:** `requestScanUpload` and `confirmScanUpload` take a `FilePort` (`createUploadLink`, `checkStoredFile`). The app passes `storage.ts`. Tests pass a fake, so unit tests never call S3. `confirmScanUpload` accepts only a `scan/` key that no `document_file` row uses yet, and only when the stored hash and size match (NFR-02). It needs no new table and no new secret. The key holds a random UUID, and only the uploader receives it. The uploader role comes from `template_required_item.uploader_role` (TDW 05, 06 and 11 default to the Coordinator, FR-CMT-04). The record goes to Prepared when the first upload is asked for. The prefilled PDF comes with the form pack (FR-DOC-05, Phase 4). A Mismatch also needs a reason, because the ERD check on `document_event` asks for one. The S3 and C4 screens are a new task, P1-E07-T04.
- **Risk:** low. A user who learns another user's unconfirmed key within the 5-minute link time could attach that file to their own record. It stays a locked, audited record, and the Coordinator can Return it. If this matters, add a pending-upload table.
- **Undo:** revert the commits with AD-B-019.

### AD-A-019 — Comment contexts A and B: who posts, and when
- **Task:** P1-E06-T02
- **Options:** let each role with thread access post in any open stage; follow Unified §2.12 to the letter with one window for each context
- **Decision and reason:** Follow §2.12. Context A: only the Adviser, while the status is DRAFT or READY (before Gate 1a, and after a Return). Context B: only an accepted Panel Member of the Evaluation Committee, in Milestones 1 and 2, from the appointment until Gate 1b (`COMMITTEE_APPOINTED` in M1, `ADVISER_ENDORSED` in M2). A Panel Member does not see context A threads. The Student and the Adviser reply, and so do reviewers. The Coordinator only reads. Context C (Defense Day) comes with P3-E02. A Student upload in READY is refused, so the Adviser reads a fixed commit. A new commit clears the Ready mark (INV-06), which also closes the stale mark risk of AD-A-018 for new uploads.
- **Risk:** low. A Panel Member with no verified appointment form or NDA cannot read or post (INV-24, BR-08).
- **Undo:** revert the commits with AD-A-019.

### AD-A-020 — Slots: weekly copies, a link rule, and the log belongs to the newest milestone
- **Task:** P1-E08-T01 to T03
- **Options:** store one slot with a recurrence rule and expand it on read; write one row for each week. One log entry for each milestone chosen by the Student; the newest milestone of the thesis
- **Decision and reason:** One row for each week (up to 16 slots in one publish), with `recurrence_rule` = `weekly:N` as a label. A row per slot keeps booking and INV-28 simple: each slot has its own status. A slot lasts 8 hours at most, starts in the future, and cannot overlap another slot of the same owner. The log entry goes to the newest milestone of the thesis when the Adviser drafts it, because `consultation_log_entry` needs a milestone and the Adviser has no milestone picker (ERD §4.1). The TDW 03 scan upload stays in P1-E07 (`documents.ts`). A Panel Member does not read the consultation log.
- **Correction (22 Nov 2026, after the agent-r review of #17):** the common free time (FR-SCH-08) now uses the committee of the newest milestone: the Evaluation Committee and the Adviser at Milestones 1 and 2, the Final Panel only at Milestone 3 (the Adviser completes no sheet at the Final, FR-DEF-06).
- **Risk:** low. A consultation held between two milestones lands on the newer one, which is the milestone the Student works on.
- **Undo:** revert the commits with AD-A-020.

### AD-B-020 — Notification rows now, the `email_log` row with P2-E04
- **Task:** P1-E12-T02
- **Options:** ask `agent-a` for the `email_log` and `notification_preference` tables now; write the notification rows and report each email result now, and write `email_log` when P2-E04 adds the table
- **Decision and reason:** The second option. `spec/BUILD_PLAN.md` §3.6 puts `email_log` and `notification_preference` in P2-E04, and migrations belong to `agent-a`. `notifyEvent` writes the `notification` rows first (INV-30), then sends each immediate email through an `EmailPort` parameter, as AD-B-019 does for files. It catches each failure and returns `sent`, `failed` or `skipped` for each recipient. P2-E04 writes one `email_log` row from each result. The turned-off set is a parameter until the preference table exists. Reminders and digests get no email here (FR-NTF-04, FR-NTF-06). The caller turns the recipient tokens of the catalog into user IDs, because that needs the thesis context of each event.
- **Risk:** low. Until P2-E04, a failed email leaves no log row. The result tells the caller, and the notification row stays.
- **Undo:** revert the commits with AD-B-020.

### AD-B-021 — "Mark Appointed" and the milestone status move are two steps
- **Task:** P1-E05-T04 (follow-up to AD-B-018 and the agent-r note on #20)
- **Options:** make `markAppointed` call `transitionMilestone` in one step; give the move its own action and try it once after "Mark Appointed"
- **Decision and reason:** Two steps. The rule for ADVISER_ENDORSED to COMMITTEE_APPOINTED (`agent-a`, `milestone-facts.ts`) needs `committee.appointedAt`, a verified appointment form and a verified NDA for each seat (BR-08). AD-B-018 lets "Appointed" come when the paper is linked, before it is verified. So the move is often refused right after "Mark Appointed". `advanceMilestone` runs `transitionMilestone` after the appointment commits, as `agent-a` advised (no nested transaction). The "Mark Appointed" action tries it once. On a refusal the appointment stays and the screen shows the reason. A second button on C3 moves the milestone after the Coordinator verifies the paper on C4. Its blocked reason comes from `checkTransition` (BR-18).
- **Risk:** low. A Coordinator can leave a committee Appointed while the milestone stays ADVISER_ENDORSED until the paper is verified. The reason on the screen says why.
- **Undo:** revert the commits with AD-B-021.

### AD-B-022 — A signed form links to the newest commit when its record is made
- **Task:** P1-E07-T02 (bug found by `agent-a` for P1-E13)
- **Options:** link at the first upload request to the newest commit of the milestone; ask the caller for a commit; link at the confirm step
- **Decision and reason:** Link at the first upload request, to the newest commit of the milestone's `submission_pr`. INV-34 (`document_record_signed_commit`) refuses a CERTIFICATION or SIGNED_FINAL_MANUSCRIPT record with no linked commit, and the record is made at that request. With no commit, the request is refused with `no_commit` and a reason (BR-18). The unique index `document_record_one_signed` keeps one record for each milestone, so a second request reuses it and keeps the first commit. The default templates (migration 0003) hold no Certification item. The Coordinator adds it on the template screen. `agent-a` decides whether the P1-E10 flow needs it in the migration.
- **Risk:** low. If the Student uploads a newer commit after the first request, the record stays on the older commit. A Return and a new upload do not move it.
- **Undo:** revert the commits with AD-B-022.
