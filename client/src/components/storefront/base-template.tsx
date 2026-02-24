import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Sparkles, Sun, Moon, Gift, User, X, FileText, ArrowRight, Calendar, Search, ArrowUpDown, ExternalLink } from "lucide-react";
import { LeadMagnetModal } from "./lead-magnet-modal";
import { ProtectedImage } from "@/components/protected-image";
import { useStorefrontFilters } from "@/hooks/use-storefront-filters";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { Store, Product, Bundle, BlogPost } from "@shared/schema";
import type { StorefrontTheme, ThemeMode } from "./theme-types";

type StorefrontProduct = Product & {
  isLeadMagnet?: boolean;
  upsellProductId?: string | null;
  upsellBundleId?: string | null;
  storeProductId?: string;
};

const socialIcons: Record<string, JSX.Element> = {
  twitter: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  website: <ExternalLink className="h-4 w-4" />,
};

interface BaseTemplateProps {
  store: Store;
  products: StorefrontProduct[];
  bundles: Array<{ id: string; name: string; description: string | null; priceCents: number; thumbnailUrl: string | null; products: Product[] }>;
  theme: StorefrontTheme;
}

export function BaseTemplate({ store, products, bundles, theme }: BaseTemplateProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(theme.modeStorageKey) as ThemeMode) || theme.defaultMode;
    }
    return theme.defaultMode;
  });

  useEffect(() => {
    localStorage.setItem(theme.modeStorageKey, mode);
  }, [mode, theme.modeStorageKey]);

  const isDark = mode === "dark";
  const [leadModalProduct, setLeadModalProduct] = useState<StorefrontProduct | null>(null);

  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`${theme.announcementStoragePrefix}-${store.slug}`) === "dismissed";
    }
    return false;
  });

  const { data: blogData } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/storefront", store.slug, "blog"],
    queryFn: async () => {
      const res = await fetch(`/api/storefront/${store.slug}/blog`);
      if (!res.ok) return { posts: [] };
      return res.json();
    },
    enabled: !!store.blogEnabled,
  });
  const blogPosts = store.blogEnabled ? (blogData?.posts || []).slice(0, 3) : [];

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, sortBy, setSortBy, categories, filtered } = useStorefrontFilters(products);
  const revealRef = useScrollReveal();

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
  const c = theme.colors(mode, customAccent);

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    localStorage.setItem(`${theme.announcementStoragePrefix}-${store.slug}`, "dismissed");
  };

  const socialLinks = [
    { url: store.socialTwitter, label: "Twitter", icon: socialIcons.twitter },
    { url: store.socialInstagram, label: "Instagram", icon: socialIcons.instagram },
    { url: store.socialYoutube, label: "YouTube", icon: socialIcons.youtube },
    { url: store.socialTiktok, label: "TikTok", icon: socialIcons.tiktok },
    { url: store.socialWebsite, label: "Website", icon: socialIcons.website },
  ].filter(s => s.url);

  const isGrid = theme.layout.productLayout === "grid";

  return (
    <div style={{ background: c.bg, color: c.text }} className="min-h-screen relative overflow-hidden">
      <style>{theme.css(c, mode)}</style>

      {theme.renderBackground?.(c, mode)}

      {store.announcementText && !announcementDismissed && (
        <div
          data-testid="banner-announcement"
          className="relative z-20"
          style={theme.renderAnnouncementStyle?.(c, mode) || { background: c.btnGradient }}
        >
          <div className={`mx-auto ${theme.layout.maxWidth} px-6 py-2.5 flex items-center justify-center gap-3`}>
            <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: theme.id === "silk" ? c.accent : "#fff" }} />
            {store.announcementLink ? (
              <a
                href={store.announcementLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline truncate"
                style={{ color: theme.id === "silk" ? c.accent : "#fff", fontFamily: theme.typography.bodyFamily }}
                data-testid="link-announcement"
              >
                {store.announcementText}
              </a>
            ) : (
              <span className="text-sm font-medium truncate" style={{ color: theme.id === "silk" ? c.accent : "#fff", fontFamily: theme.typography.bodyFamily }}>{store.announcementText}</span>
            )}
            <button
              onClick={dismissAnnouncement}
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-colors"
              style={{ color: theme.id === "silk" ? c.accentAlt : "rgba(255,255,255,0.8)" }}
              data-testid="button-dismiss-announcement"
              aria-label="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="relative z-10 px-6 py-5" style={{ borderBottom: `1px solid ${c.headerBorder}` }}>
        <div className="t-separator absolute bottom-0 left-0 right-0" />
        <div className={`mx-auto ${theme.layout.maxWidth} flex items-center justify-between gap-4 flex-wrap`}>
          <div className="flex items-center gap-3">
            {theme.renderHeaderLogo
              ? theme.renderHeaderLogo(store, c)
              : (
                <span className="text-lg font-bold" style={{ color: c.text, fontFamily: theme.typography.headingFamily }} data-testid="text-store-name">
                  {store.name}
                </span>
              )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/s/${store.slug}/portal`}
              className={`${theme.effects.modeToggleClass} flex items-center justify-center w-9 h-9 rounded-lg`}
              data-testid="link-portal"
              aria-label="My Purchases"
              title="My Purchases"
            >
              <User className="h-4 w-4" style={{ color: c.textSecondary }} />
            </a>
            <button
              onClick={() => setMode(m => m === "dark" ? "light" : "dark")}
              className={`${theme.effects.modeToggleClass} flex items-center justify-center w-9 h-9 rounded-lg`}
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" style={{ color: c.textSecondary }} /> : <Moon className="h-4 w-4" style={{ color: c.textSecondary }} />}
            </button>
          </div>
        </div>
      </header>

      <section className={`relative z-10 mx-auto ${theme.layout.maxWidth} px-6 pt-20 pb-24 text-center`}>
        {store.heroBannerUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-b-2xl" style={{ margin: "0 24px" }}>
            <img src={store.heroBannerUrl} alt="" className="w-full h-full object-cover" loading="lazy" style={{ opacity: isDark ? 0.25 : 0.18 }} data-testid="img-hero-banner" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.bg}99 0%, ${c.bg}bb 50%, ${c.bg} 100%)` }} />
          </div>
        )}
        <div className="relative z-10">
          {theme.renderHeroBadge?.(c)}

          <h1
            className={`${theme.effects.heroTitleClass} text-4xl md:text-5xl lg:text-7xl tracking-tight mb-6 leading-tight`}
            style={{ fontFamily: theme.typography.headingFamily, fontWeight: theme.typography.headingWeight }}
          >
            {store.name}
          </h1>

          <p
            className={`${theme.effects.heroSubtitleClass} text-lg md:text-xl max-w-lg mx-auto font-light leading-relaxed`}
            style={{ fontFamily: theme.typography.bodyFamily }}
            data-testid="text-tagline"
          >
            {store.tagline || theme.heroSubtitleFallback}
          </p>

          {theme.renderDivider ? (
            <div className="mt-10">
              {theme.renderDivider(isDark)}
            </div>
          ) : (
            <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
              {["Instant Delivery", "Secure Checkout", "Premium Quality"].map((label, i) => (
                <div key={label} className="flex items-center gap-2 text-sm" style={{ color: c.textTertiary }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: [c.price, c.accentAlt, c.accent][i] }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {categories.length > 1 && (
        <nav
          data-testid="nav-categories"
          className="sticky top-0 z-30"
          style={{
            background: isDark ? `${c.bg}bf` : `${c.bg}d9`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${c.headerBorder}`,
          }}
        >
          <div className={`mx-auto ${theme.layout.maxWidth} px-6`}>
            <div className="flex items-center gap-1 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  data-testid={`button-category-${cat}`}
                  className="shrink-0 px-4 py-2 text-sm font-medium transition-all duration-300"
                  style={{
                    borderRadius: theme.layout.categoryBorderRadius,
                    fontFamily: theme.typography.categoryFont,
                    background: selectedCategory === cat
                      ? `linear-gradient(135deg, ${c.accent}20, ${c.accent}10)`
                      : "transparent",
                    color: selectedCategory === cat ? c.accent : c.textSecondary,
                    borderBottom: selectedCategory === cat ? `2px solid ${c.accent}` : "2px solid transparent",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      <main className={`mx-auto ${theme.layout.maxWidth} px-6 pb-24 relative z-10`}>
        {checkoutError && (
          <div className="mb-6 mt-4 rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between gap-3" role="alert" aria-live="polite" style={{ background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", color: isDark ? "#fca5a5" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}` }} data-testid="text-checkout-error">
            <span>{checkoutError}</span>
            <Button size="icon" variant="ghost" onClick={() => setCheckoutError(null)} aria-label="Dismiss error" data-testid="button-dismiss-checkout-error" className="shrink-0" style={{ color: isDark ? "#fca5a5" : "#dc2626" }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: c.textTertiary }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-storefront-search"
                className="w-full pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-300"
                style={{
                  background: c.card,
                  border: `1px solid ${c.cardBorder}`,
                  color: c.text,
                  borderRadius: theme.layout.buttonBorderRadius,
                  fontFamily: theme.typography.bodyFamily,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 0 12px ${c.accent}15`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = c.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div className="relative shrink-0">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: c.textTertiary }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                data-testid="select-storefront-sort"
                className="appearance-none pl-10 pr-8 py-2.5 text-sm outline-none cursor-pointer transition-all duration-300"
                style={{
                  background: c.card,
                  border: `1px solid ${c.cardBorder}`,
                  color: c.text,
                  borderRadius: theme.layout.buttonBorderRadius,
                  fontFamily: theme.typography.bodyFamily,
                  minWidth: "180px",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = c.accent; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = c.cardBorder; }}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-az">Name A-Z</option>
              </select>
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="mb-6 text-sm" style={{ color: c.textSecondary, fontFamily: theme.typography.bodyFamily }} data-testid="text-product-count">
            Showing {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-products">
            <div className="flex items-center justify-center h-24 w-24 rounded-full mx-auto mb-8" style={{ backgroundColor: c.badgeBg, border: `1px solid ${c.badgeBorder}` }}>
              <Package className="h-10 w-10" style={{ color: c.accent }} />
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>Coming Soon</h2>
            <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: c.textSecondary }}>
              This store is being set up. Products will appear here once they are published. Check back soon!
            </p>
          </div>
        ) : isGrid ? (
          <div ref={revealRef} className={`grid gap-6 ${theme.layout.gridColumns}`}>
            {filtered.map((product) => {
              const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;
              const discountPct = hasDiscount ? Math.round(((product.originalPriceCents! - product.priceCents) / product.originalPriceCents!) * 100) : 0;

              return (
                <div key={product.id} className="sf-reveal-item">
                  <div className={`${theme.effects.cardClass} group`} data-testid={`card-product-${product.id}`}>
                    {theme.renderCardOverlay?.(c)}
                    <div className="t-card-line-scan" />
                    <div className="t-holo-stripe" />

                    {product.thumbnailUrl && (
                      <div className="relative overflow-hidden" style={{ borderRadius: `${theme.layout.cardBorderRadius} ${theme.layout.cardBorderRadius} 0 0` }}>
                        <a href={`/s/${store.slug}/product/${product.id}`} data-testid={`link-product-img-${product.id}`}>
                          <ProtectedImage protected={!store.allowImageDownload} src={product.thumbnailUrl} alt={product.title} className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-testid={`img-product-${product.id}`} />
                        </a>
                        {hasDiscount && (
                          <div className="absolute top-3 right-3 t-discount px-2.5 py-1 text-xs font-bold rounded-full" data-testid={`badge-discount-${product.id}`}>
                            -{discountPct}%
                          </div>
                        )}
                        {product.isLeadMagnet && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-full" style={{ background: c.btnGradient, color: c.btnText }}>
                            <Gift className="h-3 w-3 inline mr-1" />FREE
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 relative z-10">
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {product.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="t-tag-badge px-2 py-0.5 text-[10px] font-medium rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}

                      <a href={`/s/${store.slug}/product/${product.id}`} className="block" data-testid={`link-product-title-${product.id}`}>
                        <h3 className="font-bold text-base mb-2 line-clamp-2 transition-colors" style={{ color: c.text, fontFamily: theme.typography.headingFamily }} data-testid={`text-product-title-${product.id}`}>
                          {product.title}
                        </h3>
                      </a>

                      {product.description && (
                        <p className="text-xs line-clamp-2 mb-4" style={{ color: c.textSecondary }}>{product.description}</p>
                      )}

                      <div className="flex items-center justify-between gap-3 mt-auto pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <div>
                          {hasDiscount && (
                            <span className="text-xs line-through mr-2" style={{ color: c.textTertiary }}>${(product.originalPriceCents! / 100).toFixed(2)}</span>
                          )}
                          <span className="text-lg font-bold" style={{ color: c.price }} data-testid={`text-product-price-${product.id}`}>
                            {product.priceCents === 0 ? "Free" : `$${(product.priceCents / 100).toFixed(2)}`}
                          </span>
                        </div>
                        <button
                          onClick={() => product.isLeadMagnet ? setLeadModalProduct(product) : handleBuy(product)}
                          className={`${theme.effects.buyBtnClass} px-4 py-2 text-sm font-semibold`}
                          style={{ borderRadius: theme.layout.buttonBorderRadius }}
                          data-testid={`button-buy-${product.id}`}
                        >
                          {product.isLeadMagnet ? (
                            <><Gift className="h-3.5 w-3.5 inline mr-1.5" />Get Free</>
                          ) : (
                            <><ShoppingBag className="h-3.5 w-3.5 inline mr-1.5" />Buy</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div ref={revealRef} className="space-y-8">
            {filtered.map((product) => {
              const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;
              const discountPct = hasDiscount ? Math.round(((product.originalPriceCents! - product.priceCents) / product.originalPriceCents!) * 100) : 0;

              return (
                <div key={product.id} className="sf-reveal-item">
                  <div className={`${theme.effects.cardClass} group flex flex-col md:flex-row`} data-testid={`card-product-${product.id}`}>
                    {product.thumbnailUrl && (
                      <div className="md:w-80 lg:w-96 shrink-0 overflow-hidden">
                        <a href={`/s/${store.slug}/product/${product.id}`} data-testid={`link-product-img-${product.id}`}>
                          <ProtectedImage protected={!store.allowImageDownload} src={product.thumbnailUrl} alt={product.title} className="w-full h-56 md:h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-testid={`img-product-${product.id}`} />
                        </a>
                      </div>
                    )}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          {product.category && (
                            <span className="text-xs tracking-[0.15em] uppercase font-medium" style={{ color: c.accent }}>{product.category}</span>
                          )}
                          {hasDiscount && (
                            <span className="t-discount px-2.5 py-0.5 text-xs font-bold rounded-full" data-testid={`badge-discount-${product.id}`}>
                              -{discountPct}% OFF
                            </span>
                          )}
                          {product.isLeadMagnet && (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full" style={{ background: c.btnGradient, color: c.btnText }}>
                              <Gift className="h-3 w-3 inline mr-1" />FREE
                            </span>
                          )}
                        </div>

                        <a href={`/s/${store.slug}/product/${product.id}`} data-testid={`link-product-title-${product.id}`}>
                          <h3 className="text-xl font-bold mb-3 transition-colors" style={{ color: c.text, fontFamily: theme.typography.headingFamily }} data-testid={`text-product-title-${product.id}`}>
                            {product.title}
                          </h3>
                        </a>

                        <div className="h-px w-full mb-4" style={{ background: c.divider }} />

                        {product.description && (
                          <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: c.textSecondary }}>{product.description}</p>
                        )}

                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {product.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="t-tag-badge px-2.5 py-1 text-xs font-medium rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-4 flex-wrap" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold" style={{ color: c.price }} data-testid={`text-product-price-${product.id}`}>
                            {product.priceCents === 0 ? "Free" : `$${(product.priceCents / 100).toFixed(2)}`}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm line-through" style={{ color: c.textTertiary }}>${(product.originalPriceCents! / 100).toFixed(2)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => product.isLeadMagnet ? setLeadModalProduct(product) : handleBuy(product)}
                          className={`${theme.effects.buyBtnClass} px-6 py-2.5 text-sm font-semibold flex items-center gap-2`}
                          style={{ borderRadius: theme.layout.buttonBorderRadius }}
                          data-testid={`button-buy-${product.id}`}
                        >
                          {product.isLeadMagnet ? (
                            <><Gift className="h-4 w-4" />Get Free</>
                          ) : (
                            <><ShoppingBag className="h-4 w-4" />Add to Cart</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {bundles.length > 0 && (
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
                  <div key={bundle.id} className={`${theme.effects.cardClass} sf-reveal-item p-6`} data-testid={`card-bundle-${bundle.id}`}>
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
                        href={`/s/${store.slug}/bundle/${bundle.id}`}
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
        )}

        {blogPosts.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-12">
              {theme.renderDivider?.(isDark)}
              <h2 className="text-2xl md:text-3xl font-bold mt-4 flex items-center justify-center gap-3" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>
                <FileText className="h-6 w-6" style={{ color: c.accent }} />
                Latest from the Blog
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {blogPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/s/${store.slug}/blog/${post.slug}`}
                  className={`${theme.effects.cardClass} group block`}
                  data-testid={`link-blog-${post.id}`}
                >
                  {post.coverImageUrl && (
                    <div className="overflow-hidden" style={{ borderRadius: `${theme.layout.cardBorderRadius} ${theme.layout.cardBorderRadius} 0 0` }}>
                      <img src={post.coverImageUrl} alt={post.title} className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && (
                      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold" style={{ color: c.accent }}>{post.category}</span>
                    )}
                    <h3 className="font-bold text-sm mt-1 mb-2 line-clamp-2" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>{post.title}</h3>
                    {post.excerpt && <p className="text-xs line-clamp-2" style={{ color: c.textSecondary }}>{post.excerpt}</p>}
                    <div className="flex items-center gap-2 mt-3 text-[10px]" style={{ color: c.textTertiary }}>
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <div className="text-center mt-8">
              <a
                href={`/s/${store.slug}/blog`}
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: c.accent }}
                data-testid="link-blog-all"
              >
                View All Posts <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </main>

      <footer data-testid="footer-storefront" className="relative z-10" style={{ borderTop: `1px solid ${c.headerBorder}` }}>
        <div className={`mx-auto ${theme.layout.maxWidth} px-6 py-16`}>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {store.logoUrl && (
                  <img src={store.logoUrl} alt={store.name} className="h-8 w-8 rounded-lg object-cover" loading="lazy" />
                )}
                <span className="text-lg font-bold" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>{store.name}</span>
              </div>
              {store.footerText && (
                <p className="text-sm leading-relaxed max-w-md" style={{ color: c.textSecondary }}>{store.footerText}</p>
              )}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3 mt-5">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300"
                      style={{ background: `${c.accent}10`, color: c.textSecondary, border: `1px solid ${c.accent}20` }}
                      data-testid={`link-social-${s.label.toLowerCase()}`}
                      aria-label={s.label}
                      title={s.label}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: c.accent, fontFamily: theme.typography.headingFamily }}>Quick Links</h4>
              <div className="space-y-3">
                <a href={`/s/${store.slug}/portal`} className="flex items-center gap-2 text-sm transition-colors" style={{ color: c.textSecondary }} data-testid="link-footer-purchases">
                  <User className="h-4 w-4" /> My Purchases
                </a>
                {store.blogEnabled && (
                  <a href={`/s/${store.slug}/blog`} className="flex items-center gap-2 text-sm transition-colors" style={{ color: c.textSecondary }} data-testid="link-footer-blog">
                    <FileText className="h-4 w-4" /> Blog
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 flex items-center justify-between flex-wrap gap-4" style={{ borderTop: `1px solid ${c.divider}` }}>
            <span className="text-xs" style={{ color: c.textTertiary }}>
              &copy; {new Date().getFullYear()} {store.name}
            </span>
            <span className="text-xs" style={{ color: c.textTertiary }}>
              Powered by <a href="/" className="hover:underline" style={{ color: c.accent }}>Sellisy</a>
            </span>
          </div>
        </div>
      </footer>

      {leadModalProduct && (
        <LeadMagnetModal
          isOpen={!!leadModalProduct}
          onClose={() => setLeadModalProduct(null)}
          storeId={store.id}
          storeSlug={store.slug}
          productTitle={leadModalProduct.title}
          productId={leadModalProduct.id}
          colors={{
            bg: c.bg,
            card: c.card,
            text: c.text,
            textSecondary: c.textSecondary,
            accent: c.accent,
            border: c.cardBorder,
          }}
        />
      )}
    </div>
  );
}
