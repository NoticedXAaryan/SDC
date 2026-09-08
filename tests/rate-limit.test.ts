import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/rate-limit";

function requestHeaders(values: Record<string, string>) {
  return { headers: new Headers(values) };
}

describe("getClientIp", () => {
  it("uses only the first address added by the forwarding proxy", () => {
    expect(getClientIp(requestHeaders({
      "x-forwarded-for": "203.0.113.8, 10.0.0.4",
    }))).toBe("203.0.113.8");
  });

  it("falls back to the real IP header", () => {
    expect(getClientIp(requestHeaders({ "x-real-ip": "198.51.100.2" })))
      .toBe("198.51.100.2");
  });

  it("uses a stable local fallback when no proxy headers are present", () => {
    expect(getClientIp(requestHeaders({}))).toBe("127.0.0.1");
  });
});
