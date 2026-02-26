import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/dashboard/template-selector";
import { fireConfetti } from "@/lib/confetti";
import {
  Store, Package, ShoppingBag, DollarSign, TrendingUp, BarChart3,
  Users, Rocket, Zap, Star, ArrowRight, Sparkles, Target,
  Coffee, Flame, Moon as MoonIcon, Sun as SunIcon,
  CheckCircle2, Circle, Palette, Share2, Loader2, ExternalLink,
  CreditCard, Instagram, PenLine, Globe, Mail, Gift, Tag,
  BarChart2, Megaphone, Search, Heart, Video, Lightbulb, Copy,
} from "lucide-react";

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalStores: number;
  topProducts: { title: string; revenue: number; count: number }[];
  revenueByDate: Record<string, number>;
}

function getGreeting(): { text: string; icon: typeof Rocket; subtext: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { text: "Burning the midnight oil", icon: MoonIcon, subtext: "Night owls build empires" };
  if (hour < 9) return { text: "Rise and shine", icon: Coffee, subtext: "Early birds catch the sales" };
  if (hour < 12) return { text: "Good morning", icon: SunIcon, subtext: "Let's make today count" };
  if (hour < 17) return { text: "Good afternoon", icon: Flame, subtext: "You're in the zone" };
  if (hour < 21) return { text: "Good evening", icon: Star, subtext: "Still crushing it" };
  return { text: "Night mode activated", icon: MoonIcon, subtext: "The hustle never sleeps" };
}

const motivations = [
  "Every product you add is a revenue stream waiting to flow.",
  "Your storefront is working for you 24/7 — even while you sleep.",
  "The best time to launch was yesterday. The second best time is now.",
  "Small stores become empires. Keep building.",
  "Your next customer could be browsing right now.",
  "Success is not final, failure is not fatal — it's the courage to continue that counts.",
  "Small daily improvements lead to staggering long-term results.",
  "Don't watch the clock; do what it does — keep going.",
  "The secret to getting ahead is getting started.",
  "Revenue is a byproduct of value. Focus on value.",
  "You don't need a million customers. You need customers who feel like a million.",
  "Build something people want, then tell them about it.",
  "Consistency beats talent when talent doesn't show up.",
  "Your store works while you sleep. Make sure it's stocked.",
  "One product away from your first sale. Keep building.",
  "The comeback is always stronger than the setback.",
  "Progress, not perfection. Ship it.",
  "Entrepreneurs are the only people who work 80 hours to avoid working 40.",
  "Your next customer is out there searching for exactly what you sell.",
  "Dream big. Start small. Act now.",
  "The only limit to your impact is your imagination and commitment.",
  "Done is better than perfect. Launch and iterate.",
  "Every expert was once a beginner. Keep going.",
  "Your digital empire starts with one product and one customer.",
];

function useCountUp(target: number, duration = 1200, enabled = true): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    const start = performance.now();
    const startVal = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return value;
}

function AnimatedStatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  delay = 0,
  testId,
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: typeof DollarSign;
  delay?: number;
  testId: string;
}) {
  const [visible, setVisible] = useState(false);
  const animValue = useCountUp(value, 1200, visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums" data-testid={testId}>
          {prefix}{animValue.toLocaleString()}{suffix}
        </div>
      </CardContent>
    </Card>
  );
}

const CHECKLIST_DISMISSED_KEY = "sellisy_checklist_dismissed";

function InlineStoreCreation() {
  const { toast } = useToast();
  const { setActiveStoreId } = useActiveStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("neon");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stores", { name, slug, templateKey: template });
      return res.json();
    },
    onSuccess: (store: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      fireConfetti();
      toast({ title: "Your store is live!", description: `"${name}" is ready to conquer the world.` });
      if (store?.id) {
        setActiveStoreId(store.id);
      }
      setName("");
      setSlug("");
      setTemplate("neon");
    },
    onError: (err: any) => {
      toast({ title: "Failed to create store", description: err.message, variant: "destructive" });
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  };

  return (
    <div className="p-6 dv-fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="relative inline-block mb-2">
            <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 mx-auto">
              <Rocket className="h-9 w-9 text-primary dv-float" />
            </div>
            <div className="absolute -top-1 -right-1 flex items-center justify-center h-6 w-6 rounded-full bg-primary">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-no-stores">
            Create your first store
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Set up your digital storefront in under 30 seconds. Pick a name, choose a look, and you're live.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onboard-store-name">Store Name</Label>
                  <Input
                    id="onboard-store-name"
                    data-testid="input-store-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Digital Store"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboard-store-slug">URL Slug</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/s/</span>
                    <Input
                      id="onboard-store-slug"
                      data-testid="input-store-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="my-store"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Choose a Template</Label>
                <TemplateSelector value={template} onChange={setTemplate} />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={mutation.isPending || !name || !slug}
                data-testid="button-submit-store"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Rocket className="mr-2 h-4 w-4" />
                Launch Store
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  icon: typeof Store;
  href: string;
  actionLabel: string;
}

function GettingStartedChecklist({ activeStore, storeProducts }: {
  activeStore: any;
  storeProducts: any[] | undefined;
}) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const val = localStorage.getItem(CHECKLIST_DISMISSED_KEY);
      return val === "true";
    } catch {
      return false;
    }
  });

  const hasProducts = (storeProducts?.length ?? 0) > 0;
  const hasPublished = storeProducts?.some((sp: any) => sp.isPublished) ?? false;
  const hasCustomization = !!(activeStore?.logoUrl || activeStore?.accentColor || (activeStore?.templateKey && activeStore.templateKey !== "neon"));
  const hasPayments = !!(activeStore?.stripePublishableKey || activeStore?.paypalClientId);

  const items: ChecklistItem[] = [
    {
      id: "store",
      label: "Create a store",
      description: "You're here — nice work!",
      done: true,
      icon: Store,
      href: "/dashboard",
      actionLabel: "Done",
    },
    {
      id: "products",
      label: "Add products",
      description: "Import from the library or create your own",
      done: hasProducts,
      icon: Package,
      href: "/dashboard/library",
      actionLabel: "Browse Library",
    },
    {
      id: "publish",
      label: "Publish a product",
      description: "Make at least one product visible on your storefront",
      done: hasPublished,
      icon: Zap,
      href: "/dashboard/products",
      actionLabel: "Manage Products",
    },
    {
      id: "customize",
      label: "Customize your store",
      description: "Add a logo, pick an accent color, or change your template",
      done: hasCustomization,
      icon: Palette,
      href: "/dashboard/settings",
      actionLabel: "Store Settings",
    },
    {
      id: "payments",
      label: "Connect payments",
      description: "Set up Stripe or PayPal so you can start accepting money",
      done: hasPayments,
      icon: CreditCard,
      href: "/dashboard/settings",
      actionLabel: "Payment Settings",
    },
    {
      id: "share",
      label: "Share your store link",
      description: "Visit your live storefront and share it with the world",
      done: hasPublished,
      icon: Share2,
      href: `/s/${activeStore?.slug}`,
      actionLabel: "View Storefront",
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;
  const progress = Math.round((completedCount / items.length) * 100);

  if (dismissed) return null;

  return (
    <Card data-testid="getting-started-checklist">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
              <Target className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Getting Started</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allDone ? "All done — you're ready to sell!" : `${completedCount} of ${items.length} complete`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="tabular-nums">{progress}%</Badge>
            {allDone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDismissed(true);
                  try { localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true"); } catch {}
                }}
                data-testid="button-dismiss-checklist"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {items.map((item) => (
            <Link key={item.id} href={item.href}>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors cursor-pointer group ${
                  item.done
                    ? "text-muted-foreground"
                    : "hover:bg-muted/50"
                }`}
                data-testid={`checklist-item-${item.id}`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.done ? "line-through" : ""}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                {!item.done && (
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" tabIndex={-1} data-testid={`button-checklist-${item.id}`}>
                    {item.actionLabel}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ActionPrompt {
  id: string;
  title: string;
  description: string;
  icon: typeof Rocket;
  href: string;
  gradient: string;
  iconColor: string;
}

const actionPrompts: ActionPrompt[] = [
  { id: "instagram", title: "Post on Instagram today?", description: "Your products deserve the spotlight. Show them off!", icon: Instagram, href: "/dashboard/marketing/instagram-strategy", gradient: "from-pink-500/10 to-purple-500/10", iconColor: "text-pink-500" },
  { id: "share", title: "Share your store link", description: "Your store is live 24/7. Let people know!", icon: Globe, href: "", gradient: "from-blue-500/10 to-cyan-500/10", iconColor: "text-blue-500" },
  { id: "blog", title: "Write a blog post", description: "Content is king. Share your expertise!", icon: PenLine, href: "/dashboard/knowledge-base", gradient: "from-emerald-500/10 to-teal-500/10", iconColor: "text-emerald-500" },
  { id: "pinterest", title: "Pin it on Pinterest", description: "Your audience hangs out there. Meet them!", icon: Heart, href: "/dashboard/marketing/pinterest-strategy", gradient: "from-red-500/10 to-orange-500/10", iconColor: "text-red-500" },
  { id: "email", title: "Launch an email campaign", description: "Your subscribers are waiting to hear from you", icon: Mail, href: "/dashboard/marketing/email-list-building", gradient: "from-violet-500/10 to-indigo-500/10", iconColor: "text-violet-500" },
  { id: "bundle", title: "Create a bundle deal", description: "Bundles boost your average order value by 30%", icon: Gift, href: "/dashboard/marketing/bundle-strategy", gradient: "from-amber-500/10 to-yellow-500/10", iconColor: "text-amber-500" },
  { id: "coupon", title: "Set up a coupon", description: "Everyone loves a good deal. Create urgency!", icon: Tag, href: "/dashboard/coupons", gradient: "from-green-500/10 to-emerald-500/10", iconColor: "text-green-500" },
  { id: "analytics", title: "Check your analytics", description: "Data-driven decisions = more sales", icon: BarChart2, href: "/dashboard/analytics", gradient: "from-sky-500/10 to-blue-500/10", iconColor: "text-sky-500" },
  { id: "leadmagnet", title: "Try a lead magnet", description: "Give away something valuable. Grow your list!", icon: Megaphone, href: "/dashboard/marketing/lead-magnet-strategy", gradient: "from-fuchsia-500/10 to-pink-500/10", iconColor: "text-fuchsia-500" },
  { id: "tiktok", title: "Post on TikTok", description: "Short videos sell. Show your product in action!", icon: Video, href: "/dashboard/marketing/tiktok-strategy", gradient: "from-cyan-500/10 to-sky-500/10", iconColor: "text-cyan-500" },
  { id: "seo", title: "Optimize your SEO", description: "Get found by the right people on Google", icon: Search, href: "/dashboard/marketing/seo-basics", gradient: "from-orange-500/10 to-amber-500/10", iconColor: "text-orange-500" },
  { id: "social-proof", title: "Add social proof", description: "Reviews and testimonials build trust fast", icon: Star, href: "/dashboard/marketing/social-proof", gradient: "from-yellow-500/10 to-orange-500/10", iconColor: "text-yellow-500" },
  { id: "paid-ads", title: "Try paid ads", description: "A small budget can go a long way", icon: Zap, href: "/dashboard/marketing/paid-ads-getting-started", gradient: "from-indigo-500/10 to-violet-500/10", iconColor: "text-indigo-500" },
  { id: "storefront", title: "Update your storefront", description: "Fresh look = fresh sales. Try a new template!", icon: Palette, href: "/dashboard/settings", gradient: "from-teal-500/10 to-green-500/10", iconColor: "text-teal-500" },
  { id: "cross-promote", title: "Cross-promote everywhere", description: "Leverage multiple platforms for maximum reach", icon: Lightbulb, href: "/dashboard/marketing/cross-platform-strategy", gradient: "from-rose-500/10 to-red-500/10", iconColor: "text-rose-500" },
];

function WhatsNextSection({ storeSlug }: { storeSlug?: string }) {
  const { toast } = useToast();
  const prompts = useMemo(() => {
    const shuffled = [...actionPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const handleCopyLink = async () => {
    if (!storeSlug) return;
    const url = `${window.location.origin}/s/${storeSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with the world." });
    } catch {
      toast({ title: "Couldn't copy", description: url, variant: "destructive" });
    }
  };

  return (
    <div data-testid="whats-next-section">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-[18px] w-[18px] text-primary" />
          <h2 className="text-base font-semibold">What's Next?</h2>
        </div>
        <Link href="/dashboard/marketing">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="link-all-strategies">
            See all strategies <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {prompts.map((prompt, i) => {
          const Icon = prompt.icon;
          const isShareCard = prompt.id === "share";
          return (
            <Card
              key={prompt.id}
              className={`group overflow-hidden border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dv-fade-in`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`bg-gradient-to-br ${prompt.gradient} p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm ${prompt.iconColor} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mt-3">{prompt.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{prompt.description}</p>
                <div className="mt-3">
                  {isShareCard ? (
                    <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={handleCopyLink} data-testid={`button-action-${prompt.id}`}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                  ) : (
                    <Link href={prompt.href}>
                      <Button variant="secondary" size="sm" className="h-7 text-xs" data-testid={`button-action-${prompt.id}`}>
                        Let's Go <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { user } = useAuth();

  const analyticsUrl = activeStoreId ? `/api/analytics?storeId=${activeStoreId}` : "/api/analytics";
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics", activeStoreId || "all"],
    queryFn: () => fetch(analyticsUrl, { credentials: "include" }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    enabled: !!activeStoreId,
  });

  const { data: storeProducts } = useQuery<any[]>({
    queryKey: ["/api/store-products", activeStoreId],
    enabled: !!activeStoreId,
  });
  const hasPublishedProducts = storeProducts?.some((sp: any) => sp.isPublished) ?? false;
  const hasAnyProducts = (storeProducts?.length ?? 0) > 0;

  const revenueEntries = analytics ? Object.entries(analytics.revenueByDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14) : [];
  const maxRevenue = revenueEntries.length > 0 ? Math.max(...revenueEntries.map(([, v]) => v)) : 0;

  const greeting = useMemo(() => getGreeting(), []);
  const motivation = useMemo(() => motivations[Math.floor(Math.random() * motivations.length)], []);
  const firstName = user?.firstName?.trim() || "there";

  const revenueDollars = ((analytics?.totalRevenue || 0) / 100);
  const revenueWhole = Math.floor(revenueDollars);
  const revenueCents = Math.round((revenueDollars - revenueWhole) * 100);
  const avgOrder = analytics && analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders / 100 : 0;
  const avgWhole = Math.floor(avgOrder);
  const avgCents = Math.round((avgOrder - avgWhole) * 100);

  if (!storesLoading && !activeStoreId) {
    return <InlineStoreCreation />;
  }

  return (
    <div className="p-6 space-y-6 dv-fade-in">
      <div className="relative overflow-hidden rounded-md border bg-gradient-to-br from-primary/5 via-background to-primary/3 p-6" data-testid="welcome-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <greeting.icon className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-overview-title">
                {greeting.text}, {firstName}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {greeting.subtext} — {activeStore?.name}
            </p>
            <p className="text-xs text-muted-foreground/60 italic mt-2 max-w-md">
              "{motivation}"
            </p>
          </div>
          <Link href={`/s/${activeStore?.slug}`}>
            <Button variant="outline" size="sm" data-testid="button-view-storefront">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Storefront
            </Button>
          </Link>
        </div>
      </div>

      <GettingStartedChecklist activeStore={activeStore} storeProducts={storeProducts} />

      <WhatsNextSection storeSlug={activeStore?.slug} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <AnimatedStatCard
              title="Total Revenue"
              value={revenueWhole}
              prefix="$"
              suffix={`.${String(revenueCents).padStart(2, "0")}`}
              icon={DollarSign}
              delay={0}
              testId="text-total-revenue"
            />
            <AnimatedStatCard
              title="Total Orders"
              value={analytics?.totalOrders ?? 0}
              icon={ShoppingBag}
              delay={100}
              testId="text-order-count"
            />
            <AnimatedStatCard
              title="Active Products"
              value={analytics?.totalProducts ?? 0}
              icon={Package}
              delay={200}
              testId="text-product-count"
            />
            <AnimatedStatCard
              title="Avg. Order"
              value={avgWhole}
              prefix="$"
              suffix={`.${String(avgCents).padStart(2, "0")}`}
              icon={Users}
              delay={300}
              testId="text-avg-order"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-base font-semibold">Revenue (Last 14 Days)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : revenueEntries.length > 0 ? (
              <div className="flex items-end gap-1 h-40" data-testid="chart-revenue">
                {revenueEntries.map(([date, value], idx) => {
                  const height = maxRevenue > 0 ? Math.max(4, (value / maxRevenue) * 100) : 4;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-t-sm bg-primary/80 group-hover:bg-primary transition-all duration-500 dv-bar-grow"
                          style={{ height: `${height}%`, animationDelay: `${idx * 60}ms` } as React.CSSProperties}
                          title={`${date}: $${(value / 100).toFixed(2)}`}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-3 dv-float" />
                <p className="text-sm text-muted-foreground">No revenue yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Your first sale will light up this chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <div className="space-y-3" data-testid="list-top-products">
                {analytics.topProducts.map((product, i) => (
                  <div key={product.title} className="flex items-center gap-3 dv-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{product.title}</span>
                    <Badge variant="secondary">{product.count} sold</Badge>
                    <span className="text-sm font-bold tabular-nums">${(product.revenue / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-3 dv-float" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Your bestsellers will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics && analytics.totalOrders === 0 && analytics.totalProducts > 0 && (
        <Card className="border-dashed dv-fade-in">
          <CardContent className="flex items-center gap-4 py-5 flex-wrap">
            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Your products are ready — now share the link</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send your storefront URL to potential customers and watch orders roll in.
              </p>
            </div>
            <Link href={`/s/${activeStore?.slug}`}>
              <Button size="sm" data-testid="button-share-tip">
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Visit Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
