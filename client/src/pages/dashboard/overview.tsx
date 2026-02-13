import { useQuery } from "@tanstack/react-query";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Store, Package, ShoppingBag, DollarSign, TrendingUp, BarChart3, Users } from "lucide-react";

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalStores: number;
  topProducts: { title: string; revenue: number; count: number }[];
  revenueByDate: Record<string, number>;
}

export default function OverviewPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();

  const analyticsUrl = activeStoreId ? `/api/analytics?storeId=${activeStoreId}` : "/api/analytics";
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics", activeStoreId || "all"],
    queryFn: () => fetch(analyticsUrl, { credentials: "include" }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    enabled: !!activeStoreId,
  });

  const revenueEntries = analytics ? Object.entries(analytics.revenueByDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14) : [];
  const maxRevenue = revenueEntries.length > 0 ? Math.max(...revenueEntries.map(([, v]) => v)) : 0;

  if (!storesLoading && !activeStoreId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No stores yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Create your first store to start selling digital products. Use the store switcher at the top to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-overview-title">
          Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Performance and analytics for {activeStore?.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-revenue">
                  ${((analytics?.totalRevenue || 0) / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-order-count">{analytics?.totalOrders ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-product-count">{analytics?.totalProducts ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-avg-order">
                  ${analytics && analytics.totalOrders > 0 ? ((analytics.totalRevenue / analytics.totalOrders) / 100).toFixed(2) : "0.00"}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-base font-semibold">Revenue (Last 14 Days)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : revenueEntries.length > 0 ? (
              <div className="flex items-end gap-1 h-40" data-testid="chart-revenue">
                {revenueEntries.map(([date, value]) => {
                  const height = maxRevenue > 0 ? Math.max(4, (value / maxRevenue) * 100) : 4;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-primary transition-all duration-300"
                        style={{ height: `${height}%` }}
                        title={`${date}: $${(value / 100).toFixed(2)}`}
                      />
                      <span className="text-[9px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <div className="space-y-3" data-testid="list-top-products">
                {analytics.topProducts.map((product, i) => (
                  <div key={product.title} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}.</span>
                    <span className="flex-1 text-sm font-medium truncate">{product.title}</span>
                    <Badge variant="secondary">{product.count} sold</Badge>
                    <span className="text-sm font-bold">${(product.revenue / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
