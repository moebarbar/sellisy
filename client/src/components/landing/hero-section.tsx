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

function DashboardMockup() {
  const revenueData = [28, 42, 35, 58, 48, 72, 65, 88, 75, 95, 82, 100];

  return (
    <div
      data-testid="hero-dashboard-mockup"
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px rgba(245,230,66,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: 1,
          }}
        >
          sellisy.com/dashboard
        </div>
        <div style={{ width: 46 }} />
      </div>

      <div style={{ display: "flex", minHeight: 340 }}>
        <div
          className="hidden sm:flex"
          style={{
            width: 180,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "16px 12px",
            flexDirection: "column",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              color: "var(--s-white)",
              marginBottom: 16,
              paddingLeft: 8,
            }}
          >
            SELL<span style={{ color: "var(--s-yellow)" }}>I</span>SY
          </div>
          {[
            { label: "Overview", active: true },
            { label: "Products", active: false },
            { label: "Orders", active: false },
            { label: "Customers", active: false },
            { label: "Analytics", active: false },
            { label: "Settings", active: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                color: item.active ? "var(--s-yellow)" : "rgba(255,255,255,0.4)",
                background: item.active ? "rgba(245,230,66,0.08)" : "transparent",
                fontWeight: item.active ? 600 : 400,
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Total Revenue
              </div>
              <div style={{ fontSize: 28, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "var(--s-white)" }}>
                $12,847
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#4ade80" }}>+23.5%</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 20, padding: "0 4px" }}>
            {revenueData.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: 4,
                  background: i >= 10 ? "var(--s-yellow)" : "rgba(245,230,66,0.15)",
                  transition: "height 0.3s ease",
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10, marginBottom: 16 }}>
            {[
              { label: "Orders", value: "847", trend: "+12%" },
              { label: "Customers", value: "1,247", trend: "+18%" },
              { label: "Conversion", value: "4.8%", trend: "+0.6%" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: "var(--s-white)" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#4ade80", marginTop: 2 }}>
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Recent Orders
            </div>
            {[
              { product: "Social Media Kit", customer: "sarah@email.com", amount: "$29.00", status: "Delivered" },
              { product: "Landing Templates", customer: "mike@email.com", amount: "$49.00", status: "Delivered" },
              { product: "Brand Guidelines", customer: "alex@email.com", amount: "$19.00", status: "Pending" },
            ].map((order, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 0",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  gap: 12,
                  fontSize: 11,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${i === 0 ? '#1a0a2e, #3a1a5c' : i === 1 ? '#0a1a2e, #1a3a5c' : '#2e1a0a, #5c3a1a'})`, flexShrink: 0 }} />
                <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)" }}>
                  {order.product}
                </div>
                <div className="hidden md:block" style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                  {order.customer}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", color: "var(--s-yellow)", fontSize: 11, fontWeight: 600 }}>
                  {order.amount}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "'Space Mono', monospace",
                    padding: "3px 8px",
                    borderRadius: 99,
                    background: order.status === "Delivered" ? "rgba(74,222,128,0.1)" : "rgba(245,230,66,0.1)",
                    color: order.status === "Delivered" ? "#4ade80" : "var(--s-yellow)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {order.status}
                </div>
              </div>
            ))}
          </div>
        </div>
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
            <span className="s-label" style={{ color: "var(--s-yellow)", fontSize: "11px" }}>The platform for digital creators</span>
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
            Your Digital Storefront.
            <br />
            <span style={{ color: "var(--s-yellow)" }}>Built in Minutes.</span>
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
            Import 200+ PLR & MRR products or create your own. Launch a storefront, connect Stripe or PayPal, and keep 100% of every sale.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 48 }}>
            <a
              href="#pricing"
              className="cta-mono inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold transition-all duration-200 hover:brightness-110"
              style={{ background: "var(--s-yellow)", color: "var(--s-black)", fontSize: "12px", boxShadow: "0 0 30px rgba(245,230,66,0.15)" }}
              data-testid="button-hero-cta"
            >
              Start Selling Free
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
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
