import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "isInternal" boolean DEFAULT false;`);
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "aiDraftMessage" text;`);
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "aiDraftEmail" text;`);
    await db.execute(sql`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "createdBy" text;`);
    // Alter pointLogs amount to points, or just add points if it doesn't exist
    await db.execute(sql`ALTER TABLE "pointLogs" ADD COLUMN IF NOT EXISTS "points" integer NOT NULL DEFAULT 0;`);
    
    // For submission_status, if it fails we ignore
    try {
      await db.execute(sql`CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');`);
    } catch(e) {}
    try {
      await db.execute(sql`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "status" "submission_status" DEFAULT 'pending';`);
    } catch(e) {}
    try {
      await db.execute(sql`ALTER TABLE "researchPapers" ADD COLUMN IF NOT EXISTS "status" "submission_status" DEFAULT 'pending';`);
    } catch(e) {}

    console.log("DB Fixed!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
