import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/test',
      BETTER_AUTH_SECRET: 'test-secret',
      BETTER_AUTH_URL: 'http://localhost:3000',
      PASS_SECRET: 'test-pass-secret',
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
