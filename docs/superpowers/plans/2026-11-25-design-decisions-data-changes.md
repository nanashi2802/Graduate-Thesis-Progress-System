# Design Decisions D-24 to D-28: Data Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the code follow the five approved design-session decisions (PRD D-24 to D-28, change proposals CP-01 to CP-05): Verify or Return only, page numbers on threads, the thesis title, optional advising-form copies, and the advisee-limit flag.

**Architecture:** Each decision changes three layers in order: the pure rule in `src/server/domain/`, the table in `src/server/data/schema/` with one migration in `db/migrations/`, then the server data function in `src/server/data/` that checks access first. The pages get only the smallest change that keeps them working. The full redesign of the pages is the second plan (`2026-11-25-guided-ledger-ui.md`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle ORM with Neon Postgres, PGlite for tests (`tests/support/test-db.ts`), Vitest, pnpm.

**Spec:** `docs/PUP_CpE_Thesis_Progress_System_Functional_Requirements_v1.2.md` (FR-ACC-04, FR-ACC-09, FR-DOC-02, FR-DOC-06, FR-DOC-07, FR-DOC-12, FR-REV-04, FR-TRK-06, BR-12, Section 3 parameters), `spec/ERD.md` 1.2, `spec/proposals/2026-11-24-design-session-changes.md`, `spec/PRD.md` D-24 to D-28. Read `AGENTS.md` before you start.

## Global Constraints

- Write every comment, message and commit in ASD-STE100 at about 80% (AGENTS.md §5). Cite FR, BR, INV and decision IDs in comments and commit messages.
- No AI author or co-author line in any commit (AGENTS.md §2). Commit only when the human tells you to, unless you run in autonomous build mode (AGENTS.md §13).
- Every data function takes a `DataContext` (`db`, `actor`) and checks access before any read or write (NFR-01, AGENTS.md §12).
- History tables are append-only: `document_event`, `audit_record` and others have triggers that refuse UPDATE and DELETE (INV-08, BR-19). Never update or delete a history row, also not in a migration.
- Use pnpm only. Commands: `pnpm test <file>`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (full), `pnpm test:e2e`.
- Migrations: schema changes come from `pnpm db:generate --name <name>`. Hand-written SQL (data moves, triggers, checks) comes from `pnpm drizzle-kit generate --custom --name <name>`, then you fill the SQL file. Take the next free number in `db/migrations/` at the time you run it. Tests apply all migrations to PGlite.
- In autonomous build mode, `db/migrations/` and the data-layer core belong to `agent-a`; `src/server/domain/` belongs to `agent-b` (AGENTS.md §13.1). A human session can edit all of them.
- Flags never block an action (BR-17). Every disabled action shows its reason (BR-18).

## Review Focus

1. **Old rows in removed states.** A database that already holds `physical_received` or `mismatch` rows must keep working after the migration. Expect: live rows move to the new states, and old history rows stay as they are. Task 2 tests this.
2. **A Return of a verified document.** Before this plan, a Return was allowed from any state, including `verified`. ERD 1.2 makes `verified` final (BR-19). Expect: `verified → returned` is refused with `not_allowed`. Task 1 tests this.
3. **A page number that is out of range.** The server cannot count PDF pages (it never receives file bytes, AGENTS.md §10). Expect: the server accepts 1 to 9999 only, and the viewer clamps a larger number to its last page. Task 4 tests the server part.
4. **The title after Gate 1b.** Expect: a Student edit after the first Gate 1b of the thesis is refused with a reason, and the Coordinator cannot edit the title at all after creation. Task 5 tests this.
5. **An optional copy that leaks into a queue or a checklist.** Expect: an advising-form copy never shows in the Coordinator scan queue (C1, C4), never counts in the FR-DOC-08 checklist, and never blocks a stage close. Task 6 tests this.

---

### Task 1: Document state rules, Verify or Return only (D-28)

**Files:**
- Modify: `src/server/domain/documents.ts`
- Test: `tests/unit/domain/documents.test.ts`

**Interfaces:**
- Produces: `type DocumentState = "not_started" | "prepared" | "scan_uploaded" | "locked_as_submitted" | "verified" | "returned"`; `decideDocumentChange(from, to, actor, returnReason?)` (same signature); `canUploadScan(state: DocumentState): boolean`; `blocksStageClose(states: readonly DocumentState[]): boolean`. Later tasks import these.

- [ ] **Step 1: Rewrite the test for the new state machine**

Replace `STATES` and `ALLOWED` and the Return test in `tests/unit/domain/documents.test.ts`:

```ts
const STATES: DocumentState[] = ["not_started", "prepared", "scan_uploaded", "locked_as_submitted", "verified", "returned"];

const ALLOWED: [DocumentState, DocumentState, DocumentActor][] = [
  ["not_started", "prepared", "system"],
  ["prepared", "scan_uploaded", "uploader"],
  ["scan_uploaded", "locked_as_submitted", "system"],
  ["locked_as_submitted", "verified", "coordinator"],
  ["returned", "scan_uploaded", "uploader"],
];

it("allows a Return only from scan_uploaded or locked_as_submitted, with a reason (FR-DOC-06, FR-DOC-07, BR-13)", () => {
  for (const from of ["scan_uploaded", "locked_as_submitted"] as const) {
    expect(decideDocumentChange(from, "returned", "coordinator", "The Dean's signature is missing.")).toEqual({ ok: true });
    expect(decideDocumentChange(from, "returned", "coordinator", "  ")).toMatchObject({ code: "reason_required" });
  }
});

it("keeps a verified document final (BR-19, ERD 1.2 §7.2)", () => {
  expect(decideDocumentChange("verified", "returned", "coordinator", "x")).toMatchObject({ code: "not_allowed" });
});

it("blocks the stage close while a document is returned (BR-12)", () => {
  expect(blocksStageClose(["verified", "returned"])).toBe(true);
  expect(blocksStageClose(["verified", "locked_as_submitted"])).toBe(false);
});

it("lets the uploader upload only in prepared or returned (FR-DOC-03, BR-19)", () => {
  expect(STATES.filter(canUploadScan)).toEqual(["prepared", "returned"]);
});
```

In the "refuses every other change" test, skip the pairs `scan_uploaded>returned` and `locked_as_submitted>returned`. In the "wrong actor" test, use `["locked_as_submitted", "verified", "uploader"]` and `["locked_as_submitted", "returned", "uploader", "x"]`.

- [ ] **Step 2: Run the test and see it fail**

Run: `pnpm test tests/unit/domain/documents.test.ts`
Expected: FAIL (type errors for the removed states, and the Return from `verified` is allowed).

- [ ] **Step 3: Change `src/server/domain/documents.ts`**

- Remove `physical_received` and `mismatch` from `DocumentState`.
- `ROWS`: keep `not_started→prepared` (system), `prepared→scan_uploaded` (uploader), `scan_uploaded→locked_as_submitted` (system). Add `locked_as_submitted→verified` (coordinator), `scan_uploaded→returned` and `locked_as_submitted→returned` (coordinator), and keep `returned→scan_uploaded` (uploader). Remove the `"*"` row and every mismatch row.
- `canUploadScan`: `state === "prepared" || state === "returned"`.
- `blocksStageClose`: `states.includes("returned")`. Update its comment to the new BR-12 text.
- The `not_allowed` message: "This document change is not allowed. A locked scan changes only through a Return."

- [ ] **Step 4: Run the test and see it pass**

Run: `pnpm test tests/unit/domain/documents.test.ts`
Expected: PASS. `pnpm typecheck` still fails in callers: Task 3 fixes them.

- [ ] **Step 5: Commit**

```bash
git add src/server/domain/documents.ts tests/unit/domain/documents.test.ts
git commit -m "feat: document states are Verify or Return only, verified is final (FR-DOC-02, FR-DOC-06, FR-DOC-07, BR-12, BR-19, D-28)"
```

---

### Task 2: Migration for the document states (D-28)

**Files:**
- Create: `db/migrations/<next>_document_verify_or_return.sql` (custom migration)
- Modify: `src/server/data/schema/documents.ts` (the `document_event_reason` check and a new check on `document_record`)
- Modify: `src/server/data/schema/enums.ts` (comment only)
- Modify: `spec/ERD.md` §2 (one note)
- Test: `tests/unit/data/schema-invariants.test.ts`

**Decision for this task:** The Postgres type `document_state` keeps the values `physical_received` and `mismatch`. Old `document_event` rows hold them, and those rows can never change (INV-08). New rows cannot use them: a check on `document_record.state` and the domain rules refuse them. Write this as a note in ERD §2 next to `document_state`: "The database type keeps `physical_received` and `mismatch` for old history rows (INV-08). No live row and no new event may use them (D-28)."

**Interfaces:**
- Consumes: Task 1 `DocumentState`.
- Produces: the database refuses `document_record.state in ('physical_received', 'mismatch')`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/data/schema-invariants.test.ts`, with the seed helpers that file already uses:

```ts
it("refuses a live document in a removed state (D-28)", async () => {
  await expect(db.update(s.documentRecord).set({ state: "mismatch" as never }).where(eq(s.documentRecord.id, docId))).rejects.toThrow();
  await expect(db.update(s.documentRecord).set({ state: "physical_received" as never }).where(eq(s.documentRecord.id, docId))).rejects.toThrow();
});
```

Add a migration test in a new file `tests/unit/data/migration-document-states.test.ts`. Use PGlite, apply all migrations up to the one before the new migration, insert one record in `physical_received` and one in `mismatch` (each with an event row), apply the new migration, then assert:

```ts
expect(stateOf(received)).toBe("locked_as_submitted");
expect(stateOf(mismatched)).toBe("returned");
// The old history stays. One new event explains each move.
expect(eventsOf(mismatched).at(-1)).toMatchObject({ fromState: "mismatch", toState: "returned", reason: "A paper mismatch is now a Return (D-28)." });
expect(eventsOf(received).at(-1)).toMatchObject({ fromState: "physical_received", toState: "locked_as_submitted", reason: "The Physical received state is removed (D-28)." });
```

If applying migrations partly is not practical with the Drizzle PGlite migrator, run the SQL body of the new migration by hand on a database where you first dropped the new check. The test must prove the data move, not the migrator.

- [ ] **Step 2: Run the tests and see them fail**

Run: `pnpm test tests/unit/data/schema-invariants.test.ts tests/unit/data/migration-document-states.test.ts`
Expected: FAIL (the update succeeds, and the migration does not exist).

- [ ] **Step 3: Write the migration**

Run `pnpm drizzle-kit generate --custom --name document_verify_or_return`. In the new SQL file, in this order:
1. Insert one `document_event` for each live record in `mismatch` (to `returned`) and in `physical_received` (to `locked_as_submitted`), with the reasons from Step 1. Take `actor_user_id` from the newest event of the same record.
2. Update those `document_record` rows to the new state.
3. Add `CONSTRAINT document_record_live_state CHECK (state not in ('physical_received', 'mismatch'))` on `app.document_record`.
4. Replace the check `document_event_reason` with: `to_state <> 'returned' or length(trim(coalesce(reason, ''))) > 0`. Old `mismatch` events already have a reason, so the narrower check holds for them.

Mirror the two checks in `src/server/data/schema/documents.ts`, so that `pnpm db:generate` shows no difference afterwards. Run `pnpm db:generate --name check_drift`; if it writes a migration, the schema file and the SQL disagree: fix the schema file and delete that file.

- [ ] **Step 4: Run the tests and see them pass**

Run: `pnpm test tests/unit/data/schema-invariants.test.ts tests/unit/data/migration-document-states.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/migrations src/server/data/schema spec/ERD.md tests/unit/data
git commit -m "feat: migrate removed document states, keep old history rows (FR-DOC-02, BR-12, INV-08, D-28)"
```

---

### Task 3: Callers of the document states (D-28)

**Files:**
- Modify: `src/server/data/documents.ts` (`confirmScanUpload`, `reviewDocument`)
- Modify: `src/server/data/milestone-facts.ts:242`, `src/server/domain/milestone.ts:56,79,107,224`
- Modify: `src/server/domain/checklist.ts:25`, `src/server/data/clearance.ts:123`, `src/server/data/overview.ts:79`
- Modify: `src/components/status/tones.ts`, `src/components/banners.tsx` (comment)
- Modify: `src/app/coordinator/documents/page.tsx`, `review-form.tsx`, `actions.ts`; `src/app/student/documents/page.tsx:15`
- Test: `tests/unit/data/documents.test.ts`, `tests/unit/domain/milestone.test.ts`, `tests/unit/domain/checklist.test.ts`, `tests/unit/components/status.test.ts`, plus every test that `pnpm test` shows as broken

**Interfaces:**
- Consumes: Task 1 rules.
- Produces: `reviewDocument(ctx, { documentId: string; to: "verified" | "returned"; reason?: string | null })`; milestone block code `"document_returned"` with the message "A document was returned. The Student uploads a corrected scan first."; the facts field `documentReturned: boolean` in `src/server/domain/milestone.ts` (renamed from `documentInMismatch`).

- [ ] **Step 1: Change the tests first**

In `tests/unit/data/documents.test.ts`, "Coordinator review":
- "marks received, then verified" becomes "verifies a locked scan, with one history row and one audit record": upload, then `reviewDocument(coord(), { documentId, to: "verified" })`, expect one `document_event` `locked_as_submitted → verified` and one audit record `document.verified`.
- "needs a reason for a Return and a Mismatch" becomes "needs a reason for a Return (BR-13)".
- "lets the uploader replace a returned scan, and a mismatch file locks again" becomes "lets the uploader replace a returned scan, and the new scan locks (BR-12)".
- Add: "refuses a Return of a verified document (BR-19)": expect `{ ok: false, code: "not_allowed" }`.

In `tests/unit/domain/milestone.test.ts` and `checklist.test.ts`, replace the mismatch fixtures with `returned` and the code `document_mismatch` with `document_returned`. In `tests/unit/components/status.test.ts`, the document states list has six states.

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm test tests/unit/data/documents.test.ts tests/unit/domain tests/unit/components/status.test.ts`
Expected: FAIL.

- [ ] **Step 3: Change the code**

- `confirmScanUpload`: the path is always `[doc.state → scan_uploaded (uploader)], [scan_uploaded → locked_as_submitted (system)]`. Remove the mismatch branch. Update the doc comment.
- `reviewDocument`: `to` is `"verified" | "returned"`. A reason is required for `returned` only. Doc comment: "FR-DOC-06, FR-DOC-07: the Coordinator verifies a document or returns it with a reason."
- `milestone-facts.ts`: `documentReturned: docs.some((d) => d.state === "returned")`. `milestone.ts`: code `document_returned`, the message above.
- `checklist.ts` `SUBMITTED`: `["locked_as_submitted", "verified"]`. `clearance.ts`: `["locked_as_submitted", "verified"]`. `overview.ts` `WAITING_SCAN_STATES`: `["locked_as_submitted"]`.
- `tones.ts`: six states. Remove the `physical_received` and `mismatch` entries.
- `student/documents/page.tsx`: remove the `physical_received` message.
- Coordinator documents page: `TARGETS = ["verified", "returned"]`. `review-form.tsx`: two actions, Verify and Return. `actions.ts`: remove the two messages. Do not redesign the page here (second plan, task for C4).
- Leave `match_result` (`matched`, `mismatch`) for sheets and printed copies as it is. It is not a document state (ERD §2).

- [ ] **Step 4: Run all checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all PASS. Then `grep -rn "physical_received" src` shows nothing, and `grep -rn "\"mismatch\"" src` shows only `match_result` code.

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat: Coordinator verifies or returns a document, a returned document blocks the close (FR-DOC-06, FR-DOC-07, BR-12, D-28)"
```

---

### Task 4: Page number on a Critique Thread (D-26)

**Files:**
- Modify: `src/server/data/schema/manuscript.ts` (`critiqueThread.page`)
- Create: `db/migrations/<next>_thread_page.sql` (generated)
- Modify: `src/server/data/manuscript.ts` (`postThread`, `ThreadView`, `listThreads`)
- Modify: `src/components/pdf-viewer.tsx` (a controlled page)
- Modify: the thread composer and thread list in the reviewer workspaces (`src/app/adviser/pr/[prId]/`, `src/app/panel/pr/[prId]/`, `src/app/student/pr/[prId]/`)
- Test: `tests/unit/data/manuscript.test.ts`

**Interfaces:**
- Produces: `postThread(ctx, { commitId: string; body: string; page?: number | null }): Promise<{ threadId: string }>`; `ThreadView.page: number | null`; `PdfViewer` prop `page?: number` (when it changes, the viewer moves to `Math.min(page, pages)`).

- [ ] **Step 1: Write the failing tests**

```ts
it("stores an optional page number on a thread (FR-REV-04, D-26)", async () => {
  const { threadId } = await postThread(adviser(), { commitId, body: "See the method.", page: 14 });
  expect((await listThreads(adviser(), milestoneId)).find((t) => t.id === threadId)?.page).toBe(14);
});
it("stores no page when none is given", async () => { /* page: undefined → null */ });
it("refuses a page below 1 or above 9999, or not a whole number", async () => {
  for (const page of [0, -1, 10000, 2.5]) {
    await expect(postThread(adviser(), { commitId, body: "x", page })).rejects.toThrow("Write a page number from 1 to 9999.");
  }
});
```

- [ ] **Step 2: Run and see them fail**

Run: `pnpm test tests/unit/data/manuscript.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Schema: `page: integer("page")` on `critiqueThread`, with `check("critique_thread_page", sql\`${t.page} is null or ${t.page} between 1 and 9999\`)`. Run `pnpm db:generate --name thread_page`.
- `postThread`: check `page` before the insert (whole number, 1 to 9999), throw `InputProblem("Write a page number from 1 to 9999.")`. Insert it. Add `page` to `ThreadView` and the select in `listThreads`.
- `PdfViewer`: accept `page?: number`. In an effect on `page`, set the current page to `Math.min(Math.max(1, page), pages || page)`.
- Composer: an optional number input "Page". Thread header: when `page` is set, a button "p. {page}" in mono that sets the viewer page. No pin and no highlight on the PDF (ADR-009).

- [ ] **Step 4: Run all checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src db/migrations tests
git commit -m "feat: optional page number on a thread moves the viewer (FR-REV-04, D-26)"
```

---

### Task 5: Thesis title, set at creation and editable until Gate 1b (D-24)

**Files:**
- Modify: `src/server/data/students.ts` (`NewStudent`, `inputProblem`, `createStudent`)
- Create: `updateThesisTitle` in `src/server/data/students.ts`
- Modify: the C2 create form (`src/app/coordinator/students/`) and the S1 identity area (`src/app/student/dashboard/`)
- Test: `tests/unit/data/students.test.ts`

**Interfaces:**
- Produces: `NewStudent.title: string` (required, trimmed, 1 to 300 characters); `updateThesisTitle(ctx: DataContext, input: { title: string }): Promise<void>` (the actor's own thesis); audit action `thesis.title`.

**Decision for this task:** "Until Gate 1b" means until the first `gate_action` of kind `gate_1b` on any milestone of the thesis. After that, the title is locked for good. Only the Student edits it after creation. The Coordinator sets it only in `createStudent`.

- [ ] **Step 1: Write the failing tests**

```ts
it("stores the working title at account creation (FR-ACC-04)", ...);           // thesis.title === "A federated learning framework"
it("refuses an empty title or one over 300 characters", ...);                   // InputProblem "Write a thesis title of 1 to 300 characters."
it("lets the Student edit the title before Gate 1b, with an audit record (FR-ACC-09)", ...);
it("refuses the edit after the first Gate 1b (BR-07)", ...);                    // insert a gate_action gate_1b, expect InputProblem "The title is locked since Gate 1b."
it("refuses the edit by any role except the Student (NFR-01)", ...);            // adviser, coordinator → AccessDeniedError
```

- [ ] **Step 2: Run and see them fail**

Run: `pnpm test tests/unit/data/students.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add `title` to `NewStudent` and to the `thesisInstance` insert. Write `updateThesisTitle`: `requireActive`, the actor must be a Student, load the actor's thesis, refuse if a `gate_action` of kind `gate_1b` exists for any milestone of the thesis, update `thesis_instance.title`, write the audit record, all in one transaction. Add a "Working thesis title" field to the C2 form. Add an "Edit title" control next to the title on S1 that shows only before Gate 1b. After Gate 1b, show no control (the title is a record, not an action).

- [ ] **Step 4: Run all checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS. Fix the other tests and seeds (`tests/support/seed-m1.ts`, `scripts/seed-dev.mjs`) that call `createStudent` without a title.

- [ ] **Step 5: Commit**

```bash
git add src tests scripts
git commit -m "feat: working thesis title at account creation, Student edits it until Gate 1b (FR-ACC-04, FR-ACC-09, BR-07, D-24)"
```

---

### Task 6: Optional copies of the advising forms (D-25)

**Files:**
- Modify: `src/server/data/schema/enums.ts` (`form_code` adds `TDW_01`, `TDW_02`), `src/server/data/schema/documents.ts` (`documentRecord.optional`)
- Create: `db/migrations/<next>_advising_copies.sql` (generated, then add the check by hand if Drizzle does not write it)
- Modify: `src/server/data/documents.ts` (new function, `confirmScanUpload`, `reviewDocument`, `deliverables`)
- Modify: `src/app/student/documents/page.tsx` (a collapsed group "Advising forms · optional")
- Test: `tests/unit/data/documents.test.ts`

**Interfaces:**
- Produces: `type AdvisingForm = "TDW_01" | "TDW_02" | "TDW_04"`; `requestAdvisingCopyUpload(ctx, input: { formCode: AdvisingForm; sha256: string; size: number; contentType: string }, files: FilePort): Promise<DocResult<{ documentId: string; link: UploadLink }>>`; `deliverables(...)` rows get `optional: boolean`; a new refusal code `"optional_copy"` with the message "An optional copy is not reviewed."

**Decision for this task:** An optional record belongs to the Student's Milestone 1 (`proposal`) instance, has `template_required_item_id = null` and `optional = true`, and is created in `prepared` like other records. Its upload path is only `prepared → scan_uploaded`. It never goes to `locked_as_submitted`. Because `canUploadScan("scan_uploaded")` is false, it is write-once. One record per form code and thesis.

- [ ] **Step 1: Write the failing tests**

```ts
it("lets the Student upload one copy of each advising form (FR-DOC-12)", ...);        // state scan_uploaded, optional true
it("refuses a second copy of the same form (write-once)", ...);                       // code "locked"
it("refuses a form code that is not an advising form", ...);                          // InputProblem or refusal
it("never shows a copy in the Coordinator scan queue or the FR-DOC-08 checklist", ...); // overview count and checklist unchanged
it("refuses a Coordinator review of a copy", ...);                                    // { ok: false, code: "optional_copy" }
it("does not block the stage close", ...);                                            // blocksStageClose over milestone docs stays false
```

- [ ] **Step 2: Run and see them fail**

Run: `pnpm test tests/unit/data/documents.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Enum: add `"TDW_01", "TDW_02"` before `"TDW_03"`. Column: `optional: boolean("optional").notNull().default(false)` with `check("document_record_optional", sql\`not ${t.optional} or (${t.formCode} in ('TDW_01','TDW_02','TDW_04') and ${t.templateRequiredItemId} is null)\`)`. Run `pnpm db:generate --name advising_copies`.
- `requestAdvisingCopyUpload`: Student only, own thesis, find or create the optional record on the proposal milestone, refuse if `!canUploadScan(record.state)`, return a signed link (same `files.createUploadLink` as scans).
- `confirmScanUpload`: when `doc.optional`, the path is only `[prepared → scan_uploaded (uploader)]`, and the final state is `scan_uploaded`.
- `reviewDocument`: refuse `optional_copy` before any other check after access.
- S3 page: a collapsed group "Advising forms · optional" with TDW 01, TDW 04 and TDW 02 (in that order, Guidelines A.1 to A.4) and an "Upload copy" control. The full S3 design is in the second plan.

- [ ] **Step 4: Run all checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src db/migrations tests
git commit -m "feat: optional write-once copies of TDW 01, 02 and 04, never reviewed or blocking (FR-DOC-12, D-25)"
```

---

### Task 7: Advisee-limit parameter and flag (D-27)

**Files:**
- Modify: `src/server/data/schema/accounts.ts` (`templateVersion.adviseeLimit`)
- Create: `db/migrations/<next>_advisee_limit.sql` (generated)
- Modify: `src/server/data/templates.ts` (`TemplateParams`, `saveTemplateVersion`, new `adviseeLimit`)
- Modify: `src/server/data/queues.ts` (A1 rows), `src/server/data/committees.ts` (C3 board rows)
- Modify: the C8 parameters form (`src/app/coordinator/templates/`)
- Test: `tests/unit/data/templates.test.ts`, `tests/unit/data/queues.test.ts`, `tests/unit/data/committees.test.ts`

**Interfaces:**
- Produces: `TemplateParams.adviseeLimit: number | null` (null means Off); `adviseeLimit(db: Db): Promise<number | null>` reads the latest `proposal` template version (the version a new Student starts with, see `latestVersionId(db, "proposal")`); A1 row field `adviseeLimitFlag: boolean`; C3 board row field `adviseeLimitFlag: boolean` for the Adviser of each Student.

**Decision for this task:** The flag is true when the limit is not null and the Adviser has more active Students than the limit. It is information only (BR-17): no action checks it.

- [ ] **Step 1: Write the failing tests**

```ts
it("saves the advisee limit as Off by default (FR-TRK-06, D-27)", ...);      // adviseeLimit === null
it("refuses a limit below 1", ...);                                          // InputProblem "Set the advisee limit to Off or a number of 1 or more."
it("flags an Adviser over the limit on A1 and C3, and never blocks", ...);   // limit 1, 2 advisees → flag true; an endorse action still works
it("shows no flag while the limit is Off", ...);
```

- [ ] **Step 2: Run and see them fail**

Run: `pnpm test tests/unit/data/templates.test.ts tests/unit/data/queues.test.ts tests/unit/data/committees.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Column `adviseeLimit: integer("advisee_limit")` with a check `is null or > 0`; `pnpm db:generate --name advisee_limit`. Add the field to `TemplateParams`, its validation and the insert. Write `adviseeLimit(db)`. Count active advisees for each Adviser once per request, and set the flag on the A1 and C3 rows. C8 form: "Advisee limit" with "Off" (empty) or a number. The number itself stays `[CONFIRM]`: ship Off.

- [ ] **Step 4: Run all checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src db/migrations tests
git commit -m "feat: advisee-limit parameter, Off by default, raises a flag only (FR-TRK-06, BR-17, D-27)"
```

---

### Task 8: Close-out

**Files:**
- Modify: `spec/BUILD_PLAN.md` (tick or add the tasks, if the project tracks this work there)
- Modify: `AGENTS.md` §6 **only if the owner says so**: point the two rows to `…Functional_Requirements_v1.2.md` and `…Unified_Thesis_Process_v1.2.md`

- [ ] **Step 1: Run the full checks**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: all PASS. If an e2e test looks for the old labels ("Mark received", "Mismatch" on C4), change the test to "Verify" and "Return".

- [ ] **Step 2: Apply the migrations to the Neon branch**

Run: `pnpm db:migrate` (needs `.env.local`). Expected: the new migrations apply with no error.

- [ ] **Step 3: Ask the owner about AGENTS.md §6, then commit**

```bash
git add spec/BUILD_PLAN.md
git commit -m "docs: design decisions D-24 to D-28 built (FR-DOC-02, FR-REV-04, FR-ACC-09, FR-DOC-12, FR-TRK-06)"
```
