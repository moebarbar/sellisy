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
  AlertCircle,
  Loader2,
  Shield,
} from "lucide-react";

interface DomainInfo {
  domain: string | null;
  status: string | null;
  source: string | null;
  verifiedAt: string | null;
  cloudflareHostnameId: string | null;
}

const CNAME_TARGET = "customers.sellisy.com";

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

const STATUS_LABELS: Record<string, string> = {
  pending_dns: "Pending DNS",
  verifying: "Verifying",
  active: "Active",
  failed: "Failed",
};

export function DomainSettings() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();
  const [connectDomain, setConnectDomain] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

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
      toast({ title: "Domain connected!", description: "Now add the DNS record shown below." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to connect domain", description: err.message, variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/domains/verify/${activeStoreId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      if (data.verified) {
        toast({ title: "Domain verified!", description: "Your custom domain is live with SSL." });
      } else if (data.verificationErrors?.length > 0) {
        toast({ title: "Verification issue", description: data.verificationErrors[0], variant: "destructive" });
      } else {
        toast({ title: "Not verified yet", description: "DNS records haven't propagated. Try again in a few minutes." });
      }
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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!activeStoreId) return null;

  const hasDomain = activeStore?.customDomain;
  const domainStatus = activeStore?.domainStatus || "pending_dns";

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
    const statusLabel = STATUS_LABELS[domainStatus] || "Pending DNS";
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
              {statusLabel}
            </Badge>
            {domainStatus === "active" && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Shield className="h-3.5 w-3.5" />
                <span>SSL Active</span>
              </div>
            )}
          </div>

          {domainStatus !== "active" && (
            <div className="rounded-md border border-border p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Set up your DNS</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Go to your domain registrar and add this DNS record:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-dns-records">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">CNAME</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{dnsName}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleCopy(dnsName, "name")}
                          >
                            {copied === "name" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded" data-testid="text-dns-value">
                            {CNAME_TARGET}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleCopy(CNAME_TARGET, "target")}
                            data-testid="button-copy-dns-value"
                          >
                            {copied === "target" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  DNS changes can take a few minutes to 48 hours to propagate.
                </p>
                <p className="text-xs text-muted-foreground pl-5">
                  For root domains (e.g., yourbrand.com), use a DNS provider that supports CNAME flattening at the root.
                </p>
              </div>
            </div>
          )}

          {domainStatus === "active" && (
            <div className="rounded-md border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 p-4">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span className="font-medium">Your domain is live!</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                SSL certificate is active. Your store is accessible at{" "}
                <a href={`https://${activeStore.customDomain}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline" data-testid="link-custom-domain">
                  https://{activeStore.customDomain}
                </a>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {domainStatus !== "active" && (
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
            )}
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => {
                if (confirm("Are you sure you want to disconnect this domain?")) {
                  disconnectMutation.mutate();
                }
              }}
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
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Connect your own domain to your storefront in 3 simple steps:
          </p>
          <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside pl-1">
            <li>Enter your domain below</li>
            <li>Add the DNS record we give you at your domain registrar</li>
            <li>Click Verify — SSL is set up automatically</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="connect-domain">Domain Name</Label>
            <Input
              id="connect-domain"
              placeholder="yourdomain.com or shop.yourdomain.com"
              value={connectDomain}
              onChange={(e) => setConnectDomain(e.target.value.toLowerCase().trim())}
              data-testid="input-connect-domain"
            />
          </div>
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={!connectDomain.trim() || connectMutation.isPending}
            data-testid="button-connect-domain"
          >
            {connectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Globe className="mr-2 h-4 w-4" />
            Connect Domain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
