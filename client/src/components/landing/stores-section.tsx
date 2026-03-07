import { useQuery } from "@tanstack/react-query";
import { Store, ExternalLink, Package, Palette } from "lucide-react";

interface DiscoverStore {
  id: string;
  name: string;
  slug: string;
  templateKey: string | null;
  tagline: string | null;
  logoUrl: string | null;
  productCount: number;
}

const templateLabels: Record<string, string> = {
  starter: "Starter",
  neon: "Neon",
  silk: "Silk",
  midnight: "Midnight",
  aurora: "Aurora",
  ember: "Ember",
  frost: "Frost",
};

const templateColors: Record<string, string> = {
  starter: "#F5E642",
  neon: "#00F5D4",
  silk: "#FF3CAC",
  midnight: "#6366f1",
  aurora: "#a855f7",
  ember: "#FF6B35",
  frost: "#38bdf8",
};

export function StoresSection() {
  const { data: stores, isLoading } = useQuery<DiscoverStore[]>({
    queryKey: ["/api/discover/stores"],
  });

  const displayed = (stores || []).slice(0, 6);

  return (
    <section
      data-testid="stores-section"
      style={{ padding: "clamp(60px, 10vw, 120px) 24px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div className="s-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          className="s-label"
          style={{ color: "var(--s-yellow)", marginBottom: 16 }}
          data-testid="stores-label"
        >
          // Live Stores
        </div>
        <h2
          className="s-heading"
          style={{
            fontSize: "clamp(42px, 7vw, 80px)",
            color: "var(--s-white)",
            marginBottom: 20,
          }}
          data-testid="stores-title"
        >
          BUILT BY CREATORS LIKE YOU
        </h2>
        <p
          className="s-body"
          style={{
            color: "rgba(250,250,245,0.6)",
            maxWidth: 600,
            margin: "0 auto",
          }}
          data-testid="stores-subtext"
        >
          Real stores launched by creators on Sellisy. Browse their storefronts and get inspired.
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 20,
          }}
          data-testid="stores-grid-skeleton"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: 24,
                height: 180,
              }}
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "rgba(250,250,245,0.4)",
          }}
          data-testid="stores-empty"
        >
          <Store
            style={{
              width: 48,
              height: 48,
              margin: "0 auto 16px",
              opacity: 0.4,
            }}
          />
          <p className="s-body">No live stores yet. Be the first to launch yours.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 20,
          }}
          data-testid="stores-grid"
        >
          {displayed.map((store) => {
            const badgeColor = templateColors[store.templateKey || ""] || "#F5E642";
            const badgeLabel = templateLabels[store.templateKey || ""] || "Custom";

            return (
              <a
                key={store.id}
                href={`/s/${store.slug}`}
                data-testid={`store-card-${store.id}`}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  textDecoration: "none",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 12px 40px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {store.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      data-testid={`store-logo-${store.id}`}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      data-testid={`store-logo-placeholder-${store.id}`}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${badgeColor}33, ${badgeColor}66)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Store style={{ width: 20, height: 20, color: badgeColor }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--s-white)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      data-testid={`store-name-${store.id}`}
                    >
                      {store.name}
                    </div>
                  </div>
                  <ExternalLink
                    style={{
                      width: 16,
                      height: 16,
                      color: "rgba(250,250,245,0.3)",
                      flexShrink: 0,
                    }}
                  />
                </div>

                {store.tagline && (
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: "rgba(250,250,245,0.5)",
                      lineHeight: 1.5,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    data-testid={`store-tagline-${store.id}`}
                  >
                    {store.tagline}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: "auto",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      background: badgeColor,
                      color: "#050505",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    data-testid={`store-template-${store.id}`}
                  >
                    <Palette style={{ width: 10, height: 10 }} />
                    {badgeLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(250,250,245,0.6)",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    data-testid={`store-product-count-${store.id}`}
                  >
                    <Package style={{ width: 10, height: 10 }} />
                    {store.productCount} {store.productCount === 1 ? "product" : "products"}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
