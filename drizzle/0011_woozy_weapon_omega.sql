CREATE TYPE "public"."cert_status" AS ENUM('valid', 'revoked', 'draft');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('short_text', 'long_text', 'email', 'number', 'dropdown', 'checkbox', 'file', 'date', 'rating');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('approved', 'rejected', 'needs_info');--> statement-breakpoint
CREATE TABLE "application_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"action" "review_action" NOT NULL,
	"reason_code" text,
	"reason_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cert_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"event_id" text,
	"background_url" text,
	"fields" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"version" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "certificates_v2" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text,
	"data" jsonb NOT NULL,
	"pdf_url" text,
	"verify_id" text NOT NULL,
	"status" "cert_status" DEFAULT 'valid',
	"revoked_reason" text,
	"issued_at" timestamp DEFAULT now(),
	"issued_by" text NOT NULL,
	CONSTRAINT "certificates_v2_verify_id_unique" UNIQUE("verify_id")
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"type" "field_type" NOT NULL,
	"label" text NOT NULL,
	"required" boolean DEFAULT false,
	"options" jsonb,
	"auto_fill_key" text,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"user_id" text,
	"answers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"status" "form_status" DEFAULT 'draft',
	"settings" jsonb DEFAULT '{"allowExternal":false,"requireLogin":true,"allowMultiple":false,"autoFillProfile":true,"quotaPerUser":1,"quotaPerForm":1000,"collegeDomainOnly":true}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username_lower" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "handle_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "handle_change_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_lower_unique" UNIQUE("username_lower");