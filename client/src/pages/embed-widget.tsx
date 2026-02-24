import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { ExternalLink, Package, Layers } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function EmbedCard({ type, slug, itemId }: { type: "product" | "bundle"; slug: string; itemId: string }) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const theme = params.get("theme") === "dark" ? "dark" : "light";

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/embed", slug, type, itemId],
    queryFn: async () => {
      const res = await fetch(`/api/embed/${slug}/${type}/${itemId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ width: 24, height: 24, border: "3px solid #e5e7eb", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "system-ui, -apple-system, sans-serif", color: "#9ca3af", fontSize: 14 }}>
        Widget unavailable
      </div>
    );
  }

  const { store, item } = data;
  const accent = store.accentColor || "#6366f1";
  const rgb = hexToRgb(accent);
  const isDark = theme === "dark";

  const title = type === "product" ? item.title : item.name;
  const description = item.description;
  const priceCents = item.priceCents;
  const originalPriceCents = type === "product" ? item.originalPriceCents : null;
  const isFree = item.isLeadMagnet;
  const thumbnailUrl = item.thumbnailUrl;
  const productCount = type === "bundle" ? item.productCount : null;

  const storeUrl = type === "product"
    ? `/s/${slug}/product/${itemId}`
    : `/s/${slug}/bundle/${itemId}`;

  const hasSavings = originalPriceCents && originalPriceCents > priceCents;
  const savingsPercent = hasSavings ? Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100) : 0;

  const bg = isDark ? "#1a1a2e" : "#ffffff";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const cardShadow = isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)";

  return (
    <div
      data-testid="embed-widget-card"
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: bg,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        boxShadow: cardShadow,
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        maxWidth: 480,
        width: "100%",
        height: "auto",
        minHeight: 160,
      }}
    >
      {thumbnailUrl ? (
        <div style={{
          width: 160,
          minHeight: 160,
          flexShrink: 0,
          background: isDark ? "#0f0f23" : "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          <img
            src={thumbnailUrl}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            data-testid="embed-widget-thumbnail"
          />
        </div>
      ) : (
        <div style={{
          width: 160,
          minHeight: 160,
          flexShrink: 0,
          background: isDark ? "#0f0f23" : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {type === "product" ? (
            <Package style={{ width: 40, height: 40, color: textSecondary }} />
          ) : (
            <Layers style={{ width: 40, height: 40, color: textSecondary }} />
          )}
        </div>
      )}

      <div style={{
        flex: 1,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 8,
        minWidth: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: textPrimary,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              data-testid="embed-widget-title"
            >
              {title}
            </h3>
            {productCount != null && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: accent,
                background: `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`,
                padding: "2px 7px",
                borderRadius: 20,
                whiteSpace: "nowrap",
              }}>
                {productCount} items
              </span>
            )}
          </div>
          {description && (
            <p style={{
              margin: 0,
              fontSize: 13,
              color: textSecondary,
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any,
              overflow: "hidden",
            }}
            data-testid="embed-widget-description"
            >
              {description}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {isFree ? (
              <span style={{ fontSize: 18, fontWeight: 800, color: accent }} data-testid="embed-widget-price">Free</span>
            ) : (
              <>
                <span style={{ fontSize: 18, fontWeight: 800, color: textPrimary }} data-testid="embed-widget-price">
                  {formatPrice(priceCents)}
                </span>
                {hasSavings && (
                  <>
                    <span style={{ fontSize: 13, color: textSecondary, textDecoration: "line-through" }}>
                      {formatPrice(originalPriceCents)}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#16a34a",
                      background: isDark ? "rgba(22,163,74,0.15)" : "rgba(22,163,74,0.08)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}>
                      -{savingsPercent}%
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: accent,
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.15s",
              whiteSpace: "nowrap",
            }}
            data-testid="embed-widget-buy-button"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {isFree ? "Get Free" : "Buy Now"}
            <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.5 }}>
          <span style={{ fontSize: 10, color: textSecondary }}>
            {store.name}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EmbedProductWidget() {
  const params = useParams<{ slug: string; productId: string }>();
  return (
    <div style={{ padding: 8 }}>
      <EmbedCard type="product" slug={params.slug} itemId={params.productId} />
    </div>
  );
}

export function EmbedBundleWidget() {
  const params = useParams<{ slug: string; bundleId: string }>();
  return (
    <div style={{ padding: 8 }}>
      <EmbedCard type="bundle" slug={params.slug} itemId={params.bundleId} />
    </div>
  );
}
