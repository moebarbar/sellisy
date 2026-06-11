import { createHmac, timingSafeEqual } from "crypto";

// Abandoned-checkout recovery links need the same properties as unsubscribe
// links: authentic (a crawler can't mint a checkout session for someone
// else's order) and stateless (no token table). Same HMAC construction as
// crypto/unsubscribe-token.ts with a distinct message prefix so the two
// token families can never be swapped for each other.

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn("[recovery] UNSUBSCRIBE_SECRET / SESSION_SECRET not set — using fallback");
  }
  return "sellisy-dev-recovery-fallback-do-not-use-in-prod";
}

export function makeRecoveryToken(orderId: string): string {
  return createHmac("sha256", getSecret()).update(`recover:${orderId}`).digest("hex");
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
