import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useActiveStore } from "@/lib/store-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { prefetchDashboardRoute } from "@/lib/prefetch";
import { useToast } from "@/hooks/use-toast";
import { fireConfetti } from "@/lib/confetti";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { TemplateSelector } from "@/components/dashboard/template-selector";
import { AiLaunchWizard } from "@/components/dashboard/ai-launch-wizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Package,
  Layers,
  Ticket,
  Loader2,
  Settings,
  Sparkles,
  Crown,
  BookOpen,
  PenTool,
  BarChart3,
  Users,
  FileText,
  ShieldCheck,
  Mail,
  Handshake,
  Wallet,
  GraduationCap,
  BrainCircuit,
} from "lucide-react";

// Grouped IA — five labeled sections instead of one flat 16-item list.
// "Overview" and "Settings" sit outside the groups (always-visible anchors
// at top and bottom).
type NavItem = { title: string; url: string; icon: typeof Package };

const navGroups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ title: "Overview", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sell",
    items: [
      { title: "Products", url: "/dashboard/products", icon: Package },
      { title: "My Products", url: "/dashboard/my-products", icon: Sparkles },
      { title: "Browse Library", url: "/dashboard/library", icon: ShoppingBag },
      { title: "Bundles", url: "/dashboard/bundles", icon: Layers },
      { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Courses", url: "/dashboard/courses", icon: GraduationCap },
      { title: "Content Creator", url: "/dashboard/content-creator", icon: PenTool },
      { title: "Blog", url: "/dashboard/blog", icon: FileText },
    ],
  },
  {
    label: "Grow",
    items: [
      { title: "Marketing", url: "/dashboard/marketing", icon: BookOpen },
      { title: "Newsletter", url: "/dashboard/newsletter", icon: Mail },
      { title: "Coupons", url: "/dashboard/coupons", icon: Ticket },
      { title: "Affiliates", url: "/dashboard/affiliates", icon: Handshake },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Brain", url: "/dashboard/brain", icon: BrainCircuit },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "Customers", url: "/dashboard/customers", icon: Users },
    ],
  },
  {
    label: null,
    items: [{ title: "Settings", url: "/dashboard/settings", icon: Settings }],
  },
];

const TIER_BADGE_STYLES: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  max: "bg-amber-500/10 text-amber-400",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { tier, isAdmin, isOnTrial } = useUserProfile();
  const { setOpenMobile } = useSidebar();
  const { activeStore, activeStoreId } = useActiveStore();

  // Show "Earnings" nav only if this user is an affiliate for at least one store.
  // Cheap GET — same endpoint the earnings page uses.
  const { data: myAffiliations } = useQuery<any[]>({
    queryKey: ["/api/affiliate/me"],
  });
  const hasAffiliations = (myAffiliations?.length ?? 0) > 0;

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email || "User";

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <span className="text-2xl tracking-tight cursor-pointer" data-testid="link-sidebar-home" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            SELL<span className="text-primary">I</span>SY
          </span>
        </Link>
        {/* Active-store context. The header badge showing /s/<slug> is hidden
            on mobile (hidden sm:flex in layout.tsx), so this is the only
            which-store-am-I-editing signal when the drawer opens on a phone. */}
        {activeStore && (
          <span className="text-xs text-muted-foreground truncate" data-testid="text-sidebar-active-store">
            {activeStore.name}
          </span>
        )}
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, gi) => (
          <SidebarGroup key={group.label ?? `group-${gi}`} className={group.label ? undefined : "py-0"}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.url === "/dashboard"
                          ? location === "/dashboard"
                          : item.url === "/dashboard/content-creator"
                            ? location.startsWith("/dashboard/content-creator") || location.startsWith("/dashboard/kb/")
                            : location.startsWith(item.url)
                      }
                    >
                      <Link
                        href={item.url}
                        onClick={() => setOpenMobile(false)}
                        onMouseEnter={() => prefetchDashboardRoute(queryClient, item.url, activeStoreId)}
                        onFocus={() => prefetchDashboardRoute(queryClient, item.url, activeStoreId)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {/* Conditional items render inside the last group so they sit at the bottom */}
                {gi === navGroups.length - 1 && hasAffiliations && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/dashboard/earnings")}>
                      <Link href="/dashboard/earnings" onClick={() => setOpenMobile(false)}>
                        <Wallet className="h-4 w-4" />
                        <span data-testid="link-nav-earnings">My Earnings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {gi === navGroups.length - 1 && isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/dashboard/data-health")}>
                      <Link href="/dashboard/data-health" onClick={() => setOpenMobile(false)}>
                        <ShieldCheck className="h-4 w-4" />
                        <span data-testid="link-nav-data-health">Data Health</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={displayName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block" data-testid="text-username">
              {displayName}
            </span>
            <Badge className={`text-[10px] border-0 gap-0.5 ${TIER_BADGE_STYLES[tier]}`} data-testid="badge-plan-tier">
              {tier === "max" ? <Crown className="h-2.5 w-2.5" /> : tier === "pro" ? <Sparkles className="h-2.5 w-2.5" /> : null}
              {isOnTrial ? "TRIAL" : `${tier.toUpperCase()} plan`}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function CreateStoreDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("neon");
  const [slugError, setSlugError] = useState<string | null>(null);
  const { toast } = useToast();
  const { setActiveStoreId } = useActiveStore();

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
      setSlugError(null);
      onClose();
    },
    onError: (err: any) => {
      // Slug conflicts render inline at the field; other failures toast.
      if (/slug|taken|409/i.test(err.message)) {
        setSlugError("That URL slug is already taken — try another.");
      } else {
        toast({ title: "Failed to create store", description: err.message, variant: "destructive" });
      }
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    setSlugError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Store</DialogTitle>
          <DialogDescription>Describe it and let AI build it, or set it up yourself.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="ai">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="ai" data-testid="tab-dialog-ai">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Launch with AI
            </TabsTrigger>
            <TabsTrigger value="manual" data-testid="tab-dialog-manual">Start from scratch</TabsTrigger>
          </TabsList>
          <TabsContent value="ai">
            <AiLaunchWizard key={String(open)} onNavigate={onClose} />
          </TabsContent>
          <TabsContent value="manual">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="store-name">Store Name</Label>
            <Input
              id="store-name"
              data-testid="input-store-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Digital Store"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-slug">URL Slug</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">/s/</span>
              <Input
                id="store-slug"
                data-testid="input-store-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setSlugError(null);
                }}
                placeholder="my-store"
                aria-invalid={!!slugError}
                aria-describedby={slugError ? "store-slug-error" : undefined}
                required
              />
            </div>
            <FieldError id="store-slug-error" error={slugError} />
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <TemplateSelector value={template} onChange={setTemplate} />
          </div>
          <Button
            type="submit"
            className="w-full cta-mono"
            disabled={mutation.isPending || !name || !slug}
            data-testid="button-submit-store"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Store
          </Button>
        </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
