import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  
  if (!email) {
    console.error("❌ Please provide an email address as an argument or set ADMIN_EMAIL in .env");
    process.exit(1);
  }

  console.log(`Attempting to upgrade user ${email} to owner...`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email.toLowerCase().trim()),
    });

    if (!existingUser) {
      console.error(`❌ User with email ${email} not found in the database!`);
      console.log("Please log in at least once so the account is created, then run this script again.");
      process.exit(1);
    }

    if (existingUser.role === "owner") {
      console.log(`✅ User ${email} is already an owner!`);
      process.exit(0);
    }

    await db.update(schema.user)
      .set({ role: "owner" })
      .where(eq(schema.user.email, email.toLowerCase().trim()));

    // Also delete any existing sessions to force them to re-login to get the new role token
    await db.delete(schema.session)
      .where(eq(schema.session.userId, existingUser.id));

    console.log(`🎉 Successfully upgraded ${email} to owner!`);
    console.log("Their active sessions were revoked to force a clean re-login.");
    
  } catch (error) {
    console.error("❌ Error upgrading user:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
