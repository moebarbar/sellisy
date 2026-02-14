import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Download, Loader2, Package, Eye, Store, Lock, Crown, Sparkles } from "lucide-react";
import type { Product, PlanTier } from "@shared/schema";
import { canAccessTier } from "@shared/schema";

const CATEGORIES = [
  { key: "all", label: "All Products" },
  { key: "templates", label: "Templates" },
  { key: "graphics", label: "Graphics" },
  { key: "ebooks", label: "Ebooks" },
  { key: "tools", label: "Tools" },
];

const TIER_COLORS: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  pro: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  max: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const TIER_LABELS: Record<string, string> = {
  basic: "Free",
  pro: "Pro",
  max: "Max",
};

export default function LibraryPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { tier: userTier, canAccess } = useUserProfile();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/library"],
  });

  const [importProduct, setImportProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: importedProductIds } = useQuery<string[]>({
    queryKey: ["/api/imported-products", activeStoreId],
    enabled: !!activeStoreId,
  });

  const importedSet = useMemo(() => new Set(importedProductIds || []), [importedProductIds]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">Product Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse and import platform products into {activeStore?.name}.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            variant={activeCategory === cat.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.key)}
            data-testid={`button-category-${cat.key}`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full rounded-t-md" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const isImported = activeStoreId ? importedSet.has(product.id) : false;
            const requiredTier = (product.requiredTier || "basic") as PlanTier;
            const isLocked = !canAccess(requiredTier);
            const isSoftware = product.productType === "software";

            return (
              <Card key={product.id} className={`overflow-hidden cursor-pointer ${isLocked ? "opacity-75" : "hover-elevate"}`} onClick={() => setDetailProduct(product)}>
                <CardContent className="p-0">
                  {product.thumbnailUrl && (
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className={`w-full h-full object-cover ${isLocked ? "grayscale" : ""}`}
                        data-testid={`img-product-${product.id}`}
                      />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        {isImported && (
                          <Badge variant="default" className="gap-1" data-testid={`badge-imported-${product.id}`}>
                            <Check className="h-3 w-3" />
                            Imported
                          </Badge>
                        )}
                        {requiredTier !== "basic" && (
                          <Badge className={`gap-1 border-0 ${TIER_COLORS[requiredTier]}`} data-testid={`badge-tier-${product.id}`}>
                            {requiredTier === "max" ? <Crown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                            {TIER_LABELS[requiredTier]}
                          </Badge>
                        )}
                      </div>
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="flex flex-col items-center gap-1">
                            <Lock className="h-8 w-8 text-white drop-shadow-md" />
                            <span className="text-xs font-medium text-white drop-shadow-md">
                              {TIER_LABELS[requiredTier]} Plan Required
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold leading-tight" data-testid={`text-product-title-${product.id}`}>
                        {product.title}
                      </h3>
                      <Badge variant="secondary" className="shrink-0">
                        ${(product.priceCents / 100).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{product.category}</Badge>
                      {isSoftware && (
                        <Badge variant="outline" className="text-xs">Software</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); setDetailProduct(product); }}
                        data-testid={`button-view-${product.id}`}
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        Details
                      </Button>
                      {isLocked ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); setDetailProduct(product); }}
                          data-testid={`button-upgrade-${product.id}`}
                        >
                          <Lock className="mr-2 h-3.5 w-3.5" />
                          Upgrade
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          disabled={isImported}
                          onClick={(e) => { e.stopPropagation(); if (!isImported) setImportProduct(product); }}
                          data-testid={`button-import-${product.id}`}
                        >
                          {isImported ? (
                            <>
                              <Check className="mr-2 h-3.5 w-3.5" />
                              Imported
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-3.5 w-3.5" />
                              Import
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground">
              {activeCategory === "all"
                ? "The platform library is empty. Check back later."
                : "No products in this category. Try another filter."}
            </p>
          </CardContent>
        </Card>
      )}

      <ProductDetailDialog
        product={detailProduct}
        isImported={detailProduct && activeStoreId ? importedSet.has(detailProduct.id) : false}
        isLocked={detailProduct ? !canAccess((detailProduct.requiredTier || "basic") as PlanTier) : false}
        userTier={userTier}
        onClose={() => setDetailProduct(null)}
        onImport={(product) => {
          setDetailProduct(null);
          setImportProduct(product);
        }}
      />

      <ImportDialog
        product={importProduct}
        storeId={activeStoreId}
        storeName={activeStore?.name || ""}
        onClose={() => setImportProduct(null)}
      />
    </div>
  );
}

function ProductDetailDialog({
  product,
  isImported,
  isLocked,
  userTier,
  onClose,
  onImport,
}: {
  product: Product | null;
  isImported: boolean;
  isLocked: boolean;
  userTier: PlanTier;
  onClose: () => void;
  onImport: (product: Product) => void;
}) {
  const requiredTier = (product?.requiredTier || "basic") as PlanTier;

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle data-testid="text-detail-title">{product?.title}</DialogTitle>
          <DialogDescription>Product details and information</DialogDescription>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            {product.thumbnailUrl && (
              <div className="relative rounded-md overflow-hidden bg-muted aspect-square">
                <img
                  src={product.thumbnailUrl}
                  alt={product.title}
                  className={`w-full h-full object-cover ${isLocked ? "grayscale" : ""}`}
                  data-testid="img-detail-product"
                />
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="h-10 w-10 text-white drop-shadow-md" />
                      <span className="text-sm font-medium text-white drop-shadow-md">
                        {TIER_LABELS[requiredTier]} Plan Required
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" data-testid="text-detail-source">
                  {product.source === "PLATFORM" ? "Platform Product" : "User Product"}
                </Badge>
                <Badge variant="outline" className="capitalize">{product.category}</Badge>
                {requiredTier !== "basic" && (
                  <Badge className={`gap-1 border-0 ${TIER_COLORS[requiredTier]}`}>
                    {requiredTier === "max" ? <Crown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {TIER_LABELS[requiredTier]}
                  </Badge>
                )}
                {product.productType === "software" && (
                  <Badge variant="outline">Software</Badge>
                )}
              </div>
              <span className="text-xl font-bold" data-testid="text-detail-price">
                ${(product.priceCents / 100).toFixed(2)}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p className="text-sm leading-relaxed" data-testid="text-detail-description">
                {product.description || "No description available."}
              </p>
            </div>

            {isLocked ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Upgrade to {TIER_LABELS[requiredTier]} to access this product
                </p>
                <p className="text-xs text-muted-foreground">
                  Your current plan: {TIER_LABELS[userTier]}
                </p>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={isImported}
                onClick={() => onImport(product)}
                data-testid="button-detail-import"
              >
                {isImported ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Already Imported
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import to Store
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  product,
  storeId,
  storeName,
  onClose,
}: {
  product: Product | null;
  storeId: string;
  storeName: string;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/store-products", {
        storeId,
        productId: product!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/imported-products", storeId] });
      toast({
        title: "Product imported",
        description: `"${product?.title}" has been added to ${storeName}.`,
      });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Product</DialogTitle>
          <DialogDescription>
            Import "{product?.title}" into {storeName}?
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel-import">
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={mutation.isPending || !storeId}
            onClick={() => mutation.mutate()}
            data-testid="button-confirm-import"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
