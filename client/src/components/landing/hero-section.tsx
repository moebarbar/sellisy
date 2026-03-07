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

            <h1 className="s-heading" style={{ fontSize: "clamp(48px, 12vw, 160px)", textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
              <span style={{ color: "var(--s-white)", WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>SELL</span>
              <br />
              <span style={{ WebkitTextStroke: "3px var(--s-white)", color: "transparent" }}>DIG</span>
              <span style={{ color: "var(--s-yellow)", WebkitTextStroke: "1px rgba(245,230,66,0.2)" }}>ITAL</span>
              <br />
              <span style={{ color: "var(--s-pink)", WebkitTextStroke: "1px rgba(255,60,172,0.2)" }}>LIVE FREE.</span>
            </h1>

            <p className="s-body mt-7 max-w-[460px]" style={{ opacity: 0.6, fontSize: "18px" }}>
              Build a storefront in minutes. Import 200+ PLR & MRR products or create your own. Connect Stripe or PayPal. Keep 100% of every sale.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="/auth"
                className="s-label inline-flex items-center gap-2 px-7 py-3.5 rounded font-bold transition-transform duration-200 hover:scale-105"
                style={{ background: "var(--s-yellow)", color: "var(--s-black)", fontSize: "12px" }}
                data-testid="button-hero-cta"
              >
                Start Selling →
              </a>
              <a
                href="#products"
                className="s-label inline-flex items-center gap-2 px-7 py-3.5 rounded font-bold transition-all duration-200 group"
                style={{ border: "1px solid rgba(250,250,245,0.2)", color: "var(--s-white)", fontSize: "12px" }}
                data-testid="button-hero-demo"
              >
                See Live Demo
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block h-[520px]">
            <div
              className="absolute top-8 right-4 p-5 rounded-[20px] w-[220px]"
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
                <span
                  className="w-[7px] h-[7px] rounded-full"
                  style={{ background: "#4ade80", animation: "s-pulse-dot 1.5s infinite" }}
                />
                <span className="s-label" style={{ color: "#4ade80", fontSize: "10px", letterSpacing: "1px" }}>LIVE</span>
              </div>
            </div>

            <div
              className="absolute top-[200px] right-[160px] p-4 rounded-2xl w-[200px]"
              style={{
                background: "#050505",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                "--card-rotate": "5deg",
                animation: "s-float-card 6s ease-in-out infinite 1s",
                transform: "rotate(5deg)",
              } as React.CSSProperties}
              data-testid="card-new-sale"
            >
              <div className="s-label" style={{ color: "var(--s-yellow)", fontSize: "10px" }}>New Sale! 🎉</div>
              <div className="s-heading mt-1" style={{ color: "var(--s-white)", fontSize: "24px" }}>UI Kit Pro</div>
              <div className="s-body mt-1" style={{ color: "rgba(250,250,245,0.4)", fontSize: "12px" }}>$49.00 · just now</div>
            </div>

            <div
              className="absolute bottom-[60px] right-[20px] rounded-2xl w-[240px]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(245,230,66,0.15)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                "--card-rotate": "-3deg",
                animation: "s-float-card 7s ease-in-out infinite 0.5s",
                transform: "rotate(-3deg)",
                overflow: "hidden",
              } as React.CSSProperties}
              data-testid="card-import-flow"
            >
              <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="s-label" data-testid="text-import-label" style={{ color: "var(--s-teal)", fontSize: "8px", letterSpacing: "2px" }}>PRODUCT LIBRARY</div>
              </div>
              <div style={{ padding: "10px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #1a1a2e, #302b63)", flexShrink: 0 }} />
                  <div>
                    <div data-testid="text-import-product" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--s-white)", fontWeight: 600 }}>Social Media Kit</div>
                    <div data-testid="text-import-price" style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--s-yellow)" }}>$29.00</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "0 16px 10px", display: "flex", justifyContent: "center" }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  background: "var(--s-yellow)",
                  color: "var(--s-black)",
                  padding: "6px 16px",
                  borderRadius: 6,
                  fontWeight: 700,
                  width: "100%",
                  textAlign: "center",
                }}
                data-testid="text-import-cta"
                >
                  Import to Store →
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-[140px] left-[10px] rounded-2xl w-[180px]"
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
          </div>
        </div>
      </div>
    </section>
  );
}
