import { COMPETITORS } from "@/data/competitors";

// Multi-column footer modeled on Stripe / Linear / Vercel patterns.
// Three rows:
//   1. Brand row — full-width header with logo, tagline, status indicator,
//      and social icons
//   2. Link columns — Product, Marketplace, Compare (all 12 /vs/* SEO
//      links), Company (legal + contact)
//   3. Bottom bar — copyright, made-with statement
//
// All links resolve to real pages on the live site. No faked destinations.

const X_LOGO = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const INSTAGRAM_LOGO = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const TIKTOK_LOGO = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const MAIL_LOGO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export function Footer() {
  return (
    <footer
      data-testid="section-footer"
      style={{
        padding: "80px 24px 32px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Row 1 — Brand block */}
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 32, marginBottom: 64, alignItems: "start" }}
        >
          <div>
            <div
              className="s-heading"
              data-testid="footer-logo"
              style={{ fontSize: 32, color: "var(--s-white)", marginBottom: 16 }}
            >
              SELL
              <span style={{ color: "var(--s-yellow)" }}>I</span>
              SY
            </div>
            <p
              className="s-body"
              style={{
                fontSize: 14,
                color: "rgba(250,250,245,0.55)",
                lineHeight: 1.7,
                maxWidth: 380,
              }}
            >
              The platform for digital creators. Connect your own Stripe or
              PayPal, keep 100% of every sale. Built for people who&rsquo;d
              rather not give up 10%.
            </p>
          </div>

          {/* Right: status pill + social */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 20,
              justifySelf: "start",
            }}
            className="md:justify-self-end md:items-end"
          >
            <div
              data-testid="footer-status"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: "rgba(134,239,172,0.9)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgb(34,197,94)",
                  boxShadow: "0 0 8px rgb(34,197,94)",
                }}
              />
              All systems operational
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <SocialIconLink href="https://twitter.com/trysellisy" testId="footer-social-x" label="Sellisy on X">{X_LOGO}</SocialIconLink>
              <SocialIconLink href="https://instagram.com/trysellisy" testId="footer-social-instagram" label="Sellisy on Instagram">{INSTAGRAM_LOGO}</SocialIconLink>
              <SocialIconLink href="https://tiktok.com/@trysellisy" testId="footer-social-tiktok" label="Sellisy on TikTok">{TIKTOK_LOGO}</SocialIconLink>
              <SocialIconLink href="mailto:hello@sellisy.com" testId="footer-social-mail" label="Email Sellisy">{MAIL_LOGO}</SocialIconLink>
            </div>
          </div>
        </div>

        {/* Row 2 — Four link columns */}
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 48, marginBottom: 64 }}
        >
          {/* Product */}
          <FooterColumn title="Product">
            <FooterLink href="/#features" testId="footer-link-features">Features</FooterLink>
            <FooterLink href="/#pricing" testId="footer-link-pricing">Pricing</FooterLink>
            <FooterLink href="/#how-it-works" testId="footer-link-how-it-works">How it works</FooterLink>
            <FooterLink href="/#create" testId="footer-link-create">Content tools</FooterLink>
            <FooterLink href="/auth" testId="footer-link-start">Start free trial</FooterLink>
            <FooterLink href="/auth" testId="footer-link-login">Log in</FooterLink>
          </FooterColumn>

          {/* Marketplace */}
          <FooterColumn title="Marketplace">
            <FooterLink href="/discover" testId="footer-link-discover">Discover stores</FooterLink>
            <FooterLink href="/products" testId="footer-link-products">PLR library</FooterLink>
            <FooterLink href="/blog" testId="footer-link-blog">Blog</FooterLink>
            <FooterLink href="/#products" testId="footer-link-featured">Featured products</FooterLink>
            <FooterLink href="/#templates" testId="footer-link-themes">Storefront themes</FooterLink>
          </FooterColumn>

          {/* Compare — all 12 /vs/* in a tight 2-row grid */}
          <FooterColumn title="Compare">
            {COMPETITORS.map((c) => (
              <FooterLink
                key={c.slug}
                href={`/vs/${c.slug}`}
                testId={`footer-vs-${c.slug}`}
              >
                vs {c.name}
              </FooterLink>
            ))}
            <FooterLink href="/vs" testId="footer-link-vs-index" emphasis>
              See all comparisons →
            </FooterLink>
          </FooterColumn>

          {/* Company / Legal */}
          <FooterColumn title="Company">
            <FooterLink href="mailto:hello@sellisy.com" testId="footer-link-contact">Contact</FooterLink>
            <FooterLink href="mailto:hello@sellisy.com?subject=Press%20inquiry" testId="footer-link-press">Press</FooterLink>
            <FooterLink href="/privacy" testId="link-privacy">Privacy</FooterLink>
            <FooterLink href="/terms" testId="link-terms">Terms</FooterLink>
            <FooterLink href="/data-deletion" testId="link-data-deletion">Data deletion</FooterLink>
          </FooterColumn>
        </div>

        {/* Row 3 — Bottom bar */}
        <div
          style={{
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span
            className="s-label"
            data-testid="footer-copyright"
            style={{ color: "rgba(250,250,245,0.35)", fontSize: 11 }}
          >
            &copy; 2026 Sellisy. All rights reserved.
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: "rgba(250,250,245,0.3)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Built for creators who&rsquo;d rather not give up 10%
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <FooterColTitle>{title}</FooterColTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="s-label"
      style={{
        color: "rgba(250,250,245,0.45)",
        fontSize: 11,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

function FooterLink({
  href,
  children,
  testId,
  emphasis,
}: {
  href: string;
  children: React.ReactNode;
  testId: string;
  emphasis?: boolean;
}) {
  return (
    <a
      href={href}
      data-testid={testId}
      className="s-link-muted"
      style={{
        fontSize: 13,
        color: emphasis ? "var(--s-yellow)" : undefined,
        fontWeight: emphasis ? 600 : undefined,
      }}
    >
      {children}
    </a>
  );
}

function SocialIconLink({
  href,
  testId,
  label,
  children,
}: {
  href: string;
  testId: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      data-testid={testId}
      aria-label={label}
      className="s-social-icon"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
