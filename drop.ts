import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function dropAll() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to DB, dropping schema...");
    await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    console.log("Schema dropped and recreated successfully.");
  } catch (err) {
    console.error("Error dropping schema", err);
  } finally {
    await client.end();
  }
}

dropAll();
