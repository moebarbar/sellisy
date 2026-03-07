const stickers = [
  { text: "☕ Café coded", bg: "var(--s-yellow)", rotate: -7, delay: "0s", top: "15%", right: "8%" },
  { text: "💻 Laptop life", bg: "var(--s-teal)", rotate: 5, delay: "0.8s", top: "65%", right: "3%" },
  { text: "💰 MRR rights", bg: "var(--s-orange)", rotate: -4, delay: "1.4s", top: "40%", right: "1%" },
  { text: "🚀 Import & sell", bg: "var(--s-pink)", rotate: 8, delay: "2.1s", top: "80%", right: "15%" },
];

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

      <div className="max-w-[1200px] mx-auto px-6 w-full relative z-10 pt-20 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ border: "1px solid rgba(245,230,66,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--s-yellow)", animation: "s-pulse-dot 1.5s infinite" }} />
              <span className="s-label" style={{ color: "var(--s-yellow)", fontSize: "11px" }}>The platform for digital creators</span>
            </div>

            <h1 className="s-heading" style={{ fontSize: "clamp(72px, 12vw, 160px)" }}>
              <span style={{ color: "var(--s-white)" }}>SELL</span>
              <br />
              <span style={{ WebkitTextStroke: "2px var(--s-white)", color: "transparent" }}>DIG</span>
              <span style={{ color: "var(--s-yellow)" }}>ITAL</span>
              <br />
              <span style={{ color: "var(--s-pink)" }}>LIVE FREE.</span>
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
              className="absolute top-[240px] right-[140px] p-4 rounded-2xl w-[200px]"
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

            {stickers.map((s, i) => (
              <div
                key={i}
                className="s-sticker absolute"
                style={{
                  background: s.bg,
                  transform: `rotate(${s.rotate}deg)`,
                  animation: `s-float ${6 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: s.delay,
                  top: s.top,
                  right: s.right,
                }}
              >
                {s.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
