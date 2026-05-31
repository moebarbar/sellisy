// SSR entry — exports renderPath(path) that returns the rendered HTML
// body for a given marketing route. Eager imports (no lazy()) so
// renderToString returns synchronously without hitting Suspense fallbacks.
//
// Reuses the same component tree the client mounts at runtime, so the
// produced HTML hydrates without mismatch. Clerk is stubbed via
// vite.ssr.config.ts alias so useUser() returns a logged-out state.

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LandingPage from "../pages/landing";
import ProductsPage from "../pages/products";
import DiscoverPage from "../pages/discover";
import PrivacyPage from "../pages/privacy";
import TermsPage from "../pages/terms";
import DataDeletionPage from "../pages/data-deletion";
import VersusPage from "../pages/versus";

// Minimal query client just to satisfy useQuery hooks at module-eval time.
// Queries marked enabled:false won't fire; queries with cached data render
// what's cached. Since the marketing components don't depend on real API
// data to render their static copy, this is enough.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: Infinity },
  },
});

function MarketingSwitch() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/discover" component={DiscoverPage} />
      <Route path="/vs/:slug" component={VersusPage} />
      <Route path="/vs" component={VersusPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/data-deletion" component={DataDeletionPage} />
    </Switch>
  );
}

export function renderPath(path: string): string {
  const tree = createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(
      Router as any,
      { ssrPath: path },
      createElement(MarketingSwitch),
    ),
  );
  return renderToString(tree);
}
