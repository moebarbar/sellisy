import { useEffect, useState } from "react";
import { useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ShoppingBag, Package, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

type ClaimData = {
  order: { id: string; buyerEmail: string; totalCents: number };
  product: { id: string; title: string; thumbnailUrl: string | null } | null;
  store: { id: string; name: string; slug: string } | null;
  downloadToken: string | null;
  upsellProduct: { id: string; title: string; description: string | null; priceCents: number; thumbnailUrl: string | null } | null;
  upsellBundle: { id: string; name: string; description: string | null; priceCents: number; thumbnailUrl: string | null; productCount: number } | null;
};

export default function ClaimSuccessPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");
  const storeSlug = params.get("store");
  const [data, setData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/claim-free/success/${orderId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Order not found or expired.</p>
            <Link href="/">
              <Button variant="outline" className="mt-4" data-testid="button-claim-go-home">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasUpsell = data.upsellProduct || data.upsellBundle;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-claim-success-title">
            You're in!
          </h1>
          <p className="text-muted-foreground">
            Your free product is ready to download
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              {data.product.thumbnailUrl ? (
                <img src={data.product.thumbnailUrl} alt={data.product.title} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate" data-testid="text-claim-product-title">
                  {data.product.title}
                </h2>
                <p className="text-sm text-muted-foreground">{data.store?.name}</p>
              </div>
            </div>

            {data.downloadToken && (
              <a
                href={`/api/download/${data.downloadToken}`}
                className="block"
                data-testid="link-claim-download"
              >
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Now
                </Button>
              </a>
            )}

            <p className="text-xs text-muted-foreground text-center">
              We also sent a copy to <strong>{data.order.buyerEmail}</strong>
            </p>
          </CardContent>
        </Card>

        {hasUpsell && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                You might also like
              </h3>
            </div>

            {data.upsellProduct && (
              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {data.upsellProduct.thumbnailUrl ? (
                      <img src={data.upsellProduct.thumbnailUrl} alt={data.upsellProduct.title} className="h-20 w-20 rounded-lg object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className="font-semibold" data-testid="text-upsell-product-title">{data.upsellProduct.title}</h4>
                      {data.upsellProduct.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{data.upsellProduct.description}</p>
                      )}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-lg font-bold">
                          ${(data.upsellProduct.priceCents / 100).toFixed(2)}
                        </span>
                        <Link href={`/s/${storeSlug}/product/${data.upsellProduct.id}`}>
                          <Button size="sm" data-testid="button-upsell-product-buy">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Buy Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.upsellBundle && (
              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {data.upsellBundle.thumbnailUrl ? (
                      <img src={data.upsellBundle.thumbnailUrl} alt={data.upsellBundle.name} className="h-20 w-20 rounded-lg object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className="font-semibold" data-testid="text-upsell-bundle-title">{data.upsellBundle.name}</h4>
                      {data.upsellBundle.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{data.upsellBundle.description}</p>
                      )}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-lg font-bold">
                            ${(data.upsellBundle.priceCents / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {data.upsellBundle.productCount} products
                          </span>
                        </div>
                        <Link href={`/s/${storeSlug}/bundle/${data.upsellBundle.id}`}>
                          <Button size="sm" data-testid="button-upsell-bundle-buy">
                            <Package className="mr-2 h-4 w-4" />
                            View Bundle
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="text-center space-y-3">
          {storeSlug && (
            <Link href={`/s/${storeSlug}`}>
              <Button variant="outline" size="sm" data-testid="button-claim-back-store">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Store
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
