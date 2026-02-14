import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import {
  Package, ShoppingBag, LogOut, Loader2, Moon, Sun,
  ChevronRight, Store,
} from "lucide-react";

type CustomerMe = { id: string; email: string };

type PurchaseItem = {
  id: string;
  productId: string;
  title: string;
  priceCents: number;
  thumbnailUrl: string | null;
};

type Purchase = {
  id: string;
  totalCents: number;
  status: string;
  createdAt: string;
  store: { id: string; name: string; slug: string };
  items: PurchaseItem[];
};

export default function PurchasesPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const { data: customer, isLoading: meLoading } = useQuery<CustomerMe>({
    queryKey: ["/api/customer/me"],
    retry: false,
  });

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/customer/purchases"],
    enabled: !!customer,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/customer/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      navigate("/account");
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

  const grouped = new Map<string, Purchase[]>();
  for (const p of purchases || []) {
    const key = p.store.id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap px-6 py-3">
          <Link href="/">
            <span className="text-lg font-bold tracking-tight" data-testid="link-home">
              DigitalVault
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-customer-email">
              {customer.email}
            </span>
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-customer-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-purchases-title">
            Your Purchases
          </h1>
          <p className="text-muted-foreground mt-1">
            View and download all your digital products
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No purchases yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your digital product purchases will appear here after you buy from any DigitalVault store.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([storeId, storeOrders]) => {
              const storeName = storeOrders[0].store.name;
              const storeSlug = storeOrders[0].store.slug;
              return (
                <div key={storeId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <Link href={`/s/${storeSlug}`}>
                      <span className="text-sm font-medium text-muted-foreground" data-testid={`text-store-name-${storeId}`}>
                        {storeName}
                      </span>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {storeOrders.map((order) => (
                      <Link key={order.id} href={`/account/purchase/${order.id}`}>
                        <Card className="hover-elevate cursor-pointer" data-testid={`card-order-${order.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex -space-x-2">
                                {order.items.slice(0, 3).map((item) => (
                                  <div key={item.id} className="h-12 w-12 rounded-md bg-muted border-2 border-background overflow-hidden">
                                    {item.thumbnailUrl ? (
                                      <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="h-12 w-12 rounded-md bg-muted border-2 border-background flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">+{order.items.length - 3}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {order.items.map((i) => i.title).join(", ")}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    ${(order.totalCents / 100).toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
