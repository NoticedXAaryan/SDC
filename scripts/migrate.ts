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
    const migrationTableCheck = await pool.query(`
      SELECT to_regclass('drizzle.__drizzle_migrations') as drizzle_migrations, 
             to_regclass('public.__drizzle_migrations') as public_migrations;
    `);
    const hasMigrationsTable = migrationTableCheck.rows[0].drizzle_migrations !== null || migrationTableCheck.rows[0].public_migrations !== null;
    
    if (!hasMigrationsTable) {
      const typeCheck = await pool.query(`SELECT 1 FROM pg_type WHERE typname = 'application_status';`);
      if (typeCheck.rows.length > 0) {
        console.log("Detected dirty database without migration history. Resetting schema...");
        await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
        await pool.query(`GRANT ALL ON SCHEMA public TO postgres;`);
        await pool.query(`GRANT ALL ON SCHEMA public TO public;`);
      }
    }
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
