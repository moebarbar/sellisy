import { Sparkles, Sun } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function auroraColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#060d1a",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "rgba(255,255,255,0.04)",
      cardHover: "rgba(255,255,255,0.07)",
      cardBorder: `${customAccent || "#2dd4bf"}1a`,
      cardBorderHover: `${customAccent || "#2dd4bf"}50`,
      cardShadow: "none",
      cardShadowHover: `0 0 40px ${customAccent || "#2dd4bf"}10, 0 0 80px rgba(139,92,246,0.06), 0 12px 40px rgba(0,0,0,0.5)`,
      headerBorder: `${customAccent || "#2dd4bf"}1a`,
      text: "#f0fdf4",
      textSecondary: "rgba(240,253,244,0.5)",
      textTertiary: "rgba(240,253,244,0.25)",
      accent: customAccent || "#2dd4bf",
      accentAlt: "#a78bfa",
      price: "#34d399",
      divider: `${customAccent || "#2dd4bf"}28`,
      badgeBg: `${customAccent || "#2dd4bf"}0c`,
      badgeBorder: `${customAccent || "#2dd4bf"}1a`,
      btnGradient: `linear-gradient(135deg, ${customAccent || "#2dd4bf"}, #8b5cf6, #22d3ee)`,
      btnHoverShadow: `0 0 35px ${customAccent || "#2dd4bf"}50, 0 0 70px #8b5cf625`,
      btnText: "#fff",
      shadow: "rgba(0,0,0,0.5)",
    };
  }
  return {
    bg: "#f0fdf9",
    bgAlt: `${customAccent || "#2dd4bf"}08`,
    card: "rgba(255,255,255,0.88)",
    cardHover: "rgba(255,255,255,0.96)",
    cardBorder: `${customAccent || "#2dd4bf"}28`,
    cardBorderHover: `${customAccent || "#2dd4bf"}55`,
    cardShadow: "none",
    cardShadowHover: `0 0 40px ${customAccent || "#2dd4bf"}12, 0 12px 40px ${customAccent || "#2dd4bf"}1a`,
    headerBorder: `${customAccent || "#2dd4bf"}28`,
    text: "#0f172a",
    textSecondary: "rgba(15,23,42,0.55)",
    textTertiary: "rgba(15,23,42,0.3)",
    accent: customAccent || "#0d9488",
    accentAlt: "#7c3aed",
    price: "#059669",
    divider: `${customAccent || "#2dd4bf"}28`,
    badgeBg: `${customAccent || "#2dd4bf"}0c`,
    badgeBorder: `${customAccent || "#2dd4bf"}1a`,
    btnGradient: `linear-gradient(135deg, ${customAccent || "#0d9488"}, #7c3aed, #0891b2)`,
    btnHoverShadow: `0 0 35px ${customAccent || "#0d9488"}50, 0 0 70px #7c3aed25`,
    btnText: "#fff",
    shadow: `${customAccent || "#2dd4bf"}1a`,
  };
}

function auroraCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes aurora-wave {
      0% { transform: translateX(-25%) translateY(0) rotate(-5deg); }
      25% { transform: translateX(0%) translateY(-8%) rotate(0deg); }
      50% { transform: translateX(25%) translateY(0) rotate(5deg); }
      75% { transform: translateX(0%) translateY(8%) rotate(0deg); }
      100% { transform: translateX(-25%) translateY(0) rotate(-5deg); }
    }
    @keyframes aurora-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes aurora-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes aurora-pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.08); }
    }
    @keyframes aurora-glow {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 4px ${c.accent}40); }
      50% { filter: brightness(1.2) drop-shadow(0 0 10px ${c.accent}60); }
    }
    @keyframes aurora-gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes aurora-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      50% { opacity: 1; transform: scale(1); }
    }

    .aurora-float { animation: aurora-float 6s ease-in-out infinite; }
    .aurora-glow-icon { animation: aurora-glow 3s ease-in-out infinite; }

    .t-hero-title {
      background: linear-gradient(90deg, ${c.accent}, ${c.accentAlt}, #22d3ee, ${c.accent});
      background-size: 300% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: aurora-gradient 8s ease infinite;
      ${isDark ? `filter: drop-shadow(0 0 24px ${c.accent}35);` : ""}
    }
    .t-hero-subtitle {
      background: linear-gradient(90deg,
        ${isDark ? "rgba(240,253,244,0.35), rgba(45,212,191,0.8), rgba(167,139,250,0.7), rgba(34,211,238,0.8), rgba(240,253,244,0.35)" : "rgba(15,23,42,0.3), rgba(13,148,136,0.7), rgba(124,58,237,0.6), rgba(8,145,178,0.7), rgba(15,23,42,0.3)"});
      background-size: 400% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: aurora-shimmer 5s linear infinite;
    }
    .t-card {
      position: relative;
      background: ${c.card};
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid ${c.cardBorder};
      border-radius: 14px;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 14px; padding: 1px;
      background: linear-gradient(135deg, ${c.accent}25, ${c.accentAlt}15, #22d3ee25);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0.4; transition: opacity 0.5s ease; pointer-events: none;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-5px);
    }
    .t-card:hover::before {
      opacity: 1;
      background: linear-gradient(135deg, ${c.accent}50, ${c.accentAlt}35, #22d3ee50);
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      background-size: 200% 200%; animation: aurora-gradient 5s ease infinite;
      box-shadow: 0 0 18px ${c.accent}25, 0 0 36px ${c.accentAlt}12;
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
      background: linear-gradient(90deg, transparent, ${c.accent}25, ${c.accentAlt}25, #22d3ee25, transparent);
    }
    .t-tag-badge {
      background: ${isDark ? `${c.accent}12` : `${c.accent}0e`};
      border: 1px solid ${isDark ? `${c.accent}22` : `${c.accent}18`};
      color: ${c.accent};
    }
    .t-status-badge {
      background: ${isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"};
    }
    .t-discount {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(5,150,105,0.22))" : "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.14))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.18)"};
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-savings-glow {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.14))" : "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.1))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.14)"};
    }
    .aurora-orb { animation: aurora-pulse 5s ease-in-out infinite; pointer-events: none; }
    .aurora-sparkle-dot {
      position: absolute; width: 3px; height: 3px; border-radius: 50%;
      background: ${c.accent}; pointer-events: none;
      animation: aurora-sparkle 4s ease-in-out infinite;
    }
    .aurora-curtain {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(180deg,
        ${c.accent}${isDark ? "18" : "0e"} 0%,
        ${c.accentAlt}${isDark ? "10" : "08"} 25%,
        transparent 55%
      );
      mask-image: radial-gradient(ellipse 95% 65% at 50% 0%, black 25%, transparent 78%);
      -webkit-mask-image: radial-gradient(ellipse 95% 65% at 50% 0%, black 25%, transparent 78%);
    }
    .aurora-wave-band {
      position: absolute; pointer-events: none;
      height: 220px; width: 200%;
      left: -50%;
      animation: aurora-wave 12s ease-in-out infinite;
      filter: blur(35px);
      opacity: ${isDark ? 0.25 : 0.14};
    }
    .aurora-mesh {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        radial-gradient(circle 1.2px, ${c.accent}${isDark ? "28" : "18"} 100%, transparent 100%);
      background-size: 50px 50px;
      mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 30%, transparent 75%);
      opacity: ${isDark ? 0.8 : 0.55};
      animation: aurora-pulse 6s ease-in-out infinite;
    }
    .aurora-streak {
      position: absolute; pointer-events: none;
      background: linear-gradient(90deg, transparent, ${c.accent}${isDark ? "22" : "14"}, ${c.accentAlt}${isDark ? "18" : "0c"}, transparent);
      height: 1px;
      animation: aurora-shimmer 8s linear infinite;
    }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function AuroraBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  return (
    <>
      <div className="aurora-curtain" />
      <div className="aurora-mesh" />
      <div className="aurora-wave-band" style={{ top: "3%", background: `linear-gradient(90deg, transparent, ${colors.accent}, ${colors.accentAlt}, rgba(34,211,238,0.8), transparent)`, animationDelay: "0s" }} />
      <div className="aurora-wave-band" style={{ top: "10%", background: `linear-gradient(90deg, transparent, ${colors.accentAlt}, rgba(16,185,129,0.7), ${colors.accent}, transparent)`, animationDelay: "4s", animationDuration: "15s" }} />
      <div className="aurora-wave-band" style={{ top: "18%", background: `linear-gradient(90deg, transparent, rgba(34,211,238,0.6), ${colors.accent}, ${colors.accentAlt}, transparent)`, animationDelay: "8s", animationDuration: "18s" }} />
      <div className="aurora-wave-band" style={{ top: "26%", background: `linear-gradient(90deg, transparent, rgba(16,185,129,0.5), ${colors.accentAlt}, rgba(34,211,238,0.5), transparent)`, animationDelay: "6s", animationDuration: "20s", opacity: isDark ? 0.18 : 0.1 }} />
      <div className="aurora-orb absolute top-[-250px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px]" style={{ background: `radial-gradient(ellipse at center, ${colors.accent}${isDark ? "1e" : "12"} 0%, transparent 60%)`, filter: "blur(50px)" }} />
      <div className="aurora-orb absolute top-[150px] right-[-100px] w-[600px] h-[500px]" style={{ background: `radial-gradient(ellipse at center, ${colors.accentAlt}${isDark ? "16" : "0c"} 0%, transparent 60%)`, filter: "blur(60px)", animationDelay: "2.5s" }} />
      <div className="aurora-orb absolute bottom-[50px] left-[-80px] w-[550px] h-[400px]" style={{ background: `radial-gradient(ellipse at center, rgba(34,211,238,${isDark ? "0.1" : "0.06"}) 0%, transparent 55%)`, filter: "blur(60px)", animationDelay: "4s" }} />
      {[0,1,2,3,4,5,6].map(i => (
        <div key={`streak-${i}`} className="aurora-streak" style={{ top: `${5 + i * 4}%`, width: `${45 + i * 8}%`, left: `${8 + i * 7}%`, animationDelay: `${i * 1.5}s`, animationDuration: `${5 + i * 1.5}s` }} />
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ background: isDark ? `linear-gradient(180deg, transparent 0%, ${colors.bg}60 45%, ${colors.bg} 100%)` : `linear-gradient(180deg, transparent 0%, ${colors.bg}50 45%, ${colors.bg} 100%)` }} />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
        <div key={i} className="aurora-sparkle-dot" style={{ left: `${3 + i * 8}%`, top: `${5 + (i % 6) * 14}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${2 + i * 0.6}s`, opacity: isDark ? 0.7 : 0.35 }} />
      ))}
    </>
  );
}

function AuroraHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img
      src={store.logoUrl}
      alt={store.name}
      className="h-10 w-10 rounded-lg object-cover"
      loading="lazy"
      style={{ boxShadow: `0 0 14px ${colors.accent}28` }}
      data-testid="img-store-logo"
    />
  ) : (
    <div
      className="aurora-glow-icon relative flex items-center justify-center w-10 h-10 rounded-lg"
      style={{
        background: `linear-gradient(135deg, ${colors.accent}22, ${colors.accentAlt}18)`,
        border: `1px solid ${colors.accent}28`,
      }}
    >
      <Sun className="h-4 w-4" style={{ color: colors.accent }} />
    </div>
  );
}

export const auroraTheme: StorefrontTheme = {
  id: "aurora",
  name: "Aurora",
  defaultMode: "dark",
  colors: auroraColors,
  typography: {
    headingFamily: "system-ui, -apple-system, sans-serif",
    bodyFamily: "system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    nameTracking: "tight",
    categoryFont: "system-ui, -apple-system, sans-serif",
  },
  layout: {
    maxWidth: "max-w-6xl",
    cardBorderRadius: "14px",
    buttonBorderRadius: "12px",
    categoryBorderRadius: "9999px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
  effects: {
    cardHoverTransform: "translateY(-5px)",
    cardTransition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: auroraCss,
  renderBackground: (colors, mode) => <AuroraBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div
      className="aurora-float inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
      style={{
        background: `linear-gradient(135deg, ${colors.accent}14, ${colors.accentAlt}10, rgba(34,211,238,0.06))`,
        border: `1px solid ${colors.badgeBorder}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 0 20px ${colors.accent}10, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <Sparkles className="h-3.5 w-3.5" style={{ color: colors.accent }} />
      <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${colors.accent}cc` }}>
        Northern Lights Collection
      </span>
    </div>
  ),
  renderDivider: (isDark: boolean) => (
    <div className="relative w-full" style={{ height: "2px" }}>
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent 0%, #2dd4bf40 20%, #a78bfa50 50%, #22d3ee40 80%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, #0d948830 20%, #7c3aed30 50%, #0891b230 80%, transparent 100%)",
          boxShadow: isDark
            ? "0 0 12px rgba(45,212,191,0.15), 0 0 24px rgba(167,139,250,0.1)"
            : "0 0 8px rgba(13,148,136,0.1)",
        }}
      />
    </div>
  ),
  renderFooterDecoration: (colors: ThemeColors, isDark: boolean) => (
    <div className="w-full" style={{ height: "3px" }}>
      <div
        className="w-full h-full"
        style={{
          background: isDark
            ? `linear-gradient(90deg, ${colors.accent}60, ${colors.accentAlt}50, #22d3ee60, ${colors.accent}60)`
            : `linear-gradient(90deg, ${colors.accent}40, ${colors.accentAlt}30, #0891b240, ${colors.accent}40)`,
          backgroundSize: "300% 100%",
          animation: "aurora-gradient 8s ease infinite",
          boxShadow: isDark
            ? `0 0 16px ${colors.accent}25, 0 0 32px ${colors.accentAlt}15`
            : `0 0 8px ${colors.accent}15`,
        }}
      />
    </div>
  ),
  renderAnnouncementStyle: (colors: ThemeColors, _mode: ThemeMode) => ({
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt}, #22d3ee)`,
    backgroundSize: "200% 200%",
    animation: "aurora-gradient 6s ease infinite",
  }),
  renderCardOverlay: (colors) => (
    <div
      className="absolute inset-0 pointer-events-none rounded-[inherit]"
      style={{
        background: `linear-gradient(135deg, ${colors.accent}06, transparent 50%, ${colors.accentAlt}04)`,
      }}
    />
  ),
  renderHeaderLogo: (store, colors) => <AuroraHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Discover premium digital products inspired by the beauty of the northern lights.",
  heroBadgeText: "Northern Lights Collection",
  announcementStoragePrefix: "aurora-announcement",
  modeStorageKey: "aurora-mode",
};
