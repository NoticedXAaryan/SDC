ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint

-- Backfill issuer for existing accounts (Better Auth 1.7 migration)
-- Google OAuth accounts use the OIDC issuer URL
UPDATE "account" SET "issuer" = 'https://accounts.google.com' WHERE "providerId" = 'google' AND "issuer" IS NULL;--> statement-breakpoint
-- Email/password credential accounts use a local namespace
UPDATE "account" SET "issuer" = 'local:credential' WHERE "providerId" = 'credential' AND "issuer" IS NULL;--> statement-breakpoint
-- Catch-all for any other OAuth providers: local:oauth:<providerId>
UPDATE "account" SET "issuer" = 'local:oauth:' || "providerId" WHERE "issuer" IS NULL;--> statement-breakpoint

ALTER TABLE "events" ADD COLUMN "livenessRequired" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "scanConfidence" real;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "livenessVerified" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "events_status_domain_idx" ON "events" USING btree ("status","domain");--> statement-breakpoint
CREATE INDEX "events_deleted_at_idx" ON "events" USING btree ("deletedAt");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_issuer_accountId_uidx" UNIQUE("issuer","accountId");