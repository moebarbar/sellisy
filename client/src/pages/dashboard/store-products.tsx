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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Package, Store, Gift, ChevronDown, ChevronUp, Sparkles, DollarSign, Pencil, Loader2, Code } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmbedDialog } from "@/components/dashboard/embed-dialog";
import type { StoreProduct, Product, Bundle } from "@shared/schema";

type StoreProductWithProduct = StoreProduct & { product: Product };
type BundleWithProducts = Bundle & { products: Product[] };

export default function StoreProductsPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { toast } = useToast();
  const [editingSp, setEditingSp] = useState<StoreProductWithProduct | null>(null);

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
              <AlertDescription>
                Your storefront won't show any products until you publish them. Use the toggle next to each product below to make it visible to visitors.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            {storeProducts.map((sp) => (
              <StoreProductRow
                key={sp.id}
                storeProduct={sp}
                storeId={activeStoreId}
                storeSlug={activeStore?.slug || ""}
                allProducts={storeProducts}
                bundles={bundles || []}
                onEdit={() => setEditingSp(sp)}
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
      <EditStoreProductDialog
        storeProduct={editingSp}
        storeId={activeStoreId}
        onClose={() => setEditingSp(null)}
      />
    </div>
  );
}

function StoreProductRow({
  storeProduct,
  storeId,
  storeSlug,
  allProducts,
  bundles,
  onEdit,
}: {
  storeProduct: StoreProductWithProduct;
  storeId: string;
  storeSlug: string;
  allProducts: StoreProductWithProduct[];
  bundles: BundleWithProducts[];
  onEdit: () => void;
}) {
  const { toast } = useToast();
  const product = storeProduct.product;
  const [expanded, setExpanded] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

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
                {storeProduct.customTitle || product.title}
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
              {(storeProduct.customTitle || storeProduct.customDescription || storeProduct.customTags) && (
                <Badge variant="outline" className="text-xs">
                  Customized
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
            {storeProduct.isPublished && storeSlug && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEmbedOpen(true)}
                    data-testid={`button-embed-sp-${storeProduct.id}`}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Embed</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onEdit}
                  data-testid={`button-edit-sp-${storeProduct.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                  data-testid={`button-expand-${storeProduct.id}`}
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
            </Tooltip>
          </div>
          {embedOpen && (
            <EmbedDialog
              open={embedOpen}
              onOpenChange={setEmbedOpen}
              storeSlug={storeSlug}
              itemType="product"
              itemId={product.id}
              itemName={storeProduct.customTitle || product.title}
            />
          )}
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

function EditStoreProductDialog({
  storeProduct,
  storeId,
  onClose,
}: {
  storeProduct: StoreProductWithProduct | null;
  storeId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const product = storeProduct?.product;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [redemptionCode, setRedemptionCode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const resetForm = () => {
    if (!storeProduct || !product) return;
    setTitle(storeProduct.customTitle || product.title);
    setDescription(storeProduct.customDescription || product.description || "");
    setTagsInput((storeProduct.customTags || product.tags || []).join(", "));
    setAccessUrl(storeProduct.customAccessUrl || product.accessUrl || "");
    setRedemptionCode(storeProduct.customRedemptionCode || product.redemptionCode || "");
    setDeliveryInstructions(storeProduct.customDeliveryInstructions || product.deliveryInstructions || "");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
    } else {
      onClose();
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!storeProduct || !product) return;
      const tags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [];
      const data: Record<string, unknown> = {
        customTitle: title !== product.title ? title : null,
        customDescription: description !== (product.description || "") ? description : null,
        customTags: JSON.stringify(tags) !== JSON.stringify(product.tags || []) ? tags : null,
        customAccessUrl: accessUrl !== (product.accessUrl || "") ? accessUrl || null : null,
        customRedemptionCode: redemptionCode !== (product.redemptionCode || "") ? redemptionCode || null : null,
        customDeliveryInstructions: deliveryInstructions !== (product.deliveryInstructions || "") ? deliveryInstructions || null : null,
      };
      await apiRequest("PATCH", `/api/store-products/${storeProduct.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      toast({ title: "Product customization saved" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!storeProduct) return;
      await apiRequest("PATCH", `/api/store-products/${storeProduct.id}`, {
        customTitle: null,
        customDescription: null,
        customTags: null,
        customAccessUrl: null,
        customRedemptionCode: null,
        customDeliveryInstructions: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      toast({ title: "Product reset to original" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to reset", description: err.message, variant: "destructive" });
    },
  });

  const hasOverrides = storeProduct && (
    storeProduct.customTitle || storeProduct.customDescription ||
    storeProduct.customTags || storeProduct.customAccessUrl ||
    storeProduct.customRedemptionCode || storeProduct.customDeliveryInstructions
  );

  return (
    <Dialog open={!!storeProduct} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => { e.preventDefault(); resetForm(); }}>
        <DialogHeader>
          <DialogTitle data-testid="text-edit-sp-title">Customize for Your Store</DialogTitle>
          <DialogDescription>
            Edit how "{product?.title}" appears on your storefront. Changes only affect your store.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="sp-title">Title</Label>
            <Input
              id="sp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={product?.title}
              data-testid="input-sp-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-description">Description</Label>
            <Textarea
              id="sp-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={product?.description || "Product description..."}
              rows={4}
              data-testid="input-sp-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-tags">Tags</Label>
            <Input
              id="sp-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. design, saas, marketing (comma separated)"
              data-testid="input-sp-tags"
            />
            <p className="text-xs text-muted-foreground">Comma-separated tags shown on your storefront</p>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Customer Delivery (shown to buyers after purchase)</h4>

            <div className="space-y-2">
              <Label htmlFor="sp-access-url">Access URL</Label>
              <Input
                id="sp-access-url"
                type="url"
                value={accessUrl}
                onChange={(e) => setAccessUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-sp-access-url"
              />
              <p className="text-xs text-muted-foreground">Direct link buyers use to access the product</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-redemption-code">Redemption Code</Label>
              <Input
                id="sp-redemption-code"
                value={redemptionCode}
                onChange={(e) => setRedemptionCode(e.target.value)}
                placeholder="CODE-XXXX"
                data-testid="input-sp-redemption-code"
              />
              <p className="text-xs text-muted-foreground">Activation code buyers receive after purchase</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-delivery-instructions">Delivery Instructions</Label>
              <Textarea
                id="sp-delivery-instructions"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Step-by-step instructions for the buyer..."
                rows={4}
                data-testid="input-sp-delivery-instructions"
              />
              <p className="text-xs text-muted-foreground">Step-by-step instructions shown after purchase</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending} data-testid="button-save-sp-edits">
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            {hasOverrides && (
              <Button
                type="button"
                variant="outline"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                data-testid="button-reset-sp-edits"
              >
                {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset to Original
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
