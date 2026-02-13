import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Tag, Sparkles } from "lucide-react";
import type { Store, Product } from "@shared/schema";

type ProductDetailData = {
  store: Store;
  product: Product;
};

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const slug = params.slug;
  const productId = params.productId;

  const { data, isLoading, error } = useQuery<ProductDetailData>({
    queryKey: ["/api/storefront", slug, "product", productId],
  });

  const handleBuy = async () => {
    if (!data) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: data.store.id, productId: data.product.id }),
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else if (result.mockUrl) {
        window.location.href = result.mockUrl;
      }
    } catch {
      alert("Checkout is not configured yet.");
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getDiscountPercent = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  if (isLoading) {
    return (
      <div style={{ background: "#050510" }} className="min-h-screen flex items-center justify-center">
        <div className="space-y-6 w-full max-w-2xl px-6">
          <Skeleton className="h-6 w-32 bg-white/5" />
          <Skeleton className="h-80 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-10 w-3/4 bg-white/5" />
          <Skeleton className="h-6 w-20 bg-white/5" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-5/6 bg-white/5" />
            <Skeleton className="h-4 w-4/6 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-40 bg-white/5" />
          <Skeleton className="h-14 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "#050510" }} className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold mb-3">Product Not Found</h1>
          <p className="text-white/40 mb-6">This product doesn't exist or has been removed.</p>
          <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  const { store, product } = data;
  const hasDiscount = product.originalPriceCents != null && product.originalPriceCents > product.priceCents;

  return (
    <div style={{ background: "#050510" }} className="min-h-screen text-white relative overflow-hidden">
      <style>{`
        @keyframes pdp-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes pdp-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pdp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pdp-text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pdp-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(124, 58, 237, 0.15); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(124, 58, 237, 0.25), 0 0 80px rgba(6, 182, 212, 0.15); }
        }
        @keyframes pdp-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pdp-orb {
          animation: pdp-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .pdp-float {
          animation: pdp-float 6s ease-in-out infinite;
        }
        .pdp-title-gradient {
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #06b6d4, #818cf8, #60a5fa);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: pdp-gradient-shift 6s ease infinite;
        }
        .pdp-shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.8), rgba(96,165,250,0.9), rgba(255,255,255,0.8), rgba(255,255,255,0.4));
          background-size: 400% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: pdp-text-shimmer 4s linear infinite;
        }
        .pdp-price-glow {
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.5), 0 0 20px rgba(96, 165, 250, 0.2), 0 0 40px rgba(6, 182, 212, 0.1);
        }
        .pdp-buy-btn {
          background: linear-gradient(135deg, #3b82f6, #7c3aed, #06b6d4);
          background-size: 200% 200%;
          animation: pdp-gradient-shift 4s ease infinite, pdp-glow-pulse 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .pdp-buy-btn:hover {
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(124, 58, 237, 0.3);
          transform: scale(1.02);
        }
        .pdp-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.3), rgba(167, 139, 250, 0.3), rgba(6, 182, 212, 0.3), transparent);
        }
        .pdp-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(96, 165, 250, 0.1);
          border-radius: 20px;
        }
        .pdp-fade-in {
          animation: pdp-fade-in 0.6s ease-out forwards;
        }
        .pdp-fade-in-delay-1 { animation-delay: 0.1s; opacity: 0; }
        .pdp-fade-in-delay-2 { animation-delay: 0.2s; opacity: 0; }
        .pdp-fade-in-delay-3 { animation-delay: 0.3s; opacity: 0; }
        .pdp-fade-in-delay-4 { animation-delay: 0.4s; opacity: 0; }
        .pdp-fade-in-delay-5 { animation-delay: 0.5s; opacity: 0; }
        .pdp-image-container {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
        }
        .pdp-image-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(to top, #050510 0%, rgba(5,5,16,0.6) 50%, transparent 100%);
          pointer-events: none;
        }
        .pdp-discount-badge {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }
        .pdp-category-badge {
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid rgba(96, 165, 250, 0.2);
        }
      `}</style>

      <div className="pdp-orb absolute top-[-300px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)" }} />
      <div className="pdp-orb absolute top-[500px] right-[-250px] w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)", animationDelay: "2s" }} />
      <div className="pdp-orb absolute bottom-[-150px] left-[-200px] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 60%)", animationDelay: "3s" }} />
      <div className="pdp-orb absolute top-[200px] left-[-100px] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)", animationDelay: "1.5s" }} />

      <header className="relative z-10 px-6 py-5">
        <div className="pdp-separator absolute bottom-0 left-0 right-0" />
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <a
            href={`/s/${slug}`}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
            data-testid="link-back-store"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{store.name}</span>
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-8 pb-20">
        {product.thumbnailUrl && (
          <div className="pdp-image-container mb-8 pdp-fade-in">
            <div className="aspect-[16/9] w-full">
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {hasDiscount && (
              <div className="absolute top-4 right-4 z-10">
                <div
                  className="pdp-discount-badge px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-md pdp-float"
                  data-testid="badge-discount"
                >
                  -{getDiscountPercent(product.originalPriceCents!, product.priceCents)}%
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-8">
          <div className="pdp-fade-in pdp-fade-in-delay-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div
                className="pdp-category-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                data-testid="badge-category"
              >
                <Tag className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-300/80 tracking-wider uppercase">{product.category}</span>
              </div>
              {hasDiscount && !product.thumbnailUrl && (
                <div
                  className="pdp-discount-badge px-3 py-1.5 rounded-full text-xs font-bold"
                  data-testid="badge-discount"
                >
                  -{getDiscountPercent(product.originalPriceCents!, product.priceCents)}% OFF
                </div>
              )}
            </div>

            <h1
              className="pdp-title-gradient text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3"
              data-testid="text-product-title"
            >
              {product.title}
            </h1>

            <a
              href={`/s/${slug}`}
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors text-sm"
              data-testid="link-store-name"
            >
              <Sparkles className="h-3 w-3" />
              <span>by {store.name}</span>
            </a>
          </div>

          <div className="pdp-separator" />

          {product.description && (
            <div className="pdp-fade-in pdp-fade-in-delay-2">
              <p
                className="text-white/50 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                style={{ lineHeight: "1.8" }}
                data-testid="text-product-description"
              >
                {product.description}
              </p>
            </div>
          )}

          <div className="pdp-separator" />

          <div className="pdp-fade-in pdp-fade-in-delay-3">
            <div className="pdp-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-baseline gap-3 flex-wrap">
                  {hasDiscount && (
                    <span
                      className="text-lg text-white/30 line-through"
                      data-testid="text-product-original-price"
                    >
                      {formatPrice(product.originalPriceCents!)}
                    </span>
                  )}
                  <span
                    className="pdp-price-glow text-4xl sm:text-5xl font-extrabold text-cyan-300"
                    data-testid="text-product-price"
                  >
                    {formatPrice(product.priceCents)}
                  </span>
                  {hasDiscount && (
                    <span className="pdp-discount-badge text-xs font-bold px-2 py-1 rounded-full" data-testid="badge-discount">
                      SAVE {getDiscountPercent(product.originalPriceCents!, product.priceCents)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className="pdp-buy-btn w-full sm:w-auto text-white font-semibold text-base border-0 no-default-hover-elevate no-default-active-elevate px-10 py-6 rounded-xl"
                  size="lg"
                  onClick={handleBuy}
                  data-testid="button-buy-product"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Buy Now
                </Button>
              </div>

              <div className="mt-5 flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-1 h-1 rounded-full bg-cyan-400" />
                  Instant Delivery
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-1 h-1 rounded-full bg-purple-400" />
                  Secure Checkout
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                  Lifetime Access
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-8 pt-4">
        <div className="pdp-separator mb-8" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="text-sm text-white/20 tracking-wide">Powered by DigitalVault</span>
        </div>
      </footer>
    </div>
  );
}
