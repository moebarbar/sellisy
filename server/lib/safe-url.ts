import net from "node:net";

// SSRF guard for outbound fetches whose URL is derived from user/seller input
// (cert logos, product file URLs, imported thumbnails). Blocks non-http(s)
// schemes and requests to loopback / link-local / private / cloud-metadata
// addresses so a seller can't point us at an internal endpoint (e.g.
// 169.254.169.254 metadata, 127.0.0.1 sidecars).
//
// Residual risk: DNS rebinding (a public hostname that resolves to a private
// IP) is not fully covered here — we validate literal IPs and known-bad
// hostnames, and use redirect:"error" so a 30x to an internal host is refused.

const PRIVATE_V4: RegExp[] = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./, // link-local + cloud metadata
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
];

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata", "metadata.google.internal"]);

export function assertSafeOutboundUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("SSRF: invalid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error(`SSRF: blocked scheme ${u.protocol}`);
  }
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) throw new Error("SSRF: blocked hostname");

  if (net.isIPv4(host)) {
    if (PRIVATE_V4.some((re) => re.test(host))) throw new Error("SSRF: blocked private IPv4");
  } else if (net.isIPv6(host)) {
    // Block IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1, which Node may serialize
    // as ::ffff:7f00:1) outright — it's never used in legitimate outbound URLs
    // and is a common loopback/private bypass. Also block loopback/link-local/ULA.
    if (host.includes("::ffff:")) throw new Error("SSRF: blocked IPv4-mapped IPv6");
    if (host === "::1" || host === "::" || host.startsWith("fe80") || host.startsWith("fc") || host.startsWith("fd")) {
      throw new Error("SSRF: blocked private IPv6");
    }
  }
  return u;
}

// Drop-in fetch that validates the URL first and refuses redirects (so a 30x
// can't bounce us to an internal address after the check passes).
export async function safeFetch(raw: string, init?: RequestInit): Promise<Response> {
  assertSafeOutboundUrl(raw);
  return fetch(raw, { ...init, redirect: "error" });
}
