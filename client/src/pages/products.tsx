import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

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

const typeLabels: Record<string, string> = {
  digital: "Digital",
  software: "Software",
  template: "Template",
  ebook: "Ebook",
  course: "Course",
  graphics: "Graphics",
};

const allTypes = ["all", "digital", "software", "template", "ebook", "course", "graphics"];

const placeholderGradients = [
  "linear-gradient(135deg, #1a1a2e, #16213e)",
  "linear-gradient(135deg, #0f0c29, #302b63)",
  "linear-gradient(135deg, #1a0a2e, #2d1b69)",
  "linear-gradient(135deg, #0a1628, #1a3a5c)",
  "linear-gradient(135deg, #1a1a0a, #3d3d0a)",
  "linear-gradient(135deg, #2e0a1a, #5c1a3a)",
];

export default function ProductsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useQuery<LibraryProduct[]>({
    queryKey: ["/api/products/library/public"],
  });

  useEffect(() => {
    document.title = "Product Library - Sellisy | PLR & MRR Digital Products";
  }, []);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const type of allTypes) {
      if (type !== "all") counts[type] = 0;
    }
    (products || []).forEach((p) => {
      counts.all++;
      const t = p.productType || "digital";
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    let result = products || [];
    if (filter !== "all") {
      result = result.filter((p) => (p.productType || "digital") === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [products, filter, search]);

  return (
    <div className="landing-page" data-testid="products-page" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
            {"// Product Library"}
          </div>
          <h1
            className="s-heading"
            style={{ fontSize: "clamp(36px, 6vw, 72px)", color: "var(--s-white)", marginBottom: 16 }}
            data-testid="products-title"
          >
            BROWSE ALL PRODUCTS
          </h1>
          <p className="s-body" style={{ color: "rgba(250,250,245,0.6)", maxWidth: 560, margin: "0 auto" }}>
            Every product includes Private Label Rights (PLR) and Master Resell Rights (MRR).
            Import any product to your store and start selling immediately.
          </p>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto 32px", position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 18,
              height: 18,
              color: "rgba(250,250,245,0.3)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-products"
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--s-white)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div
          className="s-creator-tabs"
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 8,
            justifyContent: "center",
            marginBottom: 48,
            paddingBottom: 8,
          }}
        >
          {allTypes.map((type) => {
            const isActive = filter === type;
            const label = type === "all" ? "All" : typeLabels[type] || type;
            const count = typeCounts[type] ?? 0;
            return (
              <button
                key={type}
                data-testid={`filter-${type}`}
                onClick={() => setFilter(type)}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: isActive ? "1px solid var(--s-yellow)" : "1px solid rgba(255,255,255,0.15)",
                  background: isActive ? "var(--s-yellow)" : "transparent",
                  color: isActive ? "var(--s-black)" : "var(--s-white)",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {label}
                <span
                  data-testid={`filter-count-${type}`}
                  style={{
                    fontSize: 10,
                    opacity: isActive ? 0.7 : 0.4,
                    fontWeight: 400,
                  }}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
              gap: 20,
            }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  height: 320,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "rgba(250,250,245,0.4)",
            }}
            data-testid="text-no-products"
          >
            <Package style={{ width: 48, height: 48, margin: "0 auto 16px", opacity: 0.3 }} />
            <p className="s-body" style={{ fontSize: 16, marginBottom: 8 }}>
              {search.trim()
                ? `No products match "${search.trim()}"`
                : "No products found in this category."}
            </p>
            {(search.trim() || filter !== "all") && (
              <button
                onClick={() => { setSearch(""); setFilter("all"); }}
                data-testid="button-clear-filters"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  padding: "10px 24px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "var(--s-yellow)",
                  marginTop: 12,
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: "rgba(250,250,245,0.4)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 16,
              }}
              data-testid="text-result-count"
            >
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
              {search.trim() ? ` matching "${search.trim()}"` : ""}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                gap: 20,
              }}
              data-testid="products-grid"
            >
              {filtered.map((product, i) => {
                const badgeColor = typeColors[product.productType || "digital"] || "#F5E642";
                const typeLabel = typeLabels[product.productType || "digital"] || "Digital";

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
                        }}
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

                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 8 }}>
                        <span
                          className="s-heading"
                          style={{ fontSize: 24, color: "var(--s-yellow)" }}
                        >
                          ${product.price}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{
                            background: "var(--s-teal)",
                            color: "#050505",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}>
                            PLR
                          </span>
                          <span style={{
                            background: "var(--s-yellow)",
                            color: "#050505",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}>
                            MRR
                          </span>
                        </div>
                      </div>

                      <a
                        href="/#pricing"
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
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
