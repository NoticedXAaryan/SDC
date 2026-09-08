import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { assertTestDatabase } from "../../lib/db/test-database-policy";
import { getSecurePostgresConnection } from "../../lib/db/connection-config";

export default async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  assertTestDatabase(databaseUrl);
  const pool = new Pool({ ...getSecurePostgresConnection(databaseUrl), connectionTimeoutMillis: 5000 });
  try {
    // This suite deliberately resets only an explicitly named test database.
    // Clear migration history too so a second run applies the schema again.
    await pool.query("SELECT 1");
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await migrate(drizzle(pool), { migrationsFolder: path.resolve(import.meta.dirname, "../../drizzle") });
    console.log("Integration database reset and migrated.");
  } finally {
    await pool.end();
  }
}
