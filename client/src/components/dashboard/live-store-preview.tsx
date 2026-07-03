import { useState, useRef, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Smartphone, Loader2, Store as StoreIcon } from "lucide-react";
import { BaseTemplate } from "@/components/storefront/base-template";
import { getTheme } from "@/components/storefront/themes";

// Live "test-drive" preview: renders the seller's REAL store + products in the
// chosen theme, morphing instantly as they switch themes. The store is rendered
// pointer-events:none inside a scaled browser frame, so it's a faithful live
// view with zero interaction (no accidental checkout/navigation).

type StorefrontData = {
  store: any;
  products: any[];
  bundles?: any[];
  testimonials?: any[];
  faqs?: any[];
  reviews?: any[];
  subscriberCount?: number;
};

const FRAME_WIDTH = { desktop: 1280, mobile: 390 } as const;
const PREVIEW_HEIGHT = 480;

export function LiveStorePreview({ slug, themeKey }: { slug: string; themeKey: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);

  const { data, isLoading } = useQuery<StorefrontData>({
    queryKey: ["/api/storefront", slug],
    enabled: !!slug,
  });

  const theme = getTheme(themeKey) || getTheme("neon")!;
  const frameWidth = FRAME_WIDTH[device];

  // Fit the framed store to the available width at any panel size.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth - (device === "mobile" ? 0 : 0);
      setScale(Math.min(1, avail / frameWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameWidth, device]);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-muted/20" data-testid="live-store-preview">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 min-w-0 text-center">
          <span className="inline-block max-w-full truncate rounded-md bg-background/60 px-3 py-0.5 text-[11px] font-mono text-muted-foreground">
            {slug}.sellisy.com
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`rounded p-1 transition-colors ${device === "desktop" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Desktop preview"
            data-testid="preview-device-desktop"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`rounded p-1 transition-colors ${device === "mobile" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Mobile preview"
            data-testid="preview-device-mobile"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Live store */}
      <div
        ref={viewportRef}
        className="relative overflow-y-auto overflow-x-hidden bg-background"
        style={{ height: PREVIEW_HEIGHT }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.store ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <StoreIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Save your store to see it live here.</p>
          </div>
        ) : (
          <div
            // `zoom` (not transform) so the scaled store's layout box shrinks
            // too — the scroll area then matches the visual height exactly.
            style={{
              width: frameWidth,
              margin: device === "mobile" ? "0 auto" : undefined,
              pointerEvents: "none",
              ...({ zoom: scale } as React.CSSProperties),
            }}
          >
            <div key={themeKey} className="lsp-morph">
              <BaseTemplate
                store={data.store}
                products={data.products || []}
                bundles={data.bundles || []}
                theme={theme}
                testimonials={data.testimonials || []}
                faqs={data.faqs || []}
                reviews={data.reviews || []}
                subscriberCount={data.subscriberCount ?? 0}
              />
            </div>
          </div>
        )}

        {data?.store && (data.products || []).length === 0 && !isLoading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent px-4 py-3 text-center">
            <span className="text-xs text-muted-foreground">Add products to fill your storefront.</span>
          </div>
        )}
      </div>
    </div>
  );
}
