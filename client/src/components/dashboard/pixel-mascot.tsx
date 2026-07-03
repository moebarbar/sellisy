// Pixel — the CRT-smiley mascot from the Sellisy crew, as a lightweight inline
// SVG so it can live anywhere in the app (empty states, loading, 404) with a
// configurable expression + accent. Part of the dashboard DNA.

type Expression = "happy" | "wink" | "dead" | "flat";

const FACES: Record<Expression, { eyes: string; mouth: string }> = {
  happy: { eyes: "dots", mouth: "smile" },
  wink: { eyes: "wink", mouth: "smile" },
  dead: { eyes: "x", mouth: "flat" },
  flat: { eyes: "dots", mouth: "flat" },
};

export function PixelMascot({
  size = 88,
  accent = "#F5E642",
  expression = "happy",
  className,
}: {
  size?: number;
  accent?: string;
  expression?: Expression;
  className?: string;
}) {
  const f = FACES[expression];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      {/* body / jacket hint */}
      <rect x="30" y="74" width="40" height="20" rx="4" fill="#1a1a1a" stroke="rgba(255,255,255,0.12)" />
      {/* CRT monitor head */}
      <rect x="18" y="16" width="64" height="56" rx="10" fill="#0e0e0e" stroke={accent} strokeWidth="2.5" />
      {/* screen */}
      <rect x="26" y="24" width="48" height="40" rx="6" fill={accent} opacity="0.12" />
      {/* scanline */}
      <rect x="26" y="42" width="48" height="2" fill={accent} opacity="0.25" />
      {/* eyes */}
      {f.eyes === "dots" && (
        <>
          <circle cx="40" cy="40" r="4" fill={accent} />
          <circle cx="60" cy="40" r="4" fill={accent} />
        </>
      )}
      {f.eyes === "wink" && (
        <>
          <circle cx="40" cy="40" r="4" fill={accent} />
          <rect x="55" y="39" width="10" height="3" rx="1.5" fill={accent} />
        </>
      )}
      {f.eyes === "x" && (
        <g stroke={accent} strokeWidth="3" strokeLinecap="round">
          <path d="M36 36 l8 8 M44 36 l-8 8" />
          <path d="M56 36 l8 8 M64 36 l-8 8" />
        </g>
      )}
      {/* mouth */}
      {f.mouth === "smile" ? (
        <path d="M38 50 q12 10 24 0" stroke={accent} strokeWidth="3" strokeLinecap="round" fill="none" />
      ) : (
        <rect x="40" y="52" width="20" height="3" rx="1.5" fill={accent} />
      )}
      {/* antenna */}
      <path d="M50 16 v-6" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="8" r="2.5" fill={accent} />
    </svg>
  );
}
