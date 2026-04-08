import { Zap } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function startupColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const accent = customAccent || "#3b82f6";
  const accentLight = customAccent || "#60a5fa";
  const isDark = mode === "dark";

  if (isDark) {
    return {
      bg: "#09090b",
      bgAlt: "#18181b",
      card: "#0f0f11",
      cardHover: "#141418",
      cardBorder: "#3f3f46",
      cardBorderHover: accent,
      cardShadow: `0 2px 20px rgba(0,0,0,0.6)`,
      cardShadowHover: `0 8px 40px ${accent}22, 0 2px 20px rgba(0,0,0,0.7)`,
      headerBorder: "#27272a",
      text: "#f4f4f5",
      textSecondary: "#a1a1aa",
      textTertiary: "#52525b",
      accent,
      accentAlt: accentLight,
      price: accentLight,
      divider: "#27272a",
      badgeBg: `${accent}12`,
      badgeBorder: `${accent}30`,
      btnGradient: `linear-gradient(135deg, ${accentLight}, #1d4ed8)`,
      btnHoverShadow: `0 0 24px ${accent}50, 0 0 48px ${accent}20`,
      btnText: "#ffffff",
      shadow: "rgba(0,0,0,0.6)",
    };
  }

  return {
    bg: "#fafafa",
    bgAlt: "#f4f4f5",
    card: "#ffffff",
    cardHover: "#fafafa",
    cardBorder: "#e4e4e7",
    cardBorderHover: accent,
    cardShadow: "0 2px 16px rgba(0,0,0,0.06)",
    cardShadowHover: `0 8px 40px ${accent}18, 0 2px 16px rgba(0,0,0,0.08)`,
    headerBorder: "#e4e4e7",
    text: "#09090b",
    textSecondary: "#71717a",
    textTertiary: "#a1a1aa",
    accent,
    accentAlt: customAccent || "#2563eb",
    price: customAccent || "#1d4ed8",
    divider: "#e4e4e7",
    badgeBg: `${accent}0d`,
    badgeBorder: `${accent}25`,
    btnGradient: `linear-gradient(135deg, ${accent}, #1d4ed8)`,
    btnHoverShadow: `0 0 24px ${accent}40, 0 0 48px ${accent}18`,
    btnText: "#ffffff",
    shadow: "rgba(0,0,0,0.06)",
  };
}

function startupCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes startup-beam { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(400%); opacity: 0; } }
    @keyframes startup-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.06); } }
    @keyframes startup-pulse { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.35; transform: scale(1.12); } }
    @keyframes startup-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes startup-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes startup-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .t-hero-title {
      background: linear-gradient(135deg, ${isDark ? "#f4f4f5" : "#09090b"} 0%, ${c.accent} 40%, ${isDark ? "#93c5fd" : "#1d4ed8"} 70%, ${isDark ? "#f4f4f5" : "#09090b"} 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: startup-shimmer 6s linear infinite;
      letter-spacing: -0.02em;
    }
    .t-hero-subtitle { color: ${c.textSecondary}; }
    .t-card {
      background: ${isDark ? "linear-gradient(135deg, rgba(9,9,11,0.8) 0%, rgba(24,24,27,0.9) 100%)" : "#ffffff"};
      border: 1px solid ${c.cardBorder};
      border-radius: 16px;
      box-shadow: ${c.cardShadow};
      transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
      overflow: hidden;
      position: relative;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-3px) scale(1.01);
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      color: ${c.btnText};
      border: 1px solid ${c.accent}50;
      box-shadow: 0 0 0 0 ${c.accent}00;
      transition: all 0.25s ease;
    }
    .t-buy-btn:hover {
      box-shadow: ${c.btnHoverShadow}, 0 0 0 3px ${c.accent}25;
      transform: scale(1.03);
      filter: brightness(1.1);
    }
    .t-buy-btn:active { transform: scale(0.97); }
    .t-mode-btn {
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"};
      border: 1px solid ${isDark ? "#3f3f46" : "#e4e4e7"};
      transition: all 0.2s ease; cursor: pointer; border-radius: 8px;
    }
    .t-mode-btn:hover {
      background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"};
      border-color: ${c.accent}50;
    }
    .t-separator { height: 1px; background: ${c.divider}; }
    .t-tag-badge {
      background: ${isDark ? `${c.accent}14` : `${c.accent}0d`};
      border: 1px solid ${isDark ? `${c.accent}28` : `${c.accent}18`};
      color: ${isDark ? c.accentAlt : c.accent};
      font-family: 'Barlow', system-ui, sans-serif;
      letter-spacing: 0.05em;
    }
    .t-discount {
      background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.2));
      border: 1px solid rgba(16,185,129,0.28);
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-verified-badge {
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.25);
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-guarantee-badge {
      background: ${isDark ? `${c.accent}12` : `${c.accent}08`};
      border: 1px solid ${isDark ? `${c.accent}28` : `${c.accent}18`};
      color: ${isDark ? c.accentAlt : c.accent};
    }
    .t-savings-glow {
      background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.12));
      border: 1px solid rgba(16,185,129,0.18);
    }

    /* Grid background */
    .startup-grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(${isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.08)"} 1px, transparent 1px),
        linear-gradient(90deg, ${isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.08)"} 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%);
    }

    /* Vertical beams */
    .startup-beam {
      position: absolute; top: 0; width: 1px; pointer-events: none;
      background: linear-gradient(to bottom, transparent, ${c.accent}80, transparent);
      animation: startup-beam linear infinite;
    }

    /* Glow orbs */
    .startup-orb { animation: startup-glow 6s ease-in-out infinite; pointer-events: none; }
    .startup-ring { animation: startup-pulse 4s ease-in-out infinite; pointer-events: none; }

    /* Card inner grid overlay */
    .startup-card-grid {
      position: absolute; inset: 0; pointer-events: none; opacity: 0.03;
      background-image:
        linear-gradient(${c.accent} 1px, transparent 1px),
        linear-gradient(90deg, ${c.accent} 1px, transparent 1px);
      background-size: 20px 20px;
    }

    /* Glowing chip */
    .startup-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 9999px;
      background: ${isDark ? `${c.accent}12` : `${c.accent}0a`};
      border: 1px solid ${isDark ? `${c.accent}35` : `${c.accent}25`};
      position: relative; overflow: hidden;
    }
    .startup-chip::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, ${c.accentAlt}80, transparent);
    }

    .sf-reveal-item { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

const BEAMS = [
  { left: "10%", height: 120, duration: "4s", delay: "0s" },
  { left: "25%", height: 160, duration: "5.5s", delay: "1.5s" },
  { left: "40%", height: 100, duration: "3.8s", delay: "0.8s" },
  { left: "55%", height: 140, duration: "4.8s", delay: "2.2s" },
  { left: "70%", height: 120, duration: "5s", delay: "0.4s" },
  { left: "85%", height: 180, duration: "6s", delay: "1.8s" },
];

function StartupBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  return (
    <>
      {/* Grid */}
      <div className="startup-grid" />

      {/* Animated beams */}
      {isDark && BEAMS.map((b, i) => (
        <div
          key={i}
          className="startup-beam"
          style={{
            left: b.left,
            height: b.height,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        />
      ))}

      {/* Top center glow */}
      <div
        className="startup-orb absolute pointer-events-none"
        style={{
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${colors.accent}${isDark ? "20" : "10"} 0%, ${colors.accent}${isDark ? "08" : "04"} 40%, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Pulsing rings */}
      {isDark && (
        <>
          <div className="startup-ring absolute top-24 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{ width: 500, height: 500, border: `1px solid ${colors.accent}18`, marginLeft: -250, marginTop: -250 }}
          />
          <div className="startup-ring absolute top-24 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{ width: 700, height: 700, border: `1px solid ${colors.accent}0d`, marginLeft: -350, marginTop: -350, animationDelay: "2s" }}
          />
        </>
      )}

      {/* Corner glow blobs */}
      <div
        className="startup-orb absolute top-0 left-0 pointer-events-none"
        style={{ width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${colors.accent}${isDark ? "12" : "07"}, transparent)`, filter: "blur(60px)", transform: "translate(-30%, -30%)" }}
      />
      <div
        className="startup-orb absolute top-0 right-0 pointer-events-none"
        style={{ width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${isDark ? "#1d4ed8" : colors.accent}${isDark ? "10" : "06"}, transparent)`, filter: "blur(60px)", transform: "translate(30%, -30%)", animationDelay: "3s" }}
      />
    </>
  );
}

function StartupDivider({ isDark }: { isDark: boolean }) {
  const accent = "#3b82f6";
  return (
    <div className="relative flex items-center justify-center py-1">
      <div style={{ position: "absolute", inset: 0, top: "50%", height: 1, background: `linear-gradient(90deg, transparent, ${accent}30, transparent)` }} />
      <div className="relative flex items-center gap-2">
        <div style={{ width: 4, height: 4, borderRadius: 2, background: `${accent}60`, transform: "rotate(45deg)" }} />
        <div style={{ width: 6, height: 6, borderRadius: 2, background: accent, transform: "rotate(45deg)", boxShadow: `0 0 8px ${accent}` }} />
        <div style={{ width: 4, height: 4, borderRadius: 2, background: `${accent}60`, transform: "rotate(45deg)" }} />
      </div>
    </div>
  );
}

function StartupHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" loading="lazy"
      style={{ border: `1px solid ${colors.accent}30`, boxShadow: `0 0 12px ${colors.accent}20` }}
      data-testid="img-store-logo"
    />
  ) : (
    <div className="flex items-center justify-center w-9 h-9 rounded-lg"
      style={{ background: `linear-gradient(135deg, ${colors.accent}, #1d4ed8)`, boxShadow: `0 0 16px ${colors.accent}40` }}
    >
      <Zap className="h-4 w-4" style={{ color: "#fff" }} />
    </div>
  );
}

export const startupTheme: StorefrontTheme = {
  id: "startup",
  name: "Startup",
  defaultMode: "dark",
  colors: startupColors,
  typography: {
    headingFamily: "'Barlow', system-ui, -apple-system, sans-serif",
    bodyFamily: "'Barlow', system-ui, -apple-system, sans-serif",
    headingWeight: "800",
    nameTracking: "tight",
    categoryFont: "'Barlow', system-ui, -apple-system, sans-serif",
  },
  layout: {
    maxWidth: "max-w-7xl",
    cardBorderRadius: "16px",
    buttonBorderRadius: "8px",
    categoryBorderRadius: "9999px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  effects: {
    cardHoverTransform: "translateY(-3px) scale(1.01)",
    cardTransition: "all 0.3s ease",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: startupCss,
  renderBackground: (colors, mode) => <StartupBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div className="startup-chip mb-8">
      <Zap className="h-3 w-3" style={{ color: colors.accentAlt }} />
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: colors.accentAlt, fontFamily: "'Barlow', system-ui, sans-serif" }}>
        Digital Products
      </span>
    </div>
  ),
  renderCardOverlay: () => <div className="startup-card-grid" />,
  renderDivider: (isDark) => <StartupDivider isDark={isDark} />,
  renderHeaderLogo: (store, colors) => <StartupHeaderLogo store={store} colors={colors} />,
  renderAnnouncementStyle: (colors) => ({
    background: `linear-gradient(135deg, #1e3a8a, ${colors.accent}, #1d4ed8)`,
    backgroundSize: "200% 200%",
  }),
  renderFooterDecoration: (colors, isDark) => (
    <div style={{
      height: 1,
      background: isDark
        ? `linear-gradient(90deg, transparent, ${colors.accent}40, #60a5fa30, transparent)`
        : `linear-gradient(90deg, transparent, ${colors.accent}25, transparent)`,
      marginBottom: 8,
    }} />
  ),
  heroSubtitleFallback: "The best digital products, built for makers and creators who move fast.",
  heroBadgeText: "Digital Products",
  announcementStoragePrefix: "startup-announcement",
  modeStorageKey: "startup-mode",
};
