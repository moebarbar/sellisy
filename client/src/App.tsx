import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import { DashboardLayout } from "@/components/dashboard/layout";
import OverviewPage from "@/pages/dashboard/overview";
import StoresPage from "@/pages/dashboard/stores";
import StoreDetailPage from "@/pages/dashboard/store-detail";
import LibraryPage from "@/pages/dashboard/library";
import StorefrontPage from "@/pages/storefront";
import CheckoutSuccessPage from "@/pages/checkout-success";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        <DashboardLayout><OverviewPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/stores">
        <DashboardLayout><StoresPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/stores/:id">
        <DashboardLayout><StoreDetailPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/library">
        <DashboardLayout><LibraryPage /></DashboardLayout>
      </Route>
      <Route path="/s/:slug" component={StorefrontPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
