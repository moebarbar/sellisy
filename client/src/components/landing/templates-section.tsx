import { useState } from "react";

const templates = [
  { id: "neon", name: "Neon", bgColor: "#0a0a0a", accentColor: "#00F5D4", textColor: "#FAFAF5", cardBg: "#141414", btnStyle: { background: "#00F5D4", color: "#050505" } },
  { id: "silk", name: "Silk", bgColor: "#F0E6D3", accentColor: "#050505", textColor: "#050505", cardBg: "#FAFAF5", btnStyle: { background: "#050505", color: "#F0E6D3" } },
  { id: "aurora", name: "Aurora", bgColor: "#0d0d1a", accentColor: "#A855F7", textColor: "#FAFAF5", cardBg: "#1a1a2e", btnStyle: { background: "#A855F7", color: "#FAFAF5" } },
  { id: "ember", name: "Ember", bgColor: "#1a0a0a", accentColor: "#FF6B35", textColor: "#FAFAF5", cardBg: "#2a1510", btnStyle: { background: "#FF6B35", color: "#FAFAF5" } },
  { id: "frost", name: "Frost", bgColor: "#F0F4F8", accentColor: "#1E3A5F", textColor: "#1E3A5F", cardBg: "#FFFFFF", btnStyle: { background: "#1E3A5F", color: "#FFFFFF" } },
  { id: "midnight", name: "Midnight", bgColor: "#0a0a0a", accentColor: "#F5E642", textColor: "#FAFAF5", cardBg: "#111111", btnStyle: { background: "#F5E642", color: "#050505" } },
];

const fakeProducts = [
  { name: "Digital Planner 2025", price: "$29" },
  { name: "Social Media Kit", price: "$49" },
  { name: "Brand Guidelines", price: "$39" },
];

export function TemplatesSection() {
  const [active, setActive] = useState("neon");
  const current = templates.find((t) => t.id === active) || templates[0];

  return (
    <section
      data-testid="templates-section"
      style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div className="s-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
        <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
          {"// Your Store. Your Style."}
        </p>
        <h2
          className="s-heading"
          data-testid="templates-title"
          style={{ fontSize: "clamp(40px, 6vw, 72px)", color: "var(--s-white)" }}
        >
          SIX TEMPLATES. INFINITE STORES.
        </h2>
      </div>

      <div
        className="s-reveal"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {templates.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              data-testid={`template-pill-${t.id}`}
              onClick={() => setActive(t.id)}
              style={{
                position: "relative",
                padding: "10px 24px",
                borderRadius: 999,
                border: isActive ? "2px solid var(--s-yellow)" : "2px solid rgba(255,255,255,0.15)",
                background: t.bgColor,
                color: t.accentColor,
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                transition: "all 300ms ease",
              }}
            >
              {t.name}
              {isActive && (
                <span
                  data-testid={`template-active-badge-${t.id}`}
                  style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    background: "var(--s-yellow)",
                    color: "var(--s-black)",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontFamily: "'Space Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Active &#10003;
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="s-reveal"
        data-testid="browser-window"
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          maxWidth: 960,
          margin: "0 auto 48px",
        }}
      >
        <div
          data-testid="browser-chrome"
          style={{
            background: "#1a1a1a",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840" }} />
          </div>
          <div
            style={{
              flex: 1,
              background: "#0e0e0e",
              borderRadius: 8,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <span>mystore.sellisy.com</span>
            <span
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#28C840",
                  display: "inline-block",
                  animation: "s-pulse-dot 2s ease-in-out infinite",
                }}
              />
              <span style={{ color: "#28C840", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
                LIVE
              </span>
            </span>
          </div>
        </div>

        <div
          data-testid="browser-content"
          style={{
            background: current.bgColor,
            padding: "48px 40px",
            transition: "background 400ms ease",
            minHeight: 380,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 36, transition: "color 400ms ease", color: current.textColor }}>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 36,
                letterSpacing: -1,
                lineHeight: 1,
                marginBottom: 8,
                transition: "color 400ms ease",
                color: current.textColor,
              }}
            >
              MY CREATIVE STUDIO
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                opacity: 0.7,
                transition: "color 400ms ease",
                color: current.textColor,
              }}
            >
              Premium digital products for modern creators
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {fakeProducts.map((product, i) => (
              <div
                key={i}
                data-testid={`fake-product-card-${i}`}
                style={{
                  background: current.cardBg,
                  borderRadius: 12,
                  padding: 20,
                  transition: "background 400ms ease",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 100,
                    borderRadius: 8,
                    marginBottom: 14,
                    background: `linear-gradient(135deg, ${current.accentColor}33, ${current.accentColor}11)`,
                    transition: "background 400ms ease",
                  }}
                />
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 4,
                    transition: "color 400ms ease",
                    color: current.textColor,
                  }}
                >
                  {product.name}
                </p>
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 12,
                    transition: "color 400ms ease",
                    color: current.accentColor,
                  }}
                >
                  {product.price}
                </p>
                <button
                  data-testid={`fake-buy-btn-${i}`}
                  style={{
                    ...current.btnStyle,
                    width: "100%",
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    transition: "all 400ms ease",
                  }}
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p
        className="s-label"
        data-testid="templates-footer-note"
        style={{
          textAlign: "center",
          color: "rgba(250,250,245,0.4)",
          maxWidth: 500,
          margin: "0 auto",
          lineHeight: 1.8,
        }}
      >
        Connect your own Stripe or PayPal. You keep 100% of every sale.
      </p>
    </section>
  );
}