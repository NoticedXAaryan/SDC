ALTER TABLE "user" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "membership_welcome_seen" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Existing accounts keep their workspace; new accounts see the introductory guide.
UPDATE "user" SET "onboarding_completed" = true,
"membership_welcome_seen" = COALESCE(role NOT IN ('user', 'outsider', 'applicant'), false);
--> statement-breakpoint
-- Abort on conflicting legacy handles instead of silently renaming anyone.
UPDATE "user" SET username = lower(trim(username)), username_lower = lower(trim(username)) WHERE username IS NOT NULL;
