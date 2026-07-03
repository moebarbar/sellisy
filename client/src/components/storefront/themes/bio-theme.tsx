import { Sparkles } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

// "Bio" — a mobile-first, link-in-bio storefront for creators who drive traffic
// from Instagram/TikTok. Narrow single column, big rounded pill cards + buttons,
// soft indigo→pink gradient. Products stack like a link list (uses the shared
// "list" layout, like Silk). Light-first with a dark mode.

const INDIGO = "#6366f1";
const PINK = "#ec4899";
const VIOLET = "#7c3aed";

function bioColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const accent = customAccent || INDIGO;
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#12101f",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "rgba(255,255,255,0.04)",
      cardHover: "rgba(255,255,255,0.07)",
      cardBorder: `${accent}2e`,
      cardBorderHover: `${PINK}66`,
      cardShadow: "none",
      cardShadowHover: `0 12px 34px rgba(0,0,0,0.5), 0 0 30px ${accent}1f`,
      headerBorder: `${accent}24`,
      text: "#f5f3ff",
      textSecondary: "rgba(245,243,255,0.6)",
      textTertiary: "rgba(245,243,255,0.38)",
      accent,
      accentAlt: PINK,
      price: "#c4b5fd",
      divider: `${accent}30`,
      badgeBg: `${PINK}14`,
      badgeBorder: `${PINK}3a`,
      btnGradient: `linear-gradient(135deg, ${accent}, ${PINK})`,
      btnHoverShadow: `0 10px 28px ${accent}55`,
      btnText: "#ffffff",
      shadow: "rgba(0,0,0,0.5)",
    };
  }
  return {
    bg: "#faf7ff",
    bgAlt: `${accent}0a`,
    card: "#ffffff",
    cardHover: "#ffffff",
    cardBorder: `${accent}24`,
    cardBorderHover: `${PINK}59`,
    cardShadow: `0 2px 12px ${accent}12`,
    cardShadowHover: `0 12px 30px ${accent}24`,
    headerBorder: `${accent}1a`,
    text: "#1e1b2e",
    textSecondary: "rgba(30,27,46,0.6)",
    textTertiary: "rgba(30,27,46,0.4)",
    accent,
    accentAlt: PINK,
    price: VIOLET,
    divider: `${accent}26`,
    badgeBg: `${PINK}12`,
    badgeBorder: `${PINK}30`,
    btnGradient: `linear-gradient(135deg, ${accent}, ${PINK})`,
    btnHoverShadow: `0 10px 26px ${accent}45`,
    btnText: "#ffffff",
    shadow: `${accent}1f`,
  };
}

function bioCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes bio-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes bio-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes bio-pop { 0% { transform: scale(0.96); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

    .t-hero-title {
      font-family: 'DM Sans', system-ui, sans-serif; font-weight: 800; letter-spacing: -0.02em;
      background: linear-gradient(120deg, ${c.accent}, ${c.accentAlt});
      background-size: 180% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: bio-gradient 6s ease infinite;
    }
    .t-hero-subtitle { font-family: 'DM Sans', system-ui, sans-serif; color: ${c.textSecondary}; }
    .t-card {
      position: relative; background: ${c.card};
      border: 1px solid ${c.cardBorder}; border-radius: 20px;
      box-shadow: ${c.cardShadow};
      transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
      overflow: hidden;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-4px) scale(1.01);
    }
    .t-card:hover .t-card-line-scan { opacity: 1; }
    .t-card-line-scan { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.35s ease;
      background: linear-gradient(120deg, transparent, ${c.accent}0a, transparent); }
    .t-holo-stripe { display: none; }
    .t-buy-btn {
      font-family: 'DM Sans', system-ui, sans-serif; font-weight: 700; border-radius: 9999px;
      background: ${c.btnGradient}; background-size: 180% 180%; animation: bio-gradient 5s ease infinite;
      box-shadow: 0 6px 18px ${c.accent}30; transition: all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1); color: ${c.btnText};
    }
    .t-buy-btn:hover { box-shadow: ${c.btnHoverShadow}; transform: translateY(-2px) scale(1.03); }
    .t-mode-btn {
      background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.06)"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(99,102,241,0.12)"};
      border-radius: 9999px; transition: all 0.3s ease; cursor: pointer;
    }
    .t-mode-btn:hover { border-color: ${c.accent}55; }
    .t-separator { height: 1px; background: linear-gradient(90deg, transparent, ${c.accent}30, ${c.accentAlt}30, transparent); }
    .t-tag-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}26; color: ${isDark ? "#c4b5fd" : c.accent}; }
    .t-status-badge { border-radius: 9999px; background: ${PINK}12; border: 1px solid ${PINK}2e; }
    .t-discount { border-radius: 9999px; background: ${PINK}18; border: 1px solid ${PINK}3a; color: ${isDark ? "#f9a8d4" : "#be185d"}; }
    .t-verified-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}2e; color: ${isDark ? "#c4b5fd" : c.accent}; }
    .t-guarantee-badge { border-radius: 9999px; background: ${c.accent}12; border: 1px solid ${c.accent}2e; color: ${isDark ? "#c4b5fd" : c.accent}; }
    .t-savings-glow { border-radius: 16px; background: ${PINK}0f; border: 1px solid ${PINK}2a; }
    .bio-orb { animation: bio-float 7s ease-in-out infinite; pointer-events: none; }
    .sf-reveal-item { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function BioBackground({ colors }: { colors: ThemeColors; mode: ThemeMode }) {
  return (
    <>
      <div className="bio-orb absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.accent}1f 0%, ${PINK}0d 45%, transparent 70%)` }} />
      <div className="bio-orb absolute top-[500px] right-[-160px] w-[420px] h-[420px] rounded-full" style={{ background: `radial-gradient(circle, ${PINK}14 0%, transparent 62%)`, animationDelay: "2s" }} />
    </>
  );
}

function BioHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" style={{ boxShadow: `0 0 0 3px ${colors.accent}22, 0 6px 16px ${colors.accent}26` }} data-testid="img-store-logo" />
  ) : (
    <div className="bio-orb flex items-center justify-center h-11 w-11 rounded-full font-bold text-white" style={{ background: colors.btnGradient, boxShadow: `0 6px 16px ${colors.accent}30` }}>
      {store.name?.charAt(0)?.toUpperCase() || "S"}
    </div>
  );
}

export const bioTheme: StorefrontTheme = {
  id: "bio",
  name: "Bio",
  defaultMode: "light",
  colors: bioColors,
  typography: {
    headingFamily: "'DM Sans', system-ui, sans-serif",
    bodyFamily: "'DM Sans', system-ui, sans-serif",
    headingWeight: "800",
    nameTracking: "tight",
    categoryFont: "'DM Sans', system-ui, sans-serif",
  },
  layout: {
    maxWidth: "max-w-2xl",
    cardBorderRadius: "20px",
    buttonBorderRadius: "9999px",
    categoryBorderRadius: "9999px",
    productLayout: "list",
    gridColumns: "",
  },
  effects: {
    cardHoverTransform: "translateY(-4px)",
    cardTransition: "all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: bioCss,
  renderBackground: (colors, mode) => <BioBackground colors={colors} mode={mode} />,
  renderHeroBadge: (colors) => (
    <div className="bio-orb inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <Sparkles className="h-3.5 w-3.5" style={{ color: colors.accentAlt }} />
      <span className="text-xs font-semibold tracking-wide" style={{ color: colors.accentAlt }}>My digital shop</span>
    </div>
  ),
  renderAnnouncementStyle: (colors) => ({
    background: colors.btnGradient,
    backgroundSize: "180% 180%",
    animation: "bio-gradient 5s ease infinite",
  }),
  renderHeaderLogo: (store, colors) => <BioHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Everything I make, in one place. Tap in.",
  heroBadgeText: "My digital shop",
  announcementStoragePrefix: "bio-announcement",
  modeStorageKey: "bio-mode",
};
