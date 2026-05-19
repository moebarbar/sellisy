import { createHmac, timingSafeEqual } from "crypto";

// One-click unsubscribe links in transactional emails need to be authentic
// (so a random web crawler can't toggle a stranger's preferences) but
// stateless (no per-token DB row to GC). HMAC of the orderId with a server
// secret gives us both — the link is unguessable without the secret and we
// verify by recomputing on click.

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (s) return s;
  // Dev fallback — fine for local since unsubscribe links don't matter there.
  // In production, both env vars should be set; we log loudly so it's obvious.
  if (process.env.NODE_ENV === "production") {
    console.warn("[unsubscribe] UNSUBSCRIBE_SECRET / SESSION_SECRET not set — using fallback");
  }
  return "sellisy-dev-unsubscribe-fallback-do-not-use-in-prod";
}

export function makeUnsubscribeToken(orderId: string): string {
  return createHmac("sha256", getSecret()).update(`unsub:${orderId}`).digest("hex");
}

export function verifyUnsubscribeToken(orderId: string, token: string): boolean {
  const expected = makeUnsubscribeToken(orderId);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}
