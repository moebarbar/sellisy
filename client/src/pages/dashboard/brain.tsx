// Sellisy Brain — the weekly AI growth advisor. Renders the latest report
// (summary, metric tiles, prioritized action list with deep links) with
// on-demand generation for the first run and a once-a-day refresh.
// Growth-tier gated: basic users see the upsell card (the API enforces it).

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BrainCircuit, Sparkles, Loader2, ArrowRight, Store,
  TrendingUp, TrendingDown, Users, ShoppingCart, Percent, RefreshCw, Crown,
} from "lucide-react";

type BrainAction = { title: string; body: string; linkPath: string; priority: 1 | 2 | 3 };

type BrainMetrics = {
  revenueCents: number;
  prevRevenueCents: number;
  orders: number;
  prevOrders: number;
  uniqueVisitors: number;
  conversionRate: number;
  checkoutStarts: number;
  newsletterSubscribers: number;
};

type BrainReport = {
  id: string;
  summary: string;
  actions: BrainAction[];
  metrics: BrainMetrics;
  createdAt: string;
};

const PRIORITY_STYLE: Record<number, { label: string; cls: string }> = {
  1: { label: "Do first", cls: "bg-primary/15 text-primary" },
  2: { label: "This week", cls: "bg-muted text-muted-foreground" },
  3: { label: "When you can", cls: "bg-muted text-muted-foreground" },
};

function deltaPct(cur: number, prev: number): { text: string; up: boolean } | null {
  if (prev === 0) return cur > 0 ? { text: "new", up: true } : null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { text: `${pct >= 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
}

export default function BrainPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { toast } = useToast();
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const { data, isLoading } = useQuery<{ report: BrainReport | null }>({
    queryKey: ["/api/stores", activeStoreId, "brain"],
    queryFn: async () => {
      const res = await fetch(`/api/stores/${activeStoreId}/brain`, { credentials: "include" });
      if (res.status === 403) {
        setUpgradeRequired(true);
        return { report: null };
      }
      if (!res.ok) throw new Error("Failed to load report");
      setUpgradeRequired(false);
      return res.json();
    },
    enabled: !!activeStoreId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/stores/${activeStoreId}/brain/generate`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Generation failed");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "brain"] });
      toast({ title: "Report ready", description: "Your fresh action plan is below." });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't generate", description: err.message, variant: "destructive" });
    },
  });

  if (!storesLoading && !activeStoreId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No store selected</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Use the store switcher at the top to select or create a store.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = data?.report ?? null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-brain-title">
            <BrainCircuit className="h-6 w-6 text-primary" /> Sellisy Brain
          </h1>
          <p className="text-muted-foreground mt-1">
            Your weekly growth advisor — real numbers in, prioritized actions out.
          </p>
        </div>
        {report && !upgradeRequired && (
          <Button
            variant="outline"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            data-testid="button-brain-regenerate"
          >
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {generateMutation.isPending ? "Analyzing..." : "Regenerate"}
          </Button>
        )}
      </div>

      {upgradeRequired && (
        <Card data-testid="brain-upsell">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Brain is part of the Growth plan</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-5">
              Every week, Brain reads your store's real analytics and hands you a prioritized action plan —
              what to fix, what to promote, and exactly where to do it.
            </p>
            <Link href="/dashboard/settings">
              <Button data-testid="button-brain-upgrade">View plans</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!upgradeRequired && isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {!upgradeRequired && !isLoading && !report && (
        <Card data-testid="brain-first-run">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Your first report is one click away</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-5">
              Brain analyzes your last 7 days — traffic, conversion, top products, your list — and turns it
              into a plan. After this, a fresh report lands every Monday.
            </p>
            <Button
              size="lg"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
              data-testid="button-brain-first-generate"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {generateMutation.isPending ? "Analyzing your store..." : "Generate my report"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!upgradeRequired && report && (
        <>
          <Card data-testid="brain-summary">
            <CardContent className="pt-6">
              <p className="text-base leading-relaxed">{report.summary}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Generated {new Date(report.createdAt).toLocaleString()} · based on your last 7 days
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Revenue", value: `$${(report.metrics.revenueCents / 100).toFixed(2)}`, delta: deltaPct(report.metrics.revenueCents, report.metrics.prevRevenueCents), icon: TrendingUp },
              { label: "Orders", value: String(report.metrics.orders), delta: deltaPct(report.metrics.orders, report.metrics.prevOrders), icon: ShoppingCart },
              { label: "Visitors", value: String(report.metrics.uniqueVisitors), delta: null, icon: Users },
              { label: "Conversion", value: `${report.metrics.conversionRate.toFixed(1)}%`, delta: null, icon: Percent },
            ].map((m) => (
              <Card key={m.label}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{m.value}</span>
                    {m.delta && (
                      <span className={`text-xs font-medium flex items-center gap-0.5 ${m.delta.up ? "text-emerald-500" : "text-red-500"}`}>
                        {m.delta.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {m.delta.text}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="brain-actions">
            <CardHeader>
              <CardTitle className="text-base">Your action plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.actions.map((a, i) => {
                const p = PRIORITY_STYLE[a.priority] ?? PRIORITY_STYLE[2];
                return (
                  <div key={i} className="flex items-start gap-4 rounded-xl border p-4 flex-wrap" data-testid={`brain-action-${i}`}>
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">{a.title}</span>
                        <Badge className={`border-0 text-[10px] ${p.cls}`}>{p.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                    </div>
                    <Link href={a.linkPath}>
                      <Button size="sm" variant="outline" data-testid={`button-brain-action-${i}`}>
                        Take me there <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
