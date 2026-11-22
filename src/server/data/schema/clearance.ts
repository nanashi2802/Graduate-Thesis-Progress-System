// Clearance items (ERD §4.1, store D9, FR-CLR-01 to 04, AD-A-029). A row means the Coordinator
// verified the item. Append-only (INV-08): the Coordinator cannot undo it, and it ends Panel access (INV-33).
import { uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { appUser, milestoneInstance } from "./accounts";
import { app } from "./app";
import { id, ts } from "./columns";
import { documentRecord } from "./documents";
import { clearanceKind } from "./enums";

export const clearanceItem = app.table(
  "clearance_item",
  {
    id: id(),
    milestoneInstanceId: uuid("milestone_instance_id")
      .notNull()
      .references(() => milestoneInstance.id),
    kind: clearanceKind("kind").notNull(),
    evidenceDocumentId: uuid("evidence_document_id").references(() => documentRecord.id),
    verifiedAt: ts("verified_at").notNull().defaultNow(),
    verifiedByUserId: uuid("verified_by_user_id")
      .notNull()
      .references(() => appUser.id),
  },
  (t) => [uniqueIndex("clearance_item_one_kind").on(t.milestoneInstanceId, t.kind)],
);
