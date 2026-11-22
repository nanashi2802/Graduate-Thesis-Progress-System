// Outside statuses (ERD §4.1, store D9, FR-WFL-10, BR-14). Moved forward from P2-E01 (AD-A-017).
// Append-only (INV-08). INV-27: the value belongs to its kind (check), and only a Coordinator
// writes it (trigger and data layer).
import { sql } from "drizzle-orm";
import { bigint, check, uuid } from "drizzle-orm/pg-core";
import { appUser, milestoneInstance } from "./accounts";
import { app } from "./app";
import { createdAt } from "./columns";
import { outsideKind, outsideValue } from "./enums";

export const OUTSIDE_VALUES = {
  ethics: ["NOT_SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUIRED", "APPROVED"],
  ipmo: ["NOT_SUBMITTED", "UNDER_CHECK", "FAILED", "PASSED"],
  rpo: ["NOT_SUBMITTED", "UNDER_EDITING", "DONE"],
  copyright: ["NOT_APPLIED", "APPLIED", "REGISTERED"],
} as const;

const pairs = Object.entries(OUTSIDE_VALUES)
  .flatMap(([kind, values]) => values.map((v) => `('${kind}','${v}')`))
  .join(", ");

export const outsideStatusEvent = app.table(
  "outside_status_event",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    milestoneInstanceId: uuid("milestone_instance_id")
      .notNull()
      .references(() => milestoneInstance.id),
    kind: outsideKind("kind").notNull(),
    value: outsideValue("value").notNull(),
    setByUserId: uuid("set_by_user_id")
      .notNull()
      .references(() => appUser.id),
    createdAt: createdAt(),
  },
  () => [check("outside_status_event_pair", sql.raw(`(kind::text, value::text) in (${pairs})`))],
);
