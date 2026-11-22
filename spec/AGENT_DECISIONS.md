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
