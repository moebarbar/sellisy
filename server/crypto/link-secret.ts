// Shared secret resolution for stateless HMAC link tokens (unsubscribe,
// checkout recovery). One place to change if the env vars or rotation
// scheme ever change — the token modules only differ by message prefix.

export function getLinkSecret(kind: string): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn(`[${kind}] UNSUBSCRIBE_SECRET / SESSION_SECRET not set — using fallback`);
  }
  return `sellisy-dev-${kind}-fallback-do-not-use-in-prod`;
}
