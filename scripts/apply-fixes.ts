import { db } from "../lib/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Applying production database fixes...");
  
  try {
    // 1. Role check constraint
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_check') THEN
              ALTER TABLE "user" ADD CONSTRAINT role_check 
              CHECK (role IN ('member','lead','admin','owner','faculty_coordinator','vice_lead','event_lead','content_lead','marketing_lead','tech_lead','finance_lead','volunteer_lead','co_lead','alumni','applicant','outsider'));
          END IF;
      END $$;
    `);
    console.log("Role check constraint applied.");
    
  } catch (error) {
    console.error("Error applying fixes:", error);
  }
  
  process.exit(0);
}

main();
