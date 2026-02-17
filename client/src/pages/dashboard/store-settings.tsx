import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Store, Loader2, AlertTriangle, Trash2, Upload, X, ImageIcon, CreditCard, CheckCircle2, XCircle } from "lucide-react";

function ImageUploadField({
  label,
  value,
  onChange,
  aspectHint,
  previewClass,
  testIdPrefix,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectHint: string;
  previewClass: string;
  testIdPrefix: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      onChange(res.objectPath);
    },
    onError: () => {},
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    await uploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{aspectHint}</p>

      {value ? (
        <div className="relative group">
          <div className={`overflow-hidden rounded-md border border-border ${previewClass}`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              data-testid={`img-${testIdPrefix}-preview`}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              data-testid={`button-${testIdPrefix}-replace`}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onChange("")}
              data-testid={`button-${testIdPrefix}-remove`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isUploading && fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover-elevate ${previewClass}`}
          data-testid={`button-${testIdPrefix}-upload`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Click to upload</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        data-testid={`input-${testIdPrefix}-file`}
      />

      <Input
        placeholder="Or paste an image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${testIdPrefix}-url`}
      />
    </div>
  );
}

export default function StoreSettingsPage() {
  const { activeStore, activeStoreId, storesLoading, setActiveStoreId } = useActiveStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [templateKey, setTemplateKey] = useState("neon");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [heroBannerUrl, setHeroBannerUrl] = useState("");

  useEffect(() => {
    if (activeStore) {
      setName(activeStore.name);
      setSlug(activeStore.slug);
      setTemplateKey(activeStore.templateKey);
      setTagline(activeStore.tagline || "");
      setLogoUrl(activeStore.logoUrl || "");
      setAccentColor(activeStore.accentColor || "");
      setHeroBannerUrl(activeStore.heroBannerUrl || "");
    }
  }, [activeStore]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!activeStore) return;
      const updates: Record<string, string | null> = {};
      if (name !== activeStore.name) updates.name = name;
      if (slug !== activeStore.slug) updates.slug = slug;
      if (templateKey !== activeStore.templateKey) updates.templateKey = templateKey;
      if (tagline !== (activeStore.tagline || "")) updates.tagline = tagline || null;
      if (logoUrl !== (activeStore.logoUrl || "")) updates.logoUrl = logoUrl || null;
      if (accentColor !== (activeStore.accentColor || "")) updates.accentColor = accentColor || null;
      if (heroBannerUrl !== (activeStore.heroBannerUrl || "")) updates.heroBannerUrl = heroBannerUrl || null;
      if (Object.keys(updates).length === 0) return;
      await apiRequest("PATCH", `/api/stores/${activeStore.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Store updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update store", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/stores/${activeStoreId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setActiveStoreId("");
      toast({ title: "Store deleted" });
      setDeleteConfirmOpen(false);
      setLocation("/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete store", description: err.message, variant: "destructive" });
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

  const hasChanges = activeStore && (
    name !== activeStore.name || slug !== activeStore.slug || templateKey !== activeStore.templateKey
    || tagline !== (activeStore.tagline || "") || logoUrl !== (activeStore.logoUrl || "")
    || accentColor !== (activeStore.accentColor || "") || heroBannerUrl !== (activeStore.heroBannerUrl || "")
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Store Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your store appearance and settings.</p>
      </div>

      <PaymentsCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Store Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadField
                label="Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                aspectHint="Square image recommended (e.g. 256x256px). Shown in storefront header."
                previewClass="w-24 h-24"
                testIdPrefix="logo"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hero Banner</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadField
                label="Hero Banner"
                value={heroBannerUrl}
                onChange={setHeroBannerUrl}
                aspectHint="Wide landscape image recommended (e.g. 1600x600px). Appears behind your store title."
                previewClass="w-full aspect-[16/6]"
                testIdPrefix="hero-banner"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          disabled={!hasChanges || !name.trim() || !slug.trim() || updateMutation.isPending}
          onClick={() => updateMutation.mutate()}
          data-testid="button-save-settings"
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => setDeleteConfirmOpen(true)}
          data-testid="button-request-delete-store"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Store
        </Button>
      </div>

      <DeleteStoreDialog
        storeName={activeStore?.name || ""}
        storeSlug={activeStore?.slug || ""}
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

function PaymentsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();
  const { data: stripeData, isLoading: stripeLoading } = useQuery<{ publishableKey: string | null }>({
    queryKey: ["/api/stripe/publishable-key"],
  });

  const [provider, setProvider] = useState<"stripe" | "paypal">("stripe");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");

  useEffect(() => {
    if (activeStore) {
      setProvider((activeStore as any).paymentProvider || "stripe");
      setPaypalClientId((activeStore as any).paypalClientId || "");
      setPaypalClientSecret((activeStore as any).paypalClientSecret || "");
    }
  }, [activeStore]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, {
        paymentProvider: provider,
        paypalClientId: provider === "paypal" ? paypalClientId : null,
        paypalClientSecret: provider === "paypal" ? paypalClientSecret : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Payment settings saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save payment settings", description: err.message, variant: "destructive" });
    },
  });

  const stripeConnected = !!stripeData?.publishableKey;
  const isSandbox = stripeData?.publishableKey?.startsWith("pk_test_");
  const paypalConfigured = !!(paypalClientId && paypalClientSecret);
  const hasChanges = activeStore && (
    provider !== ((activeStore as any).paymentProvider || "stripe") ||
    paypalClientId !== ((activeStore as any).paypalClientId || "") ||
    paypalClientSecret !== ((activeStore as any).paypalClientSecret || "")
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Payment Provider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Active Payment Processor</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as "stripe" | "paypal")}>
            <SelectTrigger data-testid="select-payment-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose which payment processor handles your store's checkout.
          </p>
        </div>

        {provider === "stripe" && (
          <div className="rounded-md border border-border p-4 space-y-2">
            {stripeLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking Stripe status...</span>
              </div>
            ) : stripeConnected ? (
              <div className="flex items-center gap-3 flex-wrap">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-stripe-status">Stripe Connected</p>
                  <p className="text-xs text-muted-foreground">
                    {isSandbox ? "Running in sandbox/test mode" : "Ready to accept live payments"}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto" data-testid="badge-stripe-mode">
                  {isSandbox ? "Sandbox" : "Live"}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-stripe-status">Stripe Not Connected</p>
                  <p className="text-xs text-muted-foreground">
                    Connect Stripe in your project's Integrations tab to accept payments.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {provider === "paypal" && (
          <div className="rounded-md border border-border p-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {paypalConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <p className="text-sm font-medium" data-testid="text-paypal-status">
                {paypalConfigured ? "PayPal Configured" : "PayPal Not Configured"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypal-client-id">PayPal Client ID</Label>
              <Input
                id="paypal-client-id"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="Your PayPal app Client ID"
                data-testid="input-paypal-client-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypal-client-secret">PayPal Client Secret</Label>
              <Input
                id="paypal-client-secret"
                type="password"
                value={paypalClientSecret}
                onChange={(e) => setPaypalClientSecret(e.target.value)}
                placeholder="Your PayPal app Client Secret"
                data-testid="input-paypal-client-secret"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Get these from your PayPal Developer Dashboard at developer.paypal.com. Payments go directly to your PayPal account.
            </p>
          </div>
        )}

        <Button
          disabled={!hasChanges || saveMutation.isPending || (provider === "paypal" && !paypalConfigured)}
          onClick={() => saveMutation.mutate()}
          data-testid="button-save-payment-settings"
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Payment Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function DeleteStoreDialog({
  storeName,
  storeSlug,
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  storeName: string;
  storeSlug: string;
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
            This will permanently delete "{storeName}" and all its imported products and bundles. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Type <span className="font-mono font-bold">{storeSlug}</span> to confirm</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={storeSlug}
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
              disabled={confirmText !== storeSlug || isPending}
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
