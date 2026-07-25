CREATE TABLE "communications" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text,
	"senderId" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"targetAudience" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sentCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_senderId_user_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;