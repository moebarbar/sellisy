import { Link } from "wouter";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Trash2, Mail, Shield, AlertCircle } from "lucide-react";

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

function MethodCard({
  icon,
  step,
  title,
  children,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--s-yellow)",
            color: "var(--s-black)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <p
            className="s-label"
            style={{ color: "var(--s-yellow)", fontSize: 10, letterSpacing: 2, marginBottom: 2 }}
          >
            {step}
          </p>
          <h3
            className="s-heading"
            style={{ fontSize: 20, color: "var(--s-white)", letterSpacing: 0.5, margin: 0 }}
          >
            {title}
          </h3>
        </div>
      </div>
      <div className="s-body" style={{ color: "rgba(250,250,245,0.7)", lineHeight: 1.7, fontSize: 14 }}>
        {children}
      </div>
    </div>
  );
}

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      <div className="s-ambient-orb top-[10%] right-[10%] w-[500px] h-[500px] bg-[hsl(326_100%_62%/0.04)] blur-[140px] pointer-events-none" />
      <div className="s-ambient-orb bottom-[15%] left-[5%] w-[400px] h-[400px] bg-[hsl(53_91%_61%/0.03)] blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 s-hero-grid opacity-20 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div style={{ marginBottom: 56 }}>
            <p
              className="s-label"
              style={{ color: "var(--s-yellow)", marginBottom: 16, fontSize: 11, letterSpacing: 2 }}
            >
              // YOUR DATA
            </p>
            <h1
              className="s-heading"
              style={{ fontSize: "clamp(48px, 8vw, 88px)", color: "var(--s-white)", marginBottom: 20, lineHeight: 1 }}
            >
              DELETE <span style={{ color: "var(--s-yellow)" }}>YOUR DATA</span>
            </h1>
            <p style={{ color: "rgba(250,250,245,0.5)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>
              You own your data. Here's how to wipe it from Sellisy any time.
            </p>
          </div>

          <Section title="YOUR RIGHT TO BE FORGOTTEN">
            <p>
              You can delete your Sellisy account and all associated personal data at any time. This page describes
              how to do that and what happens after.
            </p>
          </Section>

          <div style={{ marginTop: 32, marginBottom: 32 }}>
            <p
              className="s-label"
              style={{ color: "var(--s-yellow)", fontSize: 11, letterSpacing: 2, marginBottom: 16 }}
            >
              // CHOOSE YOUR METHOD
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <MethodCard icon={<Trash2 size={20} />} step="OPTION 01" title="Delete from your dashboard">
                <ol style={{ paddingLeft: 18, listStyle: "decimal", display: "flex", flexDirection: "column", gap: 6 }}>
                  <li>
                    Sign in at{" "}
                    <Link href="/auth" style={{ color: "var(--s-yellow)", textDecoration: "underline" }}>
                      sellisy.com/auth
                    </Link>
                  </li>
                  <li>
                    Go to <strong style={{ color: "var(--s-white)" }}>Dashboard &rarr; Settings &rarr; Account</strong>
                  </li>
                  <li>
                    Scroll to <strong style={{ color: "var(--s-white)" }}>Danger Zone</strong> and click{" "}
                    <strong style={{ color: "var(--s-white)" }}>Delete Account</strong>
                  </li>
                  <li>Confirm by typing your email &mdash; deletion is queued immediately</li>
                </ol>
              </MethodCard>

              <MethodCard icon={<Mail size={20} />} step="OPTION 02" title="Email us directly">
                <p style={{ marginBottom: 12 }}>
                  Can't access your account or signed up via a third-party login (Google, Facebook, Apple)?
                </p>
                <p>
                  Email{" "}
                  <a href="mailto:privacy@sellisy.com" style={{ color: "var(--s-yellow)" }}>
                    privacy@sellisy.com
                  </a>{" "}
                  from the address tied to your account, subject{" "}
                  <strong style={{ color: "var(--s-white)" }}>"Delete my data"</strong>. We confirm receipt within 48
                  hours and complete deletion within 30 days.
                </p>
              </MethodCard>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Section title="WHAT GETS DELETED">
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 8 }}>
                <li>Your user account and authentication credentials</li>
                <li>Your profile data (name, email, profile image)</li>
                <li>Your stores, products, and uploaded files</li>
                <li>Your customer lists, marketing campaigns, and analytics</li>
                <li>Personal data on third-party services we use (Clerk, SendGrid, Cloudflare R2)</li>
              </ul>
            </Section>

            <Section title="WHAT WE KEEP (AND WHY)">
              <p style={{ marginBottom: 12 }}>A small amount of data is retained to comply with law:</p>
              <ul style={{ paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 12 }}>
                <li>
                  <strong style={{ color: "var(--s-white)" }}>Order records</strong> &mdash; buyer email, total, and date
                  kept for 7 years to meet tax and accounting obligations. Identifying fields beyond that are anonymized.
                </li>
                <li>
                  <strong style={{ color: "var(--s-white)" }}>Fraud prevention</strong> &mdash; minimal data needed to
                  enforce previous bans (hashed email, IP) is kept for up to 2 years.
                </li>
              </ul>
            </Section>

            <Section title="IF YOU BOUGHT FROM A SELLISY STORE">
              <p>
                If you're a buyer (not a store owner) and want your data removed from a specific store, contact that
                store directly &mdash; store owners control their own customer data. If the store is unresponsive after 30
                days, email{" "}
                <a href="mailto:privacy@sellisy.com" style={{ color: "var(--s-yellow)" }}>
                  privacy@sellisy.com
                </a>{" "}
                and we'll step in.
              </p>
            </Section>

            <Section title="QUESTIONS?">
              <p>
                <a href="mailto:privacy@sellisy.com" style={{ color: "var(--s-yellow)" }}>
                  privacy@sellisy.com
                </a>{" "}
                &mdash; we typically respond within 1-2 business days.
              </p>
            </Section>
          </div>

          <div
            style={{
              marginTop: 48,
              padding: 24,
              borderRadius: 16,
              background: "rgba(245,209,66,0.06)",
              border: "1px solid rgba(245,209,66,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Shield size={28} style={{ color: "var(--s-yellow)", flexShrink: 0 }} />
            <p
              className="s-body"
              style={{ color: "rgba(250,250,245,0.7)", margin: 0, fontSize: 14, lineHeight: 1.5 }}
            >
              See our{" "}
              <Link href="/privacy" style={{ color: "var(--s-yellow)", textDecoration: "underline" }}>
                Privacy Policy
              </Link>{" "}
              for the full picture of how we handle your data.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
