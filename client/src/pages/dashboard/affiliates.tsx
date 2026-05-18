import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Plus, Store, Crown, Copy, Trash2, Pause, Play, ArrowRight,
  DollarSign, TrendingUp, Clock, CheckCircle2, XCircle,
} from "lucide-react";

type AffiliateRow = {
  id: string;
  userId: string;
  storeId: string;
  code: string;
  status: "pending" | "active" | "paused" | "rejected";
  commissionRateBps: number;
  payoutEmail: string | null;
  notes: string | null;
  createdAt: string;
  conversions: number;
  earnedCents: number;
  pendingCents: number;
};

type CommissionRow = {
  id: string;
  affiliateId: string;
  affiliateCode: string | null;
  orderId: string;
  subtotalCents: number;
  commissionRateBps: number;
  commissionCents: number;
  status: "pending" | "approved" | "paid" | "void";
  lockedUntil: string;
  createdAt: string;
};

type Stats = {
  affiliates: number;
  conversions: number;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  voidCents: number;
};

type Settings = {
  enabled: boolean;
  defaultRateBps: number;
  cookieDays: number;
  minPayoutCents: number;
  termsHtml: string;
};

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const formatPercent = (bps: number) => `${(bps / 100).toFixed(0)}%`;

function buildAffiliateLink(storeSlug: string, code: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/s/${storeSlug}/?ref=${encodeURIComponent(code)}`;
}

// ── Upgrade-gate when the user isn't on Growth+ ─────────────────────

function UpgradeGate() {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Affiliate program — Growth plan and up</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Recruit affiliates, set commission rates, and pay them out — all from this dashboard.
            Available on Growth ($29/mo) and Empire ($49/mo).
          </p>
          <Button asChild>
            <Link href="/#pricing">
              Upgrade to Growth
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stats row ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold leading-tight" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsRow({ stats }: { stats: Stats | undefined }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard icon={Users} label="Affiliates" value={String(stats.affiliates)} />
      <StatCard icon={TrendingUp} label="Conversions" value={String(stats.conversions)} />
      <StatCard icon={Clock} label="Pending" value={formatMoney(stats.pendingCents)} sub="locked until +14 days" />
      <StatCard icon={DollarSign} label="Paid" value={formatMoney(stats.paidCents)} />
    </div>
  );
}

// ── Affiliates tab ──────────────────────────────────────────────────

function InviteAffiliateDialog({ storeId, defaultRateBps, onSuccess }: { storeId: string; defaultRateBps: number; onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [rate, setRate] = useState(defaultRateBps / 100);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/affiliate/affiliates", {
        storeId,
        code: code.trim().toLowerCase(),
        commissionRateBps: Math.round(rate * 100),
        payoutEmail: payoutEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Affiliate added", description: `Code: ${code}` });
      setCode(""); setPayoutEmail(""); setNotes(""); setRate(defaultRateBps / 100);
      setOpen(false);
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: "Failed to add affiliate", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-affiliate">
          <Plus className="mr-2 h-4 w-4" />
          Add Affiliate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Affiliate</DialogTitle>
          <DialogDescription>
            Create an affiliate code. The affiliate's link will be:{" "}
            <code className="text-xs">/s/&lt;your-slug&gt;/?ref=&lt;code&gt;</code>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aff-code">Affiliate code</Label>
            <Input
              id="aff-code"
              placeholder="jane-doe"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              data-testid="input-affiliate-code"
            />
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, dashes only. Used in the URL.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aff-rate">Commission rate (%)</Label>
            <Input
              id="aff-rate"
              type="number"
              min={1}
              max={80}
              step={1}
              value={rate}
              onChange={(e) => setRate(Math.max(1, Math.min(80, Number(e.target.value))))}
              data-testid="input-affiliate-rate"
            />
            <p className="text-xs text-muted-foreground">Defaults to your store-wide rate. Override per affiliate if you want.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aff-email">Payout email (optional)</Label>
            <Input
              id="aff-email"
              type="email"
              placeholder="jane@example.com"
              value={payoutEmail}
              onChange={(e) => setPayoutEmail(e.target.value)}
              data-testid="input-affiliate-payout-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aff-notes">Internal notes (optional)</Label>
            <Input id="aff-notes" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-affiliate-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!code.trim() || create.isPending}
            data-testid="button-confirm-add-affiliate"
          >
            {create.isPending ? "Adding..." : "Add Affiliate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AffiliatesList({ storeId, storeSlug, defaultRateBps }: { storeId: string; storeSlug: string; defaultRateBps: number }) {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery<AffiliateRow[]>({
    queryKey: ["/api/affiliate/affiliates", storeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/affiliates?storeId=${storeId}`);
      return res.json();
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" }) => {
      await apiRequest("PATCH", `/api/affiliate/affiliates/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/affiliates", storeId] });
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/affiliate/affiliates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Affiliate removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/affiliates", storeId] });
    },
  });

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(buildAffiliateLink(storeSlug, code));
    toast({ title: "Link copied", description: "Share it with your affiliate." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Your affiliates</h2>
        <InviteAffiliateDialog storeId={storeId} defaultRateBps={defaultRateBps} onSuccess={refetch} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-semibold mb-1">No affiliates yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Add your first affiliate to start tracking referrals. They'll get a unique link that
              attributes any purchases back to them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((aff) => (
            <Card key={aff.id} data-testid={`card-affiliate-${aff.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-bold" data-testid={`text-affiliate-code-${aff.id}`}>
                        {aff.code}
                      </code>
                      <Badge variant={aff.status === "active" ? "default" : "secondary"}>
                        {aff.status}
                      </Badge>
                      <Badge variant="outline">{formatPercent(aff.commissionRateBps)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      {buildAffiliateLink(storeSlug, aff.code)}
                    </p>
                    {aff.notes && <p className="text-xs text-muted-foreground mt-1">{aff.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Conversions</p>
                      <p className="text-sm font-semibold">{aff.conversions}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-sm font-semibold">{formatMoney(aff.pendingCents)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="text-sm font-semibold">{formatMoney(aff.earnedCents)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(aff.code)} data-testid={`button-copy-link-${aff.id}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus.mutate({ id: aff.id, status: aff.status === "active" ? "paused" : "active" })}
                        disabled={toggleStatus.isPending}
                        data-testid={`button-toggle-${aff.id}`}
                      >
                        {aff.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteOne.mutate(aff.id)}
                        disabled={deleteOne.isPending}
                        data-testid={`button-delete-${aff.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Commissions tab ─────────────────────────────────────────────────

function CommissionsList({ storeId }: { storeId: string }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "paid" | "void">("all");
  const { data, isLoading } = useQuery<CommissionRow[]>({
    queryKey: ["/api/affiliate/commissions", storeId, filter],
    queryFn: async () => {
      const qs = filter === "all" ? "" : `&status=${filter}`;
      const res = await apiRequest("GET", `/api/affiliate/commissions?storeId=${storeId}${qs}`);
      return res.json();
    },
  });

  const statusIcon = (s: string) => {
    if (s === "pending") return <Clock className="h-3 w-3" />;
    if (s === "approved") return <CheckCircle2 className="h-3 w-3" />;
    if (s === "paid") return <DollarSign className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Commissions</h2>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40" data-testid="select-commission-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-semibold mb-1">No commissions yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Once an affiliate refers a buyer who completes a purchase, you'll see the commission here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((c) => (
            <Card key={c.id} data-testid={`card-commission-${c.id}`}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono">{c.affiliateCode || c.affiliateId.slice(0, 8)}</code>
                    <Badge variant={c.status === "paid" ? "default" : c.status === "void" ? "destructive" : "secondary"}>
                      {statusIcon(c.status)}
                      <span className="ml-1">{c.status}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order {c.orderId.slice(0, 8)} · {formatPercent(c.commissionRateBps)} of {formatMoney(c.subtotalCents)} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="text-lg font-bold">{formatMoney(c.commissionCents)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────────────

function SettingsForm({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Settings>({
    queryKey: ["/api/affiliate/settings", storeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/settings?storeId=${storeId}`);
      return res.json();
    },
  });

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [cookieDays, setCookieDays] = useState<number | null>(null);
  const [minPayout, setMinPayout] = useState<number | null>(null);

  // Hydrate local state once data loads
  if (data && enabled === null) {
    setEnabled(data.enabled);
    setRate(data.defaultRateBps / 100);
    setCookieDays(data.cookieDays);
    setMinPayout(data.minPayoutCents / 100);
  }

  const save = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/affiliate/settings", {
        storeId,
        enabled: enabled ?? undefined,
        defaultRateBps: rate !== null ? Math.round(rate * 100) : undefined,
        cookieDays: cookieDays ?? undefined,
        minPayoutCents: minPayout !== null ? Math.round(minPayout * 100) : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/settings", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/stats", storeId] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading || enabled === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate program settings</CardTitle>
        <CardDescription>Owner-controlled. Each setting applies only to this store.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Enable affiliate program</Label>
            <p className="text-sm text-muted-foreground">Off until you're ready to accept affiliates.</p>
          </div>
          <Switch checked={enabled!} onCheckedChange={setEnabled} data-testid="switch-enable-program" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Default commission rate</Label>
          <div className="flex items-center gap-3">
            <Input
              id="rate"
              type="number"
              min={1}
              max={80}
              step={1}
              value={rate ?? 20}
              onChange={(e) => setRate(Math.max(1, Math.min(80, Number(e.target.value))))}
              className="w-24"
              data-testid="input-default-rate"
            />
            <span className="text-sm text-muted-foreground">% of net order subtotal (after coupons)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Applies to new affiliates by default. You can override per-affiliate when you add them.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cookie">Cookie window</Label>
          <Select value={String(cookieDays)} onValueChange={(v) => setCookieDays(Number(v))}>
            <SelectTrigger id="cookie" className="w-40" data-testid="select-cookie-days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How long after clicking the affiliate's link a buyer can complete a purchase and still be attributed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minpayout">Minimum payout threshold</Label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              id="minpayout"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={minPayout ?? 25}
              onChange={(e) => setMinPayout(Math.max(0, Math.min(10000, Number(e.target.value))))}
              className="w-24"
              data-testid="input-min-payout"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Affiliates won't be eligible for payout until their balance crosses this amount.
          </p>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-settings">
          {save.isPending ? "Saving..." : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function AffiliatesPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { tier, isLoading: profileLoading } = useUserProfile();

  if (storesLoading || profileLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!activeStoreId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No store selected</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Use the store switcher at the top to select or create a store.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tier === "basic") {
    return <UpgradeGate />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-affiliates-title">Affiliates</h1>
        <p className="text-muted-foreground mt-1">
          Run an affiliate program for <strong>{activeStore?.name}</strong>. Affiliates promote your store,
          you pay them a cut of each sale.
        </p>
      </div>

      <StatsContainer storeId={activeStoreId} />

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates" data-testid="tab-affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="commissions" data-testid="tab-commissions">Commissions</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates">
          <AffiliatesListContainer storeId={activeStoreId} storeSlug={activeStore?.slug ?? ""} />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionsList storeId={activeStoreId} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsForm storeId={activeStoreId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsContainer({ storeId }: { storeId: string }) {
  const { data } = useQuery<Stats>({
    queryKey: ["/api/affiliate/stats", storeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/stats?storeId=${storeId}`);
      return res.json();
    },
  });
  return <StatsRow stats={data} />;
}

function AffiliatesListContainer({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/affiliate/settings", storeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/settings?storeId=${storeId}`);
      return res.json();
    },
  });
  return <AffiliatesList storeId={storeId} storeSlug={storeSlug} defaultRateBps={settings?.defaultRateBps ?? 2000} />;
}
