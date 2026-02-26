import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Tag, Sparkles, Zap, Sun, Moon, ChevronLeft, ChevronRight, Ticket, Key, Check, ExternalLink, Shield, Clock, Download, Star } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ProtectedImage } from "@/components/protected-image";
import { trackEvent } from "@/lib/tracking";
import type { Store, Product, ProductImage } from "@shared/schema";

type ProductDetailData = {
  store: Store;
  product: Product;
  images?: ProductImage[];
};

type PDPMode = "dark" | "light";

function parseSections(desc: string): { intro: string; features: string[]; highlights: string[]; perfectFor: string[]; pricing: string } {
  const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean);
  let currentSection = "intro";
  const result: { intro: string; features: string[]; highlights: string[]; perfectFor: string[]; pricing: string } = {
    intro: "", features: [], highlights: [], perfectFor: [], pricing: "",
  };
  const introLines: string[] = [];

  const headingPatterns: [RegExp, string][] = [
    [/^#{0,3}\s*(WHAT YOU GET|WHAT'S INCLUDED|FEATURES|INCLUDED|KEY FEATURES)/i, "features"],
    [/^#{0,3}\s*(WHY |HIGHLIGHTS|BENEFITS|ADVANTAGES)/i, "highlights"],
    [/^#{0,3}\s*(PERFECT FOR|IDEAL FOR|WHO IS THIS FOR|GREAT FOR|BEST FOR)/i, "perfectFor"],
    [/^#{0,3}\s*(REGULAR PRICING|PRICING|DEAL DETAILS|PRICE COMPARISON)/i, "pricing"],
  ];

  for (const line of lines) {
    let matched = false;
    for (const [pattern, section] of headingPatterns) {
      if (pattern.test(line)) {
        currentSection = section;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const cleaned = line.replace(/^[\u2022\-\*]\s*/, "").replace(/^#+\s*/, "").trim();
    if (!cleaned) continue;

    if (currentSection === "intro") introLines.push(cleaned);
    else if (currentSection === "features") result.features.push(cleaned);
    else if (currentSection === "highlights") result.highlights.push(cleaned);
    else if (currentSection === "perfectFor") result.perfectFor.push(cleaned);
    else if (currentSection === "pricing") result.pricing += (result.pricing ? " " : "") + cleaned;
  }
  result.intro = introLines.join(" ");
  return result;
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const slug = params.slug;
  const productId = params.productId;

  const [mode, setMode] = useState<PDPMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("neon-mode") as PDPMode) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("neon-mode", mode);
  }, [mode]);

  const isDark = mode === "dark";

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [buying, setBuying] = useState(false);

  const { data, isLoading, error } = useQuery<ProductDetailData>({
    queryKey: ["/api/storefront", slug, "product", productId],
  });

  useEffect(() => {
    if (data?.store?.id && data?.product?.id) {
      trackEvent(data.store.id, "product_view", { productId: data.product.id });
    }
  }, [data?.store?.id, data?.product?.id]);

  usePageMeta({
    title: data?.product ? `${data.product.title} - ${data.store.name}` : undefined,
    description: data?.product ? (data.product.description || `Get ${data.product.title} from ${data.store.name}`) : undefined,
    ogImage: data?.product?.thumbnailUrl || undefined,
    ogType: "product",
    favicon: data?.store?.faviconUrl || data?.store?.logoUrl || undefined,
  });

  const handleBuy = async () => {
    if (!data) return;
    trackEvent(data.store.id, "checkout_start", { productId: data.product.id });
    setBuying(true);
    setCouponError("");
    try {
      const body: any = { storeId: data.store.id, productId: data.product.id };
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
  const getDiscountPercent = (original: number, current: number) => Math.round(((original - current) / original) * 100);

  const customAccent = data?.store?.accentColor || null;

  const c = isDark ? {
    bg: "#030308",
    text: "#ffffff",
    textSec: "rgba(255,255,255,0.5)",
    textTer: "rgba(255,255,255,0.25)",
    accent: customAccent || "#60a5fa",
    accentAlt: "#a78bfa",
    cyan: "#06b6d4",
    price: "#67e8f9",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: `${customAccent || "#60a5fa"}1a`,
    gridLine: `${customAccent || "#60a5fa"}0a`,
    gridDot: `${customAccent || "#60a5fa"}26`,
    sepGrad: `transparent, ${customAccent || "#60a5fa"}4d, #a78bfa4d, #06b6d44d, transparent`,
    orbA: `${customAccent || "#3b82f6"}1a`,
    orbB: "rgba(124,58,237,0.06)",
    orbC: "rgba(6,182,212,0.07)",
  } : {
    bg: "#f0f4ff",
    text: "#0f172a",
    textSec: "rgba(15,23,42,0.55)",
    textTer: "rgba(15,23,42,0.3)",
    accent: customAccent || "#3b82f6",
    accentAlt: "#7c3aed",
    cyan: "#0891b2",
    price: "#0e7490",
    cardBg: "rgba(255,255,255,0.8)",
    cardBorder: `${customAccent || "#60a5fa"}2e`,
    gridLine: `${customAccent || "#60a5fa"}0f`,
    gridDot: `${customAccent || "#60a5fa"}1f`,
    sepGrad: `transparent, ${customAccent || "#60a5fa"}33, #7c3aed33, #0891b233, transparent`,
    orbA: `${customAccent || "#3b82f6"}14`,
    orbB: "rgba(124,58,237,0.05)",
    orbC: "rgba(6,182,212,0.06)",
  };

  if (isLoading) {
    return (
      <div style={{ background: c.bg }} className="min-h-screen flex items-center justify-center">
        <div className="space-y-6 w-full max-w-2xl px-6">
          <Skeleton className="h-6 w-32" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
          <Skeleton className="h-80 w-full rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
          <Skeleton className="h-10 w-3/4" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
          <Skeleton className="h-14 w-full rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: c.bg, color: c.text }} className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold mb-3">Product Not Found</h1>
          <p style={{ color: c.textSec }} className="mb-6">This product doesn't exist or has been removed.</p>
          <a href="/" style={{ color: c.accent }} className="hover:underline text-sm" data-testid="link-go-home">Go back home</a>
        </div>
      </div>
    );
  }

  const { store, product } = data;
  const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;

  return (
    <div style={{ background: c.bg, color: c.text }} className="min-h-screen relative overflow-x-hidden">
      <style>{`
        @keyframes pdp-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes pdp-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes pdp-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pdp-glow-pulse { 0%, 100% { box-shadow: 0 0 20px ${c.accent}30, 0 0 40px ${c.accentAlt}15; } 50% { box-shadow: 0 0 30px ${c.accent}50, 0 0 60px ${c.accentAlt}25; } }
        @keyframes pdp-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pdp-scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }

        .pdp-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(${c.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${c.gridLine} 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
        }
        .pdp-grid-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle 1.5px, ${c.gridDot} 100%, transparent 100%);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
        }
        .pdp-scanline-overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .pdp-scanline-overlay::after {
          content: ''; position: absolute; left: 0; right: 0; height: 200px;
          background: linear-gradient(to bottom, transparent, ${isDark ? "rgba(96,165,250,0.02)" : "rgba(96,165,250,0.015)"}, transparent);
          animation: pdp-scanline 8s linear infinite;
        }

        .pdp-orb { animation: pdp-pulse 4s ease-in-out infinite; pointer-events: none; }
        .pdp-title-gradient {
          background: linear-gradient(90deg, ${c.accent}, ${c.accentAlt}, ${c.cyan}, ${c.accent});
          background-size: 300% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: pdp-gradient 6s ease infinite;
          ${isDark ? `filter: drop-shadow(0 0 15px ${c.accent}30);` : ""}
        }
        .pdp-price-glow {
          color: ${c.price};
          ${isDark ? `text-shadow: 0 0 12px ${c.accent}60, 0 0 24px ${c.accent}25;` : ""}
        }
        .pdp-buy-btn {
          background: linear-gradient(135deg, ${c.accent}, ${c.accentAlt}, ${c.cyan});
          background-size: 200% 200%; animation: pdp-gradient 4s ease infinite, pdp-glow-pulse 3s ease-in-out infinite;
          transition: all 0.3s ease; color: #fff;
        }
        .pdp-buy-btn:hover {
          box-shadow: 0 0 40px ${c.accent}60, 0 0 80px ${c.accentAlt}30;
          transform: scale(1.02);
        }
        .pdp-separator { height: 1px; background: linear-gradient(90deg, ${c.sepGrad}); }
        .pdp-card {
          background: ${c.cardBg}; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid ${c.cardBorder}; border-radius: 20px;
        }
        .pdp-fade-in { animation: pdp-fade-in 0.6s ease-out forwards; }
        .pdp-fade-in-d1 { animation-delay: 0.1s; opacity: 0; }
        .pdp-fade-in-d2 { animation-delay: 0.2s; opacity: 0; }
        .pdp-fade-in-d3 { animation-delay: 0.3s; opacity: 0; }
        .pdp-image-container { position: relative; border-radius: 20px; overflow: hidden; }
        .pdp-image-container::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, ${c.bg} 0%, ${c.bg}99 50%, transparent 100%);
          pointer-events: none;
        }
        .pdp-discount { background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3))" : "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))"}; border: 1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"}; color: ${isDark ? "#6ee7b7" : "#059669"}; }
        .pdp-category-badge { background: ${c.accent}15; border: 1px solid ${c.accent}25; }
        .pdp-mode-btn {
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
          transition: all 0.3s ease; cursor: pointer;
        }
        .pdp-mode-btn:hover { background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}; border-color: ${c.accent}40; }
      `}</style>

      <div className="pdp-grid-bg" />
      <div className="pdp-grid-dots" />
      <div className="pdp-scanline-overlay" />

      <div className="pdp-orb absolute top-[-300px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbA} 0%, ${c.orbB} 40%, transparent 70%)` }} />
      <div className="pdp-orb absolute top-[500px] right-[-250px] w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbC} 0%, transparent 60%)`, animationDelay: "2s" }} />
      <div className="pdp-orb absolute bottom-[-150px] left-[-200px] w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${c.orbB} 0%, transparent 60%)`, animationDelay: "3s" }} />

      <header className="relative z-10 px-6 py-5">
        <div className="pdp-separator absolute bottom-0 left-0 right-0" />
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <a href={`/s/${slug}`} className="flex items-center gap-2 transition-colors" style={{ color: c.textSec }} data-testid="link-back-store">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{store.name}</span>
          </a>
          <button onClick={() => setMode(m => m === "dark" ? "light" : "dark")} className="pdp-mode-btn flex items-center justify-center w-9 h-9 rounded-lg" data-testid="button-pdp-theme-toggle" aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" style={{ color: c.textSec }} /> : <Moon className="h-4 w-4" style={{ color: c.textSec }} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-8 pb-20">
        {(() => {
          const allImages = data.images && data.images.length > 0
            ? data.images.map((img) => img.url)
            : product.thumbnailUrl ? [product.thumbnailUrl] : [];
          if (allImages.length === 0) return null;
          const currentImage = allImages[activeImageIndex] || allImages[0];
          return (
            <div className="mb-8 pdp-fade-in">
              <div className="pdp-image-container relative">
                <div className="aspect-[4/3] w-full">
                  <ProtectedImage protected={!store.allowImageDownload} src={currentImage} alt={product.title} className="w-full h-full object-cover" loading="lazy" data-testid="img-product-main" />
                </div>
                {hasDiscount && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="pdp-discount px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-md" data-testid="badge-discount">
                      -{getDiscountPercent(product.originalPriceCents!, product.priceCents)}%
                    </div>
                  </div>
                )}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                      style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
                      data-testid="button-prev-image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % allImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                      style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
                      data-testid="button-next-image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{ background: idx === activeImageIndex ? c.accent : "rgba(255,255,255,0.4)" }}
                          data-testid={`button-image-dot-${idx}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1" data-testid="image-thumbnails">
                  {allImages.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className="shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all"
                      style={{
                        border: idx === activeImageIndex ? `2px solid ${c.accent}` : "2px solid transparent",
                        opacity: idx === activeImageIndex ? 1 : 0.6,
                      }}
                      data-testid={`button-thumbnail-${idx}`}
                    >
                      <ProtectedImage protected={!store.allowImageDownload} src={url} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {(() => {
          const isSoftware = product.productType === "software";
          const sections = parseSections(product.description || "");

          return (
            <div className="space-y-8">
              <div className="pdp-fade-in pdp-fade-in-d1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="pdp-category-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full" data-testid="badge-category">
                    {isSoftware ? <Key className="h-3 w-3" style={{ color: c.accent }} /> : <Tag className="h-3 w-3" style={{ color: c.accent }} />}
                    <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${c.accent}cc` }}>
                      {isSoftware ? "Software Deal" : product.category}
                    </span>
                  </div>
                  {hasDiscount && (
                    <div className="pdp-discount px-3 py-1.5 rounded-full text-xs font-bold" data-testid="badge-discount-top">
                      -{getDiscountPercent(product.originalPriceCents!, product.priceCents)}% OFF
                    </div>
                  )}
                  {isSoftware && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: `${c.cyan}15`, border: `1px solid ${c.cyan}25`, color: c.cyan }} data-testid="badge-lifetime">
                      <Star className="h-3 w-3" />
                      Lifetime Deal
                    </div>
                  )}
                </div>

                <h1 className="pdp-title-gradient text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3" data-testid="text-product-title">
                  {product.title}
                </h1>

                <a href={`/s/${slug}`} className="inline-flex items-center gap-2 transition-colors text-sm" style={{ color: c.textTer }} data-testid="link-store-name">
                  <Sparkles className="h-3 w-3" />
                  <span>by {store.name}</span>
                </a>

                {product.tags && product.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {product.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${c.accent}12`, border: `1px solid ${c.accent}20`, color: `${c.accent}bb` }}
                        data-testid={`badge-tag-${i}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pdp-separator" />

              {isSoftware && sections.intro && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <p className="text-lg sm:text-xl leading-relaxed" style={{ color: c.textSec, lineHeight: "1.8" }} data-testid="text-product-intro">
                    {sections.intro}
                  </p>
                </div>
              )}

              {isSoftware && hasDiscount && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <div className="pdp-card p-6" data-testid="card-deal-pricing">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Zap className="h-5 w-5" style={{ color: c.cyan }} />
                      <h3 className="text-lg font-bold" style={{ color: c.text }}>Deal Pricing</h3>
                    </div>
                    {(() => {
                      const msrpLabel = sections.pricing.toLowerCase().includes("/month") || sections.pricing.toLowerCase().includes("per month") || sections.pricing.toLowerCase().includes("/mo")
                        ? "/mo" : "/year";
                      return (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-xl p-4" style={{ background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)", border: `1px solid ${isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)"}` }}>
                              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: isDark ? "rgba(252,165,165,0.7)" : "rgba(220,38,38,0.6)" }}>Regular Price</p>
                              <p className="text-2xl font-extrabold line-through" style={{ color: isDark ? "rgba(252,165,165,0.5)" : "rgba(220,38,38,0.4)" }} data-testid="text-regular-price">
                                {formatPrice(product.originalPriceCents!)}<span className="text-sm font-normal">{msrpLabel}</span>
                              </p>
                            </div>
                            <div className="rounded-xl p-4" style={{ background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)", border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)"}` }}>
                              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: isDark ? "#6ee7b7" : "#059669" }}>Lifetime Deal</p>
                              <p className="text-2xl font-extrabold" style={{ color: isDark ? "#6ee7b7" : "#059669" }} data-testid="text-deal-price">
                                {formatPrice(product.priceCents)}<span className="text-sm font-normal"> one-time</span>
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm" style={{ color: c.textSec }}>
                            Pay once, access forever. You save {formatPrice(product.originalPriceCents! - product.priceCents)} compared to just {msrpLabel === "/mo" ? "one year" : "the regular price"}.
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {isSoftware && sections.features.length > 0 && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <div className="pdp-card p-6" data-testid="card-whats-included">
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      <Check className="h-5 w-5" style={{ color: c.accent }} />
                      <h3 className="text-lg font-bold" style={{ color: c.text }}>What's Included</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {sections.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} data-testid={`text-feature-${i}`}>
                          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${c.accent}20` }}>
                            <Check className="h-3 w-3" style={{ color: c.accent }} />
                          </div>
                          <span className="text-sm leading-relaxed" style={{ color: c.textSec }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isSoftware && sections.highlights.length > 0 && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <div className="pdp-card p-6" data-testid="card-highlights">
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      <Shield className="h-5 w-5" style={{ color: c.accentAlt }} />
                      <h3 className="text-lg font-bold" style={{ color: c.text }}>Why This Deal</h3>
                    </div>
                    <div className="space-y-2.5">
                      {sections.highlights.map((hl, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} data-testid={`text-highlight-${i}`}>
                          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${c.accentAlt}20` }}>
                            <Star className="h-3 w-3" style={{ color: c.accentAlt }} />
                          </div>
                          <span className="text-sm leading-relaxed" style={{ color: c.textSec }}>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isSoftware && sections.perfectFor.length > 0 && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <div className="pdp-card p-6" data-testid="card-perfect-for">
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      <Sparkles className="h-5 w-5" style={{ color: c.cyan }} />
                      <h3 className="text-lg font-bold" style={{ color: c.text }}>Perfect For</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {sections.perfectFor.map((pf, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} data-testid={`text-perfect-for-${i}`}>
                          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${c.cyan}20` }}>
                            <Check className="h-3 w-3" style={{ color: c.cyan }} />
                          </div>
                          <span className="text-sm leading-relaxed" style={{ color: c.textSec }}>{pf}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isSoftware && product.accessUrl && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <div className="pdp-card p-6" data-testid="card-how-to-redeem">
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      <Key className="h-5 w-5" style={{ color: isDark ? "#fbbf24" : "#d97706" }} />
                      <h3 className="text-lg font-bold" style={{ color: c.text }}>How to Redeem</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { step: "1", text: "Purchase this deal and receive your redemption code instantly" },
                        { step: "2", text: `Create your account at ${product.accessUrl.replace(/^https?:\/\//, "")}` },
                        { step: "3", text: "Go to Settings and enter your redemption code" },
                        { step: "4", text: "Your plan will be activated immediately" },
                      ].map((s, i) => (
                        <div key={i} className="flex items-start gap-4 p-3 rounded-lg" style={{ background: isDark ? "rgba(251,191,36,0.04)" : "rgba(217,119,6,0.04)" }} data-testid={`text-redeem-step-${i}`}>
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: isDark ? "rgba(251,191,36,0.15)" : "rgba(217,119,6,0.12)", color: isDark ? "#fbbf24" : "#d97706" }}>
                            {s.step}
                          </div>
                          <span className="text-sm leading-relaxed pt-1" style={{ color: c.textSec }}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!isSoftware && product.description && (
                <div className="pdp-fade-in pdp-fade-in-d2">
                  <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap" style={{ color: c.textSec, lineHeight: "1.8" }} data-testid="text-product-description">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="pdp-separator" />

              <div className="pdp-fade-in pdp-fade-in-d3">
                <div className="pdp-card p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      {hasDiscount && (
                        <span className="text-lg line-through" style={{ color: c.textTer }} data-testid="text-product-original-price">
                          {formatPrice(product.originalPriceCents!)}
                        </span>
                      )}
                      <span className="pdp-price-glow text-4xl sm:text-5xl font-extrabold" data-testid="text-product-price">
                        {formatPrice(product.priceCents)}
                      </span>
                      {isSoftware && (
                        <span className="text-sm font-medium" style={{ color: c.textSec }}>one-time</span>
                      )}
                      {hasDiscount && (
                        <span className="pdp-discount text-xs font-bold px-2 py-1 rounded-full" data-testid="badge-discount">
                          SAVE {getDiscountPercent(product.originalPriceCents!, product.priceCents)}%
                        </span>
                      )}
                    </div>
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
                    <Button className="pdp-buy-btn w-full sm:w-auto font-semibold text-base border-0 no-default-hover-elevate no-default-active-elevate px-10 py-6 rounded-xl" size="lg" onClick={handleBuy} disabled={buying} data-testid="button-buy-product">
                      {isSoftware ? <Key className="mr-2 h-5 w-5" /> : <ShoppingBag className="mr-2 h-5 w-5" />}
                      {buying ? "Processing..." : isSoftware ? "Get This Deal" : "Buy Now"}
                    </Button>
                  </div>

                  <div className="mt-5 flex items-center gap-6 flex-wrap">
                    {(isSoftware
                      ? [{ label: "Instant Code Delivery", icon: Clock }, { label: "Secure Checkout", icon: Shield }, { label: "Lifetime Access", icon: Star }]
                      : [{ label: "Instant Delivery", icon: Clock }, { label: "Secure Checkout", icon: Shield }, { label: "Lifetime Access", icon: Star }]
                    ).map(({ label, icon: Icon }, i) => (
                      <div key={label} className="flex items-center gap-2 text-xs" style={{ color: c.textTer }}>
                        <Icon className="h-3 w-3" style={{ color: [c.cyan, c.accentAlt, c.accent][i] }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      <footer className="relative z-10 pb-8 pt-4">
        <div className="pdp-separator mb-8" />
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-center gap-3">
          <Zap className="h-3 w-3" style={{ color: c.textTer }} />
          <span className="text-sm tracking-wide" style={{ color: c.textTer }}>Powered by Sellisy</span>
        </div>
      </footer>
    </div>
  );
}
