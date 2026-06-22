// Branded SVG hero banners for blog articles. On-brand (near-black #050505,
// yellow accent #f5d142, geometric), distinct motif per topic, fully
// self-contained vector — crisp at any size, no external assets, SSR-safe.

type Variant = "money" | "plr" | "guide" | "compare" | "stripe" | "course";

const ACCENT = "#f5d142";
const ACCENT_DIM = "#f5d142";
const BG0 = "#0a0a0a";
const BG1 = "#141414";

export function BlogHero({ variant, title }: { variant: Variant; title?: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10" style={{ aspectRatio: "5 / 2", background: BG0 }} aria-hidden="true">
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={`bh-glow-${variant}`} cx="78%" cy="30%" r="60%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
            <stop offset="55%" stopColor={ACCENT} stopOpacity="0.05" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`bh-bg-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BG1} />
            <stop offset="100%" stopColor={BG0} />
          </linearGradient>
          <pattern id={`bh-grid-${variant}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 L0 40" fill="none" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="1000" height="400" fill={`url(#bh-bg-${variant})`} />
        <rect width="1000" height="400" fill={`url(#bh-grid-${variant})`} />
        <rect width="1000" height="400" fill={`url(#bh-glow-${variant})`} />

        <Motif variant={variant} />
      </svg>
    </div>
  );
}

function Motif({ variant }: { variant: Variant }) {
  switch (variant) {
    case "money":
      return (
        <g>
          {/* ascending bars — flat line vs growing cut */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={120 + i * 70} y={300 - i * 42} width="44" height={60 + i * 42} rx="6" fill="#ffffff" opacity={0.06} />
          ))}
          <line x1="110" y1="300" x2="430" y2="300" stroke={ACCENT} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" opacity="0.7" />
          <text x="700" y="230" fontFamily="'Bebas Neue', sans-serif" fontSize="190" fill={ACCENT} opacity="0.9" letterSpacing="2">100%</text>
        </g>
      );
    case "plr":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={560 + i * 26} y={120 - i * 14} width="240" height="150" rx="12" fill="#ffffff" opacity={0.05 + i * 0.02} stroke={i === 3 ? ACCENT : "#ffffff"} strokeOpacity={i === 3 ? 0.6 : 0.06} strokeWidth="2" transform={`rotate(${-6 + i * 2} 680 195)`} />
          ))}
          <circle cx="220" cy="200" r="70" fill="none" stroke={ACCENT} strokeWidth="3" opacity="0.6" />
          <text x="185" y="222" fontFamily="'Bebas Neue', sans-serif" fontSize="58" fill={ACCENT}>PLR</text>
        </g>
      );
    case "compare":
      return (
        <g>
          {[
            { x: 600, h: 60 }, { x: 680, h: 120 }, { x: 760, h: 200 }, { x: 840, h: 110 },
          ].map((b, i) => (
            <rect key={i} x={b.x} y={320 - b.h} width="52" height={b.h} rx="6" fill={i === 2 ? ACCENT : "#ffffff"} opacity={i === 2 ? 0.9 : 0.08} />
          ))}
          <text x="120" y="190" fontFamily="'Bebas Neue', sans-serif" fontSize="120" fill="#ffffff" opacity="0.1">VS</text>
          <line x1="600" y1="320" x2="900" y2="320" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="2" />
        </g>
      );
    case "stripe":
      return (
        <g>
          {/* connector nodes */}
          <circle cx="250" cy="200" r="40" fill="none" stroke={ACCENT} strokeWidth="3" opacity="0.7" />
          <circle cx="750" cy="200" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="3" />
          <line x1="290" y1="200" x2="710" y2="200" stroke={ACCENT} strokeWidth="3" strokeDasharray="3 10" strokeLinecap="round" opacity="0.6" />
          <circle cx="500" cy="200" r="10" fill={ACCENT} />
          <text x="455" y="120" fontFamily="'Bebas Neue', sans-serif" fontSize="42" fill="#ffffff" opacity="0.14">CONNECT</text>
        </g>
      );
    case "course":
      return (
        <g>
          <rect x="600" y="110" width="280" height="180" rx="16" fill="#ffffff" opacity="0.05" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" />
          <path d="M715 165 L765 200 L715 235 Z" fill={ACCENT} opacity="0.9" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x="150" y={150 + i * 40} width={220 - i * 30} height="14" rx="7" fill={i === 0 ? ACCENT : "#ffffff"} opacity={i === 0 ? 0.8 : 0.08} />
          ))}
        </g>
      );
    case "guide":
    default:
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <circle cx={180 + i * 70} cy="200" r="22" fill={i === 0 ? ACCENT : "#ffffff"} opacity={i === 0 ? 0.9 : 0.1} />
              {i < 3 && <line x1={202 + i * 70} y1="200" x2={228 + i * 70} y2="200" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="3" />}
            </g>
          ))}
          <text x="640" y="240" fontFamily="'Bebas Neue', sans-serif" fontSize="150" fill="#ffffff" opacity="0.07">GUIDE</text>
        </g>
      );
  }
}
