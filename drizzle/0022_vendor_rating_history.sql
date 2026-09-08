CREATE TABLE IF NOT EXISTS "vendor_ratings" (
  "id" text PRIMARY KEY NOT NULL,
  "vendorId" text NOT NULL,
  "ratedBy" text NOT NULL,
  "rating" integer NOT NULL,
  "notes" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_vendorId_vendors_id_fk"
    FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_ratedBy_user_id_fk"
    FOREIGN KEY ("ratedBy") REFERENCES "public"."user"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "vendor_ratings_vendor_id_idx" ON "vendor_ratings" USING btree ("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_ratings_rated_by_idx" ON "vendor_ratings" USING btree ("ratedBy");
