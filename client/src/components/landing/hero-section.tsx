function GrainOverlay() {
  return (
    <svg className="s-grain" width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

const showcaseCards = [
  {
    label: "REVENUE TODAY",
    value: "$12,847",
    detail: "↑ 32% from yesterday",
    detailColor: "#4ade80",
    accent: "var(--s-yellow)",
    bg: "rgba(245,230,66,0.06)",
    border: "rgba(245,230,66,0.12)",
  },
  {
    label: "PRODUCTS LIVE",
    value: "200+",
    detail: "PLR & MRR ready",
    detailColor: "var(--s-teal)",
    accent: "var(--s-teal)",
    bg: "rgba(0,245,212,0.06)",
    border: "rgba(0,245,212,0.12)",
  },
  {
    label: "LATEST SALE",
    value: "UI Kit Pro",
    detail: "$49.00 · just now",
    detailColor: "var(--s-yellow)",
    accent: "var(--s-pink)",
    bg: "rgba(255,60,172,0.06)",
    border: "rgba(255,60,172,0.12)",
  },
  {
    label: "DELIVERY",
    value: "Instant",
    detail: "Auto-sent on purchase",
    detailColor: "rgba(250,250,245,0.5)",
    accent: "var(--s-orange)",
    bg: "rgba(255,107,53,0.06)",
    border: "rgba(255,107,53,0.12)",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" data-testid="section-hero">
      <GrainOverlay />
      <div className="s-hero-grid" />

      <div className="max-w-[1200px] mx-auto px-6 w-full relative z-10 pt-24 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10" style={{ border: "1px solid rgba(245,230,66,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--s-yellow)", animation: "s-pulse-dot 1.5s infinite" }} />
            <span className="s-label" style={{ color: "var(--s-yellow)", fontSize: "11px" }}>The platform for digital creators</span>
          </div>

          <h1
            className="s-heading"
            data-testid="hero-heading"
            style={{
              fontSize: "clamp(64px, 14vw, 180px)",
              textShadow: "0 4px 40px rgba(0,0,0,0.5)",
              lineHeight: 0.85,
            }}
          >
            <span style={{ color: "var(--s-white)", WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>SELL</span>
            <br />
            <span style={{ WebkitTextStroke: "3px var(--s-white)", color: "transparent" }}>DIG</span>
            <span style={{ color: "var(--s-yellow)", WebkitTextStroke: "1px rgba(245,230,66,0.2)" }}>ITAL</span>
            <br />
            <span style={{ color: "var(--s-pink)", WebkitTextStroke: "1px rgba(255,60,172,0.2)" }}>LIVE FREE.</span>
          </h1>

          <p className="s-body mt-8 max-w-[520px] mx-auto" style={{ opacity: 0.6, fontSize: "18px", lineHeight: 1.6 }}>
            Build a storefront in minutes. Import 200+ PLR & MRR products or create your own. Connect Stripe or PayPal. Keep 100% of every sale.
          </p>

          <div className="flex flex-wrap gap-4 mt-10 justify-center">
            <a
              href="#pricing"
              className="s-label inline-flex items-center gap-2 px-8 py-4 rounded font-bold transition-transform duration-200 hover:scale-105"
              style={{ background: "var(--s-yellow)", color: "var(--s-black)", fontSize: "13px" }}
              data-testid="button-hero-cta"
            >
              Start Selling →
            </a>
            <a
              href="#products"
              className="s-label inline-flex items-center gap-2 px-8 py-4 rounded font-bold transition-all duration-200 group"
              style={{ border: "1px solid rgba(250,250,245,0.2)", color: "var(--s-white)", fontSize: "13px" }}
              data-testid="button-hero-demo"
            >
              See Live Demo
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>

        <div
          data-testid="hero-showcase"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            maxWidth: 960,
            margin: "0 auto",
            marginTop: 48,
          }}
        >
          {showcaseCards.map((card, i) => (
            <div
              key={i}
              data-testid={`hero-card-${i}`}
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                borderRadius: 14,
                padding: "20px 22px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="s-label"
                style={{ color: card.accent, fontSize: "9px", letterSpacing: "2px", marginBottom: 8 }}
              >
                {card.label}
              </div>
              <div
                className="s-heading"
                style={{ color: "var(--s-white)", fontSize: "28px", lineHeight: 1.1, marginBottom: 6 }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: card.detailColor, fontFamily: "'DM Sans', sans-serif" }}>
                {card.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
