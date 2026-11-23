// ERD §2 enums. Use these values only. Do not invent new values.
import { app } from "./app";

export const userRole = app.enum("user_role", ["student", "adviser", "panel_member", "coordinator"]);
export const degreeLevel = app.enum("degree_level", ["masters", "doctoral"]);
export const writing1Course = app.enum("writing1_course", ["RSH_641", "RSH_741"]);
export const milestoneCode = app.enum("milestone_code", ["proposal", "pre_final", "final"]);
export const milestoneStatus = app.enum("milestone_status", [
  "DRAFT",
  "READY",
  "ADVISER_ENDORSED",
  "COMMITTEE_APPOINTED",
  "COMMITTEE_ENDORSED",
  "DATE_PROPOSED",
  "DEFENSE_SCHEDULED",
  "DEFENSE_HELD",
  "CLOSED",
  "RETURNED",
  "CERTIFIED",
  "FINAL_APPROVED",
  "CLEARED",
]);
export const commentContext = app.enum("comment_context", ["iteration", "committee_review", "defense_day"]);
export const threadState = app.enum("thread_state", ["OPEN", "RESOLVED"]);
export const committeeKind = app.enum("committee_kind", ["evaluation_committee", "final_panel"]);
export const designation = app.enum("designation", ["none", "lead_panel_member", "panel_chair"]);
export const memberStatus = app.enum("member_status", ["proposed", "accepted", "declined"]);
export const gateKind = app.enum("gate_kind", [
  "gate_1a",
  "gate_1b",
  "certification",
  "gate_2",
  "date_confirmation",
  "stage_close",
  "clearance_close",
  "data_gathering",
]);
export const gateResult = app.enum("gate_result", ["endorsed", "returned", "accepted", "approved", "recorded"]);
export const documentState = app.enum("document_state", [
  "not_started",
  "prepared",
  "scan_uploaded",
  "locked_as_submitted",
  "physical_received",
  "verified",
  "mismatch",
  "returned",
]);
export const formCode = app.enum("form_code", [
  "TDW_03",
  "TDW_04",
  "TDW_05",
  "TDW_06",
  "TDW_07",
  "TDW_08",
  "TDW_09",
  "TDW_10",
  "TDW_11",
  "TDW_12",
  "TDW_13",
  "OR",
  "ETHICS_CERT",
  "CERTIFICATION",
  "SIGNED_FINAL_MANUSCRIPT",
  "MINUTES",
  "FINAL_COPY",
  "CONFERENCE_CERT",
  "JOURNAL_PUB",
  "SUPPORTING",
]);
export const slotType = app.enum("slot_type", ["consultation", "defense"]);
export const slotMode = app.enum("slot_mode", ["in_person", "online"]);
export const slotStatus = app.enum("slot_status", ["available", "pending", "confirmed"]);
export const bookingStatus = app.enum("booking_status", ["pending", "confirmed", "declined"]);
export const defenseStatus = app.enum("defense_status", ["proposed", "scheduled", "held", "closed"]);
export const verdict = app.enum("verdict", ["approved", "approved_with_revisions", "disapproved"]);
export const evaluationForm = app.enum("evaluation_form", ["TDW_08", "TDW_10", "TDW_13"]);
export const tdw10Section = app.enum("tdw10_section", [
  "title_prelims",
  "chapter_1",
  "chapter_2",
  "chapter_3",
  "chapter_4",
  "chapter_5",
  "references_appendices",
  "remarks",
  "general_observations",
]);
export const matchResult = app.enum("match_result", ["pending", "matched", "mismatch"]);
export const eventCode = app.enum("event_code", [
  "A1", "A2", "A3", "A4", "A5", "A6",
  "B1", "B2", "B3", "B4", "B5", "B6", "B7",
  "C1", "C2", "C3", "C4", "C5", "C6",
  "E1", "E2", "E3",
  "F1", "F2",
]);

export const emailResult = app.enum("email_result", ["sent", "failed"]);

export type UserRole = (typeof userRole.enumValues)[number];
export type MilestoneCodeValue = (typeof milestoneCode.enumValues)[number];
export type MilestoneStatusValue = (typeof milestoneStatus.enumValues)[number];
export type FormCode = (typeof formCode.enumValues)[number];
export type DocumentState = (typeof documentState.enumValues)[number];
export type GateKindValue = (typeof gateKind.enumValues)[number];
export type GateResultValue = (typeof gateResult.enumValues)[number];
export type MemberStatus = (typeof memberStatus.enumValues)[number];
export type DegreeLevelValue = (typeof degreeLevel.enumValues)[number];
export type Writing1CourseValue = (typeof writing1Course.enumValues)[number];
// Outside statuses (ERD §2, BR-14). One enum holds the values of every kind. INV-27 checks the pair.
export const outsideKind = app.enum("outside_kind", ["ethics", "ipmo", "rpo", "copyright"]);
export const outsideValue = app.enum("outside_value", [
  "NOT_SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUIRED",
  "APPROVED",
  "UNDER_CHECK",
  "FAILED",
  "PASSED",
  "UNDER_EDITING",
  "DONE",
  "NOT_APPLIED",
  "APPLIED",
  "REGISTERED",
]);
export type OutsideKind = (typeof outsideKind.enumValues)[number];
export type OutsideValue = (typeof outsideValue.enumValues)[number];
// Clearance items (ERD §2, FR-CLR-01).
export const clearanceKind = app.enum("clearance_kind", [
  "ipmo",
  "rpo",
  "gate_2",
  "copyright",
  "final_copy",
  "conference_cert",
  "journal_pub",
]);
export type ClearanceKind = (typeof clearanceKind.enumValues)[number];
