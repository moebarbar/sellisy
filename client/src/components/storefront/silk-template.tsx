import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Sparkles, Sun, Moon, Gift, User, X } from "lucide-react";
import { LeadMagnetModal } from "./lead-magnet-modal";
import type { Store, Product, Bundle } from "@shared/schema";

type StorefrontProduct = Product & {
  isLeadMagnet?: boolean;
  upsellProductId?: string | null;
  upsellBundleId?: string | null;
  storeProductId?: string;
};

type SilkMode = "light" | "dark";

function GoldDivider({ isDark }: { isDark: boolean }) {
  const goldColor = isDark ? "#d4a853" : "#c9a96e";
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${goldColor})` }} />
      <Sparkles className="h-3.5 w-3.5" style={{ color: goldColor }} />
      <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${goldColor})` }} />
    </div>
  );
}

export function SilkTemplate({ store, products, bundles }: { store: Store; products: StorefrontProduct[]; bundles: Array<{ id: string; name: string; description: string | null; priceCents: number; thumbnailUrl: string | null; products: Product[] }> }) {
  const [mode, setMode] = useState<SilkMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("silk-mode") as SilkMode) || "light";
    }
    return "light";
  });
  const [leadModalProduct, setLeadModalProduct] = useState<StorefrontProduct | null>(null);

  useEffect(() => {
    localStorage.setItem("silk-mode", mode);
  }, [mode]);

  const isDark = mode === "dark";

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleBuy = async (product: StorefrontProduct) => {
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id, productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.message || "Something went wrong. Please try again.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setCheckoutError("Checkout is not available right now. Please try again later.");
    }
  };

  const customAccent = store.accentColor || null;

  const c = isDark ? {
    bg: "#0c0a09",
    bgAlt: "#141210",
    card: "#181614",
    cardBorder: `${customAccent || "#d4a853"}1f`,
    cardBorderHover: `${customAccent || "#d4a853"}40`,
    cardShadow: "0 2px 20px rgba(0,0,0,0.3)",
    cardShadowHover: `0 12px 50px ${customAccent || "#d4a853"}14, 0 4px 20px rgba(0,0,0,0.4)`,
    headerBorder: `${customAccent || "#d4a853"}1a`,
    gold: customAccent || "#d4a853",
    goldMuted: `${customAccent || "#d4a853"}80`,
    goldSubtle: `${customAccent || "#d4a853"}14`,
    goldBorder: `${customAccent || "#d4a853"}26`,
    text: "#f5f0e8",
    textSecondary: "rgba(245,240,232,0.55)",
    textTertiary: "rgba(245,240,232,0.3)",
    divider: `${customAccent || "#d4a853"}1a`,
    badgeBg: `${customAccent || "#d4a853"}1a`,
    badgeBorder: `${customAccent || "#d4a853"}33`,
    btnBg: customAccent || "#b8860b",
    btnBorder: customAccent || "#c9971c",
    btnText: "#faf8f5",
    priceLabelColor: `${customAccent || "#d4a853"}99`,
  } : {
    bg: "#faf8f5",
    bgAlt: "#f5f0e8",
    card: "#ffffff",
    cardBorder: "#e8e0d4",
    cardBorderHover: "#d9cebb",
    cardShadow: "0 2px 16px rgba(180,160,130,0.08)",
    cardShadowHover: "0 12px 50px rgba(180,160,130,0.18), 0 4px 16px rgba(180,160,130,0.08)",
    headerBorder: "#e8e0d4",
    gold: customAccent || "#c9a96e",
    goldMuted: customAccent ? `${customAccent}99` : "#b5a48a",
    goldSubtle: `${customAccent || "#c9a96e"}14`,
    goldBorder: "#e5d9c3",
    text: "#2d2926",
    textSecondary: "#8a7d6b",
    textTertiary: "#b5a48a",
    divider: "#f0e9df",
    badgeBg: "#f3ece1",
    badgeBorder: "#e5d9c3",
    btnBg: customAccent || "#8b6914",
    btnBorder: customAccent || "#a07d1c",
    btnText: "#faf8f5",
    priceLabelColor: "#b5a48a",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: c.bg, color: c.text }}>
      <style>{`
        @keyframes silk-fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes silk-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes silk-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes silk-border-glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        .silk-fade-in { animation: silk-fade-in 0.6s ease-out forwards; }
        .silk-fade-in-d1 { animation-delay: 0.1s; opacity: 0; }
        .silk-fade-in-d2 { animation-delay: 0.2s; opacity: 0; }
        .silk-fade-in-d3 { animation-delay: 0.3s; opacity: 0; }
        .silk-float { animation: silk-float 6s ease-in-out infinite; }
        .silk-title {
          background: linear-gradient(90deg, ${c.gold}, ${isDark ? "#f0d78c" : "#8a6c2f"}, ${c.gold});
          background-size: 200% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: silk-shimmer 6s linear infinite;
        }
        .silk-card {
          background: ${c.card};
          border: 1px solid ${c.cardBorder};
          box-shadow: ${c.cardShadow};
          border-radius: 6px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .silk-card:hover {
          border-color: ${c.cardBorderHover};
          box-shadow: ${c.cardShadowHover};
          transform: translateY(-3px);
        }
        .silk-btn {
          background: linear-gradient(135deg, ${c.btnBg}, ${c.btnBorder});
          color: ${c.btnText}; border: 1px solid ${c.btnBorder};
          transition: all 0.3s ease;
        }
        .silk-btn:hover {
          filter: brightness(1.1);
          box-shadow: 0 4px 20px ${c.gold}25;
        }
        .silk-mode-btn {
          background: ${isDark ? "rgba(245,240,232,0.06)" : "rgba(45,41,38,0.04)"};
          border: 1px solid ${isDark ? "rgba(245,240,232,0.1)" : "rgba(45,41,38,0.08)"};
          transition: all 0.3s ease; cursor: pointer; border-radius: 50%;
        }
        .silk-mode-btn:hover {
          background: ${isDark ? "rgba(245,240,232,0.1)" : "rgba(45,41,38,0.08)"};
          border-color: ${c.gold}40;
        }
        .silk-ornament {
          position: relative;
        }
        .silk-ornament::before, .silk-ornament::after {
          content: ''; position: absolute; top: 50%; width: 40px; height: 1px;
          background: linear-gradient(${isDark ? "to right, transparent, rgba(212,168,83,0.25)" : "to right, transparent, rgba(201,169,110,0.3)"});
        }
        .silk-ornament::before { right: calc(100% + 12px); }
        .silk-ornament::after { left: calc(100% + 12px); transform: scaleX(-1); }
        .silk-img-overlay {
          background: linear-gradient(135deg, ${c.bg}10, ${c.bg}30);
        }
        .silk-discount {
          background: ${isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)"};
          border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.15)"};
          color: ${isDark ? "#6ee7b7" : "#059669"};
        }
      `}</style>

      <header className="relative py-6" style={{ borderBottom: `1px solid ${c.headerBorder}` }}>
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logoUrl ? (
              <>
                <img src={store.logoUrl} alt={store.name} className="h-8 w-8 rounded-full object-cover" loading="lazy" style={{ border: `1px solid ${c.goldBorder}` }} data-testid="img-silk-logo" />
                <span className="text-sm font-serif tracking-[0.3em] uppercase" style={{ color: c.goldMuted }} data-testid="text-silk-store-name">
                  {store.name}
                </span>
              </>
            ) : (
              <>
                <div className="h-px w-10" style={{ backgroundColor: c.gold }} />
                <span className="text-sm font-serif tracking-[0.3em] uppercase" style={{ color: c.goldMuted }} data-testid="text-silk-store-name">
                  {store.name}
                </span>
                <div className="h-px w-10" style={{ backgroundColor: c.gold }} />
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`/s/${store.slug}/portal`}
              className="silk-mode-btn flex items-center justify-center w-9 h-9"
              data-testid="link-silk-portal"
              aria-label="My Purchases"
              title="My Purchases"
            >
              <User className="h-4 w-4" style={{ color: c.goldMuted }} />
            </a>
            <button
              onClick={() => setMode(m => m === "light" ? "dark" : "light")}
              className="silk-mode-btn flex items-center justify-center w-9 h-9"
              data-testid="button-silk-theme-toggle"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" style={{ color: c.goldMuted }} /> : <Moon className="h-4 w-4" style={{ color: c.goldMuted }} />}
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        {store.heroBannerUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden" style={{ borderRadius: "0 0 12px 12px", margin: "0 24px" }}>
            <img src={store.heroBannerUrl} alt="" className="w-full h-full object-cover" loading="lazy" style={{ opacity: isDark ? 0.2 : 0.15 }} data-testid="img-silk-hero-banner" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.bg}cc 0%, ${c.bg}dd 60%, ${c.bg} 100%)` }} />
          </div>
        )}
        <div className="relative z-10">
          <div className="silk-fade-in mb-6">
            <div className="silk-float inline-block px-5 py-1.5 rounded-full text-xs tracking-[0.25em] uppercase font-medium" style={{ backgroundColor: c.badgeBg, color: c.goldMuted, border: `1px solid ${c.badgeBorder}` }}>
              Curated Collection
            </div>
          </div>
          <h1 className="silk-title silk-fade-in silk-fade-in-d1 text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight mb-5" style={{ lineHeight: "1.15" }}>
            {store.name}
          </h1>
          <p className="silk-fade-in silk-fade-in-d2 text-base md:text-lg max-w-lg mx-auto leading-relaxed" style={{ color: c.textSecondary }} data-testid="text-silk-tagline">
            {store.tagline || "A thoughtfully curated selection of premium digital goods, crafted with care and attention to detail."}
          </p>
          <div className="mt-10 silk-fade-in silk-fade-in-d3">
            <GoldDivider isDark={isDark} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {checkoutError && (
          <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between gap-3" role="alert" aria-live="polite" style={{ background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", color: isDark ? "#fca5a5" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}` }} data-testid="text-checkout-error">
            <span>{checkoutError}</span>
            <Button size="icon" variant="ghost" onClick={() => setCheckoutError(null)} aria-label="Dismiss error" data-testid="button-dismiss-checkout-error" className="shrink-0" style={{ color: isDark ? "#fca5a5" : "#dc2626" }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {products.length === 0 ? (
          <div className="text-center py-20" data-testid="silk-empty-products">
            <div className="silk-float flex items-center justify-center h-24 w-24 rounded-full mx-auto mb-8" style={{ backgroundColor: c.badgeBg, border: `1px solid ${c.badgeBorder}` }}>
              <Package className="h-10 w-10" style={{ color: c.gold }} />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-4" style={{ color: c.text }}>Coming Soon</h2>
            <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: c.textSecondary }}>
              This store is being set up. Products will appear here once they are published. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {products.map((product, index) => {
              const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;
              const discountPct = hasDiscount ? Math.round(((product.originalPriceCents! - product.priceCents) / product.originalPriceCents!) * 100) : 0;

              return (
                <div key={product.id}>
                  <div className="silk-card group flex flex-col md:flex-row overflow-visible" data-testid={`card-product-${product.id}`}>
                    {product.thumbnailUrl && (
                      <div className="md:w-80 lg:w-96 shrink-0 overflow-hidden" style={{ borderRadius: "6px 0 0 6px" }}>
                        <a href={`/s/${store.slug}/product/${product.id}`} data-testid={`link-product-img-${product.id}`}>
                          <img src={product.thumbnailUrl} alt={product.title} className="w-full h-56 md:h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-testid={`img-product-${product.id}`} />
                        </a>
                      </div>
                    )}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px flex-1" style={{ backgroundColor: c.divider }} />
                          <span className="silk-ornament text-[10px] tracking-[0.3em] uppercase font-medium flex items-center gap-1.5" style={{ color: c.textTertiary }}>
                            {product.category || "Digital Product"}
                          </span>
                          <div className="h-px flex-1" style={{ backgroundColor: c.divider }} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif mb-3 tracking-tight" style={{ color: c.text, lineHeight: "1.3" }} data-testid={`text-silk-product-${product.id}`}>
                          <a href={`/s/${store.slug}/product/${product.id}`} className="hover:underline" data-testid={`link-product-title-${product.id}`}>
                            {product.title}
                          </a>
                        </h3>
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mb-3">
                            {product.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: c.textTertiary }} data-testid={`badge-silk-tag-${product.id}-${i}`}>{tag}</span>
                            ))}
                          </div>
                        )}
                        {product.description && (
                          <p className="text-sm leading-relaxed line-clamp-3 mb-6" style={{ color: c.textSecondary }}>
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4 flex-wrap pt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {product.isLeadMagnet ? (
                            <>
                              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: c.priceLabelColor }}>Price</span>
                              <span className="text-2xl font-serif" style={{ color: c.text }} data-testid={`text-price-${product.id}`}>
                                Free
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: c.priceLabelColor }}>Price</span>
                              {hasDiscount && (
                                <span className="text-sm line-through" style={{ color: c.textTertiary }}>${(product.originalPriceCents! / 100).toFixed(2)}</span>
                              )}
                              <span className="text-2xl font-serif" style={{ color: c.text }} data-testid={`text-price-${product.id}`}>
                                ${(product.priceCents / 100).toFixed(2)}
                              </span>
                              {hasDiscount && (
                                <span className="silk-discount text-xs font-bold px-2 py-0.5 rounded-full">-{discountPct}%</span>
                              )}
                            </>
                          )}
                        </div>
                        {product.isLeadMagnet ? (
                          <Button onClick={() => setLeadModalProduct(product)} data-testid={`button-silk-lead-${product.id}`} className="silk-btn rounded-full px-6 font-medium tracking-wide text-sm no-default-hover-elevate no-default-active-elevate">
                            <Gift className="mr-2 h-4 w-4" />
                            Get it Free
                          </Button>
                        ) : (
                          <Button onClick={() => handleBuy(product)} data-testid={`button-silk-buy-${product.id}`} className="silk-btn rounded-full px-6 font-medium tracking-wide text-sm no-default-hover-elevate no-default-active-elevate">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Purchase
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < products.length - 1 && (
                    <div className="pt-10">
                      <GoldDivider isDark={isDark} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {bundles.length > 0 && (
          <div className="mt-20">
            <GoldDivider isDark={isDark} />
            <div className="text-center mt-10 mb-12">
              <div className="silk-float inline-block px-5 py-1.5 rounded-full text-xs tracking-[0.25em] uppercase font-medium mb-4" style={{ backgroundColor: c.badgeBg, color: c.goldMuted, border: `1px solid ${c.badgeBorder}` }}>
                Special Offers
              </div>
              <h2 className="silk-title text-3xl md:text-4xl font-serif tracking-tight">Curated Bundles</h2>
            </div>
            <div className="space-y-10">
              {bundles.map((bundle) => {
                const totalValue = bundle.products.reduce((sum, p) => sum + p.priceCents, 0);
                const savePct = totalValue > bundle.priceCents ? Math.round(((totalValue - bundle.priceCents) / totalValue) * 100) : 0;
                return (
                  <div key={bundle.id} className="silk-card group flex flex-col md:flex-row overflow-visible" data-testid={`card-bundle-${bundle.id}`}>
                    {bundle.thumbnailUrl && (
                      <div className="md:w-80 lg:w-96 shrink-0 overflow-hidden" style={{ borderRadius: "6px 0 0 6px" }}>
                        <img src={bundle.thumbnailUrl} alt={bundle.name} className="w-full h-56 md:h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px flex-1" style={{ backgroundColor: c.divider }} />
                          <span className="text-[10px] tracking-[0.3em] uppercase font-medium flex items-center gap-1.5" style={{ color: c.textTertiary }}>
                            <Package className="h-3 w-3" />
                            Bundle
                          </span>
                          <div className="h-px flex-1" style={{ backgroundColor: c.divider }} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif mb-3 tracking-tight" style={{ color: c.text, lineHeight: "1.3" }}>
                          {bundle.name}
                        </h3>
                        {bundle.description && (
                          <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: c.textSecondary }}>
                            {bundle.description}
                          </p>
                        )}
                        <p className="text-xs tracking-wider uppercase mb-6 flex items-center gap-2" style={{ color: c.textTertiary }}>
                          {bundle.products.length} product{bundle.products.length !== 1 ? "s" : ""} included
                          {savePct > 0 && (
                            <span className="silk-discount text-xs font-bold px-2 py-0.5 rounded-full">Save {savePct}%</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 flex-wrap pt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <div className="flex items-baseline gap-3">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-medium tracking-wider uppercase" style={{ color: c.priceLabelColor }}>Price</span>
                            <span className="text-2xl font-serif" style={{ color: c.text }}>${(bundle.priceCents / 100).toFixed(2)}</span>
                          </div>
                          {totalValue > bundle.priceCents && (
                            <span className="text-sm line-through" style={{ color: c.textTertiary }}>${(totalValue / 100).toFixed(2)}</span>
                          )}
                        </div>
                        <a href={`/s/${store.slug}/bundle/${bundle.id}`} data-testid={`link-bundle-${bundle.id}`}>
                          <Button className="silk-btn rounded-full px-6 font-medium tracking-wide text-sm no-default-hover-elevate no-default-active-elevate">
                            <Package className="mr-2 h-4 w-4" />
                            View Bundle
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="py-10" style={{ borderTop: `1px solid ${c.headerBorder}` }}>
        <div className="mx-auto max-w-5xl px-6 text-center">
          <GoldDivider isDark={isDark} />
          <p className="mt-4 text-xs tracking-[0.2em] uppercase" style={{ color: c.textTertiary }}>
            Powered by DigitalVault
          </p>
        </div>
      </footer>

      {leadModalProduct && (
        <LeadMagnetModal
          isOpen={!!leadModalProduct}
          onClose={() => setLeadModalProduct(null)}
          productTitle={leadModalProduct.title}
          productId={leadModalProduct.id}
          storeId={store.id}
          storeSlug={store.slug}
          colors={{
            bg: c.bg,
            card: c.card,
            text: c.text,
            textSecondary: c.textSecondary,
            accent: c.gold,
            border: c.cardBorder,
          }}
        />
      )}
    </div>
  );
}
