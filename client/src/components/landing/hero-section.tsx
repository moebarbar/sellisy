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

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" data-testid="section-hero" style={{ paddingTop: 132, paddingBottom: 88 }}>
      <GrainOverlay />
      <div className="s-hero-grid" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", maxWidth: 840, margin: "0 auto" }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ border: "1px solid rgba(245,230,66,0.3)", background: "rgba(245,230,66,0.04)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--s-yellow)", animation: "s-pulse-dot 1.5s infinite" }} />
            <span className="s-label" style={{ color: "var(--s-yellow)", fontSize: "11px" }}>Your share of the digital economy</span>
          </div>

          <h1
            className="s-heading"
            data-testid="hero-heading"
            style={{ fontSize: "clamp(46px, 8vw, 96px)", lineHeight: 0.98, color: "var(--s-white)", marginBottom: 24 }}
          >
            Increase Your
            <br />
            <span style={{ color: "var(--s-yellow)" }}>GDP.</span>
          </h1>

          <p
            className="s-body"
            style={{ fontSize: "clamp(15px, 1.8vw, 18px)", lineHeight: 1.7, opacity: 0.6, maxWidth: 560, margin: "0 auto 32px" }}
          >
            Your income is your <strong style={{ color: "var(--s-white)", fontWeight: 600 }}>personal GDP</strong> &mdash; and it&rsquo;s yours to grow. Sell templates, guides, and courses, launch a store in minutes, connect Stripe or PayPal, and keep 100% of every sale.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 44 }}>
            <a
              href="#pricing"
              className="cta-mono inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold transition-all duration-200 hover:brightness-110"
              style={{ background: "var(--s-yellow)", color: "var(--s-black)", fontSize: "12px", boxShadow: "0 0 30px rgba(245,230,66,0.15)" }}
              data-testid="button-hero-cta"
            >
              Start Earning Free
            </a>
            <a
              href="#products"
              className="s-label inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold transition-all duration-200 group"
              style={{ border: "1px solid rgba(250,250,245,0.15)", color: "var(--s-white)", fontSize: "12px", background: "rgba(255,255,255,0.03)" }}
              data-testid="button-hero-demo"
            >
              Browse Products
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
            {[
              { value: "200+", label: "Digital Products" },
              { value: "5 min", label: "Store Setup" },
              { value: "$0", label: "Platform Fees" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 8 }} data-testid={`hero-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--s-yellow)" }}>
                  {stat.value}
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
