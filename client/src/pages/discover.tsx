import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Store as StoreIcon } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

// Marketplace / discovery surface. Lets buyers browse products across every
// public Sellisy store. Featured stores row at the top + newest-products
// grid below. Each card links into the seller's storefront (NOT a sellisy-
// owned product page) so the seller's branding stays in front of the buyer.

type DiscoverStore = {
  id: string;
  name: string;
  slug: string;
  templateKey: string | null;
  tagline: string | null;
  logoUrl: string | null;
  productCount: number;
};

type DiscoverProduct = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  thumbnailUrl: string | null;
  productType: string | null;
  isFeatured: boolean;
  productSlug: string | null;
  productId: string;
  createdAt: string;
  store: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    templateKey: string | null;
  };
};

const typeAccent: Record<string, string> = {
  digital: "var(--s-yellow)",
  software: "var(--s-teal)",
  template: "var(--s-orange)",
  ebook: "var(--s-pink)",
  course: "var(--s-teal)",
  graphics: "var(--s-yellow)",
};

const placeholderGradients = [
  "linear-gradient(135deg, #1a1a2e, #16213e)",
  "linear-gradient(135deg, #0f0c29, #302b63)",
  "linear-gradient(135deg, #1a0a2e, #2d1b69)",
  "linear-gradient(135deg, #0a1628, #1a3a5c)",
  "linear-gradient(135deg, #1a1a0a, #3d3d0a)",
  "linear-gradient(135deg, #2e0a1a, #5c1a3a)",
];

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function DiscoverPage() {
  useEffect(() => {
    document.title = "Discover — Sellisy | Find digital products from independent creators";
  }, []);

  const { data: stores, isLoading: storesLoading } = useQuery<DiscoverStore[]>({
    queryKey: ["/api/discover/stores"],
  });
  const { data: products, isLoading: productsLoading } = useQuery<DiscoverProduct[]>({
    queryKey: ["/api/discover/products"],
  });

  // Top 6 stores by product count for the "Featured Stores" row.
  const featuredStores = (stores || [])
    .slice()
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6);

  return (
    <div className="landing-page" data-testid="discover-page">
      <div className="s-ambient-wrap" aria-hidden="true">
        <div className="s-ambient-orb s-ambient-orb--yellow" />
        <div className="s-ambient-orb s-ambient-orb--teal" />
        <div className="s-ambient-orb s-ambient-orb--pink" />
      </div>

      <Navbar />

      {/* Header */}
      <section style={{ padding: "120px 24px 60px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <span
            className="s-label"
            data-testid="discover-eyebrow"
            style={{ color: "var(--s-yellow)", marginBottom: 16, display: "block" }}
          >
            // The marketplace
          </span>
          <h1
            className="s-heading"
            data-testid="discover-title"
            style={{
              fontSize: "clamp(40px, 7vw, 72px)",
              lineHeight: 1,
              color: "var(--s-white)",
              marginBottom: 20,
            }}
          >
            Discover Digital
            <br />
            <span style={{ color: "var(--s-yellow)" }}>From Independent Creators.</span>
          </h1>
          <p
            className="s-body"
            style={{
              fontSize: "clamp(15px, 1.6vw, 17px)",
              color: "rgba(250,250,245,0.6)",
              maxWidth: 580,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Templates, courses, ebooks, software — sold direct by the people who made them.
            Every sale goes straight to the creator. Zero platform fees.
          </p>
        </div>
      </section>

      {/* Featured Stores */}
      {(storesLoading || featuredStores.length > 0) && (
        <section style={{ padding: "40px 24px 80px" }} data-testid="featured-stores-section">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <h2
                className="s-heading"
                style={{ fontSize: "clamp(24px, 3vw, 32px)", color: "var(--s-white)" }}
              >
                Featured Stores
              </h2>
              <span
                className="s-label"
                style={{ color: "rgba(250,250,245,0.4)", fontSize: 11 }}
              >
                {featuredStores.length} active
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {storesLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: 160,
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    />
                  ))
                : featuredStores.map((store) => (
                    <a
                      key={store.id}
                      href={`/s/${store.slug}`}
                      className="s-card-hover"
                      data-testid={`discover-store-${store.slug}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        textDecoration: "none",
                        minHeight: 160,
                        textAlign: "center",
                      }}
                    >
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            objectFit: "cover",
                            marginBottom: 12,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            background: "rgba(245,230,66,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 12,
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 24,
                            color: "var(--s-yellow)",
                          }}
                          aria-hidden="true"
                        >
                          {store.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--s-white)",
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {store.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 10,
                          color: "rgba(250,250,245,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {store.productCount} product{store.productCount === 1 ? "" : "s"}
                      </div>
                    </a>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* New on Sellisy — products grid */}
      <section style={{ padding: "40px 24px 100px" }} data-testid="discover-products-section">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <h2
              className="s-heading"
              style={{ fontSize: "clamp(24px, 3vw, 32px)", color: "var(--s-white)" }}
            >
              New on Sellisy
            </h2>
            <span className="s-label" style={{ color: "rgba(250,250,245,0.4)", fontSize: 11 }}>
              {products?.length ?? 0} listed
            </span>
          </div>

          {productsLoading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 320,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          )}

          {!productsLoading && products && products.length === 0 && (
            <EmptyState />
          )}

          {!productsLoading && products && products.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} gradientIndex={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ProductCard({
  product,
  gradientIndex,
}: {
  product: DiscoverProduct;
  gradientIndex: number;
}) {
  const accent = product.productType ? typeAccent[product.productType] || "var(--s-yellow)" : "var(--s-yellow)";
  const productHref = product.productSlug
    ? `/s/${product.store.slug}/p/${product.productSlug}`
    : `/s/${product.store.slug}/product/${product.productId}`;
  const storeHref = `/s/${product.store.slug}`;

  return (
    <article
      className="s-card-hover"
      data-testid={`discover-product-${product.id}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a
        href={productHref}
        data-testid={`discover-product-link-${product.id}`}
        style={{
          aspectRatio: "1 / 1",
          display: "block",
          background: product.thumbnailUrl
            ? undefined
            : placeholderGradients[gradientIndex % placeholderGradients.length],
          position: "relative",
        }}
      >
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.2)",
            }}
            aria-hidden="true"
          >
            <Package size={36} strokeWidth={1.5} />
          </div>
        )}
        {product.productType && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(5,5,5,0.7)",
              backdropFilter: "blur(8px)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: accent,
            }}
          >
            {product.productType}
          </span>
        )}
      </a>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <a
          href={productHref}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--s-white)",
            textDecoration: "none",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.6em",
          }}
        >
          {product.title}
        </a>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <a
            href={storeHref}
            data-testid={`discover-product-store-${product.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "rgba(250,250,245,0.55)",
              textDecoration: "none",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <StoreIcon size={11} />
            {product.store.name}
          </a>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--s-yellow)",
            }}
          >
            {formatPrice(product.priceCents)}
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      data-testid="discover-empty-state"
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "rgba(245,230,66,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          color: "var(--s-yellow)",
        }}
        aria-hidden="true"
      >
        <Package size={28} strokeWidth={1.5} />
      </div>
      <h3
        className="s-heading"
        style={{ fontSize: 24, color: "var(--s-white)", marginBottom: 8 }}
      >
        No products yet
      </h3>
      <p
        className="s-body"
        style={{
          fontSize: 14,
          color: "rgba(250,250,245,0.5)",
          maxWidth: 360,
          margin: "0 auto 24px",
        }}
      >
        Be one of the first creators to list on Sellisy. Set up your store in five minutes.
      </p>
      <a
        href="/auth"
        className="cta-mono"
        data-testid="discover-empty-cta"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          background: "var(--s-yellow)",
          color: "var(--s-black)",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Open your store <ArrowRight size={14} />
      </a>
    </div>
  );
}
