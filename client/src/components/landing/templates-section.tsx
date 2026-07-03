import { useState } from "react";

const templates = [
  {
    id: "neon",
    name: "Neon",
    subtitle: "Bold & Modern",
    bgColor: "#0a0a1a",
    accentColor: "#60a5fa",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.04)",
    heroBg: "linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 50%, #0a1628 100%)",
    btnStyle: { background: "linear-gradient(135deg, #3b82f6, #7c3aed, #06b6d4)", color: "#ffffff" },
  },
  {
    id: "silk",
    name: "Silk",
    subtitle: "Elegant & Minimal",
    bgColor: "#faf9f6",
    accentColor: "#b8860b",
    textColor: "#1a1a1a",
    cardBg: "#ffffff",
    heroBg: "linear-gradient(135deg, #f5f0e8 0%, #ede4d3 50%, #f8f4ed 100%)",
    btnStyle: { background: "linear-gradient(135deg, #b8860b, #d4a853)", color: "#ffffff" },
  },
  {
    id: "aurora",
    name: "Aurora",
    subtitle: "Vibrant & Glassy",
    bgColor: "#0a0f1a",
    accentColor: "#2dd4bf",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.04)",
    heroBg: "linear-gradient(135deg, #0a1628 0%, #0f1d30 50%, #0a0f1a 100%)",
    btnStyle: { background: "linear-gradient(135deg, #2dd4bf, #8b5cf6, #22d3ee)", color: "#ffffff" },
  },
  {
    id: "ember",
    name: "Ember",
    subtitle: "Warm & Bold",
    bgColor: "#fdf6f0",
    accentColor: "#e67e22",
    textColor: "#3d2b1f",
    cardBg: "#ffffff",
    heroBg: "linear-gradient(135deg, #fdf6f0 0%, #fce8d5 50%, #fdf6f0 100%)",
    btnStyle: { background: "linear-gradient(135deg, #e67e22, #d35400)", color: "#ffffff" },
  },
  {
    id: "frost",
    name: "Frost",
    subtitle: "Clean & Crisp",
    bgColor: "#f0f7ff",
    accentColor: "#3b82f6",
    textColor: "#0f172a",
    cardBg: "rgba(255,255,255,0.9)",
    heroBg: "linear-gradient(135deg, #e8f2ff 0%, #dbeafe 50%, #f0f7ff 100%)",
    btnStyle: { background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#ffffff" },
  },
  {
    id: "midnight",
    name: "Midnight",
    subtitle: "Sleek & Dark",
    bgColor: "#0b0d1a",
    accentColor: "#818cf8",
    textColor: "#e2e8f0",
    cardBg: "rgba(255,255,255,0.03)",
    heroBg: "linear-gradient(135deg, #0b0d1a 0%, #151830 50%, #0b0d1a 100%)",
    btnStyle: { background: "linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)", color: "#ffffff" },
  },
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
          style={{ fontSize: "clamp(36px, 6vw, 72px)", color: "var(--s-white)" }}
        >
          NINE TEMPLATES. INFINITE STORES.
        </h2>
      </div>

      <div
        className="s-reveal"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
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
                padding: "10px 20px",
                borderRadius: 999,
                border: isActive ? "2px solid var(--s-yellow)" : "2px solid rgba(255,255,255,0.15)",
                background: t.bgColor,
                color: t.accentColor,
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                transition: "all 300ms ease",
              }}
            >
              <span>{t.name}</span>
              <span style={{
                display: "block",
                fontSize: 9,
                fontWeight: 400,
                opacity: 0.6,
                color: t.textColor,
                marginTop: 2,
              }}>
                {t.subtitle}
              </span>
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
          <div className="hidden sm:flex" style={{ gap: 6 }}>
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
              fontSize: 11,
              fontFamily: "'Space Mono', monospace",
              color: "rgba(255,255,255,0.5)",
              overflow: "hidden",
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>mystore.sellisy.com</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#28C840", display: "inline-block", animation: "s-pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ color: "#28C840", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
            </span>
          </div>
        </div>

        <div
          data-testid="browser-content"
          style={{
            background: current.heroBg || current.bgColor,
            padding: "clamp(20px, 4vw, 48px) clamp(16px, 3vw, 40px)",
            transition: "background 400ms ease",
            minHeight: 300,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28, transition: "color 400ms ease", color: current.textColor }}>
            <h3 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(24px, 4vw, 36px)",
              letterSpacing: -1,
              lineHeight: 1,
              marginBottom: 8,
              transition: "color 400ms ease",
              color: current.textColor,
            }}>
              MY CREATIVE STUDIO
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(12px, 1.5vw, 14px)",
              opacity: 0.7,
              transition: "color 400ms ease",
              color: current.textColor,
            }}>
              Premium digital products for modern creators
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "clamp(10px, 2vw, 20px)",
          }}>
            {fakeProducts.map((product, i) => (
              <div
                key={i}
                data-testid={`fake-product-card-${i}`}
                style={{
                  background: current.cardBg,
                  borderRadius: 12,
                  padding: "clamp(12px, 2vw, 20px)",
                  transition: "background 400ms ease",
                }}
              >
                <div style={{
                  width: "100%",
                  height: "clamp(50px, 8vw, 100px)",
                  borderRadius: 8,
                  marginBottom: 12,
                  background: `linear-gradient(135deg, ${current.accentColor}33, ${current.accentColor}11)`,
                  transition: "background 400ms ease",
                }} />
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(12px, 1.5vw, 14px)",
                  marginBottom: 4,
                  transition: "color 400ms ease",
                  color: current.textColor,
                }}>
                  {product.name}
                </p>
                <p style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "clamp(13px, 1.5vw, 16px)",
                  fontWeight: 700,
                  marginBottom: 10,
                  transition: "color 400ms ease",
                  color: current.accentColor,
                }}>
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
                    fontSize: 10,
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
