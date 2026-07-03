// "Everything you need to increase your GDP" — the platform's full feature set
// reframed as four OUTCOME pillars (not a flat feature dump). Each pillar leads
// with the income outcome, says who it's for, then lists the concrete
// capabilities that deliver it. Reads as a value story, top to bottom.
//
// Every chip is a real capability that ships today. Update this file whenever a
// roadmap item goes live so it stays honest.

type Chip = { icon: string; label: string; isNew?: boolean };

type Category = {
  eyebrow: string;
  title: string;
  description: string;
  forWho: string; // who this outcome targets
  accent: string; // CSS color (landing palette var)
  accentRgb: string; // matching rgb for translucent backgrounds
  image: string; // the crew scene that depicts this outcome
  imageAlt: string;
  imageCaption: string; // ties the art to the feature
  chips: Chip[];
};

const categories: Category[] = [
  {
    eyebrow: "// 01 — Start earning",
    title: "Start today, even with nothing to sell",
    description:
      "No product? No audience? No problem. Go from a blank page to a stocked, branded store in an afternoon — then make your first sale while competitors are still picking a theme.",
    forWho: "For first-timers & side-hustlers",
    accent: "var(--s-yellow)",
    accentRgb: "245,230,66",
    image: "/dna/crew-storefront.jpg",
    imageAlt: "A Sellisy character branding their storefront in a neon dressing room under the SELLISY sign",
    imageCaption: "Brand your storefront",
    chips: [
      { icon: "🤖", label: "AI Store Launcher — one sentence to a live, stocked store" },
      { icon: "📦", label: "200+ done-for-you PLR & MRR products to rebrand and resell" },
      { icon: "🎨", label: "9 designer themes incl. Sublevel + Bio — the Sellisy look" },
      { icon: "📥", label: "1-click Gumroad importer — products, customers, sales" },
      { icon: "🎁", label: "14-day free Growth trial — no card required" },
    ],
  },
  {
    eyebrow: "// 02 — Sell more",
    title: "Sell anything, priced any way you want",
    description:
      "Package what you know however your buyers want to pay — one-time, bundled, subscription, or name-your-price. Delivery is tamper-proof out of the box, so every sale is protected.",
    forWho: "For creators, educators & sellers",
    accent: "var(--s-teal)",
    accentRgb: "0,245,212",
    image: "/dna/crew-delivery.jpg",
    imageAlt: "The Sellisy crew moving product boxes down a neon conveyor belt in the Sublevel",
    imageCaption: "Sell & deliver anything",
    chips: [
      { icon: "🗂️", label: "Digital products: PDF, ebook, software, templates, graphics" },
      { icon: "🎓", label: "Full course LMS — modules, drip, quizzes, certificates, discussions" },
      { icon: "🔁", label: "Memberships & subscriptions — recurring on your own Stripe" },
      { icon: "🎁", label: "Bundles with automatic savings math at the cart" },
      { icon: "💸", label: "Pay-what-you-want pricing", isNew: true },
      { icon: "🎟️", label: "Coupons, % / $ discounts, and free lead magnets" },
      { icon: "🔒", label: "Secure delivery — license keys + per-buyer PDF watermarking" },
    ],
  },
  {
    eyebrow: "// 03 — Keep 100%",
    title: "The money and the audience stay yours",
    description:
      "Your own Stripe and PayPal, 0% per-sale fees, your customer list, your domain. Every dollar lands in your account and every buyer is your relationship — not the platform's.",
    forWho: "For anyone scaling past hobby income",
    accent: "var(--s-orange)",
    accentRgb: "255,107,53",
    image: "/dna/crew-earnings.jpg",
    imageAlt: "A Sellisy character scooping glowing coins pouring out of an arcade claw machine",
    imageCaption: "Every coin is yours",
    chips: [
      { icon: "💳", label: "Your own Stripe + PayPal — 0% per-sale fees, ever" },
      { icon: "🧾", label: "Automatic Stripe Tax — VAT / sales tax handled" },
      { icon: "🌍", label: "Custom domains with SSL handled for you" },
      { icon: "🏪", label: "Unlimited branded storefronts from one login" },
      { icon: "👤", label: "Branded customer portal with magic-link login" },
      { icon: "⭐", label: "Verified buyer reviews to build trust" },
      { icon: "📱", label: "Embed widgets — sell from any site you already have" },
    ],
  },
  {
    eyebrow: "// 04 — Grow on autopilot",
    title: "Marketing that runs while you sleep",
    description:
      "Recover lost carts, follow up automatically, recruit affiliates, and get discovered — with an AI advisor telling you the single next move that will grow your income.",
    forWho: "For sellers who want compounding growth",
    accent: "var(--s-pink)",
    accentRgb: "255,60,172",
    image: "/dna/crew-launch-hero.jpg",
    imageAlt: "The Sellisy crew firing a creator's product boxes into the night sky from a rooftop cannon",
    imageCaption: "Grow while you sleep",
    chips: [
      { icon: "🧠", label: "Sellisy Brain — a weekly AI growth plan, on demand" },
      { icon: "🛒", label: "Abandoned-cart recovery emails, automatic" },
      { icon: "✉️", label: "Lifecycle automation + newsletter campaigns" },
      { icon: "🔗", label: "Affiliate program — links, commissions, payouts, clawback" },
      { icon: "🌐", label: "Marketplace discovery on /discover", isNew: true },
      { icon: "📝", label: "Content Creator, built-in blog & marketing playbook" },
      { icon: "📊", label: "Real-time analytics — revenue, traffic, top products" },
    ],
  },
];

function CategoryBlock({ category, index }: { category: Category; index: number }) {
  const isAlternate = index % 2 === 1;

  return (
    <div
      data-testid={`feature-category-${index}`}
      className={`s-reveal feature-block${isAlternate ? " alt" : ""}`}
      style={{
        position: "relative",
        padding: "clamp(24px, 3vw, 40px)",
        borderRadius: 20,
        background: `linear-gradient(${isAlternate ? "135deg" : "315deg"}, rgba(${category.accentRgb},0.05) 0%, rgba(255,255,255,0.02) 60%)`,
        border: `1px solid rgba(${category.accentRgb},0.14)`,
      }}
    >
      {/* The crew scene that depicts this outcome — the feature, illustrated. */}
      <figure
        className="feature-media"
        style={{
          margin: 0,
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid rgba(${category.accentRgb},0.32)`,
          boxShadow: `0 0 50px rgba(${category.accentRgb},0.14)`,
        }}
      >
        <img
          src={category.image}
          alt={category.imageAlt}
          loading="lazy"
          decoding="async"
          data-testid={`feature-image-${index}`}
          style={{ width: "100%", display: "block", aspectRatio: "4 / 3", objectFit: "cover" }}
        />
        {/* halftone comic texture */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1.4px)", backgroundSize: "4px 4px", mixBlendMode: "multiply", opacity: 0.2, pointerEvents: "none" }} />
        {/* caption chip — names what the scene shows */}
        <figcaption
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(5,5,5,0.74)",
            border: `1px solid rgba(${category.accentRgb},0.45)`,
            backdropFilter: "blur(6px)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: 0.5,
            color: "var(--s-white)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: category.accent, boxShadow: `0 0 8px ${category.accent}` }} />
          {category.imageCaption}
        </figcaption>
      </figure>

      <div className="feature-content">
      <div style={{ marginBottom: 24 }}>
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
            marginBottom: 14,
          }}
        >
          {category.description}
        </p>
        {/* Who this outcome is for — targeting tag */}
        <span
          data-testid={`feature-forwho-${index}`}
          style={{
            display: "inline-block",
            padding: "5px 12px",
            borderRadius: 999,
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: 0.5,
            color: category.accent,
            background: `rgba(${category.accentRgb},0.08)`,
            border: `1px solid rgba(${category.accentRgb},0.25)`,
          }}
        >
          {category.forWho}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
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
            // The bigger picture
          </span>
          <h2
            className="s-heading"
            data-testid="title-features"
            style={{ fontSize: "clamp(36px, 6vw, 64px)", color: "var(--s-white)" }}
          >
            EVERYTHING YOU NEED TO
            <br />
            <span style={{ color: "var(--s-yellow)" }}>INCREASE YOUR GDP.</span>
          </h2>
          <p
            className="s-body"
            style={{
              fontSize: 15,
              color: "rgba(250,250,245,0.6)",
              maxWidth: 640,
              margin: "20px auto 0",
              lineHeight: 1.7,
            }}
          >
            One platform, one goal: growing what you earn. Follow it end to end —
            start with nothing, sell any way you want, keep 100%, and grow on
            autopilot. Every capability below ships today — no waitlists, no
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
