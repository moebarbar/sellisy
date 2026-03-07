export function PricingSection() {
  const starterFeatures = [
    "1 storefront",
    "30 PLR imports",
    "Unlimited own products",
    "Customer portal",
    "Upsells & order bumps",
    "Stripe / PayPal",
    "6 templates",
    "Analytics dashboard",
  ];

  const growthFeatures = [
    "3 storefronts",
    "150 PLR imports",
    "Custom domains",
    "Advanced analytics",
    "Priority support",
    "Everything in Starter",
  ];

  const empireFeatures = [
    "Unlimited storefronts",
    "Unlimited PLR imports",
    "Software license sales",
    "White-label portal",
    "Dedicated support",
    "Everything in Growth",
  ];

  return (
    <section
      data-testid="pricing-section"
      style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 24 }}>
          // Pricing
        </p>
        <h2
          className="s-heading"
          style={{ fontSize: "clamp(48px, 8vw, 80px)", marginBottom: 16 }}
        >
          <span style={{ color: "var(--s-white)" }}>PICK YOUR PLAN.</span>
          <br />
          <span style={{ color: "var(--s-yellow)" }}>KEEP 100% OF EVERY SALE.</span>
        </h2>
        <p className="s-label" style={{ color: "rgba(250,250,245,0.4)" }}>
          No free tier. No hidden fees. Just tools that pay for themselves.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* STARTER */}
        <div
          data-testid="plan-starter"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 36,
            width: 340,
            minWidth: 280,
            flex: "1 1 280px",
            maxWidth: 380,
          }}
        >
          <p className="s-label" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 8 }}>
            Starter
          </p>
          <div style={{ marginBottom: 8 }}>
            <span className="s-heading" style={{ fontSize: 80, color: "var(--s-white)" }}>
              $19
            </span>
            <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", marginLeft: 4 }}>
              /mo
            </span>
          </div>
          <p className="s-body" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 28 }}>
            Your first store starts here
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32 }}>
            {starterFeatures.map((f) => (
              <li
                key={f}
                className="s-body"
                style={{
                  color: "var(--s-white)",
                  padding: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ color: "var(--s-yellow)", fontSize: 12 }}>✦</span>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/auth"
            data-testid="cta-starter"
            style={{
              display: "block",
              textAlign: "center",
              padding: "14px 0",
              borderRadius: 10,
              background: "var(--s-black)",
              border: "1.5px solid var(--s-yellow)",
              color: "var(--s-yellow)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              textTransform: "uppercase" as const,
              letterSpacing: 1,
              textDecoration: "none",
            }}
          >
            Get Started →
          </a>
        </div>

        {/* GROWTH */}
        <div
          data-testid="plan-growth"
          style={{
            background: "var(--s-yellow)",
            borderRadius: 16,
            padding: 36,
            width: 340,
            minWidth: 280,
            flex: "1 1 280px",
            maxWidth: 380,
            transform: "translateY(-12px)",
            position: "relative",
          }}
        >
          <span
            data-testid="badge-popular"
            style={{
              position: "absolute",
              top: -14,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--s-black)",
              color: "var(--s-yellow)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              textTransform: "uppercase" as const,
              letterSpacing: 2,
              padding: "6px 18px",
              borderRadius: 999,
              whiteSpace: "nowrap" as const,
            }}
          >
            Most Popular
          </span>
          <p className="s-label" style={{ color: "rgba(5,5,5,0.5)", marginBottom: 8 }}>
            Growth
          </p>
          <div style={{ marginBottom: 8 }}>
            <span className="s-heading" style={{ fontSize: 80, color: "var(--s-black)" }}>
              $39
            </span>
            <span className="s-label" style={{ color: "rgba(5,5,5,0.4)", marginLeft: 4 }}>
              /mo
            </span>
          </div>
          <p className="s-body" style={{ color: "rgba(5,5,5,0.6)", marginBottom: 28 }}>
            For creators scaling up
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32 }}>
            {growthFeatures.map((f) => (
              <li
                key={f}
                className="s-body"
                style={{
                  color: "var(--s-black)",
                  padding: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ color: "var(--s-black)", fontSize: 12 }}>✦</span>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/auth"
            data-testid="cta-growth"
            style={{
              display: "block",
              textAlign: "center",
              padding: "14px 0",
              borderRadius: 10,
              background: "var(--s-black)",
              color: "var(--s-yellow)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              textTransform: "uppercase" as const,
              letterSpacing: 1,
              textDecoration: "none",
            }}
          >
            Get Started →
          </a>
        </div>

        {/* EMPIRE */}
        <div style={{ width: 340, minWidth: 280, flex: "1 1 280px", maxWidth: 380, display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
          <div
            style={{
              animation: "s-bounce-crown 2s ease-in-out infinite",
              fontSize: 28,
              marginBottom: 8,
            }}
          >
            👑
          </div>
          <div
            data-testid="plan-empire"
            style={{
              background: "linear-gradient(90deg, var(--s-yellow), var(--s-orange), var(--s-pink), var(--s-yellow))",
              backgroundSize: "300%",
              animation: "s-gradient-border 4s linear infinite",
              padding: 2,
              borderRadius: 16,
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                background: "var(--s-black)",
                borderRadius: 14,
                padding: 36,
                position: "relative",
              }}
            >
              <span
                data-testid="badge-value"
                style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--s-orange)",
                  color: "var(--s-black)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  textTransform: "uppercase" as const,
                  letterSpacing: 2,
                  padding: "6px 18px",
                  borderRadius: 999,
                  whiteSpace: "nowrap" as const,
                }}
              >
                Best Value
              </span>
              <p className="s-label" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 8 }}>
                Empire
              </p>
              <div style={{ marginBottom: 8 }}>
                <span className="s-heading" style={{ fontSize: 80, color: "var(--s-white)" }}>
                  $69
                </span>
                <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", marginLeft: 4 }}>
                  /mo
                </span>
              </div>
              <p className="s-body" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 28 }}>
                Build an empire, not just a store
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32 }}>
                {empireFeatures.map((f) => (
                  <li
                    key={f}
                    className="s-body"
                    style={{
                      color: "var(--s-white)",
                      padding: "6px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ color: "var(--s-yellow)", fontSize: 12 }}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth"
                data-testid="cta-empire"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 0",
                  borderRadius: 10,
                  background: "var(--s-yellow)",
                  color: "var(--s-black)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 13,
                  textTransform: "uppercase" as const,
                  letterSpacing: 1,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Get Started →
              </a>
            </div>
          </div>
        </div>
      </div>

      <p
        className="s-label"
        data-testid="pricing-footer"
        style={{
          textAlign: "center",
          color: "rgba(250,250,245,0.35)",
          marginTop: 48,
          maxWidth: 600,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 2,
        }}
      >
        Connect your own Stripe or PayPal. You keep 100% of every sale. Cancel anytime.
      </p>
    </section>
  );
}
