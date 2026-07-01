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
  const revenueData = [18, 32, 25, 48, 38, 62, 55, 78, 65, 88, 72, 95, 82, 100];

  const sidebarItems = [
    { label: "Overview", active: true, icon: "◎" },
    { label: "Analytics", active: false, icon: "◔" },
    { label: "Products", active: false, icon: "▦" },
    { label: "Courses", active: false, icon: "▲" },
    { label: "Library", active: false, icon: "▤" },
    { label: "Knowledge Base", active: false, icon: "✎" },
    { label: "Blog", active: false, icon: "▧" },
    { label: "Bundles", active: false, icon: "⊞" },
    { label: "Affiliates", active: false, icon: "◈" },
    { label: "Coupons", active: false, icon: "✂" },
    { label: "Customers", active: false, icon: "◉" },
    { label: "Orders", active: false, icon: "☰" },
    { label: "Settings", active: false, icon: "⚙" },
  ];

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

      <div style={{ display: "flex", minHeight: 420 }}>
        <div
          className="hidden md:flex"
          style={{
            width: 190,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "14px 10px",
            flexDirection: "column",
            gap: 1,
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20,
              color: "var(--s-white)",
              marginBottom: 12,
              paddingLeft: 8,
            }}
          >
            SELL<span style={{ color: "var(--s-yellow)" }}>I</span>SY
          </div>

          {sidebarItems.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 11,
                fontFamily: "'DM Sans', sans-serif",
                color: item.active ? "var(--s-yellow)" : "rgba(255,255,255,0.4)",
                background: item.active ? "rgba(245,230,66,0.08)" : "transparent",
                fontWeight: item.active ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.7, width: 14, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ marginTop: "auto", padding: "10px 10px 4px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--s-yellow), var(--s-orange))", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--s-white)", fontFamily: "'DM Sans', sans-serif" }}>Sarah K.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 8, fontFamily: "'Space Mono', monospace", color: "var(--s-yellow)", textTransform: "uppercase", letterSpacing: 1, padding: "1px 5px", borderRadius: 3, background: "rgba(245,230,66,0.1)" }}>
                    PRO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "var(--s-white)", padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Master Resell Club ▾
              </div>
              <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>master-resell-club.sellisy.com</span>
            </div>
            <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "var(--s-teal)", padding: "4px 10px", borderRadius: 6, background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.15)" }}>
              View Storefront →
            </div>
          </div>

          <div style={{ flex: 1, padding: "16px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>☀️</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: "var(--s-white)" }}>Good morning, Sarah</div>
                <div style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>"Every sale starts with showing up."</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 8, marginBottom: 14 }}>
              {[
                { label: "Total Revenue", value: "$12,847", icon: "💰", color: "var(--s-yellow)" },
                { label: "Total Orders", value: "847", icon: "📦", color: "var(--s-teal)" },
                { label: "Active Products", value: "24", icon: "🏷️", color: "var(--s-orange)" },
                { label: "Avg. Order", value: "$15.16", icon: "📊", color: "var(--s-pink)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "10px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 10 }}>{stat.icon}</span>
                    <span style={{ fontSize: 8, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Revenue — Last 14 Days
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 70, padding: "0 2px" }}>
                  {revenueData.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        borderRadius: 3,
                        background: i >= 12 ? "var(--s-yellow)" : "rgba(245,230,66,0.15)",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Top Products
                </div>
                {[
                  { name: "Social Media Kit", sold: "312 sold", revenue: "$9,048" },
                  { name: "Brand Guidelines", sold: "186 sold", revenue: "$3,534" },
                  { name: "Notion Templates", sold: "98 sold", revenue: "$1,470" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: i === 0 ? "var(--s-yellow)" : i === 1 ? "var(--s-teal)" : "var(--s-orange)", flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)" }}>{p.name}</div>
                    <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.3)" }}>{p.sold}</div>
                    <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "var(--s-yellow)", fontWeight: 600 }}>{p.revenue}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(245,230,66,0.04)", border: "1px solid rgba(245,230,66,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12 }}>🚀</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "var(--s-white)" }}>Getting Started</div>
                    <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)" }}>5 of 6 complete</div>
                  </div>
                </div>
                <div style={{ width: 80, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: "83%", height: "100%", borderRadius: 99, background: "var(--s-yellow)" }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                ✨ What's Next?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 8 }}>
                {[
                  { emoji: "📸", title: "Launch on Instagram", desc: "Share your store link and first product with a Reel or Story", color: "var(--s-pink)" },
                  { emoji: "✍️", title: "Start a Blog", desc: "Write SEO content to drive organic traffic to your store", color: "var(--s-teal)" },
                  { emoji: "🎁", title: "Create a Bundle", desc: "Package 3+ products together and offer a discount", color: "var(--s-yellow)" },
                ].map((card) => (
                  <div
                    key={card.title}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{card.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "var(--s-white)" }}>{card.title}</span>
                    </div>
                    <div style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.35)", lineHeight: 1.4, marginBottom: 6 }}>{card.desc}</div>
                    <div style={{ fontSize: 8, fontFamily: "'Space Mono', monospace", color: card.color, textTransform: "uppercase", letterSpacing: 1 }}>Let's Go →</div>
                  </div>
                ))}
              </div>
            </div>
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
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
