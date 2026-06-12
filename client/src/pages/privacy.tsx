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
        style={{
          fontSize: 24,
          color: "var(--s-white)",
          marginBottom: 16,
          letterSpacing: 1,
        }}
      >
        {title}
      </h2>
      <div className="s-body" style={{ color: "rgba(250,250,245,0.7)", lineHeight: 1.7, fontSize: 15 }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      <div className="s-ambient-orb top-[5%] left-[10%] w-[500px] h-[500px] bg-[hsl(53_91%_61%/0.04)] blur-[140px] pointer-events-none" />
      <div className="s-ambient-orb bottom-[10%] right-[15%] w-[400px] h-[400px] bg-[hsl(168_100%_48%/0.03)] blur-[120px] pointer-events-none" />
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
              PRIVACY <span style={{ color: "var(--s-yellow)" }}>POLICY</span>
            </h1>
            <p style={{ color: "rgba(250,250,245,0.5)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>
              How we collect, use, and protect your data &mdash; in plain English.
            </p>
            <p className="s-label" style={{ color: "rgba(250,250,245,0.3)", fontSize: 11, marginTop: 12, letterSpacing: 1 }}>
              Last updated: April 30, 2026
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Section title="01 / WHO WE ARE">
              <p>
                Sellisy ("we", "us", "our") operates the platform at{" "}
                <strong style={{ color: "var(--s-yellow)" }}>sellisy.com</strong> that lets creators sell digital
                products and lets buyers purchase them.
              </p>
              <p style={{ marginTop: 12 }}>
                Contact:{" "}
                <a href="mailto:privacy@sellisy.com" style={{ color: "var(--s-yellow)" }}>privacy@sellisy.com</a>
              </p>
            </Section>

            <Section title="02 / DATA WE COLLECT">
              <p style={{ marginBottom: 12 }}>We collect only what we need to run the service:</p>
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong style={{ color: "var(--s-white)" }}>Account data</strong> &mdash; email, name, profile image, password (handled by Clerk)</li>
                <li><strong style={{ color: "var(--s-white)" }}>Store data</strong> &mdash; store name, branding, products, prices, uploaded files</li>
                <li><strong style={{ color: "var(--s-white)" }}>Order data</strong> &mdash; buyer email, amount, payment IDs, download tokens</li>
                <li><strong style={{ color: "var(--s-white)" }}>Usage data</strong> &mdash; page views, IP, browser, device type, referrer</li>
                <li><strong style={{ color: "var(--s-white)" }}>Communications</strong> &mdash; transactional and (opt-in) marketing emails</li>
              </ul>
              <p style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.03)", borderLeft: "2px solid var(--s-yellow)", borderRadius: 4 }}>
                Payment card details are <strong style={{ color: "var(--s-yellow)" }}>never</strong> stored on our servers. Stripe and PayPal handle them directly.
              </p>
            </Section>

            <Section title="03 / HOW WE USE IT">
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8 }}>
                <li>To create and operate your account</li>
                <li>To process purchases and deliver digital downloads</li>
                <li>To send transactional emails (receipts, password resets)</li>
                <li>To provide analytics so creators see their store performance</li>
                <li>To prevent fraud and comply with legal obligations</li>
                <li>To improve the product (aggregated, non-identifying data only)</li>
              </ul>
            </Section>

            <Section title="04 / SERVICE PROVIDERS">
              <p style={{ marginBottom: 12 }}>Trusted third parties we use:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                {[
                  { name: "Clerk", purpose: "Authentication" },
                  { name: "Stripe", purpose: "Payments" },
                  { name: "PayPal", purpose: "Payments" },
                  { name: "Cloudflare R2", purpose: "File storage" },
                  { name: "Brevo", purpose: "Email delivery" },
                  { name: "Railway / Neon", purpose: "Hosting & DB" },
                ].map((p) => (
                  <div key={p.name} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "var(--s-white)", fontWeight: 600, fontSize: 13, margin: 0 }}>{p.name}</p>
                    <p className="s-label" style={{ color: "rgba(250,250,245,0.4)", fontSize: 10, letterSpacing: 1, margin: 0, marginTop: 2 }}>{p.purpose}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="05 / YOUR RIGHTS">
              <p style={{ marginBottom: 12 }}>You can:</p>
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong style={{ color: "var(--s-white)" }}>Access</strong> the data we hold about you</li>
                <li><strong style={{ color: "var(--s-white)" }}>Correct</strong> inaccurate data</li>
                <li><strong style={{ color: "var(--s-white)" }}>Delete</strong> your account &mdash; <Link href="/data-deletion" style={{ color: "var(--s-yellow)", textDecoration: "underline" }}>here's how</Link></li>
                <li><strong style={{ color: "var(--s-white)" }}>Export</strong> your data (orders, products, customers)</li>
                <li><strong style={{ color: "var(--s-white)" }}>Opt out</strong> of marketing emails anytime</li>
              </ul>
              <p style={{ marginTop: 16 }}>
                Email <a href="mailto:privacy@sellisy.com" style={{ color: "var(--s-yellow)" }}>privacy@sellisy.com</a> to exercise any of these. We respond within 30 days.
              </p>
            </Section>

            <Section title="06 / DATA RETENTION">
              <p>Account data: kept while your account is active. Order data: retained for 7 years for tax/accounting compliance. After deletion, identifying fields are anonymized and the rest is purged within 30 days, except where law requires longer.</p>
            </Section>

            <Section title="07 / COOKIES">
              <p>We use a small number of essential cookies to keep you signed in and operate checkout. We do not use third-party advertising or tracking cookies. Analytics is server-side and aggregated.</p>
            </Section>

            <Section title="08 / CHILDREN">
              <p>Sellisy is not intended for children under 16. We do not knowingly collect data from anyone under 16. If you believe a child has signed up, contact us and we'll delete the account.</p>
            </Section>

            <Section title="09 / CHANGES">
              <p>We may update this policy occasionally. Material changes will be announced via email at least 30 days before they take effect.</p>
            </Section>

            <Section title="10 / CONTACT">
              <p>Questions or complaints: <a href="mailto:privacy@sellisy.com" style={{ color: "var(--s-yellow)" }}>privacy@sellisy.com</a></p>
            </Section>
          </div>

          <div style={{ marginTop: 48, padding: 24, borderRadius: 16, background: "rgba(53,91,61,0.06)", border: "1px solid rgba(245,209,66,0.15)", textAlign: "center" }}>
            <p className="s-body" style={{ color: "rgba(250,250,245,0.7)", marginBottom: 16, fontSize: 14 }}>Want to delete your data?</p>
            <Link href="/data-deletion" className="s-label" style={{ display: "inline-block", padding: "12px 28px", background: "var(--s-yellow)", color: "var(--s-black)", borderRadius: 8, fontWeight: 700, fontSize: 12, letterSpacing: 1, textDecoration: "none" }}>
              DATA DELETION &rarr;
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
