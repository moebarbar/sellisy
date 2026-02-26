import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useActiveStore } from "@/lib/store-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { fireConfetti } from "@/lib/confetti";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
import { TemplateSelector } from "@/components/dashboard/template-selector";
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
} from "lucide-react";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Products", url: "/dashboard/products", icon: Package },
  { title: "My Products", url: "/dashboard/my-products", icon: Sparkles },
  { title: "Products Library", url: "/dashboard/library", icon: ShoppingBag },
  { title: "Content Creator", url: "/dashboard/content-creator", icon: PenTool },
  { title: "Blog", url: "/dashboard/blog", icon: FileText },
  { title: "Bundles", url: "/dashboard/bundles", icon: Layers },
  { title: "Marketing", url: "/dashboard/marketing", icon: BookOpen },
  { title: "Coupons", url: "/dashboard/coupons", icon: Ticket },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const TIER_BADGE_STYLES: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  pro: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  max: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { tier } = useUserProfile();
  const { setOpenMobile } = useSidebar();

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
          <span className="text-lg font-bold tracking-tight cursor-pointer" data-testid="link-sidebar-home">
            Sellisy
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
                    <Link href={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon className="h-4 w-4" />
                      <span data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
              {tier.toUpperCase()} plan
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); window.location.href = "/auth"; }}
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
      onClose();
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Store</DialogTitle>
          <DialogDescription>Set up your storefront in seconds.</DialogDescription>
        </DialogHeader>
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
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="my-store"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <TemplateSelector value={template} onChange={setTemplate} />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !name || !slug}
            data-testid="button-submit-store"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Store
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
