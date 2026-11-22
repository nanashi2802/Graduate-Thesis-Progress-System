// Gate actions, audit records and in-app notifications (ERD §4.1, stores D10 and D13).
import { sql } from "drizzle-orm";
import { bigint, check, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { appUser, milestoneInstance } from "./accounts";
import { app } from "./app";
import { createdAt, id, ts } from "./columns";
import { eventCode, gateKind, gateResult, userRole } from "./enums";
import { manuscriptCommit } from "./manuscript";

const identityId = () => bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity();

// Append-only (INV-08). INV-19: a Return needs a reason (BR-13).
export const gateAction = app.table(
  "gate_action",
  {
    id: identityId(),
    milestoneInstanceId: uuid("milestone_instance_id")
      .notNull()
      .references(() => milestoneInstance.id),
    gate: gateKind("gate").notNull(),
    result: gateResult("result").notNull(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => appUser.id),
    actorRole: userRole("actor_role").notNull(),
    commitId: uuid("commit_id").references(() => manuscriptCommit.id),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [
    check("gate_action_return_reason", sql`${t.result} <> 'returned' or length(trim(coalesce(${t.reason}, ''))) > 0`),
  ],
);

// Append-only (INV-08, NFR-03). `detail` holds no manuscript text.
export const auditRecord = app.table("audit_record", {
  id: identityId(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => appUser.id),
  actorRole: userRole("actor_role").notNull(),
  action: text("action").notNull(),
  targetTable: text("target_table").notNull(),
  targetId: uuid("target_id"),
  detail: jsonb("detail"),
  createdAt: createdAt(),
});

// One in-app event for one user (FR-NTF-01). No role reads another user's rows (ERD §8).
export const notification = app.table("notification", {
  id: id(),
  recipientUserId: uuid("recipient_user_id")
    .notNull()
    .references(() => appUser.id),
  eventCode: eventCode("event_code").notNull(),
  targetTable: text("target_table"),
  targetId: uuid("target_id"),
  createdAt: createdAt(),
  readAt: ts("read_at"),
});
