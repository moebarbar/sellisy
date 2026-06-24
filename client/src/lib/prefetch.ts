import type { QueryClient } from "@tanstack/react-query";

// Prefetch-on-hover for the dashboard's heaviest pages. Because the global
// staleTime is Infinity (see queryClient.ts), a query warmed here stays cached
// for the session — so when the user actually clicks, the destination renders
// from cache (no loading skeleton) and silently background-refetches where the
// page opts into it (e.g. My Products' refetchOnMount: "always").
//
// Keyed by the sidebar nav url. Unknown routes no-op, so it's safe to call for
// every link. react-query dedupes: a fresh cached query is a cheap early-return,
// so repeated mouseenters don't re-fetch.
//
// IMPORTANT: the queryKeys below must match what each page's useQuery uses, or
// the warm cache won't be hit. Keep in sync with:
//   - my-products.tsx   → /api/products/mine, /api/stores, /api/categories
//   - knowledge-bases.tsx (Content Creator) → /api/knowledge-bases
//   - analytics.tsx     → ["/api/store-analytics", storeId, range]
// Warm the lazy-loaded page chunk too — first-visit latency is code + data,
// not just data. These imports mirror App.tsx's lazy() factories, so Vite
// dedupes them (the module is shared, not loaded twice).
const CHUNK_IMPORTERS: Record<string, () => Promise<unknown>> = {
  "/dashboard/my-products": () => import("@/pages/dashboard/my-products"),
  "/dashboard/content-creator": () => import("@/pages/dashboard/knowledge-bases"),
  "/dashboard/analytics": () => import("@/pages/dashboard/analytics"),
};

export function prefetchDashboardRoute(qc: QueryClient, url: string, activeStoreId: string) {
  // Fire-and-forget the chunk; the browser caches the module for the click.
  CHUNK_IMPORTERS[url]?.().catch(() => {});

  switch (url) {
    case "/dashboard/my-products":
      qc.prefetchQuery({ queryKey: ["/api/products/mine"] });
      qc.prefetchQuery({ queryKey: ["/api/stores"] });
      qc.prefetchQuery({ queryKey: ["/api/categories"] });
      break;

    case "/dashboard/content-creator":
      qc.prefetchQuery({ queryKey: ["/api/knowledge-bases"] });
      break;

    case "/dashboard/analytics":
      // Mirrors analytics.tsx exactly: cookie-auth fetch, default range "30d"
      // (the page's initial useState). Only meaningful once a store is active.
      if (activeStoreId) {
        qc.prefetchQuery({
          queryKey: ["/api/store-analytics", activeStoreId, "30d"],
          queryFn: () =>
            fetch(`/api/store-analytics?storeId=${activeStoreId}&range=30d`, { credentials: "include" }).then((r) => {
              if (!r.ok) throw new Error("Failed");
              return r.json();
            }),
        });
      }
      break;
  }
}
