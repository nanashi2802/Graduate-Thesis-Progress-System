// Manuscript, commits and threads (ERD §4.1, stores D3, D4 and D11).
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  primaryKey,
  text,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { appUser, milestoneInstance } from "./accounts";
import { app } from "./app";
import { createdAt, id, ts } from "./columns";
import { commentContext, threadState, userRole } from "./enums";
import { documentFile } from "./documents";

// NFR-10, AS-11 (proposed): 50 MB at most.
export const MAX_FILE_BYTES = 52_428_800;

// One per milestone (FR-REV-01). `locked_at` is set at Gate 1b and cleared at close (BR-07).
export const submissionPr = app.table("submission_pr", {
  id: id(),
  milestoneInstanceId: uuid("milestone_instance_id")
    .notNull()
    .unique()
    .references(() => milestoneInstance.id),
  readyCommitId: uuid("ready_commit_id").references((): AnyPgColumn => manuscriptCommit.id),
  lockedAt: ts("locked_at"),
});

// Append-only (INV-08). INV-05 (trigger): no new commit while the PR is locked.
// INV-09: write-once key. INV-10: SHA-256 form. INV-11: size limit.
export const manuscriptCommit = app.table(
  "manuscript_commit",
  {
    id: id(),
    submissionPrId: uuid("submission_pr_id")
      .notNull()
      .references((): AnyPgColumn => submissionPr.id),
    ordinal: integer("ordinal").notNull(),
    fileKey: text("file_key").notNull().unique(),
    sha256: text("sha256").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    changeNote: text("change_note"),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => appUser.id),
    uploadedAt: ts("uploaded_at").notNull().defaultNow(),
  },
  (t) => [
    unique("manuscript_commit_ordinal").on(t.submissionPrId, t.ordinal),
    check("manuscript_commit_ordinal_positive", sql`${t.ordinal} > 0`),
    check("manuscript_commit_sha256", sql`${t.sha256} ~ '^[0-9a-f]{64}$'`),
    check("manuscript_commit_size", sql`${t.sizeBytes} > 0 and ${t.sizeBytes} <= ${sql.raw(String(MAX_FILE_BYTES))}`),
  ],
);

// A thread belongs to one commit (BR-06). Only the author resolves it (BR-05, INV-07, DL).
export const critiqueThread = app.table(
  "critique_thread",
  {
    id: id(),
    commitId: uuid("commit_id")
      .notNull()
      .references(() => manuscriptCommit.id),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => appUser.id),
    authorRole: userRole("author_role").notNull(),
    context: commentContext("context").notNull(),
    body: text("body").notNull(),
    // FR-REV-04, D-26: an optional page number. The server never counts PDF pages (NFR-12), so only the range is checked.
    page: integer("page"),
    state: threadState("state").notNull().default("OPEN"),
    resolvedAt: ts("resolved_at"),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "critique_thread_resolved_at",
      sql`(${t.state} = 'RESOLVED') = (${t.resolvedAt} is not null)`,
    ),
    check("critique_thread_page", sql`${t.page} is null or ${t.page} between 1 and 9999`),
  ],
);

export const threadReply = app.table(
  "thread_reply",
  {
    id: id(),
    critiqueThreadId: uuid("critique_thread_id")
      .notNull()
      .references(() => critiqueThread.id),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => appUser.id),
    ordinal: integer("ordinal").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique("thread_reply_ordinal").on(t.critiqueThreadId, t.ordinal)],
);

// A commit says it addresses a thread. It does not change the thread state (FR-REV-08).
export const threadAddressTag = app.table(
  "thread_address_tag",
  {
    commitId: uuid("commit_id")
      .notNull()
      .references(() => manuscriptCommit.id),
    critiqueThreadId: uuid("critique_thread_id")
      .notNull()
      .references(() => critiqueThread.id),
  },
  (t) => [primaryKey({ columns: [t.commitId, t.critiqueThreadId] })],
);

// A Panel Member comment on a scan or a commit (FR-REV-11). INV-31: exactly one target.
export const documentComment = app.table(
  "document_comment",
  {
    id: id(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => appUser.id),
    documentFileId: uuid("document_file_id").references((): AnyPgColumn => documentFile.id),
    commitId: uuid("commit_id").references(() => manuscriptCommit.id),
    body: text("body").notNull(),
    state: threadState("state").notNull().default("OPEN"),
    createdAt: createdAt(),
  },
  (t) => [check("document_comment_one_target", sql`num_nonnulls(${t.documentFileId}, ${t.commitId}) = 1`)],
);
