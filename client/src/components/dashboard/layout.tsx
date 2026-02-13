import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { StoreProvider, useActiveStore } from "@/lib/store-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Store, ChevronsUpDown, Check, Plus, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { CreateStoreDialog } from "@/components/dashboard/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  const style = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <StoreProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <DashboardHeader />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </StoreProvider>
  );
}

function DashboardHeader() {
  const { theme, toggleTheme } = useTheme();
  const { stores, activeStore, activeStoreId, setActiveStoreId } = useActiveStore();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger data-testid="button-sidebar-toggle" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 font-semibold text-base min-w-0"
                data-testid="button-store-switcher"
              >
                <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate max-w-[200px]">
                  {activeStore ? activeStore.name : "Select a store"}
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
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
                        <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
            </DropdownMenuContent>
          </DropdownMenu>

          {activeStore && (
            <Badge variant="outline" className="hidden sm:flex text-xs text-muted-foreground">
              /s/{activeStore.slug}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {activeStore && (
            <a href={`/s/${activeStore.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" data-testid="button-header-storefront">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Storefront</span>
              </Button>
            </a>
          )}
          <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-dashboard-theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <CreateStoreDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
