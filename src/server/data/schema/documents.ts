// Documents, files and printed copies (ERD §4.1, store D7).
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  text,
  uniqueIndex,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { appUser, milestoneInstance, templateRequiredItem } from "./accounts";
import { app } from "./app";
import { createdAt, id, ts } from "./columns";
import { documentState, formCode, matchResult } from "./enums";
import { defenseAttempt } from "./defense";
import { manuscriptCommit, MAX_FILE_BYTES } from "./manuscript";

// INV-34: CERTIFICATION and SIGNED_FINAL_MANUSCRIPT need the signed commit, and each milestone
// has at most one of each. The trigger checks that the commit is in the same milestone.
export const documentRecord = app.table(
  "document_record",
  {
    id: id(),
    milestoneInstanceId: uuid("milestone_instance_id")
      .notNull()
      .references(() => milestoneInstance.id),
    templateRequiredItemId: uuid("template_required_item_id").references(() => templateRequiredItem.id),
    formCode: formCode("form_code").notNull(),
    subjectUserId: uuid("subject_user_id").references(() => appUser.id),
    linkedCommitId: uuid("linked_commit_id").references((): AnyPgColumn => manuscriptCommit.id),
    state: documentState("state").notNull().default("not_started"),
  },
  (t) => [
    check(
      "document_record_signed_commit",
      sql`${t.formCode} not in ('CERTIFICATION', 'SIGNED_FINAL_MANUSCRIPT') or ${t.linkedCommitId} is not null`,
    ),
    uniqueIndex("document_record_one_signed")
      .on(t.milestoneInstanceId, t.formCode)
      .where(sql`${t.formCode} in ('CERTIFICATION', 'SIGNED_FINAL_MANUSCRIPT')`),
  ],
);

// Append-only (INV-08). INV-09, INV-10, INV-11 as for commits. Scans are PDF or image (NFR-10).
export const documentFile = app.table(
  "document_file",
  {
    id: id(),
    documentRecordId: uuid("document_record_id")
      .notNull()
      .references(() => documentRecord.id),
    versionNo: integer("version_no").notNull(),
    fileKey: text("file_key").notNull().unique(),
    sha256: text("sha256").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => appUser.id),
    uploadedAt: ts("uploaded_at").notNull().defaultNow(),
  },
  (t) => [
    unique("document_file_version").on(t.documentRecordId, t.versionNo),
    check("document_file_sha256", sql`${t.sha256} ~ '^[0-9a-f]{64}$'`),
    check("document_file_size", sql`${t.sizeBytes} > 0 and ${t.sizeBytes} <= ${sql.raw(String(MAX_FILE_BYTES))}`),
    check("document_file_mime", sql`${t.mimeType} in ('application/pdf', 'image/jpeg', 'image/png')`),
  ],
);

// Append-only history (INV-08). A Return or a mismatch needs a reason (BR-12, BR-13).
export const documentEvent = app.table(
  "document_event",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    documentRecordId: uuid("document_record_id")
      .notNull()
      .references(() => documentRecord.id),
    fromState: documentState("from_state").notNull(),
    toState: documentState("to_state").notNull(),
    reason: text("reason"),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => appUser.id),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "document_event_reason",
      sql`${t.toState} not in ('returned', 'mismatch') or length(trim(coalesce(${t.reason}, ''))) > 0`,
    ),
  ],
);

export const printedCopyReceipt = app.table(
  "printed_copy_receipt",
  {
    id: id(),
    defenseAttemptId: uuid("defense_attempt_id")
      .notNull()
      .unique()
      .references((): AnyPgColumn => defenseAttempt.id),
    copyCount: integer("copy_count").notNull(),
    receivedAt: ts("received_at").notNull().defaultNow(),
    matchResult: matchResult("match_result").notNull().default("pending"),
  },
  (t) => [check("printed_copy_receipt_count", sql`${t.copyCount} > 0`)],
);
