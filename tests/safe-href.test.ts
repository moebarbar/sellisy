import { describe, it, expect } from "vitest";
import { safeHref, isHttpUrl } from "@/lib/safe-href";

// Locks in the XSS fix for seller-authored link/video URL blocks (KB + blog).
// A regression here would let a `javascript:` URI reach an href/src attribute.

describe("safeHref", () => {
  it("neutralizes javascript: and data: to '#'", () => {
    expect(safeHref("javascript:alert(document.cookie)")).toBe("#");
    expect(safeHref("JavaScript:alert(1)")).toBe("#");
    expect(safeHref("  javascript:alert(1)  ")).toBe("#");
    expect(safeHref("data:text/html,<script>1</script>")).toBe("#");
    expect(safeHref("vbscript:msgbox(1)")).toBe("#");
  });

  it("passes through http(s), mailto, and site-relative links", () => {
    expect(safeHref("https://example.com/x")).toBe("https://example.com/x");
    expect(safeHref("http://example.com")).toBe("http://example.com");
    expect(safeHref("mailto:hi@example.com")).toBe("mailto:hi@example.com");
    expect(safeHref("/blog/foo")).toBe("/blog/foo");
    expect(safeHref("#section")).toBe("#section");
  });

  it("handles empty/nullish input safely", () => {
    expect(safeHref("")).toBe("#");
    expect(safeHref(null)).toBe("#");
    expect(safeHref(undefined)).toBe("#");
  });
});

describe("isHttpUrl (iframe src gate)", () => {
  it("true only for absolute http(s) URLs", () => {
    expect(isHttpUrl("https://youtube.com/embed/abc")).toBe(true);
    expect(isHttpUrl("http://vimeo.com/123")).toBe(true);
  });

  it("false for javascript:, relative, and junk", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("/relative/path")).toBe(false);
    expect(isHttpUrl("data:text/html,x")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
  });
});
