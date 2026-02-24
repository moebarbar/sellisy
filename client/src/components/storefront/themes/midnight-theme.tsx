import { Moon, Star } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function midnightColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#08081a",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "rgba(255,255,255,0.04)",
      cardHover: "rgba(255,255,255,0.07)",
      cardBorder: `${customAccent || "#818cf8"}1a`,
      cardBorderHover: `${customAccent || "#818cf8"}50`,
      cardShadow: "0 2px 16px rgba(0,0,0,0.4)",
      cardShadowHover: `0 12px 48px ${customAccent || "#818cf8"}14, 0 4px 24px rgba(0,0,0,0.5)`,
      headerBorder: `${customAccent || "#818cf8"}1a`,
      text: "#eef0ff",
      textSecondary: "rgba(238,240,255,0.5)",
      textTertiary: "rgba(238,240,255,0.25)",
      accent: customAccent || "#818cf8",
      accentAlt: "#a78bfa",
      price: "#c4b5fd",
      divider: `${customAccent || "#818cf8"}20`,
      badgeBg: `${customAccent || "#818cf8"}0d`,
      badgeBorder: `${customAccent || "#818cf8"}1a`,
      btnGradient: `linear-gradient(135deg, ${customAccent || "#6366f1"}, #7c3aed)`,
      btnHoverShadow: `0 0 30px ${customAccent || "#6366f1"}40, 0 0 60px #7c3aed20`,
      btnText: "#fff",
      shadow: "rgba(0,0,0,0.5)",
    };
  }
  return {
    bg: "#f4f3ff",
    bgAlt: `${customAccent || "#818cf8"}08`,
    card: "rgba(255,255,255,0.9)",
    cardHover: "rgba(255,255,255,0.98)",
    cardBorder: `${customAccent || "#818cf8"}20`,
    cardBorderHover: `${customAccent || "#818cf8"}50`,
    cardShadow: "0 2px 16px rgba(99,102,241,0.06)",
    cardShadowHover: `0 12px 48px ${customAccent || "#818cf8"}14, 0 4px 16px rgba(99,102,241,0.08)`,
    headerBorder: `${customAccent || "#818cf8"}20`,
    text: "#1e1b4b",
    textSecondary: "rgba(30,27,75,0.55)",
    textTertiary: "rgba(30,27,75,0.3)",
    accent: customAccent || "#6366f1",
    accentAlt: "#7c3aed",
    price: "#4f46e5",
    divider: `${customAccent || "#818cf8"}20`,
    badgeBg: `${customAccent || "#818cf8"}0a`,
    badgeBorder: `${customAccent || "#818cf8"}18`,
    btnGradient: `linear-gradient(135deg, ${customAccent || "#4f46e5"}, #6d28d9)`,
    btnHoverShadow: `0 0 30px ${customAccent || "#4f46e5"}40, 0 0 60px #6d28d920`,
    btnText: "#fff",
    shadow: `${customAccent || "#818cf8"}12`,
  };
}

function midnightCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes midnight-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
    @keyframes midnight-glow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.08); } }
    @keyframes midnight-drift { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes midnight-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes midnight-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes midnight-pulse { 0%, 100% { filter: brightness(1) drop-shadow(0 0 2px ${c.accent}30); } 50% { filter: brightness(1.1) drop-shadow(0 0 6px ${c.accent}50); } }

    .t-hero-title {
      background: linear-gradient(90deg, ${c.accent}, ${c.accentAlt}, ${isDark ? "#c4b5fd" : "#4f46e5"}, ${c.accent});
      background-size: 300% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: midnight-gradient 8s ease infinite;
      ${isDark ? `filter: drop-shadow(0 0 18px ${c.accent}30);` : ""}
    }
    .t-hero-subtitle {
      background: linear-gradient(90deg, ${isDark ? "rgba(238,240,255,0.35), rgba(238,240,255,0.7), rgba(129,140,248,0.8), rgba(238,240,255,0.7), rgba(238,240,255,0.35)" : "rgba(30,27,75,0.3), rgba(30,27,75,0.65), rgba(99,102,241,0.7), rgba(30,27,75,0.65), rgba(30,27,75,0.3)"});
      background-size: 400% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: midnight-shimmer 5s linear infinite;
    }
    .t-card {
      position: relative;
      background: ${c.card};
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid ${c.cardBorder};
      border-radius: 14px;
      box-shadow: ${c.cardShadow};
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 14px; padding: 1px;
      background: linear-gradient(135deg, ${c.accent}25, ${c.accentAlt}15, transparent);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0; transition: opacity 0.5s ease; pointer-events: none;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-4px);
    }
    .t-card:hover::before {
      opacity: 1;
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      background-size: 200% 200%; animation: midnight-gradient 5s ease infinite;
      box-shadow: 0 0 16px ${c.accent}20, 0 0 32px ${c.accentAlt}10;
      transition: all 0.3s ease; color: ${c.btnText};
    }
    .t-buy-btn:hover {
      box-shadow: ${c.btnHoverShadow};
      transform: scale(1.03);
    }
    .t-mode-btn {
      background: ${isDark ? "rgba(238,240,255,0.06)" : "rgba(30,27,75,0.06)"};
      border: 1px solid ${isDark ? "rgba(238,240,255,0.1)" : "rgba(30,27,75,0.1)"};
      transition: all 0.3s ease; cursor: pointer;
    }
    .t-mode-btn:hover {
      background: ${isDark ? "rgba(238,240,255,0.1)" : "rgba(30,27,75,0.1)"};
      border-color: ${c.accent}40;
    }
    .t-separator {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${c.accent}25, ${c.accentAlt}20, transparent);
    }
    .t-tag-badge {
      background: ${isDark ? `${c.accent}12` : `${c.accent}0d`};
      border: 1px solid ${isDark ? `${c.accent}22` : `${c.accent}15`};
      color: ${c.accent};
    }
    .t-status-badge {
      background: ${isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"};
    }
    .t-discount {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.2))" : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.12))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.18)"};
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .t-savings-glow {
      background: ${isDark ? "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(5,150,105,0.12))" : "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.08))"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)"};
    }
    .midnight-star {
      position: absolute; border-radius: 50%;
      background: ${isDark ? "rgba(238,240,255,0.6)" : "rgba(99,102,241,0.3)"};
      pointer-events: none;
      animation: midnight-twinkle 3s ease-in-out infinite;
    }
    .midnight-orb { animation: midnight-glow 5s ease-in-out infinite; pointer-events: none; }
    .midnight-float { animation: midnight-drift 7s ease-in-out infinite; }
    .midnight-pulse-icon { animation: midnight-pulse 4s ease-in-out infinite; }
    .midnight-nebula {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 70% 40% at 50% 0%, ${c.accent}08 0%, transparent 70%);
    }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function MidnightBackground({ colors, mode }: { colors: ThemeColors; mode: ThemeMode }) {
  const isDark = mode === "dark";
  const stars = isDark
    ? Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        top: `${(i * 13 + 3) % 100}%`,
        size: i % 3 === 0 ? 2 : 1,
        delay: `${(i * 0.7) % 5}s`,
        duration: `${2.5 + (i % 4) * 1.2}s`,
      }))
    : [];

  return (
    <>
      <div className="midnight-nebula" />
      <div className="midnight-orb absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.accent}12 0%, ${colors.accentAlt}06 40%, transparent 70%)` }} />
      <div className="midnight-orb absolute top-[500px] right-[-150px] w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.accentAlt}08 0%, transparent 60%)`, animationDelay: "2.5s" }} />
      <div className="midnight-orb absolute bottom-[-80px] left-[-150px] w-[400px] h-[400px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.accent}0a 0%, transparent 60%)`, animationDelay: "4s" }} />
      {stars.map((s) => (
        <div
          key={s.id}
          className="midnight-star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </>
  );
}

function MidnightHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-lg object-cover" loading="lazy" style={{ boxShadow: `0 0 10px ${colors.accent}20` }} data-testid="img-store-logo" />
  ) : (
    <div className="midnight-pulse-icon relative flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.accent}18, ${colors.accentAlt}18)`, border: `1px solid ${colors.accent}20` }}>
      <Moon className="h-4 w-4" style={{ color: colors.accent }} />
    </div>
  );
}

export const midnightTheme: StorefrontTheme = {
  id: "midnight",
  name: "Midnight",
  defaultMode: "dark",
  colors: midnightColors,
  typography: {
    headingFamily: "'Inter', system-ui, -apple-system, sans-serif",
    bodyFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    nameTracking: "tight",
    categoryFont: "'Inter', system-ui, -apple-system, sans-serif",
  },
  layout: {
    maxWidth: "max-w-6xl",
    cardBorderRadius: "14px",
    buttonBorderRadius: "10px",
    categoryBorderRadius: "9999px",
    productLayout: "grid",
    gridColumns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
  effects: {
    cardHoverTransform: "translateY(-4px)",
    cardTransition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: midnightCss,
  renderBackground: (colors, mode) => <MidnightBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div className="midnight-float inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <Star className="h-3.5 w-3.5" style={{ color: colors.accentAlt }} />
      <span className="text-xs font-medium tracking-wider uppercase" style={{ color: `${colors.accent}cc` }}>Midnight Collection</span>
    </div>
  ),
  renderAnnouncementStyle: (colors) => ({
    background: colors.btnGradient,
    backgroundSize: "200% 200%",
    animation: "midnight-gradient 5s ease infinite",
  }),
  renderHeaderLogo: (store, colors) => <MidnightHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Exclusive digital products designed for the discerning creator.",
  heroBadgeText: "Midnight Collection",
  announcementStoragePrefix: "midnight-announcement",
  modeStorageKey: "midnight-mode",
};
