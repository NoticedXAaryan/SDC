ALTER TABLE "applications" ADD COLUMN "linkedinUrl" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "githubUrl" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "portfolioUrl" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "resumeUrl" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "skills" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "teamPreference" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "whyJoin" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "priorExperience" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "availability" text;