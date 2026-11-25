CREATE TABLE "app"."sign_in_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sign_in_attempt_bucket_created_idx" ON "app"."sign_in_attempt" USING btree ("bucket","created_at");