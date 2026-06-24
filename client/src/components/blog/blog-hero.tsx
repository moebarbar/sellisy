// Branded SVG hero banners — one distinct composition per article. On-brand
// (near-black + yellow #f5d142, Bebas display), but each variant owns its
// background treatment, layout, and dominant element so no two read alike at
// thumbnail size. Self-contained vector — crisp at any size, no assets.

type Variant =
  | "keep100"
  | "fees"
  | "alternatives"
  | "plr"
  | "mrrplr"
  | "products"
  | "stripe"
  | "course"
  | "vs"
  | "pricing";

const ACCENT = "#f5d142";
const BEBAS = "'Bebas Neue', sans-serif";

export function BlogHero({ variant }: { variant: Variant; title?: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10"
      style={{ aspectRatio: "5 / 2", background: "#0a0a0a" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {VARIANTS[variant] ? VARIANTS[variant]() : VARIANTS.keep100()}
      </svg>
    </div>
  );
}

// Each entry renders the FULL svg inner content: its own background + motif.
const VARIANTS: Record<Variant, () => JSX.Element> = {
  // 1. Giant 100% with an upward growth arrow + coin stack. Warm corner glow.
  keep100: () => (
    <g>
      <defs>
        <radialGradient id="kp-g" cx="20%" cy="100%" r="90%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
          <stop offset="60%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="400" fill="#0b0b0b" />
      <rect width="1000" height="400" fill="url(#kp-g)" />
      {/* coin stack */}
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx="180" cy={300 - i * 30} rx="62" ry="18" fill="none" stroke={i === 3 ? ACCENT : "#ffffff"} strokeOpacity={i === 3 ? 0.8 : 0.14} strokeWidth="3" />
      ))}
      {/* growth arrow */}
      <path d="M120 250 L210 190 L270 215 L360 130" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M335 128 L362 126 L360 154" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="470" y="270" fontFamily={BEBAS} fontSize="230" fill={ACCENT} letterSpacing="2">100%</text>
    </g>
  ),

  // 2. Fee bars on ledger lines — one flat yellow bar vs rising grey bars + % tags.
  fees: () => (
    <g>
      <rect width="1000" height="400" fill="#101010" />
      {[80, 140, 200, 260, 320].map((y) => (
        <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
      ))}
      {[
        { x: 150, h: 70, fee: "10%", on: false },
        { x: 290, h: 130, fee: "5%", on: false },
        { x: 430, h: 190, fee: "5%", on: false },
        { x: 700, h: 250, fee: "0%", on: true },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={340 - b.h} width="78" height={b.h} rx="6" fill={b.on ? ACCENT : "#ffffff"} opacity={b.on ? 0.95 : 0.1} />
          <text x={b.x + 39} y={330 - b.h} textAnchor="middle" fontFamily={BEBAS} fontSize={b.on ? "54" : "40"} fill={b.on ? ACCENT : "#ffffff"} opacity={b.on ? 1 : 0.4}>{b.fee}</text>
        </g>
      ))}
      <line x1="60" y1="340" x2="860" y2="340" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
    </g>
  ),

  // 3. Platform tiles in a grid, one highlighted as the winner with a check.
  alternatives: () => (
    <g>
      <defs>
        <radialGradient id="alt-v" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>
      <rect width="1000" height="400" fill="url(#alt-v)" />
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 180 + col * 170;
        const y = 120 + row * 130;
        const winner = i === 5;
        return (
          <g key={i}>
            <rect x={x} y={y} width="140" height="100" rx="14" fill={winner ? ACCENT : "#ffffff"} opacity={winner ? 0.95 : 0.06} stroke={winner ? ACCENT : "#ffffff"} strokeOpacity={winner ? 1 : 0.1} strokeWidth="2" />
            {winner && <path d={`M${x + 52} ${y + 50} l14 14 l26 -28`} fill="none" stroke="#0a0a0a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
            {!winner && <circle cx={x + 70} cy={y + 50} r="14" fill="#ffffff" opacity="0.12" />}
          </g>
        );
      })}
    </g>
  ),

  // 4. Fanned "rebrand" cards behind a PLR badge ring. Diagonal hatch bg.
  plr: () => (
    <g>
      <defs>
        <pattern id="plr-h" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="34" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="1000" height="400" fill="#0c0c0c" />
      <rect width="1000" height="400" fill="url(#plr-h)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={560 + i * 30} y={130 - i * 16} width="250" height="150" rx="14" fill="#141414" opacity="0.95" stroke={i === 3 ? ACCENT : "#ffffff"} strokeOpacity={i === 3 ? 0.7 : 0.08} strokeWidth="2" transform={`rotate(${-8 + i * 3} 700 200)`} />
      ))}
      <circle cx="240" cy="200" r="92" fill="#0c0c0c" stroke={ACCENT} strokeWidth="4" />
      <text x="240" y="222" textAnchor="middle" fontFamily={BEBAS} fontSize="74" fill={ACCENT} letterSpacing="3">PLR</text>
    </g>
  ),

  // 5. Hard split screen — MRR vs PLR panels with a center seam + VS.
  mrrplr: () => (
    <g>
      <rect x="0" width="500" height="400" fill="#0d0d0d" />
      <rect x="500" width="500" height="400" fill="#141414" />
      <line x1="500" y1="0" x2="500" y2="400" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" />
      <text x="250" y="210" textAnchor="middle" fontFamily={BEBAS} fontSize="110" fill="#ffffff" opacity="0.16" letterSpacing="4">MRR</text>
      <text x="750" y="210" textAnchor="middle" fontFamily={BEBAS} fontSize="110" fill={ACCENT} opacity="0.85" letterSpacing="4">PLR</text>
      <circle cx="500" cy="200" r="42" fill="#0a0a0a" stroke={ACCENT} strokeWidth="3" />
      <text x="500" y="214" textAnchor="middle" fontFamily={BEBAS} fontSize="38" fill={ACCENT}>VS</text>
    </g>
  ),

  // 6. Mosaic of product-type tiles (doc, play, image, music, code) — dot grid.
  products: () => (
    <g>
      <defs>
        <pattern id="prd-d" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#ffffff" fillOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="1000" height="400" fill="#0b0b0b" />
      <rect width="1000" height="400" fill="url(#prd-d)" />
      {[
        { x: 150, accent: true, kind: "doc" },
        { x: 300, accent: false, kind: "play" },
        { x: 450, accent: false, kind: "img" },
        { x: 600, accent: true, kind: "music" },
        { x: 750, accent: false, kind: "code" },
      ].map((t, i) => {
        const y = i % 2 === 0 ? 120 : 175;
        const fill = t.accent ? ACCENT : "#ffffff";
        const op = t.accent ? 0.95 : 0.08;
        return (
          <g key={i}>
            <rect x={t.x} y={y} width="110" height="110" rx="16" fill={fill} opacity={op} />
            <g stroke={t.accent ? "#0a0a0a" : "#ffffff"} strokeOpacity={t.accent ? 0.9 : 0.3} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {t.kind === "doc" && <path d={`M${t.x + 38} ${y + 32} h34 M${t.x + 38} ${y + 50} h34 M${t.x + 38} ${y + 68} h20`} />}
              {t.kind === "play" && <path d={`M${t.x + 44} ${y + 34} l34 21 l-34 21 z`} fill={t.accent ? "#0a0a0a" : "#ffffff"} fillOpacity={t.accent ? 0.9 : 0.3} stroke="none" />}
              {t.kind === "img" && <><rect x={t.x + 34} y={y + 34} width="42" height="42" rx="4" /><circle cx={t.x + 47} cy={y + 47} r="5" /><path d={`M${t.x + 36} ${y + 72} l16 -16 l24 20`} /></>}
              {t.kind === "music" && <path d={`M${t.x + 70} ${y + 30} v36 M${t.x + 70} ${y + 30} l-26 8 v36`} />}
              {t.kind === "code" && <path d={`M${t.x + 44} ${y + 40} l-12 15 l12 15 M${t.x + 66} ${y + 40} l12 15 l-12 15`} />}
            </g>
          </g>
        );
      })}
    </g>
  ),

  // 7. Checkout flow: card → arrow → bank, on faint concentric rings.
  stripe: () => (
    <g>
      <defs>
        <radialGradient id="st-r" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.1" />
          <stop offset="70%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="400" fill="#0c0c0c" />
      {[120, 200, 280].map((r) => (
        <circle key={r} cx="500" cy="200" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      <rect width="1000" height="400" fill="url(#st-r)" />
      {/* card */}
      <rect x="150" y="135" width="210" height="130" rx="16" fill="#161616" stroke={ACCENT} strokeOpacity="0.7" strokeWidth="2" />
      <rect x="172" y="162" width="46" height="34" rx="5" fill={ACCENT} opacity="0.9" />
      <line x1="172" y1="225" x2="338" y2="225" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
      {/* flow arrow */}
      <line x1="400" y1="200" x2="600" y2="200" stroke={ACCENT} strokeWidth="3" strokeDasharray="3 11" strokeLinecap="round" />
      <path d="M588 190 L612 200 L588 210" fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* bank */}
      <path d="M650 150 L760 120 L870 150" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="4" strokeLinejoin="round" />
      {[665, 705, 745, 785, 825].map((x) => (
        <line key={x} x1={x} y1="160" x2={x} y2="250" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="6" strokeLinecap="round" />
      ))}
      <line x1="650" y1="262" x2="870" y2="262" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),

  // 8. Course: video frame with play + a lesson checklist with progress.
  course: () => (
    <g>
      <defs>
        <linearGradient id="cr-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#151515" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect width="1000" height="400" fill="url(#cr-g)" />
      {/* player */}
      <rect x="120" y="110" width="360" height="200" rx="18" fill="#000000" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" />
      <circle cx="300" cy="210" r="46" fill={ACCENT} opacity="0.95" />
      <path d="M288 188 L326 210 L288 232 Z" fill="#0a0a0a" />
      <rect x="120" y="300" width="240" height="6" rx="3" fill={ACCENT} opacity="0.8" />
      <rect x="360" y="300" width="120" height="6" rx="3" fill="#ffffff" opacity="0.12" />
      {/* lesson list */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx="560" cy={140 + i * 55} r="13" fill={i < 2 ? ACCENT : "transparent"} stroke={i < 2 ? ACCENT : "#ffffff"} strokeOpacity={i < 2 ? 1 : 0.2} strokeWidth="2" />
          {i < 2 && <path d={`M553 ${140 + i * 55} l5 5 l9 -10`} fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="590" y={132 + i * 55} width={220 - i * 24} height="16" rx="8" fill="#ffffff" opacity={i < 2 ? 0.2 : 0.08} />
        </g>
      ))}
    </g>
  ),

  // 9. Versus matchup — two payment badges (S / P) with VS between, split radial.
  vs: () => (
    <g>
      <defs>
        <radialGradient id="vs-l" cx="25%" cy="50%" r="40%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.14" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vs-r" cx="75%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="400" fill="#0b0b0b" />
      <rect width="1000" height="400" fill="url(#vs-l)" />
      <rect width="1000" height="400" fill="url(#vs-r)" />
      <circle cx="300" cy="200" r="92" fill="#121212" stroke={ACCENT} strokeWidth="4" />
      <text x="300" y="232" textAnchor="middle" fontFamily={BEBAS} fontSize="96" fill={ACCENT}>S</text>
      <circle cx="700" cy="200" r="92" fill="#121212" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="4" />
      <text x="700" y="232" textAnchor="middle" fontFamily={BEBAS} fontSize="96" fill="#ffffff" opacity="0.5">P</text>
      <text x="500" y="222" textAnchor="middle" fontFamily={BEBAS} fontSize="80" fill="#ffffff" opacity="0.85" letterSpacing="2">VS</text>
    </g>
  ),

  // 10. Pricing — a big price tag beside an ascending 3-tier ladder. Vertical grid.
  pricing: () => (
    <g>
      <rect width="1000" height="400" fill="#0c0c0c" />
      {[200, 360, 520, 680, 840].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {/* price tag */}
      <g transform="rotate(-8 250 200)">
        <path d="M150 140 L300 140 L350 200 L300 260 L150 260 Z" fill="#141414" stroke={ACCENT} strokeWidth="3" />
        <circle cx="305" cy="200" r="9" fill={ACCENT} />
        <text x="215" y="222" textAnchor="middle" fontFamily={BEBAS} fontSize="68" fill={ACCENT}>$49</text>
      </g>
      {/* tier ladder */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={560 + i * 95} y={280 - i * 60} width="78" height={60 + i * 60} rx="8" fill={i === 2 ? ACCENT : "#ffffff"} opacity={i === 2 ? 0.95 : 0.1} />
      ))}
    </g>
  ),
};
