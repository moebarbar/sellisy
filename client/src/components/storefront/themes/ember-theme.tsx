import { Flame } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function emberColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#1a0f0a",
      bgAlt: "#231610",
      card: "#2a1a12",
      cardHover: "#33201a",
      cardBorder: `${customAccent || "#e67e22"}1f`,
      cardBorderHover: `${customAccent || "#e67e22"}50`,
      cardShadow: "0 2px 16px rgba(0,0,0,0.3)",
      cardShadowHover: `0 12px 40px ${customAccent || "#e67e22"}18, 0 4px 20px rgba(0,0,0,0.4)`,
      headerBorder: `${customAccent || "#e67e22"}1a`,
      text: "#f5ebe0",
      textSecondary: "rgba(245,235,224,0.6)",
      textTertiary: "rgba(245,235,224,0.3)",
      accent: customAccent || "#e67e22",
      accentAlt: customAccent ? `${customAccent}cc` : "#d4681a",
      price: customAccent || "#f0a04b",
      divider: `${customAccent || "#e67e22"}1a`,
      badgeBg: `${customAccent || "#e67e22"}15`,
      badgeBorder: `${customAccent || "#e67e22"}30`,
      btnGradient: `linear-gradient(135deg, ${customAccent || "#d35400"}, ${customAccent || "#e67e22"})`,
      btnHoverShadow: `0 4px 30px ${customAccent || "#e67e22"}40`,
      btnText: "#fff",
      shadow: "rgba(0,0,0,0.4)",
    };
  }
  return {
    bg: "#fdf6f0",
    bgAlt: "#f8ede3",
    card: "#ffffff",
    cardHover: "#fffaf6",
    cardBorder: "#e8ddd2",
    cardBorderHover: `${customAccent || "#e67e22"}50`,
    cardShadow: "0 2px 16px rgba(180,140,100,0.08)",
    cardShadowHover: `0 12px 40px ${customAccent || "#e67e22"}18, 0 4px 16px rgba(180,140,100,0.1)`,
    headerBorder: "#ecdfd2",
    text: "#3d2b1f",
    textSecondary: "#8a7060",
    textTertiary: "#b5a08a",
    accent: customAccent || "#d35400",
    accentAlt: customAccent ? `${customAccent}99` : "#b5450a",
    price: customAccent || "#c04800",
    divider: "#f0e4d8",
    badgeBg: `${customAccent || "#e67e22"}0d`,
    badgeBorder: `${customAccent || "#e67e22"}20`,
    btnGradient: `linear-gradient(135deg, ${customAccent || "#c04800"}, ${customAccent || "#d35400"})`,
    btnHoverShadow: `0 4px 25px ${customAccent || "#d35400"}30`,
    btnText: "#fff",
    shadow: "rgba(180,140,100,0.1)",
  };
}

function emberCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes ember-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.85; } }
    @keyframes ember-pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.04); opacity: 0.9; } }
    @keyframes ember-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes ember-rise { 0% { transform: translateY(0) scale(1); opacity: 0; } 20% { opacity: 0.6; } 80% { opacity: 0.3; } 100% { transform: translateY(-80px) scale(0.6); opacity: 0; } }
    @keyframes ember-warm-drift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

    .t-hero-title {
      background: linear-gradient(90deg, ${c.accent}, ${isDark ? "#f0c060" : "#8b3a00"}, ${c.accent});
      background-size: 300% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: ember-shimmer 6s linear infinite;
    }
    .t-hero-subtitle {
      color: ${c.textSecondary};
    }
    .t-card {
      background: ${c.card};
      border: 1px solid ${c.cardBorder};
      box-shadow: ${c.cardShadow};
      border-radius: 10px;
      transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-4px);
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      color: ${c.btnText};
      border: none;
      transition: all 0.3s ease;
      font-weight: 700;
    }
    .t-buy-btn:hover {
      filter: brightness(1.1);
      box-shadow: ${c.btnHoverShadow};
      transform: scale(1.02);
    }
    .t-mode-btn {
      background: ${isDark ? "rgba(245,235,224,0.06)" : "rgba(61,43,31,0.05)"};
      border: 1px solid ${isDark ? "rgba(245,235,224,0.1)" : "rgba(61,43,31,0.08)"};
      transition: all 0.3s ease; cursor: pointer;
    }
    .t-mode-btn:hover {
      background: ${isDark ? "rgba(245,235,224,0.1)" : "rgba(61,43,31,0.1)"};
      border-color: ${c.accent}40;
    }
    .t-separator {
      height: 1px;
      background: ${isDark ? `linear-gradient(90deg, transparent, ${c.accent}25, transparent)` : c.divider};
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
      background: ${isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.15)"};
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-savings-glow {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.15))" : "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.1))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)"};
    }
    .ember-glow { animation: ember-glow 3s ease-in-out infinite; pointer-events: none; }
    .ember-warm-drift { animation: ember-warm-drift 5s ease-in-out infinite; }
    .ember-particle {
      position: absolute; width: 3px; height: 3px; border-radius: 50%;
      background: ${c.accent}; pointer-events: none;
      animation: ember-rise 5s ease-in-out infinite;
    }
    .ember-lattice {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(45deg, ${c.accent}${isDark ? "14" : "0c"} 1px, transparent 1px),
        linear-gradient(-45deg, ${c.accent}${isDark ? "14" : "0c"} 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 30%, transparent 75%);
    }
    .ember-lattice-dots {
      position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(circle 1.5px, ${c.accent}${isDark ? "28" : "18"} 100%, transparent 100%);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, black 30%, transparent 75%);
      animation: ember-pulse 5s ease-in-out infinite;
    }
    .ember-warmth {
      position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 100% 60% at 50% -5%, ${c.accent}${isDark ? "1a" : "10"} 0%, transparent 60%),
        radial-gradient(circle at 15% 25%, ${isDark ? "#f0a04b" : "#e67e22"}${isDark ? "14" : "0a"} 0%, transparent 50%),
        radial-gradient(circle at 85% 20%, ${isDark ? "#d35400" : "#c04800"}${isDark ? "10" : "08"} 0%, transparent 50%);
    }
    .ember-heat-line {
      position: absolute; pointer-events: none; height: 1px;
      background: linear-gradient(90deg, transparent, ${c.accent}${isDark ? "35" : "20"}, ${isDark ? "#f0a04b" : "#e67e22"}${isDark ? "28" : "14"}, transparent);
      animation: ember-shimmer 10s linear infinite;
    }
    .ember-glow-spot {
      position: absolute; border-radius: 50%; pointer-events: none;
      animation: ember-pulse 6s ease-in-out infinite;
      filter: blur(50px);
    }
    .ember-ember-float {
      position: absolute; pointer-events: none; border-radius: 50%;
      background: ${c.accent};
      animation: ember-rise 8s ease-out infinite;
    }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function EmberDivider({ isDark }: { isDark: boolean }) {
  const amber = isDark ? "#e67e22" : "#d35400";
  const orange = isDark ? "#f0a04b" : "#e67e22";
  return (
    <div className="flex items-center justify-center py-3">
      <div className="w-full max-w-md h-px" style={{ background: `linear-gradient(90deg, transparent, ${amber}60, ${orange}80, ${amber}60, transparent)` }} />
    </div>
  );
}

function EmberBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  return (
    <>
      <div className="ember-lattice" />
      <div className="ember-lattice-dots" />
      <div className="ember-warmth" />
      <div className="ember-glow-spot" style={{ top: "-200px", left: "25%", width: "600px", height: "600px", background: `radial-gradient(circle, ${colors.accent}${isDark ? "20" : "12"} 0%, transparent 65%)` }} />
      <div className="ember-glow-spot" style={{ top: "100px", right: "-150px", width: "500px", height: "500px", background: `radial-gradient(circle, ${isDark ? "#f0a04b" : "#e67e22"}${isDark ? "18" : "0c"} 0%, transparent 65%)`, animationDelay: "3s" }} />
      <div className="ember-glow-spot" style={{ bottom: "0", left: "-100px", width: "450px", height: "450px", background: `radial-gradient(circle, ${isDark ? "#d35400" : "#c04800"}${isDark ? "14" : "0a"} 0%, transparent 60%)`, animationDelay: "5s" }} />
      {[0,1,2,3,4].map(i => (
        <div key={`heat-${i}`} className="ember-heat-line" style={{ top: `${6 + i * 6}%`, width: `${50 + i * 12}%`, left: `${3 + i * 10}%`, animationDelay: `${i * 2.5}s` }} />
      ))}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <div key={i} className="ember-particle" style={{ left: `${5 + i * 10}%`, bottom: `${5 + (i % 4) * 8}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${3.5 + i * 0.5}s`, opacity: isDark ? (0.5 + (i % 3) * 0.15) : (0.3 + (i % 3) * 0.1) }} />
      ))}
      {[0,1,2,3,4].map(i => (
        <div key={`fl-${i}`} className="ember-ember-float" style={{ width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`, left: `${10 + i * 18}%`, bottom: `${15 + (i % 3) * 12}%`, animationDelay: `${i * 1.5}s`, animationDuration: `${6 + i}s`, opacity: isDark ? 0.4 : 0.2 }} />
      ))}
    </>
  );
}

function EmberCardOverlay({ colors }: { colors: ThemeColors }) {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-[10px]" style={{ background: `linear-gradient(135deg, ${colors.accent}06, transparent 60%, ${colors.accent}04)`, zIndex: 1 }} />
  );
}

function EmberFooterDecoration({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  return (
    <div className="w-full flex justify-center pt-2 pb-4">
      <div className="w-full max-w-xs h-px ember-glow" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}${isDark ? "40" : "30"}, ${isDark ? "#f0a04b" : "#e67e22"}${isDark ? "50" : "35"}, ${colors.accent}${isDark ? "40" : "30"}, transparent)` }} />
    </div>
  );
}

function EmberHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" loading="lazy" style={{ boxShadow: `0 0 10px ${colors.accent}20` }} data-testid="img-store-logo" />
  ) : (
    <div className="relative flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.accent}25, ${colors.accentAlt}20)`, border: `1px solid ${colors.accent}20` }}>
      <Flame className="h-4 w-4" style={{ color: colors.accent }} />
    </div>
  );
}

export const emberTheme: StorefrontTheme = {
  id: "ember",
  name: "Ember",
  defaultMode: "light",
  colors: emberColors,
  typography: {
    headingFamily: "'Inter', system-ui, -apple-system, sans-serif",
    bodyFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: "800",
    nameTracking: "tight",
    categoryFont: "'Inter', system-ui, -apple-system, sans-serif",
  },
  layout: {
    maxWidth: "max-w-6xl",
    cardBorderRadius: "10px",
    buttonBorderRadius: "10px",
    categoryBorderRadius: "10px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
  effects: {
    cardHoverTransform: "translateY(-4px)",
    cardTransition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: emberCss,
  renderDivider: (isDark) => <EmberDivider isDark={isDark} />,
  renderBackground: (colors, mode) => <EmberBackground colors={colors} mode={mode} />,
  renderCardOverlay: (colors) => <EmberCardOverlay colors={colors} />,
  renderFooterDecoration: (colors, isDark) => <EmberFooterDecoration colors={colors} isDark={isDark} />,
  renderHeroBadge: (colors) => (
    <div className="ember-warm-drift inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8" style={{ background: `linear-gradient(135deg, ${colors.accent}18, ${colors.accent}10)`, border: `1px solid ${colors.accent}30`, boxShadow: `0 0 20px ${colors.accent}10` }}>
      <Flame className="h-4 w-4" style={{ color: colors.accent, filter: `drop-shadow(0 0 4px ${colors.accent}60)` }} />
      <span className="text-xs font-bold tracking-wider uppercase" style={{ color: colors.accent }}>Handcrafted Digital Goods</span>
    </div>
  ),
  renderAnnouncementStyle: (colors, mode) => ({
    background: mode === "dark"
      ? `linear-gradient(135deg, ${colors.accent}1a, ${colors.accent}0d)`
      : `linear-gradient(135deg, ${colors.accent}12, ${colors.accent}08)`,
    borderBottom: `1px solid ${colors.accent}25`,
  }),
  renderHeaderLogo: (store, colors) => <EmberHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Bold, handcrafted digital products built with passion and precision.",
  heroBadgeText: "Handcrafted Digital Goods",
  announcementStoragePrefix: "ember-announcement",
  modeStorageKey: "ember-mode",
};
