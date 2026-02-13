import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2, Package, Eye } from "lucide-react";
import type { Product, Store } from "@shared/schema";

export default function LibraryPage() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/library"],
  });
  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const [importProduct, setImportProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">Product Library</h1>
        <p className="text-muted-foreground mt-1">Browse platform products and import them to your store.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-40 w-full rounded-t-md" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover-elevate cursor-pointer" onClick={() => setDetailProduct(product)}>
              <CardContent className="p-0">
                {product.thumbnailUrl && (
                  <div className="relative h-40 bg-muted overflow-hidden">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      data-testid={`img-product-${product.id}`}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold leading-tight" data-testid={`text-product-title-${product.id}`}>
                      {product.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      ${(product.priceCents / 100).toFixed(2)}
                    </Badge>
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
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); setImportProduct(product); }}
                      data-testid={`button-import-${product.id}`}
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No products available</h3>
            <p className="text-sm text-muted-foreground">
              The platform library is empty. Check back later.
            </p>
          </CardContent>
        </Card>
      )}

      <ProductDetailDialog
        product={detailProduct}
        stores={stores || []}
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
      />
    </div>
  );
}

function ProductDetailDialog({
  product,
  stores,
  onClose,
  onImport,
}: {
  product: Product | null;
  stores: Store[];
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
              <div className="relative rounded-md overflow-hidden bg-muted aspect-video">
                <img
                  src={product.thumbnailUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  data-testid="img-detail-product"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Badge variant="secondary" data-testid="text-detail-source">
                {product.source === "PLATFORM" ? "Platform Product" : "User Product"}
              </Badge>
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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Status: {product.status}</span>
              {product.createdAt && (
                <>
                  <span>|</span>
                  <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
                </>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => onImport(product)}
              data-testid="button-detail-import"
            >
              <Download className="mr-2 h-4 w-4" />
              Import to Store
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
}: {
  product: Product | null;
  stores: Store[];
  onClose: () => void;
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
