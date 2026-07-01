import { Link } from "wouter";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { usePageMeta } from "@/hooks/use-page-meta";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        padding: 28,
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
      }}
    >
      <h2 className="s-heading" style={{ fontSize: 24, color: "var(--s-white)", marginBottom: 16, letterSpacing: 1 }}>
        {title}
      </h2>
      <div className="s-body" style={{ color: "rgba(250,250,245,0.7)", lineHeight: 1.7, fontSize: 15 }}>
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  usePageMeta({
    title: "About Sellisy — The 0% Fee Digital Storefront",
    description:
      "Sellisy is a digital-product storefront that lets creators keep 100% of their sales. Learn what we build, why flat pricing beats per-sale fees, and how to reach us.",
    canonicalUrl: "https://sellisy.com/about",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About Sellisy",
      url: "https://sellisy.com/about",
      mainEntity: {
        "@type": "Organization",
        name: "Sellisy",
        url: "https://sellisy.com",
        logo: { "@type": "ImageObject", url: "https://sellisy.com/favicon.png", width: 512, height: 512 },
        description:
          "Sellisy is a digital-product storefront platform that lets creators sell ebooks, templates, courses, and memberships while keeping 100% of every sale on their own Stripe or PayPal.",
        email: "hello@sellisy.com",
        sameAs: [
          "https://www.instagram.com/trysellisy",
          "https://twitter.com/trysellisy",
          "https://www.tiktok.com/@trysellisy",
        ],
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden" data-testid="about-page">
      <div className="s-ambient-orb top-[5%] left-[10%] w-[500px] h-[500px] bg-[hsl(53_91%_61%/0.04)] blur-[140px] pointer-events-none" />
      <div className="s-ambient-orb bottom-[10%] right-[15%] w-[400px] h-[400px] bg-[hsl(168_100%_48%/0.03)] blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 s-hero-grid opacity-20 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div style={{ marginBottom: 56 }}>
            <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16, fontSize: 11, letterSpacing: 2 }}>
              // ABOUT
            </p>
            <h1 className="s-heading" style={{ fontSize: "clamp(48px, 8vw, 88px)", color: "var(--s-white)", marginBottom: 20, lineHeight: 1 }}>
              GROW YOUR <span style={{ color: "var(--s-yellow)" }}>GDP</span>
            </h1>
            <p style={{ color: "rgba(250,250,245,0.5)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>
              Your income is your personal GDP — and it&rsquo;s yours to grow. Sellisy is the storefront built so you keep your money, your customers, and your independence.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Section title="WHAT SELLISY IS">
              <p>
                Sellisy is a platform for selling digital products — ebooks, templates, presets, courses, memberships, and
                more. You get a branded storefront, automatic and secure file delivery, and a checkout that runs on{" "}
                <strong style={{ color: "var(--s-white)" }}>your own Stripe and PayPal</strong>, so money lands directly in
                your account and the customer relationship stays yours.
              </p>
            </Section>

            <Section title="WHY WE BUILT IT">
              <p>
                Most platforms take a percentage of every sale. At scale that quietly becomes a creator's single biggest
                cost — a 10% cut on $10,000/mo is $1,000 every month, forever, for the same hosting.
              </p>
              <p style={{ marginTop: 12 }}>
                We think that's backwards. Sellisy charges a flat monthly fee and takes{" "}
                <strong style={{ color: "var(--s-yellow)" }}>0% per sale</strong>. The more you grow, the more you keep —
                not the other way around. We wrote about the full math in{" "}
                <Link href="/blog/how-to-keep-100-percent-of-your-sales" style={{ color: "var(--s-yellow)" }}>
                  how to keep 100% of your sales
                </Link>
                .
              </p>
            </Section>

            <Section title="WHAT YOU CAN DO">
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8 }}>
                <li>Launch a branded storefront in minutes — no code</li>
                <li>Sell one-time products, bundles, subscriptions, courses, and pay-what-you-want</li>
                <li>Deliver files securely with expiring links and license keys</li>
                <li>Connect your own Stripe and PayPal and keep 100% of every sale</li>
                <li>Run an affiliate program, coupons, cart recovery, and email marketing</li>
                <li>Start fast from a built-in library of done-for-you products</li>
              </ul>
            </Section>

            <Section title="WHO IT'S FOR">
              <p>
                Independent creators, indie makers, educators, designers, and anyone who wants to treat digital products
                like a real business they own — without giving a platform a cut of every sale. If you're comparing
                options, see how Sellisy stacks up against{" "}
                <Link href="/vs/gumroad" style={{ color: "var(--s-yellow)" }}>Gumroad</Link>,{" "}
                <Link href="/vs/payhip" style={{ color: "var(--s-yellow)" }}>Payhip</Link>, and{" "}
                <Link href="/vs/lemon-squeezy" style={{ color: "var(--s-yellow)" }}>Lemon Squeezy</Link>.
              </p>
            </Section>

            <Section title="CONTACT">
              <p>
                Questions, press, or partnership ideas? Email{" "}
                <a href="mailto:hello@sellisy.com" style={{ color: "var(--s-yellow)" }}>hello@sellisy.com</a> or find us on{" "}
                <a href="https://twitter.com/trysellisy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--s-yellow)" }}>X</a>,{" "}
                <a href="https://www.instagram.com/trysellisy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--s-yellow)" }}>Instagram</a>, and{" "}
                <a href="https://www.tiktok.com/@trysellisy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--s-yellow)" }}>TikTok</a>.
              </p>
            </Section>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link
                href="/"
                className="s-label"
                style={{ display: "inline-block", padding: "14px 28px", background: "var(--s-yellow)", color: "#050505", borderRadius: 999, fontSize: 13, letterSpacing: 1, fontWeight: 600 }}
                data-testid="about-cta"
              >
                START SELLING ON SELLISY
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
