# Storefront themes

Tenant storefronts share a **single base template** ([base-template.tsx](../client/src/components/storefront/base-template.tsx)) and pick one of seven visual themes. Themes are configured via a `StorefrontTheme` object — never via CSS classes — so two stores on the same page (e.g. embed widgets) never collide.

## The contract

```ts
// client/src/components/storefront/theme-types.ts
export interface StorefrontTheme {
  id: string;
  name: string;
  defaultMode: ThemeMode;                    // "dark" | "light"
  colors: (mode, customAccent) => ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  effects: ThemeEffects;
  css: (colors, mode) => string;             // theme-scoped CSS string
  renderBackground?: (colors, mode) => ReactNode;
  renderHeroBadge?: (colors) => ReactNode;
  renderDivider?: (isDark) => ReactNode;
  renderHeaderLogo?: (store, colors) => ReactNode;
  renderCardOverlay?: (colors) => ReactNode;
  renderAnnouncementStyle?: (colors, mode) => CSSProperties;
  renderFooterDecoration?: (colors, isDark) => ReactNode;
  heroSubtitleFallback: string;
  heroBadgeText: string;
  announcementStoragePrefix: string;
  modeStorageKey: string;
}
```

### `ThemeColors` (passed everywhere as `c`)

| Field | Use |
|---|---|
| `bg` / `bgAlt` | Page background, alt section bg |
| `card`, `cardHover` | Product / content card surfaces |
| `cardBorder`, `cardBorderHover` | Card outlines (rest / hover) |
| `cardShadow`, `cardShadowHover` | Card shadow values |
| `headerBorder` | Sticky header underline |
| `text` | Body text |
| `textSecondary`, `textTertiary` | De-emphasized text |
| `accent`, `accentAlt` | Theme highlight (often the configurable accent) |
| `price` | Prominent price color |
| `divider` | Hairline dividers |
| `badgeBg`, `badgeBorder` | "Featured" / "New" pill |
| `btnGradient` | CTA button background (often a gradient) |
| `btnHoverShadow` | Button glow on hover |
| `btnText` | Button label color |
| `shadow` | Generic surface shadow |

### `ThemeTypography`

```ts
{
  headingFamily: string;
  bodyFamily:    string;
  headingWeight: string;
  nameTracking:  string;     // letter-spacing for product names
  categoryFont:  string;     // category nav font
}
```

### `ThemeLayout`

```ts
{
  maxWidth:              string;            // page max-width
  cardBorderRadius:      string;
  buttonBorderRadius:    string;
  categoryBorderRadius:  string;
  productLayout:         "grid" | "list";
  gridColumns:           string;            // CSS grid-template-columns
}
```

### `ThemeEffects`

```ts
{
  cardHoverTransform: string;   // e.g. "translateY(-4px)"
  cardTransition:     string;
  heroTitleClass:     string;
  heroSubtitleClass:  string;
  modeToggleClass:    string;
  cardClass:          string;
  buyBtnClass:        string;
}
```

## Built-in themes

Located in [client/src/components/storefront/themes/](../client/src/components/storefront/themes/).

| Theme | id | Personality |
|---|---|---|
| **Neon** | `neon-theme.tsx` | High-energy gradients, glow accents, animated CTAs |
| **Silk** | `silk-theme.tsx` | Refined editorial, soft serifs, generous whitespace |
| **Aurora** | `aurora-theme.tsx` | Multi-hue gradient surfaces, dreamy backgrounds |
| **Ember** | `ember-theme.tsx` | Warm reds/oranges, dense print-zine feel |
| **Frost** | `frost-theme.tsx` | Cool light mode, glassy translucent panels |
| **Midnight** | `midnight-theme.tsx` | Deep navy/indigo, restrained, premium feel |
| **Launch** | `launch-theme.tsx` | Pre-launch / coming-soon styling |

All themes register via [client/src/components/storefront/themes/index.ts](../client/src/components/storefront/themes/index.ts).

## Mode

Each theme declares `defaultMode` (`"dark"` or `"light"`). Buyers can toggle mode via the storefront header; the choice persists in localStorage under the theme's `modeStorageKey`.

> The **app shell** is dark-only. Only **storefronts** support a mode toggle.

## Custom accent

Every storefront has an optional `accentColor` configured by the owner in dashboard settings. The theme's `colors(mode, customAccent)` factory applies the override to `accent` (and often `price`, `btnGradient`, `badgeBorder`). Themes without a customAccent fall back to a built-in palette.

## Inline styles, not classNames

Storefront sections set styles inline using the resolved `c: ThemeColors`:

```tsx
<article style={{
  background:   c.card,
  border:       `1px solid ${c.cardBorder}`,
  boxShadow:    c.cardShadow,
  borderRadius: theme.layout.cardBorderRadius,
  transition:   theme.effects.cardTransition,
}}>
  …
</article>
```

This is why two tenants with different themes can render on the same page (embed widgets, admin previews) without bleeding into each other.

## Theme-scoped CSS

For things that genuinely need a CSS rule (e.g. hover pseudo-classes, gradient animations), `theme.css(colors, mode)` returns a string that the base template injects inside a `<style>` tag scoped to that storefront's wrapper id. Don't add global classes for theme-specific behavior — return them from `css()` instead.

## Adding a new theme

1. Create `themes/your-theme.tsx` exporting a `StorefrontTheme`.
2. Implement `colors(mode, customAccent)` for both modes.
3. Provide `typography`, `layout`, `effects`.
4. Optional: `renderBackground`, `renderHeroBadge`, `renderDivider`, `renderHeaderLogo`, `renderCardOverlay`, `renderAnnouncementStyle`, `renderFooterDecoration`.
5. Register in `themes/index.ts`.
6. Add it to the dashboard template selector ([template-selector.tsx](../client/src/components/dashboard/template-selector.tsx)).

## Rules

- **No global storefront classes.** Either pass colors via `style={{}}` or return scoped CSS from `theme.css()`.
- **Don't reference app tokens** (`hsl(var(--primary))`) inside storefront components — use `c.accent`, `c.price`, etc.
- **Aspect-square product images.** Even if a theme wants a different feel, product images stay 1:1.
- **Honor the buyer's mode.** Read from the theme's `modeStorageKey`; don't hardcode dark/light.
- **The configurable `accentColor` must be respected by every theme.** It's how owners brand their store.
