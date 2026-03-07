import { useState } from "react";

const features = [
  {
    icon: "\u{1F4DA}",
    title: "PLR & MRR Library",
    description: "Access hundreds of ready-to-sell digital products with full resell rights included.",
    tag: "Content",
  },
  {
    icon: "\u{1F3A8}",
    title: "Built-in Creator Tools",
    description: "Design product mockups, write sales copy, and build landing pages without leaving the platform.",
    tag: "Create",
  },
  {
    icon: "\u{1F4B3}",
    title: "Stripe & PayPal",
    description: "Accept payments globally with one-click Stripe and PayPal integration. No code required.",
    tag: "Payments",
  },
  {
    icon: "\u{1F512}",
    title: "Secure Delivery",
    description: "Tamper-proof file delivery with expiring download links and access controls.",
    tag: "Security",
  },
  {
    icon: "\u{1F5BC}\uFE0F",
    title: "6 Storefront Templates",
    description: "Choose from six designer-crafted themes and customize colors, fonts, and layout instantly.",
    tag: "Design",
  },
  {
    icon: "\u{1F3EA}",
    title: "Multi-Store",
    description: "Run multiple storefronts from a single dashboard. Different brands, one login.",
    tag: "Scale",
  },
  {
    icon: "\u{1F464}",
    title: "Customer Portal",
    description: "Give buyers their own portal to access purchases, downloads, and order history.",
    tag: "Experience",
  },
  {
    icon: "\u{1F4CA}",
    title: "Analytics",
    description: "Track views, conversions, and revenue in real-time with beautiful visual dashboards.",
    tag: "Insights",
  },
  {
    icon: "\u{1F4BB}",
    title: "Software Sales",
    description: "Sell license keys, SaaS access, and software subscriptions with built-in key management.",
    tag: "Software",
  },
];

function FeatureCard({
  icon,
  title,
  description,
  tag,
  index,
}: {
  icon: string;
  title: string;
  description: string;
  tag: string;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      data-testid={`feature-card-${index}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 12,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "background 0.3s ease",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: hovered
            ? "var(--s-yellow)"
            : "rgba(245,230,66,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          transition: "background 0.3s ease",
        }}
      >
        {icon}
      </div>
      <h3
        className="s-heading"
        style={{ fontSize: 22, color: "var(--s-white)" }}
      >
        {title}
      </h3>
      <p
        className="s-body"
        style={{
          fontSize: 13,
          color: "rgba(250,250,245,0.5)",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      <span
        style={{
          display: "inline-block",
          alignSelf: "flex-start",
          padding: "4px 12px",
          borderRadius: 999,
          background: "rgba(0,245,212,0.1)",
          color: "var(--s-teal)",
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {tag}
      </span>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      data-testid="section-features"
      style={{
        padding: "120px 24px",
        background: "var(--s-black)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <span
            className="s-label"
            data-testid="label-features"
            style={{
              color: "var(--s-yellow)",
              marginBottom: 20,
              display: "block",
            }}
          >
            // Everything included
          </span>
          <h2
            className="s-heading"
            data-testid="title-features"
            style={{ fontSize: 64, color: "var(--s-white)" }}
          >
            EVERYTHING YOU NEED
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
