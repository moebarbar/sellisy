import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/dashboard/template-selector";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DomainSettings } from "@/components/dashboard/domain-settings";
import { Store, Loader2, AlertTriangle, Trash2, Upload, X, ImageIcon, CreditCard, CheckCircle2, XCircle, FileText, Megaphone, Globe, ExternalLink } from "lucide-react";

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
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementLink, setAnnouncementLink] = useState("");
  const [footerText, setFooterText] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    if (activeStore) {
      setName(activeStore.name);
      setSlug(activeStore.slug);
      setTemplateKey(activeStore.templateKey);
      setTagline(activeStore.tagline || "");
      setLogoUrl(activeStore.logoUrl || "");
      setAccentColor(activeStore.accentColor || "");
      setHeroBannerUrl(activeStore.heroBannerUrl || "");
      setAnnouncementText(activeStore.announcementText || "");
      setAnnouncementLink(activeStore.announcementLink || "");
      setFooterText(activeStore.footerText || "");
      setSocialTwitter(activeStore.socialTwitter || "");
      setSocialInstagram(activeStore.socialInstagram || "");
      setSocialYoutube(activeStore.socialYoutube || "");
      setSocialTiktok(activeStore.socialTiktok || "");
      setSocialWebsite(activeStore.socialWebsite || "");
      setFaviconUrl(activeStore.faviconUrl || "");
      setSeoTitle(activeStore.seoTitle || "");
      setSeoDescription(activeStore.seoDescription || "");
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
      if (announcementText !== (activeStore.announcementText || "")) updates.announcementText = announcementText || null;
      if (announcementLink !== (activeStore.announcementLink || "")) updates.announcementLink = announcementLink || null;
      if (footerText !== (activeStore.footerText || "")) updates.footerText = footerText || null;
      if (socialTwitter !== (activeStore.socialTwitter || "")) updates.socialTwitter = socialTwitter || null;
      if (socialInstagram !== (activeStore.socialInstagram || "")) updates.socialInstagram = socialInstagram || null;
      if (socialYoutube !== (activeStore.socialYoutube || "")) updates.socialYoutube = socialYoutube || null;
      if (socialTiktok !== (activeStore.socialTiktok || "")) updates.socialTiktok = socialTiktok || null;
      if (socialWebsite !== (activeStore.socialWebsite || "")) updates.socialWebsite = socialWebsite || null;
      if (faviconUrl !== (activeStore.faviconUrl || "")) updates.faviconUrl = faviconUrl || null;
      if (seoTitle !== (activeStore.seoTitle || "")) updates.seoTitle = seoTitle || null;
      if (seoDescription !== (activeStore.seoDescription || "")) updates.seoDescription = seoDescription || null;
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
    || announcementText !== (activeStore.announcementText || "") || announcementLink !== (activeStore.announcementLink || "")
    || footerText !== (activeStore.footerText || "") || socialTwitter !== (activeStore.socialTwitter || "")
    || socialInstagram !== (activeStore.socialInstagram || "") || socialYoutube !== (activeStore.socialYoutube || "")
    || socialTiktok !== (activeStore.socialTiktok || "") || socialWebsite !== (activeStore.socialWebsite || "")
    || faviconUrl !== (activeStore.faviconUrl || "") || seoTitle !== (activeStore.seoTitle || "")
    || seoDescription !== (activeStore.seoDescription || "")
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Store Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your store appearance and settings.</p>
      </div>

      <PaymentsCard />

      <DomainSettings />

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
              <TemplateSelector value={templateKey} onChange={setTemplateKey} storeName={name} />
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
                aspectHint="Square image, 512×512px recommended. Displayed in your storefront header and used as social sharing image."
                previewClass="w-28 h-28"
                testIdPrefix="logo"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Favicon</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadField
                label="Favicon"
                value={faviconUrl}
                onChange={setFaviconUrl}
                aspectHint="Square icon, 32×32px or 64×64px. Shown in the browser tab. Falls back to your store logo if not set."
                previewClass="w-16 h-16"
                testIdPrefix="favicon"
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Control how your store appears in search engines and social media. These override defaults when set.</p>
          <div className="space-y-2">
            <Label htmlFor="settings-seo-title">Page Title</Label>
            <Input
              id="settings-seo-title"
              placeholder={activeStore?.name || "Your Store Name"}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              data-testid="input-settings-seo-title"
            />
            <p className="text-xs text-muted-foreground">Shown in the browser tab and search results. Defaults to your store name.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-seo-description">Meta Description</Label>
            <Textarea
              id="settings-seo-description"
              placeholder="e.g. Premium digital products for creators and entrepreneurs"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              data-testid="input-settings-seo-description"
            />
            <p className="text-xs text-muted-foreground">Shown in search results and social media previews. Falls back to your tagline.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Blog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Blog</p>
              <p className="text-xs text-muted-foreground mt-0.5">Show a blog section on your storefront and allow visitors to read your articles.</p>
            </div>
            <Switch
              checked={activeStore?.blogEnabled ?? false}
              onCheckedChange={async (checked) => {
                if (!activeStore) return;
                try {
                  await apiRequest("PATCH", `/api/stores/${activeStore.id}`, { blogEnabled: checked });
                  queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
                  toast({ title: checked ? "Blog enabled" : "Blog disabled" });
                } catch {
                  toast({ title: "Failed to update blog setting", variant: "destructive" });
                }
              }}
              data-testid="switch-blog-enabled"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Image Protection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Allow Image Download</p>
              <p className="text-xs text-muted-foreground mt-0.5">When disabled, product images on your storefront are protected from right-click saving.</p>
            </div>
            <Switch
              checked={activeStore?.allowImageDownload ?? false}
              onCheckedChange={async (checked) => {
                if (!activeStore) return;
                try {
                  await apiRequest("PATCH", `/api/stores/${activeStore.id}`, { allowImageDownload: checked });
                  queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
                  toast({ title: checked ? "Image download enabled" : "Image download disabled" });
                } catch {
                  toast({ title: "Failed to update setting", variant: "destructive" });
                }
              }}
              data-testid="switch-allow-image-download"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Announcement Bar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Show a dismissible banner at the top of your storefront for sales, launches, or important news.</p>
          <div className="space-y-2">
            <Label htmlFor="settings-announcement">Announcement Text</Label>
            <Input
              id="settings-announcement"
              placeholder="e.g. 🔥 Summer Sale — 30% off everything!"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              data-testid="input-settings-announcement"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-announcement-link">Link URL (optional)</Label>
            <Input
              id="settings-announcement-link"
              placeholder="https://..."
              value={announcementLink}
              onChange={(e) => setAnnouncementLink(e.target.value)}
              data-testid="input-settings-announcement-link"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Footer & Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Customize the footer shown at the bottom of your storefront.</p>
          <div className="space-y-2">
            <Label htmlFor="settings-footer">Footer Text</Label>
            <Textarea
              id="settings-footer"
              placeholder="About your store, contact info, or a short bio..."
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              rows={3}
              data-testid="input-settings-footer"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-twitter">Twitter / X</Label>
              <Input id="settings-twitter" placeholder="https://x.com/yourhandle" value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} data-testid="input-settings-twitter" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-instagram">Instagram</Label>
              <Input id="settings-instagram" placeholder="https://instagram.com/yourhandle" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} data-testid="input-settings-instagram" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-youtube">YouTube</Label>
              <Input id="settings-youtube" placeholder="https://youtube.com/@yourchannel" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} data-testid="input-settings-youtube" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-tiktok">TikTok</Label>
              <Input id="settings-tiktok" placeholder="https://tiktok.com/@yourhandle" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} data-testid="input-settings-tiktok" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-website">Website</Label>
            <Input id="settings-website" placeholder="https://yourwebsite.com" value={socialWebsite} onChange={(e) => setSocialWebsite(e.target.value)} data-testid="input-settings-website" />
          </div>
        </CardContent>
      </Card>

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

  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");

  useEffect(() => {
    if (activeStore) {
      setStripePublishableKey((activeStore as any).stripePublishableKey || "");
      setStripeSecretKey((activeStore as any).stripeSecretKey || "");
      setPaypalClientId((activeStore as any).paypalClientId || "");
      setPaypalClientSecret((activeStore as any).paypalClientSecret || "");
    }
  }, [activeStore]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      const body: Record<string, string | null | undefined> = {};
      body.stripePublishableKey = stripePublishableKey || null;
      body.stripeSecretKey = stripeSecretKey && stripeSecretKey !== "***configured***" ? stripeSecretKey : undefined;
      body.paypalClientId = paypalClientId || null;
      body.paypalClientSecret = paypalClientSecret && paypalClientSecret !== "***configured***" ? paypalClientSecret : undefined;
      Object.keys(body).forEach((k) => { if (body[k] === undefined) delete body[k]; });
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Payment settings saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save payment settings", description: err.message, variant: "destructive" });
    },
  });

  const stripeConfigured = !!(activeStore && (activeStore as any).stripePublishableKey && (activeStore as any).stripeSecretKey === "***configured***");
  const stripeIsTestMode = (activeStore as any)?.stripePublishableKey?.startsWith("pk_test_");
  const paypalConfigured = !!(activeStore && (activeStore as any).paypalClientId && (activeStore as any).paypalClientSecret === "***configured***");
  const hasChanges = activeStore && (
    stripePublishableKey !== ((activeStore as any).stripePublishableKey || "") ||
    stripeSecretKey !== ((activeStore as any).stripeSecretKey || "") ||
    paypalClientId !== ((activeStore as any).paypalClientId || "") ||
    paypalClientSecret !== ((activeStore as any).paypalClientSecret || "")
  );

  const stripeSecretDisplay = stripeSecretKey === "***configured***" ? "" : stripeSecretKey;
  const paypalSecretDisplay = paypalClientSecret === "***configured***" ? "" : paypalClientSecret;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Payment Provider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure one or both payment processors. If both are set up, your customers can choose how to pay at checkout.
        </p>

        <div className="rounded-md border border-border p-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {stripeConfigured ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium" data-testid="text-stripe-status">Stripe Configured</p>
                <Badge variant="secondary" className="ml-auto" data-testid="badge-stripe-mode">
                  {stripeIsTestMode ? "Test Mode" : "Live"}
                </Badge>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-stripe-status">
                  Enter your Stripe API keys to accept card payments
                </p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stripe-publishable-key">Stripe Publishable Key</Label>
            <Input
              id="stripe-publishable-key"
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              placeholder="Your Stripe Publishable Key"
              data-testid="input-stripe-publishable-key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
            <Input
              id="stripe-secret-key"
              type="password"
              value={stripeSecretDisplay}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder={stripeConfigured ? "Secret key is set — enter a new one to replace" : "Your Stripe Secret Key"}
              data-testid="input-stripe-secret-key"
            />
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-stripe-help">
            Get these from your Stripe Dashboard at dashboard.stripe.com/apikeys. Payments go directly to your Stripe account.
          </p>
        </div>

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
              value={paypalSecretDisplay}
              onChange={(e) => setPaypalClientSecret(e.target.value)}
              placeholder={paypalConfigured ? "Secret is set — enter a new one to replace" : "Your PayPal app Client Secret"}
              data-testid="input-paypal-client-secret"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Get these from your PayPal Developer Dashboard at developer.paypal.com. Payments go directly to your PayPal account.
          </p>
        </div>

        <Button
          disabled={!hasChanges || saveMutation.isPending}
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
