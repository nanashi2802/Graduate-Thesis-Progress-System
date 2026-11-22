CREATE TYPE "app"."booking_status" AS ENUM('pending', 'confirmed', 'declined');--> statement-breakpoint
CREATE TYPE "app"."comment_context" AS ENUM('iteration', 'committee_review', 'defense_day');--> statement-breakpoint
CREATE TYPE "app"."committee_kind" AS ENUM('evaluation_committee', 'final_panel');--> statement-breakpoint
CREATE TYPE "app"."defense_status" AS ENUM('proposed', 'scheduled', 'held', 'closed');--> statement-breakpoint
CREATE TYPE "app"."degree_level" AS ENUM('masters', 'doctoral');--> statement-breakpoint
CREATE TYPE "app"."designation" AS ENUM('none', 'lead_panel_member', 'panel_chair');--> statement-breakpoint
CREATE TYPE "app"."document_state" AS ENUM('not_started', 'prepared', 'scan_uploaded', 'locked_as_submitted', 'physical_received', 'verified', 'mismatch', 'returned');--> statement-breakpoint
CREATE TYPE "app"."evaluation_form" AS ENUM('TDW_08', 'TDW_10', 'TDW_13');--> statement-breakpoint
CREATE TYPE "app"."event_code" AS ENUM('A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'E1', 'E2', 'E3', 'F1', 'F2');--> statement-breakpoint
CREATE TYPE "app"."form_code" AS ENUM('TDW_03', 'TDW_04', 'TDW_05', 'TDW_06', 'TDW_07', 'TDW_08', 'TDW_09', 'TDW_10', 'TDW_11', 'TDW_12', 'TDW_13', 'OR', 'ETHICS_CERT', 'CERTIFICATION', 'SIGNED_FINAL_MANUSCRIPT', 'MINUTES', 'FINAL_COPY', 'CONFERENCE_CERT', 'JOURNAL_PUB', 'SUPPORTING');--> statement-breakpoint
CREATE TYPE "app"."gate_kind" AS ENUM('gate_1a', 'gate_1b', 'certification', 'gate_2', 'date_confirmation', 'stage_close', 'clearance_close', 'data_gathering');--> statement-breakpoint
CREATE TYPE "app"."gate_result" AS ENUM('endorsed', 'returned', 'accepted', 'approved', 'recorded');--> statement-breakpoint
CREATE TYPE "app"."match_result" AS ENUM('pending', 'matched', 'mismatch');--> statement-breakpoint
CREATE TYPE "app"."member_status" AS ENUM('proposed', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "app"."milestone_code" AS ENUM('proposal', 'pre_final', 'final');--> statement-breakpoint
CREATE TYPE "app"."milestone_status" AS ENUM('DRAFT', 'READY', 'ADVISER_ENDORSED', 'COMMITTEE_APPOINTED', 'COMMITTEE_ENDORSED', 'DATE_PROPOSED', 'DEFENSE_SCHEDULED', 'DEFENSE_HELD', 'CLOSED', 'RETURNED', 'CERTIFIED', 'FINAL_APPROVED', 'CLEARED');--> statement-breakpoint
CREATE TYPE "app"."slot_mode" AS ENUM('in_person', 'online');--> statement-breakpoint
CREATE TYPE "app"."slot_status" AS ENUM('available', 'pending', 'confirmed');--> statement-breakpoint
CREATE TYPE "app"."slot_type" AS ENUM('consultation', 'defense');--> statement-breakpoint
CREATE TYPE "app"."tdw10_section" AS ENUM('title_prelims', 'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4', 'chapter_5', 'references_appendices', 'remarks', 'general_observations');--> statement-breakpoint
CREATE TYPE "app"."thread_state" AS ENUM('OPEN', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "app"."verdict" AS ENUM('approved', 'approved_with_revisions', 'disapproved');--> statement-breakpoint
CREATE TYPE "app"."writing1_course" AS ENUM('RSH_641', 'RSH_741');--> statement-breakpoint
CREATE TABLE "app"."milestone_instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thesis_instance_id" uuid NOT NULL,
	"template_version_id" uuid NOT NULL,
	"milestone_code" "app"."milestone_code" NOT NULL,
	"status" "app"."milestone_status" DEFAULT 'DRAFT' NOT NULL,
	"return_reason" text,
	"target_date" date,
	"data_gathering_approved_at" timestamp with time zone,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestone_instance_code" UNIQUE("thesis_instance_id","milestone_code"),
	CONSTRAINT "milestone_instance_return_reason" CHECK ("app"."milestone_instance"."status" <> 'RETURNED' or length(trim(coalesce("app"."milestone_instance"."return_reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."milestone_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "app"."milestone_code" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "milestone_template_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "app"."rubric_indicator" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_version_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"weight_pct" integer NOT NULL,
	CONSTRAINT "rubric_indicator_code" UNIQUE("template_version_id","code"),
	CONSTRAINT "rubric_indicator_weight" CHECK ("app"."rubric_indicator"."weight_pct" > 0 and "app"."rubric_indicator"."weight_pct" <= 100)
);
--> statement-breakpoint
CREATE TABLE "app"."template_required_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_version_id" uuid NOT NULL,
	"form_code" "app"."form_code" NOT NULL,
	"label" text NOT NULL,
	"paper_signers" text,
	"uploader_role" "app"."user_role" NOT NULL,
	"needed_for_date_confirmation" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."template_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_template_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"min_notice_days" integer DEFAULT 7 NOT NULL,
	"printed_copies_due_days" integer DEFAULT 7 NOT NULL,
	"panel_size_masters" integer NOT NULL,
	"panel_size_doctoral" integer NOT NULL,
	"printed_copies_masters" integer NOT NULL,
	"printed_copies_doctoral" integer NOT NULL,
	"reviewer_wait_days" integer,
	"change_note" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_version_no" UNIQUE("milestone_template_id","version_no"),
	CONSTRAINT "template_version_days" CHECK ("app"."template_version"."min_notice_days" >= 0 and "app"."template_version"."printed_copies_due_days" >= 0),
	CONSTRAINT "template_version_sizes" CHECK ("app"."template_version"."panel_size_masters" > 0 and "app"."template_version"."panel_size_doctoral" > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."thesis_instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" uuid NOT NULL,
	"adviser_user_id" uuid NOT NULL,
	"title" text,
	"degree_level" "app"."degree_level" NOT NULL,
	"program_start_term" text NOT NULL,
	"comprehensive_exam_date" date,
	"writing1_course" "app"."writing1_course" NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "thesis_instance_student_user_id_unique" UNIQUE("student_user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."critique_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commit_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"author_role" "app"."user_role" NOT NULL,
	"context" "app"."comment_context" NOT NULL,
	"body" text NOT NULL,
	"state" "app"."thread_state" DEFAULT 'OPEN' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "critique_thread_resolved_at" CHECK (("app"."critique_thread"."state" = 'RESOLVED') = ("app"."critique_thread"."resolved_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "app"."document_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_user_id" uuid NOT NULL,
	"document_file_id" uuid,
	"commit_id" uuid,
	"body" text NOT NULL,
	"state" "app"."thread_state" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_comment_one_target" CHECK (num_nonnulls("app"."document_comment"."document_file_id", "app"."document_comment"."commit_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "app"."manuscript_commit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_pr_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"file_key" text NOT NULL,
	"sha256" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"change_note" text,
	"uploaded_by_user_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manuscript_commit_file_key_unique" UNIQUE("file_key"),
	CONSTRAINT "manuscript_commit_ordinal" UNIQUE("submission_pr_id","ordinal"),
	CONSTRAINT "manuscript_commit_ordinal_positive" CHECK ("app"."manuscript_commit"."ordinal" > 0),
	CONSTRAINT "manuscript_commit_sha256" CHECK ("app"."manuscript_commit"."sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "manuscript_commit_size" CHECK ("app"."manuscript_commit"."size_bytes" > 0 and "app"."manuscript_commit"."size_bytes" <= 52428800)
);
--> statement-breakpoint
CREATE TABLE "app"."submission_pr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_instance_id" uuid NOT NULL,
	"ready_commit_id" uuid,
	"locked_at" timestamp with time zone,
	CONSTRAINT "submission_pr_milestone_instance_id_unique" UNIQUE("milestone_instance_id")
);
--> statement-breakpoint
CREATE TABLE "app"."thread_address_tag" (
	"commit_id" uuid NOT NULL,
	"critique_thread_id" uuid NOT NULL,
	CONSTRAINT "thread_address_tag_commit_id_critique_thread_id_pk" PRIMARY KEY("commit_id","critique_thread_id")
);
--> statement-breakpoint
CREATE TABLE "app"."thread_reply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"critique_thread_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "thread_reply_ordinal" UNIQUE("critique_thread_id","ordinal")
);
--> statement-breakpoint
CREATE TABLE "app"."booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"thesis_instance_id" uuid NOT NULL,
	"agenda" text,
	"status" "app"."booking_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."booking_thread_link" (
	"booking_id" uuid NOT NULL,
	"critique_thread_id" uuid NOT NULL,
	CONSTRAINT "booking_thread_link_booking_id_critique_thread_id_pk" PRIMARY KEY("booking_id","critique_thread_id")
);
--> statement-breakpoint
CREATE TABLE "app"."consultation_log_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_instance_id" uuid NOT NULL,
	"booking_id" uuid,
	"held_at" timestamp with time zone NOT NULL,
	"place_or_platform" text,
	"topic" text,
	"recommendations" text,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "consultation_log_entry_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "app"."slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"slot_type" "app"."slot_type" NOT NULL,
	"mode" "app"."slot_mode" NOT NULL,
	"meeting_link" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"recurrence_rule" text,
	"status" "app"."slot_status" DEFAULT 'available' NOT NULL,
	CONSTRAINT "slot_time_order" CHECK ("app"."slot"."ends_at" > "app"."slot"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "app"."committee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thesis_instance_id" uuid NOT NULL,
	"kind" "app"."committee_kind" NOT NULL,
	"appointment_document_id" uuid,
	"appointed_at" timestamp with time zone,
	CONSTRAINT "committee_kind_per_thesis" UNIQUE("thesis_instance_id","kind")
);
--> statement-breakpoint
CREATE TABLE "app"."committee_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"committee_id" uuid NOT NULL,
	"member_user_id" uuid NOT NULL,
	"designation" "app"."designation" DEFAULT 'none' NOT NULL,
	"status" "app"."member_status" DEFAULT 'proposed' NOT NULL,
	"nda_document_id" uuid,
	"appointed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."defense_substitute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defense_attempt_id" uuid NOT NULL,
	"absent_member_id" uuid NOT NULL,
	"substitute_user_id" uuid NOT NULL,
	"nda_document_id" uuid
);
--> statement-breakpoint
CREATE TABLE "app"."document_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."document_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"document_record_id" uuid NOT NULL,
	"from_state" "app"."document_state" NOT NULL,
	"to_state" "app"."document_state" NOT NULL,
	"reason" text,
	"actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_event_reason" CHECK ("app"."document_event"."to_state" not in ('returned', 'mismatch') or length(trim(coalesce("app"."document_event"."reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."document_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_record_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"file_key" text NOT NULL,
	"sha256" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_file_file_key_unique" UNIQUE("file_key"),
	CONSTRAINT "document_file_version" UNIQUE("document_record_id","version_no"),
	CONSTRAINT "document_file_sha256" CHECK ("app"."document_file"."sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "document_file_size" CHECK ("app"."document_file"."size_bytes" > 0 and "app"."document_file"."size_bytes" <= 52428800),
	CONSTRAINT "document_file_mime" CHECK ("app"."document_file"."mime_type" in ('application/pdf', 'image/jpeg', 'image/png'))
);
--> statement-breakpoint
CREATE TABLE "app"."document_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_instance_id" uuid NOT NULL,
	"template_required_item_id" uuid,
	"form_code" "app"."form_code" NOT NULL,
	"subject_user_id" uuid,
	"linked_commit_id" uuid,
	"state" "app"."document_state" DEFAULT 'not_started' NOT NULL,
	CONSTRAINT "document_record_signed_commit" CHECK ("app"."document_record"."form_code" not in ('CERTIFICATION', 'SIGNED_FINAL_MANUSCRIPT') or "app"."document_record"."linked_commit_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "app"."printed_copy_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defense_attempt_id" uuid NOT NULL,
	"copy_count" integer NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"match_result" "app"."match_result" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "printed_copy_receipt_defense_attempt_id_unique" UNIQUE("defense_attempt_id"),
	CONSTRAINT "printed_copy_receipt_count" CHECK ("app"."printed_copy_receipt"."copy_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."defense_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_instance_id" uuid NOT NULL,
	"attempt_no" integer NOT NULL,
	"proposed_date" date,
	"scheduled_start_at" timestamp with time zone,
	"room_or_link" text,
	"status" "app"."defense_status" DEFAULT 'proposed' NOT NULL,
	"verdict" "app"."verdict",
	"verdict_by_user_id" uuid,
	"verdict_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	CONSTRAINT "defense_attempt_no" UNIQUE("milestone_instance_id","attempt_no"),
	CONSTRAINT "defense_attempt_no_positive" CHECK ("app"."defense_attempt"."attempt_no" > 0),
	CONSTRAINT "defense_attempt_verdict_set" CHECK (("app"."defense_attempt"."verdict" is null) = ("app"."defense_attempt"."verdict_by_user_id" is null) and ("app"."defense_attempt"."verdict" is null) = ("app"."defense_attempt"."verdict_at" is null))
);
--> statement-breakpoint
CREATE TABLE "app"."evaluation_comment" (
	"evaluation_entry_id" uuid NOT NULL,
	"section" "app"."tdw10_section" NOT NULL,
	"body" text NOT NULL,
	CONSTRAINT "evaluation_comment_evaluation_entry_id_section_pk" PRIMARY KEY("evaluation_entry_id","section")
);
--> statement-breakpoint
CREATE TABLE "app"."evaluation_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defense_attempt_id" uuid NOT NULL,
	"member_user_id" uuid NOT NULL,
	"form" "app"."evaluation_form" NOT NULL,
	"action_taken" "app"."verdict",
	"sheet_file_key" text,
	"sheet_match" "app"."match_result" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluation_entry_sheet_file_key_unique" UNIQUE("sheet_file_key"),
	CONSTRAINT "evaluation_entry_member" UNIQUE("defense_attempt_id","member_user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."evaluation_score" (
	"evaluation_entry_id" uuid NOT NULL,
	"rubric_indicator_id" uuid NOT NULL,
	"score" numeric(6, 2) NOT NULL,
	CONSTRAINT "evaluation_score_evaluation_entry_id_rubric_indicator_id_pk" PRIMARY KEY("evaluation_entry_id","rubric_indicator_id"),
	CONSTRAINT "evaluation_score_not_negative" CHECK ("app"."evaluation_score"."score" >= 0)
);
--> statement-breakpoint
CREATE TABLE "app"."minutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defense_attempt_id" uuid NOT NULL,
	"body" text NOT NULL,
	"issued_at" timestamp with time zone,
	"issued_by_user_id" uuid,
	CONSTRAINT "minutes_defense_attempt_id_unique" UNIQUE("defense_attempt_id")
);
--> statement-breakpoint
CREATE TABLE "app"."revision_acceptance" (
	"revision_item_id" uuid NOT NULL,
	"member_user_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revision_acceptance_revision_item_id_member_user_id_pk" PRIMARY KEY("revision_item_id","member_user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."revision_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defense_attempt_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"body" text NOT NULL,
	"linked_commit_id" uuid,
	CONSTRAINT "revision_item_ordinal" UNIQUE("defense_attempt_id","ordinal")
);
--> statement-breakpoint
CREATE TABLE "app"."audit_record" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."audit_record_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_user_id" uuid NOT NULL,
	"actor_role" "app"."user_role" NOT NULL,
	"action" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" uuid,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."gate_action" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."gate_action_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"milestone_instance_id" uuid NOT NULL,
	"gate" "app"."gate_kind" NOT NULL,
	"result" "app"."gate_result" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"actor_role" "app"."user_role" NOT NULL,
	"commit_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gate_action_return_reason" CHECK ("app"."gate_action"."result" <> 'returned' or length(trim(coalesce("app"."gate_action"."reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"event_code" "app"."event_code" NOT NULL,
	"target_table" text,
	"target_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app"."milestone_instance" ADD CONSTRAINT "milestone_instance_thesis_instance_id_thesis_instance_id_fk" FOREIGN KEY ("thesis_instance_id") REFERENCES "app"."thesis_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."milestone_instance" ADD CONSTRAINT "milestone_instance_template_version_id_template_version_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "app"."template_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."rubric_indicator" ADD CONSTRAINT "rubric_indicator_template_version_id_template_version_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "app"."template_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."template_required_item" ADD CONSTRAINT "template_required_item_template_version_id_template_version_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "app"."template_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."template_version" ADD CONSTRAINT "template_version_milestone_template_id_milestone_template_id_fk" FOREIGN KEY ("milestone_template_id") REFERENCES "app"."milestone_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."template_version" ADD CONSTRAINT "template_version_created_by_user_id_app_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thesis_instance" ADD CONSTRAINT "thesis_instance_student_user_id_app_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thesis_instance" ADD CONSTRAINT "thesis_instance_adviser_user_id_app_user_id_fk" FOREIGN KEY ("adviser_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thesis_instance" ADD CONSTRAINT "thesis_instance_created_by_user_id_app_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."critique_thread" ADD CONSTRAINT "critique_thread_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."critique_thread" ADD CONSTRAINT "critique_thread_author_user_id_app_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_comment" ADD CONSTRAINT "document_comment_author_user_id_app_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_comment" ADD CONSTRAINT "document_comment_document_file_id_document_file_id_fk" FOREIGN KEY ("document_file_id") REFERENCES "app"."document_file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_comment" ADD CONSTRAINT "document_comment_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."manuscript_commit" ADD CONSTRAINT "manuscript_commit_submission_pr_id_submission_pr_id_fk" FOREIGN KEY ("submission_pr_id") REFERENCES "app"."submission_pr"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."manuscript_commit" ADD CONSTRAINT "manuscript_commit_uploaded_by_user_id_app_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."submission_pr" ADD CONSTRAINT "submission_pr_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."submission_pr" ADD CONSTRAINT "submission_pr_ready_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("ready_commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thread_address_tag" ADD CONSTRAINT "thread_address_tag_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thread_address_tag" ADD CONSTRAINT "thread_address_tag_critique_thread_id_critique_thread_id_fk" FOREIGN KEY ("critique_thread_id") REFERENCES "app"."critique_thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thread_reply" ADD CONSTRAINT "thread_reply_critique_thread_id_critique_thread_id_fk" FOREIGN KEY ("critique_thread_id") REFERENCES "app"."critique_thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."thread_reply" ADD CONSTRAINT "thread_reply_author_user_id_app_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."booking" ADD CONSTRAINT "booking_slot_id_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "app"."slot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."booking" ADD CONSTRAINT "booking_thesis_instance_id_thesis_instance_id_fk" FOREIGN KEY ("thesis_instance_id") REFERENCES "app"."thesis_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."booking_thread_link" ADD CONSTRAINT "booking_thread_link_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "app"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."booking_thread_link" ADD CONSTRAINT "booking_thread_link_critique_thread_id_critique_thread_id_fk" FOREIGN KEY ("critique_thread_id") REFERENCES "app"."critique_thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."consultation_log_entry" ADD CONSTRAINT "consultation_log_entry_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."consultation_log_entry" ADD CONSTRAINT "consultation_log_entry_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "app"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."slot" ADD CONSTRAINT "slot_owner_user_id_app_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."committee" ADD CONSTRAINT "committee_thesis_instance_id_thesis_instance_id_fk" FOREIGN KEY ("thesis_instance_id") REFERENCES "app"."thesis_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."committee" ADD CONSTRAINT "committee_appointment_document_id_document_record_id_fk" FOREIGN KEY ("appointment_document_id") REFERENCES "app"."document_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."committee_member" ADD CONSTRAINT "committee_member_committee_id_committee_id_fk" FOREIGN KEY ("committee_id") REFERENCES "app"."committee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."committee_member" ADD CONSTRAINT "committee_member_member_user_id_app_user_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."committee_member" ADD CONSTRAINT "committee_member_nda_document_id_document_record_id_fk" FOREIGN KEY ("nda_document_id") REFERENCES "app"."document_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."defense_substitute" ADD CONSTRAINT "defense_substitute_defense_attempt_id_defense_attempt_id_fk" FOREIGN KEY ("defense_attempt_id") REFERENCES "app"."defense_attempt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."defense_substitute" ADD CONSTRAINT "defense_substitute_absent_member_id_committee_member_id_fk" FOREIGN KEY ("absent_member_id") REFERENCES "app"."committee_member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."defense_substitute" ADD CONSTRAINT "defense_substitute_substitute_user_id_app_user_id_fk" FOREIGN KEY ("substitute_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."defense_substitute" ADD CONSTRAINT "defense_substitute_nda_document_id_document_record_id_fk" FOREIGN KEY ("nda_document_id") REFERENCES "app"."document_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_event" ADD CONSTRAINT "document_event_document_record_id_document_record_id_fk" FOREIGN KEY ("document_record_id") REFERENCES "app"."document_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_event" ADD CONSTRAINT "document_event_actor_user_id_app_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_file" ADD CONSTRAINT "document_file_document_record_id_document_record_id_fk" FOREIGN KEY ("document_record_id") REFERENCES "app"."document_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_file" ADD CONSTRAINT "document_file_uploaded_by_user_id_app_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD CONSTRAINT "document_record_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD CONSTRAINT "document_record_template_required_item_id_template_required_item_id_fk" FOREIGN KEY ("template_required_item_id") REFERENCES "app"."template_required_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD CONSTRAINT "document_record_subject_user_id_app_user_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD CONSTRAINT "document_record_linked_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("linked_commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."printed_copy_receipt" ADD CONSTRAINT "printed_copy_receipt_defense_attempt_id_defense_attempt_id_fk" FOREIGN KEY ("defense_attempt_id") REFERENCES "app"."defense_attempt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."defense_attempt" ADD CONSTRAINT "defense_attempt_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."defense_attempt" ADD CONSTRAINT "defense_attempt_verdict_by_user_id_app_user_id_fk" FOREIGN KEY ("verdict_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."evaluation_comment" ADD CONSTRAINT "evaluation_comment_evaluation_entry_id_evaluation_entry_id_fk" FOREIGN KEY ("evaluation_entry_id") REFERENCES "app"."evaluation_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."evaluation_entry" ADD CONSTRAINT "evaluation_entry_defense_attempt_id_defense_attempt_id_fk" FOREIGN KEY ("defense_attempt_id") REFERENCES "app"."defense_attempt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."evaluation_entry" ADD CONSTRAINT "evaluation_entry_member_user_id_app_user_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."evaluation_score" ADD CONSTRAINT "evaluation_score_evaluation_entry_id_evaluation_entry_id_fk" FOREIGN KEY ("evaluation_entry_id") REFERENCES "app"."evaluation_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."evaluation_score" ADD CONSTRAINT "evaluation_score_rubric_indicator_id_rubric_indicator_id_fk" FOREIGN KEY ("rubric_indicator_id") REFERENCES "app"."rubric_indicator"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."minutes" ADD CONSTRAINT "minutes_defense_attempt_id_defense_attempt_id_fk" FOREIGN KEY ("defense_attempt_id") REFERENCES "app"."defense_attempt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."minutes" ADD CONSTRAINT "minutes_issued_by_user_id_app_user_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."revision_acceptance" ADD CONSTRAINT "revision_acceptance_revision_item_id_revision_item_id_fk" FOREIGN KEY ("revision_item_id") REFERENCES "app"."revision_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."revision_acceptance" ADD CONSTRAINT "revision_acceptance_member_user_id_app_user_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."revision_item" ADD CONSTRAINT "revision_item_defense_attempt_id_defense_attempt_id_fk" FOREIGN KEY ("defense_attempt_id") REFERENCES "app"."defense_attempt"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."revision_item" ADD CONSTRAINT "revision_item_linked_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("linked_commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."audit_record" ADD CONSTRAINT "audit_record_actor_user_id_app_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gate_action" ADD CONSTRAINT "gate_action_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gate_action" ADD CONSTRAINT "gate_action_actor_user_id_app_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gate_action" ADD CONSTRAINT "gate_action_commit_id_manuscript_commit_id_fk" FOREIGN KEY ("commit_id") REFERENCES "app"."manuscript_commit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notification" ADD CONSTRAINT "notification_recipient_user_id_app_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_record_one_signed" ON "app"."document_record" USING btree ("milestone_instance_id","form_code") WHERE "app"."document_record"."form_code" in ('CERTIFICATION', 'SIGNED_FINAL_MANUSCRIPT');