# Typography

## Font families

| Variable | Family | Role |
|---|---|---|
| `--font-sans` | `'DM Sans', sans-serif` | Body, UI, default |
| `--font-mono` | `'Space Mono', monospace` | Labels, CTA buttons, code-adjacent |
| `--font-serif` | `'Source Serif Pro', serif` | Reserved for editorial moments (rare) |
| (display) | `'Bebas Neue', sans-serif` | Logo + landing-page hero headlines |

`Bebas Neue` is **not** registered in Tailwind's `fontFamily` — it's applied via the `.s-heading` utility on the landing page and via inline classes for the logo. Don't promote it to a global token; it's display-only.

## Code fonts

KB viewer code blocks use `'Fira Code', 'JetBrains Mono', monospace`. These are intentionally separate from `--font-mono` so `Space Mono`'s mono-as-label use case stays distinct from actual code rendering.

## Tailwind classes

```ts
fontFamily: {
  sans:  ['var(--font-sans)'],
  serif: ['var(--font-serif)'],
  mono:  ['var(--font-mono)'],
}
```

So `font-sans`, `font-mono`, `font-serif` work as expected.

## Utility classes (landing page)

Defined in [client/src/index.css](../client/src/index.css). They're scoped to `.landing-page` so they don't leak into the dashboard or storefronts.

### `.s-heading`

```css
font-family: 'Bebas Neue', sans-serif;
font-weight: 700;
line-height: 0.9;
letter-spacing: -1px;
```

Editorial poster-style headline. Pair with large size utilities (`text-6xl`, `text-8xl`).

### `.s-label`

```css
font-family: 'Space Mono', monospace;
font-size: 11px;
text-transform: uppercase;
letter-spacing: 2px;
```

Tiny eyebrow labels above sections.

### `.s-body`

```css
font-family: 'DM Sans', sans-serif;
font-weight: 300;
font-size: 15px;
line-height: 1.7;
```

Long-form copy on landing surfaces.

### `.s-chip`

Glass-morphism pill — see [components.md](components.md#chips).

## Global utility — `.cta-mono`

Defined in `@layer utilities`, so it's available **everywhere** (not scoped to landing).

```css
.cta-mono {
  font-family: 'Space Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

This is the canonical way to give a button or CTA the mono-uppercase Sellisy treatment. Use it on any high-emphasis action button across the app.

## Type scale

There is **no custom type scale** — use Tailwind's defaults (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, …, `text-9xl`). Combined with the utility classes above, that's enough range.

## Rules

- **Body text** — DM Sans, regular weight. Use `font-sans` or rely on the `body` default.
- **Buttons / CTAs** — Add `.cta-mono` for primary actions, especially on the marketing site and storefront. Dashboard buttons can stay sans for density.
- **Labels / metadata** — Space Mono, uppercase, letter-spaced. Use `.s-label` on landing or a manual `font-mono uppercase tracking-widest text-xs` elsewhere.
- **Logo** — Always Bebas Neue, always with the yellow `I`. Don't substitute.
- **Headlines on the marketing site** — Use `.s-heading` for the giant editorial feel. Inside the dashboard, prefer normal sans headlines (`font-sans font-semibold`).
- **Long-form** — `@tailwindcss/typography` is loaded; `prose` classes work for blog/KB rendering, but the KB viewer adds its own targeted styling for `<a>`, `<code>`, `<mark>`.
