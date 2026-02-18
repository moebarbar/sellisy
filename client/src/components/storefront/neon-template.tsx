import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Zap, Sparkles, Sun, Moon, Gift, User, X } from "lucide-react";
import { LeadMagnetModal } from "./lead-magnet-modal";
import type { Store, Product, Bundle } from "@shared/schema";

type StorefrontProduct = Product & {
  isLeadMagnet?: boolean;
  upsellProductId?: string | null;
  upsellBundleId?: string | null;
  storeProductId?: string;
};

type NeonMode = "dark" | "light";

export function NeonTemplate({ store, products, bundles }: { store: Store; products: StorefrontProduct[]; bundles: Array<{ id: string; name: string; description: string | null; priceCents: number; thumbnailUrl: string | null; products: Product[] }> }) {
  const [mode, setMode] = useState<NeonMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("neon-mode") as NeonMode) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("neon-mode", mode);
  }, [mode]);

  const isDark = mode === "dark";
  const [leadModalProduct, setLeadModalProduct] = useState<StorefrontProduct | null>(null);

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
    bg: "#030308",
    bgAlt: "rgba(255,255,255,0.02)",
    card: "rgba(255,255,255,0.03)",
    cardHover: "rgba(255,255,255,0.06)",
    border: `${customAccent || "#60a5fa"}1f`,
    borderHover: `${customAccent || "#60a5fa"}59`,
    text: "#ffffff",
    textSecondary: "rgba(255,255,255,0.5)",
    textTertiary: "rgba(255,255,255,0.25)",
    accent: customAccent || "#60a5fa",
    accentAlt: "#a78bfa",
    cyan: "#06b6d4",
    price: "#67e8f9",
    gridLine: `${customAccent || "#60a5fa"}0a`,
    gridDot: `${customAccent || "#60a5fa"}26`,
    scanline: `${customAccent || "#60a5fa"}05`,
    orbA: `${customAccent || "#3b82f6"}1a`,
    orbB: "rgba(124,58,237,0.06)",
    orbC: "rgba(6,182,212,0.07)",
    shadow: "rgba(0,0,0,0.5)",
  } : {
    bg: "#f0f4ff",
    bgAlt: `${customAccent || "#60a5fa"}0a`,
    card: "rgba(255,255,255,0.85)",
    cardHover: "rgba(255,255,255,0.95)",
    border: `${customAccent || "#60a5fa"}2e`,
    borderHover: `${customAccent || "#60a5fa"}66`,
    text: "#0f172a",
    textSecondary: "rgba(15,23,42,0.55)",
    textTertiary: "rgba(15,23,42,0.3)",
    accent: customAccent || "#3b82f6",
    accentAlt: "#7c3aed",
    cyan: "#0891b2",
    price: "#0e7490",
    gridLine: `${customAccent || "#60a5fa"}0f`,
    gridDot: `${customAccent || "#60a5fa"}1f`,
    scanline: `${customAccent || "#60a5fa"}04`,
    orbA: `${customAccent || "#3b82f6"}14`,
    orbB: "rgba(124,58,237,0.05)",
    orbC: "rgba(6,182,212,0.06)",
    shadow: `${customAccent || "#60a5fa"}1f`,
  };

  return (
    <div style={{ background: c.bg, color: c.text }} className="min-h-screen relative overflow-hidden">
      <style>{`
        @keyframes neon-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes neon-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes neon-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes neon-scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes neon-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes neon-grid-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        @keyframes neon-border-rotate { 0% { --angle: 0deg; } 100% { --angle: 360deg; } }
        @keyframes neon-particle-drift { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-120px) translateX(30px); opacity: 0; } }
        @keyframes neon-glow-breathe { 0%, 100% { filter: brightness(1) drop-shadow(0 0 3px ${c.accent}40); } 50% { filter: brightness(1.15) drop-shadow(0 0 8px ${c.accent}60); } }
        @keyframes neon-line-scan { 0% { left: -30%; } 100% { left: 130%; } }
        @keyframes neon-holo { 0% { background-position: 0% 0%; } 100% { background-position: 200% 200%; } }

        .neon-hero-text {
          background: linear-gradient(90deg, ${c.accent}, ${c.accentAlt}, ${c.cyan}, ${c.accent});
          background-size: 300% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: neon-gradient 6s ease infinite;
          ${isDark ? `filter: drop-shadow(0 0 20px ${c.accent}40);` : ""}
        }
        .neon-sub-text {
          background: linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.4), rgba(255,255,255,0.8), rgba(96,165,250,0.9), rgba(255,255,255,0.8), rgba(255,255,255,0.4)" : "rgba(15,23,42,0.3), rgba(15,23,42,0.7), rgba(59,130,246,0.8), rgba(15,23,42,0.7), rgba(15,23,42,0.3)"});
          background-size: 400% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: neon-shimmer 4s linear infinite;
        }
        .neon-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(${c.gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${c.gridLine} 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
        }
        .neon-grid-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle 1.5px, ${c.gridDot} 100%, transparent 100%);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          animation: neon-grid-pulse 4s ease-in-out infinite;
        }
        .neon-scanline-overlay {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
        }
        .neon-scanline-overlay::after {
          content: ''; position: absolute; left: 0; right: 0; height: 200px;
          background: linear-gradient(to bottom, transparent, ${c.scanline}, transparent);
          animation: neon-scanline 8s linear infinite;
        }
        .neon-card {
          position: relative;
          background: ${c.card};
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid ${c.border};
          border-radius: 16px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible;
        }
        .neon-card::before {
          content: ''; position: absolute; inset: -1px; border-radius: 17px; padding: 1px;
          background: linear-gradient(135deg, ${c.accent}30, ${c.accentAlt}15, ${c.cyan}30);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0.5; transition: opacity 0.5s ease; pointer-events: none;
        }
        .neon-card:hover {
          border-color: ${c.borderHover};
          box-shadow: 0 0 40px ${c.accent}12, 0 0 80px ${c.accentAlt}06, 0 12px 40px ${c.shadow};
          transform: translateY(-6px);
        }
        .neon-card:hover::before {
          opacity: 1;
          background: linear-gradient(135deg, ${c.accent}60, ${c.accentAlt}40, ${c.cyan}60);
        }
        .neon-card:hover .neon-card-line-scan {
          animation: neon-line-scan 1.5s ease-in-out;
        }
        .neon-card-line-scan {
          position: absolute; top: 0; bottom: 0; width: 30%; pointer-events: none; z-index: 2;
          left: -30%;
          background: linear-gradient(90deg, transparent, ${isDark ? "rgba(96,165,250,0.06)" : "rgba(96,165,250,0.08)"}, transparent);
        }
        .neon-price {
          ${isDark ? `text-shadow: 0 0 12px ${c.accent}60, 0 0 24px ${c.accent}25;` : ""}
          color: ${c.price};
        }
        .neon-buy-btn {
          background: linear-gradient(135deg, ${c.accent}, ${c.accentAlt}, ${c.cyan});
          background-size: 200% 200%; animation: neon-gradient 4s ease infinite;
          box-shadow: 0 0 20px ${c.accent}30, 0 0 40px ${c.accentAlt}15;
          transition: all 0.3s ease; color: #fff;
        }
        .neon-buy-btn:hover {
          box-shadow: 0 0 35px ${c.accent}50, 0 0 70px ${c.accentAlt}25;
          transform: scale(1.03);
        }
        .neon-orb { animation: neon-pulse 4s ease-in-out infinite; pointer-events: none; }
        .neon-float { animation: neon-float 6s ease-in-out infinite; }
        .neon-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, ${c.accent}30, ${c.accentAlt}30, ${c.cyan}30, transparent);
        }
        .neon-status-badge {
          background: ${isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"};
          border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"};
        }
        .neon-particle {
          position: absolute; width: 2px; height: 2px; border-radius: 50%;
          background: ${c.accent}; pointer-events: none;
          animation: neon-particle-drift 8s ease-in-out infinite;
        }
        .neon-tag-badge {
          background: ${isDark ? `${c.accent}15` : `${c.accent}10`};
          border: 1px solid ${isDark ? `${c.accent}25` : `${c.accent}18`};
          color: ${c.accent};
        }
        .neon-holo-stripe {
          position: absolute; inset: 0; pointer-events: none; border-radius: inherit; overflow: hidden;
        }
        .neon-holo-stripe::after {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(
            115deg,
            transparent, transparent 15px,
            ${isDark ? "rgba(96,165,250,0.015)" : "rgba(96,165,250,0.02)"} 15px,
            ${isDark ? "rgba(96,165,250,0.015)" : "rgba(96,165,250,0.02)"} 16px
          );
        }
        .neon-mode-btn {
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
          transition: all 0.3s ease; cursor: pointer;
        }
        .neon-mode-btn:hover {
          background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
          border-color: ${c.accent}40;
        }
        .neon-glow-icon { animation: neon-glow-breathe 3s ease-in-out infinite; }
        .neon-discount {
          background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.25));
          border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7;
        }
        .neon-savings-glow {
          background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.15));
          border: 1px solid rgba(16,185,129,0.2);
        }
      `}</style>

      <div className="neon-grid-bg" />
      <div className="neon-grid-dots" />
      <div className="neon-scanline-overlay" />

      <div className="neon-orb absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbA} 0%, ${c.orbB} 40%, transparent 70%)` }} />
      <div className="neon-orb absolute top-[400px] right-[-200px] w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbC} 0%, transparent 60%)`, animationDelay: "2s" }} />
      <div className="neon-orb absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbB} 0%, transparent 60%)`, animationDelay: "3s" }} />

      {isDark && [0,1,2,3,4,5].map(i => (
        <div key={i} className="neon-particle" style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${6 + i * 1.5}s` }} />
      ))}

      <header className="relative z-10 px-6 py-5">
        <div className="neon-separator absolute bottom-0 left-0 right-0" />
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" loading="lazy" style={{ boxShadow: `0 0 12px ${c.accent}30` }} data-testid="img-neon-logo" />
            ) : (
              <div className="neon-glow-icon relative flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${c.accent}20, ${c.accentAlt}20)`, border: `1px solid ${c.accent}25` }}>
                <Zap className="h-4 w-4" style={{ color: c.accent }} />
              </div>
            )}
            <span className="text-lg font-bold tracking-tight" style={{ color: isDark ? "rgba(255,255,255,0.9)" : c.text }} data-testid="text-neon-store-name">
              {store.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="neon-status-badge flex items-center gap-2 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">Live</span>
            </div>
            <a
              href={`/s/${store.slug}/portal`}
              className="neon-mode-btn flex items-center justify-center w-9 h-9 rounded-lg"
              data-testid="link-neon-portal"
              aria-label="My Purchases"
              title="My Purchases"
            >
              <User className="h-4 w-4" style={{ color: c.textSecondary }} />
            </a>
            <button
              onClick={() => setMode(m => m === "dark" ? "light" : "dark")}
              className="neon-mode-btn flex items-center justify-center w-9 h-9 rounded-lg"
              data-testid="button-neon-theme-toggle"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" style={{ color: c.textSecondary }} /> : <Moon className="h-4 w-4" style={{ color: c.textSecondary }} />}
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        {store.heroBannerUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-b-2xl" style={{ margin: "0 24px" }}>
            <img src={store.heroBannerUrl} alt="" className="w-full h-full object-cover" loading="lazy" style={{ opacity: isDark ? 0.25 : 0.18 }} data-testid="img-neon-hero-banner" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.bg}99 0%, ${c.bg}bb 50%, ${c.bg} 100%)` }} />
          </div>
        )}
        <div className="relative z-10">
          <div className="neon-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: `${c.accent}0a`, border: `1px solid ${c.accent}18` }}>
            <Sparkles className="h-3.5 w-3.5" style={{ color: c.cyan }} />
            <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${c.accent}cc` }}>Premium Digital Products</span>
          </div>

          <h1 className="neon-hero-text text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-tight">
            {store.name}
          </h1>

          <p className="neon-sub-text text-lg md:text-xl max-w-lg mx-auto font-light leading-relaxed" data-testid="text-neon-tagline">
            {store.tagline || "Curated digital assets crafted for creators who demand excellence."}
          </p>

          <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
            {["Instant Delivery", "Secure Checkout", "Premium Quality"].map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-sm" style={{ color: c.textTertiary }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: [c.cyan, c.accentAlt, c.accent][i], boxShadow: isDark ? `0 0 6px ${[c.cyan, c.accentAlt, c.accent][i]}60` : "none" }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {checkoutError && (
          <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between gap-3" role="alert" aria-live="polite" style={{ background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", color: isDark ? "#fca5a5" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}` }} data-testid="text-checkout-error">
            <span>{checkoutError}</span>
            <Button size="icon" variant="ghost" onClick={() => setCheckoutError(null)} aria-label="Dismiss error" data-testid="button-dismiss-checkout-error" className="shrink-0" style={{ color: isDark ? "#fca5a5" : "#dc2626" }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {products.length === 0 ? (
          <div className="text-center py-20" data-testid="neon-empty-products">
            <div className="neon-float inline-flex items-center justify-center h-24 w-24 rounded-2xl mx-auto mb-8" style={{ background: `${c.accent}12`, border: `1px solid ${c.accent}25` }}>
              <Package className="h-10 w-10" style={{ color: c.accent }} />
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: isDark ? "rgba(255,255,255,0.85)" : c.text }}>Coming Soon</h2>
            <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)" }}>
              This store is being set up. Products will appear here once they are published. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;
              const discountPct = hasDiscount ? Math.round(((product.originalPriceCents! - product.priceCents) / product.originalPriceCents!) * 100) : 0;

              return (
                <div key={product.id} className="neon-card group">
                  <div className="neon-holo-stripe" />
                  <div className="neon-card-line-scan" />
                  {product.thumbnailUrl && (
                    <a href={"/s/" + store.slug + "/product/" + product.id} className="block relative overflow-hidden" style={{ borderRadius: "16px 16px 0 0" }}>
                      <div className="aspect-square overflow-hidden">
                        <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                      </div>
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${c.bg} 0%, ${c.bg}66 40%, transparent 100%)` }} />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {hasDiscount && (
                          <div className="neon-discount px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                            -{discountPct}%
                          </div>
                        )}
                        <div className="neon-price px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md" style={{ background: `${c.bg}b3`, border: `1px solid ${c.cyan}25` }}>
                          {product.isLeadMagnet ? "Free" : `$${(product.priceCents / 100).toFixed(2)}`}
                        </div>
                      </div>
                    </a>
                  )}
                  <div className="p-6 relative z-10">
                    {!product.thumbnailUrl && (
                      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                        <span className="neon-price text-2xl font-bold">
                          {product.isLeadMagnet ? "Free" : `$${(product.priceCents / 100).toFixed(2)}`}
                        </span>
                        {!product.isLeadMagnet && hasDiscount && (
                          <span className="text-sm line-through" style={{ color: c.textTertiary }}>${(product.originalPriceCents! / 100).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    {product.category && (
                      <div className="neon-tag-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-3 text-[10px] font-medium tracking-wider uppercase">
                        {product.category}
                      </div>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {product.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: c.textSecondary }} data-testid={`badge-neon-tag-${product.id}-${i}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <a href={"/s/" + store.slug + "/product/" + product.id} className="block">
                      <h3 className="font-semibold text-lg mb-2 tracking-tight transition-colors duration-300" style={{ color: isDark ? "rgba(255,255,255,0.95)" : c.text }} data-testid={`text-neon-product-${product.id}`}>
                        {product.title}
                      </h3>
                    </a>
                    <p className="text-sm line-clamp-2 mb-6 leading-relaxed" style={{ color: c.textSecondary }}>{product.description}</p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {product.thumbnailUrl ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {product.isLeadMagnet ? (
                            <span className="neon-price text-xl font-bold">Free</span>
                          ) : (
                            <>
                              <span className="neon-price text-xl font-bold">${(product.priceCents / 100).toFixed(2)}</span>
                              {hasDiscount && (
                                <span className="text-sm line-through" style={{ color: c.textTertiary }}>${(product.originalPriceCents! / 100).toFixed(2)}</span>
                              )}
                            </>
                          )}
                        </div>
                      ) : <span />}
                      {product.isLeadMagnet ? (
                        <Button className="neon-buy-btn font-medium border-0 no-default-hover-elevate no-default-active-elevate" onClick={() => setLeadModalProduct(product)} data-testid={`button-neon-lead-${product.id}`}>
                          <Gift className="mr-2 h-4 w-4" />
                          Get it Free
                        </Button>
                      ) : (
                        <Button className="neon-buy-btn font-medium border-0 no-default-hover-elevate no-default-active-elevate" onClick={() => handleBuy(product)} data-testid={`button-neon-buy-${product.id}`}>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Buy Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {bundles.length > 0 && (
          <>
            <div className="neon-separator my-16" />
            <div className="text-center mb-12">
              <div className="neon-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: `${c.accentAlt}0a`, border: `1px solid ${c.accentAlt}18` }}>
                <Package className="h-3.5 w-3.5" style={{ color: c.accentAlt }} />
                <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${c.accentAlt}cc` }}>Save More</span>
              </div>
              <h2 className="neon-hero-text text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Bundles</h2>
              <p className="text-sm" style={{ color: c.textTertiary }}>Get more for less with curated product bundles</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle) => {
                const totalValue = bundle.products.reduce((sum, p) => sum + p.priceCents, 0);
                const savePct = totalValue > bundle.priceCents ? Math.round(((totalValue - bundle.priceCents) / totalValue) * 100) : 0;
                return (
                  <div key={bundle.id} className="neon-card group" data-testid={`card-bundle-${bundle.id}`}>
                    <div className="neon-holo-stripe" />
                    <div className="neon-card-line-scan" />
                    <div className="p-6 relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${c.accentAlt}18`, border: `1px solid ${c.accentAlt}25` }}>
                          <Package className="h-4 w-4" style={{ color: c.accentAlt }} />
                        </div>
                        <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${c.accentAlt}cc` }}>{bundle.products.length} products</span>
                        {savePct > 0 && (
                          <div className="neon-savings-glow ml-auto px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400">
                            Save {savePct}%
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2 tracking-tight" style={{ color: isDark ? "rgba(255,255,255,0.95)" : c.text }}>
                        {bundle.name}
                      </h3>
                      {bundle.description && (
                        <p className="text-sm line-clamp-2 mb-6 leading-relaxed" style={{ color: c.textSecondary }}>{bundle.description}</p>
                      )}
                      <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <span className="neon-price text-xl font-bold">${(bundle.priceCents / 100).toFixed(2)}</span>
                        {totalValue > bundle.priceCents && (
                          <span className="text-sm line-through" style={{ color: c.textTertiary }}>${(totalValue / 100).toFixed(2)}</span>
                        )}
                      </div>
                      <a href={`/s/${store.slug}/bundle/${bundle.id}`} data-testid={`link-bundle-${bundle.id}`}>
                        <Button className="neon-buy-btn font-medium border-0 no-default-hover-elevate no-default-active-elevate w-full">
                          <Package className="mr-2 h-4 w-4" />
                          View Bundle
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 pb-8 pt-4">
        <div className="neon-separator mb-8" />
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-center gap-3">
          <Zap className="h-3 w-3" style={{ color: c.textTertiary }} />
          <span className="text-sm tracking-wide" style={{ color: c.textTertiary }}>Powered by DigitalVault</span>
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
            text: isDark ? "rgba(255,255,255,0.95)" : c.text,
            textSecondary: c.textSecondary,
            accent: c.accent,
            border: c.border,
          }}
        />
      )}
    </div>
  );
}
