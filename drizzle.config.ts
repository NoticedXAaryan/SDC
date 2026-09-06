import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { getSecurePostgresConnection } from "./lib/db/connection-config";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" }); // Fallback if .env.local doesn't exist

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getSecurePostgresConnection(process.env.DATABASE_URL!).connectionString,
  },
  // @ts-ignore
  migrations: { transactional: true, table: "__drizzle_migrations" }
});
