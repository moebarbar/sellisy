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
import StoreProductsPage from "@/pages/dashboard/store-products";
import BundlesPage from "@/pages/dashboard/bundles";
import CouponsPage from "@/pages/dashboard/coupons";
import OrdersPage from "@/pages/dashboard/orders";
import LibraryPage from "@/pages/dashboard/library";
import MyProductsPage from "@/pages/dashboard/my-products";
import StoreSettingsPage from "@/pages/dashboard/store-settings";
import StorefrontPage from "@/pages/storefront";
import ProductDetailPage from "@/pages/product-detail";
import BundleDetailPage from "@/pages/bundle-detail";
import CheckoutSuccessPage from "@/pages/checkout-success";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        <DashboardLayout><OverviewPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/products">
        <DashboardLayout><StoreProductsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/bundles">
        <DashboardLayout><BundlesPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/coupons">
        <DashboardLayout><CouponsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/orders">
        <DashboardLayout><OrdersPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/library">
        <DashboardLayout><LibraryPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/my-products">
        <DashboardLayout><MyProductsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/settings">
        <DashboardLayout><StoreSettingsPage /></DashboardLayout>
      </Route>
      <Route path="/s/:slug/bundle/:bundleId" component={BundleDetailPage} />
      <Route path="/s/:slug/product/:productId" component={ProductDetailPage} />
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
