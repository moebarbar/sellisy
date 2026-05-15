# Colors

All colors are defined as HSL CSS variables in [client/src/index.css](../client/src/index.css). Tailwind reads them via `hsl(var(--token) / <alpha-value>)` so opacity modifiers like `bg-primary/20` work everywhere.

`:root` and `.dark` are set to **identical values** — Sellisy is dark-only, but the duplication keeps `class="dark"` consumers safe.

## Core surfaces

| Token | HSL | Hex | Use |
|---|---|---|---|
| `--background` | `0 0% 2%` | `#050505` | App / page background |
| `--foreground` | `55 56% 97%` | `#FAFAF5` | Default text |
| `--card` | `0 0% 4%` | `#0a0a0a` | Card / surface bg |
| `--card-foreground` | `55 20% 90%` | — | Text on cards |
| `--card-border` | `0 0% 10%` | — | Card outline |
| `--popover` | `0 0% 4%` | — | Menus, dropdowns |
| `--popover-border` | `0 0% 14%` | — | Popover outline |
| `--border` | `0 0% 12%` | — | Default border |
| `--input` | `0 0% 12%` | — | Input border / bg |

## Brand & semantic

| Token | HSL | Hex | Use |
|---|---|---|---|
| `--primary` | `53 91% 61%` | `#F5E642` | CTAs, active states, focus ring, accents |
| `--primary-foreground` | `0 0% 2%` | `#050505` | Text on primary fills |
| `--secondary` | `0 0% 10%` | — | Secondary buttons / chips |
| `--secondary-foreground` | `55 20% 90%` | — | |
| `--muted` | `0 0% 8%` | — | Subtle fills, code bg |
| `--muted-foreground` | `0 0% 45%` | — | Helper / placeholder text |
| `--accent` | `0 0% 8%` | — | Hover-tint surfaces |
| `--accent-foreground` | `53 91% 61%` | `#F5E642` | Yellow-on-dark for highlighted text |
| `--destructive` | `0 72% 51%` | — | Delete, error |
| `--destructive-foreground` | `0 0% 100%` | `#FFF` | |
| `--ring` | `53 91% 61%` | `#F5E642` | Focus ring |

## Sidebar (dashboard)

| Token | HSL | Use |
|---|---|---|
| `--sidebar` | `0 0% 4%` | Sidebar bg |
| `--sidebar-foreground` | `55 20% 90%` | Sidebar text |
| `--sidebar-border` | `0 0% 12%` | Right edge |
| `--sidebar-primary` | `53 91% 61%` | Active item fill |
| `--sidebar-primary-foreground` | `0 0% 2%` | Text on active item |
| `--sidebar-accent` | `0 0% 8%` | Hover bg |
| `--sidebar-accent-foreground` | `53 91% 61%` | Hover text |
| `--sidebar-ring` | `53 91% 61%` | Focus ring |

## Charts

Used for analytics dashboards. Distinct hues, all readable on `#0a0a0a`.

| Token | HSL | Hex (approx) |
|---|---|---|
| `--chart-1` | `53 91% 61%` | `#F5E642` (primary yellow) |
| `--chart-2` | `168 100% 48%` | teal `#00F5C7` |
| `--chart-3` | `18 100% 60%` | orange `#FF7A33` |
| `--chart-4` | `326 100% 62%` | pink `#FF3D9F` |
| `--chart-5` | `160 100% 36%` | green `#00B873` |

## Status (presence)

Hard-coded in `tailwind.config.ts` because they map to industry conventions:

| Token | Color |
|---|---|
| `status.online` | `rgb(34 197 94)` (green-500) |
| `status.away` | `rgb(245 158 11)` (amber-500) |
| `status.busy` | `rgb(239 68 68)` (red-500) |
| `status.offline` | `rgb(156 163 175)` (gray-400) |

## Elevate overlays

These drive the [elevate interaction system](components.md#elevate-system).

```css
--elevate-1: rgba(255,255,255, .04);  /* hover tint */
--elevate-2: rgba(255,255,255, .09);  /* active / toggled tint */
--button-outline: rgba(255,255,255, .10);
--badge-outline: rgba(255,255,255, .05);
--opaque-button-border-intensity: 9;   /* lightness boost for opaque borders */
```

## Auto-derived borders

Each colored surface (`primary`, `secondary`, `muted`, `accent`, `destructive`, `sidebar-primary`, `sidebar-accent`) has a matching `--*-border` derived via the modern relative-color syntax:

```css
--primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
```

This boosts lightness by 9 percentage points so opaque-fill buttons get a subtle but readable rim without a hand-picked second color.

## Rules

- **Primary yellow is sacred.** Never use it for decoration or large fills outside CTAs/active states. Use `accent-foreground` for yellow text-on-dark moments.
- **No raw blues.** Former blue accents in the codebase have all been replaced with primary/yellow. The only legitimate blues are third-party brand colors (Twitter/X, etc.) on share buttons.
- **Use semantic tokens, not raw hex,** outside the landing-page brand palette and storefront themes. The landing page has its own `.landing-page`-scoped accent palette (`--s-orange`, `--s-pink`, `--s-teal`, `--s-cream`) — see [brand.md](brand.md).
- **Storefront themes own their own colors.** Do not pull app tokens into storefront component inline styles — use the `ThemeColors` (`c`) object passed in. See [storefront-themes.md](storefront-themes.md).
