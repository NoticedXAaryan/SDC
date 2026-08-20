import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';
import { execFileSync } from 'child_process';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.test', override: true });

const DEFAULT_TEST_DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/sdc_test';

function isTestDatabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    return /test/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

const configuredDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (process.env.TEST_DATABASE_URL && !isTestDatabaseUrl(process.env.TEST_DATABASE_URL)) {
  throw new Error('TEST_DATABASE_URL must target a database whose name contains "test".');
}

// Integration tests may only use a clearly named test database. This prevents
// a developer's normal .env configuration from ever becoming a test target.
const testDatabaseUrl = isTestDatabaseUrl(configuredDatabaseUrl)
  ? configuredDatabaseUrl
  : DEFAULT_TEST_DATABASE_URL;

process.env.DATABASE_URL = testDatabaseUrl;

let dbIsUp = false;
try {
  // Quick check if DB is reachable
  execFileSync(
    process.execPath,
    [
      '-e',
      "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.TEST_DATABASE_URL }); c.connect().then(() => c.end()).then(() => process.exit(0)).catch(() => process.exit(1));",
    ],
    {
      stdio: 'ignore',
      env: { ...process.env, TEST_DATABASE_URL: testDatabaseUrl },
    },
  );
  dbIsUp = true;
} catch (e) {
  console.warn("Test DB unreachable. Excluding tests/integration/**");
}

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**', 
      '**/dist/**', 
      'tests/e2e/**',
      ...(dbIsUp ? [] : ['tests/integration/**'])
    ],
    setupFiles: ['./tests/integration/setup.ts'],
    globalSetup: dbIsUp ? ['./tests/integration/global-setup.ts'] : [],
    fileParallelism: false,
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
