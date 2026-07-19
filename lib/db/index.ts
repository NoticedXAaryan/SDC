import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { logger } from "@/lib/logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 5000,
  max: 10,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle database client");
});

export const db = drizzle(pool, { schema });
