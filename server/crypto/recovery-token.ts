import { createHmac, timingSafeEqual } from "crypto";
import { getLinkSecret } from "./link-secret";

// Abandoned-checkout recovery links need the same properties as unsubscribe
// links: authentic (a crawler can't mint a checkout session for someone
// else's order) and stateless (no token table). Same HMAC construction as
// crypto/unsubscribe-token.ts with a distinct message prefix so the two
// token families can never be swapped for each other.

export function makeRecoveryToken(orderId: string): string {
  return createHmac("sha256", getLinkSecret("recovery")).update(`recover:${orderId}`).digest("hex");
}

export function verifyRecoveryToken(orderId: string, token: string): boolean {
  const expected = makeRecoveryToken(orderId);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}
