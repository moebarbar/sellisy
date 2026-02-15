import { useQuery } from "@tanstack/react-query";
import { useActiveStore } from "@/lib/store-context";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Store, Package, ShoppingBag, DollarSign, TrendingUp, BarChart3,
  Users, Rocket, Zap, Star, ArrowRight, Sparkles, Target,
  Coffee, Flame, Moon as MoonIcon, Sun as SunIcon, AlertCircle, Eye,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalStores: number;
  topProducts: { title: string; revenue: number; count: number }[];
  revenueByDate: Record<string, number>;
}

function getGreeting(): { text: string; icon: typeof Rocket; subtext: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { text: "Burning the midnight oil", icon: MoonIcon, subtext: "Night owls build empires" };
  if (hour < 9) return { text: "Rise and shine", icon: Coffee, subtext: "Early birds catch the sales" };
  if (hour < 12) return { text: "Good morning", icon: SunIcon, subtext: "Let's make today count" };
  if (hour < 17) return { text: "Good afternoon", icon: Flame, subtext: "You're in the zone" };
  if (hour < 21) return { text: "Good evening", icon: Star, subtext: "Still crushing it" };
  return { text: "Night mode activated", icon: MoonIcon, subtext: "The hustle never sleeps" };
}

const motivations = [
  "Every product you add is a revenue stream waiting to flow.",
  "Your storefront is working for you 24/7 — even while you sleep.",
  "The best time to launch was yesterday. The second best time is now.",
  "Small stores become empires. Keep building.",
  "Your next customer could be browsing right now.",
];

function useCountUp(target: number, duration = 1200, enabled = true): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    const start = performance.now();
    const startVal = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return value;
}

function AnimatedStatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  delay = 0,
  testId,
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: typeof DollarSign;
  delay?: number;
  testId: string;
}) {
  const [visible, setVisible] = useState(false);
  const animValue = useCountUp(value, 1200, visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums" data-testid={testId}>
          {prefix}{animValue.toLocaleString()}{suffix}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { user } = useAuth();

  const analyticsUrl = activeStoreId ? `/api/analytics?storeId=${activeStoreId}` : "/api/analytics";
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics", activeStoreId || "all"],
    queryFn: () => fetch(analyticsUrl, { credentials: "include" }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    enabled: !!activeStoreId,
  });

  const { data: storeProducts } = useQuery<any[]>({
    queryKey: ["/api/store-products", activeStoreId],
    enabled: !!activeStoreId,
  });
  const hasPublishedProducts = storeProducts?.some((sp: any) => sp.isPublished) ?? false;
  const hasAnyProducts = (storeProducts?.length ?? 0) > 0;

  const revenueEntries = analytics ? Object.entries(analytics.revenueByDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14) : [];
  const maxRevenue = revenueEntries.length > 0 ? Math.max(...revenueEntries.map(([, v]) => v)) : 0;

  const greeting = useMemo(() => getGreeting(), []);
  const motivation = useMemo(() => motivations[Math.floor(Math.random() * motivations.length)], []);
  const firstName = user?.firstName?.trim() || "there";

  const revenueDollars = ((analytics?.totalRevenue || 0) / 100);
  const revenueWhole = Math.floor(revenueDollars);
  const revenueCents = Math.round((revenueDollars - revenueWhole) * 100);
  const avgOrder = analytics && analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders / 100 : 0;
  const avgWhole = Math.floor(avgOrder);
  const avgCents = Math.round((avgOrder - avgWhole) * 100);

  if (!storesLoading && !activeStoreId) {
    return (
      <div className="p-6 dv-fade-in">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10">
                <Rocket className="h-9 w-9 text-primary dv-float" />
              </div>
              <div className="absolute -top-1 -right-1 flex items-center justify-center h-6 w-6 rounded-full bg-primary">
                <Sparkles className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2" data-testid="text-no-stores">Ready for liftoff?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
              Your empire starts with a single store. Create one now and watch the magic happen. 
              It takes less than 30 seconds.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              Use the store switcher at the top to get started
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 dv-fade-in">
      <div className="relative overflow-hidden rounded-md border bg-gradient-to-br from-primary/5 via-background to-primary/3 p-6" data-testid="welcome-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <greeting.icon className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-overview-title">
                {greeting.text}, {firstName}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {greeting.subtext} — {activeStore?.name}
            </p>
            <p className="text-xs text-muted-foreground/60 italic mt-2 max-w-md">
              "{motivation}"
            </p>
          </div>
          <Link href={`/s/${activeStore?.slug}`}>
            <Button variant="outline" size="sm" data-testid="button-view-storefront">
              <Target className="h-3.5 w-3.5 mr-1.5" />
              View Storefront
            </Button>
          </Link>
        </div>
      </div>

      {storeProducts && !hasPublishedProducts && (
        <Alert data-testid="alert-none-published">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No products are published yet</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Your storefront won't show any products until you publish them. Use the toggle next to each product below to make it visible to visitors.
            </p>
            <Link href={`/s/${activeStore?.slug}`}>
              <Button variant="outline" size="sm" className="mt-1" data-testid="button-alert-view-storefront">
                <Eye className="mr-2 h-4 w-4" />
                View Storefront
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <AnimatedStatCard
              title="Total Revenue"
              value={revenueWhole}
              prefix="$"
              suffix={`.${String(revenueCents).padStart(2, "0")}`}
              icon={DollarSign}
              delay={0}
              testId="text-total-revenue"
            />
            <AnimatedStatCard
              title="Total Orders"
              value={analytics?.totalOrders ?? 0}
              icon={ShoppingBag}
              delay={100}
              testId="text-order-count"
            />
            <AnimatedStatCard
              title="Active Products"
              value={analytics?.totalProducts ?? 0}
              icon={Package}
              delay={200}
              testId="text-product-count"
            />
            <AnimatedStatCard
              title="Avg. Order"
              value={avgWhole}
              prefix="$"
              suffix={`.${String(avgCents).padStart(2, "0")}`}
              icon={Users}
              delay={300}
              testId="text-avg-order"
            />
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
                {revenueEntries.map(([date, value], idx) => {
                  const height = maxRevenue > 0 ? Math.max(4, (value / maxRevenue) * 100) : 4;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-t-sm bg-primary/80 group-hover:bg-primary transition-all duration-500 dv-bar-grow"
                          style={{ height: `${height}%`, animationDelay: `${idx * 60}ms` } as React.CSSProperties}
                          title={`${date}: $${(value / 100).toFixed(2)}`}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-3 dv-float" />
                <p className="text-sm text-muted-foreground">No revenue yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Your first sale will light up this chart</p>
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
                  <div key={product.title} className="flex items-center gap-3 dv-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{product.title}</span>
                    <Badge variant="secondary">{product.count} sold</Badge>
                    <span className="text-sm font-bold tabular-nums">${(product.revenue / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-3 dv-float" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Your bestsellers will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics && analytics.totalOrders === 0 && analytics.totalProducts > 0 && (
        <Card className="border-dashed dv-fade-in">
          <CardContent className="flex items-center gap-4 py-5 flex-wrap">
            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Your products are ready — now share the link</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send your storefront URL to potential customers and watch orders roll in.
              </p>
            </div>
            <Link href={`/s/${activeStore?.slug}`}>
              <Button size="sm" data-testid="button-share-tip">
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Visit Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
