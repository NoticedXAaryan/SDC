ALTER TABLE "tasks" ADD COLUMN "assigneeRole" text;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actionHref" text;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actionLabel" text;
--> statement-breakpoint
CREATE INDEX "tasks_assignee_role_idx" ON "tasks" ("assigneeRole");
