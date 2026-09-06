ALTER TABLE "certificates_v2" ADD COLUMN "email_sent_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "certificates_v2" ADD COLUMN "email_attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates_v2" ADD COLUMN "email_last_error" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_v2_active_issuance_uidx" ON "certificates_v2" ("user_id", "template_id", coalesce("event_id", '__adhoc__')) WHERE "status" = 'valid';
