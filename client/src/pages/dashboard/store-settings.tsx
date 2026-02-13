import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Store, Loader2, AlertTriangle, Trash2 } from "lucide-react";

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
              Create a store using the selector in the sidebar.
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
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
