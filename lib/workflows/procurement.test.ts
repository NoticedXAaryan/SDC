import { describe, expect, it } from "vitest";

import { canTransitionProcurement } from "./procurement";

describe("procurement workflow", () => {
  it("allows the intended approval path and supported rejections", () => {
    expect(canTransitionProcurement("draft", "pending_quotes")).toBe(true);
    expect(canTransitionProcurement("pending_quotes", "approval")).toBe(true);
    expect(canTransitionProcurement("approval", "approved")).toBe(true);
    expect(canTransitionProcurement("approved", "completed")).toBe(true);
    expect(canTransitionProcurement("approval", "rejected")).toBe(true);
  });

  it("rejects skipped, repeated, and terminal transitions", () => {
    expect(canTransitionProcurement("draft", "approved")).toBe(false);
    expect(canTransitionProcurement("approval", "approval")).toBe(false);
    expect(canTransitionProcurement("completed", "draft")).toBe(false);
    expect(canTransitionProcurement("unknown", "approved")).toBe(false);
  });
});
