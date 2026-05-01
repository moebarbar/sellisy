import { Link } from "wouter";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

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
      <h2
        className="s-heading"
        style={{ fontSize: 24, color: "var(--s-white)", marginBottom: 16, letterSpacing: 1 }}
      >
        {title}
      </h2>
      <div className="s-body" style={{ color: "rgba(250,250,245,0.7)", lineHeight: 1.7, fontSize: 15 }}>
        {children}
      </div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      <div className="s-ambient-orb top-[5%] right-[10%] w-[500px] h-[500px] bg-[hsl(168_100%_48%/0.04)] blur-[140px] pointer-events-none" />
      <div className="s-ambient-orb bottom-[10%] left-[15%] w-[400px] h-[400px] bg-[hsl(53_91%_61%/0.03)] blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 s-hero-grid opacity-20 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div style={{ marginBottom: 56 }}>
            <p className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16, fontSize: 11, letterSpacing: 2 }}>
              // LEGAL
            </p>
            <h1
              className="s-heading"
              style={{ fontSize: "clamp(48px, 8vw, 88px)", color: "var(--s-white)", marginBottom: 20, lineHeight: 1 }}
            >
              TERMS OF <span style={{ color: "var(--s-yellow)" }}>SERVICE</span>
            </h1>
            <p style={{ color: "rgba(250,250,245,0.5)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>
              The agreement between you and Sellisy when you use our platform.
            </p>
            <p className="s-label" style={{ color: "rgba(250,250,245,0.3)", fontSize: 11, marginTop: 12, letterSpacing: 1 }}>
              Last updated: April 30, 2026
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Section title="01 / ACCEPTANCE">
              <p>
                By creating an account or using sellisy.com (the "Service"), you agree to these Terms of Service (the
                "Terms"). If you don't agree, don't use the Service. These Terms form a binding agreement between you
                and Sellisy.
              </p>
            </Section>

            <Section title="02 / WHO CAN USE SELLISY">
              <p>
                You must be at least 16 years old. If you're using the Service on behalf of a business or organization,
                you represent that you have authority to bind that entity to these Terms.
              </p>
              <p style={{ marginTop: 12 }}>
                You're responsible for keeping your account credentials secure. Notify us immediately at{" "}
                <a href="mailto:support@sellisy.com" style={{ color: "var(--s-yellow)" }}>support@sellisy.com</a> if you
                suspect unauthorized access.
              </p>
            </Section>

            <Section title="03 / WHAT YOU CAN SELL">
              <p style={{ marginBottom: 12 }}>You may sell digital products you legally own or have rights to distribute. You may NOT sell:</p>
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8 }}>
                <li>Pirated content, stolen IP, or anything that infringes copyright/trademark</li>
                <li>Adult sexual content involving minors, non-consensual content, or anything illegal</li>
                <li>Malware, exploits, hacking tools designed for harm</li>
                <li>Counterfeit goods, fake credentials, or fraudulent schemes</li>
                <li>Anything that violates applicable law in your jurisdiction or the buyer's</li>
              </ul>
              <p style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.03)", borderLeft: "2px solid var(--s-yellow)", borderRadius: 4 }}>
                We reserve the right to remove products and suspend accounts that violate these rules.
              </p>
            </Section>

            <Section title="04 / YOUR CONTENT">
              <p>
                You keep ownership of everything you upload (products, files, branding, copy). You grant Sellisy a
                non-exclusive license to host, process, and display your content as needed to operate the Service.
              </p>
              <p style={{ marginTop: 12 }}>
                You're solely responsible for your content. You warrant that you have all necessary rights and that it
                doesn't violate anyone else's rights or applicable law.
              </p>
            </Section>

            <Section title="05 / FEES & PAYMENTS">
              <p>
                Sellisy charges a flat monthly subscription based on your selected plan (Starter, Growth, Empire). All
                fees are billed in advance and are non-refundable except where required by law.
              </p>
              <p style={{ marginTop: 12 }}>
                Payments to creators (from product sales) are routed through Stripe or PayPal &mdash; their terms apply
                in addition to these. Sellisy does not hold buyer funds; all transactions go directly from buyer to
                creator.
              </p>
              <p style={{ marginTop: 12 }}>
                <strong style={{ color: "var(--s-white)" }}>Sellisy keeps 0% of your sales</strong> &mdash; your
                subscription is the only thing you pay us.
              </p>
            </Section>

            <Section title="06 / REFUNDS BETWEEN CREATORS AND BUYERS">
              <p>
                Refund policies for individual products are set by each creator. Sellisy does not mediate refund
                disputes between creators and buyers. Buyers may dispute charges directly with their payment provider
                (Stripe, PayPal) according to that provider's rules.
              </p>
            </Section>

            <Section title="07 / SERVICE AVAILABILITY">
              <p>
                We aim for high uptime but make no guarantee. The Service is provided "as is" without warranties.
                Scheduled maintenance will be announced in advance when possible. We're not liable for losses caused by
                downtime, third-party outages (Stripe, PayPal, Clerk, Cloudflare), or force majeure.
              </p>
            </Section>

            <Section title="08 / TERMINATION">
              <p>You can cancel your subscription anytime from your dashboard. Sellisy may terminate or suspend accounts that:</p>
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <li>Violate these Terms or applicable law</li>
                <li>Engage in fraud, chargebacks, or abuse</li>
                <li>Fail to pay subscription fees</li>
                <li>Pose a security or reputational risk to the platform</li>
              </ul>
              <p style={{ marginTop: 12 }}>
                Upon termination, you can export your data within 30 days. After that, deletion follows our{" "}
                <Link href="/data-deletion" style={{ color: "var(--s-yellow)", textDecoration: "underline" }}>
                  data deletion policy
                </Link>.
              </p>
            </Section>

            <Section title="09 / INTELLECTUAL PROPERTY">
              <p>
                The Sellisy name, logo, platform code, and design are owned by Sellisy. You may not copy, scrape,
                reverse-engineer, or create derivative works of the Service. Storefront templates we provide may be
                used freely within the Service.
              </p>
            </Section>

            <Section title="10 / LIMITATION OF LIABILITY">
              <p>
                To the maximum extent permitted by law, Sellisy's total liability under these Terms is limited to the
                amount you paid us in the 12 months before the event giving rise to liability. We are not liable for
                indirect, incidental, special, or consequential damages, including lost profits or data.
              </p>
            </Section>

            <Section title="11 / CHANGES TO THESE TERMS">
              <p>
                We may update these Terms occasionally. Material changes will be announced via email at least 30 days
                before they take effect. Continued use of the Service after changes means you accept the new Terms.
              </p>
            </Section>

            <Section title="12 / GOVERNING LAW">
              <p>
                These Terms are governed by the laws of the jurisdiction where Sellisy is incorporated, without regard
                to conflict-of-law provisions. Disputes will be resolved in the courts of that jurisdiction unless
                local consumer law requires otherwise.
              </p>
            </Section>

            <Section title="13 / CONTACT">
              <p>
                Questions about these Terms:{" "}
                <a href="mailto:legal@sellisy.com" style={{ color: "var(--s-yellow)" }}>legal@sellisy.com</a>
              </p>
            </Section>
          </div>

          <div
            style={{
              marginTop: 48,
              padding: 24,
              borderRadius: 16,
              background: "rgba(53,91,61,0.06)",
              border: "1px solid rgba(245,209,66,0.15)",
              textAlign: "center",
            }}
          >
            <p className="s-body" style={{ color: "rgba(250,250,245,0.7)", marginBottom: 16, fontSize: 14 }}>
              See also our{" "}
              <Link href="/privacy" style={{ color: "var(--s-yellow)", textDecoration: "underline" }}>
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/data-deletion" style={{ color: "var(--s-yellow)", textDecoration: "underline" }}>
                Data Deletion
              </Link>{" "}
              policies.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
