import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Download, ArrowLeft, Loader2, Moon, Sun,
  ShoppingBag, ExternalLink, Store,
} from "lucide-react";

type CustomerMe = { id: string; email: string };

type OrderItem = {
  id: string;
  productId: string;
  title: string;
  priceCents: number;
  thumbnailUrl: string | null;
  hasFiles: boolean;
};

type UpsellProduct = {
  id: string;
  title: string;
  priceCents: number;
  thumbnailUrl: string | null;
};

type PurchaseDetail = {
  order: {
    id: string;
    totalCents: number;
    status: string;
    createdAt: string;
  };
  store: { id: string; name: string; slug: string } | null;
  items: OrderItem[];
  upsellProducts: UpsellProduct[];
};

export default function PurchaseDetailPage() {
  const [, params] = useRoute("/account/purchase/:orderId");
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const orderId = params?.orderId;

  const { data: customer, isLoading: meLoading } = useQuery<CustomerMe>({
    queryKey: ["/api/customer/me"],
    retry: false,
  });

  const { data: purchase, isLoading } = useQuery<PurchaseDetail>({
    queryKey: ["/api/customer/purchase", orderId],
    enabled: !!customer && !!orderId,
  });

  const downloadMutation = useMutation({
    mutationFn: async (orderItemId: string) => {
      const res = await apiRequest("POST", "/api/customer/download", { orderItemId });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.downloadToken) {
        window.open(`/api/download/${data.downloadToken}`, "_blank");
      }
    },
    onError: (err: any) => {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    },
  });

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    navigate("/account");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap px-6 py-3">
          <Link href="/">
            <span className="text-lg font-bold tracking-tight" data-testid="link-home">
              Sellisy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/account/purchases">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-purchase-title">
              Order Details
            </h1>
            {purchase?.store && (
              <p className="text-sm text-muted-foreground mt-0.5">
                From{" "}
                <Link href={`/s/${purchase.store.slug}`}>
                  <span className="underline">{purchase.store.name}</span>
                </Link>
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !purchase ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Order not found</h3>
              <p className="text-sm text-muted-foreground">
                This order may not exist or may not belong to your account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {purchase.order.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(purchase.order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="font-semibold" data-testid="text-order-total">
                    ${(purchase.order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Items</h2>
              {purchase.items.map((item) => (
                <Card key={item.id} data-testid={`card-item-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm" data-testid={`text-item-title-${item.id}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ${(item.priceCents / 100).toFixed(2)}
                        </p>
                      </div>
                      {item.hasFiles && (
                        <Button
                          size="sm"
                          onClick={() => downloadMutation.mutate(item.id)}
                          disabled={downloadMutation.isPending}
                          data-testid={`button-download-${item.id}`}
                        >
                          {downloadMutation.isPending ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-3.5 w-3.5" />
                          )}
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {purchase.upsellProducts.length > 0 && purchase.store && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">More from {purchase.store.name}</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {purchase.upsellProducts.map((product) => (
                    <Link key={product.id} href={`/s/${purchase.store!.slug}/product/${product.id}`}>
                      <Card className="hover-elevate cursor-pointer" data-testid={`card-upsell-${product.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0">
                              {product.thumbnailUrl ? (
                                <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.title}</p>
                              <p className="text-xs text-muted-foreground">
                                ${(product.priceCents / 100).toFixed(2)}
                              </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
