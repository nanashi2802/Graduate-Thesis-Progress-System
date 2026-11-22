// Committees and seats (ERD §4.1, store D6). INV-03 (trigger): seats go to Panel Members only.
import { unique, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { appUser, thesisInstance } from "./accounts";
import { app } from "./app";
import { id, ts } from "./columns";
import { committeeKind, designation, memberStatus } from "./enums";
import { defenseAttempt } from "./defense";
import { documentRecord } from "./documents";

// One Evaluation Committee and one Final Panel per thesis at most (ERD §5).
export const committee = app.table(
  "committee",
  {
    id: id(),
    thesisInstanceId: uuid("thesis_instance_id")
      .notNull()
      .references(() => thesisInstance.id),
    kind: committeeKind("kind").notNull(),
    appointmentDocumentId: uuid("appointment_document_id").references((): AnyPgColumn => documentRecord.id),
    appointedAt: ts("appointed_at"),
  },
  (t) => [unique("committee_kind_per_thesis").on(t.thesisInstanceId, t.kind)],
);

// The Adviser is never a row here (ERD §5). A declined seat needs a new row (ERD §7.2).
export const committeeMember = app.table("committee_member", {
  id: id(),
  committeeId: uuid("committee_id")
    .notNull()
    .references(() => committee.id),
  memberUserId: uuid("member_user_id")
    .notNull()
    .references(() => appUser.id),
  designation: designation("designation").notNull().default("none"),
  status: memberStatus("status").notNull().default("proposed"),
  ndaDocumentId: uuid("nda_document_id").references((): AnyPgColumn => documentRecord.id),
  appointedAt: ts("appointed_at"),
});

export const defenseSubstitute = app.table("defense_substitute", {
  id: id(),
  defenseAttemptId: uuid("defense_attempt_id")
    .notNull()
    .references((): AnyPgColumn => defenseAttempt.id),
  absentMemberId: uuid("absent_member_id")
    .notNull()
    .references(() => committeeMember.id),
  substituteUserId: uuid("substitute_user_id")
    .notNull()
    .references(() => appUser.id),
  ndaDocumentId: uuid("nda_document_id").references((): AnyPgColumn => documentRecord.id),
});
