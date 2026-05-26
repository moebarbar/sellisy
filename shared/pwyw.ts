// Pure validation for pay-what-you-want pricing. Shared between the
// buyer-facing product page (client/src/pages/product-detail.tsx) and the
// /api/checkout handler (server/routes/orders.ts) so the client-side
// pre-check and the server-side rejection agree byte-for-byte.

export type PwywValidationResult =
  | { ok: true; priceCents: number }
  | { ok: false; reason: "not_enabled" | "invalid_amount" | "below_minimum"; message: string };

/**
 * Validate that a buyer-submitted PWYW amount is acceptable for the given
 * product. The product must have pwywEnabled === true and the amount must
 * be ≥ pwywMinCents (which can be 0).
 *
 * @param input.pwywEnabled  whether the product accepts PWYW
 * @param input.pwywMinCents owner-set floor (cents)
 * @param input.amountCents  buyer-submitted amount (cents); pass null/undefined
 *                           to indicate "no PWYW amount sent"
 */
export function validatePwywAmount(input: {
  pwywEnabled: boolean;
  pwywMinCents: number;
  amountCents: number | null | undefined;
}): PwywValidationResult {
  if (input.amountCents == null) {
    // No PWYW input from buyer — treat as "skip PWYW," not as an error.
    // The caller decides what to do with the regular price.
    return { ok: false, reason: "invalid_amount", message: "Enter a valid amount." };
  }
  if (!input.pwywEnabled) {
    return {
      ok: false,
      reason: "not_enabled",
      message: "Pay-what-you-want is not enabled for this product",
    };
  }
  if (!Number.isFinite(input.amountCents) || input.amountCents < 0) {
    return { ok: false, reason: "invalid_amount", message: "Enter a valid amount." };
  }
  if (input.amountCents < input.pwywMinCents) {
    return {
      ok: false,
      reason: "below_minimum",
      message: `Minimum is $${(input.pwywMinCents / 100).toFixed(2)}.`,
    };
  }
  return { ok: true, priceCents: Math.round(input.amountCents) };
}
