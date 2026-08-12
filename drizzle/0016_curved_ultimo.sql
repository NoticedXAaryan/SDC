CREATE INDEX "budgets_event_id_idx" ON "budgets" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "event_invites_event_id_idx" ON "event_invites" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "event_sessions_event_id_idx" ON "event_sessions" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "expenses_budget_id_idx" ON "expenses" USING btree ("budgetId");--> statement-breakpoint
CREATE INDEX "incomes_event_id_idx" ON "incomes" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "session_attendance_session_id_idx" ON "session_attendance" USING btree ("sessionId");