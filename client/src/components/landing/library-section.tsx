import { useQuery } from "@tanstack/react-query";

type LibraryProduct = {
  id: string;
  title: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  productType: string | null;
  slug: string | null;
};

const typeColors: Record<string, string> = {
  digital: "#F5E642",
  software: "#00F5D4",
  template: "#FF6B35",
  ebook: "#FF3CAC",
  course: "#00F5D4",
  graphics: "#F5E642",
};

const placeholderGradients = [
  "linear-gradient(135deg, #1a1a2e, #16213e)",
  "linear-gradient(135deg, #0f0c29, #302b63)",
  "linear-gradient(135deg, #1a0a2e, #2d1b69)",
  "linear-gradient(135deg, #0a1628, #1a3a5c)",
  "linear-gradient(135deg, #1a1a0a, #3d3d0a)",
  "linear-gradient(135deg, #2e0a1a, #5c1a3a)",
];

export function LibrarySection() {
  const { data: products, isLoading } = useQuery<LibraryProduct[]>({
    queryKey: ["/api/products/library/public"],
  });

  const displayProducts = (products || []).slice(0, 6);

  return (
    <section
      data-testid="library-section"
      style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div className="s-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          className="s-label"
          style={{ color: "var(--s-yellow)", marginBottom: 16 }}
          data-testid="library-label"
        >
          {"// The Library"}
        </div>
        <h2
          className="s-heading"
          style={{ fontSize: "clamp(36px, 8vw, 80px)", color: "var(--s-white)", marginBottom: 20 }}
          data-testid="library-title"
        >
          DONE-FOR-YOU PRODUCTS
        </h2>
        <p
          className="s-body"
          style={{ color: "rgba(250,250,245,0.6)", maxWidth: 600, margin: "0 auto" }}
          data-testid="library-subtext"
        >
          Every product comes with Private Label Rights (PLR) and Master Resell Rights (MRR).
          Rebrand them, resell them, and keep 100% of the profits.
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                height: 320,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
              gap: 20,
            }}
            data-testid="library-grid"
          >
            {displayProducts.map((product, i) => {
              const badgeColor = typeColors[product.productType || "digital"] || "#F5E642";
              const typeLabel = product.productType
                ? product.productType.charAt(0).toUpperCase() + product.productType.slice(1)
                : "Digital";

              return (
                <div
                  key={product.id}
                  data-testid={`product-card-${product.id}`}
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "16/10",
                      background: product.imageUrl
                        ? `url(${product.imageUrl}) center/cover no-repeat`
                        : placeholderGradients[i % placeholderGradients.length],
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        background: badgeColor,
                        color: "#050505",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                      data-testid={`product-type-${product.id}`}
                    >
                      {typeLabel}
                    </span>
                  </div>

                  <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        color: "var(--s-white)",
                        fontWeight: 600,
                        lineHeight: 1.3,
                        minHeight: 40,
                      }}
                      data-testid={`product-name-${product.id}`}
                    >
                      {product.title}
                    </div>

                    {product.description && (
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          color: "rgba(250,250,245,0.4)",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.description}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                      <span
                        className="s-heading"
                        style={{ fontSize: 28, color: "var(--s-yellow)" }}
                        data-testid={`product-price-${product.id}`}
                      >
                        ${product.price}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span
                          style={{
                            background: "var(--s-teal)",
                            color: "#050505",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          PLR
                        </span>
                        <span
                          style={{
                            background: "var(--s-yellow)",
                            color: "#050505",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          MRR
                        </span>
                      </div>
                    </div>

                    <a
                      href="#pricing"
                      data-testid={`import-btn-${product.id}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "10px 0",
                        borderRadius: 8,
                        background: "var(--s-yellow)",
                        color: "var(--s-black)",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        textDecoration: "none",
                        transition: "transform 0.2s ease, opacity 0.2s ease",
                        marginTop: 4,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      Import to Store →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <a
              href="/products"
              className="s-label"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: "var(--s-yellow)",
                color: "var(--s-black)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              data-testid="button-browse-all-products"
            >
              Browse All Products →
            </a>
          </div>
        </>
      )}
    </section>
  );
}
