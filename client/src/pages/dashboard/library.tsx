import { useState, useMemo } from "react";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Download, Loader2, Package, Eye } from "lucide-react";
import type { Product, Store } from "@shared/schema";

const CATEGORIES = [
  { key: "all", label: "All Products" },
  { key: "templates", label: "Templates" },
  { key: "graphics", label: "Graphics" },
  { key: "ebooks", label: "Ebooks" },
  { key: "tools", label: "Tools" },
];

export default function LibraryPage() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/library"],
  });
  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const [importProduct, setImportProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const allImportedProductIds = useAllImportedProductIds(stores || []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">Product Library</h1>
        <p className="text-muted-foreground mt-1">Browse platform products and import them to your store.</p>
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
            const isImported = allImportedProductIds.has(product.id);
            return (
              <Card key={product.id} className="overflow-hidden hover-elevate cursor-pointer" onClick={() => setDetailProduct(product)}>
                <CardContent className="p-0">
                  {product.thumbnailUrl && (
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-product-${product.id}`}
                      />
                      {isImported && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="default" className="gap-1" data-testid={`badge-imported-${product.id}`}>
                            <Check className="h-3 w-3" />
                            Imported
                          </Badge>
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
                    <Badge variant="outline" className="text-xs mb-2 capitalize">{product.category}</Badge>
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
        stores={stores || []}
        isImported={detailProduct ? allImportedProductIds.has(detailProduct.id) : false}
        onClose={() => setDetailProduct(null)}
        onImport={(product) => {
          setDetailProduct(null);
          setImportProduct(product);
        }}
      />

      <ImportDialog
        product={importProduct}
        stores={stores || []}
        onClose={() => setImportProduct(null)}
        onImported={() => {
          stores?.forEach((s) => {
            queryClient.invalidateQueries({ queryKey: ["/api/imported-products", s.id] });
          });
        }}
      />
    </div>
  );
}

function useAllImportedProductIds(stores: Store[]): Set<string> {
  const results = useQueries({
    queries: stores.map((store) => ({
      queryKey: ["/api/imported-products", store.id],
      enabled: !!store.id,
    })),
  });

  return useMemo(() => {
    const ids = new Set<string>();
    results.forEach((r) => {
      const data = r.data as string[] | undefined;
      if (data) data.forEach((id) => ids.add(id));
    });
    return ids;
  }, [results]);
}

function ProductDetailDialog({
  product,
  stores,
  isImported,
  onClose,
  onImport,
}: {
  product: Product | null;
  stores: Store[];
  isImported: boolean;
  onClose: () => void;
  onImport: (product: Product) => void;
}) {
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
                  className="w-full h-full object-cover"
                  data-testid="img-detail-product"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" data-testid="text-detail-source">
                  {product.source === "PLATFORM" ? "Platform Product" : "User Product"}
                </Badge>
                <Badge variant="outline" className="capitalize">{product.category}</Badge>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  product,
  stores,
  onClose,
  onImported,
}: {
  product: Product | null;
  stores: Store[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [storeId, setStoreId] = useState("");
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
      onImported();
      toast({
        title: "Product imported",
        description: `"${product?.title}" has been added to your store.`,
      });
      onClose();
      setStoreId("");
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
            Choose which store to import "{product?.title}" into.
          </DialogDescription>
        </DialogHeader>
        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need to create a store first before importing products.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger data-testid="select-import-store">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !storeId}
              data-testid="button-confirm-import"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Product
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
