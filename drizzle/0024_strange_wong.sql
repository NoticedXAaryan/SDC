CREATE TABLE "application_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cycle" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_document_owner_cycle" UNIQUE("user_id","cycle"),
	CONSTRAINT "application_document_size" CHECK ("application_documents"."size" > 0 AND "application_documents"."size" <= 2097152 AND length("application_documents"."content") <= 2796204)
);
--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;