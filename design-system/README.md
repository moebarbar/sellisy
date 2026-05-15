# Sellisy Design System

The visual language and component primitives that power the Sellisy app — marketing site, owner dashboard, public storefronts, and customer portal.

## Principles

1. **Dark-only.** No light mode toggle on the app shell. Both `:root` and `.dark` resolve to the same dark palette so unscoped components stay coherent.
2. **Yellow is the action color.** `#F5E642` is reserved for primary CTAs, active states, focus rings, and key brand moments — never decorative.
3. **Multi-tenant isolation.** Storefront themes use inline styles via a `ThemeColors` object so two tenants on different themes never collide on shared classnames.
4. **Premium, minimal, editorial.** Sticker-culture aesthetic with restraint — glassy chips, gradient orbs, generous whitespace, sharp typography.
5. **Tokens over magic numbers.** Colors, spacing, radii, shadows, and motion are all driven by CSS variables / Tailwind tokens.

## Files

| File | What's in it |
|---|---|
| [brand.md](brand.md) | Logo, voice, ambient orbs, hero treatments |
| [colors.md](colors.md) | CSS variables, semantic palette, chart palette, status colors |
| [typography.md](typography.md) | Font families, type scale, utility classes (`s-heading`, `s-label`, `cta-mono`) |
| [spacing-radius-shadows.md](spacing-radius-shadows.md) | Spacing scale, border-radius tokens, shadow tokens |
| [components.md](components.md) | Buttons, cards, chips, inputs, the `elevate` interaction system |
| [animations.md](animations.md) | Keyframes, scroll-reveal, ambient drift, motion preferences |
| [storefront-themes.md](storefront-themes.md) | Neon, Silk, Aurora, Ember, Frost, Midnight, Launch + the `ThemeColors` contract |
| [layout.md](layout.md) | Breakpoints, dashboard shell, storefront sections, grid patterns |
| [tokens.json](tokens.json) | Machine-readable token export |

## Source of truth

The runtime source of truth lives in:

- [client/src/index.css](../client/src/index.css) — CSS variables, utility layers, keyframes
- [tailwind.config.ts](../tailwind.config.ts) — Tailwind theme extension
- [client/src/components/storefront/theme-types.ts](../client/src/components/storefront/theme-types.ts) — `StorefrontTheme` / `ThemeColors` interfaces
- [client/src/components/storefront/themes/](../client/src/components/storefront/themes/) — built-in storefront themes

If something here drifts from the code, the code wins — update these docs.
