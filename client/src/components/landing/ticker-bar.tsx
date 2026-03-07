const tickerContent = "PLR & MRR Rights Included /// Connect Stripe or PayPal /// Sell Your Own Courses /// 200+ Products in the Library /// Customer Portal Included /// Upsells Built In /// Real-Time Analytics /// Sell Software Licenses /// Keep 100% of Every Sale /// ";

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
