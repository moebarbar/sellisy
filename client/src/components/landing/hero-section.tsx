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
  const crew = [
    { n: "Pixel", rgb: "245,230,66" },
    { n: "Register", rgb: "255,60,172" },
    { n: "Radio", rgb: "0,245,212" },
    { n: "Reel", rgb: "255,107,53" },
  ];
  const shadow = "0 2px 30px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.6)";
  return (
    <section
      className="relative overflow-hidden"
      data-testid="section-hero"
      style={{ minHeight: "92vh", display: "flex", alignItems: "center", paddingTop: 132, paddingBottom: 72 }}
    >
      {/* Full-bleed crew world — the Sublevel IS the hero */}
      <img
        src="/dna/crew-launch-hero.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
        data-testid="hero-crew-visual"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", zIndex: 0 }}
      />
      {/* Legibility scrims: overall darken + top/bottom fade + a soft vignette behind the copy */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: "linear-gradient(180deg, rgba(5,5,5,0.74) 0%, rgba(5,5,5,0.52) 46%, rgba(5,5,5,0.9) 100%)" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: "radial-gradient(ellipse 56% 48% at 50% 45%, rgba(5,5,5,0.6) 0%, transparent 72%)" }} />
      {/* Halftone comic texture */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(0,0,0,0.5) 1px, transparent 1.4px)", backgroundSize: "4px 4px", opacity: 0.12, mixBlendMode: "multiply" }} />
      <GrainOverlay />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10, width: "100%" }}>
        <div style={{ textAlign: "center", maxWidth: 840, margin: "0 auto" }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ border: "1px solid rgba(255,60,172,0.4)", background: "rgba(5,5,5,0.5)", backdropFilter: "blur(6px)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--s-pink)", boxShadow: "0 0 10px var(--s-pink)", animation: "s-pulse-dot 1.5s infinite" }} />
            <span className="s-label" style={{ color: "var(--s-white)", fontSize: "11px" }}>The Sublevel &middot; where creators keep 100%</span>
          </div>

          <h1
            className="s-heading"
            data-testid="hero-heading"
            style={{ fontSize: "clamp(46px, 8vw, 96px)", lineHeight: 0.98, color: "var(--s-white)", marginBottom: 24, textShadow: shadow }}
          >
            Increase Your
            <br />
            <span style={{ color: "var(--s-yellow)" }}>GDP.</span>
          </h1>

          <p
            className="s-body"
            style={{ fontSize: "clamp(15px, 1.8vw, 18px)", lineHeight: 1.7, color: "rgba(250,250,245,0.82)", maxWidth: 560, margin: "0 auto 32px", textShadow: shadow }}
          >
            Your income is your <strong style={{ color: "var(--s-white)", fontWeight: 700 }}>personal GDP</strong> &mdash; and it&rsquo;s yours to grow. Sell templates, guides, and courses, launch a store in minutes, connect Stripe or PayPal, and keep 100% of every sale.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 40 }}>
            <a
              href="#pricing"
              className="cta-mono inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold transition-all duration-200 hover:brightness-110"
              style={{ background: "var(--s-yellow)", color: "var(--s-black)", fontSize: "12px", boxShadow: "0 0 40px rgba(245,230,66,0.3)" }}
              data-testid="button-hero-cta"
            >
              Start Earning Free
            </a>
            <a
              href="#products"
              className="s-label inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold transition-all duration-200 group"
              style={{ border: "1px solid rgba(250,250,245,0.25)", color: "var(--s-white)", fontSize: "12px", background: "rgba(5,5,5,0.45)", backdropFilter: "blur(6px)" }}
              data-testid="button-hero-demo"
            >
              Browse Products
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginBottom: 36 }}>
            {[
              { value: "200+", label: "Digital Products" },
              { value: "5 min", label: "Store Setup" },
              { value: "$0", label: "Platform Fees" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 8 }} data-testid={`hero-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--s-yellow)", textShadow: shadow }}>
                  {stat.value}
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Meet the crew */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(250,250,245,0.5)", textTransform: "uppercase", letterSpacing: 1, alignSelf: "center", marginRight: 4 }}>
              Meet the crew
            </span>
            {crew.map((c) => (
              <span
                key={c.n}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, border: `1px solid rgba(${c.rgb},0.4)`, background: "rgba(5,5,5,0.5)", backdropFilter: "blur(6px)", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(250,250,245,0.9)" }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: `rgb(${c.rgb})`, boxShadow: `0 0 8px rgb(${c.rgb})` }} />
                {c.n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
