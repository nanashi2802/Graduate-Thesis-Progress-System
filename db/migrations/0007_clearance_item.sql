CREATE TYPE "app"."clearance_kind" AS ENUM('ipmo', 'rpo', 'gate_2', 'copyright', 'final_copy', 'conference_cert', 'journal_pub');--> statement-breakpoint
CREATE TABLE "app"."clearance_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_instance_id" uuid NOT NULL,
	"kind" "app"."clearance_kind" NOT NULL,
	"evidence_document_id" uuid,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by_user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."clearance_item" ADD CONSTRAINT "clearance_item_milestone_instance_id_milestone_instance_id_fk" FOREIGN KEY ("milestone_instance_id") REFERENCES "app"."milestone_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."clearance_item" ADD CONSTRAINT "clearance_item_evidence_document_id_document_record_id_fk" FOREIGN KEY ("evidence_document_id") REFERENCES "app"."document_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."clearance_item" ADD CONSTRAINT "clearance_item_verified_by_user_id_app_user_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "app"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clearance_item_one_kind" ON "app"."clearance_item" USING btree ("milestone_instance_id","kind");