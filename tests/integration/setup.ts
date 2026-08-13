import { vi } from "vitest";

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
