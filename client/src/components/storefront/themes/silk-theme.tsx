import { Sparkles } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

function silkColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#0c0a09",
      bgAlt: "#141210",
      card: "#181614",
      cardBorder: `${customAccent || "#d4a853"}1f`,
      cardBorderHover: `${customAccent || "#d4a853"}40`,
      cardShadow: "0 2px 20px rgba(0,0,0,0.3)",
      cardShadowHover: `0 12px 50px ${customAccent || "#d4a853"}14, 0 4px 20px rgba(0,0,0,0.4)`,
      headerBorder: `${customAccent || "#d4a853"}1a`,
      text: "#f5f0e8",
      textSecondary: "rgba(245,240,232,0.55)",
      textTertiary: "rgba(245,240,232,0.3)",
      accent: customAccent || "#d4a853",
      accentAlt: customAccent ? `${customAccent}80` : "#d4a85380",
      price: customAccent || "#d4a853",
      divider: `${customAccent || "#d4a853"}1a`,
      badgeBg: `${customAccent || "#d4a853"}1a`,
      badgeBorder: `${customAccent || "#d4a853"}33`,
      btnGradient: `linear-gradient(135deg, ${customAccent || "#b8860b"}, ${customAccent || "#c9971c"})`,
      btnHoverShadow: `0 4px 20px ${customAccent || "#d4a853"}25`,
      btnText: "#faf8f5",
      shadow: "rgba(0,0,0,0.3)",
    };
  }
  return {
    bg: "#faf8f5",
    bgAlt: "#f5f0e8",
    card: "#ffffff",
    cardBorder: "#e8e0d4",
    cardBorderHover: "#d9cebb",
    cardShadow: "0 2px 16px rgba(180,160,130,0.08)",
    cardShadowHover: "0 12px 50px rgba(180,160,130,0.18), 0 4px 16px rgba(180,160,130,0.08)",
    headerBorder: "#e8e0d4",
    text: "#2d2926",
    textSecondary: "#8a7d6b",
    textTertiary: "#b5a48a",
    accent: customAccent || "#c9a96e",
    accentAlt: customAccent ? `${customAccent}99` : "#b5a48a",
    price: customAccent || "#c9a96e",
    divider: "#f0e9df",
    badgeBg: "#f3ece1",
    badgeBorder: "#e5d9c3",
    btnGradient: `linear-gradient(135deg, ${customAccent || "#8b6914"}, ${customAccent || "#a07d1c"})`,
    btnHoverShadow: `0 4px 20px ${customAccent || "#c9a96e"}25`,
    btnText: "#faf8f5",
    shadow: "rgba(180,160,130,0.08)",
  };
}

function SilkDivider({ isDark }: { isDark: boolean }) {
  const goldColor = isDark ? "#d4a853" : "#c9a96e";
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${goldColor})` }} />
      <Sparkles className="h-3.5 w-3.5" style={{ color: goldColor }} />
      <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${goldColor})` }} />
    </div>
  );
}

function silkCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    @keyframes silk-fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes silk-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes silk-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes silk-border-glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
    .silk-fade-in { animation: silk-fade-in 0.6s ease-out forwards; }
    .silk-fade-in-d1 { animation-delay: 0.1s; opacity: 0; }
    .silk-fade-in-d2 { animation-delay: 0.2s; opacity: 0; }
    .silk-fade-in-d3 { animation-delay: 0.3s; opacity: 0; }
    .silk-float { animation: silk-float 6s ease-in-out infinite; }
    .t-hero-title {
      background: linear-gradient(90deg, ${c.accent}, ${isDark ? "#f0d78c" : "#8a6c2f"}, ${c.accent});
      background-size: 200% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: silk-shimmer 6s linear infinite;
    }
    .t-hero-subtitle {
      color: ${c.textSecondary};
    }
    .t-card {
      background: ${c.card};
      border: 1px solid ${c.cardBorder};
      box-shadow: ${c.cardShadow};
      border-radius: 6px;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .t-card:hover {
      border-color: ${c.cardBorderHover};
      box-shadow: ${c.cardShadowHover};
      transform: translateY(-3px);
    }
    .t-buy-btn {
      background: ${c.btnGradient};
      color: ${c.btnText}; border: 1px solid ${c.accent};
      transition: all 0.3s ease;
    }
    .t-buy-btn:hover {
      filter: brightness(1.1);
      box-shadow: ${c.btnHoverShadow};
    }
    .t-mode-btn {
      background: ${isDark ? "rgba(245,240,232,0.06)" : "rgba(45,41,38,0.04)"};
      border: 1px solid ${isDark ? "rgba(245,240,232,0.1)" : "rgba(45,41,38,0.08)"};
      transition: all 0.3s ease; cursor: pointer; border-radius: 50%;
    }
    .t-mode-btn:hover {
      background: ${isDark ? "rgba(245,240,232,0.1)" : "rgba(45,41,38,0.08)"};
      border-color: ${c.accent}40;
    }
    .t-separator {
      height: 1px;
      background: ${c.divider};
    }
    .t-tag-badge {
      background: ${c.badgeBg};
      border: 1px solid ${c.badgeBorder};
      color: ${c.accent};
    }
    .t-discount {
      background: ${isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)"};
      border: 1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.15)"};
      color: ${isDark ? "#6ee7b7" : "#059669"};
    }
    .silk-ornament { position: relative; }
    .silk-ornament::before, .silk-ornament::after {
      content: ''; position: absolute; top: 50%; width: 40px; height: 1px;
      background: linear-gradient(${isDark ? "to right, transparent, rgba(212,168,83,0.25)" : "to right, transparent, rgba(201,169,110,0.3)"});
    }
    .silk-ornament::before { right: calc(100% + 12px); }
    .silk-ornament::after { left: calc(100% + 12px); transform: scaleX(-1); }
    .sf-reveal-item { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function SilkHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <>
      <img src={store.logoUrl} alt={store.name} className="h-8 w-8 rounded-full object-cover" loading="lazy" style={{ border: `1px solid ${colors.accent}26` }} data-testid="img-store-logo" />
      <span className="text-sm font-serif tracking-[0.3em] uppercase" style={{ color: colors.accentAlt }} data-testid="text-store-name">{store.name}</span>
    </>
  ) : (
    <>
      <div className="h-px w-10" style={{ backgroundColor: colors.accent }} />
      <span className="text-sm font-serif tracking-[0.3em] uppercase" style={{ color: colors.accentAlt }} data-testid="text-store-name">{store.name}</span>
      <div className="h-px w-10" style={{ backgroundColor: colors.accent }} />
    </>
  );
}

export const silkTheme: StorefrontTheme = {
  id: "silk",
  name: "Silk",
  defaultMode: "light",
  colors: silkColors,
  typography: {
    headingFamily: "'Georgia', 'Times New Roman', serif",
    bodyFamily: "'Georgia', 'Times New Roman', serif",
    headingWeight: "700",
    nameTracking: "tight",
    categoryFont: "'Georgia', 'Times New Roman', serif",
  },
  layout: {
    maxWidth: "max-w-5xl",
    cardBorderRadius: "6px",
    buttonBorderRadius: "6px",
    categoryBorderRadius: "6px",
    productLayout: "list",
    gridColumns: "",
  },
  effects: {
    cardHoverTransform: "translateY(-3px)",
    cardTransition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: silkCss,
  renderDivider: (isDark) => <SilkDivider isDark={isDark} />,
  renderHeroBadge: (colors) => (
    <div className="silk-fade-in mb-6">
      <div className="silk-float inline-block px-5 py-1.5 rounded-full text-xs tracking-[0.25em] uppercase font-medium" style={{ backgroundColor: colors.badgeBg, color: colors.accentAlt, border: `1px solid ${colors.badgeBorder}` }}>
        Curated Collection
      </div>
    </div>
  ),
  renderAnnouncementStyle: (colors, mode) => ({
    background: mode === "dark"
      ? `linear-gradient(135deg, ${colors.accent}18, ${colors.accent}0d)`
      : `linear-gradient(135deg, ${colors.accent}14, ${colors.accent}08)`,
    borderBottom: `1px solid ${colors.accent}30`,
  }),
  renderHeaderLogo: (store, colors) => <SilkHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "A thoughtfully curated selection of premium digital goods, crafted with care and attention to detail.",
  heroBadgeText: "Curated Collection",
  announcementStoragePrefix: "silk-announcement",
  modeStorageKey: "silk-mode",
};
