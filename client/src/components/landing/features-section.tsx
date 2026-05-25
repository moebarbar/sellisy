import { useState } from "react";

// Tier 1 — six hero features. These are the moats + most-asked-for shipped
// capabilities. Anything that's a "we have this" wedge against Gumroad /
// Lemon Squeezy / Podia goes here.
const heroFeatures = [
  {
    icon: "\u{1F4DA}",
    title: "PLR & MRR Library",
    description: "200+ ready-to-sell digital products with full resell rights. Yours to rebrand and ship in minutes.",
    tag: "Unique",
  },
  {
    icon: "\u{1F393}",
    title: "Courses & LMS",
    description: "Modules, lessons, quizzes, drip schedules, and auto-issued certificates. Run a cohort without a second platform.",
    tag: "New",
  },
  {
    icon: "\u{1F517}",
    title: "Affiliate Program",
    description: "Unique tracking links, automatic commissions, refund clawback, manual payouts. Turn buyers into your sales team.",
    tag: "New",
  },
  {
    icon: "\u{1F3EA}",
    title: "Multi-Store",
    description: "Run multiple storefronts from one login. Different brands, themes, payments — same dashboard.",
    tag: "Scale",
  },
  {
    icon: "\u{1F4B3}",
    title: "Stripe + PayPal + Tax",
    description: "Connect your own keys. Auto-handles VAT/sales tax. Zero platform fees — you keep 100% of every sale.",
    tag: "Payments",
  },
  {
    icon: "\u{1F4DD}",
    title: "Content Studio",
    description: "Notion-style block editor for knowledge bases, blogs, and newsletter campaigns. Built-in, not a plugin.",
    tag: "Create",
  },
];

// Tier 2 — compact chip strip. Everything else that's worth a mention but
// doesn't need its own card. Keeps the page from sprawling.
const chips = [
  { icon: "\u{1F3A8}", label: "7 storefront themes" },
  { icon: "\u{1F310}", label: "Custom domains" },
  { icon: "\u{2B50}", label: "Verified buyer reviews" },
  { icon: "\u{1F4DC}", label: "Per-buyer PDF watermarking" },
  { icon: "\u{1F4F1}", label: "Embed widgets" },
  { icon: "\u{1F464}", label: "Customer portal" },
  { icon: "\u{1F4E5}", label: "1-click Gumroad import" },
  { icon: "\u{1F4CA}", label: "Real-time analytics" },
  { icon: "\u{1F381}", label: "14-day free trial" },
  { icon: "\u{1F4BB}", label: "Software & license keys" },
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

  // "New" tag highlighted in yellow; everything else stays teal so the eye
  // catches the just-shipped wins on first scan.
  const isNew = tag === "New";

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
        transition: "background 0.3s ease, transform 0.3s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: hovered ? "var(--s-yellow)" : "rgba(245,230,66,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          transition: "background 0.3s ease",
        }}
      >
        {icon}
      </div>
      <h3 className="s-heading" style={{ fontSize: 22, color: "var(--s-white)" }}>
        {title}
      </h3>
      <p
        className="s-body"
        style={{ fontSize: 13, color: "rgba(250,250,245,0.5)", lineHeight: 1.6 }}
      >
        {description}
      </p>
      <span
        style={{
          display: "inline-block",
          alignSelf: "flex-start",
          padding: "4px 12px",
          borderRadius: 999,
          background: isNew ? "rgba(245,230,66,0.12)" : "rgba(0,245,212,0.1)",
          color: isNew ? "var(--s-yellow)" : "var(--s-teal)",
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
            style={{ color: "var(--s-yellow)", marginBottom: 20, display: "block" }}
          >
            // Everything included
          </span>
          <h2
            className="s-heading"
            data-testid="title-features"
            style={{ fontSize: "clamp(36px, 6vw, 64px)", color: "var(--s-white)" }}
          >
            EVERYTHING YOU NEED
          </h2>
          <p
            className="s-body"
            style={{
              fontSize: 14,
              color: "rgba(250,250,245,0.5)",
              maxWidth: 560,
              margin: "16px auto 0",
            }}
          >
            One platform. Six big moves. Plus a dozen more conveniences you
            won&rsquo;t have to bolt on with five different SaaS subscriptions.
          </p>
        </div>

        <div className="s-features-grid" style={{ display: "grid" }}>
          {heroFeatures.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>

        {/* Tier 2: "and also" chip strip. Compact disclosure of secondary
            features so we surface them without exploding the section height. */}
        <div
          data-testid="features-chip-strip"
          style={{
            marginTop: 56,
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 24,
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "rgba(250,250,245,0.4)",
            }}
          >
            + and also
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            {chips.map((c) => (
              <span
                key={c.label}
                data-testid={`features-chip-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  color: "rgba(250,250,245,0.75)",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,230,66,0.3)";
                  e.currentTarget.style.background = "rgba(245,230,66,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <span style={{ fontSize: 13 }}>{c.icon}</span>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
