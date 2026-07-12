CREATE TYPE "public"."ai_log_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('idea', 'drafting', 'review', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."procurement_status" AS ENUM('draft', 'pending_quotes', 'approval', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'blocked');--> statement-breakpoint
CREATE TABLE "achievement_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"proofUrl" text,
	"status" "submission_status" DEFAULT 'pending',
	"pointsAwarded" integer DEFAULT 0,
	"reviewedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "club_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"isFrozen" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" text
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"platform" text,
	"status" "content_status" DEFAULT 'idea',
	"authorId" text,
	"scheduledFor" timestamp with time zone,
	"publishedAt" timestamp with time zone,
	"mediaUrls" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone NOT NULL,
	"location" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "procurement_status" DEFAULT 'draft',
	"requestedBy" text NOT NULL,
	"eventId" text,
	"estimatedCost" integer,
	"selectedVendorId" text,
	"financeTransactionId" text,
	"quotesUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_attendance" (
	"sessionId" text NOT NULL,
	"userId" text NOT NULL,
	"checkedInAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_attendance_unq" UNIQUE("sessionId","userId")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo',
	"eventId" text,
	"assigneeId" text,
	"dueDate" timestamp with time zone,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contactName" text,
	"email" text,
	"phone" text,
	"category" text,
	"rating" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "isInternal" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "aiDraftMessage" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "aiDraftEmail" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "createdBy" text;--> statement-breakpoint
ALTER TABLE "pointLogs" ADD COLUMN "points" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" "submission_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "researchPapers" ADD COLUMN "status" "submission_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "achievement_submissions" ADD CONSTRAINT "achievement_submissions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_submissions" ADD CONSTRAINT "achievement_submissions_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_updatedBy_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_requestedBy_user_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_selectedVendorId_vendors_id_fk" FOREIGN KEY ("selectedVendorId") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_sessionId_event_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."event_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_user_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pointLogs" DROP COLUMN "amount";