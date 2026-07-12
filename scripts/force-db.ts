import { Pool } from "pg";
import "dotenv/config";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Add Phase 3 achievements
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "submission_status" AS ENUM('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "achievement_submissions" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "proofUrl" text,
        "status" "submission_status" DEFAULT 'pending',
        "pointsAwarded" integer DEFAULT 0,
        "reviewedBy" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'achievements_userId_fk') THEN
          ALTER TABLE "achievement_submissions" ADD CONSTRAINT "achievements_userId_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `);

    // Add Phase 4 Content/Social
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "content_status" AS ENUM('idea', 'drafting', 'review', 'scheduled', 'published');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "content_items" (
        "id" text PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "platform" text,
        "status" "content_status" DEFAULT 'idea',
        "authorId" text,
        "scheduledFor" timestamp with time zone,
        "publishedAt" timestamp with time zone,
        "mediaUrls" jsonb,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_authorId_fk') THEN
          ALTER TABLE "content_items" ADD CONSTRAINT "content_authorId_fk" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `);

    // Add Phase 5 Procurement
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "vendors" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "contactName" text,
        "email" text,
        "phone" text,
        "category" text,
        "rating" integer DEFAULT 0,
        "notes" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "procurement_status" AS ENUM('draft', 'pending_quotes', 'approval', 'approved', 'rejected', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "procurement_requests" (
        "id" text PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "status" "procurement_status" DEFAULT 'draft',
        "requestedBy" text NOT NULL,
        "eventId" text,
        "estimatedCost" integer,
        "selectedVendorId" text,
        "financeTransactionId" text,
        "quotesUrl" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proc_req_requestedBy_fk') THEN
          ALTER TABLE "procurement_requests" ADD CONSTRAINT "proc_req_requestedBy_fk" FOREIGN KEY ("requestedBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proc_req_eventId_fk') THEN
          ALTER TABLE "procurement_requests" ADD CONSTRAINT "proc_req_eventId_fk" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE no action ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proc_req_vendorId_fk') THEN
          ALTER TABLE "procurement_requests" ADD CONSTRAINT "proc_req_vendorId_fk" FOREIGN KEY ("selectedVendorId") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `);

    console.log("Applying 0001 migration manually to bypass prompt...");
    
    // Add enum value if not exists
    await pool.query(`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'needs_manual_review'`).catch(() => {});

    // Add column nullable first
    await pool.query(`ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "applicationCycle" text`);
    await pool.query(`UPDATE "applications" SET "applicationCycle" = '2026-odd-sem' WHERE "applicationCycle" IS NULL`);
    await pool.query(`ALTER TABLE "applications" ALTER COLUMN "applicationCycle" SET NOT NULL`);
    
    // Add indexes (IF NOT EXISTS to be safe)
    await pool.query(`CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications" USING btree ("status")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "audit_logs_actor_time_idx" ON "auditLogs" USING btree ("actorId","timestamp")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "point_logs_user_id_idx" ON "pointLogs" USING btree ("userId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "registrations_event_id_idx" ON "registrations" USING btree ("eventId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "registrations_user_id_idx" ON "registrations" USING btree ("userId")`);
    
    // Add constraints
    // Try to drop first in case they exist from a partial run
    await pool.query(`ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_user_cycle_unique"`);
    await pool.query(`ALTER TABLE "applications" ADD CONSTRAINT "applications_user_cycle_unique" UNIQUE("userId","applicationCycle")`);
    
    await pool.query(`ALTER TABLE "registrations" DROP CONSTRAINT IF EXISTS "registrations_event_user_unq"`);
    // Delete duplicate registrations before constraint to prevent failure
    await pool.query(`
      DELETE FROM registrations a USING registrations b
      WHERE a.id < b.id AND a."eventId" = b."eventId" AND a."userId" = b."userId"
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL,
        "type" text NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "read" boolean DEFAULT false NOT NULL,
        "link" text,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);
    
    // Add club_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "club_settings" (
        "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
        "isFrozen" boolean DEFAULT false NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        "updatedBy" text
      )
    `);

    // Ensure auth relations
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'events_created_by_user_id_fk'
        ) THEN
          ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `);

    // Add isInternal to events
    await pool.query(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "isInternal" boolean DEFAULT false`);

    // Add Phase 2 tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "event_sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "eventId" text NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "startTime" timestamp with time zone NOT NULL,
        "endTime" timestamp with time zone NOT NULL,
        "location" text,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session_attendance" (
        "id" text PRIMARY KEY NOT NULL,
        "sessionId" text NOT NULL,
        "userId" text NOT NULL,
        "checkedInAt" timestamp with time zone DEFAULT now() NOT NULL
      )
    `);

    // Foreign keys for P2 tables
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_sessions_eventId_fk') THEN
          ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_eventId_fk" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE no action ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_attendance_sessionId_fk') THEN
          ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_sessionId_fk" FOREIGN KEY ("sessionId") REFERENCES "event_sessions"("id") ON DELETE no action ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_attendance_userId_fk') THEN
          ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_userId_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_attendance_unq') THEN
          ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_unq" UNIQUE ("sessionId", "userId");
        END IF;
      END $$;
    `);

    // Add createdBy to expenses
    await pool.query(`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "createdBy" text`);
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'expenses_createdBy_user_id_fk'
        ) THEN
          ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `);
    
    // Add foreign key constraint if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_user_id_fk'
        ) THEN
          ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
      END $$;
    `);

    console.log("Done.");
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
