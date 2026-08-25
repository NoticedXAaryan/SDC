import { describe, expect, it } from "vitest";

import { normalizeStorageKey } from "./storage-key";

describe("normalizeStorageKey", () => {
  it("normalizes separators and leading slashes", () => {
    expect(normalizeStorageKey("/certificates\\member.pdf")).toBe("certificates/member.pdf");
  });

  it("rejects traversal and empty paths", () => {
    expect(() => normalizeStorageKey("../secret.txt")).toThrow("Invalid storage path");
    expect(() => normalizeStorageKey("certificates/./member.pdf")).toThrow("Invalid storage path");
    expect(() => normalizeStorageKey("///")).toThrow("Invalid storage path");
  });
});
