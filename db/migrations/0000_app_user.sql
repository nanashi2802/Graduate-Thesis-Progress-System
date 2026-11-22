CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TYPE "app"."user_role" AS ENUM('student', 'adviser', 'panel_member', 'coordinator');--> statement-breakpoint
CREATE TABLE "app"."app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "app"."user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "app_user_email_unique" UNIQUE("email"),
	CONSTRAINT "app_user_email_lower" CHECK ("app"."app_user"."email" = lower("app"."app_user"."email"))
);
