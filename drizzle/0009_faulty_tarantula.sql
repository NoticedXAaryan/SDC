CREATE TABLE "event_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"userId" text,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending',
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;