import { Rocket } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

// "Launchpad" — a focused, single-product sales-page layout for creators
// selling ONE flagship offer (a course, an ebook, a big bundle). Narrow column,
// oversized editorial hero, wide landscape product cards stacked like a sales
// page, and a confident emerald "buy" accent. Dark-first, high-contrast.

const EMERALD = "#10b981";

function launchpadColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const accent = customAccent || EMERALD;
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#08090b",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "#101214",
      cardHover: "#14171a",
      cardBorder: "rgba(255,255,255,0.09)",
      cardBorderHover: `${accent}80`,
      cardShadow: "none",
      cardShadowHover: `0 18px 50px rgba(0,0,0,0.6), 0 0 40px ${accent}1f`,
      headerBorder: "rgba(255,255,255,0.08)",
      text: "#f9fafb",
      textSecondary: "rgba(249,250,251,0.62)",
      textTertiary: "rgba(249,250,251,0.4)",
      accent,
      accentAlt: accent,
      price: accent,
      divider: "rgba(255,255,255,0.09)",
      badgeBg: `${accent}14`,
      badgeBorder: `${accent}3a`,
      btnGradient: `linear-gradient(135deg, ${accent}, #059669)`,
      btnHoverShadow: `0 10px 30px ${accent}55`,
      btnText: "#04140d",
      shadow: "rgba(0,0,0,0.6)",
    };
  }
  return {
    bg: "#ffffff",
    bgAlt: "#f6fdf9",
    card: "#ffffff",
    cardHover: "#ffffff",
    cardBorder: "rgba(2,44,34,0.12)",
    cardBorderHover: `${accent}80`,
    cardShadow: "0 1px 2px rgba(2,44,34,0.06)",
    cardShadowHover: `0 18px 44px rgba(2,44,34,0.14)`,
    headerBorder: "rgba(2,44,34,0.08)",
    text: "#04140d",
    textSecondary: "rgba(4,20,13,0.62)",
    textTertiary: "rgba(4,20,13,0.42)",
    accent,
    accentAlt: accent,
    price: "#047857",
    divider: "rgba(2,44,34,0.1)",
    badgeBg: `${accent}12`,
    badgeBorder: `${accent}30`,
    btnGradient: `linear-gradient(135deg, ${accent}, #059669)`,
    btnHoverShadow: `0 10px 26px ${accent}40`,
    btnText: "#ffffff",
    shadow: "rgba(2,44,34,0.1)",
  };
}

function launchpadCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes lp-pulse { 0%, 100% { box-shadow: 0 0 0 0 ${c.accent}45; } 50% { box-shadow: 0 0 0 8px ${c.accent}00; } }
    .t-hero-title { font-family: 'Inter', system-ui, sans-serif; font-weight: 900; letter-spacing: -0.035em; color: ${c.text}; }
    .t-hero-subtitle { font-family: 'Inter', system-ui, sans-serif; color: ${c.textSecondary}; }
    .t-card {
      position: relative; background: ${c.card};
      border: 1px solid ${c.cardBorder}; border-radius: 18px;
      box-shadow: ${c.cardShadow};
      transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1); overflow: hidden;
    }
    .t-card:hover { border-color: ${c.cardBorderHover}; box-shadow: ${c.cardShadowHover}; transform: translateY(-4px); }
    .t-card-line-scan, .t-holo-stripe { display: none; }
    .t-buy-btn {
      font-family: 'Inter', system-ui, sans-serif; font-weight: 800; border-radius: 12px;
      background: ${c.btnGradient}; color: ${c.btnText}; transition: all 0.25s ease;
      animation: lp-pulse 2.6s ease-in-out infinite;
    }
    .t-buy-btn:hover { box-shadow: ${c.btnHoverShadow}; transform: translateY(-2px) scale(1.02); animation: none; }
    .t-mode-btn {
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(2,44,34,0.05)"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(2,44,34,0.1)"};
      border-radius: 10px; transition: all 0.2s ease; cursor: pointer;
    }
    .t-mode-btn:hover { border-color: ${c.accent}55; }
    .t-separator { height: 1px; background: linear-gradient(90deg, transparent, ${c.accent}40, transparent); }
    .t-tag-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}2e; color: ${isDark ? c.accent : "#047857"}; }
    .t-status-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}2e; }
    .t-discount { border-radius: 9999px; background: #f9731618; border: 1px solid #f9731633; color: ${isDark ? "#fdba74" : "#c2410c"}; }
    .t-verified-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}2e; color: ${isDark ? c.accent : "#047857"}; }
    .t-guarantee-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}2e; color: ${isDark ? c.accent : "#047857"}; }
    .t-savings-glow { border-radius: 14px; background: ${c.accent}0f; border: 1px solid ${c.accent}26; }
    .lp-orb { animation: none; pointer-events: none; }
    .sf-reveal-item { opacity: 0; transform: translateY(22px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function LaunchpadBackground({ colors }: { colors: ThemeColors; mode: ThemeMode }) {
  return (
    <div className="lp-orb absolute top-[-220px] left-1/2 -translate-x-1/2 w-[760px] h-[520px] rounded-full" style={{ background: `radial-gradient(ellipse, ${colors.accent}18 0%, transparent 68%)` }} />
  );
}

function LaunchpadHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-10 w-10 rounded-xl object-cover" loading="lazy" style={{ boxShadow: `0 0 0 3px ${colors.accent}20` }} data-testid="img-store-logo" />
  ) : (
    <div className="flex items-center justify-center h-10 w-10 rounded-xl text-white font-black" style={{ background: colors.btnGradient }}>
      {store.name?.charAt(0)?.toUpperCase() || "S"}
    </div>
  );
}

export const launchpadTheme: StorefrontTheme = {
  id: "launchpad",
  name: "Launchpad",
  defaultMode: "dark",
  colors: launchpadColors,
  typography: {
    headingFamily: "'Inter', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    headingWeight: "900",
    nameTracking: "tight",
    categoryFont: "'Inter', system-ui, sans-serif",
  },
  layout: {
    maxWidth: "max-w-3xl",
    cardBorderRadius: "18px",
    buttonBorderRadius: "12px",
    categoryBorderRadius: "9999px",
    productLayout: "list",
    gridColumns: "",
    imageAspect: "aspect-video",
    heroStyle: "editorial",
  },
  effects: {
    cardHoverTransform: "translateY(-4px)",
    cardTransition: "all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: launchpadCss,
  renderBackground: (colors, mode) => <LaunchpadBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <Rocket className="h-3.5 w-3.5" style={{ color: colors.accent }} />
      <span className="text-xs font-bold tracking-wide" style={{ color: colors.accent }}>The one thing you need</span>
    </div>
  ),
  renderHeaderLogo: (store, colors) => <LaunchpadHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "One offer, zero distractions. Everything you need, right here.",
  heroBadgeText: "The one thing you need",
  announcementStoragePrefix: "launchpad-announcement",
  modeStorageKey: "launchpad-mode",
};
