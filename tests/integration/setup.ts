import { vi, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

beforeAll(async function() {
  const suite: any = arguments[1];
  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    console.warn("Database not available, skipping test suite.");
    if (suite && typeof suite.skip === "function") {
      suite.skip();
    }
  }
});

// Mock ioredis to prevent connection errors when testing locally without Redis
vi.mock("ioredis", () => {
  const RedisMock = vi.fn(function() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      quit: vi.fn(),
      on: vi.fn(),
      disconnect: vi.fn(),
      multi: vi.fn(() => ({
        exec: vi.fn(() => Promise.resolve([])),
      })),
    };
  });
  return { default: RedisMock, Redis: RedisMock };
});

vi.mock("bullmq", () => ({
  Queue: vi.fn(function() {
    return {
      add: vi.fn(),
      addBulk: vi.fn(),
      close: vi.fn(),
    };
  }),
  Worker: vi.fn(),
}));
