CREATE TYPE "app"."email_result" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TABLE "app"."email_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."email_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"notification_id" uuid,
	"recipient_user_id" uuid NOT NULL,
	"event_code" "app"."event_code" NOT NULL,
	"email_template_version" integer,
	"result" "app"."email_result" NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."notification_preference" (
	"user_id" uuid NOT NULL,
	"event_code" "app"."event_code" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "notification_preference_user_id_event_code_pk" PRIMARY KEY("user_id","event_code"),
	CONSTRAINT "notification_preference_optional" CHECK ("app"."notification_preference"."event_code" in ('A4','B1','B2','B4','B6','B7','C2','C3','C4','C5'))
);
--> statement-breakpoint
ALTER TABLE "app"."email_log" ADD CONSTRAINT "email_log_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "app"."notification"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."email_log" ADD CONSTRAINT "email_log_recipient_user_id_app_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notification_preference" ADD CONSTRAINT "notification_preference_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- INV-08: email_log is append-only (BR-19, NFR-03).
CREATE TRIGGER email_log_append_only BEFORE UPDATE OR DELETE ON app.email_log
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER email_log_no_truncate BEFORE TRUNCATE ON app.email_log
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
