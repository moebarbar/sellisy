export type CouponDiscountType = "PERCENT" | "FIXED";

/**
 * Apply a coupon discount to a positive cents total. The single source of
 * truth for checkout discount math (used by the order-creation route).
 *
 * - PERCENT: discountValue is a whole percent (20 = 20% off). Rounds to the
 *   nearest cent to stay in Stripe's integer-cent model.
 * - FIXED:   discountValue is a cents amount subtracted from the total.
 *
 * Never returns below 0 — an over-large fixed discount floors at a free order,
 * it doesn't create negative (refundable) totals.
 */
export function applyCouponDiscount(
  totalCents: number,
  discountType: CouponDiscountType,
  discountValue: number,
): number {
  if (discountType === "PERCENT") {
    return Math.max(0, Math.round(totalCents * (1 - discountValue / 100)));
  }
  return Math.max(0, totalCents - discountValue);
}
