const tickerContent = "Keep 100% of Every Sale /// PLR & MRR Rights Included /// Connect Stripe or PayPal /// Stripe Tax Built In /// Affiliate Program Included /// Full Course LMS with Certificates /// Pay What You Want Pricing /// 7 Storefront Themes /// Custom Domains + SSL /// Verified Buyer Reviews /// 200+ Products in the Library /// Real-Time Analytics /// 14-Day Free Trial /// ";

export function TickerBar() {
  const textStyle = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    color: "var(--s-black)",
    letterSpacing: "3px",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div
      data-testid="ticker-bar"
      style={{
        width: "100%",
        background: "var(--s-yellow)",
        padding: "14px 0",
        overflow: "hidden",
      }}
    >
      <div
        className="s-ticker-track"
        data-testid="ticker-track"
        style={{ display: "flex", width: "fit-content" }}
      >
        <span style={textStyle}>{tickerContent}</span>
        <span style={textStyle}>{tickerContent}</span>
      </div>
    </div>
  );
}
