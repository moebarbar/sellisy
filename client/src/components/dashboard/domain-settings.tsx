import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useActiveStore } from "@/lib/store-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Check,
  X,
  Copy,
  RefreshCw,
  Search,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DomainInfo {
  domain: string | null;
  status: string | null;
  source: string | null;
  verifiedAt: string | null;
  purchasedDomain?: {
    registrationDate: string | null;
    expirationDate: string | null;
    autoRenew: boolean;
    registrar: string;
  } | null;
}

interface DomainCheckResult {
  available: boolean;
  domain: string;
  price?: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_dns: { label: "Pending DNS", variant: "outline" },
  verifying: { label: "Verifying", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending_dns":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 no-default-hover-elevate no-default-active-elevate";
    case "verifying":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 no-default-hover-elevate no-default-active-elevate";
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 no-default-hover-elevate no-default-active-elevate";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 no-default-hover-elevate no-default-active-elevate";
    default:
      return "";
  }
}

function getDnsName(domain: string): string {
  const parts = domain.split(".");
  if (parts.length > 2) {
    return parts.slice(0, parts.length - 2).join(".");
  }
  return "@";
}

export function DomainSettings() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"connect" | "buy">("connect");
  const [connectDomain, setConnectDomain] = useState("");
  const [searchDomain, setSearchDomain] = useState("");
  const [checkResult, setCheckResult] = useState<DomainCheckResult | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: domainInfo, isLoading: domainLoading } = useQuery<DomainInfo>({
    queryKey: ["/api/domains", activeStoreId],
    enabled: !!activeStoreId,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/domains/connect`, { storeId: activeStoreId, domain: connectDomain });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setConnectDomain("");
      toast({ title: "Domain connected", description: "Configure your DNS records to complete setup." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to connect domain", description: err.message, variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/domains/verify/${activeStoreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "DNS verification started" });
    },
    onError: (err: any) => {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/domains/${activeStoreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Domain disconnected" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to disconnect domain", description: err.message, variant: "destructive" });
    },
  });

  const checkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/domains/check?domain=${encodeURIComponent(searchDomain)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check domain");
      return await res.json();
    },
    onSuccess: (data: DomainCheckResult) => {
      setCheckResult(data);
    },
    onError: (err: any) => {
      toast({ title: "Failed to check domain", description: err.message, variant: "destructive" });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/domains/purchase`, {
        storeId: activeStoreId,
        domain: checkResult?.domain,
        contact: { firstName: "", lastName: "", address: "", city: "", state: "", postalCode: "", country: "", phone: "", email: "" },
        years: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setCheckResult(null);
      setSearchDomain("");
      toast({ title: "Domain purchased", description: "Your domain has been registered and connected." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to purchase domain", description: err.message, variant: "destructive" });
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeStoreId) return null;

  const hasDomain = activeStore?.customDomain;
  const domainStatus = activeStore?.domainStatus || "pending_dns";
  const domainSource = activeStore?.domainSource;
  const hostname = typeof window !== "undefined" ? window.location.hostname : "your-app.replit.app";

  if (domainLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Custom Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (hasDomain) {
    const statusInfo = STATUS_BADGES[domainStatus] || STATUS_BADGES.pending_dns;
    const dnsName = getDnsName(activeStore.customDomain!);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Custom Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-semibold" data-testid="text-domain-name">
              {activeStore.customDomain}
            </span>
            <Badge
              className={getStatusBadgeClass(domainStatus)}
              data-testid="badge-domain-status"
            >
              {statusInfo.label}
            </Badge>
          </div>

          {domainStatus !== "active" && (
            <div className="rounded-md border border-border p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold">Configure your DNS</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Add the following DNS record at your domain registrar:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-dns-records">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">CNAME</td>
                      <td className="py-2 pr-4 font-mono text-xs">{dnsName}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded" data-testid="text-dns-value">
                            {hostname}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopy(hostname)}
                            data-testid="button-copy-dns-value"
                          >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                DNS changes can take up to 48 hours to propagate
              </p>
            </div>
          )}

          {domainSource === "namecheap" && domainInfo?.purchasedDomain && (
            <div className="rounded-md border border-border p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Purchased Domain Info
              </h4>
              <div className="grid gap-1 text-xs text-muted-foreground">
                {domainInfo.purchasedDomain.registrationDate && (
                  <p data-testid="text-registration-date">
                    Registered: {new Date(domainInfo.purchasedDomain.registrationDate).toLocaleDateString()}
                  </p>
                )}
                {domainInfo.purchasedDomain.expirationDate && (
                  <p data-testid="text-expiration-date">
                    Expires: {new Date(domainInfo.purchasedDomain.expirationDate).toLocaleDateString()}
                  </p>
                )}
                <p>Auto-renew: {domainInfo.purchasedDomain.autoRenew ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              data-testid="button-verify-dns"
            >
              {verifyMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Verify DNS
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              data-testid="button-disconnect-domain"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Disconnect Domain
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Custom Domain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1">
          <Button
            variant={activeTab === "connect" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("connect")}
            data-testid="button-tab-connect"
          >
            Connect Your Domain
          </Button>
          <Button
            variant={activeTab === "buy" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("buy")}
            data-testid="button-tab-buy"
          >
            Buy a Domain
          </Button>
        </div>

        {activeTab === "connect" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="connect-domain">Domain Name</Label>
              <Input
                id="connect-domain"
                placeholder="yourdomain.com or shop.yourdomain.com"
                value={connectDomain}
                onChange={(e) => setConnectDomain(e.target.value)}
                data-testid="input-connect-domain"
              />
            </div>
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={!connectDomain.trim() || connectMutation.isPending}
              data-testid="button-connect-domain"
            >
              {connectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Domain
            </Button>
            <p className="text-xs text-muted-foreground">
              Point your existing domain to your Sellisy store
            </p>
          </div>
        )}

        {activeTab === "buy" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="search-domain">Search for a Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="search-domain"
                  placeholder="search for a domain..."
                  value={searchDomain}
                  onChange={(e) => setSearchDomain(e.target.value)}
                  data-testid="input-search-domain"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setCheckResult(null);
                    checkMutation.mutate();
                  }}
                  disabled={!searchDomain.trim() || checkMutation.isPending}
                  data-testid="button-check-availability"
                >
                  {checkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {checkResult && (
              <div className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" data-testid="text-check-domain">{checkResult.domain}</span>
                  {checkResult.available ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 no-default-hover-elevate no-default-active-elevate" data-testid="badge-availability">
                      <Check className="h-3 w-3 mr-1" /> Available
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 no-default-hover-elevate no-default-active-elevate" data-testid="badge-availability">
                      <X className="h-3 w-3 mr-1" /> Unavailable
                    </Badge>
                  )}
                </div>
                {checkResult.available && checkResult.price && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-muted-foreground" data-testid="text-domain-price">
                      {checkResult.price}/yr
                    </span>
                    <Button
                      size="sm"
                      onClick={() => purchaseMutation.mutate()}
                      disabled={purchaseMutation.isPending}
                      data-testid="button-buy-domain"
                    >
                      {purchaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Buy Domain
                    </Button>
                  </div>
                )}
              </div>
            )}

            {checkMutation.isError && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Domain purchasing is being set up
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
