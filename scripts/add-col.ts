import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "faceDescriptor" text`);
    console.log("Column added successfully!");
  } catch (error) {
    console.error("Error adding column:", error);
  }
  process.exit(0);
}

run();
