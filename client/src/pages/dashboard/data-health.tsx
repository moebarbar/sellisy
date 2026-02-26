import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Wrench,
  RotateCcw,
  Package,
  Store,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Product, Store as StoreType } from "@shared/schema";

type IntegrityIssue = {
  type: string;
  severity: "warning" | "error";
  description: string;
  count: number;
};

type IntegrityReport = {
  timestamp: string;
  healthy: boolean;
  issues: IntegrityIssue[];
  stats: {
    totalProducts: number;
    totalStores: number;
    deletedProducts: number;
    deletedStores: number;
    orphanedStoreProducts: number;
    nullOwnerProducts: number;
  };
};

type RepairResult = {
  timestamp: string;
  repairs: { type: string; description: string; count: number }[];
  totalFixed: number;
};

export default function DataHealthPage() {
  const { isAdmin } = useUserProfile();
  const { toast } = useToast();

  const { data: report, isLoading: reportLoading, refetch: refetchReport } = useQuery<IntegrityReport>({
    queryKey: ["/api/admin/health-check"],
    enabled: isAdmin,
  });

  const { data: deletedProducts, isLoading: deletedProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/deleted-products"],
    enabled: isAdmin,
  });

  const { data: deletedStores, isLoading: deletedStoresLoading } = useQuery<StoreType[]>({
    queryKey: ["/api/admin/deleted-stores"],
    enabled: isAdmin,
  });

  const repairMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/repair");
      return res.json() as Promise<RepairResult>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/health-check"] });
      toast({
        title: "Repair complete",
        description: result.totalFixed > 0
          ? `Fixed ${result.totalFixed} issue(s).`
          : "No issues to fix.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Repair failed", description: err.message, variant: "destructive" });
    },
  });

  const restoreProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/restore-product/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deleted-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/health-check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/mine"] });
      toast({ title: "Product restored" });
    },
    onError: (err: any) => {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    },
  });

  const restoreStoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/restore-store/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deleted-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/health-check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Store restored" });
    },
    onError: (err: any) => {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Admin access required</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-data-health-title">Data Health</h1>
          <p className="text-muted-foreground mt-1">Monitor and protect platform data integrity.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetchReport()}
            disabled={reportLoading}
            data-testid="button-refresh-health"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${reportLoading ? "animate-spin" : ""}`} />
            Check Health
          </Button>
          <Button
            onClick={() => repairMutation.mutate()}
            disabled={repairMutation.isPending}
            data-testid="button-run-repair"
          >
            {repairMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="mr-2 h-4 w-4" />
            )}
            Run Repair
          </Button>
        </div>
      </div>

      {reportLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Products</div>
                <div className="text-2xl font-bold" data-testid="stat-total-products">{report.stats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Stores</div>
                <div className="text-2xl font-bold" data-testid="stat-total-stores">{report.stats.totalStores}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">In Trash</div>
                <div className="text-2xl font-bold" data-testid="stat-deleted">
                  {report.stats.deletedProducts + report.stats.deletedStores}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  {report.healthy ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" data-testid="badge-health-status">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
                    </Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="badge-health-status">
                      <AlertTriangle className="h-3 w-3 mr-1" /> {report.issues.length} issue(s)
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {report.issues.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Issues Found</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {report.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {issue.severity === "error" ? (
                      <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{issue.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{issue.count} found — Type: {issue.type}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Deleted Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deletedProductsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !deletedProducts || deletedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No deleted products.</p>
          ) : (
            <div className="space-y-2">
              {deletedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-sm font-medium" data-testid={`text-deleted-product-${product.id}`}>{product.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Deleted {product.deletedAt ? new Date(product.deletedAt).toLocaleDateString() : "unknown"} — {product.source}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreProductMutation.mutate(product.id)}
                    disabled={restoreProductMutation.isPending}
                    data-testid={`button-restore-product-${product.id}`}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Deleted Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deletedStoresLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !deletedStores || deletedStores.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No deleted stores.</p>
          ) : (
            <div className="space-y-2">
              {deletedStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-sm font-medium" data-testid={`text-deleted-store-${store.id}`}>{store.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Deleted {store.deletedAt ? new Date(store.deletedAt).toLocaleDateString() : "unknown"} — /{store.slug}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreStoreMutation.mutate(store.id)}
                    disabled={restoreStoreMutation.isPending}
                    data-testid={`button-restore-store-${store.id}`}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
