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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, Package, Store, Gift, ChevronDown, ChevronUp, Sparkles, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StoreProduct, Product, Bundle } from "@shared/schema";

type StoreProductWithProduct = StoreProduct & { product: Product };
type BundleWithProducts = Bundle & { products: Product[] };

export default function StoreProductsPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { toast } = useToast();

  const { data: storeProducts, isLoading } = useQuery<StoreProductWithProduct[]>({
    queryKey: ["/api/store-products", activeStoreId],
    enabled: !!activeStoreId,
  });

  const { data: bundles } = useQuery<BundleWithProducts[]>({
    queryKey: ["/api/bundles", activeStoreId],
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
              <StoreProductRow
                key={sp.id}
                storeProduct={sp}
                storeId={activeStoreId}
                allProducts={storeProducts}
                bundles={bundles || []}
              />
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

function StoreProductRow({
  storeProduct,
  storeId,
  allProducts,
  bundles,
}: {
  storeProduct: StoreProductWithProduct;
  storeId: string;
  allProducts: StoreProductWithProduct[];
  bundles: BundleWithProducts[];
}) {
  const { toast } = useToast();
  const product = storeProduct.product;
  const [expanded, setExpanded] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("PATCH", `/api/store-products/${storeProduct.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const effectivePrice = storeProduct.customPriceCents ?? product.priceCents;
  const isFree = effectivePrice === 0;
  const hasCustomPrice = storeProduct.customPriceCents != null;
  const otherProducts = allProducts.filter((sp) => {
    const ep = sp.customPriceCents ?? sp.product.priceCents;
    return sp.productId !== storeProduct.productId && ep > 0;
  });
  const [priceInput, setPriceInput] = useState(hasCustomPrice ? (storeProduct.customPriceCents! / 100).toFixed(2) : "");

  return (
    <Card>
      <CardContent className="p-4 space-y-0">
        <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium truncate" data-testid={`text-sp-title-${storeProduct.id}`}>
                {product.title}
              </h3>
              {storeProduct.isLeadMagnet && (
                <Badge variant="secondary" className="text-xs">
                  <Gift className="mr-1 h-3 w-3" />
                  Lead Magnet
                </Badge>
              )}
              {hasCustomPrice && !isFree && (
                <Badge variant="outline" className="text-xs">
                  Custom Price
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isFree ? "Free" : `$${(effectivePrice / 100).toFixed(2)}`}
              {hasCustomPrice && !isFree && (
                <span className="ml-1 line-through text-xs">${(product.priceCents / 100).toFixed(2)}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={storeProduct.isPublished ? "default" : "secondary"}>
              {storeProduct.isPublished ? "Published" : "Draft"}
            </Badge>
            <Switch
              checked={storeProduct.isPublished}
              onCheckedChange={() => toggleMutation.mutate({ isPublished: !storeProduct.isPublished })}
              disabled={toggleMutation.isPending}
              data-testid={`switch-publish-${storeProduct.id}`}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-${storeProduct.id}`}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Custom Price
              </Label>
              <p className="text-xs text-muted-foreground">
                Override the default price (${(product.priceCents / 100).toFixed(2)}). Set to $0 to make it free for lead magnets.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Default: $${(product.priceCents / 100).toFixed(2)}`}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="max-w-[200px]"
                  data-testid={`input-custom-price-${storeProduct.id}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={toggleMutation.isPending}
                  onClick={() => {
                    const cents = priceInput === "" ? null : Math.round(parseFloat(priceInput) * 100);
                    if (priceInput !== "" && (isNaN(cents!) || cents! < 0)) {
                      toast({ title: "Invalid price", variant: "destructive" });
                      return;
                    }
                    toggleMutation.mutate({ customPriceCents: cents });
                    if (cents === null) setPriceInput("");
                  }}
                  data-testid={`button-save-price-${storeProduct.id}`}
                >
                  {priceInput === "" ? "Reset to Default" : "Save Price"}
                </Button>
              </div>
            </div>

            {isFree && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">Lead Magnet</Label>
                  <p className="text-xs text-muted-foreground">
                    Visitors enter their email to get this free product, creating a customer account for upselling
                  </p>
                </div>
                <Switch
                  checked={storeProduct.isLeadMagnet}
                  onCheckedChange={(checked) => toggleMutation.mutate({ isLeadMagnet: checked })}
                  disabled={toggleMutation.isPending}
                  data-testid={`switch-lead-magnet-${storeProduct.id}`}
                />
              </div>
            )}

            {storeProduct.isLeadMagnet && (
              <div className="space-y-3 pl-11">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Upsell Product (shown after signup)
                  </Label>
                  <Select
                    value={storeProduct.upsellProductId || "none"}
                    onValueChange={(val) => toggleMutation.mutate({ upsellProductId: val === "none" ? null : val })}
                  >
                    <SelectTrigger data-testid={`select-upsell-product-${storeProduct.id}`}>
                      <SelectValue placeholder="No upsell product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No upsell product</SelectItem>
                      {otherProducts.map((sp) => (
                        <SelectItem key={sp.productId} value={sp.productId}>
                          {sp.product.title} — ${(sp.product.priceCents / 100).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bundles.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Upsell Bundle (shown after signup)
                    </Label>
                    <Select
                      value={storeProduct.upsellBundleId || "none"}
                      onValueChange={(val) => toggleMutation.mutate({ upsellBundleId: val === "none" ? null : val })}
                    >
                      <SelectTrigger data-testid={`select-upsell-bundle-${storeProduct.id}`}>
                        <SelectValue placeholder="No upsell bundle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No upsell bundle</SelectItem>
                        {bundles.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} — ${(b.priceCents / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
