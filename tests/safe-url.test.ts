import { describe, it, expect } from "vitest";
import { assertSafeOutboundUrl } from "../server/lib/safe-url";

// Locks in the SSRF guard used at the cert-logo / watermark / thumbnail fetch
// sites. If any of these blocked cases start passing, an attacker-controlled
// URL could reach an internal endpoint.

describe("assertSafeOutboundUrl — blocks", () => {
  const blocked: Array<[string, string]> = [
    ["javascript: scheme", "javascript:alert(1)"],
    ["data: scheme", "data:text/html,<script>1</script>"],
    ["ftp: scheme", "ftp://example.com/x"],
    ["file: scheme", "file:///etc/passwd"],
    ["not a url", "not a url at all"],
    ["loopback v4", "http://127.0.0.1/x"],
    ["loopback 127.x", "http://127.9.9.9/x"],
    ["localhost hostname", "http://localhost/x"],
    ["cloud metadata", "http://169.254.169.254/latest/meta-data/"],
    ["gcp metadata hostname", "http://metadata.google.internal/x"],
    ["private 10.x", "http://10.0.0.5/x"],
    ["private 192.168.x", "http://192.168.1.1/x"],
    ["private 172.16.x", "http://172.16.0.1/x"],
    ["cgnat 100.64.x", "http://100.64.0.1/x"],
    ["0.x", "http://0.0.0.0/x"],
    ["ipv6 loopback", "http://[::1]/x"],
    ["ipv6 link-local", "http://[fe80::1]/x"],
    ["ipv6 ULA fc00", "http://[fc00::1]/x"],
    ["ipv4-mapped loopback", "http://[::ffff:127.0.0.1]/x"],
  ];
  for (const [name, url] of blocked) {
    it(`rejects ${name}`, () => {
      expect(() => assertSafeOutboundUrl(url)).toThrow();
    });
  }
});

describe("assertSafeOutboundUrl — allows legitimate public URLs", () => {
  const allowed = [
    "https://cdn.sellisy.com/u/abc/def.pdf",
    "https://example.com/logo.png",
    "http://example.com/logo.png",
    "https://public-files.gumroad.com/x/thumb.jpg",
    "https://sub.domain.co.uk:8443/path?q=1",
  ];
  for (const url of allowed) {
    it(`allows ${url}`, () => {
      expect(() => assertSafeOutboundUrl(url)).not.toThrow();
      expect(assertSafeOutboundUrl(url)).toBeInstanceOf(URL);
    });
  }
});
