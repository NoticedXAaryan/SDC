CREATE TABLE "college_identities" (
	"user_id" text PRIMARY KEY NOT NULL,
	"college_email" text,
	"verified_at" timestamp with time zone,
	"enrollment_number" text,
	"college_name" text,
	"pending_email" text,
	"code_hash" text,
	"expires_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp with time zone,
	"send_window_at" timestamp with time zone,
	"send_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "college_identities_college_email_unique" UNIQUE("college_email")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "requested_username" text;--> statement-breakpoint
ALTER TABLE "college_identities" ADD CONSTRAINT "college_identities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Preserve legacy participant choices privately, rather than discarding them.
UPDATE "user" SET requested_username = username, username = NULL, username_lower = NULL
WHERE role IN ('user', 'outsider', 'applicant') AND username IS NOT NULL;
--> statement-breakpoint
CREATE FUNCTION protect_member_username() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.username IS NOT NULL AND (NEW.username IS DISTINCT FROM OLD.username OR NEW.username_lower IS DISTINCT FROM OLD.username_lower)
     AND NOT (NEW."deletedAt" IS NOT NULL AND NEW.username IS NULL AND NEW.username_lower IS NULL) THEN
    RAISE EXCEPTION 'Approved member usernames are permanent' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER immutable_member_username BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION protect_member_username();
