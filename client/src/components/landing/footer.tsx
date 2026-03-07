export function Footer() {
  return (
    <footer
      data-testid="section-footer"
      style={{
        padding: 40,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 16,
        textAlign: "center" as const,
      }}
    >
      <div
        className="s-heading"
        data-testid="footer-logo"
        style={{ fontSize: 20, color: "var(--s-white)", opacity: 0.3 }}
      >
        SELL
        <span style={{ color: "var(--s-yellow)", opacity: 1 }}>I</span>
        SY
      </div>

      <span
        className="s-label"
        data-testid="footer-copyright"
        style={{ color: "var(--s-white)", opacity: 0.3 }}
      >
        &copy; 2025 Sellisy &mdash; Sell Digital. Live Anywhere.
      </span>

      <div style={{ display: "flex", gap: 24 }}>
        <a
          href="/privacy"
          className="s-label"
          data-testid="link-privacy"
          style={{
            color: "var(--s-white)",
            opacity: 0.3,
            textDecoration: "none",
          }}
        >
          Privacy
        </a>
        <a
          href="/terms"
          className="s-label"
          data-testid="link-terms"
          style={{
            color: "var(--s-white)",
            opacity: 0.3,
            textDecoration: "none",
          }}
        >
          Terms
        </a>
      </div>
    </footer>
  );
}
