import { Zap, Sparkles } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function neonColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#030308",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "rgba(255,255,255,0.03)",
      cardHover: "rgba(255,255,255,0.06)",
      cardBorder: `${customAccent || "#60a5fa"}1f`,
      cardBorderHover: `${customAccent || "#60a5fa"}59`,
      cardShadow: "none",
      cardShadowHover: `0 0 40px ${customAccent || "#60a5fa"}12, 0 0 80px ${customAccent ? customAccent + "06" : "rgba(124,58,237,0.06)"}, 0 12px 40px rgba(0,0,0,0.5)`,
      headerBorder: `${customAccent || "#60a5fa"}1f`,
      text: "#ffffff",
      textSecondary: "rgba(255,255,255,0.5)",
      textTertiary: "rgba(255,255,255,0.25)",
      accent: customAccent || "#60a5fa",
      accentAlt: "#a78bfa",
      price: "#67e8f9",
      divider: `${customAccent || "#60a5fa"}30`,
      badgeBg: `${customAccent || "#60a5fa"}0a`,
      badgeBorder: `${customAccent || "#60a5fa"}18`,
      btnGradient: `linear-gradient(135deg, ${customAccent || "#60a5fa"}, #a78bfa, #06b6d4)`,
      btnHoverShadow: `0 0 35px ${customAccent || "#60a5fa"}50, 0 0 70px #a78bfa25`,
      btnText: "#fff",
      shadow: "rgba(0,0,0,0.5)",
    };
  }
  return {
    bg: "#f0f4ff",
    bgAlt: `${customAccent || "#60a5fa"}0a`,
    card: "rgba(255,255,255,0.85)",
    cardHover: "rgba(255,255,255,0.95)",
    cardBorder: `${customAccent || "#60a5fa"}2e`,
    cardBorderHover: `${customAccent || "#60a5fa"}66`,
    cardShadow: "none",
    cardShadowHover: `0 0 40px ${customAccent || "#60a5fa"}12, 0 12px 40px ${customAccent || "#60a5fa"}1f`,
    headerBorder: `${customAccent || "#60a5fa"}2e`,
    text: "#0f172a",
    textSecondary: "rgba(15,23,42,0.55)",
    textTertiary: "rgba(15,23,42,0.3)",
    accent: customAccent || "#3b82f6",
    accentAlt: "#7c3aed",
    price: "#0e7490",
    divider: `${customAccent || "#60a5fa"}30`,
    badgeBg: `${customAccent || "#60a5fa"}0a`,
    badgeBorder: `${customAccent || "#60a5fa"}18`,
    btnGradient: `linear-gradient(135deg, ${customAccent || "#3b82f6"}, #7c3aed, #0891b2)`,
    btnHoverShadow: `0 0 35px ${customAccent || "#3b82f6"}50, 0 0 70px #7c3aed25`,
    btnText: "#fff",
    shadow: `${customAccent || "#60a5fa"}1f`,
  };
}

function neonCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  const cyan = isDark ? "#06b6d4" : "#0891b2";
  return `
    @keyframes neon-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
    @keyframes neon-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes neon-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    @keyframes neon-scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
    @keyframes neon-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes neon-grid-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
    @keyframes neon-particle-drift { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-120px) translateX(30px); opacity: 0; } }
    @keyframes neon-glow-breathe { 0%, 100% { filter: brightness(1) drop-shadow(0 0 3px ${c.accent}40); } 50% { filter: brightness(1.15) drop-shadow(0 0 8px ${c.accent}60); } }
    @keyframes neon-line-scan { 0% { left: -30%; } 100% { left: 130%; } }
    @keyframes neon-holo { 0% { background-position: 0% 0%; } 100% { background-position: 200% 200%; } }

    .t-hero-title {
      background: linear-gradient(90deg, ${c.accent}, ${c.accentAlt}, ${cyan}, ${c.accent});
      background-size: 300% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: neon-gradient 6s ease infinite;
      ${isDark ? `filter: drop-shadow(0 0 20px ${c.accent}40);` : ""}
    }
    .t-hero-subtitle {
      background: linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.4), rgba(255,255,255,0.8), rgba(96,165,250,0.9), rgba(255,255,255,0.8), rgba(255,255,255,0.4)" : "rgba(15,23,42,0.3), rgba(15,23,42,0.7), rgba(59,130,246,0.8), rgba(15,23,42,0.7), rgba(15,23,42,0.3)"});
      background-size: 400% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: neon-shimmer 4s linear infinite;
    }
    .t-card {
      position: relative;
      background: ${c.card};
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border: 1px solid ${c.cardBorder};
      border-radius: 16px;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1px;
      background: linear-gradient(135deg, ${c.accent}30, ${c.accentAlt}15, ${cyan}30);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0.5; transition: opacity 0.5s ease; pointer-events: none;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-6px);
    }
    .t-card:hover::before {
      opacity: 1;
      background: linear-gradient(135deg, ${c.accent}60, ${c.accentAlt}40, ${cyan}60);
    }
    .t-card:hover .t-card-line-scan {
      animation: neon-line-scan 1.5s ease-in-out;
    }
    .t-card-line-scan {
      position: absolute; top: 0; bottom: 0; width: 30%; pointer-events: none; z-index: 2;
      left: -30%;
      background: linear-gradient(90deg, transparent, ${isDark ? "rgba(96,165,250,0.06)" : "rgba(96,165,250,0.08)"}, transparent);
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      background-size: 200% 200%; animation: neon-gradient 4s ease infinite;
      box-shadow: 0 0 20px ${c.accent}30, 0 0 40px ${c.accentAlt}15;
      transition: all 0.3s ease; color: ${c.btnText};
    }
    .t-buy-btn:hover {
      box-shadow: ${c.btnHoverShadow};
      transform: scale(1.03);
    }
    .t-mode-btn {
      background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
      transition: all 0.3s ease; cursor: pointer;
    }
    .t-mode-btn:hover {
      background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
      border-color: ${c.accent}40;
    }
    .t-separator {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${c.accent}30, ${c.accentAlt}30, ${cyan}30, transparent);
    }
    .t-tag-badge {
      background: ${isDark ? `${c.accent}15` : `${c.accent}10`};
      border: 1px solid ${isDark ? `${c.accent}25` : `${c.accent}18`};
      color: ${c.accent};
    }
    .t-status-badge {
      background: ${isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"};
    }
    .t-discount {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.25))" : "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"};
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-savings-glow {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.15))" : "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.1))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)"};
    }
    .t-holo-stripe {
      position: absolute; inset: 0; pointer-events: none; border-radius: inherit; overflow: hidden;
    }
    .t-holo-stripe::after {
      content: ''; position: absolute; inset: 0;
      background: repeating-linear-gradient(
        115deg,
        transparent, transparent 15px,
        ${isDark ? "rgba(96,165,250,0.015)" : "rgba(96,165,250,0.02)"} 15px,
        ${isDark ? "rgba(96,165,250,0.015)" : "rgba(96,165,250,0.02)"} 16px
      );
    }
    .neon-orb { animation: neon-pulse 4s ease-in-out infinite; pointer-events: none; }
    .neon-float { animation: neon-float 6s ease-in-out infinite; }
    .neon-glow-icon { animation: neon-glow-breathe 3s ease-in-out infinite; }
    .neon-grid-bg {
      position: absolute; inset: 0; pointer-events: none;
      background-image: linear-gradient(${c.accent}0a 1px, transparent 1px), linear-gradient(90deg, ${c.accent}0a 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
    }
    .neon-grid-dots {
      position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(circle 1.5px, ${c.accent}26 100%, transparent 100%);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 80%);
      animation: neon-grid-pulse 4s ease-in-out infinite;
    }
    .neon-scanline-overlay {
      position: absolute; inset: 0; pointer-events: none; overflow: hidden;
    }
    .neon-scanline-overlay::after {
      content: ''; position: absolute; left: 0; right: 0; height: 200px;
      background: linear-gradient(to bottom, transparent, ${c.accent}05, transparent);
      animation: neon-scanline 8s linear infinite;
    }
    .neon-particle {
      position: absolute; width: 2px; height: 2px; border-radius: 50%;
      background: ${c.accent}; pointer-events: none;
      animation: neon-particle-drift 8s ease-in-out infinite;
    }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function NeonBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  const orbA = `${colors.accent}1a`;
  const orbB = "rgba(124,58,237,0.06)";
  const orbC = "rgba(6,182,212,0.07)";
  return (
    <>
      <div className="neon-grid-bg" />
      <div className="neon-grid-dots" />
      <div className="neon-scanline-overlay" />
      <div className="neon-orb absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full" style={{ background: `radial-gradient(circle, ${orbA} 0%, ${orbB} 40%, transparent 70%)` }} />
      <div className="neon-orb absolute top-[400px] right-[-200px] w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${orbC} 0%, transparent 60%)`, animationDelay: "2s" }} />
      <div className="neon-orb absolute bottom-[-100px] left-[-200px] w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${orbB} 0%, transparent 60%)`, animationDelay: "3s" }} />
      {isDark && [0,1,2,3,4,5].map(i => (
        <div key={i} className="neon-particle" style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${6 + i * 1.5}s` }} />
      ))}
    </>
  );
}

function NeonHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-10 w-10 rounded-lg object-cover" loading="lazy" style={{ boxShadow: `0 0 12px ${colors.accent}30` }} data-testid="img-store-logo" />
  ) : (
    <div className="neon-glow-icon relative flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.accent}20, ${colors.accentAlt}20)`, border: `1px solid ${colors.accent}25` }}>
      <Zap className="h-4 w-4" style={{ color: colors.accent }} />
    </div>
  );
}

export const neonTheme: StorefrontTheme = {
  id: "neon",
  name: "Neon",
  defaultMode: "dark",
  colors: neonColors,
  typography: {
    headingFamily: "system-ui, -apple-system, sans-serif",
    bodyFamily: "system-ui, -apple-system, sans-serif",
    headingWeight: "800",
    nameTracking: "tight",
    categoryFont: "system-ui, -apple-system, sans-serif",
  },
  layout: {
    maxWidth: "max-w-6xl",
    cardBorderRadius: "16px",
    buttonBorderRadius: "12px",
    categoryBorderRadius: "9999px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  effects: {
    cardHoverTransform: "translateY(-6px)",
    cardTransition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: neonCss,
  renderBackground: (colors, mode) => <NeonBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div className="neon-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <Sparkles className="h-3.5 w-3.5" style={{ color: "#06b6d4" }} />
      <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${colors.accent}cc` }}>Premium Digital Products</span>
    </div>
  ),
  renderCardOverlay: () => <div className="t-holo-stripe" />,
  renderAnnouncementStyle: (colors) => ({
    background: colors.btnGradient,
    backgroundSize: "200% 200%",
    animation: "neon-gradient 4s ease infinite",
  }),
  renderHeaderLogo: (store, colors) => <NeonHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Curated digital assets crafted for creators who demand excellence.",
  heroBadgeText: "Premium Digital Products",
  announcementStoragePrefix: "neon-announcement",
  modeStorageKey: "neon-mode",
};
