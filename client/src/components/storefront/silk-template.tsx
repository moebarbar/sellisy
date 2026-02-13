import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Sparkles } from "lucide-react";
import type { Store, Product } from "@shared/schema";

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a96e]" />
      <Sparkles className="h-3.5 w-3.5 text-[#c9a96e]" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a96e]" />
    </div>
  );
}

export function SilkTemplate({ store, products }: { store: Store; products: Product[] }) {
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
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5", color: "#2d2926" }}>
      <header className="relative py-6" style={{ borderBottom: "1px solid #e8e0d4" }}>
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-px w-10" style={{ backgroundColor: "#c9a96e" }} />
            <span
              className="text-sm font-serif tracking-[0.3em] uppercase"
              style={{ color: "#8a7d6b" }}
              data-testid="text-silk-store-name"
            >
              {store.name}
            </span>
            <div className="h-px w-10" style={{ backgroundColor: "#c9a96e" }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <div className="mb-6">
          <div className="inline-block px-5 py-1.5 rounded-full text-xs tracking-[0.25em] uppercase font-medium"
            style={{ backgroundColor: "#f3ece1", color: "#9a8567", border: "1px solid #e5d9c3" }}>
            Curated Collection
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight mb-5" style={{ color: "#2d2926", lineHeight: "1.15" }}>
          {store.name}
        </h1>
        <p className="text-base md:text-lg max-w-lg mx-auto leading-relaxed" style={{ color: "#8a7d6b" }}>
          A thoughtfully curated selection of premium digital goods, crafted with care and attention to detail.
        </p>
        <div className="mt-10">
          <GoldDivider />
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="flex items-center justify-center h-20 w-20 rounded-full mx-auto mb-6"
              style={{ backgroundColor: "#f3ece1", border: "1px solid #e5d9c3" }}
            >
              <Package className="h-8 w-8" style={{ color: "#b5a48a" }} />
            </div>
            <h2 className="text-2xl font-serif mb-3" style={{ color: "#2d2926" }}>No products yet</h2>
            <p className="text-sm" style={{ color: "#8a7d6b" }}>
              This collection is currently being curated. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {products.map((product, index) => (
              <div key={product.id}>
                <div
                  className="group flex flex-col md:flex-row rounded-md overflow-visible transition-all duration-500"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e0d4",
                    boxShadow: "0 2px 16px rgba(180, 160, 130, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 40px rgba(180, 160, 130, 0.18)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 16px rgba(180, 160, 130, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  data-testid={`card-product-${product.id}`}
                >
                  {product.thumbnailUrl && (
                    <div className="md:w-80 lg:w-96 shrink-0 overflow-hidden">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-56 md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        data-testid={`img-product-${product.id}`}
                      />
                    </div>
                  )}
                  <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1" style={{ backgroundColor: "#e5d9c3" }} />
                        <span className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: "#b5a48a" }}>
                          Digital Product
                        </span>
                        <div className="h-px flex-1" style={{ backgroundColor: "#e5d9c3" }} />
                      </div>
                      <h3
                        className="text-xl md:text-2xl font-serif mb-3 tracking-tight"
                        style={{ color: "#2d2926", lineHeight: "1.3" }}
                        data-testid={`text-silk-product-${product.id}`}
                      >
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-sm leading-relaxed line-clamp-3 mb-6" style={{ color: "#8a7d6b" }}>
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap pt-4" style={{ borderTop: "1px solid #f0e9df" }}>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "#b5a48a" }}>
                          Price
                        </span>
                        <span
                          className="text-2xl font-serif"
                          style={{ color: "#2d2926" }}
                          data-testid={`text-price-${product.id}`}
                        >
                          ${(product.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleBuy(product)}
                        data-testid={`button-silk-buy-${product.id}`}
                        className="rounded-full px-6 font-medium tracking-wide text-sm"
                        style={{
                          backgroundColor: "#8b6914",
                          color: "#faf8f5",
                          border: "1px solid #a07d1c",
                        }}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Purchase
                      </Button>
                    </div>
                  </div>
                </div>
                {index < products.length - 1 && (
                  <div className="pt-10">
                    <GoldDivider />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-10" style={{ borderTop: "1px solid #e8e0d4" }}>
        <div className="mx-auto max-w-5xl px-6 text-center">
          <GoldDivider />
          <p className="mt-4 text-xs tracking-[0.2em] uppercase" style={{ color: "#b5a48a" }}>
            Powered by DigitalVault
          </p>
        </div>
      </footer>
    </div>
  );
}
