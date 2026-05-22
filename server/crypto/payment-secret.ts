import { encryptToken, decryptToken } from './token-encryption';

// `stores.stripeSecretKey` and `stores.paypalClientSecret` were historically
// stored plaintext. They are now stored AES-256-GCM-encrypted, tagged with
// the `enc:v1:` prefix so the codepath can tell encrypted from legacy plain
// values during the rollover window.
//
// Use these helpers everywhere a payment secret is read or written. The
// underlying crypto is shared with `token-encryption.ts` (which encrypts
// Gumroad PATs) — the same `GUMROAD_TOKEN_ENCRYPTION_KEY` env var is reused.

const ENCRYPTED_PREFIX = 'enc:v1:';

export function isEncryptedPaymentSecret(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptPaymentSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isEncryptedPaymentSecret(plaintext)) return plaintext;
  return ENCRYPTED_PREFIX + encryptToken(plaintext);
}

// Lenient: if the value already looks plaintext (no `enc:v1:` prefix), we
// return it untouched so legacy rows continue to work during rollover.
// Run `script/encrypt-payment-secrets.ts` to encrypt all remaining plaintext
// rows in one pass.
export function decryptPaymentSecret(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (!isEncryptedPaymentSecret(value)) return value;
  return decryptToken(value.slice(ENCRYPTED_PREFIX.length));
}
