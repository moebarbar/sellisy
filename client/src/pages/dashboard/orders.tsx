import { useQuery } from "@tanstack/react-query";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, DollarSign, Package, TrendingUp, Store } from "lucide-react";
import type { Order, OrderItem, Product } from "@shared/schema";

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

export default function OrdersPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();

  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", activeStoreId],
    enabled: !!activeStoreId,
  });

  const totalRevenue = orders?.filter(o => o.status === "COMPLETED").reduce((sum, o) => sum + o.totalCents, 0) || 0;
  const completedOrders = orders?.filter(o => o.status === "COMPLETED").length || 0;
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  if (!storesLoading && !activeStoreId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No store selected</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Create a store using the selector in the sidebar to view orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-orders-title">Orders</h1>
        <p className="text-muted-foreground mt-1">Track orders for {activeStore?.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">{completedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-order">${(avgOrderValue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} data-testid={`card-order-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-muted-foreground" data-testid={`text-order-id-${order.id}`}>
                      #{order.id.slice(0, 8)}
                    </span>
                    <Badge
                      variant={order.status === "COMPLETED" ? "default" : order.status === "PENDING" ? "secondary" : "destructive"}
                      data-testid={`badge-order-status-${order.id}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold" data-testid={`text-order-total-${order.id}`}>
                      ${(order.totalCents / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2" data-testid={`text-order-email-${order.id}`}>
                  {order.buyerEmail}
                </p>
                {order.items && order.items.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {order.items.map((item) => (
                      <Badge key={item.id} variant="secondary">
                        <Package className="h-3 w-3 mr-1" />
                        {item.product.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No orders yet</h3>
            <p className="text-sm text-muted-foreground">Orders will appear here when customers make purchases.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
