import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, Download, Loader2, Package, Eye, Store, Lock, Crown, Sparkles, Plus, Trash2, Upload, ImagePlus, Star, X, FileIcon, Link as LinkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ProductPlaceholder } from "@/components/product-placeholder";
import { ProtectedImage } from "@/components/protected-image";
import type { Product, PlanTier } from "@shared/schema";
import { canAccessTier, PLAN_FEATURES } from "@shared/schema";

function buildCategoryFilters(products: Product[] | undefined) {
  const cats = new Set<string>();
  (products || []).forEach((p) => {
    if (p.category) cats.add(p.category);
  });
  const sorted = Array.from(cats).sort();
  return [
    { key: "all", label: "All Products" },
    ...sorted.map((c) => ({ key: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
  ];
}

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
  const { tier: userTier, canAccess, isAdmin } = useUserProfile();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/library"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [importProduct, setImportProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: importedProductIds } = useQuery<string[]>({
    queryKey: ["/api/imported-products", activeStoreId],
    enabled: !!activeStoreId,
  });

  const importedSet = useMemo(() => new Set(importedProductIds || []), [importedProductIds]);

  const categoryFilters = useMemo(() => buildCategoryFilters(products), [products]);

  const [showBulkImport, setShowBulkImport] = useState(false);

  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const quickImport = useMutation({
    mutationFn: async (product: Product) => {
      if (!activeStoreId) throw new Error("No store selected");
      setImportingIds(prev => new Set(prev).add(product.id));
      await apiRequest("POST", "/api/store-products", {
        storeId: activeStoreId,
        productId: product.id,
      });
      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", activeStoreId] });
      queryClient.invalidateQueries({ queryKey: ["/api/imported-products", activeStoreId] });
      setImportingIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
      toast({
        title: "Product imported",
        description: `"${product.title}" added to ${activeStore?.name}.`,
      });
    },
    onError: (err: any, product) => {
      setImportingIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!filteredProducts) return;
    setSelectedIds(prev => {
      if (prev.size === filteredProducts.length && filteredProducts.length > 0) return new Set();
      return new Set(filteredProducts.map(p => p.id));
    });
  }, [filteredProducts]);

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("DELETE", "/api/products/bulk", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/library"] });
      toast({ title: "Products deleted", description: `${selectedIds.size} product(s) removed.` });
      setSelectedIds(new Set());
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const bulkStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await apiRequest("PATCH", "/api/products/bulk-status", { ids, status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/library"] });
      toast({ title: "Status updated", description: `${selectedIds.size} product(s) set to ${status}.` });
      setSelectedIds(new Set());
    },
    onError: (err: any) => {
      toast({ title: "Status update failed", description: err.message, variant: "destructive" });
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
        <div className="flex items-center gap-3">
          {isAdmin && filteredProducts.length > 0 && (
            <Checkbox
              checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={toggleSelectAll}
              data-testid="checkbox-select-all"
              aria-label="Select all products"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">Products Library</h1>
            <p className="text-muted-foreground mt-1">
              {filteredProducts.length > 0 ? (
                <span data-testid="text-product-count">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} available</span>
              ) : (
                <>Browse and import platform products into {activeStore?.name}.</>
              )}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowBulkImport(true)} data-testid="button-add-product">
            <Plus className="mr-2 h-4 w-4" />
            Add to Library
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categoryFilters.map((cat) => (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const isImported = activeStoreId ? importedSet.has(product.id) : false;
            const requiredTier = (product.requiredTier || "basic") as PlanTier;
            const isLocked = !canAccess(requiredTier);
            const isSoftware = product.productType === "software";

            return (
              <Card key={product.id} className={`overflow-hidden cursor-pointer ${isLocked ? "opacity-75" : "hover-elevate"}`} onClick={() => setDetailProduct(product)}>
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {isAdmin && (
                      <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                          data-testid={`checkbox-product-${product.id}`}
                          aria-label={`Select ${product.title}`}
                          className="bg-background/80"
                        />
                      </div>
                    )}
                    {product.thumbnailUrl ? (
                      <ProtectedImage
                        protected={!PLAN_FEATURES[userTier].allowImageDownload}
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className={`w-full h-full object-cover ${isLocked ? "grayscale" : ""}`}
                        data-testid={`img-product-${product.id}`}
                      />
                    ) : (
                      <ProductPlaceholder productType={product.productType} title={product.title} />
                    )}
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
                      {product.productType && product.productType !== "digital" && (
                        <Badge variant="outline" className="text-xs capitalize">{product.productType}</Badge>
                      )}
                      {product.tags && product.tags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
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
                          variant={isImported ? "secondary" : "default"}
                          size="sm"
                          className="flex-1"
                          disabled={isImported || importingIds.has(product.id)}
                          onClick={(e) => { e.stopPropagation(); if (!isImported) quickImport.mutate(product); }}
                          data-testid={`button-import-${product.id}`}
                        >
                          {importingIds.has(product.id) ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Importing...
                            </>
                          ) : isImported ? (
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

      {isAdmin && selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-md border bg-background px-4 py-3 shadow-lg"
          data-testid="bulk-actions-bar"
        >
          <span className="text-sm font-medium whitespace-nowrap" data-testid="text-selected-count">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={bulkDelete.isPending}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkStatus.mutate({ ids: Array.from(selectedIds), status: "ACTIVE" })}
            disabled={bulkStatus.isPending}
            data-testid="button-bulk-set-active"
          >
            Set Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkStatus.mutate({ ids: Array.from(selectedIds), status: "DRAFT" })}
            disabled={bulkStatus.isPending}
            data-testid="button-bulk-set-draft"
          >
            Set Draft
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            data-testid="button-deselect-all"
          >
            Deselect All
          </Button>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} product(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected products will be permanently removed from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate(Array.from(selectedIds))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDelete.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProductDetailDialog
        product={detailProduct}
        isImported={detailProduct && activeStoreId ? importedSet.has(detailProduct.id) : false}
        isLocked={detailProduct ? !canAccess((detailProduct.requiredTier || "basic") as PlanTier) : false}
        userTier={userTier}
        onClose={() => setDetailProduct(null)}
        onImport={(product) => {
          setDetailProduct(null);
          quickImport.mutate(product);
        }}
      />

      <ImportDialog
        product={importProduct}
        storeId={activeStoreId}
        storeName={activeStore?.name || ""}
        onClose={() => setImportProduct(null)}
      />

      <AddProductDialog
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />
    </div>
  );
}

function ImageCarousel({ images, isLocked, requiredTier, imageProtected }: { images: { url: string }[]; isLocked: boolean; requiredTier: PlanTier; imageProtected: boolean }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  const prev = () => scrollTo((current - 1 + total) % total);
  const next = () => scrollTo((current + 1) % total);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCurrent(idx);
  }, []);

  if (total === 0) return null;

  return (
    <div className="relative rounded-md overflow-hidden bg-muted aspect-square group" data-testid="carousel-container">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {images.map((img, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 snap-center">
            <ProtectedImage
              protected={imageProtected}
              src={img.url}
              alt={`Image ${i + 1} of ${total}`}
              className={`w-full h-full object-cover ${isLocked ? "grayscale" : ""}`}
              data-testid={i === 0 ? "img-detail-product" : `img-carousel-${i}`}
            />
          </div>
        ))}
      </div>
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <Lock className="h-10 w-10 text-white drop-shadow-md" />
            <span className="text-sm font-medium text-white drop-shadow-md">
              {TIER_LABELS[requiredTier]} Plan Required
            </span>
          </div>
        </div>
      )}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" data-testid="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-4" : "bg-white/50"}`}
                data-testid={`button-carousel-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
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

  const { data: productImages } = useQuery<{ id: string; url: string; sortOrder: number; isPrimary: boolean }[]>({
    queryKey: [`/api/products/${product?.id}/images`],
    enabled: !!product,
  });

  const carouselImages = useMemo(() => {
    if (productImages && productImages.length > 0) {
      return [...productImages].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    if (product?.thumbnailUrl) return [{ url: product.thumbnailUrl }];
    return [];
  }, [productImages, product?.thumbnailUrl]);

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle data-testid="text-detail-title">{product?.title}</DialogTitle>
          <DialogDescription>Product details and information</DialogDescription>
        </DialogHeader>
        {product && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {carouselImages.length > 0 && (
              <ImageCarousel images={carouselImages} isLocked={isLocked} requiredTier={requiredTier} imageProtected={!PLAN_FEATURES[userTier].allowImageDownload} />
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
              <p className="text-sm leading-relaxed whitespace-pre-line" data-testid="text-detail-description">
                {product.description || "No description available."}
              </p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {product.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-tag-${i}`}>{tag}</Badge>
                ))}
              </div>
            )}

            {(product.accessUrl || product.redemptionCode || product.deliveryInstructions) && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">Customer Delivery Info</h4>
                {product.accessUrl && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Access URL: </span>
                    <a href={product.accessUrl} target="_blank" rel="noreferrer" className="underline" data-testid="link-detail-access-url">{product.accessUrl}</a>
                  </div>
                )}
                {product.redemptionCode && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Redemption Code: </span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{product.redemptionCode}</code>
                  </div>
                )}
                {product.deliveryInstructions && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Instructions: </span>
                    <span className="whitespace-pre-line">{product.deliveryInstructions}</span>
                  </div>
                )}
              </div>
            )}

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

type UploadedImage = {
  url: string;
  isThumbnail: boolean;
};

function AddProductDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { uploadFile: uploadImageFile, isUploading, progress } = useUpload();
  const { uploadFile: uploadDeliverableFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliverableInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("templates");
  const [productType, setProductType] = useState("digital");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [redemptionCode, setRedemptionCode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileDelivery, setFileDelivery] = useState<"upload" | "url">("upload");
  const [fileUploading, setFileUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setPrice("");
    setOriginalPrice("");
    setCategory("templates");
    setProductType("digital");
    setDescription("");
    setTagsInput("");
    setAccessUrl("");
    setRedemptionCode("");
    setDeliveryInstructions("");
    setFileUrl("");
    setFileName("");
    setFileDelivery("upload");
    setImages([]);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    try {
      const result = await uploadDeliverableFile(file);
      if (result) {
        setFileUrl(result.objectPath);
        setFileName(file.name);
      }
    } catch {
      toast({ title: "File upload failed", variant: "destructive" });
    }
    setFileUploading(false);
    if (deliverableInputRef.current) deliverableInputRef.current.value = "";
  };

  const handleImageUpload = useCallback(async (files: FileList) => {
    const remaining = 5 - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) {
      toast({ title: "Maximum 5 images", variant: "destructive" });
      return;
    }

    setUploadingImages(true);
    const newImages: UploadedImage[] = [];
    for (const file of toUpload) {
      const result = await uploadImageFile(file);
      if (result) {
        newImages.push({ url: result.objectPath, isThumbnail: false });
      }
    }

    setImages((prev) => {
      const combined = [...prev, ...newImages];
      if (!combined.some((img) => img.isThumbnail) && combined.length > 0) {
        combined[0].isThumbnail = true;
      }
      return combined;
    });
    setUploadingImages(false);
  }, [images.length, uploadImageFile, toast]);

  const setThumbnail = useCallback((index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isThumbnail: i === index })));
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isThumbnail)) {
        next[0].isThumbnail = true;
      }
      return next;
    });
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const priceCents = Math.round((parseFloat(price) || 0) * 100);
      const origCents = originalPrice ? Math.round(parseFloat(originalPrice) * 100) : null;
      const thumbnailImg = images.find((img) => img.isThumbnail) || images[0];

      const parsedTags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

      const productData = {
        title: title.trim(),
        priceCents,
        originalPriceCents: origCents,
        category: category || "templates",
        productType: productType || "digital",
        description: description || null,
        thumbnailUrl: thumbnailImg?.url || null,
        accessUrl: accessUrl || null,
        redemptionCode: redemptionCode || null,
        deliveryInstructions: deliveryInstructions || null,
        fileUrl: fileUrl || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        images: images.map((img, i) => ({
          url: img.url,
          sortOrder: i,
          isPrimary: img.isThumbnail,
        })),
      };

      const res = await apiRequest("POST", "/api/products/bulk-import", { products: [productData] });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/library"] });
      toast({ title: "Product added to library" });
      resetForm();
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to add product", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={() => { if (!mutation.isPending && !uploadingImages && !fileUploading) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Product to Library</DialogTitle>
          <DialogDescription>
            Add a new product that any store can import. Upload up to 5 images.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label htmlFor="add-title">Title *</Label>
            <Input
              id="add-title"
              placeholder="Product title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-add-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-price">Price ($)</Label>
              <Input
                id="add-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                data-testid="input-add-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-original-price">Original Price ($ MSRP)</Label>
              <Input
                id="add-original-price"
                type="number"
                step="0.01"
                placeholder="Optional"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                data-testid="input-add-original-price"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-add-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="templates">Templates</SelectItem>
                  <SelectItem value="graphics">Graphics</SelectItem>
                  <SelectItem value="ebooks">Ebooks</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger data-testid="select-add-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="ebook">Ebook</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="graphics">Graphics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-description">Description *</Label>
            <Textarea
              id="add-description"
              placeholder="Detailed product description shown to customers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              data-testid="input-add-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-tags">Tags</Label>
            <Input
              id="add-tags"
              placeholder="analytics, saas, lifetime-deal (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              data-testid="input-add-tags"
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Product Images (up to 5)</Label>
              <span className="text-xs text-muted-foreground">{images.length}/5 uploaded</span>
            </div>
            <p className="text-xs text-muted-foreground">Best practice: use square images at 512x512 pixels for consistent display</p>

            <div className="flex gap-3 flex-wrap">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative w-24 h-24 rounded-md overflow-hidden border-2 ${img.isThumbnail ? "border-primary" : "border-transparent"}`}
                  data-testid={`img-preview-${idx}`}
                >
                  <img src={img.url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-white"
                      onClick={() => setThumbnail(idx)}
                      title="Set as thumbnail"
                      data-testid={`button-set-thumbnail-${idx}`}
                    >
                      <Star className={`h-4 w-4 ${img.isThumbnail ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-white"
                      onClick={() => removeImage(idx)}
                      title="Remove"
                      data-testid={`button-remove-image-${idx}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {img.isThumbnail && (
                    <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0">Thumb</Badge>
                  )}
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-muted-foreground/60 transition-colors"
                  data-testid="button-upload-images"
                >
                  {uploadingImages ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                  <span className="text-[10px]">{uploadingImages ? `${progress}%` : "Add"}</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleImageUpload(e.target.files);
                  e.target.value = "";
                }
              }}
              data-testid="input-image-files"
            />
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-3">Customer Delivery (shown to buyers after purchase)</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-access-url">Product Access URL</Label>
                  <Input
                    id="add-access-url"
                    placeholder="https://app.example.com/register"
                    value={accessUrl}
                    onChange={(e) => setAccessUrl(e.target.value)}
                    data-testid="input-add-access-url"
                  />
                  <p className="text-xs text-muted-foreground">Link customers use to access the product</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-redemption">Redemption / License Code</Label>
                  <Input
                    id="add-redemption"
                    placeholder="ABC123-XYZ789"
                    value={redemptionCode}
                    onChange={(e) => setRedemptionCode(e.target.value)}
                    data-testid="input-add-redemption"
                  />
                  <p className="text-xs text-muted-foreground">Code customers redeem to activate</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deliverable File</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={fileDelivery === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setFileDelivery("upload"); setFileUrl(""); setFileName(""); }}
                    data-testid="button-add-file-upload-mode"
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={fileDelivery === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setFileDelivery("url"); setFileUrl(""); setFileName(""); }}
                    data-testid="button-add-file-url-mode"
                  >
                    <LinkIcon className="mr-2 h-3.5 w-3.5" />
                    External URL
                  </Button>
                </div>
                {fileDelivery === "upload" ? (
                  <div className="space-y-1">
                    {fileUrl ? (
                      <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <FileIcon className="h-4 w-4 shrink-0 text-green-600" />
                          <span className="truncate">{fileName || "File uploaded"}</span>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => { setFileUrl(""); setFileName(""); }}
                          data-testid="button-remove-file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          ref={deliverableInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          disabled={fileUploading}
                          data-testid="input-add-file-upload"
                        />
                        {fileUploading && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <Input
                    type="url"
                    placeholder="https://example.com/download/product.zip"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    data-testid="input-add-file-url"
                  />
                )}
                <p className="text-xs text-muted-foreground">The file customers will download after purchase</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-delivery">Delivery Instructions</Label>
                <Textarea
                  id="add-delivery"
                  placeholder={"Step-by-step instructions shown to customers after purchase...\n\n1. Go to https://...\n2. Create your account\n3. Enter your redemption code\n4. Start using the product"}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  rows={4}
                  data-testid="input-add-delivery"
                />
                <p className="text-xs text-muted-foreground">Step-by-step guide shown on customer order page</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t">
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }} data-testid="button-cancel-add">
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending || !title.trim() || uploadingImages || fileUploading}
            onClick={() => mutation.mutate()}
            data-testid="button-save-product"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
