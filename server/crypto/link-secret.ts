// Shared secret resolution for stateless HMAC link tokens (unsubscribe,
// checkout recovery). One place to change if the env vars or rotation
// scheme ever change — the token modules only differ by message prefix.

export function getLinkSecret(kind: string): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (s) return s;
  // Fail closed in production: the fallback string is public in source, so with
  // the env unset anyone could forge recovery/unsubscribe HMAC tokens. Only
  // permit the dev fallback outside production.
  if (process.env.NODE_ENV === "production") {
    throw new Error(`[${kind}] UNSUBSCRIBE_SECRET / SESSION_SECRET is not set — refusing an insecure fallback secret in production.`);
  }
  return `sellisy-dev-${kind}-fallback-do-not-use-in-prod`;
}
