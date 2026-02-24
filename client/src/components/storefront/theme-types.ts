import type { ReactNode } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  bg: string;
  bgAlt: string;
  card: string;
  cardHover?: string;
  cardBorder: string;
  cardBorderHover: string;
  cardShadow: string;
  cardShadowHover: string;
  headerBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentAlt: string;
  price: string;
  divider: string;
  badgeBg: string;
  badgeBorder: string;
  btnGradient: string;
  btnHoverShadow: string;
  btnText: string;
  shadow: string;
}

export interface ThemeTypography {
  headingFamily: string;
  bodyFamily: string;
  headingWeight: string;
  nameTracking: string;
  categoryFont: string;
}

export interface ThemeLayout {
  maxWidth: string;
  cardBorderRadius: string;
  buttonBorderRadius: string;
  categoryBorderRadius: string;
  productLayout: "grid" | "list";
  gridColumns: string;
}

export interface ThemeEffects {
  cardHoverTransform: string;
  cardTransition: string;
  heroTitleClass: string;
  heroSubtitleClass: string;
  modeToggleClass: string;
  cardClass: string;
  buyBtnClass: string;
}

export interface StorefrontTheme {
  id: string;
  name: string;
  defaultMode: ThemeMode;
  colors: (mode: ThemeMode, customAccent: string | null) => ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  effects: ThemeEffects;
  css: (colors: ThemeColors, mode: ThemeMode) => string;
  renderBackground?: (colors: ThemeColors, mode: ThemeMode) => ReactNode;
  renderHeroBadge?: (colors: ThemeColors) => ReactNode;
  renderDivider?: (isDark: boolean) => ReactNode;
  renderHeaderLogo?: (store: { name: string; logoUrl: string | null }, colors: ThemeColors) => ReactNode;
  renderCardOverlay?: (colors: ThemeColors) => ReactNode;
  renderAnnouncementStyle?: (colors: ThemeColors, mode: ThemeMode) => React.CSSProperties;
  renderFooterDecoration?: (colors: ThemeColors, isDark: boolean) => ReactNode;
  heroSubtitleFallback: string;
  heroBadgeText: string;
  announcementStoragePrefix: string;
  modeStorageKey: string;
}
