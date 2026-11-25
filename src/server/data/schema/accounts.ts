// Accounts, theses, milestones and templates (ERD §4.1, stores D1 and D2).
import { sql } from "drizzle-orm";
import { boolean, check, date, integer, text, unique, uuid } from "drizzle-orm/pg-core";
import { app } from "./app";
import { createdAt, id, ts } from "./columns";
import {
  degreeLevel,
  formCode,
  milestoneCode,
  milestoneStatus,
  userRole,
  writing1Course,
} from "./enums";

// Accounts are deactivated, never deleted (ERD §1, FR-ACC-06). INV-01: one non-null role.
export const appUser = app.table(
  "app_user",
  {
    id: id(),
    // Neon Auth user id. Empty until the account first links to Neon Auth (AD-A-005).
    authUserId: text("auth_user_id").unique(),
    fullName: text("full_name").notNull(),
    // Emails go here (FR-NTF-08). Stored in lower case, so the unique key ignores case.
    email: text("email").notNull().unique(),
    role: userRole("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [check("app_user_email_lower", sql`${t.email} = lower(${t.email})`)],
);
export type AppUser = typeof appUser.$inferSelect;

// INV-02 (trigger): the Student and the Adviser have the right roles. INV-04: one per Student.
export const thesisInstance = app.table("thesis_instance", {
  id: id(),
  studentUserId: uuid("student_user_id")
    .notNull()
    .unique()
    .references(() => appUser.id),
  adviserUserId: uuid("adviser_user_id")
    .notNull()
    .references(() => appUser.id),
  title: text("title"),
  degreeLevel: degreeLevel("degree_level").notNull(),
  programStartTerm: text("program_start_term").notNull(),
  comprehensiveExamDate: date("comprehensive_exam_date"),
  writing1Course: writing1Course("writing1_course").notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => appUser.id),
  createdAt: createdAt(),
});
export type ThesisInstance = typeof thesisInstance.$inferSelect;

export const milestoneTemplate = app.table("milestone_template", {
  id: id(),
  code: milestoneCode("code").notNull().unique(),
  name: text("name").notNull(),
});

// A frozen version of the template parameters (FR-TPL-01, FR-TPL-04). No grade column (BR-15).
export const templateVersion = app.table(
  "template_version",
  {
    id: id(),
    milestoneTemplateId: uuid("milestone_template_id")
      .notNull()
      .references(() => milestoneTemplate.id),
    versionNo: integer("version_no").notNull(),
    minNoticeDays: integer("min_notice_days").notNull().default(7),
    printedCopiesDueDays: integer("printed_copies_due_days").notNull().default(7),
    panelSizeMasters: integer("panel_size_masters").notNull(),
    panelSizeDoctoral: integer("panel_size_doctoral").notNull(),
    printedCopiesMasters: integer("printed_copies_masters").notNull(),
    printedCopiesDoctoral: integer("printed_copies_doctoral").notNull(),
    reviewerWaitDays: integer("reviewer_wait_days"),
    // FR-TRK-06, D-27: null is Off. Over the limit raises a flag only (BR-17). The number is [CONFIRM].
    adviseeLimit: integer("advisee_limit"),
    changeNote: text("change_note"),
    createdByUserId: uuid("created_by_user_id").references(() => appUser.id),
    createdAt: createdAt(),
  },
  (t) => [
    unique("template_version_no").on(t.milestoneTemplateId, t.versionNo),
    check("template_version_days", sql`${t.minNoticeDays} >= 0 and ${t.printedCopiesDueDays} >= 0`),
    check("template_version_sizes", sql`${t.panelSizeMasters} > 0 and ${t.panelSizeDoctoral} > 0`),
    check("template_version_advisee_limit", sql`${t.adviseeLimit} is null or ${t.adviseeLimit} > 0`),
  ],
);

export const templateRequiredItem = app.table("template_required_item", {
  id: id(),
  templateVersionId: uuid("template_version_id")
    .notNull()
    .references(() => templateVersion.id),
  formCode: formCode("form_code").notNull(),
  label: text("label").notNull(),
  paperSigners: text("paper_signers"),
  uploaderRole: userRole("uploader_role").notNull(),
  neededForDateConfirmation: boolean("needed_for_date_confirmation").notNull().default(false),
});

// INV-25 (weights sum to 100) is a data-layer check on save.
export const rubricIndicator = app.table(
  "rubric_indicator",
  {
    id: id(),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => templateVersion.id),
    code: text("code").notNull(),
    label: text("label").notNull(),
    weightPct: integer("weight_pct").notNull(),
  },
  (t) => [
    unique("rubric_indicator_code").on(t.templateVersionId, t.code),
    check("rubric_indicator_weight", sql`${t.weightPct} > 0 and ${t.weightPct} <= 100`),
  ],
);

// INV-04: one per thesis and code. INV-18: RETURNED needs a reason. INV-26 (trigger): the
// template version never changes.
export const milestoneInstance = app.table(
  "milestone_instance",
  {
    id: id(),
    thesisInstanceId: uuid("thesis_instance_id")
      .notNull()
      .references(() => thesisInstance.id),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => templateVersion.id),
    milestoneCode: milestoneCode("milestone_code").notNull(),
    status: milestoneStatus("status").notNull().default("DRAFT"),
    returnReason: text("return_reason"),
    targetDate: date("target_date"),
    dataGatheringApprovedAt: ts("data_gathering_approved_at"),
    openedAt: ts("opened_at").notNull().defaultNow(),
  },
  (t) => [
    unique("milestone_instance_code").on(t.thesisInstanceId, t.milestoneCode),
    check(
      "milestone_instance_return_reason",
      sql`${t.status} <> 'RETURNED' or length(trim(coalesce(${t.returnReason}, ''))) > 0`,
    ),
  ],
);
