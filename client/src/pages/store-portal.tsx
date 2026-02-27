import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Mail, Loader2, ArrowRight, LogOut, Moon, Sun,
  ChevronRight, Download, ArrowLeft, ExternalLink, ShoppingBag,
  Store as StoreIcon, FileDown, Clock, Key, BookOpen, Play,
  Palette, FileText, Copy, Check, Layers,
} from "lucide-react";

type CustomerMe = { id: string; email: string };

type StoreInfo = {
  id: string;
  name: string;
  slug: string;
  templateKey: string;
  logoUrl: string | null;
  tagline: string | null;
};

type PurchaseItem = {
  id: string;
  productId: string;
  title: string;
  priceCents: number;
  thumbnailUrl: string | null;
};

type Purchase = {
  id: string;
  totalCents: number;
  status: string;
  createdAt: string;
  store: { id: string; name: string; slug: string };
  items: PurchaseItem[];
};

type OrderItem = {
  id: string;
  productId: string;
  title: string;
  priceCents: number;
  thumbnailUrl: string | null;
  hasFiles: boolean;
  productType: string;
  deliveryInstructions: string | null;
  accessUrl: string | null;
  redemptionCode: string | null;
  description: string | null;
};

type UpsellProduct = {
  id: string;
  title: string;
  priceCents: number;
  thumbnailUrl: string | null;
};

type PurchaseDetail = {
  order: { id: string; totalCents: number; status: string; createdAt: string };
  store: { id: string; name: string; slug: string } | null;
  items: OrderItem[];
  upsellProducts: UpsellProduct[];
};

function useStoreBranding(templateKey: string | undefined) {
  const isNeon = templateKey === "neon";
  return {
    isNeon,
    bg: isNeon ? "bg-[#0a0a0f]" : "bg-[#faf9f6]",
    headerBg: isNeon ? "bg-[#0a0a0f]/90" : "bg-[#faf9f6]/90",
    text: isNeon ? "text-white" : "text-[#1a1a1a]",
    textMuted: isNeon ? "text-gray-400" : "text-[#6b6b6b]",
    textSecondary: isNeon ? "text-gray-300" : "text-[#4a4a4a]",
    cardBg: isNeon ? "bg-[#12121a] border-[#1e1e2e]" : "bg-white border-[#e8e5e0]",
    accent: isNeon ? "text-cyan-400" : "text-[#8b7355]",
    accentBg: isNeon ? "bg-cyan-500/10" : "bg-[#8b7355]/10",
    btnPrimary: isNeon
      ? "bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
      : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-medium",
    btnGhost: isNeon
      ? "text-gray-300 hover:text-white hover:bg-white/5"
      : "text-[#4a4a4a] hover:text-[#1a1a1a] hover:bg-black/5",
    borderColor: isNeon ? "border-[#1e1e2e]" : "border-[#e8e5e0]",
    badgeBg: isNeon ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" : "bg-[#8b7355]/10 text-[#8b7355] border-[#8b7355]/20",
    inputBg: isNeon ? "bg-[#0a0a0f] border-[#2a2a3a] text-white placeholder:text-gray-500" : "bg-white border-[#d4d0c8] text-[#1a1a1a] placeholder:text-[#aaa]",
  };
}

function StoreHeader({ store, theme, customer, onLogout, logoutPending }: {
  store: StoreInfo;
  theme: ReturnType<typeof useStoreBranding>;
  customer: CustomerMe | null;
  onLogout: () => void;
  logoutPending: boolean;
}) {
  return (
    <header className={`sticky top-0 z-50 border-b ${theme.headerBg} ${theme.borderColor} backdrop-blur-md`}>
      <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap px-6 py-3">
        <Link href={`/s/${store.slug}`}>
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-store-home">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-8 w-8 rounded-md object-cover" />
            ) : (
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${theme.accentBg}`}>
                <StoreIcon className={`h-4 w-4 ${theme.accent}`} />
              </div>
            )}
            <span className={`text-lg font-bold tracking-tight ${theme.text}`}>
              {store.name}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {customer && (
            <>
              <span className={`text-sm hidden sm:inline ${theme.textMuted}`} data-testid="text-portal-email">
                {customer.email}
              </span>
              <button
                onClick={onLogout}
                disabled={logoutPending}
                className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${theme.btnGhost}`}
                data-testid="button-portal-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function PortalLogin({ store, theme, onLogin }: {
  store: StoreInfo;
  theme: ReturnType<typeof useStoreBranding>;
  onLogin: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/customer/login", { email, storeSlug: store.slug });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.devModeLink) {
        setDevLink(data.devModeLink);
      }
      toast({
        title: "Login link sent",
        description: "Check your email for a login link, or use the dev link below.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <main className="flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="mx-auto h-16 w-16 rounded-xl object-cover mb-4" />
          ) : (
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${theme.accentBg} mb-4`}>
              <Package className={`h-7 w-7 ${theme.accent}`} />
            </div>
          )}
          <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`} data-testid="text-portal-title">
            {store.name}
          </h1>
          <p className={theme.textMuted}>
            Access your purchases and download your files
          </p>
        </div>

        <div className={`rounded-lg border p-6 ${theme.cardBg}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className={theme.textSecondary}>Email address</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${theme.inputBg}`}
                  required
                  data-testid="input-portal-email"
                />
              </div>
              <p className={`text-xs ${theme.textMuted}`}>
                Enter the email you used when purchasing
              </p>
            </div>

            <button
              type="submit"
              className={`w-full inline-flex items-center justify-center rounded-md h-10 px-4 text-sm ${theme.btnPrimary} disabled:opacity-50`}
              disabled={loginMutation.isPending || !email}
              data-testid="button-portal-login"
            >
              {loginMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Send Login Link
            </button>
          </form>

          {devLink && (
            <div className={`mt-4 rounded-lg border border-dashed p-4 space-y-2 ${theme.borderColor}`}>
              <p className={`text-xs font-medium ${theme.textMuted}`}>DEV MODE — Click to log in:</p>
              <a
                href={devLink}
                className={`text-sm underline break-all flex items-center gap-1 ${theme.accent}`}
                data-testid="link-portal-dev-magic"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                Open login link
              </a>
            </div>
          )}
        </div>

        <p className={`text-center text-xs ${theme.textMuted}`}>
          No password needed. We'll send a secure link to your email.
        </p>
      </div>
    </main>
  );
}

function PortalPurchases({ store, theme, purchases, isLoading }: {
  store: StoreInfo;
  theme: ReturnType<typeof useStoreBranding>;
  purchases: Purchase[] | undefined;
  isLoading: boolean;
}) {
  const slug = store.slug;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`} data-testid="text-portal-purchases-title">
          Your Purchases
        </h1>
        <p className={`mt-1 ${theme.textMuted}`}>
          View and download your digital products from {store.name}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`rounded-lg border p-4 ${theme.cardBg}`}>
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !purchases || purchases.length === 0 ? (
        <div className={`rounded-lg border p-12 flex flex-col items-center justify-center text-center ${theme.cardBg}`}>
          <div className={`flex items-center justify-center h-14 w-14 rounded-full ${theme.accentBg} mb-4`}>
            <ShoppingBag className={`h-6 w-6 ${theme.textMuted}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>No purchases yet</h3>
          <p className={`text-sm max-w-xs ${theme.textMuted}`}>
            Your purchases from {store.name} will appear here.
          </p>
          <Link href={`/s/${slug}`}>
            <button className={`mt-4 inline-flex items-center justify-center rounded-md h-10 px-4 text-sm ${theme.btnPrimary}`} data-testid="button-browse-store">
              Browse Products
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((order) => (
            <Link key={order.id} href={`/s/${slug}/portal/${order.id}`}>
              <div className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${theme.cardBg}`} data-testid={`card-portal-order-${order.id}`}>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className={`h-12 w-12 rounded-md border-2 overflow-hidden ${theme.isNeon ? "bg-[#1a1a2e] border-[#0a0a0f]" : "bg-[#f0ede8] border-[#faf9f6]"}`}>
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className={`h-4 w-4 ${theme.textMuted}`} />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className={`h-12 w-12 rounded-md border-2 flex items-center justify-center ${theme.isNeon ? "bg-[#1a1a2e] border-[#0a0a0f]" : "bg-[#f0ede8] border-[#faf9f6]"}`}>
                        <span className={`text-xs ${theme.textMuted}`}>+{order.items.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${theme.text}`}>
                      {order.items.map((i) => i.title).join(", ")}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs ${theme.textMuted}`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                        {order.totalCents === 0 ? "Free" : `$${(order.totalCents / 100).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 ${theme.textMuted}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center pt-4">
        <Link href={`/s/${slug}`}>
          <button className={`inline-flex items-center text-sm ${theme.accent}`} data-testid="link-back-to-store">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to {store.name}
          </button>
        </Link>
      </div>
    </main>
  );
}

function getProductTypeInfo(type: string) {
  switch (type) {
    case "template": return { icon: Layers, label: "Template", color: "text-purple-400" };
    case "software": return { icon: Key, label: "Software Deal", color: "text-green-400" };
    case "ebook": return { icon: BookOpen, label: "Ebook", color: "text-blue-400" };
    case "course": return { icon: Play, label: "Course", color: "text-orange-400" };
    case "graphics": return { icon: Palette, label: "Graphics", color: "text-pink-400" };
    default: return { icon: FileDown, label: "Digital Download", color: "text-cyan-400" };
  }
}

function PortalOrderDetail({ store, theme, orderId }: {
  store: StoreInfo;
  theme: ReturnType<typeof useStoreBranding>;
  orderId: string;
}) {
  const { toast } = useToast();
  const slug = store.slug;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: customer } = useQuery<CustomerMe>({
    queryKey: ["/api/customer/me"],
    retry: false,
  });

  const { data: purchase, isLoading } = useQuery<PurchaseDetail>({
    queryKey: ["/api/customer/purchase", orderId],
    enabled: !!customer && !!orderId,
  });

  const downloadMutation = useMutation({
    mutationFn: async (orderItemId: string) => {
      const res = await apiRequest("POST", "/api/customer/download", { orderItemId });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.downloadToken) {
        window.open(`/api/download/${data.downloadToken}`, "_blank");
      }
    },
    onError: (err: any) => {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href={`/s/${slug}/portal`}>
          <button className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${theme.btnGhost}`} data-testid="button-back-purchases">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`} data-testid="text-order-detail-title">
            Order Details
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className={`rounded-lg border p-4 ${theme.cardBg}`}>
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !purchase ? (
        <div className={`rounded-lg border p-12 flex flex-col items-center justify-center text-center ${theme.cardBg}`}>
          <div className={`flex items-center justify-center h-14 w-14 rounded-full ${theme.accentBg} mb-4`}>
            <Package className={`h-6 w-6 ${theme.textMuted}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Order not found</h3>
          <p className={`text-sm ${theme.textMuted}`}>
            This order may not exist or may not belong to your account.
          </p>
        </div>
      ) : (
        <>
          <div className={`rounded-lg border p-4 ${theme.cardBg}`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                  {purchase.order.status}
                </span>
                <span className={`text-sm ${theme.textMuted}`}>
                  {new Date(purchase.order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <span className={`font-semibold ${theme.text}`} data-testid="text-portal-order-total">
                {purchase.order.totalCents === 0 ? "Free" : `$${(purchase.order.totalCents / 100).toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className={`text-lg font-semibold ${theme.text}`}>Your Products</h2>
            {purchase.items.map((item) => {
              const typeInfo = getProductTypeInfo(item.productType);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={item.id} className={`rounded-lg border overflow-hidden ${theme.cardBg}`} data-testid={`card-portal-item-${item.id}`}>
                  <div className="flex items-center gap-4 p-4">
                    <div className={`h-16 w-16 rounded-md overflow-hidden shrink-0 ${theme.isNeon ? "bg-[#1a1a2e]" : "bg-[#f0ede8]"}`}>
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className={`h-5 w-5 ${theme.textMuted}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${theme.text}`} data-testid={`text-portal-item-title-${item.id}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs ${theme.textMuted}`}>
                          {item.priceCents === 0 ? "Free" : `$${(item.priceCents / 100).toFixed(2)}`}
                        </span>
                        <span className={`inline-flex items-center text-xs gap-1 px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                          <TypeIcon className="h-3 w-3" />
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(item.deliveryInstructions || item.accessUrl || item.redemptionCode || item.hasFiles) && (
                    <div className={`border-t px-4 py-4 space-y-4 ${theme.borderColor}`}>
                      {item.redemptionCode && (
                        <div className="space-y-2">
                          <p className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Redemption Code</p>
                          <div className={`flex items-center gap-2 p-3 rounded-md border ${theme.isNeon ? "bg-[#0a0a0f] border-[#2a2a3a]" : "bg-[#f5f3ee] border-[#e0ddd5]"}`}>
                            <code className={`flex-1 text-sm font-mono ${theme.text}`} data-testid={`text-redemption-code-${item.id}`}>
                              {item.redemptionCode}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.redemptionCode!);
                                setCopiedCode(item.id);
                                setTimeout(() => setCopiedCode(null), 2000);
                                toast({ title: "Code copied" });
                              }}
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-md ${theme.btnGhost}`}
                              data-testid={`button-copy-code-${item.id}`}
                            >
                              {copiedCode === item.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {item.accessUrl && (
                        <div className="space-y-2">
                          <p className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                            {item.productType === "template" ? "Template Link" : item.productType === "course" ? "Course Access" : "Access Link"}
                          </p>
                          <a
                            href={item.accessUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center rounded-md h-9 px-4 text-sm ${theme.btnPrimary}`}
                            data-testid={`link-access-url-${item.id}`}
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            {item.productType === "template" ? "Open Template" : item.productType === "course" ? "Start Course" : "Access Product"}
                          </a>
                        </div>
                      )}

                      {item.deliveryInstructions && (
                        <div className="space-y-2">
                          <p className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>How to Access</p>
                          <div className={`rounded-md p-3 border ${theme.isNeon ? "bg-[#0a0a0f]/50 border-[#1e1e2e]" : "bg-[#f9f8f5] border-[#e8e5e0]"}`}>
                            {item.deliveryInstructions.split("\n").map((line, i) => (
                              <p key={i} className={`text-sm leading-relaxed ${theme.textSecondary} ${i > 0 ? "mt-1.5" : ""}`}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.hasFiles && (
                        <div className="space-y-2">
                          <p className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                            {item.productType === "ebook" ? "Download Your Ebook" : item.productType === "graphics" ? "Download Files" : "Download"}
                          </p>
                          <button
                            onClick={() => downloadMutation.mutate(item.id)}
                            disabled={downloadMutation.isPending}
                            className={`inline-flex items-center rounded-md h-9 px-4 text-sm ${theme.btnPrimary} disabled:opacity-50`}
                            data-testid={`button-portal-download-${item.id}`}
                          >
                            {downloadMutation.isPending ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-3.5 w-3.5" />
                            )}
                            Download Files
                          </button>
                        </div>
                      )}

                      {(item.deliveryInstructions || item.accessUrl || item.redemptionCode) && (
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              const w = window.open("", "_blank");
                              if (!w) return;
                              const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                              const escTitle = esc(item.title);
                              const escStore = esc(store.name);
                              const escCode = item.redemptionCode ? esc(item.redemptionCode) : "";
                              const escUrl = item.accessUrl ? esc(item.accessUrl) : "";
                              const escInstructions = item.deliveryInstructions ? esc(item.deliveryInstructions).replace(/\n/g, "<br>") : "";
                              w.document.write(`<!DOCTYPE html><html><head><title>${escTitle} - Delivery Instructions</title><style>
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
                                h1 { font-size: 22px; margin-bottom: 4px; }
                                .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
                                .section { margin-bottom: 20px; }
                                .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
                                .code-box { background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 16px; font-family: monospace; font-size: 15px; }
                                .link { color: #0066cc; }
                                .instructions { line-height: 1.7; font-size: 14px; }
                                .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
                                @media print { body { margin: 20px; } }
                              </style></head><body>
                                <h1>${escTitle}</h1>
                                <p class="meta">Purchased from ${escStore} &bull; ${typeInfo.label}</p>
                                ${escCode ? `<div class="section"><p class="section-title">Redemption Code</p><div class="code-box">${escCode}</div></div>` : ""}
                                ${escUrl ? `<div class="section"><p class="section-title">Access Link</p><a class="link" href="${escUrl}">${escUrl}</a></div>` : ""}
                                ${escInstructions ? `<div class="section"><p class="section-title">Instructions</p><div class="instructions">${escInstructions}</div></div>` : ""}
                                <div class="footer">Save this page for your records.</div>
                              </body></html>`);
                              w.document.close();
                              setTimeout(() => w.print(), 300);
                            }}
                            className={`inline-flex items-center rounded-md h-9 px-4 text-sm border ${theme.isNeon ? "border-[#2a2a3a] text-gray-300 hover:bg-white/5" : "border-[#d5d0c8] text-[#5a5a5a] hover:bg-black/5"}`}
                            data-testid={`button-save-pdf-${item.id}`}
                          >
                            <FileText className="mr-2 h-3.5 w-3.5" />
                            Save as PDF
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {purchase.upsellProducts.length > 0 && (
            <div className={`space-y-3 pt-4 border-t ${theme.borderColor}`}>
              <h2 className={`text-lg font-semibold ${theme.text}`}>More from {store.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {purchase.upsellProducts.map((product) => (
                  <Link key={product.id} href={`/s/${slug}/product/${product.id}`}>
                    <div className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${theme.cardBg}`} data-testid={`card-portal-upsell-${product.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-md overflow-hidden shrink-0 ${theme.isNeon ? "bg-[#1a1a2e]" : "bg-[#f0ede8]"}`}>
                          {product.thumbnailUrl ? (
                            <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className={`h-4 w-4 ${theme.textMuted}`} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${theme.text}`}>{product.title}</p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            ${(product.priceCents / 100).toFixed(2)}
                          </p>
                        </div>
                        <ExternalLink className={`h-3.5 w-3.5 shrink-0 ${theme.textMuted}`} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function StorePortalPage({ params: propParams }: { params?: { slug: string; orderId?: string } } = {}) {
  const [matchPortal, paramsPortal] = useRoute("/s/:slug/portal");
  const [matchOrder, paramsOrder] = useRoute("/s/:slug/portal/:orderId");
  const [, customPortalParams] = useRoute("/portal");
  const [, customOrderParams] = useRoute("/portal/:orderId");
  const [, navigate] = useLocation();

  const slug = propParams?.slug || paramsOrder?.slug || paramsPortal?.slug || "";
  const orderId = propParams?.orderId || paramsOrder?.orderId || customOrderParams?.orderId;

  const { data: storeData, isLoading: storeLoading } = useQuery<{
    store: StoreInfo;
    products: any[];
    bundles: any[];
  }>({
    queryKey: ["/api/storefront", slug],
    enabled: !!slug,
  });

  const store = storeData?.store;
  const theme = useStoreBranding(store?.templateKey);

  const { data: customer, isLoading: meLoading } = useQuery<CustomerMe>({
    queryKey: ["/api/customer/me"],
    retry: false,
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/customer/purchases", slug],
    queryFn: async () => {
      const res = await fetch(`/api/customer/purchases?store=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
    enabled: !!customer && !!slug,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/customer/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/purchases"] });
    },
  });

  if (storeLoading || meLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <Loader2 className={`h-6 w-6 animate-spin ${theme.textMuted}`} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className="text-center space-y-3">
          <h2 className={`text-lg font-semibold ${theme.text}`}>Store not found</h2>
          <Link href="/">
            <Button variant="outline" data-testid="button-go-home">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!customer;

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <StoreHeader
        store={store}
        theme={theme}
        customer={isLoggedIn ? customer : null}
        onLogout={() => logoutMutation.mutate()}
        logoutPending={logoutMutation.isPending}
      />

      {!isLoggedIn ? (
        <PortalLogin
          store={store}
          theme={theme}
          onLogin={() => queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] })}
        />
      ) : orderId ? (
        <PortalOrderDetail store={store} theme={theme} orderId={orderId} />
      ) : (
        <PortalPurchases
          store={store}
          theme={theme}
          purchases={purchases}
          isLoading={purchasesLoading}
        />
      )}
    </div>
  );
}
