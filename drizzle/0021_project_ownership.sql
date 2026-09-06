ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "submittedBy" text;

DO $$ BEGIN
  ALTER TABLE "projects"
    ADD CONSTRAINT "projects_submittedBy_user_id_fk"
    FOREIGN KEY ("submittedBy") REFERENCES "public"."user"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "projects_submitted_by_idx" ON "projects" USING btree ("submittedBy");
