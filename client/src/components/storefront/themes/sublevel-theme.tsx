import { Zap } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

// "Sublevel" — the Sellisy brand-world DNA as a storefront: neon-noir
// underground, halftone comic texture, yellow + hot-pink + teal on near-black,
// Bebas display type. The only storefront theme that looks like the platform's
// own identity. Dark-first (light mode is a "daylight sublevel" fallback).

const YELLOW = "#F5E642";
const PINK = "#FF3CAC";
const TEAL = "#00F5D4";

function sublevelColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const accent = customAccent || YELLOW;
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#050505",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "rgba(255,255,255,0.03)",
      cardHover: "rgba(255,255,255,0.06)",
      cardBorder: `${accent}24`,
      cardBorderHover: `${PINK}80`,
      cardShadow: "none",
      cardShadowHover: `0 0 40px ${accent}1a, 0 0 80px ${PINK}14, 0 14px 44px rgba(0,0,0,0.6)`,
      headerBorder: `${accent}1f`,
      text: "#FAFAF5",
      textSecondary: "rgba(250,250,245,0.55)",
      textTertiary: "rgba(250,250,245,0.3)",
      accent,
      accentAlt: PINK,
      price: TEAL,
      divider: `${accent}30`,
      badgeBg: `${PINK}0f`,
      badgeBorder: `${PINK}40`,
      btnGradient: `linear-gradient(135deg, ${accent}, ${PINK})`,
      btnHoverShadow: `0 0 34px ${accent}59, 0 0 70px ${PINK}45`,
      btnText: "#050505",
      shadow: "rgba(0,0,0,0.6)",
    };
  }
  return {
    bg: "#f7f5ef",
    bgAlt: `${accent}0d`,
    card: "rgba(255,255,255,0.9)",
    cardHover: "#ffffff",
    cardBorder: "rgba(10,10,10,0.1)",
    cardBorderHover: `${PINK}80`,
    cardShadow: "none",
    cardShadowHover: `0 0 36px ${accent}1a, 0 14px 40px rgba(10,10,10,0.12)`,
    headerBorder: "rgba(10,10,10,0.08)",
    text: "#0a0a0a",
    textSecondary: "rgba(10,10,10,0.6)",
    textTertiary: "rgba(10,10,10,0.4)",
    accent,
    accentAlt: PINK,
    price: "#0891b2",
    divider: "rgba(10,10,10,0.1)",
    badgeBg: `${PINK}12`,
    badgeBorder: `${PINK}40`,
    btnGradient: `linear-gradient(135deg, ${accent}, ${PINK})`,
    btnHoverShadow: `0 0 30px ${accent}40, 0 0 60px ${PINK}30`,
    btnText: "#050505",
    shadow: "rgba(10,10,10,0.12)",
  };
}

function sublevelCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  const halftone = isDark ? "rgba(0,0,0,0.45)" : "rgba(10,10,10,0.06)";
  return `
    @keyframes sub-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes sub-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes sub-pulse { 0%, 100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.06); } }
    @keyframes sub-scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
    @keyframes sub-line-scan { 0% { left: -30%; } 100% { left: 130%; } }
    @keyframes sub-flicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 94% { opacity: 0.72; } 96% { opacity: 1; } 97% { opacity: 0.85; } }
    @keyframes sub-dot { 0% { background-position: 0 0; } 100% { background-position: 4px 4px; } }

    .t-hero-title {
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 2px;
      text-transform: uppercase;
      background: linear-gradient(100deg, ${c.accent}, ${c.accentAlt}, ${c.accent});
      background-size: 220% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: sub-gradient 7s ease infinite, sub-flicker 6s steps(1) infinite;
      ${isDark ? `filter: drop-shadow(0 0 22px ${c.accent}45);` : ""}
    }
    .t-hero-subtitle {
      font-family: 'DM Sans', sans-serif;
      color: ${c.textSecondary};
    }
    .t-card {
      position: relative;
      background: ${c.card};
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid ${c.cardBorder};
      border-radius: 14px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 14px; padding: 1px;
      background: linear-gradient(135deg, ${c.accent}45, ${c.accentAlt}30, ${TEAL}30);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0.45; transition: opacity 0.4s ease; pointer-events: none;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-6px);
    }
    .t-card:hover::before { opacity: 1; }
    .t-card:hover .t-card-line-scan { animation: sub-line-scan 1.4s ease-in-out; }
    .t-card-line-scan {
      position: absolute; top: 0; bottom: 0; width: 30%; pointer-events: none; z-index: 2; left: -30%;
      background: linear-gradient(90deg, transparent, ${c.accent}12, transparent);
    }
    /* Halftone comic texture over each card — the DNA fingerprint */
    .t-holo-stripe { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; overflow: hidden; }
    .t-holo-stripe::after {
      content: ''; position: absolute; inset: 0;
      background-image: radial-gradient(${halftone} 1px, transparent 1.4px);
      background-size: 4px 4px;
      mix-blend-mode: ${isDark ? "screen" : "multiply"};
      opacity: ${isDark ? 0.08 : 0.12};
    }
    .t-buy-btn {
      font-family: 'Space Mono', monospace;
      text-transform: uppercase; letter-spacing: 1px; font-weight: 700;
      background: ${c.btnGradient};
      background-size: 200% 200%; animation: sub-gradient 5s ease infinite;
      box-shadow: 0 0 20px ${c.accent}30, 0 0 40px ${c.accentAlt}1f;
      transition: all 0.3s ease; color: ${c.btnText};
    }
    .t-buy-btn:hover { box-shadow: ${c.btnHoverShadow}; transform: scale(1.03); }
    .t-mode-btn {
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(10,10,10,0.05)"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(10,10,10,0.1)"};
      transition: all 0.3s ease; cursor: pointer;
    }
    .t-mode-btn:hover { background: ${isDark ? "rgba(255,255,255,0.09)" : "rgba(10,10,10,0.09)"}; border-color: ${c.accent}45; }
    .t-separator { height: 1px; background: linear-gradient(90deg, transparent, ${c.accent}30, ${c.accentAlt}30, ${TEAL}30, transparent); }
    .t-tag-badge {
      font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px;
      background: ${c.accent}14; border: 1px solid ${c.accent}2e; color: ${isDark ? c.accent : "#8a7a00"};
    }
    .t-status-badge { background: ${TEAL}14; border: 1px solid ${TEAL}33; }
    .t-discount { background: ${PINK}1a; border: 1px solid ${PINK}45; color: ${isDark ? "#ff8fd0" : "#c01f86"}; }
    .t-verified-badge { background: ${TEAL}12; border: 1px solid ${TEAL}30; color: ${isDark ? TEAL : "#0891b2"}; }
    .t-guarantee-badge { background: ${c.accent}14; border: 1px solid ${c.accent}2e; color: ${isDark ? c.accent : "#8a7a00"}; }
    .t-savings-glow { background: ${PINK}12; border: 1px solid ${PINK}2e; }

    .sub-orb { animation: sub-pulse 5s ease-in-out infinite; pointer-events: none; }
    .sub-float { animation: sub-float 6s ease-in-out infinite; }
    .sub-grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image: linear-gradient(${c.accent}0a 1px, transparent 1px), linear-gradient(90deg, ${c.accent}0a 1px, transparent 1px);
      background-size: 54px 54px;
      mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
    }
    .sub-halftone {
      position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(${isDark ? "rgba(245,230,66,0.05)" : "rgba(10,10,10,0.05)"} 1px, transparent 1.4px);
      background-size: 5px 5px;
      mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 20%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 20%, transparent 75%);
    }
    .sub-scanline { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .sub-scanline::after {
      content: ''; position: absolute; left: 0; right: 0; height: 220px;
      background: linear-gradient(to bottom, transparent, ${c.accent}06, transparent);
      animation: sub-scanline 9s linear infinite;
    }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function SublevelBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  return (
    <>
      <div className="sub-grid" />
      <div className="sub-halftone" />
      {isDark && <div className="sub-scanline" />}
      <div className="sub-orb absolute top-[-260px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.accent}1c 0%, ${PINK}0d 42%, transparent 70%)` }} />
      <div className="sub-orb absolute top-[380px] right-[-220px] w-[620px] h-[620px] rounded-full" style={{ background: `radial-gradient(circle, ${PINK}12 0%, transparent 62%)`, animationDelay: "2s" }} />
      <div className="sub-orb absolute bottom-[-120px] left-[-200px] w-[520px] h-[520px] rounded-full" style={{ background: `radial-gradient(circle, ${TEAL}12 0%, transparent 60%)`, animationDelay: "3s" }} />
    </>
  );
}

function SublevelHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-10 w-10 rounded-lg object-cover" loading="lazy" style={{ boxShadow: `0 0 14px ${colors.accent}40` }} data-testid="img-store-logo" />
  ) : (
    <div className="sub-float relative flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.accent}22, ${PINK}22)`, border: `1px solid ${colors.accent}30` }}>
      <Zap className="h-4 w-4" style={{ color: colors.accent, filter: `drop-shadow(0 0 6px ${colors.accent}80)` }} />
    </div>
  );
}

export const sublevelTheme: StorefrontTheme = {
  id: "sublevel",
  name: "Sublevel",
  defaultMode: "dark",
  colors: sublevelColors,
  typography: {
    headingFamily: "'Bebas Neue', sans-serif",
    bodyFamily: "'DM Sans', sans-serif",
    headingWeight: "400",
    nameTracking: "wide",
    categoryFont: "'Space Mono', monospace",
  },
  layout: {
    maxWidth: "max-w-6xl",
    cardBorderRadius: "14px",
    buttonBorderRadius: "10px",
    categoryBorderRadius: "9999px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    imageAspect: "aspect-[3/4]",
    heroStyle: "editorial",
  },
  effects: {
    cardHoverTransform: "translateY(-6px)",
    cardTransition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: sublevelCss,
  renderBackground: (colors, mode) => <SublevelBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div className="sub-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: PINK, boxShadow: `0 0 10px ${PINK}` }} />
      <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: colors.accentAlt, fontFamily: "'Space Mono', monospace" }}>The Sublevel</span>
    </div>
  ),
  renderCardOverlay: () => <div className="t-holo-stripe" />,
  renderAnnouncementStyle: (colors) => ({
    background: colors.btnGradient,
    backgroundSize: "200% 200%",
    animation: "sub-gradient 5s ease infinite",
    color: "#050505",
  }),
  renderHeaderLogo: (store, colors) => <SublevelHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Straight from the Sublevel — digital goods, zero fees, all yours.",
  heroBadgeText: "The Sublevel",
  announcementStoragePrefix: "sublevel-announcement",
  modeStorageKey: "sublevel-mode",
};
