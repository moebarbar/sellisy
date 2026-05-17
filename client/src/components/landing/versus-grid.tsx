import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { COMPETITORS } from "@/data/competitors";

export function VersusGrid() {
  return (
    <section
      data-testid="section-versus-grid"
      style={{
        padding: "120px 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 18 }}>
            // Compare
          </p>
          <h2
            className="s-heading"
            data-testid="title-versus-grid"
            style={{ fontSize: "clamp(36px, 7vw, 72px)", marginBottom: 18 }}
          >
            <span style={{ color: "var(--s-white)" }}>HOW WE STACK UP</span>
            <br />
            <span style={{ color: "var(--s-yellow)" }}>VS THE REST.</span>
          </h2>
          <p
            className="s-body"
            style={{
              color: "rgba(250,250,245,0.55)",
              fontSize: 16,
              maxWidth: 620,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Side-by-side breakdowns vs every major creator platform. No fluff — pricing, fees, features, and which one fits you.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {COMPETITORS.map((c) => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              data-testid={`versus-card-${c.slug}`}
              className="s-reveal"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "22px 22px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                textDecoration: "none",
                transition: "border-color 0.25s ease, transform 0.25s ease, background 0.25s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.accent;
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: `radial-gradient(circle at top right, ${c.accent}22 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="s-heading"
                  style={{
                    color: "var(--s-white)",
                    fontSize: 22,
                    letterSpacing: "1px",
                  }}
                >
                  SELLISY
                </span>
                <span
                  className="s-label"
                  style={{ color: "rgba(250,250,245,0.4)", fontSize: 11 }}
                >
                  vs
                </span>
                <span
                  className="s-heading"
                  style={{
                    color: c.accent,
                    fontSize: 22,
                    letterSpacing: "1px",
                  }}
                >
                  {c.name.toUpperCase()}
                </span>
              </div>

              <p
                className="s-body"
                style={{
                  color: "rgba(250,250,245,0.6)",
                  fontSize: 13,
                  lineHeight: 1.55,
                  margin: 0,
                  flex: 1,
                }}
              >
                {c.tagline}.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  color: "var(--s-yellow)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Read comparison
                <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
