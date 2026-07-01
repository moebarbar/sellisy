export function FinalCTA() {
  return (
    <section
      data-testid="final-cta"
      style={{
        padding: "clamp(80px, 12vw, 160px) 24px",
        position: "relative",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Crew backdrop — the Sublevel bookends the page. Heavy scrim keeps the
          big headline fully legible over the illustration. */}
      <img
        src="/dna/crew-earnings.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, zIndex: 0, pointerEvents: "none" }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(5,5,5,0.5) 0%, rgba(5,5,5,0.92) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 300,
            height: 300,
            marginTop: -150,
            marginLeft: -150,
            borderRadius: "50%",
            border: "1.5px solid rgba(245,230,66,0.1)",
            animation: `s-expand-ring 4s ease-out ${i}s infinite`,
            pointerEvents: "none" as const,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 600,
          height: 600,
          marginTop: -300,
          marginLeft: -300,
          background: "radial-gradient(circle, rgba(245,230,66,0.08) 0%, transparent 70%)",
          pointerEvents: "none" as const,
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <h2
          className="s-heading"
          data-testid="final-cta-headline"
          style={{ fontSize: "clamp(40px, 10vw, 120px)", marginBottom: 24, lineHeight: 0.95 }}
        >
          <span style={{ color: "var(--s-white)", display: "block" }}>YOUR STORE</span>
          <span style={{ color: "var(--s-yellow)", display: "block" }}>STARTS</span>
          <span
            style={{
              display: "block",
              color: "transparent",
              WebkitTextStroke: "2px var(--s-white)",
            }}
          >
            TODAY.
          </span>
        </h2>

        <p
          className="s-body"
          style={{
            color: "rgba(250,250,245,0.5)",
            fontSize: 17,
            marginBottom: 48,
            maxWidth: 460,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Pick a plan. Connect your payments. Start increasing your GDP in minutes.
        </p>

        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" as const }}>
          <a
            href="#pricing"
            data-testid="cta-final-start"
            style={{
              display: "inline-block",
              padding: "16px 40px",
              borderRadius: 10,
              background: "var(--s-yellow)",
              color: "var(--s-black)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              textTransform: "uppercase" as const,
              letterSpacing: 1,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Get Started →
          </a>
          <a
            href="#pricing"
            data-testid="cta-final-demo"
            style={{
              display: "inline-block",
              padding: "16px 40px",
              borderRadius: 10,
              background: "transparent",
              border: "1.5px solid rgba(250,250,245,0.15)",
              color: "var(--s-white)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              textTransform: "uppercase" as const,
              letterSpacing: 1,
              textDecoration: "none",
            }}
          >
            See the Demo →
          </a>
        </div>
      </div>
    </section>
  );
}
