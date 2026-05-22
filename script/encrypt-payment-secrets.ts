// One-shot migration: encrypt all plaintext store payment secrets in place.
//
// Reads every row in `stores`, finds `stripeSecretKey` / `paypalClientSecret`
// that aren't already prefixed with `enc:v1:`, encrypts them, and writes back.
// Idempotent — running twice is safe; the second run is a no-op for any rows
// that were already encrypted.
//
// Usage:
//   tsx --env-file=.env script/encrypt-payment-secrets.ts
//   (in prod) tsx script/encrypt-payment-secrets.ts   # env from Railway
//
// Requires: DATABASE_URL, GUMROAD_TOKEN_ENCRYPTION_KEY.

import { db } from "../server/db";
import { stores } from "@shared/schema";
import { eq } from "drizzle-orm";
import { encryptPaymentSecret, isEncryptedPaymentSecret } from "../server/crypto/payment-secret";

async function main() {
  const all = await db.select({
    id: stores.id,
    stripeSecretKey: stores.stripeSecretKey,
    paypalClientSecret: stores.paypalClientSecret,
  }).from(stores);

  let stripeEncrypted = 0;
  let paypalEncrypted = 0;
  let skipped = 0;

  for (const s of all) {
    const updates: Record<string, string> = {};

    if (s.stripeSecretKey && !isEncryptedPaymentSecret(s.stripeSecretKey)) {
      updates.stripeSecretKey = encryptPaymentSecret(s.stripeSecretKey);
      stripeEncrypted++;
    }
    if (s.paypalClientSecret && !isEncryptedPaymentSecret(s.paypalClientSecret)) {
      updates.paypalClientSecret = encryptPaymentSecret(s.paypalClientSecret);
      paypalEncrypted++;
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    await db.update(stores).set(updates).where(eq(stores.id, s.id));
  }

  console.log(`Done. Stripe secrets encrypted: ${stripeEncrypted}. PayPal secrets encrypted: ${paypalEncrypted}. Rows skipped (already encrypted or empty): ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("encrypt-payment-secrets failed:", err);
  process.exit(1);
});
