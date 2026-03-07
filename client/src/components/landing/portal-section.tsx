import { useState } from "react";

const portalProducts = [
  { name: "Social Media Kit", color: "#FF6B35", icon: "📦" },
  { name: "Brand Guidelines PDF", color: "#FF3CAC", icon: "📄" },
  { name: "Notion Templates", color: "#00F5D4", icon: "📋" },
];

const highlights = [
  { icon: "🛒", text: "Built-in upsells", color: "var(--s-yellow)" },
  { icon: "📬", text: "Portal per store", color: "var(--s-teal)" },
  { icon: "💸", text: "More revenue", color: "var(--s-orange)" },
];

function PortalCard({ hovered, onHover, onLeave }: { hovered: boolean; onHover: () => void; onLeave: () => void }) {
  return (
    <div
      data-testid="card-customer-portal"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 28,
        flex: "1 1 300px",
        minWidth: 0,
        boxShadow: hovered ? "0 0 30px rgba(0,245,212,0.1)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <p className="s-label" style={{ color: "var(--s-teal)", marginBottom: 20 }}>
        My Products
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {portalProducts.map((product) => (
          <div
            key={product.name}
            data-testid={`portal-product-${product.name.toLowerCase().replace(/\s+/g, "-")}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: product.color,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              {product.icon}
            </div>
            <span className="s-body" style={{ flex: 1, fontSize: 14, color: "var(--s-white)" }}>
              {product.name}
            </span>
            <button
              style={{
                background: "rgba(0,245,212,0.12)",
                color: "var(--s-teal)",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase" as const,
                letterSpacing: 1,
              }}
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--s-teal), var(--s-pink))",
            flexShrink: 0,
          }}
        />
        <span className="s-body" style={{ fontSize: 13, opacity: 0.5 }}>
          Welcome back, Sarah 👋
        </span>
      </div>
    </div>
  );
}

function UpsellCard({ hovered, onHover, onLeave }: { hovered: boolean; onHover: () => void; onLeave: () => void }) {
  return (
    <div
      data-testid="card-upsell-engine"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 28,
        flex: "1 1 300px",
        minWidth: 0,
        boxShadow: hovered ? "0 0 30px rgba(245,230,66,0.1)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 20 }}>
        You just bought Social Media Kit
      </p>

      <div
        style={{
          padding: "16px 18px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          marginBottom: 20,
        }}
      >
        <p className="s-body" style={{ fontSize: 14, color: "var(--s-white)", marginBottom: 6 }}>
          Brand Guidelines PDF
        </p>
        <p className="s-body" style={{ fontSize: 13, opacity: 0.45, lineHeight: 1.5 }}>
          People who bought this also grabbed{" "}
          <span style={{ color: "var(--s-yellow)", opacity: 1 }}>Brand Guidelines PDF</span> for{" "}
          <span style={{ color: "var(--s-yellow)", opacity: 1 }}>$29</span>
        </p>
      </div>

      <button
        data-testid="button-add-to-order"
        style={{
          width: "100%",
          background: "var(--s-yellow)",
          color: "var(--s-black)",
          border: "none",
          borderRadius: 10,
          padding: "12px 0",
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          textTransform: "uppercase" as const,
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        Add to Order →
      </button>

      <p
        data-testid="link-no-thanks"
        style={{
          textAlign: "center",
          fontSize: 12,
          opacity: 0.3,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        No thanks
      </p>
    </div>
  );
}

export function PortalSection() {
  const [portalHovered, setPortalHovered] = useState(false);
  const [upsellHovered, setUpsellHovered] = useState(false);

  return (
    <section
      data-testid="section-portal"
      style={{
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <div className="s-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
        <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
          {"// Built-in for every store"}
        </p>
        <h2
          className="s-heading"
          data-testid="portal-title"
          style={{ fontSize: "clamp(40px, 8vw, 80px)", color: "var(--s-white)", marginBottom: 16 }}
        >
          EVERY STORE GETS A PORTAL
        </h2>
        <p
          className="s-body"
          style={{ maxWidth: 520, margin: "0 auto", opacity: 0.5, fontSize: 16 }}
        >
          Every store comes with a branded customer portal and a built-in upsell engine.
          Customers download products, manage orders, and discover new offers — all under your brand.
        </p>
      </div>

      <div
        className="s-reveal"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        <PortalCard
          hovered={portalHovered}
          onHover={() => setPortalHovered(true)}
          onLeave={() => setPortalHovered(false)}
        />
        <UpsellCard
          hovered={upsellHovered}
          onHover={() => setUpsellHovered(true)}
          onLeave={() => setUpsellHovered(false)}
        />
      </div>

      <div
        data-testid="portal-highlights"
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {highlights.map((h, i) => (
          <div
            key={i}
            data-testid={`portal-highlight-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ fontSize: 16 }}>{h.icon}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 1, color: h.color, fontWeight: 700 }}>
              {h.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
