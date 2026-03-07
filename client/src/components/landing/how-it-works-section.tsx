import { useState } from "react";

const steps = [
  {
    num: "01",
    title: "Create Your Store",
    description:
      "Sign up, pick a template, and customize your storefront in minutes. No code, no designers, no hassle.",
  },
  {
    num: "02",
    title: "Import or Create Products",
    description:
      "Upload your own digital products or browse our PLR & MRR library to find ready-to-sell content instantly.",
  },
  {
    num: "03",
    title: "Sell, Deliver & Scale",
    description:
      "Connect Stripe or PayPal, set your prices, and let Sellisy handle secure delivery, analytics, and growth.",
  },
];

function StepCircle({
  num,
  hovered,
}: {
  num: string;
  hovered: boolean;
}) {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        border: "2px solid var(--s-yellow)",
        background: hovered ? "var(--s-yellow)" : "var(--s-black)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s ease",
        transform: hovered ? "scale(1.1)" : "scale(1)",
        flexShrink: 0,
      }}
    >
      <span
        className="s-heading"
        style={{
          fontSize: 24,
          color: hovered ? "var(--s-black)" : "var(--s-yellow)",
          transition: "color 0.3s ease",
          lineHeight: 1,
        }}
      >
        {num}
      </span>
    </div>
  );
}

export function HowItWorksSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      data-testid="section-how-it-works"
      style={{
        background: "#080808",
        padding: "120px 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <span
          className="s-label"
          data-testid="label-how-it-works"
          style={{ color: "var(--s-yellow)", marginBottom: 20, display: "block" }}
        >
          // The process
        </span>
        <h2
          className="s-heading"
          data-testid="title-how-it-works"
          style={{ fontSize: 64, color: "var(--s-white)", marginBottom: 80 }}
        >
          THREE STEPS TO YOUR FIRST SALE
        </h2>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 32,
              left: "16.66%",
              right: "16.66%",
              height: 2,
              background:
                "linear-gradient(90deg, var(--s-yellow), var(--s-orange), var(--s-pink))",
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 48,
              position: "relative",
              zIndex: 1,
            }}
          >
            {steps.map((step, i) => (
              <div
                key={step.num}
                data-testid={`step-${step.num}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <StepCircle num={step.num} hovered={hoveredIndex === i} />
                <h3
                  className="s-heading"
                  style={{
                    fontSize: 26,
                    color: "var(--s-white)",
                    marginTop: 12,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="s-body"
                  style={{
                    fontSize: 13,
                    color: "rgba(250,250,245,0.5)",
                    maxWidth: 280,
                    margin: "0 auto",
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
