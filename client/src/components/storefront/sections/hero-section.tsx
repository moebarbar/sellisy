import type { Store } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";

interface HeroSectionProps {
  store: Store;
  c: ThemeColors;
  theme: StorefrontTheme;
  isDark: boolean;
}

export function HeroSection({ store, c, theme, isDark }: HeroSectionProps) {
  const heroStyle = theme.layout.heroStyle || "centered";
  const editorial = heroStyle === "editorial";
  const minimal = heroStyle === "minimal";

  // Alignment + scale differ per hero style so themes don't all share one hero.
  const align = editorial ? "text-left" : "text-center";
  const sectionPad = minimal ? "pt-12 pb-14" : "pt-16 pb-20";
  const titleSize = editorial
    ? "text-5xl md:text-6xl lg:text-7xl"
    : minimal
      ? "text-3xl md:text-4xl lg:text-5xl"
      : "text-4xl md:text-5xl lg:text-6xl";
  const subWidth = editorial ? "max-w-xl" : minimal ? "max-w-sm mx-auto" : "max-w-md mx-auto";
  const rowJustify = editorial ? "justify-start" : "justify-center";

  return (
    <section className={`relative z-10 mx-auto ${theme.layout.maxWidth} px-6 ${sectionPad} ${align}`}>
      {store.heroBannerUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-b-2xl" style={{ margin: "0 24px" }}>
          <img src={store.heroBannerUrl} alt="" className="w-full h-full object-cover" loading="lazy" style={{ opacity: isDark ? 0.25 : 0.18 }} data-testid="img-hero-banner" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.bg}99 0%, ${c.bg}bb 50%, ${c.bg} 100%)` }} />
        </div>
      )}
      <div className="relative z-10">
        {theme.renderHeroBadge?.(c)}

        <h1
          className={`${theme.effects.heroTitleClass} ${titleSize} tracking-tight mb-5 leading-tight`}
          style={{ fontFamily: theme.typography.headingFamily, fontWeight: theme.typography.headingWeight }}
        >
          {store.name}
        </h1>

        <p
          className={`${theme.effects.heroSubtitleClass} text-base md:text-lg ${subWidth} font-light leading-relaxed`}
          style={{ fontFamily: theme.typography.bodyFamily }}
          data-testid="text-tagline"
        >
          {store.tagline || theme.heroSubtitleFallback}
        </p>

        {theme.renderDivider ? (
          <div className="mt-8">
            {theme.renderDivider(isDark)}
          </div>
        ) : !minimal ? (
          <div className={`mt-8 flex items-center ${rowJustify} gap-6 flex-wrap`}>
            {["Instant Delivery", "Secure Checkout", "Premium Quality"].map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide" style={{ color: c.textTertiary }}>
                <div className="w-1 h-1 rounded-full" style={{ background: [c.price, c.accentAlt, c.accent][i] }} />
                {label}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
