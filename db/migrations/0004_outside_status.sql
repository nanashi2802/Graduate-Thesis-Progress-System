CREATE TYPE "app"."outside_kind" AS ENUM('ethics', 'ipmo', 'rpo', 'copyright');--> statement-breakpoint
CREATE TYPE "app"."outside_value" AS ENUM('NOT_SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUIRED', 'APPROVED', 'UNDER_CHECK', 'FAILED', 'PASSED', 'UNDER_EDITING', 'DONE', 'NOT_APPLIED', 'APPLIED', 'REGISTERED');--> statement-breakpoint
CREATE TABLE "app"."outside_status_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."outside_status_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"milestone_instance_id" uuid NOT NULL,
	"kind" "app"."outside_kind" NOT NULL,
	"value" "app"."outside_value" NOT NULL,
	"set_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outside_status_event_pair" CHECK ((kind::text, value::text) in (('ethics','NOT_SUBMITTED'), ('ethics','UNDER_REVIEW'), ('ethics','CHANGES_REQUIRED'), ('ethics','APPROVED'), ('ipmo','NOT_SUBMITTED'), ('ipmo','UNDER_CHECK'), ('ipmo','FAILED'), ('ipmo','PASSED'), ('rpo','NOT_SUBMITTED'), ('rpo','UNDER_EDITING'), ('rpo','DONE'), ('copyright','NOT_APPLIED'), ('copyright','APPLIED'), ('copyright','REGISTERED')))
);
--> statement-breakpoint
ALTER TABLE "app"."outside_status_event" ADD CONSTRAINT "outside_status_event_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."outside_status_event" ADD CONSTRAINT "outside_status_event_set_by_user_id_app_user_id_fk" FOREIGN KEY ("set_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;