import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  escapeHtmlWithLineBreaks,
  sanitizeEmailHeader,
  toSafeHttpUrl,
} from "./html";

describe("email HTML safety helpers", () => {
  it("escapes markup and attribute-breaking characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')"> & more`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#039;x&#039;)&quot;&gt; &amp; more",
    );
  });

  it("preserves line breaks only after escaping the text", () => {
    expect(escapeHtmlWithLineBreaks("First\n<script>alert(1)</script>"))
      .toBe("First<br>&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("removes newline-based email header injection", () => {
    expect(sanitizeEmailHeader("Update\r\nBcc: attacker@example.com"))
      .toBe("Update Bcc: attacker@example.com");
  });

  it("allows only HTTP(S) URLs and safely resolves internal links", () => {
    expect(toSafeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeHttpUrl("/events/demo?tab=details", "https://club.example/base"))
      .toBe("https://club.example/events/demo?tab=details");
    expect(toSafeHttpUrl("https://meet.example/room?a=1&b=2"))
      .toBe("https://meet.example/room?a=1&b=2");
  });

  it("rejects unsafe or malformed base URLs", () => {
    expect(toSafeHttpUrl("/events/demo", "javascript:alert(1)")).toBeNull();
    expect(toSafeHttpUrl("not a URL")).toBeNull();
  });
});
