import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { logger } from "@/lib/logger";
import { getSecurePostgresConnection } from "@/lib/db/connection-config";
import { assertTestDatabase } from "./test-database-policy";

if (process.env.NODE_ENV === "test") assertTestDatabase(process.env.DATABASE_URL);

const secureConnection = getSecurePostgresConnection(process.env.DATABASE_URL!);
const pool = new Pool({
  ...secureConnection,
  connectionTimeoutMillis: 30000, // Increased to 30s for Neon cold starts
  max: 10,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle database client");
});

export const db = drizzle(pool, { schema });
