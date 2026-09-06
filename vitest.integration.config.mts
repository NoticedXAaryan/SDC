import { defineConfig } from "vitest/config";
import unitConfig from "./vitest.config.mjs";

export default defineConfig({
  ...unitConfig,
  test: {
    ...unitConfig.test,
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    setupFiles: ["./tests/integration/setup.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    hookTimeout: 30000,
    testTimeout: 20000,
  },
});
