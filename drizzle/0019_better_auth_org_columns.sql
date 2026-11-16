ALTER TABLE "session" ADD COLUMN "activeOrganizationId" text;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_activeOrganizationId_organization_id_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
