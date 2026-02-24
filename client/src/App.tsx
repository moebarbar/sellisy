import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";

const LandingPage = lazy(() => import("@/pages/landing"));
const NotFound = lazy(() => import("@/pages/not-found"));
const StorefrontPage = lazy(() => import("@/pages/storefront"));
const ProductDetailPage = lazy(() => import("@/pages/product-detail"));
const BundleDetailPage = lazy(() => import("@/pages/bundle-detail"));
const CheckoutSuccessPage = lazy(() => import("@/pages/checkout-success"));
const ClaimSuccessPage = lazy(() => import("@/pages/claim-success"));

const DashboardLayout = lazy(() =>
  import("@/components/dashboard/layout").then((m) => ({ default: m.DashboardLayout }))
);
const OverviewPage = lazy(() => import("@/pages/dashboard/overview"));
const StoreProductsPage = lazy(() => import("@/pages/dashboard/store-products"));
const BundlesPage = lazy(() => import("@/pages/dashboard/bundles"));
const CouponsPage = lazy(() => import("@/pages/dashboard/coupons"));
const OrdersPage = lazy(() => import("@/pages/dashboard/orders"));
const LibraryPage = lazy(() => import("@/pages/dashboard/library"));
const MyProductsPage = lazy(() => import("@/pages/dashboard/my-products"));
const StoreSettingsPage = lazy(() => import("@/pages/dashboard/store-settings"));
const MarketingPlaybookPage = lazy(() => import("@/pages/dashboard/marketing-playbook"));
const StrategyDetailPage = lazy(() => import("@/pages/dashboard/strategy-detail"));
const KnowledgeBasesPage = lazy(() => import("@/pages/dashboard/knowledge-bases"));
const KbEditorPage = lazy(() => import("@/pages/dashboard/kb-editor"));
const AnalyticsPage = lazy(() => import("@/pages/dashboard/analytics"));
const CustomersPage = lazy(() => import("@/pages/dashboard/customers"));

const AuthPage = lazy(() => import("@/pages/auth"));
const AccountLoginPage = lazy(() => import("@/pages/account/login"));
const AccountVerifyPage = lazy(() => import("@/pages/account/verify"));
const AccountPurchasesPage = lazy(() => import("@/pages/account/purchases"));
const AccountPurchaseDetailPage = lazy(() => import("@/pages/account/purchase-detail"));
const StorePortalPage = lazy(() => import("@/pages/store-portal"));
const KbViewerPage = lazy(() => import("@/pages/kb-viewer"));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-3 text-center">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
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
        <Route path="/dashboard/marketing/:strategyId">
          <DashboardLayout><StrategyDetailPage /></DashboardLayout>
        </Route>
        <Route path="/dashboard/marketing">
          <DashboardLayout><MarketingPlaybookPage /></DashboardLayout>
        </Route>
        <Route path="/dashboard/kb/:id">
          <DashboardLayout><KbEditorPage /></DashboardLayout>
        </Route>
        <Route path="/dashboard/analytics">
          <DashboardLayout><AnalyticsPage /></DashboardLayout>
        </Route>
        <Route path="/dashboard/customers">
          <DashboardLayout><CustomersPage /></DashboardLayout>
        </Route>
        <Route path="/dashboard/content-creator">
          <DashboardLayout><KnowledgeBasesPage /></DashboardLayout>
        </Route>
        <Route path="/auth" component={AuthPage} />
        <Route path="/account" component={AccountLoginPage} />
        <Route path="/account/verify" component={AccountVerifyPage} />
        <Route path="/account/purchases" component={AccountPurchasesPage} />
        <Route path="/account/purchase/:orderId" component={AccountPurchaseDetailPage} />
        <Route path="/s/:slug/portal/:orderId" component={StorePortalPage} />
        <Route path="/s/:slug/portal" component={StorePortalPage} />
        <Route path="/s/:slug/bundle/:bundleId" component={BundleDetailPage} />
        <Route path="/s/:slug/product/:productId" component={ProductDetailPage} />
        <Route path="/s/:slug" component={StorefrontPage} />
        <Route path="/kb/:id" component={KbViewerPage} />
        <Route path="/checkout/success" component={CheckoutSuccessPage} />
        <Route path="/claim/success" component={ClaimSuccessPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
