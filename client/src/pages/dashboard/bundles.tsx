import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Layers, Plus, Trash2, Store } from "lucide-react";
import type { StoreProduct, Product } from "@shared/schema";

type StoreProductWithProduct = StoreProduct & { product: Product };

export default function BundlesPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const { data: storeBundles, isLoading: bundlesLoading } = useQuery<any[]>({
    queryKey: ["/api/bundles", activeStoreId],
    enabled: !!activeStoreId,
  });

  const { data: storeProducts } = useQuery<StoreProductWithProduct[]>({
    queryKey: ["/api/store-products", activeStoreId],
    enabled: !!activeStoreId,
  });

  const createBundleMutation = useMutation({
    mutationFn: async () => {
      const priceCents = Math.round(parseFloat(bundlePrice) * 100);
      await apiRequest("POST", "/api/bundles", {
        storeId: activeStoreId,
        name: bundleName,
        description: bundleDescription || null,
        priceCents,
        productIds: selectedProductIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundles", activeStoreId] });
      toast({ title: "Bundle created successfully" });
      setDialogOpen(false);
      setBundleName("");
      setBundleDescription("");
      setBundlePrice("");
      setSelectedProductIds([]);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create bundle", description: err.message, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      await apiRequest("PATCH", `/api/bundles/${id}`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundles", activeStoreId] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update bundle", description: err.message, variant: "destructive" });
    },
  });

  const deleteBundleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bundles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundles", activeStoreId] });
      toast({ title: "Bundle deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete bundle", description: err.message, variant: "destructive" });
    },
  });

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const selectedTotal = storeProducts
    ? storeProducts
        .filter((sp) => selectedProductIds.includes(sp.productId))
        .reduce((sum, sp) => sum + sp.product.priceCents, 0)
    : 0;

  const bundlePriceCents = bundlePrice ? Math.round(parseFloat(bundlePrice) * 100) : 0;
  const savings = selectedTotal - bundlePriceCents;

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
              Use the store switcher at the top to select or create a store.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-bundles-title">Bundles</h1>
          <p className="text-muted-foreground mt-1">Product bundles for {activeStore?.name}.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-bundle">
              <Plus className="mr-2 h-4 w-4" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bundle</DialogTitle>
              <DialogDescription>Group products together at a discounted price.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="bundle-name">Bundle Name</Label>
                <Input
                  id="bundle-name"
                  placeholder="e.g. Starter Pack"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  data-testid="input-bundle-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundle-description">Description</Label>
                <Textarea
                  id="bundle-description"
                  placeholder="Describe this bundle..."
                  value={bundleDescription}
                  onChange={(e) => setBundleDescription(e.target.value)}
                  data-testid="input-bundle-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundle-price">Bundle Price ($)</Label>
                <Input
                  id="bundle-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  data-testid="input-bundle-price"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Products (at least 2)</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {storeProducts && storeProducts.length > 0 ? (
                    storeProducts.map((sp) => (
                      <label key={sp.productId} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={selectedProductIds.includes(sp.productId)}
                          onCheckedChange={() => toggleProductSelection(sp.productId)}
                        />
                        <span className="flex-1 text-sm truncate">{sp.product.title}</span>
                        <span className="text-sm text-muted-foreground">
                          ${(sp.product.priceCents / 100).toFixed(2)}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No products available. Import some first.</p>
                  )}
                </div>
              </div>
              {selectedProductIds.length >= 2 && bundlePriceCents > 0 && (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
                  <div className="flex justify-between">
                    <span>Individual total:</span>
                    <span>${(selectedTotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bundle price:</span>
                    <span>${(bundlePriceCents / 100).toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Savings:</span>
                      <span>${(savings / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full"
                disabled={
                  !bundleName.trim() ||
                  !bundlePrice ||
                  parseFloat(bundlePrice) <= 0 ||
                  selectedProductIds.length < 2 ||
                  createBundleMutation.isPending
                }
                onClick={() => createBundleMutation.mutate()}
                data-testid="button-submit-bundle"
              >
                {createBundleMutation.isPending ? "Creating..." : "Create Bundle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bundlesLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : storeBundles && storeBundles.length > 0 ? (
        <div className="space-y-3">
          {storeBundles.map((bundle: any) => (
            <Card key={bundle.id} data-testid={`card-bundle-${bundle.id}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{bundle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bundle.products?.length ?? 0} products · ${(bundle.priceCents / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={bundle.isPublished ? "default" : "secondary"}>
                    {bundle.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Switch
                    checked={bundle.isPublished}
                    onCheckedChange={(checked) =>
                      togglePublishMutation.mutate({ id: bundle.id, isPublished: checked })
                    }
                    disabled={togglePublishMutation.isPending}
                    data-testid={`switch-bundle-publish-${bundle.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBundleMutation.mutate(bundle.id)}
                    disabled={deleteBundleMutation.isPending}
                    data-testid={`button-delete-bundle-${bundle.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-3">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No bundles yet</h3>
            <p className="text-sm text-muted-foreground">
              Create a bundle to offer product packs at a discounted price.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
