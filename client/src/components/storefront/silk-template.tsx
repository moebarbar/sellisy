import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Sparkles, Sun, Moon, Gift, User, X, FileText, ArrowRight, Calendar, Search, ArrowUpDown, ExternalLink } from "lucide-react";
import { LeadMagnetModal } from "./lead-magnet-modal";
import { ProtectedImage } from "@/components/protected-image";
import { StorefrontProductPlaceholder } from "@/components/product-placeholder";
import { useStorefrontFilters } from "@/hooks/use-storefront-filters";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { Store, Product, Bundle, BlogPost } from "@shared/schema";

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

  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`silk-announcement-${store.slug}`) === "dismissed";
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

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    localStorage.setItem(`silk-announcement-${store.slug}`, "dismissed");
  };

  const socialLinks = [
    { url: store.socialTwitter, label: "Twitter", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { url: store.socialInstagram, label: "Instagram", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
    { url: store.socialYoutube, label: "YouTube", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    { url: store.socialTiktok, label: "TikTok", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
    { url: store.socialWebsite, label: "Website", icon: <ExternalLink className="h-4 w-4" /> },
  ].filter(s => s.url);

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
          overflow: hidden;
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
        .sf-reveal-item {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .sf-reveal-item.sf-revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {store.announcementText && !announcementDismissed && (
        <div
          data-testid="banner-announcement"
          className="relative z-20"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${c.gold}18, ${c.gold}0d)`
              : `linear-gradient(135deg, ${c.gold}14, ${c.gold}08)`,
            borderBottom: `1px solid ${c.gold}30`,
          }}
        >
          <div className="mx-auto max-w-5xl px-6 py-2.5 flex items-center justify-center gap-3">
            <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: c.gold }} />
            {store.announcementLink ? (
              <a
                href={store.announcementLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-serif tracking-wide hover:underline truncate"
                style={{ color: c.gold }}
                data-testid="link-announcement"
              >
                {store.announcementText}
              </a>
            ) : (
              <span className="text-sm font-serif tracking-wide truncate" style={{ color: c.gold }}>{store.announcementText}</span>
            )}
            <button
              onClick={dismissAnnouncement}
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-colors"
              style={{ color: c.goldMuted }}
              data-testid="button-dismiss-announcement"
              aria-label="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="relative py-6" style={{ borderBottom: `1px solid ${c.headerBorder}` }}>
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logoUrl ? (
              <>
                <img src={store.logoUrl} alt={store.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" style={{ border: `1px solid ${c.goldBorder}` }} data-testid="img-silk-logo" />
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

      {categories.length > 1 && (
        <nav
          data-testid="nav-categories"
          className="sticky top-0 z-30"
          style={{
            background: isDark ? "rgba(12,10,9,0.85)" : "rgba(250,248,245,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${c.headerBorder}`,
          }}
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-center gap-1 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  data-testid={`button-category-${cat}`}
                  className="shrink-0 px-4 py-2 rounded-md text-sm font-serif tracking-wide transition-all duration-300"
                  style={{
                    background: selectedCategory === cat
                      ? `linear-gradient(135deg, ${c.gold}20, ${c.gold}10)`
                      : "transparent",
                    color: selectedCategory === cat ? c.gold : c.textSecondary,
                    borderBottom: selectedCategory === cat ? `2px solid ${c.gold}` : "2px solid transparent",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {checkoutError && (
          <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between gap-3" role="alert" aria-live="polite" style={{ background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", color: isDark ? "#fca5a5" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}` }} data-testid="text-checkout-error">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm font-serif outline-none transition-all duration-300"
                style={{
                  background: c.card,
                  border: `1px solid ${c.cardBorder}`,
                  color: c.text,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.boxShadow = `0 0 12px ${c.gold}15`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = c.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div className="relative shrink-0">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: c.textTertiary }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                data-testid="select-storefront-sort"
                className="appearance-none pl-10 pr-8 py-2.5 rounded-md text-sm font-serif outline-none cursor-pointer transition-all duration-300"
                style={{
                  background: c.card,
                  border: `1px solid ${c.cardBorder}`,
                  color: c.text,
                  minWidth: "180px",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = c.gold; }}
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
          <div className="mb-6 text-sm font-serif" style={{ color: c.textSecondary }} data-testid="text-product-count">
            Showing {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}
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
          <div ref={revealRef} className="space-y-10">
            {filtered.map((product, index) => {
              const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;
              const discountPct = hasDiscount ? Math.round(((product.originalPriceCents! - product.priceCents) / product.originalPriceCents!) * 100) : 0;

              return (
                <div key={product.id} className="sf-reveal-item">
                  <div className="silk-card group flex flex-col md:flex-row" data-testid={`card-product-${product.id}`}>
                    <div className="md:w-80 lg:w-96 shrink-0 overflow-hidden">
                      <a href={`/s/${store.slug}/product/${product.id}`} data-testid={`link-product-img-${product.id}`}>
                        {product.thumbnailUrl ? (
                          <ProtectedImage protected={!store.allowImageDownload} src={product.thumbnailUrl} alt={product.title} className="w-full h-56 md:h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-testid={`img-product-${product.id}`} />
                        ) : (
                          <StorefrontProductPlaceholder productType={product.productType} accentColor={store.accentColor || undefined} title={product.title} className="h-56 md:h-full" />
                        )}
                      </a>
                    </div>
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
                  {index < filtered.length - 1 && (
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
                  <div key={bundle.id} className="silk-card group flex flex-col md:flex-row sf-reveal-item" data-testid={`card-bundle-${bundle.id}`}>
                    {bundle.thumbnailUrl && (
                      <div className="md:w-80 lg:w-96 shrink-0 overflow-hidden">
                        <ProtectedImage protected={!store.allowImageDownload} src={bundle.thumbnailUrl} alt={bundle.name} className="w-full h-56 md:h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
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
        {blogPosts.length > 0 && (
          <div className="mx-auto max-w-5xl px-6 mt-16">
            <GoldDivider isDark={isDark} />
            <h2 className="text-center text-2xl font-serif tracking-wide mt-8 mb-8" style={{ color: c.text }}>
              From the Blog
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/s/${store.slug}/blog/${post.slug}`}
                  className="group rounded-xl overflow-hidden transition-all hover:shadow-lg"
                  style={{ background: c.card, border: `1px solid ${c.cardBorder}` }}
                  data-testid={`link-blog-${post.id}`}
                >
                  {post.coverImageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-serif font-semibold mb-1 group-hover:underline" style={{ color: c.text }}>{post.title}</h3>
                    {post.excerpt && <p className="text-sm line-clamp-2 mb-3" style={{ color: c.textSecondary }}>{post.excerpt}</p>}
                    <div className="flex items-center gap-1 text-xs" style={{ color: c.textTertiary }}>
                      <Calendar className="h-3 w-3" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-6 text-center">
              <a href={`/s/${store.slug}/blog`} className="inline-flex items-center gap-1 text-sm font-serif tracking-wide hover:underline" style={{ color: c.gold }}>
                View all articles <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-10" style={{ borderTop: `1px solid ${c.headerBorder}` }} data-testid="footer-storefront">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" style={{ border: `1px solid ${c.goldBorder}` }} />
                ) : (
                  <>
                    <div className="h-px w-6" style={{ backgroundColor: c.gold }} />
                  </>
                )}
                <span className="text-sm font-serif tracking-[0.3em] uppercase" style={{ color: c.goldMuted }}>
                  {store.name}
                </span>
              </div>
              <GoldDivider isDark={isDark} />
              {store.footerText && (
                <p className="text-sm font-serif leading-relaxed max-w-md mt-4" style={{ color: c.textSecondary }}>
                  {store.footerText}
                </p>
              )}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3 mt-5">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="silk-mode-btn flex items-center justify-center w-9 h-9"
                      style={{ color: c.goldMuted }}
                      aria-label={social.label}
                      data-testid={`link-social-${social.label.toLowerCase()}`}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-serif font-medium tracking-[0.2em] uppercase mb-1" style={{ color: c.textTertiary }}>Quick Links</span>
              <a
                href={`/s/${store.slug}/portal`}
                className="flex items-center gap-2 text-sm font-serif tracking-wide transition-colors hover:underline"
                style={{ color: c.textSecondary }}
                data-testid="link-footer-purchases"
              >
                <User className="h-3.5 w-3.5" />
                My Purchases
              </a>
              {store.blogEnabled && (
                <a
                  href={`/s/${store.slug}/blog`}
                  className="flex items-center gap-2 text-sm font-serif tracking-wide transition-colors hover:underline"
                  style={{ color: c.textSecondary }}
                  data-testid="link-footer-blog"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Blog
                </a>
              )}
            </div>
          </div>
          <div className="text-center">
            <GoldDivider isDark={isDark} />
            <p className="mt-4 text-xs tracking-[0.2em] uppercase" style={{ color: c.textTertiary }}>
              Powered by Sellisy
            </p>
          </div>
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
