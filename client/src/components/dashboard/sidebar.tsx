import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useActiveStore } from "@/lib/store-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Store,
  Library,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Package,
  Layers,
  Ticket,
  Plus,
  ChevronsUpDown,
  ExternalLink,
  Check,
  Loader2,
  Settings,
} from "lucide-react";

const storeNavItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/dashboard/products", icon: Package },
  { title: "Bundles", url: "/dashboard/bundles", icon: Layers },
  { title: "Coupons", url: "/dashboard/coupons", icon: Ticket },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
  { title: "Library", url: "/dashboard/library", icon: Library },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const globalNavItems = [
  { title: "My Products", url: "/dashboard/my-products", icon: Package },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { stores, activeStore, activeStoreId, setActiveStoreId } = useActiveStore();
  const [createOpen, setCreateOpen] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email || "User";

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 space-y-3">
        <Link href="/">
          <span className="text-lg font-bold tracking-tight cursor-pointer" data-testid="link-sidebar-home">
            DigitalVault
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              data-testid="button-store-selector"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Store className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {activeStore ? activeStore.name : "Select a store"}
                </span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
            {stores.length > 0 && (
              <>
                <DropdownMenuLabel>Your Stores</DropdownMenuLabel>
                {stores.map((store) => (
                  <DropdownMenuItem
                    key={store.id}
                    onClick={() => setActiveStoreId(store.id)}
                    data-testid={`menu-store-${store.id}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Store className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{store.name}</span>
                      {store.id === activeStoreId && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => setCreateOpen(true)}
              data-testid="menu-create-store"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Create New Store
            </DropdownMenuItem>
            {activeStore && (
              <DropdownMenuItem asChild>
                <Link href={`/s/${activeStore.slug}`} className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View Storefront</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Store</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {storeNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/dashboard"
                        ? location === "/dashboard"
                        : location.startsWith(item.url)
                    }
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span data-testid={`link-nav-${item.title.toLowerCase()}`}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Global</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {globalNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.startsWith(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span data-testid={`link-nav-${item.title.toLowerCase()}`}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={displayName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate flex-1 min-w-0" data-testid="text-username">
            {displayName}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => { window.location.href = "/api/logout"; }}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>

      <CreateStoreDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Sidebar>
  );
}

function CreateStoreDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      toast({ title: "Store created", description: `"${name}" is ready to go.` });
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
      <DialogContent>
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
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger data-testid="select-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neon">Neon — Bold & Modern</SelectItem>
                <SelectItem value="silk">Silk — Elegant & Minimal</SelectItem>
              </SelectContent>
            </Select>
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
