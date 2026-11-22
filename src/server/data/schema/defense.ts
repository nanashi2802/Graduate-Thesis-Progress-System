// Defense attempts, sheets, Minutes and revision items (ERD §4.1, stores D8 and D12).
// No column holds a subject grade or a grade equivalent (BR-15, INV-32).
import { sql } from "drizzle-orm";
import { check, date, integer, numeric, primaryKey, text, unique, uuid } from "drizzle-orm/pg-core";
import { appUser, milestoneInstance, rubricIndicator } from "./accounts";
import { app } from "./app";
import { id, ts } from "./columns";
import { defenseStatus, evaluationForm, matchResult, tdw10Section, verdict } from "./enums";
import { manuscriptCommit } from "./manuscript";

// INV-12 to INV-16 are data-layer checks (P1-E09).
export const defenseAttempt = app.table(
  "defense_attempt",
  {
    id: id(),
    milestoneInstanceId: uuid("milestone_instance_id")
      .notNull()
      .references(() => milestoneInstance.id),
    attemptNo: integer("attempt_no").notNull(),
    proposedDate: date("proposed_date"),
    scheduledStartAt: ts("scheduled_start_at"),
    roomOrLink: text("room_or_link"),
    status: defenseStatus("status").notNull().default("proposed"),
    verdict: verdict("verdict"),
    verdictByUserId: uuid("verdict_by_user_id").references(() => appUser.id),
    verdictAt: ts("verdict_at"),
    closedAt: ts("closed_at"),
  },
  (t) => [
    unique("defense_attempt_no").on(t.milestoneInstanceId, t.attemptNo),
    check("defense_attempt_no_positive", sql`${t.attemptNo} > 0`),
    check(
      "defense_attempt_verdict_set",
      sql`(${t.verdict} is null) = (${t.verdictByUserId} is null) and (${t.verdict} is null) = (${t.verdictAt} is null)`,
    ),
  ],
);

export const evaluationEntry = app.table(
  "evaluation_entry",
  {
    id: id(),
    defenseAttemptId: uuid("defense_attempt_id")
      .notNull()
      .references(() => defenseAttempt.id),
    memberUserId: uuid("member_user_id")
      .notNull()
      .references(() => appUser.id),
    form: evaluationForm("form").notNull(),
    actionTaken: verdict("action_taken"),
    sheetFileKey: text("sheet_file_key").unique(),
    sheetMatch: matchResult("sheet_match").notNull().default("pending"),
    verifiedAt: ts("verified_at"),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("evaluation_entry_member").on(t.defenseAttemptId, t.memberUserId)],
);

// The score is 0 to the indicator weight (data-layer check, P1-E09). The total is derived.
export const evaluationScore = app.table(
  "evaluation_score",
  {
    evaluationEntryId: uuid("evaluation_entry_id")
      .notNull()
      .references(() => evaluationEntry.id),
    rubricIndicatorId: uuid("rubric_indicator_id")
      .notNull()
      .references(() => rubricIndicator.id),
    score: numeric("score", { precision: 6, scale: 2 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.evaluationEntryId, t.rubricIndicatorId] }),
    check("evaluation_score_not_negative", sql`${t.score} >= 0`),
  ],
);

export const evaluationComment = app.table(
  "evaluation_comment",
  {
    evaluationEntryId: uuid("evaluation_entry_id")
      .notNull()
      .references(() => evaluationEntry.id),
    section: tdw10Section("section").notNull(),
    body: text("body").notNull(),
  },
  (t) => [primaryKey({ columns: [t.evaluationEntryId, t.section] })],
);

export const minutes = app.table("minutes", {
  id: id(),
  defenseAttemptId: uuid("defense_attempt_id")
    .notNull()
    .unique()
    .references(() => defenseAttempt.id),
  body: text("body").notNull(),
  issuedAt: ts("issued_at"),
  issuedByUserId: uuid("issued_by_user_id").references(() => appUser.id),
});

// Proposal and Pre-Final only (FR-REV-13). The milestone check is in the data layer.
export const revisionItem = app.table(
  "revision_item",
  {
    id: id(),
    defenseAttemptId: uuid("defense_attempt_id")
      .notNull()
      .references(() => defenseAttempt.id),
    ordinal: integer("ordinal").notNull(),
    body: text("body").notNull(),
    linkedCommitId: uuid("linked_commit_id").references(() => manuscriptCommit.id),
  },
  (t) => [unique("revision_item_ordinal").on(t.defenseAttemptId, t.ordinal)],
);

export const revisionAcceptance = app.table(
  "revision_acceptance",
  {
    revisionItemId: uuid("revision_item_id")
      .notNull()
      .references(() => revisionItem.id),
    memberUserId: uuid("member_user_id")
      .notNull()
      .references(() => appUser.id),
    acceptedAt: ts("accepted_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.revisionItemId, t.memberUserId] })],
);
