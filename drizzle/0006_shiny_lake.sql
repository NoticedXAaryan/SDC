ALTER TABLE "certificates" ALTER COLUMN "eventId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "pointLogs" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "certificates_user_id_idx" ON "certificates" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("startsAt");--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "tasks_event_id_idx" ON "tasks" USING btree ("eventId");--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "budgetId";