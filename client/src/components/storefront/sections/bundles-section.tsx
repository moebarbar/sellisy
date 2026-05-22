import type { Product, Store } from "@shared/schema";
import { ArrowRight } from "lucide-react";
import { ProtectedImage } from "@/components/protected-image";
import type { ThemeColors, StorefrontTheme } from "../theme-types";

export type BundleWithProducts = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  thumbnailUrl: string | null;
  products: Product[];
};

interface BundlesSectionProps {
  store: Store;
  bundles: BundleWithProducts[];
  c: ThemeColors;
  theme: StorefrontTheme;
  isDark: boolean;
  basePath: string;
  onPrefetchBundle?: (bundleId: string) => void;
}

export function BundlesSection({ store, bundles, c, theme, isDark, basePath, onPrefetchBundle }: BundlesSectionProps) {
  if (bundles.length === 0) return null;

  return (
    <div className={`mx-auto ${theme.layout.maxWidth} px-6 pb-24 relative z-10 block`}>
      <div className="mt-20">
        <div className="text-center mb-12">
          {theme.renderDivider?.(isDark)}
          <h2 className="text-2xl md:text-3xl font-bold mt-4" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>
            Bundles & Deals
          </h2>
          <p className="text-sm mt-2" style={{ color: c.textSecondary }}>Save more when you buy together</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {bundles.map((bundle) => {
            const totalValue = bundle.products.reduce((sum, p) => sum + p.priceCents, 0);
            const savings = totalValue - bundle.priceCents;
            const savingsPct = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

            return (
              <div key={bundle.id} className={`${theme.effects.cardClass} sf-reveal-item p-6`} data-testid={`card-bundle-${bundle.id}`} onMouseEnter={() => onPrefetchBundle?.(bundle.id)}>
                <div className="flex items-start gap-4">
                  {bundle.thumbnailUrl && (
                    <ProtectedImage protected={!store.allowImageDownload} src={bundle.thumbnailUrl} alt={bundle.name} className="w-20 h-20 rounded-lg object-cover shrink-0" loading="lazy" data-testid={`img-bundle-${bundle.id}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-base truncate" style={{ color: c.text, fontFamily: theme.typography.headingFamily }} data-testid={`text-bundle-name-${bundle.id}`}>{bundle.name}</h3>
                      {savingsPct > 0 && (
                        <span className="t-discount px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0">SAVE {savingsPct}%</span>
                      )}
                    </div>
                    {bundle.description && <p className="text-xs line-clamp-2 mb-3" style={{ color: c.textSecondary }}>{bundle.description}</p>}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {bundle.products.slice(0, 3).map((p) => (
                        <span key={p.id} className="t-tag-badge px-2 py-0.5 text-[10px] rounded-full">{p.title}</span>
                      ))}
                      {bundle.products.length > 3 && <span className="text-[10px]" style={{ color: c.textTertiary }}>+{bundle.products.length - 3} more</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <div>
                    {savings > 0 && <span className="text-xs line-through mr-2" style={{ color: c.textTertiary }}>${(totalValue / 100).toFixed(2)}</span>}
                    <span className="text-lg font-bold" style={{ color: c.price }} data-testid={`text-bundle-price-${bundle.id}`}>${(bundle.priceCents / 100).toFixed(2)}</span>
                  </div>
                  <a
                    href={`${basePath}/bundle/${bundle.id}`}
                    className={`${theme.effects.buyBtnClass} px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5`}
                    style={{ borderRadius: theme.layout.buttonBorderRadius }}
                    data-testid={`link-bundle-${bundle.id}`}
                  >
                    View Bundle <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
