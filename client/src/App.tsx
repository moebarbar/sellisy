import { lazy, Suspense, useEffect, useRef, useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { DashboardLayout } from "@/components/dashboard/layout";
import { isCustomDomain } from "@/lib/utils";
import { ClerkAuthBridge } from "@/lib/clerk-bridge";

const LandingPage = lazy(() => import("@/pages/landing"));
const NotFound = lazy(() => import("@/pages/not-found"));
const StorefrontPage = lazy(() => import("@/pages/storefront"));
const ProductDetailPage = lazy(() => import("@/pages/product-detail"));
const BundleDetailPage = lazy(() => import("@/pages/bundle-detail"));
const CheckoutSuccessPage = lazy(() => import("@/pages/checkout-success"));
const ClaimSuccessPage = lazy(() => import("@/pages/claim-success"));

const OverviewPage = lazy(() => import("@/pages/dashboard/overview"));
const StoreProductsPage = lazy(() => import("@/pages/dashboard/store-products"));
const BundlesPage = lazy(() => import("@/pages/dashboard/bundles"));
const CouponsPage = lazy(() => import("@/pages/dashboard/coupons"));
const OrdersPage = lazy(() => import("@/pages/dashboard/orders"));
const LibraryPage = lazy(() => import("@/pages/dashboard/library"));
const MyProductsPage = lazy(() => import("@/pages/dashboard/my-products"));
const CoursesPage = lazy(() => import("@/pages/dashboard/courses"));
const StoreSettingsPage = lazy(() => import("@/pages/dashboard/store-settings"));
const MarketingPlaybookPage = lazy(() => import("@/pages/dashboard/marketing-playbook"));
const StrategyDetailPage = lazy(() => import("@/pages/dashboard/strategy-detail"));
const KnowledgeBasesPage = lazy(() => import("@/pages/dashboard/knowledge-bases"));
const KbEditorPage = lazy(() => import("@/pages/dashboard/kb-editor"));
const AnalyticsPage = lazy(() => import("@/pages/dashboard/analytics"));
const BrainPage = lazy(() => import("@/pages/dashboard/brain"));
const CustomersPage = lazy(() => import("@/pages/dashboard/customers"));
const BlogPostsPage = lazy(() => import("@/pages/dashboard/blog-posts"));
const BlogEditorPage = lazy(() => import("@/pages/dashboard/blog-editor"));
const NewsletterCampaignsPage = lazy(() => import("@/pages/dashboard/newsletter-campaigns"));
const NewsletterCampaignEditorPage = lazy(() => import("@/pages/dashboard/newsletter-campaign-editor"));
const DataHealthPage = lazy(() => import("@/pages/dashboard/data-health"));
const GumroadImporterPage = lazy(() => import("@/pages/dashboard/gumroad-importer"));
const AffiliatesPage = lazy(() => import("@/pages/dashboard/affiliates"));

const AuthPage = lazy(() => import("@/pages/auth"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const AboutPage = lazy(() => import("@/pages/about"));
const DataDeletionPage = lazy(() => import("@/pages/data-deletion"));
const TermsPage = lazy(() => import("@/pages/terms"));
const AccountLoginPage = lazy(() => import("@/pages/account/login"));
const AccountVerifyPage = lazy(() => import("@/pages/account/verify"));
const AccountPurchasesPage = lazy(() => import("@/pages/account/purchases"));
const AccountPurchaseDetailPage = lazy(() => import("@/pages/account/purchase-detail"));
const StorePortalPage = lazy(() => import("@/pages/store-portal"));
const KbViewerPage = lazy(() => import("@/pages/kb-viewer"));
const BlogListingPage = lazy(() => import("@/pages/blog-listing"));
const BlogPostPage = lazy(() => import("@/pages/blog-post"));
const EmbedProductWidget = lazy(() => import("@/pages/embed-widget"));
const EmbedBundleWidget = lazy(() => import("@/pages/embed-widget").then(m => ({ default: m.EmbedBundleWidget })));
const ProductsPage = lazy(() => import("@/pages/products"));
const DiscoverPage = lazy(() => import("@/pages/discover"));
const VersusPage = lazy(() => import("@/pages/versus"));
const BlogIndexPage = lazy(() => import("@/pages/blog-index"));
const BlogArticlePage = lazy(() => import("@/pages/blog-article"));
const AffiliateApplyPage = lazy(() => import("@/pages/affiliate-apply"));
const EarningsPage = lazy(() => import("@/pages/dashboard/earnings"));
const CoursePlayerPage = lazy(() => import("@/pages/course-player"));

// True when a lazy() import failed — the classic stale-deploy symptom: the
// open tab's shell references hashed chunk files that no longer exist after
// a redeploy. The only fix is a reload, which fetches the new shell.
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i.test(
    `${error.name}: ${error.message}`,
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallbackClassName?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallbackClassName?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);

    // Stale-chunk after a deploy → auto-reload ONCE to pick up the new
    // shell. The sessionStorage guard prevents a reload loop if the reload
    // doesn't fix it (e.g. genuine network failure).
    if (isChunkLoadError(error)) {
      const key = "sellisy_chunk_reload";
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
          return;
        }
        // Clear the guard after 30s so a LATER deploy can auto-recover too.
        const at = Number(sessionStorage.getItem(key));
        if (Date.now() - at > 30_000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      } catch {}
    }
  }

  // Reset when the user navigates — a crash on one page must not brick
  // every other page behind a full-screen error until a hard reload.
  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);
      return (
        <ErrorBoundaryFallback
          fallbackClassName={this.props.fallbackClassName}
          onReset={this.reset}
          chunkError={chunkError}
          message={this.state.error?.message}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorBoundaryFallback({ fallbackClassName, onReset, chunkError, message }: {
  fallbackClassName?: string;
  onReset: () => void;
  chunkError: boolean;
  message?: string;
}) {
  // Navigating away (sidebar click, back button) resets the boundary so the
  // next page gets a fresh render instead of the stuck error screen.
  const [location] = useLocation();
  const initialLocation = useRef(location);
  useEffect(() => {
    if (location !== initialLocation.current) onReset();
  }, [location, onReset]);

  return (
    <div className={fallbackClassName || "min-h-screen flex items-center justify-center bg-background"}>
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {chunkError
            ? "The app was updated while this tab was open. Reload to get the latest version."
            : "An unexpected error occurred while loading this page. Please try again."}
        </p>
        {message && !chunkError && (
          <p className="text-xs text-muted-foreground/60 font-mono break-words" data-testid="text-error-detail">
            {message.slice(0, 200)}
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          data-testid="button-error-reload"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

function FadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(4px)";
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.15s ease, transform 0.15s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    }
  }, []);
  return <div ref={ref}>{children}</div>;
}

function DashboardRouter() {
  const [location] = useLocation();

  return (
    <ErrorBoundary fallbackClassName="flex items-center justify-center py-20">
      <Suspense fallback={<DashboardFallback />}>
        <FadeIn key={location}>
          <Switch>
            <Route path="/dashboard" component={OverviewPage} />
            <Route path="/dashboard/products" component={StoreProductsPage} />
            <Route path="/dashboard/bundles" component={BundlesPage} />
            <Route path="/dashboard/coupons" component={CouponsPage} />
            <Route path="/dashboard/affiliates" component={AffiliatesPage} />
            <Route path="/dashboard/earnings" component={EarningsPage} />
            <Route path="/dashboard/orders" component={OrdersPage} />
            <Route path="/dashboard/library" component={LibraryPage} />
            <Route path="/dashboard/my-products" component={MyProductsPage} />
            <Route path="/dashboard/courses" component={CoursesPage} />
            <Route path="/dashboard/settings" component={StoreSettingsPage} />
            <Route path="/dashboard/marketing/:strategyId" component={StrategyDetailPage} />
            <Route path="/dashboard/marketing" component={MarketingPlaybookPage} />
            <Route path="/dashboard/kb/:id" component={KbEditorPage} />
            <Route path="/dashboard/analytics" component={AnalyticsPage} />
            <Route path="/dashboard/brain" component={BrainPage} />
            <Route path="/dashboard/customers" component={CustomersPage} />
            <Route path="/dashboard/content-creator" component={KnowledgeBasesPage} />
            <Route path="/dashboard/blog/:id" component={BlogEditorPage} />
            <Route path="/dashboard/blog" component={BlogPostsPage} />
            <Route path="/dashboard/newsletter/:id" component={NewsletterCampaignEditorPage} />
            <Route path="/dashboard/newsletter" component={NewsletterCampaignsPage} />
            <Route path="/dashboard/data-health" component={DataHealthPage} />
            <Route path="/dashboard/import/gumroad" component={GumroadImporterPage} />
          </Switch>
        </FadeIn>
      </Suspense>
    </ErrorBoundary>
  );
}

function CustomDomainRouter() {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const resolved = useRef(false);

  useEffect(() => {
    if (resolved.current) return;
    resolved.current = true;
    fetch(`/api/resolve-domain?host=${encodeURIComponent(window.location.hostname)}`)
      .then(r => r.json())
      .then(data => {
        setSlug(data.store?.slug || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <PageFallback />;
  if (!slug) return <NotFound />;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/product/:productId">{(params: any) => <ProductDetailPage params={{ slug, productId: params.productId }} />}</Route>
          <Route path="/p/:productId">{(params: any) => <ProductDetailPage params={{ slug, productId: params.productId }} />}</Route>
          <Route path="/bundle/:bundleId">{(params: any) => <BundleDetailPage params={{ slug, bundleId: params.bundleId }} />}</Route>
          <Route path="/portal/:orderId">{(params: any) => <StorePortalPage params={{ slug, orderId: params.orderId }} />}</Route>
          <Route path="/portal">{() => <StorePortalPage params={{ slug }} />}</Route>
          <Route path="/blog/:postSlug">{(params: any) => <BlogPostPage params={{ slug, postSlug: params.postSlug }} />}</Route>
          <Route path="/blog">{() => <BlogListingPage params={{ slug }} />}</Route>
          <Route path="/checkout/success" component={CheckoutSuccessPage} />
          <Route path="/claim/success" component={ClaimSuccessPage} />
          <Route path="/kb/:id" component={KbViewerPage} />
          <Route path="/account" component={AccountLoginPage} />
          <Route path="/account/verify" component={AccountVerifyPage} />
          <Route path="/account/purchases" component={AccountPurchasesPage} />
          <Route path="/account/purchase/:orderId" component={AccountPurchaseDetailPage} />
          <Route>{() => <StorefrontPage params={{ slug }} />}</Route>
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function Router() {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/dashboard");
  const customDomain = isCustomDomain();

  if (customDomain) return <CustomDomainRouter />;

  return (
    <>
      {isDashboard ? (
        <DashboardLayout>
          <DashboardRouter />
        </DashboardLayout>
      ) : (
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/products" component={ProductsPage} />
              <Route path="/discover" component={DiscoverPage} />
              <Route path="/vs/:slug" component={VersusPage} />
              <Route path="/blog" component={BlogIndexPage} />
              <Route path="/blog/:slug" component={BlogArticlePage} />
              <Route path="/vs" component={VersusPage} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/privacy" component={PrivacyPage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/data-deletion" component={DataDeletionPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/account" component={AccountLoginPage} />
              <Route path="/account/verify" component={AccountVerifyPage} />
              <Route path="/account/purchases" component={AccountPurchasesPage} />
              <Route path="/account/purchase/:orderId" component={AccountPurchaseDetailPage} />
              <Route path="/s/:slug/portal/:orderId" component={StorePortalPage} />
              <Route path="/s/:slug/portal" component={StorePortalPage} />
              <Route path="/embed/:slug/product/:productId" component={EmbedProductWidget} />
              <Route path="/embed/:slug/bundle/:bundleId" component={EmbedBundleWidget} />
              <Route path="/s/:slug/blog/:postSlug" component={BlogPostPage} />
              <Route path="/s/:slug/blog" component={BlogListingPage} />
              <Route path="/s/:slug/bundle/:bundleId" component={BundleDetailPage} />
              <Route path="/s/:slug/product/:productId" component={ProductDetailPage} />
              <Route path="/s/:slug/affiliate" component={AffiliateApplyPage} />
              <Route path="/course/:token/:productId" component={CoursePlayerPage} />
              <Route path="/s/:slug" component={StorefrontPage} />
              <Route path="/kb/:id" component={KbViewerPage} />
              <Route path="/checkout/success" component={CheckoutSuccessPage} />
              <Route path="/claim/success" component={ClaimSuccessPage} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkAuthBridge />
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
