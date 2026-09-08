import { beforeAll } from "vitest";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import "../setup";

beforeAll(async () => {
  // Infrastructure failures fail the suite. Never silently skip coverage.
  await db.execute(sql`SELECT 1`);
});
