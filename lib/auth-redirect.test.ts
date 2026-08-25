import { describe, expect, it } from "vitest";

import { sanitizeAuthRedirect } from "./auth-redirect";

describe("sanitizeAuthRedirect", () => {
  it("keeps local application paths", () => {
    expect(sanitizeAuthRedirect("/events/create")).toBe("/events/create");
    expect(sanitizeAuthRedirect("/events?filter=mine")).toBe("/events?filter=mine");
  });

  it("rejects external and malformed redirects", () => {
    expect(sanitizeAuthRedirect("https://example.com")).toBe("/dashboard");
    expect(sanitizeAuthRedirect("//example.com")).toBe("/dashboard");
    expect(sanitizeAuthRedirect("/\\example.com")).toBe("/dashboard");
  });

  it("prevents authentication redirect loops", () => {
    expect(sanitizeAuthRedirect("/login?callbackUrl=/dashboard")).toBe("/dashboard");
    expect(sanitizeAuthRedirect("/register")).toBe("/dashboard");
  });
});
