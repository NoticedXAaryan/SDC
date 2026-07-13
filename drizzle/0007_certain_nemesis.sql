ALTER TYPE "public"."application_status" ADD VALUE 'draft' BEFORE 'applied';--> statement-breakpoint
ALTER TYPE "public"."event_visibility" ADD VALUE 'members_only';--> statement-breakpoint
ALTER TYPE "public"."event_visibility" ADD VALUE 'invite_only';--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "event_sessions" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pointLogs" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "updatedAt" SET DEFAULT now();