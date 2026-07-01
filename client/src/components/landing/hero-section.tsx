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

function HeroVisual() {
  const crew = [
    { n: "Pixel", rgb: "245,230,66" },
    { n: "Register", rgb: "255,60,172" },
    { n: "Radio", rgb: "0,245,212" },
    { n: "Reel", rgb: "255,107,53" },
  ];
  return (
    <div style={{ position: "relative" }}>
      {/* neon bloom behind the panel */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -40,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255,60,172,0.16) 0%, rgba(245,230,66,0.06) 45%, transparent 72%)",
          filter: "blur(18px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <figure
        style={{
          margin: 0,
          position: "relative",
          zIndex: 1,
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(245,230,66,0.28)",
          boxShadow:
            "0 44px 120px -24px rgba(0,0,0,0.9), 0 0 90px rgba(255,60,172,0.16), 0 0 44px rgba(245,230,66,0.1)",
        }}
      >
        <img
          src="/dna/crew-launch-hero.jpg"
          alt="The Sellisy crew launching a creator's products into the night sky from a neon rooftop"
          decoding="async"
          data-testid="hero-crew-visual"
          style={{ width: "100%", display: "block", aspectRatio: "16 / 9", objectFit: "cover" }}
        />
        {/* halftone texture — the comic DNA */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1.4px)",
            backgroundSize: "4px 4px",
            mixBlendMode: "multiply",
            opacity: 0.22,
            pointerEvents: "none",
          }}
        />
        {/* status tag */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(5,5,5,0.72)",
            border: "1px solid rgba(255,60,172,0.45)",
            backdropFilter: "blur(6px)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--s-pink)", boxShadow: "0 0 10px var(--s-pink)", animation: "s-pulse-dot 1.5s infinite" }} />
          <span className="s-label" style={{ color: "var(--s-white)", fontSize: 10 }}>The Sublevel &middot; Now open</span>
        </div>
      </figure>
      {/* meet-the-crew chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(250,250,245,0.4)", textTransform: "uppercase", letterSpacing: 1, alignSelf: "center", marginRight: 4 }}>
          Meet the crew
        </span>
        {crew.map((c) => (
          <span
            key={c.n}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid rgba(${c.rgb},0.35)`,
              background: `rgba(${c.rgb},0.06)`,
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: "rgba(250,250,245,0.85)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: `rgb(${c.rgb})`, boxShadow: `0 0 8px rgb(${c.rgb})` }} />
            {c.n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" data-testid="section-hero" style={{ paddingTop: 100, paddingBottom: 80 }}>
      <GrainOverlay />
      <div className="s-hero-grid" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
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
            style={{
              fontSize: "clamp(40px, 7vw, 80px)",
              lineHeight: 1,
              color: "var(--s-white)",
              marginBottom: 24,
            }}
          >
            Increase Your
            <br />
            <span style={{ color: "var(--s-yellow)" }}>GDP.</span>
          </h1>

          <p
            className="s-body"
            style={{
              fontSize: "clamp(15px, 1.8vw, 18px)",
              lineHeight: 1.7,
              opacity: 0.55,
              maxWidth: 560,
              margin: "0 auto 32px",
            }}
          >
            Your income is your <strong style={{ color: "var(--s-white)", fontWeight: 600 }}>personal GDP</strong> — and it&rsquo;s yours to grow. Sell templates, guides, and courses, launch a store in minutes, connect Stripe or PayPal, and keep 100% of every sale.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 48 }}>
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

          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginBottom: 48 }}>
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

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: -40,
              background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,230,66,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
