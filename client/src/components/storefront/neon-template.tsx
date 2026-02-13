import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, Zap } from "lucide-react";
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
        <header className="relative border-b border-white/10 px-6 py-4">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" />
              <span className="text-lg font-bold tracking-tight" data-testid="text-neon-store-name">
                {store.name}
              </span>
            </div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 no-default-hover-elevate no-default-active-elevate">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
              </span>
              Live
            </Badge>
          </div>
        </header>

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            {store.name}
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Premium digital products, delivered instantly.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/5 mx-auto mb-4">
              <Package className="h-7 w-7 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-300">No products yet</h2>
            <p className="text-gray-500">Check back soon for new products.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-white/5 border-white/10 overflow-hidden hover-elevate group"
              >
                <CardContent className="p-0">
                  {product.thumbnailUrl && (
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-white mb-1" data-testid={`text-neon-product-${product.id}`}>
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-blue-300">
                        ${(product.priceCents / 100).toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500 no-default-hover-elevate"
                        onClick={() => handleBuy(product)}
                        data-testid={`button-neon-buy-${product.id}`}
                      >
                        <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-gray-500">
          Powered by DigitalVault
        </div>
      </footer>
    </div>
  );
}
