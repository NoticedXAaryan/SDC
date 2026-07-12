CREATE TYPE "public"."ai_log_status" AS ENUM('success', 'failed');

CREATE TABLE "ai_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"response" text,
	"latencyMs" integer,
	"modelUsed" text DEFAULT 'openrouter/free',
	"status" "ai_log_status" DEFAULT 'success',
	"entityId" text,
	"entityType" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "events" ADD COLUMN "aiDraftMessage" text;
ALTER TABLE "events" ADD COLUMN "aiDraftEmail" text;