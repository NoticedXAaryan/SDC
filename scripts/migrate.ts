import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";
import "dotenv/config";

async function main() {
  console.log("Running migrations...");

  // Use the connection string from env
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    // This will run migrations on the database, skipping the ones already applied
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
