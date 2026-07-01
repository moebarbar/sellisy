// "Meet the Sublevel" — introduces the Sellisy brand world (the neon-noir crew
// of retro-electronics characters). Split layout: copy on solid black, art in a
// glowing framed panel — so text legibility never fights the illustration.
// Part of the DNA redesign (see DNA_REDESIGN.md).

const SCENES = [
  { src: "/dna/crew-launch.jpg", alt: "The Sellisy crew launching product boxes into the night sky from a rooftop" },
  { src: "/dna/crew-earnings.jpg", alt: "A Sellisy character collecting glowing coins from an arcade claw machine" },
];

export function BrandWorldSection() {
  return (
    <section
      data-testid="section-brand-world"
      style={{ padding: "clamp(80px, 10vw, 130px) 24px", background: "var(--s-black)", position: "relative", overflow: "hidden" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: "clamp(32px, 5vw, 64px)", gridTemplateColumns: "minmax(0, 1fr)", alignItems: "center" }} className="brand-world-grid">
        {/* Copy — always on solid black, guaranteed legible */}
        <div>
          <span className="s-label" style={{ color: "var(--s-pink)", marginBottom: 18, display: "block" }}>
            // Meet the Sublevel
          </span>
          <h2 className="s-heading" style={{ fontSize: "clamp(34px, 5.5vw, 60px)", color: "var(--s-white)", lineHeight: 1.02, marginBottom: 20 }}>
            YOUR STOREFRONT
            <br />
            HAS A <span style={{ color: "var(--s-yellow)" }}>PULSE.</span>
          </h2>
          <p className="s-body" style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(250,250,245,0.62)", maxWidth: 480, marginBottom: 28 }}>
            Sellisy isn&rsquo;t another gray dashboard. It&rsquo;s an underground built
            for one thing &mdash; turning what you make into income you keep. A whole
            crew runs the machinery: <strong style={{ color: "var(--s-white)", fontWeight: 600 }}>Register</strong> handles
            the money, <strong style={{ color: "var(--s-white)", fontWeight: 600 }}>Radio</strong> spreads the word,
            and <strong style={{ color: "var(--s-white)", fontWeight: 600 }}>Pixel</strong> keeps score while your GDP climbs.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { c: "var(--s-yellow)", label: "Keep 100%" },
              { c: "var(--s-pink)", label: "Launch in minutes" },
              { c: "var(--s-teal)", label: "Grow on autopilot" },
            ].map((t) => (
              <span key={t.label} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(250,250,245,0.8)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.c, boxShadow: `0 0 12px ${t.c}` }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Art — framed, glowing panel. The scenes' own dark edges blend into black. */}
        <div style={{ display: "grid", gap: 16 }}>
          <figure
            style={{
              margin: 0,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(245,230,66,0.18)",
              boxShadow: "0 0 60px rgba(255,60,172,0.12), 0 0 30px rgba(245,230,66,0.08)",
              position: "relative",
            }}
          >
            <img
              src={SCENES[0].src}
              alt={SCENES[0].alt}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", display: "block", aspectRatio: "16 / 9", objectFit: "cover" }}
            />
          </figure>
          <figure
            className="brand-world-second"
            style={{
              margin: 0,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(0,245,212,0.18)",
              boxShadow: "0 0 50px rgba(0,245,212,0.1)",
            }}
          >
            <img
              src={SCENES[1].src}
              alt={SCENES[1].alt}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", display: "block", aspectRatio: "16 / 9", objectFit: "cover" }}
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
