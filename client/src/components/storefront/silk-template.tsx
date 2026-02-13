import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Package } from "lucide-react";
import type { Store, Product } from "@shared/schema";

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
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#1a1a1a] text-[#2a2a2a] dark:text-[#e8e8e8]">
      <header className="border-b border-[#e8e4de] dark:border-[#333] px-6 py-5">
        <div className="mx-auto max-w-4xl flex items-center justify-center">
          <span className="text-xl font-serif tracking-wide" data-testid="text-silk-store-name">
            {store.name}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight mb-3">
          {store.name}
        </h1>
        <p className="text-[#8a8478] dark:text-[#999] text-base max-w-sm mx-auto">
          A curated collection of premium digital goods.
        </p>
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-16">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-[#f0ede8] dark:bg-[#2a2a2a] mx-auto mb-4">
              <Package className="h-6 w-6 text-[#b0a898] dark:text-[#666]" />
            </div>
            <h2 className="text-lg font-serif mb-2">No products yet</h2>
            <p className="text-sm text-[#8a8478] dark:text-[#999]">This collection is being curated.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-white dark:bg-[#222] border-[#e8e4de] dark:border-[#333] overflow-hidden hover-elevate"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {product.thumbnailUrl && (
                      <div className="sm:w-56 h-48 sm:h-auto overflow-hidden shrink-0">
                        <img
                          src={product.thumbnailUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-serif mb-2" data-testid={`text-silk-product-${product.id}`}>
                          {product.title}
                        </h3>
                        <p className="text-sm text-[#8a8478] dark:text-[#999] line-clamp-3 mb-4">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-lg font-medium">
                          ${(product.priceCents / 100).toFixed(2)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#d4cfc7] dark:border-[#444] text-[#2a2a2a] dark:text-[#e8e8e8]"
                          onClick={() => handleBuy(product)}
                          data-testid={`button-silk-buy-${product.id}`}
                        >
                          <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                          Purchase
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#e8e4de] dark:border-[#333] py-6">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-[#b0a898] dark:text-[#666]">
          Powered by DigitalVault
        </div>
      </footer>
    </div>
  );
}
