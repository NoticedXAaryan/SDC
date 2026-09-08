import { vi } from "vitest";

// Service tests exercise PostgreSQL but replace delivery workers and Redis.
// Browser acceptance tests run the actual local services.
vi.mock("ioredis", () => {
  const RedisMock = vi.fn(function() {
    return {
      get: vi.fn(), set: vi.fn(), setex: vi.fn(), del: vi.fn(), quit: vi.fn(),
      on: vi.fn(), disconnect: vi.fn(),
      multi: vi.fn(() => ({ exec: vi.fn(() => Promise.resolve([])) })),
    };
  });
  return { default: RedisMock, Redis: RedisMock };
});
vi.mock("bullmq", () => ({
  Queue: vi.fn(function() { return { add: vi.fn().mockResolvedValue({}), addBulk: vi.fn().mockResolvedValue([]), close: vi.fn() }; }),
  Worker: vi.fn(),
}));
