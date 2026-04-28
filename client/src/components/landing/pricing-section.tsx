import { useState } from "react";
import { useUser } from "@clerk/react";
import { Loader2, X, ArrowRight, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type PlanKey = "basic" | "pro" | "max";

const PLANS: Record<PlanKey, { label: string; price: string }> = {
  basic: { label: "Starter", price: "$19" },
  pro: { label: "Growth", price: "$39" },
  max: { label: "Empire", price: "$69" },
};

function SubscribeModal({ plan, onClose }: { plan: PlanKey; onClose: () => void }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const info = PLANS[plan];

  const handleSubscribe = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/subscribe", { plan });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Could not start checkout.");
    } catch (err: any) {
      setError(err?.message ?? "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToAuth = () => {
    // Stash the chosen plan so /auth can hand it back after sign-in
    sessionStorage.setItem("pendingPlan", plan);
    window.location.href = "/auth";
  };

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
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 8 }}>
            {info.label} Plan
          </p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
            <span className="s-heading" style={{ fontSize: 48, color: "var(--s-white)" }}>
              {info.price}
            </span>
            <span className="s-label" style={{ color: "rgba(250,250,245,0.35)" }}>/mo</span>
          </div>
        </div>

        {!isLoaded ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "rgba(250,250,245,0.4)" }} />
          </div>
        ) : !isSignedIn ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <Lock size={16} style={{ color: "var(--s-yellow)", flexShrink: 0 }} />
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "rgba(250,250,245,0.65)",
                margin: 0,
                lineHeight: 1.4,
              }}>
                You'll create an account first, then we'll bring you back to checkout.
              </p>
            </div>
            <button
              onClick={goToAuth}
              data-testid="button-go-to-auth"
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
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Create Account & Continue
              <ArrowRight size={16} />
            </button>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "rgba(250,250,245,0.3)",
              textAlign: "center",
              margin: 0,
            }}>
              Already have an account? Click the same button — you can sign in there.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "rgba(250,250,245,0.7)",
              textAlign: "center",
              margin: 0,
            }}>
              Subscribing as <strong style={{ color: "var(--s-white)" }}>{user?.primaryEmailAddress?.emailAddress}</strong>
            </p>

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
              onClick={handleSubscribe}
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
          </div>
        )}
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
        <SubscribeModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </section>
  );
}
