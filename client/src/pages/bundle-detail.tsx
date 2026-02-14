import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Package, Sparkles, Tag, Zap, Sun, Moon, Ticket } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import type { Store, Product, Bundle } from "@shared/schema";

type BundleDetailData = {
  store: Store;
  bundle: Bundle;
  products: Product[];
};

type BDPMode = "dark" | "light";

export default function BundleDetailPage() {
  const params = useParams<{ slug: string; bundleId: string }>();
  const slug = params.slug;
  const bundleId = params.bundleId;

  const [mode, setMode] = useState<BDPMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("neon-mode") as BDPMode) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("neon-mode", mode);
  }, [mode]);

  const isDark = mode === "dark";

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [buying, setBuying] = useState(false);

  const { data, isLoading, error } = useQuery<BundleDetailData>({
    queryKey: ["/api/storefront", slug, "bundle", bundleId],
  });

  usePageMeta({
    title: data?.bundle ? `${data.bundle.name} - ${data.store.name} | DigitalVault` : undefined,
    description: data?.bundle ? `${data.bundle.name} bundle from ${data.store.name} — ${data.products?.length || 0} products` : undefined,
    ogImage: data?.bundle?.thumbnailUrl || undefined,
    ogType: "product",
  });

  const handleBuy = async () => {
    if (!data) return;
    setBuying(true);
    setCouponError("");
    try {
      const body: any = { storeId: data.store.id, bundleId: data.bundle.id };
      if (couponCode.trim()) body.couponCode = couponCode.trim();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        setCouponError(result.message || "Something went wrong");
        setBuying(false);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setCouponError("Checkout is not available right now.");
      setBuying(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const c = isDark ? {
    bg: "#030308",
    text: "#ffffff",
    textSec: "rgba(255,255,255,0.5)",
    textTer: "rgba(255,255,255,0.25)",
    accent: "#60a5fa",
    accentAlt: "#a78bfa",
    cyan: "#06b6d4",
    price: "#67e8f9",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(96,165,250,0.1)",
    cardBorderHover: "rgba(96,165,250,0.35)",
    gridLine: "rgba(96,165,250,0.04)",
    gridDot: "rgba(96,165,250,0.15)",
    sepGrad: "transparent, rgba(96,165,250,0.3), rgba(167,139,250,0.3), rgba(6,182,212,0.3), transparent",
    orbA: "rgba(59,130,246,0.10)",
    orbB: "rgba(124,58,237,0.06)",
    orbC: "rgba(6,182,212,0.07)",
    shadow: "rgba(0,0,0,0.5)",
  } : {
    bg: "#f0f4ff",
    text: "#0f172a",
    textSec: "rgba(15,23,42,0.55)",
    textTer: "rgba(15,23,42,0.3)",
    accent: "#3b82f6",
    accentAlt: "#7c3aed",
    cyan: "#0891b2",
    price: "#0e7490",
    cardBg: "rgba(255,255,255,0.8)",
    cardBorder: "rgba(96,165,250,0.18)",
    cardBorderHover: "rgba(96,165,250,0.4)",
    gridLine: "rgba(96,165,250,0.06)",
    gridDot: "rgba(96,165,250,0.12)",
    sepGrad: "transparent, rgba(96,165,250,0.2), rgba(167,139,250,0.2), rgba(6,182,212,0.2), transparent",
    orbA: "rgba(59,130,246,0.08)",
    orbB: "rgba(124,58,237,0.05)",
    orbC: "rgba(6,182,212,0.06)",
    shadow: "rgba(96,165,250,0.12)",
  };

  if (isLoading) {
    return (
      <div style={{ background: c.bg }} className="min-h-screen flex items-center justify-center">
        <div className="space-y-6 w-full max-w-3xl px-6">
          <Skeleton className="h-6 w-32" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
          <Skeleton className="h-80 w-full rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
          <Skeleton className="h-10 w-3/4" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-60 rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
            ))}
          </div>
          <Skeleton className="h-14 w-full rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: c.bg, color: c.text }} className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold mb-3">Bundle Not Found</h1>
          <p style={{ color: c.textSec }} className="mb-6">This bundle doesn't exist or has been removed.</p>
          <a href="/" style={{ color: c.accent }} className="hover:underline text-sm" data-testid="link-go-home">Go back home</a>
        </div>
      </div>
    );
  }

  const { store, bundle, products } = data;
  const totalValue = products.reduce((sum, p) => sum + p.priceCents, 0);
  const bundlePrice = bundle.priceCents;
  const savings = totalValue - bundlePrice;
  const savingsPercent = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

  return (
    <div style={{ background: c.bg, color: c.text }} className="min-h-screen relative overflow-hidden">
      <style>{`
        @keyframes bdp-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes bdp-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes bdp-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes bdp-glow-pulse { 0%, 100% { box-shadow: 0 0 20px ${c.accent}30, 0 0 40px ${c.accentAlt}15; } 50% { box-shadow: 0 0 30px ${c.accent}50, 0 0 60px ${c.accentAlt}25; } }
        @keyframes bdp-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bdp-scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes bdp-line-scan { 0% { left: -30%; } 100% { left: 130%; } }

        .bdp-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(${c.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${c.gridLine} 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
        }
        .bdp-grid-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle 1.5px, ${c.gridDot} 100%, transparent 100%);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
        }
        .bdp-scanline-overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .bdp-scanline-overlay::after {
          content: ''; position: absolute; left: 0; right: 0; height: 200px;
          background: linear-gradient(to bottom, transparent, ${isDark ? "rgba(96,165,250,0.02)" : "rgba(96,165,250,0.015)"}, transparent);
          animation: bdp-scanline 8s linear infinite;
        }

        .bdp-orb { animation: bdp-pulse 4s ease-in-out infinite; pointer-events: none; }
        .bdp-title-gradient {
          background: linear-gradient(90deg, ${c.accent}, ${c.accentAlt}, ${c.cyan}, ${c.accent});
          background-size: 300% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: bdp-gradient 6s ease infinite;
          ${isDark ? `filter: drop-shadow(0 0 15px ${c.accent}30);` : ""}
        }
        .bdp-price-glow {
          color: ${c.price};
          ${isDark ? `text-shadow: 0 0 12px ${c.accent}60, 0 0 24px ${c.accent}25;` : ""}
        }
        .bdp-buy-btn {
          background: linear-gradient(135deg, ${c.accent}, ${c.accentAlt}, ${c.cyan});
          background-size: 200% 200%; animation: bdp-gradient 4s ease infinite, bdp-glow-pulse 3s ease-in-out infinite;
          transition: all 0.3s ease; color: #fff;
        }
        .bdp-buy-btn:hover {
          box-shadow: 0 0 40px ${c.accent}60, 0 0 80px ${c.accentAlt}30;
          transform: scale(1.02);
        }
        .bdp-separator { height: 1px; background: linear-gradient(90deg, ${c.sepGrad}); }
        .bdp-card {
          background: ${c.cardBg}; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid ${c.cardBorder}; border-radius: 20px;
        }
        .bdp-product-card {
          position: relative;
          background: ${c.cardBg}; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${c.cardBorder}; border-radius: 16px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible;
        }
        .bdp-product-card::before {
          content: ''; position: absolute; inset: -1px; border-radius: 17px; padding: 1px;
          background: linear-gradient(135deg, ${c.accent}20, ${c.accentAlt}10, ${c.cyan}20);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0.5; transition: opacity 0.5s ease; pointer-events: none;
        }
        .bdp-product-card:hover {
          border-color: ${c.cardBorderHover};
          box-shadow: 0 0 40px ${c.accent}12, 0 12px 40px ${c.shadow};
          transform: translateY(-6px);
        }
        .bdp-product-card:hover::before {
          opacity: 1;
          background: linear-gradient(135deg, ${c.accent}50, ${c.accentAlt}30, ${c.cyan}50);
        }
        .bdp-product-card:hover .bdp-card-line-scan { animation: bdp-line-scan 1.5s ease-in-out; }
        .bdp-card-line-scan {
          position: absolute; top: 0; bottom: 0; width: 30%; pointer-events: none; z-index: 2;
          left: -30%;
          background: linear-gradient(90deg, transparent, ${isDark ? "rgba(96,165,250,0.06)" : "rgba(96,165,250,0.08)"}, transparent);
        }
        .bdp-fade-in { animation: bdp-fade-in 0.6s ease-out forwards; }
        .bdp-fade-in-d1 { animation-delay: 0.1s; opacity: 0; }
        .bdp-fade-in-d2 { animation-delay: 0.2s; opacity: 0; }
        .bdp-fade-in-d3 { animation-delay: 0.3s; opacity: 0; }
        .bdp-fade-in-d4 { animation-delay: 0.4s; opacity: 0; }
        .bdp-image-container { position: relative; border-radius: 20px; overflow: hidden; }
        .bdp-image-container::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, ${c.bg} 0%, ${c.bg}99 50%, transparent 100%);
          pointer-events: none;
        }
        .bdp-bundle-badge { background: linear-gradient(135deg, ${c.accentAlt}20, ${c.accent}20); border: 1px solid ${c.accentAlt}30; }
        .bdp-savings-badge { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.25)); border: 1px solid rgba(16,185,129,0.3); color: ${isDark ? "#6ee7b7" : "#059669"}; }
        .bdp-category-badge { background: ${c.accent}15; border: 1px solid ${c.accent}25; }
        .bdp-mode-btn {
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
          transition: all 0.3s ease; cursor: pointer;
        }
        .bdp-mode-btn:hover { background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}; border-color: ${c.accent}40; }
        .bdp-holo-stripe { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; overflow: hidden; }
        .bdp-holo-stripe::after {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(115deg, transparent, transparent 15px, ${isDark ? "rgba(96,165,250,0.015)" : "rgba(96,165,250,0.02)"} 15px, ${isDark ? "rgba(96,165,250,0.015)" : "rgba(96,165,250,0.02)"} 16px);
        }
      `}</style>

      <div className="bdp-grid-bg" />
      <div className="bdp-grid-dots" />
      <div className="bdp-scanline-overlay" />

      <div className="bdp-orb absolute top-[-300px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbA} 0%, ${c.orbB} 40%, transparent 70%)` }} />
      <div className="bdp-orb absolute top-[500px] right-[-250px] w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbC} 0%, transparent 60%)`, animationDelay: "2s" }} />
      <div className="bdp-orb absolute bottom-[-150px] left-[-200px] w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbB} 0%, transparent 60%)`, animationDelay: "3s" }} />

      <header className="relative z-10 px-6 py-5">
        <div className="bdp-separator absolute bottom-0 left-0 right-0" />
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <a href={`/s/${slug}`} className="flex items-center gap-2 transition-colors" style={{ color: c.textSec }} data-testid="link-back-store">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{store.name}</span>
          </a>
          <button onClick={() => setMode(m => m === "dark" ? "light" : "dark")} className="bdp-mode-btn flex items-center justify-center w-9 h-9 rounded-lg" data-testid="button-bdp-theme-toggle" aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" style={{ color: c.textSec }} /> : <Moon className="h-4 w-4" style={{ color: c.textSec }} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pt-8 pb-20">
        {bundle.thumbnailUrl && (
          <div className="bdp-image-container mb-8 bdp-fade-in">
            <div className="aspect-[16/9] w-full">
              <img src={bundle.thumbnailUrl} alt={bundle.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="bdp-fade-in bdp-fade-in-d1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="bdp-bundle-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full" data-testid="badge-bundle">
                <Package className="h-3 w-3" style={{ color: c.accentAlt }} />
                <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${c.accentAlt}cc` }}>Bundle</span>
              </div>
              {savings > 0 && (
                <div className="bdp-savings-badge px-3 py-1.5 rounded-full text-xs font-bold">Save {savingsPercent}%</div>
              )}
            </div>

            <h1 className="bdp-title-gradient text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3" data-testid="text-bundle-name">
              {bundle.name}
            </h1>

            <a href={`/s/${slug}`} className="inline-flex items-center gap-2 transition-colors text-sm" style={{ color: c.textTer }} data-testid="link-store-name">
              <Sparkles className="h-3 w-3" />
              <span>by {store.name}</span>
            </a>
          </div>

          <div className="bdp-separator" />

          {bundle.description && (
            <div className="bdp-fade-in bdp-fade-in-d2">
              <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap" style={{ color: c.textSec, lineHeight: "1.8" }} data-testid="text-bundle-description">
                {bundle.description}
              </p>
            </div>
          )}

          {bundle.description && <div className="bdp-separator" />}

          {products.length > 0 && (
            <div className="bdp-fade-in bdp-fade-in-d3">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-5 w-5" style={{ color: c.accent }} />
                <h2 className="text-xl font-bold" style={{ color: isDark ? "rgba(255,255,255,0.9)" : c.text }}>
                  Included Products
                  <span className="ml-2 text-sm font-normal" style={{ color: c.textSec }}>({products.length} items)</span>
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <a key={product.id} href={`/s/${slug}/product/${product.id}`} className="bdp-product-card group block" data-testid={`card-bundle-product-${product.id}`}>
                    <div className="bdp-holo-stripe" />
                    <div className="bdp-card-line-scan" />
                    {product.thumbnailUrl && (
                      <div className="relative overflow-hidden" style={{ borderRadius: "16px 16px 0 0" }}>
                        <div className="aspect-[16/10] overflow-hidden">
                          <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                        </div>
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${c.bg} 0%, ${c.bg}66 40%, transparent 100%)` }} />
                      </div>
                    )}
                    <div className="p-5 relative z-10">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <div className="bdp-category-badge flex items-center gap-1 px-2 py-1 rounded-full">
                          <Tag className="h-2.5 w-2.5" style={{ color: c.accent }} />
                          <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: `${c.accent}cc` }}>{product.category}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 tracking-tight line-clamp-2" style={{ color: isDark ? "rgba(255,255,255,0.95)" : c.text }}>
                        {product.title}
                      </h3>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {product.originalPriceCents != null && product.originalPriceCents > product.priceCents && (
                          <span className="text-xs line-through" style={{ color: c.textTer }}>{formatPrice(product.originalPriceCents)}</span>
                        )}
                        <span className="text-sm font-bold" style={{ color: c.price, textShadow: isDark ? `0 0 8px ${c.accent}30` : "none" }}>
                          {formatPrice(product.priceCents)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bdp-separator" />

          <div className="bdp-fade-in bdp-fade-in-d4">
            <div className="bdp-card p-6 sm:p-8">
              <div className="space-y-4 mb-6">
                {totalValue > bundlePrice && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm" style={{ color: c.textSec }}>Total value:</span>
                    <span className="text-lg line-through" style={{ color: c.textTer }} data-testid="text-total-value">{formatPrice(totalValue)}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-sm" style={{ color: c.textSec }}>Bundle price:</span>
                  <span className="bdp-price-glow text-4xl sm:text-5xl font-extrabold" data-testid="text-bundle-price">{formatPrice(bundlePrice)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bdp-savings-badge text-sm font-bold px-3 py-1.5 rounded-full" data-testid="text-savings">
                      You save: {formatPrice(savings)} ({savingsPercent}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="relative flex-1 max-w-[200px]">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: c.textTer }} />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border-0 outline-none"
                    style={{
                      background: c.cardBg,
                      color: c.text,
                      border: `1px solid ${c.cardBorder}`,
                    }}
                    data-testid="input-coupon-code"
                  />
                </div>
              </div>
              {couponError && (
                <p className="mt-2 text-sm" style={{ color: "#ef4444" }} data-testid="text-coupon-error">{couponError}</p>
              )}

              <div className="mt-4">
                <Button className="bdp-buy-btn w-full sm:w-auto font-semibold text-base border-0 no-default-hover-elevate no-default-active-elevate px-10 py-6 rounded-xl" size="lg" onClick={handleBuy} disabled={buying} data-testid="button-buy-bundle">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {buying ? "Processing..." : "Buy Bundle"}
                </Button>
              </div>

              <div className="mt-5 flex items-center gap-6 flex-wrap">
                {["Instant Delivery", "Secure Checkout", "Lifetime Access"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2 text-xs" style={{ color: c.textTer }}>
                    <div className="w-1 h-1 rounded-full" style={{ background: [c.cyan, c.accentAlt, c.accent][i] }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-8 pt-4">
        <div className="bdp-separator mb-8" />
        <div className="mx-auto max-w-4xl px-6 flex items-center justify-center gap-3">
          <Zap className="h-3 w-3" style={{ color: c.textTer }} />
          <span className="text-sm tracking-wide" style={{ color: c.textTer }}>Powered by DigitalVault</span>
        </div>
      </footer>
    </div>
  );
}
