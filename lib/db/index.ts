import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { logger } from "@/lib/logger";

if (process.env.NODE_ENV === "test" && !process.env.DATABASE_URL?.includes("test")) {
  throw new Error("Test environment must use a database URL containing 'test' to prevent modifying production or development data.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 30000, // Increased to 30s for Neon cold starts
  max: 10,
  ssl: process.env.DATABASE_URL?.includes('sslmode=')
    ? undefined // Let the connection string control SSL
    : { rejectUnauthorized: false }, // Suppress pg v9 deprecation warning
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle database client");
});

export const db = drizzle(pool, { schema });
