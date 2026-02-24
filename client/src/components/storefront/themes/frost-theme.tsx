import { Snowflake } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function frostColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#0a1628",
      bgAlt: "rgba(147,197,253,0.03)",
      card: "rgba(147,197,253,0.05)",
      cardHover: "rgba(147,197,253,0.08)",
      cardBorder: `${customAccent || "#93c5fd"}1a`,
      cardBorderHover: `${customAccent || "#93c5fd"}40`,
      cardShadow: "0 2px 16px rgba(0,0,0,0.3)",
      cardShadowHover: `0 8px 40px ${customAccent || "#93c5fd"}15, 0 4px 20px rgba(0,0,0,0.4)`,
      headerBorder: `${customAccent || "#93c5fd"}1a`,
      text: "#e8f0fe",
      textSecondary: "rgba(232,240,254,0.55)",
      textTertiary: "rgba(232,240,254,0.3)",
      accent: customAccent || "#93c5fd",
      accentAlt: customAccent ? `${customAccent}99` : "#bae6fd",
      price: customAccent || "#7dd3fc",
      divider: `${customAccent || "#93c5fd"}1a`,
      badgeBg: `${customAccent || "#93c5fd"}10`,
      badgeBorder: `${customAccent || "#93c5fd"}25`,
      btnGradient: `linear-gradient(135deg, ${customAccent || "#3b82f6"}, ${customAccent || "#60a5fa"})`,
      btnHoverShadow: `0 4px 24px ${customAccent || "#93c5fd"}30`,
      btnText: "#ffffff",
      shadow: "rgba(0,0,0,0.4)",
    };
  }
  return {
    bg: "#f0f7ff",
    bgAlt: "#e8f2ff",
    card: "rgba(255,255,255,0.9)",
    cardHover: "rgba(255,255,255,1)",
    cardBorder: `${customAccent || "#93c5fd"}30`,
    cardBorderHover: `${customAccent || "#93c5fd"}55`,
    cardShadow: "0 2px 12px rgba(147,197,253,0.08)",
    cardShadowHover: `0 8px 40px ${customAccent || "#93c5fd"}18, 0 4px 16px rgba(147,197,253,0.1)`,
    headerBorder: `${customAccent || "#93c5fd"}28`,
    text: "#0c1e3a",
    textSecondary: "rgba(12,30,58,0.55)",
    textTertiary: "rgba(12,30,58,0.3)",
    accent: customAccent || "#3b82f6",
    accentAlt: customAccent ? `${customAccent}99` : "#60a5fa",
    price: customAccent || "#2563eb",
    divider: `${customAccent || "#93c5fd"}20`,
    badgeBg: `${customAccent || "#93c5fd"}12`,
    badgeBorder: `${customAccent || "#93c5fd"}28`,
    btnGradient: `linear-gradient(135deg, ${customAccent || "#2563eb"}, ${customAccent || "#3b82f6"})`,
    btnHoverShadow: `0 4px 24px ${customAccent || "#3b82f6"}30`,
    btnText: "#ffffff",
    shadow: "rgba(147,197,253,0.1)",
  };
}

function frostCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes frost-sparkle {
      0%, 100% { opacity: 0.2; transform: scale(0.8); }
      50% { opacity: 0.8; transform: scale(1.2); }
    }
    @keyframes frost-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes frost-drift {
      0% { transform: translateY(0) rotate(0deg); opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { transform: translateY(-100px) rotate(180deg); opacity: 0; }
    }
    @keyframes frost-breathe {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.03); }
    }
    @keyframes frost-glow {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 2px ${c.accent}30); }
      50% { filter: brightness(1.1) drop-shadow(0 0 6px ${c.accent}50); }
    }
    .frost-sparkle { animation: frost-sparkle 3s ease-in-out infinite; pointer-events: none; }
    .frost-drift { animation: frost-drift 10s ease-in-out infinite; pointer-events: none; }
    .frost-glow-icon { animation: frost-glow 4s ease-in-out infinite; }
    .t-hero-title {
      background: linear-gradient(90deg, ${c.accent}, ${isDark ? "#bae6fd" : "#1d4ed8"}, ${c.accent});
      background-size: 200% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: frost-shimmer 5s linear infinite;
      ${isDark ? `filter: drop-shadow(0 0 16px ${c.accent}30);` : ""}
    }
    .t-hero-subtitle {
      color: ${c.textSecondary};
    }
    .t-card {
      background: ${c.card};
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border: 1px solid ${c.cardBorder};
      box-shadow: ${c.cardShadow};
      border-radius: 12px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card:hover {
      background: ${c.cardHover || c.card};
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-4px);
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      color: ${c.btnText};
      border: none;
      transition: all 0.3s ease;
    }
    .t-buy-btn:hover {
      filter: brightness(1.08);
      box-shadow: ${c.btnHoverShadow};
      transform: scale(1.02);
    }
    .t-mode-btn {
      background: ${isDark ? "rgba(147,197,253,0.08)" : "rgba(59,130,246,0.06)"};
      border: 1px solid ${isDark ? "rgba(147,197,253,0.15)" : "rgba(59,130,246,0.12)"};
      transition: all 0.3s ease; cursor: pointer; border-radius: 10px;
    }
    .t-mode-btn:hover {
      background: ${isDark ? "rgba(147,197,253,0.14)" : "rgba(59,130,246,0.1)"};
      border-color: ${c.accent}40;
    }
    .t-separator {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${c.accent}25, transparent);
    }
    .t-tag-badge {
      background: ${c.badgeBg};
      border: 1px solid ${c.badgeBorder};
      color: ${c.accent};
    }
    .t-status-badge {
      background: ${isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"};
    }
    .t-discount {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.18))" : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.12))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"};
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-savings-glow {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.12))" : "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.08))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)"};
    }
    .frost-particle {
      position: absolute; width: 3px; height: 3px; border-radius: 50%;
      background: ${c.accent}; pointer-events: none;
      animation: frost-sparkle 4s ease-in-out infinite;
    }
    .frost-orb {
      animation: frost-breathe 6s ease-in-out infinite; pointer-events: none;
    }
    .frost-hex-grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(60deg, ${c.accent}${isDark ? "0a" : "06"} 1px, transparent 1px),
        linear-gradient(-60deg, ${c.accent}${isDark ? "0a" : "06"} 1px, transparent 1px),
        linear-gradient(0deg, ${c.accent}${isDark ? "06" : "04"} 1px, transparent 1px);
      background-size: 50px 86.6px;
      mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 20%, transparent 72%);
      -webkit-mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 20%, transparent 72%);
    }
    .frost-crystal-dots {
      position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(circle 1.2px, ${c.accent}${isDark ? "20" : "14"} 100%, transparent 100%);
      background-size: 50px 86.6px;
      mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 20%, transparent 72%);
      -webkit-mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 20%, transparent 72%);
      animation: frost-breathe 5s ease-in-out infinite;
    }
    .frost-aurora {
      position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 100% 50% at 50% -10%, ${c.accent}${isDark ? "10" : "08"} 0%, transparent 60%),
        radial-gradient(circle at 20% 20%, ${isDark ? "rgba(186,230,253,0.06)" : "rgba(147,197,253,0.04)"} 0%, transparent 50%),
        radial-gradient(circle at 80% 15%, ${isDark ? "rgba(96,165,250,0.05)" : "rgba(59,130,246,0.03)"} 0%, transparent 50%);
    }
    .frost-shard {
      position: absolute; pointer-events: none; border-radius: 2px;
      background: linear-gradient(135deg, ${c.accent}${isDark ? "12" : "08"}, transparent);
      border: 1px solid ${c.accent}${isDark ? "0a" : "06"};
      animation: frost-drift 12s ease-in-out infinite;
    }
    .frost-scanline {
      position: absolute; inset: 0; pointer-events: none; overflow: hidden;
    }
    .frost-scanline::after {
      content: ''; position: absolute; left: 0; right: 0; height: 150px;
      background: linear-gradient(to bottom, transparent, ${c.accent}${isDark ? "04" : "03"}, transparent);
      animation: frost-drift 10s linear infinite;
    }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function FrostBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  return (
    <>
      <div className="frost-hex-grid" />
      <div className="frost-crystal-dots" />
      <div className="frost-aurora" />
      <div className="frost-scanline" />
      <div className="frost-orb absolute top-[-250px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full" style={{ background: `radial-gradient(ellipse at center, ${colors.accent}${isDark ? "12" : "0a"} 0%, transparent 65%)`, filter: "blur(40px)" }} />
      <div className="frost-orb absolute top-[300px] right-[-120px] w-[500px] h-[400px] rounded-full" style={{ background: `radial-gradient(circle, ${isDark ? "rgba(186,230,253,0.06)" : "rgba(147,197,253,0.05)"} 0%, transparent 65%)`, filter: "blur(50px)", animationDelay: "2s" }} />
      <div className="frost-orb absolute bottom-[-80px] left-[-80px] w-[400px] h-[350px] rounded-full" style={{ background: `radial-gradient(circle, ${isDark ? "rgba(96,165,250,0.05)" : "rgba(59,130,246,0.04)"} 0%, transparent 60%)`, filter: "blur(45px)", animationDelay: "4s" }} />
      {[0,1,2,3].map(i => (
        <div key={`shard-${i}`} className="frost-shard" style={{
          width: `${20 + i * 8}px`, height: `${60 + i * 15}px`,
          left: `${15 + i * 22}%`, top: `${5 + (i % 2) * 12}%`,
          transform: `rotate(${30 + i * 25}deg)`,
          animationDelay: `${i * 3}s`, animationDuration: `${10 + i * 2}s`,
        }} />
      ))}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <div key={i} className="frost-particle" style={{ left: `${5 + i * 10}%`, top: `${10 + (i % 5) * 17}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${2.5 + i * 0.4}s`, opacity: isDark ? 0.5 : 0.3 }} />
      ))}
    </>
  );
}

function FrostDivider({ isDark }: { isDark: boolean }) {
  const icyBlue = isDark ? "#93c5fd" : "#3b82f6";
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="h-px flex-1 max-w-24" style={{ background: `linear-gradient(to right, transparent, ${icyBlue}40)` }} />
      <Snowflake className="h-3 w-3" style={{ color: `${icyBlue}60`, filter: `drop-shadow(0 0 3px ${icyBlue}30)` }} />
      <div className="h-px flex-1 max-w-24" style={{ background: `linear-gradient(to left, transparent, ${icyBlue}40)` }} />
    </div>
  );
}

function FrostHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" loading="lazy" style={{ border: `1px solid ${colors.accent}20`, boxShadow: `0 0 8px ${colors.accent}15` }} data-testid="img-store-logo" />
  ) : (
    <div className="frost-glow-icon relative flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.accent}18, ${colors.accentAlt}18)`, border: `1px solid ${colors.accent}20` }}>
      <Snowflake className="h-4 w-4" style={{ color: colors.accent }} />
    </div>
  );
}

export const frostTheme: StorefrontTheme = {
  id: "frost",
  name: "Frost",
  defaultMode: "light",
  colors: frostColors,
  typography: {
    headingFamily: "'Inter', system-ui, -apple-system, sans-serif",
    bodyFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    nameTracking: "tight",
    categoryFont: "'Inter', system-ui, -apple-system, sans-serif",
  },
  layout: {
    maxWidth: "max-w-6xl",
    cardBorderRadius: "12px",
    buttonBorderRadius: "10px",
    categoryBorderRadius: "9999px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
  effects: {
    cardHoverTransform: "translateY(-4px)",
    cardTransition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: frostCss,
  renderBackground: (colors, mode) => <FrostBackground colors={colors} mode={mode} />,
  renderDivider: (isDark) => <FrostDivider isDark={isDark} />,
  renderHeroBadge: (colors) => (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <Snowflake className="h-3.5 w-3.5" style={{ color: colors.accent }} />
      <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${colors.accent}cc` }}>Crystal Clear Quality</span>
    </div>
  ),
  renderCardOverlay: (colors) => (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `linear-gradient(180deg, ${colors.accent}05 0%, transparent 40%, ${colors.accent}03 100%)`,
        borderRadius: "inherit",
      }}
    />
  ),
  renderAnnouncementStyle: (colors, mode) => ({
    background: mode === "dark"
      ? `linear-gradient(135deg, ${colors.accent}14, rgba(96,165,250,0.06), ${colors.accent}0d)`
      : `linear-gradient(135deg, ${colors.accent}10, rgba(59,130,246,0.04), ${colors.accent}08)`,
    borderBottom: `1px solid ${colors.accent}20`,
    backdropFilter: "blur(8px)",
  }),
  renderFooterDecoration: (colors, isDark) => (
    <div className="w-full flex flex-col items-center gap-2 pt-2">
      <div className="w-full max-w-xs h-px" style={{ background: `linear-gradient(90deg, transparent, ${isDark ? "#93c5fd" : "#3b82f6"}30, transparent)` }} />
      <Snowflake className="h-3 w-3" style={{ color: `${colors.accent}40` }} />
    </div>
  ),
  renderHeaderLogo: (store, colors) => <FrostHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Clean, crisp digital products designed with precision and clarity.",
  heroBadgeText: "Crystal Clear Quality",
  announcementStoragePrefix: "frost-announcement",
  modeStorageKey: "frost-mode",
};
