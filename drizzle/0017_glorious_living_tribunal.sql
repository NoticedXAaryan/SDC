ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cert_templates" ADD CONSTRAINT "cert_templates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cert_templates" ADD CONSTRAINT "cert_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates_v2" ADD CONSTRAINT "certificates_v2_template_id_cert_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."cert_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates_v2" ADD CONSTRAINT "certificates_v2_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates_v2" ADD CONSTRAINT "certificates_v2_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievement_submissions_user_id_idx" ON "achievement_submissions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "achievement_submissions_reviewed_by_idx" ON "achievement_submissions" USING btree ("reviewedBy");--> statement-breakpoint
CREATE INDEX "application_reviews_application_id_idx" ON "application_reviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_reviews_reviewer_id_idx" ON "application_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "cert_templates_event_id_idx" ON "cert_templates" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "cert_templates_created_by_idx" ON "cert_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "certificates_v2_template_id_idx" ON "certificates_v2" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "certificates_v2_user_id_idx" ON "certificates_v2" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "certificates_v2_event_id_idx" ON "certificates_v2" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "competitions_user_id_idx" ON "competitions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "content_items_author_id_idx" ON "content_items" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "form_fields_form_id_idx" ON "form_fields" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_responses_form_id_idx" ON "form_responses" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_responses_user_id_idx" ON "form_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forms_created_by_idx" ON "forms" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "interviews_applicant_id_idx" ON "interviews" USING btree ("applicantId");--> statement-breakpoint
CREATE INDEX "interviews_interviewer_id_idx" ON "interviews" USING btree ("interviewerId");--> statement-breakpoint
CREATE INDEX "procurement_requests_requested_by_idx" ON "procurement_requests" USING btree ("requestedBy");--> statement-breakpoint
CREATE INDEX "procurement_requests_event_id_idx" ON "procurement_requests" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "procurement_requests_vendor_id_idx" ON "procurement_requests" USING btree ("selectedVendorId");--> statement-breakpoint
CREATE INDEX "research_papers_user_id_idx" ON "researchPapers" USING btree ("userId");