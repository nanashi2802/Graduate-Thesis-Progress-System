ALTER TYPE "app"."form_code" ADD VALUE 'TDW_01' BEFORE 'TDW_03';--> statement-breakpoint
ALTER TYPE "app"."form_code" ADD VALUE 'TDW_02' BEFORE 'TDW_03';--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD COLUMN "optional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "document_record_one_optional" ON "app"."document_record" USING btree ("milestone_instance_id","form_code") WHERE "app"."document_record"."optional";--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD CONSTRAINT "document_record_optional" CHECK (not "app"."document_record"."optional" or ("app"."document_record"."form_code"::text in ('TDW_01', 'TDW_02', 'TDW_04') and "app"."document_record"."template_required_item_id" is null));