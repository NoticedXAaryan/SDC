import { Pool } from "pg";
import "dotenv/config";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT schema_name FROM information_schema.schemata;");
    console.log("Schemas:", res.rows.map(r => r.schema_name));
    
    try {
        const migrations = await pool.query("SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC;");
        console.log("Migrations applied:", migrations.rows);
    } catch(e) {
        console.log("No drizzle.__drizzle_migrations table");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
