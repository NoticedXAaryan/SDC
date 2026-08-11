import { vi } from "vitest";

// Mock ioredis to prevent connection errors when testing locally without Redis
vi.mock("ioredis", () => {
  const RedisMock = vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
    disconnect: vi.fn(),
  }));
  return { default: RedisMock };
});
