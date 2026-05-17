import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "wouter";
import { Check, X, ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { FinalCTA } from "@/components/landing/final-cta";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  COMPETITORS,
  getCompetitor,
  type Competitor,
  type CompetitorRow,
} from "@/data/competitors";

function WinnerCell({
  text,
  side,
  winner,
}: {
  text: string;
  side: "sellisy" | "competitor";
  winner: CompetitorRow["winner"];
}) {
  const isWinner = winner === side;
  const isLoser = winner !== "tie" && winner !== "neutral" && winner !== side;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "16px 18px",
        background: isWinner
          ? side === "sellisy"
            ? "rgba(245,230,66,0.07)"
            : "rgba(255,255,255,0.03)"
          : "transparent",
        borderRadius: 8,
        height: "100%",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 18,
          height: 18,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: isWinner
            ? side === "sellisy"
              ? "var(--s-yellow)"
              : "rgba(255,255,255,0.18)"
            : isLoser
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.08)",
        }}
      >
        {isWinner ? (
          <Check size={11} strokeWidth={3} color={side === "sellisy" ? "var(--s-black)" : "var(--s-white)"} />
        ) : isLoser ? (
          <X size={11} strokeWidth={3} color="rgba(250,250,245,0.4)" />
        ) : (
          <span style={{ width: 4, height: 4, borderRadius: 999, background: "rgba(250,250,245,0.4)" }} />
        )}
      </span>
      <span
        className="s-body"
        style={{
          fontSize: 14,
          color: isLoser ? "rgba(250,250,245,0.45)" : "var(--s-white)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function ComparisonRow({ row, index }: { row: CompetitorRow; index: number }) {
  return (
    <div
      data-testid={`vs-row-${index}`}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(140px, 1fr) minmax(180px, 1.4fr) minmax(180px, 1.4fr)",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        alignItems: "stretch",
      }}
    >
      <div
        className="s-label"
        style={{
          color: "rgba(250,250,245,0.55)",
          padding: "16px 0",
          alignSelf: "center",
          fontSize: 12,
        }}
      >
        {row.label}
      </div>
      <WinnerCell text={row.sellisy} side="sellisy" winner={row.winner} />
      <WinnerCell text={row.competitor} side="competitor" winner={row.winner} />
    </div>
  );
}

function NotFoundVersus() {
  return (
    <div className="landing-page" style={{ minHeight: "100vh" }}>
      <Navbar />
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "200px 24px 80px",
          textAlign: "center",
        }}
      >
        <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
          // 404 — comparison not found
        </p>
        <h1 className="s-heading" style={{ fontSize: "clamp(40px, 8vw, 72px)", color: "var(--s-white)", marginBottom: 16 }}>
          NO COMPARISON HERE
        </h1>
        <p className="s-body" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 32 }}>
          We haven't written this comparison yet. Browse the alternatives we do compare against:
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {COMPETITORS.map((c) => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              className="s-label"
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--s-white)",
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              vs {c.name}
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ScoreBar({ competitor }: { competitor: Competitor }) {
  const tally = useMemo(() => {
    let s = 0, c = 0, t = 0;
    for (const r of competitor.rows) {
      if (r.winner === "sellisy") s++;
      else if (r.winner === "competitor") c++;
      else if (r.winner === "tie") t++;
    }
    return { s, c, t, total: competitor.rows.length };
  }, [competitor]);

  return (
    <div
      data-testid="vs-scorebar"
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 24,
      }}
    >
      <div
        className="s-chip"
        style={{ background: "rgba(245,230,66,0.1)", borderColor: "rgba(245,230,66,0.4)", color: "var(--s-yellow)" }}
      >
        Sellisy wins {tally.s} categories
      </div>
      <div className="s-chip" style={{ background: "rgba(255,255,255,0.04)" }}>
        Tied on {tally.t}
      </div>
      <div className="s-chip" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(250,250,245,0.7)" }}>
        {competitor.name} wins {tally.c}
      </div>
    </div>
  );
}

function VersusPageInner({ competitor }: { competitor: Competitor }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("s-revealed");
        });
      },
      { threshold: 0.12 }
    );
    const els = wrapperRef.current.querySelectorAll(".s-reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  usePageMeta({
    title: `Sellisy vs ${competitor.name} — ${competitor.tagline} | Sellisy`,
    description: `${competitor.oneLineVerdict} Compare Sellisy and ${competitor.name} side-by-side: pricing, fees, features, and which fits your business.`,
    canonicalUrl: `https://sellisy.com/vs/${competitor.slug}`,
    ogTitle: `Sellisy vs ${competitor.name}`,
    ogDescription: competitor.tagline,
    ogType: "website",
    ogUrl: `https://sellisy.com/vs/${competitor.slug}`,
    ogSiteName: "Sellisy",
    keywords: `sellisy vs ${competitor.name.toLowerCase()}, ${competitor.name.toLowerCase()} alternative, ${competitor.name.toLowerCase()} comparison, digital product platform, sell digital products`,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `https://sellisy.com/vs/${competitor.slug}#webpage`,
          name: `Sellisy vs ${competitor.name}`,
          url: `https://sellisy.com/vs/${competitor.slug}`,
          description: competitor.tagline,
          isPartOf: { "@id": "https://sellisy.com/#website" },
        },
        {
          "@type": "FAQPage",
          mainEntity: competitor.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://sellisy.com/" },
            { "@type": "ListItem", position: 2, name: "Compare", item: "https://sellisy.com/vs" },
            { "@type": "ListItem", position: 3, name: competitor.name, item: `https://sellisy.com/vs/${competitor.slug}` },
          ],
        },
      ],
    },
  });

  return (
    <div ref={wrapperRef} className="landing-page" data-testid={`vs-page-${competitor.slug}`}>
      <div className="s-ambient-wrap" aria-hidden="true">
        <div className="s-ambient-orb s-ambient-orb--yellow" />
        <div className="s-ambient-orb s-ambient-orb--teal" />
        <div className="s-ambient-orb s-ambient-orb--pink" />
      </div>
      <Navbar />

      {/* HERO */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "140px 24px 64px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Link
          href="/"
          className="s-label"
          style={{
            color: "rgba(250,250,245,0.5)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 28,
          }}
          data-testid="vs-breadcrumb-home"
        >
          <ArrowLeft size={14} />
          Back to Sellisy
        </Link>

        <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 20 }}>
          // Compare
        </p>

        <h1
          className="s-heading"
          data-testid="vs-headline"
          style={{ fontSize: "clamp(40px, 9vw, 96px)", lineHeight: 0.95, marginBottom: 28 }}
        >
          <span style={{ color: "var(--s-white)" }}>SELLISY</span>
          <span style={{ color: "rgba(250,250,245,0.4)", fontSize: "0.6em", margin: "0 0.25em" }}>vs</span>
          <span style={{ color: competitor.accent }}>{competitor.name.toUpperCase()}</span>
        </h1>

        <p
          className="s-body"
          data-testid="vs-tagline"
          style={{
            fontSize: 18,
            color: "rgba(250,250,245,0.7)",
            maxWidth: 720,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          {competitor.tagline}.
        </p>

        <ScoreBar competitor={competitor} />

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/auth"
            data-testid="vs-cta-primary"
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              background: "var(--s-yellow)",
              color: "var(--s-black)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Try Sellisy — $19/mo
            <ArrowRight size={14} />
          </a>
          <Link
            href="/#pricing"
            className="s-label"
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              background: "transparent",
              border: "1.5px solid rgba(250,250,245,0.18)",
              color: "var(--s-white)",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            See Pricing
          </Link>
        </div>
      </section>

      {/* INTRO */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "40px 24px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          className="s-body"
          data-testid="vs-intro"
          style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(250,250,245,0.75)", textAlign: "center" }}
        >
          {competitor.intro}
        </p>
      </section>

      {/* VERDICT BOX */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          data-testid="vs-verdict"
          style={{
            background: "linear-gradient(135deg, rgba(245,230,66,0.08), rgba(255,107,53,0.04))",
            border: "1px solid rgba(245,230,66,0.2)",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 14 }}>
            // The Verdict
          </p>
          <p
            className="s-body"
            style={{ fontSize: 19, color: "var(--s-white)", lineHeight: 1.5, fontWeight: 500 }}
          >
            {competitor.oneLineVerdict}
          </p>
        </div>
      </section>

      {/* PRICING SNAPSHOT */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
            // Pricing at a glance
          </p>
          <h2 className="s-heading" style={{ fontSize: "clamp(32px, 5vw, 56px)", color: "var(--s-white)" }}>
            WHAT IT COSTS
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <div
            data-testid="vs-pricing-sellisy"
            style={{
              background: "rgba(245,230,66,0.06)",
              border: "1px solid rgba(245,230,66,0.25)",
              borderRadius: 14,
              padding: 28,
            }}
          >
            <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 10 }}>
              Sellisy
            </p>
            <p className="s-body" style={{ color: "var(--s-white)", fontSize: 16, lineHeight: 1.6 }}>
              {competitor.pricingSellisy}
            </p>
          </div>
          <div
            data-testid="vs-pricing-competitor"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 28,
            }}
          >
            <p className="s-label" style={{ color: competitor.accent, marginBottom: 10 }}>
              {competitor.name}
            </p>
            <p className="s-body" style={{ color: "rgba(250,250,245,0.85)", fontSize: 16, lineHeight: 1.6 }}>
              {competitor.pricingCompetitor}
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE MATRIX */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
            // Feature by feature
          </p>
          <h2 className="s-heading" style={{ fontSize: "clamp(32px, 5vw, 56px)", color: "var(--s-white)" }}>
            HEAD-TO-HEAD
          </h2>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1fr) minmax(180px, 1.4fr) minmax(180px, 1.4fr)",
              gap: 8,
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 4,
            }}
          >
            <div className="s-label" style={{ color: "rgba(250,250,245,0.4)", paddingLeft: 4 }}>
              Feature
            </div>
            <div
              className="s-label"
              style={{
                color: "var(--s-yellow)",
                padding: "4px 14px",
                background: "rgba(245,230,66,0.07)",
                borderRadius: 6,
              }}
            >
              Sellisy
            </div>
            <div
              className="s-label"
              style={{
                color: competitor.accent,
                padding: "4px 14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 6,
              }}
            >
              {competitor.name}
            </div>
          </div>

          {competitor.rows.map((row, i) => (
            <ComparisonRow row={row} index={i} key={`${row.label}-${i}`} />
          ))}
        </div>
      </section>

      {/* WHY SELLISY WINS / WHEN THEY WIN */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        <div
          data-testid="vs-why-sellisy"
          style={{
            background: "rgba(245,230,66,0.05)",
            border: "1px solid rgba(245,230,66,0.18)",
            borderRadius: 16,
            padding: 32,
          }}
        >
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
            // Why Sellisy wins for most creators
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {competitor.whySellisyWins.map((point, i) => (
              <li
                key={i}
                className="s-body"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 15,
                  color: "var(--s-white)",
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "var(--s-yellow)", flexShrink: 0, marginTop: 4, fontSize: 14 }}>✦</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-testid="vs-when-they-win"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 32,
          }}
        >
          <p className="s-label" style={{ color: "rgba(250,250,245,0.6)", marginBottom: 16 }}>
            // When {competitor.name} is the right call
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {competitor.whenTheyWin.map((point, i) => (
              <li
                key={i}
                className="s-body"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 15,
                  color: "rgba(250,250,245,0.85)",
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: competitor.accent, flexShrink: 0, marginTop: 4, fontSize: 14 }}>○</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "48px 24px 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16 }}>
            // Common questions
          </p>
          <h2 className="s-heading" style={{ fontSize: "clamp(32px, 5vw, 56px)", color: "var(--s-white)" }}>
            FAQ
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {competitor.faqs.map((faq, i) => (
            <details
              key={i}
              data-testid={`vs-faq-${i}`}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "18px 22px",
              }}
            >
              <summary
                className="s-body"
                style={{
                  fontSize: 15,
                  color: "var(--s-white)",
                  fontWeight: 500,
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {faq.q}
                <span style={{ color: "var(--s-yellow)", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>+</span>
              </summary>
              <p
                className="s-body"
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  color: "rgba(250,250,245,0.7)",
                  lineHeight: 1.7,
                }}
              >
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* OTHER COMPARISONS */}
      <section
        className="s-reveal"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 48px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 14 }}>
            // Other comparisons
          </p>
          <h2 className="s-heading" style={{ fontSize: "clamp(28px, 4vw, 44px)", color: "var(--s-white)" }}>
            COMPARING TO SOMETHING ELSE?
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {COMPETITORS.filter((c) => c.slug !== competitor.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              data-testid={`vs-related-${c.slug}`}
              className="s-label"
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "var(--s-white)",
                textDecoration: "none",
                fontSize: 11,
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.accent;
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              Sellisy vs {c.name}
            </Link>
          ))}
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </div>
  );
}

export default function VersusPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug || "";
  const competitor = getCompetitor(slug);

  if (!competitor) return <NotFoundVersus />;
  return <VersusPageInner competitor={competitor} />;
}
