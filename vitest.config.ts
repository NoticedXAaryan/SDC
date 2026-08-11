import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
