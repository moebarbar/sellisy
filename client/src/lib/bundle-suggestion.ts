// Pure cart→bundle matching logic. Lives in a standalone file so it's
// importable from the cart drawer + unit-testable without rendering React.

export type BundleSuggestionInput = {
  id: string;
  name: string;
  priceCents: number;
  products: Array<{ id: string; priceCents: number }>;
};

export type BundleSuggestion = {
  bundle: BundleSuggestionInput;
  matchedCount: number;
  matchedTotalCents: number;
  savings: number;
};

/**
 * Find the bundle that best matches the buyer's cart. Returns null if no
 * bundle is worth suggesting. The pitch only lands if:
 *   - at least 2 of the buyer's cart items overlap with the bundle's
 *     products (one-product overlap isn't a meaningful cross-sell)
 *   - the bundle price is strictly cheaper than buying those matched
 *     products separately (otherwise it's not actually a savings)
 *
 * Ties are broken by: largest matchedCount first, then largest savings.
 */
export function findBestBundleMatch(
  cartProductIds: ReadonlySet<string>,
  bundles: readonly BundleSuggestionInput[],
): BundleSuggestion | null {
  let best: BundleSuggestion | null = null;
  for (const bundle of bundles) {
    const matched = bundle.products.filter((p) => cartProductIds.has(p.id));
    if (matched.length < 2) continue;
    const matchedTotalCents = matched.reduce((sum, p) => sum + p.priceCents, 0);
    const savings = matchedTotalCents - bundle.priceCents;
    if (savings <= 0) continue;
    const candidate: BundleSuggestion = {
      bundle,
      matchedCount: matched.length,
      matchedTotalCents,
      savings,
    };
    if (
      !best ||
      candidate.matchedCount > best.matchedCount ||
      (candidate.matchedCount === best.matchedCount && candidate.savings > best.savings)
    ) {
      best = candidate;
    }
  }
  return best;
}
