// "Everything you need" — reorganized into five capability categories
// instead of a flat features grid. Each category gets its own accent color
// (drawn from the landing palette: yellow, teal, pink, orange, cream) so
// the scroll feels rhythmic rather than uniform.
//
// Total: 30 features across five categories. Every category is a real
// capability that ships today. Update this file whenever a roadmap item
// goes live so it stays honest.

type Chip = { icon: string; label: string; isNew?: boolean };

type Category = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string; // CSS color (landing palette var)
  accentRgb: string; // matching rgb for translucent backgrounds
  chips: Chip[];
};

const categories: Category[] = [
  {
    eyebrow: "// Sell anything",
    title: "Sell digital, however you want",
    description:
      "Pricing models that fit any audience — flat, free, bundled, pay-what-you-want. Delivery that's tamper-proof out of the box.",
    accent: "var(--s-yellow)",
    accentRgb: "245,230,66",
    chips: [
      { icon: "📦", label: "Digital products: PDF, ebook, software, template, graphics" },
      { icon: "🎁", label: "Bundles with savings math at the cart" },
      { icon: "💸", label: "Pay-what-you-want pricing", isNew: true },
      { icon: "🎟️", label: "Coupons + percentage / dollar discounts" },
      { icon: "🆓", label: "Lead magnets (free with email capture)" },
      { icon: "📜", label: "Per-buyer PDF watermarking" },
    ],
  },
  {
    eyebrow: "// Run a course business",
    title: "A full LMS, not just a video player",
    description:
      "Everything you'd otherwise stitch together from Podia, Teachable, or Kajabi — already inside every Sellisy course product.",
    accent: "var(--s-teal)",
    accentRgb: "0,245,212",
    chips: [
      { icon: "📚", label: "Modules + lessons with reorderable hierarchy" },
      { icon: "🎬", label: "YouTube / Vimeo / direct upload video" },
      { icon: "🗓️", label: "Drip schedules — unlock lessons over time" },
      { icon: "🧠", label: "Quizzes (single + multi choice, auto-scored)" },
      { icon: "🏆", label: "Auto-issued PDF certificates with your branding" },
      { icon: "💬", label: "Per-lesson discussions + owner moderation" },
    ],
  },
  {
    eyebrow: "// Grow with creators",
    title: "Recruit affiliates, get discovered, follow up",
    description:
      "The growth-loop infrastructure most platforms charge you extra for — affiliates, marketplace listing, newsletter, automation.",
    accent: "var(--s-pink)",
    accentRgb: "255,60,172",
    chips: [
      { icon: "🔗", label: "Affiliate program — links, commissions, payouts, refund clawback" },
      { icon: "🌐", label: "Marketplace listing on /discover", isNew: true },
      { icon: "✉️", label: "Newsletter campaigns with block editor" },
      { icon: "📖", label: "Built-in blog (block editor + SEO meta)" },
      { icon: "🧭", label: "Marketing playbook with strategy tracking" },
      { icon: "📊", label: "Real-time analytics: revenue, traffic, top products" },
    ],
  },
  {
    eyebrow: "// Own your brand",
    title: "Multi-store, multi-theme, custom domains",
    description:
      "Your store isn't a Gumroad URL. It's your name, your design, your customer relationship — and you can run as many as you want.",
    accent: "var(--s-orange)",
    accentRgb: "255,107,53",
    chips: [
      { icon: "🏪", label: "Unlimited storefronts (Empire) — one login, separate brands" },
      { icon: "🎨", label: "7 designer-built themes — Neon, Silk, Aurora, Ember, Frost, Midnight, Launch" },
      { icon: "🌍", label: "Custom domains (Cloudflare for SaaS — SSL handled)" },
      { icon: "👤", label: "Branded customer portal with magic-link login" },
      { icon: "⭐", label: "Verified buyer reviews with per-product opt-out" },
      { icon: "📱", label: "Embed widgets — drop a product anywhere" },
    ],
  },
  {
    eyebrow: "// Operate without 5 SaaS tools",
    title: "Payments, taxes, knowledge — already wired",
    description:
      "Connect your own Stripe and PayPal. Keep 100% of every sale. Skip the Notion / Mailchimp / SendOwl stack — it's in here.",
    accent: "var(--s-cream)",
    accentRgb: "240,230,211",
    chips: [
      { icon: "💳", label: "Stripe + PayPal — direct, you keep 100%" },
      { icon: "🧾", label: "Stripe Tax — automatic VAT / sales tax" },
      { icon: "📥", label: "Gumroad 1-click importer (products, customers, sales)" },
      { icon: "📚", label: "Knowledge base with Notion-style editor" },
      { icon: "💻", label: "Software / license key delivery built-in" },
      { icon: "🎁", label: "14-day free Growth-tier trial — no card" },
    ],
  },
];

function CategoryBlock({ category, index }: { category: Category; index: number }) {
  const isAlternate = index % 2 === 1;

  return (
    <div
      data-testid={`feature-category-${index}`}
      className="s-reveal"
      style={{
        position: "relative",
        padding: "48px 32px",
        borderRadius: 20,
        background: `linear-gradient(${isAlternate ? "135deg" : "315deg"}, rgba(${category.accentRgb},0.04) 0%, rgba(255,255,255,0.02) 60%)`,
        border: `1px solid rgba(${category.accentRgb},0.12)`,
        overflow: "hidden",
      }}
    >
      {/* Accent dot in corner — quiet visual hook */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: category.accent,
          boxShadow: `0 0 16px ${category.accent}`,
        }}
      />

      <div style={{ marginBottom: 32, maxWidth: 720 }}>
        <span
          className="s-label"
          style={{
            color: category.accent,
            marginBottom: 12,
            display: "block",
          }}
        >
          {category.eyebrow}
        </span>
        <h3
          className="s-heading"
          style={{
            fontSize: "clamp(24px, 3.4vw, 36px)",
            color: "var(--s-white)",
            marginBottom: 12,
            lineHeight: 1.1,
          }}
        >
          {category.title}
        </h3>
        <p
          className="s-body"
          style={{
            fontSize: 14,
            color: "rgba(250,250,245,0.6)",
            lineHeight: 1.6,
            maxWidth: 620,
          }}
        >
          {category.description}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 10,
        }}
      >
        {category.chips.map((chip) => (
          <div
            key={chip.label}
            className="s-chip-hover"
            data-testid={`feature-chip-${chip.label.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              minHeight: 56,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `rgba(${category.accentRgb},0.1)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {chip.icon}
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "rgba(250,250,245,0.85)",
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              {chip.label}
            </span>
            {chip.isNew && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 9,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--s-yellow)",
                  background: "rgba(245,230,66,0.1)",
                  border: "1px solid rgba(245,230,66,0.25)",
                  flexShrink: 0,
                }}
              >
                New
              </span>
            )}
          </div>
        ))}
      </div>
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
        {/* Section header */}
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
            ONE PLATFORM.
            <br />
            <span style={{ color: "var(--s-yellow)" }}>FIVE JOBS DONE WELL.</span>
          </h2>
          <p
            className="s-body"
            style={{
              fontSize: 15,
              color: "rgba(250,250,245,0.6)",
              maxWidth: 600,
              margin: "20px auto 0",
              lineHeight: 1.7,
            }}
          >
            Sell anything. Run courses. Recruit affiliates. Own your brand.
            Operate without bolting on five other SaaS subscriptions. Each
            block below is a real shipped capability — no waitlists, no
            &ldquo;coming soon.&rdquo;
          </p>
        </div>

        {/* Five categories stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {categories.map((cat, i) => (
            <CategoryBlock key={cat.eyebrow} category={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
