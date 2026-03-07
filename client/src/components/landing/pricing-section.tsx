import { useState } from "react";
import { Loader2, Eye, EyeOff, X } from "lucide-react";

type PlanKey = "basic" | "pro" | "max";

const PLANS: Record<PlanKey, { label: string; price: string }> = {
  basic: { label: "Starter", price: "$19" },
  pro: { label: "Growth", price: "$39" },
  max: { label: "Empire", price: "$69" },
};

function SignupModal({ plan, onClose }: { plan: PlanKey; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email, firstName, lastName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const info = PLANS[plan];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="signup-modal-overlay"
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 36,
          width: "100%",
          maxWidth: 420,
          position: "relative",
        }}
        data-testid="signup-modal"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "rgba(250,250,245,0.4)",
            cursor: "pointer",
          }}
          data-testid="button-close-modal"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p
            className="s-label"
            style={{ color: "var(--s-yellow)", marginBottom: 8 }}
          >
            {info.label} Plan
          </p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
            <span className="s-heading" style={{ fontSize: 48, color: "var(--s-white)" }}>
              {info.price}
            </span>
            <span className="s-label" style={{ color: "rgba(250,250,245,0.35)" }}>/mo</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label
                className="s-label"
                style={{ color: "rgba(250,250,245,0.5)", fontSize: 10, marginBottom: 6, display: "block" }}
              >
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
                data-testid="input-signup-first-name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--s-white)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                className="s-label"
                style={{ color: "rgba(250,250,245,0.5)", fontSize: 10, marginBottom: 6, display: "block" }}
              >
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
                data-testid="input-signup-last-name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--s-white)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="s-label"
              style={{ color: "rgba(250,250,245,0.5)", fontSize: 10, marginBottom: 6, display: "block" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              data-testid="input-signup-email"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--s-white)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              className="s-label"
              style={{ color: "rgba(250,250,245,0.5)", fontSize: 10, marginBottom: 6, display: "block" }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                data-testid="input-signup-password"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  paddingRight: 42,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--s-white)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(250,250,245,0.4)",
                  cursor: "pointer",
                }}
                data-testid="button-toggle-signup-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                color: "#ef4444",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                textAlign: "center",
                margin: 0,
              }}
              data-testid="text-signup-error"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="button-subscribe"
            style={{
              padding: "14px 0",
              borderRadius: 10,
              background: "var(--s-yellow)",
              color: "var(--s-black)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              `Subscribe — ${info.price}/mo →`
            )}
          </button>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "rgba(250,250,245,0.3)",
            textAlign: "center",
            margin: 0,
          }}>
            You'll be redirected to Stripe for secure payment. Cancel anytime.
          </p>
        </form>
      </div>
    </div>
  );
}

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

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
          style={{ fontSize: "clamp(40px, 8vw, 80px)", marginBottom: 16 }}
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
          alignItems: "stretch",
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
            display: "flex",
            flexDirection: "column" as const,
          }}
        >
          <p className="s-label" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 8 }}>
            Starter
          </p>
          <div style={{ marginBottom: 8 }}>
            <span className="s-heading" style={{ fontSize: "clamp(48px, 10vw, 80px)", color: "var(--s-white)" }}>
              $19
            </span>
            <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", marginLeft: 4 }}>
              /mo
            </span>
          </div>
          <p className="s-body" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 28 }}>
            Your first store starts here
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32, flex: 1 }}>
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
          <button
            onClick={() => setSelectedPlan("basic")}
            data-testid="cta-starter"
            style={{
              display: "block",
              width: "100%",
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
              cursor: "pointer",
            }}
          >
            Get Started →
          </button>
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
            position: "relative",
            display: "flex",
            flexDirection: "column" as const,
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
            <span className="s-heading" style={{ fontSize: "clamp(48px, 10vw, 80px)", color: "var(--s-black)" }}>
              $39
            </span>
            <span className="s-label" style={{ color: "rgba(5,5,5,0.4)", marginLeft: 4 }}>
              /mo
            </span>
          </div>
          <p className="s-body" style={{ color: "rgba(5,5,5,0.6)", marginBottom: 28 }}>
            For creators scaling up
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32, flex: 1 }}>
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
          <button
            onClick={() => setSelectedPlan("pro")}
            data-testid="cta-growth"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "14px 0",
              borderRadius: 10,
              background: "var(--s-black)",
              color: "var(--s-yellow)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              textTransform: "uppercase" as const,
              letterSpacing: 1,
              border: "none",
              cursor: "pointer",
            }}
          >
            Get Started →
          </button>
        </div>

        {/* EMPIRE */}
        <div
          data-testid="plan-empire"
          style={{
            background: "linear-gradient(90deg, var(--s-yellow), var(--s-orange), var(--s-pink), var(--s-yellow))",
            backgroundSize: "300%",
            animation: "s-gradient-border 4s linear infinite",
            padding: 2,
            borderRadius: 16,
            width: 340,
            minWidth: 280,
            flex: "1 1 280px",
            maxWidth: 380,
            position: "relative",
          }}
        >
            <div
              style={{
                background: "var(--s-black)",
                borderRadius: 14,
                padding: 36,
                position: "relative",
                display: "flex",
                flexDirection: "column" as const,
                height: "100%",
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
                <span className="s-heading" style={{ fontSize: "clamp(48px, 10vw, 80px)", color: "var(--s-white)" }}>
                  $69
                </span>
                <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", marginLeft: 4 }}>
                  /mo
                </span>
              </div>
              <p className="s-body" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 28 }}>
                Build an empire, not just a store
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 32, flex: 1 }}>
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
              <button
                onClick={() => setSelectedPlan("max")}
                data-testid="cta-empire"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  padding: "14px 0",
                  borderRadius: 10,
                  background: "var(--s-yellow)",
                  color: "var(--s-black)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 13,
                  textTransform: "uppercase" as const,
                  letterSpacing: 1,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Get Started →
              </button>
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

      {selectedPlan && (
        <SignupModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </section>
  );
}
