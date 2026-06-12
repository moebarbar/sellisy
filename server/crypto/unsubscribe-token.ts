import { createHmac, timingSafeEqual } from "crypto";
import { getLinkSecret } from "./link-secret";

// One-click unsubscribe links in transactional emails need to be authentic
// (so a random web crawler can't toggle a stranger's preferences) but
// stateless (no per-token DB row to GC). HMAC of the orderId with a server
// secret gives us both — the link is unguessable without the secret and we
// verify by recomputing on click.

export function makeUnsubscribeToken(orderId: string): string {
  return createHmac("sha256", getLinkSecret("unsubscribe")).update(`unsub:${orderId}`).digest("hex");
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
