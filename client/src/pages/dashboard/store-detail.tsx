import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Package, Plus, Trash2, Layers, Settings, AlertTriangle, Tag, Ticket, Percent, DollarSign } from "lucide-react";
import type { Store, StoreProduct, Product, Coupon } from "@shared/schema";

type StoreProductWithProduct = StoreProduct & { product: Product };

export default function StoreDetailPage() {
  const params = useParams<{ id: string }>();
  const storeId = params.id;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "bundles" | "coupons">("products");

  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ["/api/stores", storeId],
  });

  const { data: storeProducts, isLoading: productsLoading } = useQuery<StoreProductWithProduct[]>({
    queryKey: ["/api/store-products", storeId],
  });

  const { data: storeBundles, isLoading: bundlesLoading } = useQuery<any[]>({
    queryKey: ["/api/bundles", storeId],
    enabled: !!storeId,
  });

  const { data: storeCoupons, isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons", storeId],
    enabled: !!storeId,
  });

  const createBundleMutation = useMutation({
    mutationFn: async () => {
      const priceCents = Math.round(parseFloat(bundlePrice) * 100);
      await apiRequest("POST", "/api/bundles", {
        storeId,
        name: bundleName,
        description: bundleDescription || null,
        priceCents,
        productIds: selectedProductIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundles", storeId] });
      toast({ title: "Bundle created successfully" });
      setBundleDialogOpen(false);
      setBundleName("");
      setBundleDescription("");
      setBundlePrice("");
      setSelectedProductIds([]);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create bundle", description: err.message, variant: "destructive" });
    },
  });

  const toggleBundlePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      await apiRequest("PATCH", `/api/bundles/${id}`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundles", storeId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/bundles", storeId] });
      toast({ title: "Bundle deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete bundle", description: err.message, variant: "destructive" });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/stores/${storeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Store deleted" });
      setDeleteConfirmOpen(false);
      setLocation("/dashboard/stores");
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete store", description: err.message, variant: "destructive" });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons", storeId] });
      toast({ title: "Coupon deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete coupon", description: err.message, variant: "destructive" });
    },
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/coupons/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons", storeId] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update coupon", description: err.message, variant: "destructive" });
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
        <div className="flex items-center gap-2 flex-wrap">
          {store && (
            <>
              <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} data-testid="button-store-settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Link href={`/s/${store.slug}`}>
                <Button variant="outline" size="sm" data-testid="button-view-storefront">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  View Storefront
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["products", "bundles", "coupons"] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
            data-testid={`tab-${tab}`}
          >
            {tab === "products" && <Package className="mr-2 h-3.5 w-3.5" />}
            {tab === "bundles" && <Layers className="mr-2 h-3.5 w-3.5" />}
            {tab === "coupons" && <Ticket className="mr-2 h-3.5 w-3.5" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === "products" && (
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
      )}

      {activeTab === "bundles" && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-lg font-semibold">Bundles</h2>
            <Dialog open={bundleDialogOpen} onOpenChange={setBundleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-bundle">
                  <Plus className="mr-2 h-3.5 w-3.5" />
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
                          <label
                            key={sp.productId}
                            className="flex items-center gap-3 cursor-pointer"
                          >
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
                        <p className="text-sm text-muted-foreground">No products available</p>
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
                        {bundle.products?.length ?? 0} products &middot; ${(bundle.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={bundle.isPublished ? "default" : "secondary"}>
                        {bundle.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Switch
                        checked={bundle.isPublished}
                        onCheckedChange={(checked) =>
                          toggleBundlePublishMutation.mutate({ id: bundle.id, isPublished: checked })
                        }
                        disabled={toggleBundlePublishMutation.isPending}
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
      )}

      {activeTab === "coupons" && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-lg font-semibold">Coupons</h2>
            <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-coupon">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Coupon</DialogTitle>
                  <DialogDescription>Create a discount code for your customers.</DialogDescription>
                </DialogHeader>
                <CreateCouponForm storeId={storeId!} onSuccess={() => setCouponDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {couponsLoading ? (
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
          ) : storeCoupons && storeCoupons.length > 0 ? (
            <div className="space-y-3">
              {storeCoupons.map((coupon) => (
                <Card key={coupon.id} data-testid={`card-coupon-${coupon.id}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-mono font-bold" data-testid={`text-coupon-code-${coupon.id}`}>{coupon.code}</h3>
                        <Badge variant="secondary">
                          {coupon.discountType === "PERCENT" ? (
                            <><Percent className="h-3 w-3 mr-1" />{coupon.discountValue}% off</>
                          ) : (
                            <><DollarSign className="h-3 w-3 mr-1" />${(coupon.discountValue / 100).toFixed(2)} off</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {coupon.currentUses}{coupon.maxUses ? `/${coupon.maxUses}` : ""} uses
                        {coupon.expiresAt && ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={coupon.isActive ? "default" : "secondary"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={(checked) =>
                          toggleCouponMutation.mutate({ id: coupon.id, isActive: checked })
                        }
                        disabled={toggleCouponMutation.isPending}
                        data-testid={`switch-coupon-active-${coupon.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCouponMutation.mutate(coupon.id)}
                        disabled={deleteCouponMutation.isPending}
                        data-testid={`button-delete-coupon-${coupon.id}`}
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
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No coupons yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create discount codes to attract more customers.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {store && (
        <>
          <StoreSettingsDialog
            store={store}
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onDeleteRequest={() => { setSettingsOpen(false); setDeleteConfirmOpen(true); }}
          />
          <DeleteStoreDialog
            store={store}
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={() => deleteStoreMutation.mutate()}
            isPending={deleteStoreMutation.isPending}
          />
        </>
      )}
    </div>
  );
}

function CreateCouponForm({ storeId, onSuccess }: { storeId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/coupons", {
        storeId,
        code: code.toUpperCase(),
        discountType,
        discountValue: discountType === "PERCENT" ? parseInt(discountValue) : Math.round(parseFloat(discountValue) * 100),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons", storeId] });
      toast({ title: "Coupon created" });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: "Failed to create coupon", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="coupon-code">Coupon Code</Label>
        <Input
          id="coupon-code"
          placeholder="e.g. SAVE20"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          data-testid="input-coupon-code"
        />
      </div>
      <div className="space-y-2">
        <Label>Discount Type</Label>
        <Select value={discountType} onValueChange={(v) => setDiscountType(v as "PERCENT" | "FIXED")}>
          <SelectTrigger data-testid="select-coupon-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENT">Percentage (%)</SelectItem>
            <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-value">
          {discountType === "PERCENT" ? "Discount (%)" : "Discount Amount ($)"}
        </Label>
        <Input
          id="coupon-value"
          type="number"
          min="1"
          max={discountType === "PERCENT" ? "100" : undefined}
          step={discountType === "PERCENT" ? "1" : "0.01"}
          placeholder={discountType === "PERCENT" ? "20" : "5.00"}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          data-testid="input-coupon-value"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-max-uses">Max Uses (optional)</Label>
        <Input
          id="coupon-max-uses"
          type="number"
          min="1"
          placeholder="Unlimited"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          data-testid="input-coupon-max-uses"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-expires">Expiration Date (optional)</Label>
        <Input
          id="coupon-expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          data-testid="input-coupon-expires"
        />
      </div>
      <Button
        className="w-full"
        disabled={!code.trim() || !discountValue || parseFloat(discountValue) <= 0 || createMutation.isPending}
        onClick={() => createMutation.mutate()}
        data-testid="button-submit-coupon"
      >
        {createMutation.isPending ? "Creating..." : "Create Coupon"}
      </Button>
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

function StoreSettingsDialog({
  store,
  open,
  onClose,
  onDeleteRequest,
}: {
  store: Store;
  open: boolean;
  onClose: () => void;
  onDeleteRequest: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [templateKey, setTemplateKey] = useState(store.templateKey);
  const [tagline, setTagline] = useState(store.tagline || "");
  const [logoUrl, setLogoUrl] = useState(store.logoUrl || "");
  const [accentColor, setAccentColor] = useState(store.accentColor || "");
  const [heroBannerUrl, setHeroBannerUrl] = useState(store.heroBannerUrl || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, string | null> = {};
      if (name !== store.name) updates.name = name;
      if (slug !== store.slug) updates.slug = slug;
      if (templateKey !== store.templateKey) updates.templateKey = templateKey;
      if (tagline !== (store.tagline || "")) updates.tagline = tagline || null;
      if (logoUrl !== (store.logoUrl || "")) updates.logoUrl = logoUrl || null;
      if (accentColor !== (store.accentColor || "")) updates.accentColor = accentColor || null;
      if (heroBannerUrl !== (store.heroBannerUrl || "")) updates.heroBannerUrl = heroBannerUrl || null;
      if (Object.keys(updates).length === 0) return;
      await apiRequest("PATCH", `/api/stores/${store.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", store.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Store updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to update store", description: err.message, variant: "destructive" });
    },
  });

  const hasChanges = name !== store.name || slug !== store.slug || templateKey !== store.templateKey
    || tagline !== (store.tagline || "") || logoUrl !== (store.logoUrl || "")
    || accentColor !== (store.accentColor || "") || heroBannerUrl !== (store.heroBannerUrl || "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Store Settings</DialogTitle>
          <DialogDescription>Customize your store appearance and settings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Store Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-settings-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-slug">URL Slug</Label>
            <Input
              id="settings-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              data-testid="input-settings-slug"
            />
            <p className="text-xs text-muted-foreground">/s/{slug}</p>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateKey} onValueChange={setTemplateKey}>
              <SelectTrigger data-testid="select-settings-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neon">Neon (Dark, Bold)</SelectItem>
                <SelectItem value="silk">Silk (Elegant, Minimal)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-tagline">Tagline</Label>
            <Input
              id="settings-tagline"
              placeholder="e.g. Premium digital assets for creators"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              data-testid="input-settings-tagline"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-logo">Logo URL</Label>
            <Input
              id="settings-logo"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              data-testid="input-settings-logo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-accent">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="settings-accent"
                type="color"
                value={accentColor || "#3b82f6"}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 p-1"
                data-testid="input-settings-accent-color"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#3b82f6"
                data-testid="input-settings-accent-hex"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-banner">Hero Banner URL</Label>
            <Input
              id="settings-banner"
              placeholder="https://example.com/banner.jpg"
              value={heroBannerUrl}
              onChange={(e) => setHeroBannerUrl(e.target.value)}
              data-testid="input-settings-banner"
            />
          </div>
          <Button
            className="w-full"
            disabled={!hasChanges || !name.trim() || !slug.trim() || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            data-testid="button-save-settings"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full text-destructive"
              onClick={onDeleteRequest}
              data-testid="button-request-delete-store"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Store
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteStoreDialog({
  store,
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  store: Store;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Store
          </DialogTitle>
          <DialogDescription>
            This will permanently delete "{store.name}" and all its imported products and bundles. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Type <span className="font-mono font-bold">{store.slug}</span> to confirm</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={store.slug}
              data-testid="input-confirm-delete"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={confirmText !== store.slug || isPending}
              onClick={onConfirm}
              data-testid="button-confirm-delete-store"
            >
              {isPending ? "Deleting..." : "Delete Forever"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
