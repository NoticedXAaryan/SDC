import { describe, expect, it } from "vitest";
import { getDevelopmentMailbox, hasEmailDelivery, hasGoogleSignIn, SIGNUP_ROLE } from "@/lib/auth-policy";

describe("Authentication configuration", () => {
  it("public signup starts outside the organizing team", () => {
    expect(SIGNUP_ROLE).toBe("outsider");
  });
  it("does not advertise incomplete delivery or Google configuration", () => {
    expect(hasEmailDelivery({ RESEND_API_KEY: "key", EMAIL_FROM_ADDRESS: " " })).toBe(false);
    expect(hasGoogleSignIn({ GOOGLE_CLIENT_ID: "client" })).toBe(false);
  });
  it("uses a local inbox only outside production", () => {
    const config = { NODE_ENV: "development", DEV_MAILBOX_URL: "http://127.0.0.1:58025" };
    expect(hasEmailDelivery(config)).toBe(true);
    expect(getDevelopmentMailbox(config)).toBe("http://127.0.0.1:58025");
    expect(hasEmailDelivery({ ...config, NODE_ENV: "production" })).toBe(false);
  });
  it.each(["https://mail.example.com", "http://127.0.0.1.example.com", "http://user:pass@localhost", "http://localhost/path"])('rejects a nonlocal inbox: %s', (url) => {
    expect(() => getDevelopmentMailbox({ DEV_MAILBOX_URL: url })).toThrow();
  });
});
