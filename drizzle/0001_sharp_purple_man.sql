ALTER TABLE "applications" ADD COLUMN "applicationCycle" text NOT NULL;--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_time_idx" ON "auditLogs" USING btree ("actorId","timestamp");--> statement-breakpoint
CREATE INDEX "point_logs_user_id_idx" ON "pointLogs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "registrations_event_id_idx" ON "registrations" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "registrations_user_id_idx" ON "registrations" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_cycle_unique" UNIQUE("userId","applicationCycle");--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_user_unq" UNIQUE("eventId","userId");