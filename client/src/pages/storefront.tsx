import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { NeonTemplate } from "@/components/storefront/neon-template";
import { SilkTemplate } from "@/components/storefront/silk-template";
import { usePageMeta } from "@/hooks/use-page-meta";
import { trackEvent } from "@/lib/tracking";
import type { Store, Product, Bundle } from "@shared/schema";

type BundleWithProducts = Bundle & { products: Product[] };

type StorefrontData = {
  store: Store;
  products: Product[];
  bundles?: BundleWithProducts[];
};

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery<StorefrontData>({
    queryKey: ["/api/storefront", params.slug],
  });

  usePageMeta({
    title: data?.store ? `${data.store.name} | Sellisy` : undefined,
    description: data?.store ? (data.store.tagline || `Shop digital products from ${data.store.name}`) : undefined,
    ogImage: data?.store?.logoUrl || undefined,
    ogType: "website",
  });

  useEffect(() => {
    if (data?.store?.id) {
      trackEvent(data.store.id, "page_view");
    }
  }, [data?.store?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <div className="grid gap-4 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (data.store.templateKey === "silk") {
    return <SilkTemplate store={data.store} products={data.products} bundles={data.bundles || []} />;
  }

  return <NeonTemplate store={data.store} products={data.products} bundles={data.bundles || []} />;
}
