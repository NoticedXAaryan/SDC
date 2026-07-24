CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"metric_value" text,
	"metric_trend" text,
	"is_actionable" boolean DEFAULT false,
	"action_link" text,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_images" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"url" text NOT NULL,
	"orderIndex" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"githubUrl" text,
	"twitterUrl" text
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "parentId" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "checklist" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "staff" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "forms" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "certificateTemplateId" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "budgetId" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "formResponses" jsonb;--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_parent_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "teamMembers";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "images";