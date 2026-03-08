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
    <section className="relative min-h-screen flex items-center overflow-hidden" data-testid="section-hero">
      <GrainOverlay />
      <div className="s-hero-grid" />

      <div className="max-w-[1200px] mx-auto px-6 w-full relative z-10 pt-20 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ border: "1px solid rgba(245,230,66,0.3)" }}>
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

            <p className="s-body mt-7 max-w-[460px]" style={{ opacity: 0.6, fontSize: "18px", lineHeight: 1.6 }}>
              Build a storefront in minutes. Import 200+ PLR & MRR products or create your own. Connect Stripe or PayPal. Keep 100% of every sale.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#pricing"
                className="cta-mono inline-flex items-center gap-2 px-7 py-3.5 rounded font-bold transition-transform duration-200 hover:scale-105"
                style={{ background: "var(--s-yellow)", color: "var(--s-black)", fontSize: "12px" }}
                data-testid="button-hero-cta"
              >
                Start Selling
              </a>
              <a
                href="#products"
                className="s-label inline-flex items-center gap-2 px-7 py-3.5 rounded font-bold transition-all duration-200 group"
                style={{ border: "1px solid rgba(250,250,245,0.2)", color: "var(--s-white)", fontSize: "12px" }}
                data-testid="button-hero-demo"
              >
                See Live Demo
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block h-[580px]">
            {/* Row 1: Revenue (right) + Delivery (left) */}
            <div
              className="absolute top-0 right-0 p-5 rounded-[20px] w-[220px]"
              style={{
                background: "var(--s-cream)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                "--card-rotate": "-6deg",
                animation: "s-float-card 5s ease-in-out infinite",
                transform: "rotate(-6deg)",
              } as React.CSSProperties}
              data-testid="card-revenue"
            >
              <div className="s-label" style={{ color: "#050505", opacity: 0.5, fontSize: "10px", letterSpacing: "2px" }}>REVENUE TODAY</div>
              <div className="s-heading mt-1" style={{ color: "#050505", fontSize: "52px" }}>$847</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#4ade80" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#4ade80", textTransform: "uppercase", letterSpacing: "1px" }}>+32% today</span>
              </div>
            </div>

            <div
              className="absolute top-[10px] left-0 rounded-xl w-[160px]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,107,53,0.15)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                padding: "14px 16px",
                "--card-rotate": "3deg",
                animation: "s-float-card 4.5s ease-in-out infinite 1s",
                transform: "rotate(3deg)",
              } as React.CSSProperties}
              data-testid="card-delivery"
            >
              <div className="s-label" style={{ color: "var(--s-orange)", fontSize: "8px", letterSpacing: "2px", marginBottom: 6 }}>DELIVERY</div>
              <div className="s-heading" style={{ color: "var(--s-white)", fontSize: "24px", lineHeight: 1 }}>Instant</div>
              <div style={{ fontSize: 10, color: "rgba(250,250,245,0.4)", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Auto-sent on purchase</div>
            </div>

            {/* Row 2: Product Card (left) + Customers (right) */}
            <div
              className="absolute top-[140px] left-[10px] rounded-[18px] w-[200px]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(245,230,66,0.12)",
                boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
                "--card-rotate": "-4deg",
                animation: "s-float-card 5.5s ease-in-out infinite 0.5s",
                transform: "rotate(-4deg)",
                overflow: "hidden",
              } as React.CSSProperties}
              data-testid="card-product"
            >
              <div style={{ height: 80, background: "linear-gradient(135deg, #1a0a2e, #3a1a5c)", position: "relative" }}>
                <div style={{ position: "absolute", bottom: 8, left: 12, fontFamily: "'Space Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2 }}>PLR PRODUCT</div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--s-white)", marginBottom: 4 }}>Social Media Kit</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--s-yellow)" }}>$29.00</div>
                <div
                  className="cta-mono"
                  style={{
                    marginTop: 8,
                    background: "var(--s-yellow)",
                    color: "var(--s-black)",
                    borderRadius: 6,
                    padding: "7px 0",
                    fontSize: 10,
                    fontWeight: 700,
                    width: "100%",
                    textAlign: "center",
                  }}
                  data-testid="text-import-cta"
                >
                  Import to Store
                </div>
              </div>
            </div>

            <div
              className="absolute top-[160px] right-[10px] rounded-xl w-[170px]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(0,245,212,0.12)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.4)",
                padding: "14px 16px",
                "--card-rotate": "5deg",
                animation: "s-float-card 6s ease-in-out infinite 1.5s",
                transform: "rotate(5deg)",
              } as React.CSSProperties}
              data-testid="card-customers"
            >
              <div className="s-label" style={{ color: "var(--s-teal)", fontSize: "8px", letterSpacing: "2px", marginBottom: 6 }}>CUSTOMERS</div>
              <div className="s-heading" style={{ color: "var(--s-white)", fontSize: "32px", lineHeight: 1 }}>1,247</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4ade80", textTransform: "uppercase", letterSpacing: 1 }}>+18 this week</span>
              </div>
            </div>

            {/* Row 3: Storefront (left) + Analytics (right) */}
            <div
              className="absolute top-[370px] left-[20px] rounded-2xl w-[180px]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(0,245,212,0.15)",
                boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
                "--card-rotate": "4deg",
                animation: "s-float-card 5.5s ease-in-out infinite 2s",
                transform: "rotate(4deg)",
                overflow: "hidden",
              } as React.CSSProperties}
              data-testid="card-storefront"
            >
              <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="s-label" data-testid="text-store-label" style={{ color: "var(--s-pink)", fontSize: "8px", letterSpacing: "2px" }}>YOUR STORE</div>
              </div>
              <div style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Social Media Kit", "Landing Templates"].map((name) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: "linear-gradient(135deg, #1a0a2e, #5c1a3a)", flexShrink: 0 }} />
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(250,250,245,0.7)" }}>{name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: "6px 14px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#4ade80", textTransform: "uppercase", letterSpacing: 1 }}>2 products live</span>
                </div>
              </div>
            </div>

            <div
              className="absolute top-[350px] right-[0px] rounded-xl w-[190px]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,60,172,0.12)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.4)",
                padding: "14px 16px",
                "--card-rotate": "-3deg",
                animation: "s-float-card 5s ease-in-out infinite 2.5s",
                transform: "rotate(-3deg)",
              } as React.CSSProperties}
              data-testid="card-analytics"
            >
              <div className="s-label" style={{ color: "var(--s-pink)", fontSize: "8px", letterSpacing: "2px", marginBottom: 8 }}>CONVERSION</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32, marginBottom: 6 }}>
                {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 12,
                      height: `${h}%`,
                      borderRadius: 2,
                      background: i >= 8 ? "var(--s-pink)" : "rgba(255,60,172,0.25)",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(250,250,245,0.4)" }}>This month</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--s-pink)", fontWeight: 700 }}>4.8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
