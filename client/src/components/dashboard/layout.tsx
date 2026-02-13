import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { StoreProvider } from "@/lib/store-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <StoreProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-background sticky top-0 z-50">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-dashboard-theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </StoreProvider>
  );
}
