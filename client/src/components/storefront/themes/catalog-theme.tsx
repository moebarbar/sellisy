import { Search } from "lucide-react";
import type { StorefrontTheme, ThemeColors, ThemeMode } from "../theme-types";

// "Catalog" — a dense, neutral marketplace layout for stores with MANY
// products. Wide container, compact 5-up grid, square thumbnails, quiet chrome
// so the products (not the theme) carry the page. Light-first, crisp.

function catalogColors(mode: ThemeMode, customAccent: string | null): ThemeColors {
  const accent = customAccent || "#2563eb";
  const isDark = mode === "dark";
  if (isDark) {
    return {
      bg: "#0b0d10",
      bgAlt: "rgba(255,255,255,0.02)",
      card: "#131619",
      cardHover: "#171b1f",
      cardBorder: "rgba(255,255,255,0.08)",
      cardBorderHover: `${accent}66`,
      cardShadow: "none",
      cardShadowHover: "0 8px 24px rgba(0,0,0,0.5)",
      headerBorder: "rgba(255,255,255,0.08)",
      text: "#f3f4f6",
      textSecondary: "rgba(243,244,246,0.6)",
      textTertiary: "rgba(243,244,246,0.4)",
      accent,
      accentAlt: accent,
      price: "#f3f4f6",
      divider: "rgba(255,255,255,0.08)",
      badgeBg: `${accent}1a`,
      badgeBorder: `${accent}33`,
      btnGradient: accent,
      btnHoverShadow: `0 6px 18px ${accent}45`,
      btnText: "#ffffff",
      shadow: "rgba(0,0,0,0.5)",
    };
  }
  return {
    bg: "#f8fafc",
    bgAlt: "#ffffff",
    card: "#ffffff",
    cardHover: "#ffffff",
    cardBorder: "rgba(15,23,42,0.1)",
    cardBorderHover: `${accent}66`,
    cardShadow: "0 1px 2px rgba(15,23,42,0.06)",
    cardShadowHover: "0 8px 24px rgba(15,23,42,0.12)",
    headerBorder: "rgba(15,23,42,0.08)",
    text: "#0f172a",
    textSecondary: "rgba(15,23,42,0.6)",
    textTertiary: "rgba(15,23,42,0.42)",
    accent,
    accentAlt: accent,
    price: "#0f172a",
    divider: "rgba(15,23,42,0.08)",
    badgeBg: `${accent}12`,
    badgeBorder: `${accent}26`,
    btnGradient: accent,
    btnHoverShadow: `0 6px 18px ${accent}40`,
    btnText: "#ffffff",
    shadow: "rgba(15,23,42,0.1)",
  };
}

function catalogCss(c: ThemeColors, mode: ThemeMode): string {
  const isDark = mode === "dark";
  return `
    .t-hero-title { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; letter-spacing: -0.03em; color: ${c.text}; }
    .t-hero-subtitle { font-family: 'Inter', system-ui, sans-serif; color: ${c.textSecondary}; }
    .t-card {
      position: relative; background: ${c.card};
      border: 1px solid ${c.cardBorder}; border-radius: 10px;
      box-shadow: ${c.cardShadow};
      transition: all 0.18s ease; overflow: hidden;
    }
    .t-card:hover { border-color: ${c.cardBorderHover}; box-shadow: ${c.cardShadowHover}; transform: translateY(-2px); }
    .t-card-line-scan, .t-holo-stripe { display: none; }
    .t-buy-btn {
      font-family: 'Inter', system-ui, sans-serif; font-weight: 600; border-radius: 8px;
      background: ${c.btnGradient}; color: ${c.btnText}; transition: all 0.18s ease;
    }
    .t-buy-btn:hover { box-shadow: ${c.btnHoverShadow}; filter: brightness(1.05); }
    .t-mode-btn {
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"};
      border-radius: 8px; transition: all 0.18s ease; cursor: pointer;
    }
    .t-mode-btn:hover { border-color: ${c.accent}55; }
    .t-separator { height: 1px; background: ${c.divider}; }
    .t-tag-badge { border-radius: 6px; background: ${c.accent}12; border: 1px solid ${c.accent}26; color: ${c.accent}; }
    .t-status-badge { border-radius: 6px; background: ${c.accent}12; border: 1px solid ${c.accent}26; }
    .t-discount { border-radius: 6px; background: #ef444418; border: 1px solid #ef444433; color: ${isDark ? "#fca5a5" : "#dc2626"}; }
    .t-verified-badge { border-radius: 6px; background: #10b98118; border: 1px solid #10b98130; color: ${isDark ? "#6ee7b7" : "#059669"}; }
    .t-guarantee-badge { border-radius: 6px; background: ${c.accent}12; border: 1px solid ${c.accent}26; color: ${c.accent}; }
    .t-savings-glow { border-radius: 8px; background: #10b9810f; border: 1px solid #10b98126; }
    .sf-reveal-item { opacity: 0; transform: translateY(14px); transition: opacity 0.4s ease, transform 0.4s ease; }
    .sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
  `;
}

function CatalogHeaderLogo({ store, colors }: { store: { name: string; logoUrl: string | null }; colors: ThemeColors }) {
  return store.logoUrl ? (
    <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-md object-cover" loading="lazy" data-testid="img-store-logo" />
  ) : (
    <div className="flex items-center justify-center h-9 w-9 rounded-md text-white font-bold" style={{ background: colors.accent }}>
      {store.name?.charAt(0)?.toUpperCase() || "S"}
    </div>
  );
}

export const catalogTheme: StorefrontTheme = {
  id: "catalog",
  name: "Catalog",
  defaultMode: "light",
  colors: catalogColors,
  typography: {
    headingFamily: "'Inter', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    headingWeight: "700",
    nameTracking: "tight",
    categoryFont: "'Inter', system-ui, sans-serif",
  },
  layout: {
    maxWidth: "max-w-7xl",
    cardBorderRadius: "10px",
    buttonBorderRadius: "8px",
    categoryBorderRadius: "8px",
    productLayout: "grid",
    gridColumns: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    imageAspect: "aspect-square",
    heroStyle: "minimal",
  },
  effects: {
    cardHoverTransform: "translateY(-2px)",
    cardTransition: "all 0.18s ease",
    heroTitleClass: "t-hero-title",
    heroSubtitleClass: "t-hero-subtitle",
    modeToggleClass: "t-mode-btn",
    cardClass: "t-card",
    buyBtnClass: "t-buy-btn",
  },
  css: catalogCss,
  renderHeroBadge: (colors) => (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: colors.badgeBg, border: `1px solid ${colors.badgeBorder}` }}>
      <Search className="h-3.5 w-3.5" style={{ color: colors.accent }} />
      <span className="text-xs font-semibold" style={{ color: colors.accent }}>Browse the collection</span>
    </div>
  ),
  renderHeaderLogo: (store, colors) => <CatalogHeaderLogo store={store} colors={colors} />,
  heroSubtitleFallback: "Every product in one place — browse, filter, and grab what you need.",
  heroBadgeText: "Browse the collection",
  announcementStoragePrefix: "catalog-announcement",
  modeStorageKey: "catalog-mode",
};
