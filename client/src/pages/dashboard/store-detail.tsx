import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Package } from "lucide-react";
import type { Store, StoreProduct, Product } from "@shared/schema";

type StoreProductWithProduct = StoreProduct & { product: Product };

export default function StoreDetailPage() {
  const params = useParams<{ id: string }>();
  const storeId = params.id;

  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ["/api/stores", storeId],
  });

  const { data: storeProducts, isLoading: productsLoading } = useQuery<StoreProductWithProduct[]>({
    queryKey: ["/api/store-products", storeId],
  });

  const isLoading = storeLoading || productsLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/stores">
          <Button variant="ghost" size="icon" data-testid="button-back-stores">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          {storeLoading ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight truncate" data-testid="text-store-detail-name">
                {store?.name}
              </h1>
              <p className="text-sm text-muted-foreground">/s/{store?.slug}</p>
            </>
          )}
        </div>
        {store && (
          <Link href={`/s/${store.slug}`}>
            <Button variant="outline" size="sm" data-testid="button-view-storefront">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View Storefront
            </Button>
          </Link>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Imported Products</h2>
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
          <div className="space-y-3">
            {storeProducts.map((sp) => (
              <StoreProductRow key={sp.id} storeProduct={sp} storeId={storeId!} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-3">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No products imported</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Head to the Library to import products.
              </p>
              <Link href="/dashboard/library">
                <Button variant="outline" size="sm" data-testid="button-go-library">
                  Browse Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
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
