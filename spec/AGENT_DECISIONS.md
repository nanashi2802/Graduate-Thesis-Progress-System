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
- **Risk:** low. With `onboarding@resend.dev`, Resend sends only to the account owner.
- **Undo:** Remove the variable, and remove the test branch in `src/server/notify/daily.ts`.
