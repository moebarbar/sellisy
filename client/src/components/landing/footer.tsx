import { COMPETITORS } from "@/data/competitors";

// 3-column footer: brand · compare (12 /vs/* SEO links) · resources.
// The vs/* links live here (and only here) on the marketing surface — they
// used to be a featured grid above the footer, moved down for SEO juice
// without competing for attention with conversion sections.
export function Footer() {
  return (
    <footer
      data-testid="section-footer"
      style={{
        padding: "64px 24px 32px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          gap: 48,
        }}
      >
        {/* Brand */}
        <div>
          <div
            className="s-heading"
            data-testid="footer-logo"
            style={{ fontSize: 24, color: "var(--s-white)", marginBottom: 12 }}
          >
            SELL
            <span style={{ color: "var(--s-yellow)" }}>I</span>
            SY
          </div>
          <p
            className="s-body"
            style={{
              fontSize: 13,
              color: "rgba(250,250,245,0.4)",
              lineHeight: 1.6,
              maxWidth: 280,
              marginBottom: 16,
            }}
          >
            The platform for digital creators. Connect your own Stripe or
            PayPal, keep 100% of every sale.
          </p>
          <span
            className="s-label"
            data-testid="footer-copyright"
            style={{ color: "rgba(250,250,245,0.3)", fontSize: 11 }}
          >
            &copy; 2026 Sellisy
          </span>
        </div>

        {/* Compare — 12 /vs/* SEO links */}
        <div>
          <FooterColTitle>Compare</FooterColTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px 16px",
            }}
          >
            {COMPETITORS.map((c) => (
              <FooterLink
                key={c.slug}
                href={`/vs/${c.slug}`}
                testId={`footer-vs-${c.slug}`}
              >
                vs {c.name}
              </FooterLink>
            ))}
          </div>
        </div>

        {/* Resources / Legal */}
        <div>
          <FooterColTitle>Resources</FooterColTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FooterLink href="/discover" testId="footer-link-discover">
              Discover marketplace
            </FooterLink>
            <FooterLink href="/products" testId="footer-link-products">
              PLR product library
            </FooterLink>
            <FooterLink href="/vs" testId="footer-link-vs-index">
              All comparisons
            </FooterLink>
            <FooterLink href="/privacy" testId="link-privacy">
              Privacy
            </FooterLink>
            <FooterLink href="/terms" testId="link-terms">
              Terms
            </FooterLink>
            <FooterLink href="/data-deletion" testId="link-data-deletion">
              Data deletion
            </FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="s-label"
      style={{
        color: "var(--s-yellow)",
        fontSize: 11,
        marginBottom: 16,
        opacity: 0.85,
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
}: {
  href: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <a
      href={href}
      data-testid={testId}
      className="s-link-muted"
      style={{ fontSize: 13 }}
    >
      {children}
    </a>
  );
}
