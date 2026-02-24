import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingBag, Package,
  Users, Ticket, Eye, ArrowUpRight, ArrowDownRight,
  BarChart3, Globe, MousePointerClick, ShoppingCart,
} from "lucide-react";

type RevenueData = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  prevRevenue: number;
  prevOrders: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
};

type ProductData = {
  products: {
    productId: string;
    title: string;
    revenue: number;
    unitsSold: number;
    views: number;
    conversionRate: number;
  }[];
  totalActiveProducts: number;
  bestSeller: { title: string; revenue: number; unitsSold: number } | null;
  worstSeller: { title: string; revenue: number; unitsSold: number } | null;
};

type CustomerData = {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  returnRate: number;
  avgLifetimeValue: number;
  topCustomers: {
    email: string;
    totalSpent: number;
    orderCount: number;
    firstOrder: string;
    lastOrder: string;
  }[];
  acquisitionByDay: { date: string; count: number }[];
};

type CouponData = {
  coupons: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxUses: number | null;
    currentUses: number;
    isActive: boolean;
    ordersInPeriod: number;
    revenueInPeriod: number;
  }[];
  totalCouponOrders: number;
  totalCouponRevenue: number;
  activeCoupons: number;
};

type TrafficData = {
  pageViews: number;
  productViews: number;
  bundleViews: number;
  checkoutStarts: number;
  addToCart: number;
  uniqueVisitorsTotal: number;
  conversionRate: number;
  dailyTraffic: {
    date: string;
    pageViews: number;
    productViews: number;
    uniqueVisitors: number;
    checkoutStarts: number;
    addToCart: number;
  }[];
  funnel: {
    pageViews: number;
    productViews: number;
    addToCart: number;
    checkoutStarts: number;
    completedOrders: number;
  };
  topReferrers: { referrer: string; count: number }[];
};

type AllAnalytics = {
  revenue: RevenueData;
  products: ProductData;
  customers: CustomerData;
  coupons: CouponData;
  traffic: TrafficData;
};

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <Badge variant="secondary" className="text-xs">0%</Badge>;
  const positive = value > 0;
  return (
    <Badge variant="secondary" className={`text-xs gap-0.5 ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </Badge>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, testId }: {
  title: string; value: string; subtitle?: string; icon: typeof DollarSign; testId: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums" data-testid={testId}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function MiniBarChart({ data, valueKey, maxVal, height = 120 }: {
  data: { date: string; [k: string]: any }[];
  valueKey: string;
  maxVal: number;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
        No data yet
      </div>
    );
  }
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((d, idx) => {
        const val = Number(d[valueKey]) || 0;
        const barH = maxVal > 0 ? Math.max(2, (val / maxVal) * 100) : 2;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group">
            <div
              className="w-full rounded-t-sm bg-primary/70 group-hover:bg-primary transition-colors"
              style={{ height: `${barH}%` }}
              title={`${d.date}: ${valueKey === "revenue" ? fmt(val) : val}`}
            />
            {data.length <= 14 && (
              <span className="text-[8px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                {d.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelStep({ label, value, prevValue, icon: Icon }: {
  label: string; value: number; prevValue?: number; icon: typeof Eye;
}) {
  const dropoff = prevValue && prevValue > 0 ? Math.round(((prevValue - value) / prevValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold tabular-nums">{value.toLocaleString()}</span>
        </div>
        {prevValue !== undefined && prevValue > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <Progress value={value > 0 ? (value / prevValue) * 100 : 0} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {dropoff > 0 ? `-${dropoff}% drop` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-20" /></CardContent>
          </Card>
        ))}
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
    </div>
  );
}

function RevenueTab({ data }: { data: RevenueData }) {
  const maxRev = data.dailyRevenue.length > 0 ? Math.max(...data.dailyRevenue.map((d) => d.revenue)) : 0;
  const maxOrders = data.dailyRevenue.length > 0 ? Math.max(...data.dailyRevenue.map((d) => d.orders)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums" data-testid="text-analytics-revenue">{fmt(data.totalRevenue)}</span>
              <GrowthBadge value={data.revenueGrowth} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs. previous period: {fmt(data.prevRevenue)}</p>
          </CardContent>
        </Card>
        <StatCard title="Total Orders" value={data.totalOrders.toLocaleString()} subtitle={`Growth: ${data.orderGrowth > 0 ? "+" : ""}${data.orderGrowth}%`} icon={ShoppingBag} testId="text-analytics-orders" />
        <StatCard title="Avg. Order Value" value={fmt(data.avgOrderValue)} icon={TrendingUp} testId="text-analytics-aov" />
        <StatCard title="Prev. Period Orders" value={data.prevOrders.toLocaleString()} icon={BarChart3} testId="text-analytics-prev-orders" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={data.dailyRevenue} valueKey="revenue" maxVal={maxRev} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={data.dailyRevenue} valueKey="orders" maxVal={maxOrders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProductsTab({ data }: { data: ProductData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Active Products" value={data.totalActiveProducts.toLocaleString()} icon={Package} testId="text-analytics-active-products" />
        {data.bestSeller && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Best Seller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold truncate" data-testid="text-analytics-best-seller">{data.bestSeller.title}</p>
              <p className="text-xs text-muted-foreground">{fmt(data.bestSeller.revenue)} &middot; {data.bestSeller.unitsSold} sold</p>
            </CardContent>
          </Card>
        )}
        {data.worstSeller && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-orange-500" /> Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold truncate">{data.worstSeller.title}</p>
              <p className="text-xs text-muted-foreground">{fmt(data.worstSeller.revenue)} &middot; {data.worstSeller.unitsSold} sold</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Package className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-right">Revenue</div>
                <div className="col-span-2 text-right">Units</div>
                <div className="col-span-2 text-right">Views</div>
                <div className="col-span-2 text-right">Conv.</div>
              </div>
              {data.products.map((p, i) => (
                <div key={p.productId} className="grid grid-cols-12 gap-2 items-center text-sm" data-testid={`row-product-${i}`}>
                  <div className="col-span-4 font-medium truncate">{p.title}</div>
                  <div className="col-span-2 text-right tabular-nums">{fmt(p.revenue)}</div>
                  <div className="col-span-2 text-right tabular-nums">{p.unitsSold}</div>
                  <div className="col-span-2 text-right tabular-nums">{p.views}</div>
                  <div className="col-span-2 text-right">
                    <Badge variant="secondary" className="text-xs">{p.conversionRate}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CustomersTab({ data }: { data: CustomerData }) {
  const maxAcq = data.acquisitionByDay.length > 0 ? Math.max(...data.acquisitionByDay.map((d) => d.count)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={data.totalCustomers.toLocaleString()} icon={Users} testId="text-analytics-total-customers" />
        <StatCard title="New Customers" value={data.newCustomers.toLocaleString()} icon={ArrowUpRight} testId="text-analytics-new-customers" />
        <StatCard title="Returning" value={data.returningCustomers.toLocaleString()} subtitle={`Return rate: ${data.returnRate}%`} icon={TrendingUp} testId="text-analytics-returning" />
        <StatCard title="Avg. Lifetime Value" value={fmt(data.avgLifetimeValue)} icon={DollarSign} testId="text-analytics-ltv" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Acquisition</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={data.acquisitionByDay} valueKey="count" maxVal={maxAcq} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No customers yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topCustomers.slice(0, 5).map((c, i) => (
                  <div key={c.email} className="flex items-center gap-3" data-testid={`row-customer-${i}`}>
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{c.email}</span>
                      <span className="text-xs text-muted-foreground">{c.orderCount} orders</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{fmt(c.totalSpent)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CouponsTab({ data }: { data: CouponData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Active Coupons" value={data.activeCoupons.toLocaleString()} icon={Ticket} testId="text-analytics-active-coupons" />
        <StatCard title="Coupon Orders" value={data.totalCouponOrders.toLocaleString()} subtitle="Orders using a coupon" icon={ShoppingBag} testId="text-analytics-coupon-orders" />
        <StatCard title="Coupon Revenue" value={fmt(data.totalCouponRevenue)} subtitle="Revenue from coupon orders" icon={DollarSign} testId="text-analytics-coupon-revenue" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coupon Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Ticket className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No coupons created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-3">Code</div>
                <div className="col-span-2">Discount</div>
                <div className="col-span-2 text-right">Uses</div>
                <div className="col-span-2 text-right">Orders</div>
                <div className="col-span-3 text-right">Revenue</div>
              </div>
              {data.coupons.map((c) => (
                <div key={c.id} className="grid grid-cols-12 gap-2 items-center text-sm" data-testid={`row-coupon-${c.code}`}>
                  <div className="col-span-3">
                    <Badge variant={c.isActive ? "default" : "secondary"} className="font-mono text-xs">{c.code}</Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : fmt(c.discountValue)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    {c.currentUses}{c.maxUses ? `/${c.maxUses}` : ""}
                  </div>
                  <div className="col-span-2 text-right tabular-nums">{c.ordersInPeriod}</div>
                  <div className="col-span-3 text-right tabular-nums font-medium">{fmt(c.revenueInPeriod)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrafficTab({ data }: { data: TrafficData }) {
  const maxPV = data.dailyTraffic.length > 0 ? Math.max(...data.dailyTraffic.map((d) => d.pageViews)) : 0;
  const { funnel } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Page Views" value={data.pageViews.toLocaleString()} icon={Eye} testId="text-analytics-page-views" />
        <StatCard title="Unique Visitors" value={data.uniqueVisitorsTotal.toLocaleString()} icon={Globe} testId="text-analytics-unique-visitors" />
        <StatCard title="Product Views" value={data.productViews.toLocaleString()} icon={MousePointerClick} testId="text-analytics-product-views" />
        <StatCard title="Conversion Rate" value={`${data.conversionRate}%`} subtitle="Visitors to buyers" icon={TrendingUp} testId="text-analytics-conversion" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={data.dailyTraffic} valueKey="pageViews" maxVal={maxPV} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelStep label="Page Views" value={funnel.pageViews} icon={Eye} />
            <FunnelStep label="Product Views" value={funnel.productViews} prevValue={funnel.pageViews} icon={MousePointerClick} />
            <FunnelStep label="Checkout Started" value={funnel.checkoutStarts} prevValue={funnel.productViews} icon={ShoppingBag} />
            <FunnelStep label="Completed Orders" value={funnel.completedOrders} prevValue={funnel.checkoutStarts || funnel.productViews} icon={Package} />
          </CardContent>
        </Card>
      </div>

      {data.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topReferrers.map((r, i) => {
                const maxRef = data.topReferrers[0]?.count || 1;
                return (
                  <div key={r.referrer} className="flex items-center gap-3" data-testid={`row-referrer-${i}`}>
                    <span className="text-sm font-medium truncate flex-1 min-w-0">{r.referrer}</span>
                    <div className="w-32">
                      <Progress value={(r.count / maxRef) * 100} className="h-2" />
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground w-12 text-right">{r.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { activeStoreId, storesLoading } = useActiveStore();
  const [range, setRange] = useState("30d");
  const [tab, setTab] = useState("revenue");

  const { data, isLoading } = useQuery<AllAnalytics>({
    queryKey: ["/api/store-analytics", activeStoreId, range],
    queryFn: () =>
      fetch(`/api/store-analytics?storeId=${activeStoreId}&range=${range}`, { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error("Failed");
          return r.json();
        }),
    enabled: !!activeStoreId,
  });

  if (!storesLoading && !activeStoreId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2" data-testid="text-no-store-analytics">Select a store to view analytics</h3>
            <p className="text-sm text-muted-foreground">Use the store switcher at the top to pick a store.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep insights into your store performance</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]" data-testid="select-analytics-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-analytics">
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          <TabsTrigger value="coupons" data-testid="tab-coupons">Coupons</TabsTrigger>
          <TabsTrigger value="traffic" data-testid="tab-traffic">Traffic</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="mt-6"><LoadingSkeleton /></div>
        ) : data ? (
          <>
            <TabsContent value="revenue"><RevenueTab data={data.revenue} /></TabsContent>
            <TabsContent value="products"><ProductsTab data={data.products} /></TabsContent>
            <TabsContent value="customers"><CustomersTab data={data.customers} /></TabsContent>
            <TabsContent value="coupons"><CouponsTab data={data.coupons} /></TabsContent>
            <TabsContent value="traffic"><TrafficTab data={data.traffic} /></TabsContent>
          </>
        ) : (
          <div className="mt-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">Unable to load analytics</p>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}
