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
