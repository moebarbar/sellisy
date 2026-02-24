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
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function AuroraBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  return (
    <>
      <div
        className="aurora-orb absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.accent}${isDark ? "18" : "10"} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <div
        className="aurora-orb absolute top-[-200px] left-[20%] w-[700px] h-[500px]"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.accentAlt}${isDark ? "12" : "08"} 0%, transparent 70%)`,
          filter: "blur(80px)",
          animationDelay: "1.5s",
          animationDuration: "7s",
        }}
      />
      <div
        className="aurora-orb absolute top-[100px] right-[-100px] w-[600px] h-[400px]"
        style={{
          background: `radial-gradient(ellipse at center, rgba(34,211,238,${isDark ? "0.08" : "0.05"}) 0%, transparent 70%)`,
          filter: "blur(70px)",
          animationDelay: "3s",
          animationDuration: "9s",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `linear-gradient(180deg, transparent 0%, ${colors.bg}80 40%, ${colors.bg} 100%)`
            : `linear-gradient(180deg, transparent 0%, ${colors.bg}60 50%, ${colors.bg} 100%)`,
        }}
      />
      {isDark && (
        <div
          className="absolute top-0 left-0 w-full h-[500px] pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 120% 60% at 50% -10%, ${colors.accent}0d 0%, transparent 70%),
              radial-gradient(ellipse 80% 40% at 30% 10%, ${colors.accentAlt}08 0%, transparent 60%),
              radial-gradient(ellipse 80% 40% at 70% 10%, rgba(34,211,238,0.05) 0%, transparent 60%)
            `,
          }}
        />
      )}
      {isDark && [0,1,2,3,4].map(i => (
        <div
          key={i}
          className="aurora-sparkle-dot"
          style={{
            left: `${12 + i * 18}%`,
            top: `${15 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.9}s`,
            animationDuration: `${3 + i * 1.2}s`,
          }}
        />
      ))}
    </>
  );
}

function AuroraHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img
      src={store.logoUrl}
      alt={store.name}
      className="h-9 w-9 rounded-lg object-cover"
      loading="lazy"
      style={{ boxShadow: `0 0 14px ${colors.accent}28` }}
      data-testid="img-store-logo"
    />
  ) : (
    <div
      className="aurora-glow-icon relative flex items-center justify-center w-9 h-9 rounded-lg"
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
      className="aurora-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
      style={{
        background: colors.badgeBg,
        border: `1px solid ${colors.badgeBorder}`,
        backdropFilter: "blur(12px)",
      }}
    >
      <Sparkles className="h-3.5 w-3.5" style={{ color: colors.accent }} />
      <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${colors.accent}cc` }}>
        Northern Lights Collection
      </span>
    </div>
  ),
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
