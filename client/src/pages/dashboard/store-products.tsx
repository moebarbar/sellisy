import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Eye, Package, Store, ToggleRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StoreProduct, Product } from "@shared/schema";

type StoreProductWithProduct = StoreProduct & { product: Product };

export default function StoreProductsPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { toast } = useToast();

  const { data: storeProducts, isLoading } = useQuery<StoreProductWithProduct[]>({
    queryKey: ["/api/store-products", activeStoreId],
    enabled: !!activeStoreId,
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-products-title">Products</h1>
          <p className="text-muted-foreground mt-1">Products published in {activeStore?.name}.</p>
        </div>
        <Link href="/dashboard/library">
          <Button variant="outline" data-testid="button-go-library">
            <Package className="mr-2 h-4 w-4" />
            Browse Library
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : storeProducts && storeProducts.length > 0 ? (
        <>
          {storeProducts.every((sp) => !sp.isPublished) && (
            <Alert data-testid="alert-none-published">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No products are published yet</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Your storefront won't show any products until you publish them. Use the toggle next to each product below to make it visible to visitors.
                </p>
                {activeStore?.slug && (
                  <Link href={`/s/${activeStore.slug}`}>
                    <Button variant="outline" size="sm" className="mt-1" data-testid="button-view-storefront">
                      <Eye className="mr-2 h-4 w-4" />
                      View Storefront
                    </Button>
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            {storeProducts.map((sp) => (
              <StoreProductRow key={sp.id} storeProduct={sp} storeId={activeStoreId} />
            ))}
          </div>
        </>
      ) : (
        <Card className="dv-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-5">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10">
                <Package className="h-7 w-7 text-primary dv-float" />
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2">Your shelves are empty</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm leading-relaxed">
              Time to stock up! Import ready-made products from our library or create your own masterpieces. 
              Then flip the publish switch to go live.
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Link href="/dashboard/library">
                <Button size="sm" data-testid="button-empty-library">
                  <Package className="mr-2 h-4 w-4" />
                  Browse Library
                </Button>
              </Link>
              <Link href="/dashboard/my-products">
                <Button variant="outline" size="sm" data-testid="button-empty-my-products">
                  Create Your Own
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StoreProductRow({ storeProduct, storeId }: { storeProduct: StoreProductWithProduct; storeId: string }) {
  const { toast } = useToast();
  const product = storeProduct.product;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/store-products/${storeProduct.id}`, {
        isPublished: !storeProduct.isPublished,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="h-14 w-14 rounded-md object-cover"
          />
        ) : (
          <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate" data-testid={`text-sp-title-${storeProduct.id}`}>
            {product.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            ${(product.priceCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={storeProduct.isPublished ? "default" : "secondary"}>
            {storeProduct.isPublished ? "Published" : "Draft"}
          </Badge>
          <Switch
            checked={storeProduct.isPublished}
            onCheckedChange={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            data-testid={`switch-publish-${storeProduct.id}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
