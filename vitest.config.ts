import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
dotenv.config({ path: '.env' });

// Override with test database explicitly, or rely on .env.test if provided
process.env.DATABASE_URL = process.env.DATABASE_URL?.includes('test') 
  ? process.env.DATABASE_URL 
  : 'postgresql://postgres:password@127.0.0.1:5432/sdc_test';

let dbIsUp = false;
try {
  // Quick check if DB is reachable
  execSync(`node -e "const { Client } = require('pg'); const c = new Client({ connectionString: '${process.env.DATABASE_URL}' }); c.connect().then(() => process.exit(0)).catch(() => process.exit(1));"`, { stdio: 'ignore' });
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
