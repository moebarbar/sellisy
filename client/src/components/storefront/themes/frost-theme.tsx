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
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function FrostBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  const orbA = isDark ? `${colors.accent}12` : `${colors.accent}0a`;
  const orbB = isDark ? "rgba(186,230,253,0.06)" : "rgba(147,197,253,0.08)";
  const orbC = isDark ? "rgba(96,165,250,0.05)" : "rgba(96,165,250,0.06)";
  const glassA = isDark ? "rgba(147,197,253,0.03)" : "rgba(147,197,253,0.05)";
  const glassB = isDark ? "rgba(186,230,253,0.02)" : "rgba(186,230,253,0.04)";
  return (
    <>
      <div className="frost-orb absolute top-[-200px] left-1/3 w-[700px] h-[700px] rounded-full" style={{ background: `radial-gradient(circle, ${orbA} 0%, transparent 70%)` }} />
      <div className="frost-orb absolute top-[300px] right-[-150px] w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${orbB} 0%, transparent 65%)`, animationDelay: "2s" }} />
      <div className="frost-orb absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full" style={{ background: `radial-gradient(circle, ${orbC} 0%, transparent 60%)`, animationDelay: "4s" }} />
      <div className="absolute top-[10%] right-[15%] w-[280px] h-[280px] rounded-[40%_60%_55%_45%] rotate-12" style={{ background: `linear-gradient(135deg, ${glassA}, transparent)`, backdropFilter: "blur(1px)", border: `1px solid ${isDark ? "rgba(147,197,253,0.04)" : "rgba(147,197,253,0.06)"}` }} />
      <div className="absolute top-[55%] left-[8%] w-[200px] h-[200px] rounded-[55%_45%_50%_50%] -rotate-6" style={{ background: `linear-gradient(160deg, ${glassB}, transparent)`, backdropFilter: "blur(1px)", border: `1px solid ${isDark ? "rgba(186,230,253,0.03)" : "rgba(186,230,253,0.05)"}` }} />
      <div className="absolute bottom-[15%] right-[20%] w-[160px] h-[160px] rounded-[45%_55%_60%_40%] rotate-45" style={{ background: `linear-gradient(120deg, ${glassA}, transparent)`, border: `1px solid ${isDark ? "rgba(147,197,253,0.03)" : "rgba(147,197,253,0.04)"}` }} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="frost-particle" style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 4) * 20}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${3 + i * 0.5}s`, opacity: isDark ? 0.5 : 0.3 }} />
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
