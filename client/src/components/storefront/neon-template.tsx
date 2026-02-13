import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Zap, Sparkles } from "lucide-react";
import type { Store, Product } from "@shared/schema";

export function NeonTemplate({ store, products }: { store: Store; products: Product[] }) {
  const handleBuy = async (product: Product) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id, productId: product.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.mockUrl) {
        window.location.href = data.mockUrl;
      }
    } catch {
      alert("Checkout is not configured yet.");
    }
  };

  return (
    <div style={{ background: "#050510" }} className="min-h-screen text-white relative overflow-hidden">
      <style>{`
        @keyframes neon-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .neon-hero-text {
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #06b6d4, #818cf8, #60a5fa);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 6s ease infinite;
        }
        .neon-shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.8), rgba(96,165,250,0.9), rgba(255,255,255,0.8), rgba(255,255,255,0.4));
          background-size: 400% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: text-shimmer 4s linear infinite;
        }
        .neon-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(96, 165, 250, 0.1);
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .neon-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(167, 139, 250, 0.1), rgba(6, 182, 212, 0.2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.5;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .neon-card:hover {
          border-color: rgba(96, 165, 250, 0.3);
          box-shadow: 0 0 30px rgba(96, 165, 250, 0.08), 0 0 60px rgba(167, 139, 250, 0.04), 0 8px 32px rgba(0, 0, 0, 0.4);
          transform: translateY(-4px);
        }
        .neon-card:hover::before {
          opacity: 1;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.5), rgba(167, 139, 250, 0.3), rgba(6, 182, 212, 0.5));
        }
        .neon-price {
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.5), 0 0 20px rgba(96, 165, 250, 0.2);
        }
        .neon-buy-btn {
          background: linear-gradient(135deg, #3b82f6, #7c3aed, #06b6d4);
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(124, 58, 237, 0.15);
          transition: all 0.3s ease;
        }
        .neon-buy-btn:hover {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(124, 58, 237, 0.25);
          transform: scale(1.02);
        }
        .neon-orb {
          animation: neon-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .neon-float {
          animation: float-up 6s ease-in-out infinite;
        }
        .neon-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.3), rgba(167, 139, 250, 0.3), rgba(6, 182, 212, 0.3), transparent);
        }
      `}</style>

      <div className="neon-orb absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)" }} />
      <div className="neon-orb absolute top-[400px] right-[-200px] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)", animationDelay: "2s" }} />
      <div className="neon-orb absolute bottom-[-100px] left-[-150px] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 60%)", animationDelay: "3s" }} />

      <header className="relative z-10 px-6 py-5">
        <div className="neon-separator absolute bottom-0 left-0 right-0" />
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(96,165,250,0.2)" }}>
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white/90" data-testid="text-neon-store-name">
              {store.name}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-emerald-300/90 tracking-wide uppercase">Live</span>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <div className="neon-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-blue-300/80 tracking-wider uppercase">Premium Digital Products</span>
        </div>

        <h1 className="neon-hero-text text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          {store.name}
        </h1>

        <p className="neon-shimmer-text text-lg md:text-xl max-w-lg mx-auto font-light leading-relaxed">
          Curated digital assets crafted for creators who demand excellence.
        </p>

        <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div className="w-1 h-1 rounded-full bg-cyan-400" />
            Instant Delivery
          </div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div className="w-1 h-1 rounded-full bg-purple-400" />
            Secure Checkout
          </div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div className="w-1 h-1 rounded-full bg-blue-400" />
            Premium Quality
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <div className="neon-float inline-flex items-center justify-center h-20 w-20 rounded-2xl mx-auto mb-6" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.1)" }}>
              <Package className="h-8 w-8 text-white/20" />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-white/60">No products yet</h2>
            <p className="text-white/30 max-w-sm mx-auto">This store is getting ready. Check back soon for amazing digital products.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="neon-card group"
              >
                {product.thumbnailUrl && (
                  <div className="relative overflow-hidden" style={{ borderRadius: "16px 16px 0 0" }}>
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #050510 0%, rgba(5,5,16,0.4) 40%, transparent 100%)" }} />
                    <div className="absolute top-3 right-3">
                      <div className="neon-price px-3 py-1 rounded-full text-sm font-bold text-cyan-300" style={{ background: "rgba(5,5,16,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(6,182,212,0.2)" }}>
                        ${(product.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  {!product.thumbnailUrl && (
                    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <span className="neon-price text-2xl font-bold text-cyan-300">
                        ${(product.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold text-lg text-white/95 mb-2 tracking-tight" data-testid={`text-neon-product-${product.id}`}>
                    {product.title}
                  </h3>
                  <p className="text-sm text-white/40 line-clamp-2 mb-6 leading-relaxed">{product.description}</p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {product.thumbnailUrl ? (
                      <span className="neon-price text-xl font-bold text-cyan-300">
                        ${(product.priceCents / 100).toFixed(2)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Button
                      className="neon-buy-btn text-white font-medium border-0 no-default-hover-elevate no-default-active-elevate"
                      onClick={() => handleBuy(product)}
                      data-testid={`button-neon-buy-${product.id}`}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-8 pt-4">
        <div className="neon-separator mb-8" />
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="text-sm text-white/20 tracking-wide">Powered by DigitalVault</span>
        </div>
      </footer>
    </div>
  );
}
