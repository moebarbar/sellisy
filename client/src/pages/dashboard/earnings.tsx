import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  Wallet, Copy, ExternalLink, TrendingUp, Clock, DollarSign, CheckCircle2, XCircle, Mail, Handshake,
} from "lucide-react";

type CommissionRow = {
  id: string;
  status: "pending" | "approved" | "paid" | "void";
  subtotalCents: number;
  commissionCents: number;
  commissionRateBps: number;
  lockedUntil: string;
  createdAt: string;
};

type MeRow = {
  affiliateId: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  code: string;
  status: "pending" | "active" | "paused" | "rejected";
  commissionRateBps: number;
  payoutEmail: string | null;
  clicks30d: number;
  conversions: number;
  pendingCents: number;
  paidCents: number;
  recentCommissions: CommissionRow[];
};

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const formatPercent = (bps: number) => `${(bps / 100).toFixed(0)}%`;
const buildLink = (slug: string, code: string) => `${window.location.origin}/s/${slug}/?ref=${encodeURIComponent(code)}`;

function statusBadgeFor(s: string) {
  if (s === "pending") return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />pending</Badge>;
  if (s === "approved") return <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />approved</Badge>;
  if (s === "paid") return <Badge><DollarSign className="h-3 w-3 mr-1" />paid</Badge>;
  return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />void</Badge>;
}

function PayoutEmailDialog({ row, onSaved }: { row: MeRow; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(row.payoutEmail ?? "");

  const save = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/affiliate/me/payout-email", {
        affiliateId: row.affiliateId,
        payoutEmail: email.trim(),
      });
    },
    onSuccess: () => {
      toast({ title: "Payout email updated" });
      setOpen(false);
      onSaved();
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-payout-email-${row.affiliateId}`}>
          <Mail className="h-4 w-4 mr-2" />
          {row.payoutEmail ? "Change payout email" : "Add payout email"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payout email</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="po-email">Where should we notify you about payouts?</Label>
          <Input
            id="po-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-payout-email"
          />
          <p className="text-xs text-muted-foreground">
            The store owner will also use this to send your actual commission payment (PayPal/Wise/etc).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!email.includes("@") || save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StoreCard({ row, onUpdated }: { row: MeRow; onUpdated: () => void }) {
  const { toast } = useToast();
  const link = buildLink(row.storeSlug, row.code);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied" });
  };

  return (
    <Card data-testid={`card-store-${row.affiliateId}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              {row.storeName}
              {statusBadgeFor(row.status)}
              <Badge variant="outline">{formatPercent(row.commissionRateBps)} commission</Badge>
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1">code: {row.code}</CardDescription>
          </div>
          <a
            href={`/s/${row.storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Visit store <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {row.status === "pending" ? (
          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-semibold mb-1">Awaiting approval</p>
            <p className="text-muted-foreground">
              The owner of {row.storeName} hasn't approved your application yet. You'll get an email when they do.
            </p>
          </div>
        ) : row.status === "paused" || row.status === "rejected" ? (
          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-semibold mb-1">
              {row.status === "paused" ? "Paused" : "Not approved"}
            </p>
            <p className="text-muted-foreground">
              {row.status === "paused"
                ? "Your affiliate account is currently paused. New clicks won't be attributed. Contact the owner if this is unexpected."
                : "Your application was not approved for this store."}
            </p>
          </div>
        ) : (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Your unique link</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={link} readOnly className="font-mono text-xs" data-testid={`input-affiliate-link-${row.affiliateId}`} />
                <Button onClick={copyLink} variant="outline" size="sm" data-testid={`button-copy-link-${row.affiliateId}`}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatChip icon={TrendingUp} label="Clicks (30d)" value={String(row.clicks30d)} />
              <StatChip icon={CheckCircle2} label="Conversions" value={String(row.conversions)} />
              <StatChip icon={Clock} label="Pending" value={formatMoney(row.pendingCents)} />
              <StatChip icon={DollarSign} label="Paid" value={formatMoney(row.paidCents)} />
            </div>

            {row.recentCommissions.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Recent commissions</Label>
                <div className="mt-2 space-y-1">
                  {row.recentCommissions.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted">
                      <div className="flex items-center gap-2">
                        {statusBadgeFor(c.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatPercent(c.commissionRateBps)} of {formatMoney(c.subtotalCents)} ·{" "}
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-semibold">{formatMoney(c.commissionCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Payout email: {row.payoutEmail || <span className="italic">not set</span>}
          </p>
          <PayoutEmailDialog row={row} onSaved={onUpdated} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}

export default function EarningsPage() {
  const { data, isLoading, refetch } = useQuery<MeRow[]>({
    queryKey: ["/api/affiliate/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/affiliate/me");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-16">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Handshake className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">You aren't an affiliate yet</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              You're not currently affiliated with any store. When a store owner adds you as an
              affiliate (or you apply via a store's public apply page), your earnings dashboard will
              show up here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight d-page-title" data-testid="text-earnings-title">My Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Affiliate stats across {data.length} store{data.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((row) => <StoreCard key={row.affiliateId} row={row} onUpdated={refetch} />)}
      </div>
    </div>
  );
}
