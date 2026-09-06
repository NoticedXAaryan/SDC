import { defineConfig } from "vitest/config";
import path from "node:path";
import { config } from "dotenv";
import { assertTestDatabase } from "./lib/db/test-database-policy";

config({ path: ".env.test", quiet: true });
const testDatabaseUrl = process.env.TEST_DATABASE_URL || "postgresql://sdc:sdc_local_only@127.0.0.1:55432/sdc_test";
assertTestDatabase(testDatabaseUrl);
process.env.DATABASE_URL = testDatabaseUrl;
process.env.BETTER_AUTH_SECRET ||= "local-tests-only-secret-32-characters";
process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
process.env.PASS_SECRET ||= "local-tests-only-pass-secret";
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "node_modules.cached/**", ".recovery/**", "tests/e2e/**", "tests/integration/**"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    alias: { "@": path.resolve(import.meta.dirname, "./") },
  },
});
