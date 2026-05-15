# Brand

## Logo

**SELL**`I`**SY** set in **Bebas Neue**, all caps. The middle `I` is the only character colored — it's the primary yellow (`text-primary` / `#F5E642`). Everything else inherits foreground.

```html
<span class="font-display tracking-tight">
  SELL<span class="text-primary">I</span>SY
</span>
```

## Voice

- Editorial, sticker-culture, confident.
- Short labels, mono-cased, letter-spaced (`s-label` / `cta-mono`).
- Headlines are oversized Bebas Neue with tight `-1px` tracking and `0.9` line-height — they're meant to feel like print posters, not buttons.

## Ambient orbs

Three slow-drifting blurred orbs (yellow, teal, pink) sit in a fixed wrapper behind landing/auth content to give depth to the near-black background.

- Each orb is GPU-composited (`transform: translateZ(0)`, `contain: layout paint`) so blur isn't re-rasterized on scroll.
- Animation cadences: `90s`, `105s`, `95s` — long on purpose, almost subliminal.
- Opacities: `~3.5–4.5%`. They suggest depth, never compete with content.
- Honors `prefers-reduced-motion` (animation disabled).

```css
.s-ambient-orb--yellow { background: radial-gradient(circle, rgba(245,230,66,0.045) 0%, transparent 70%); }
.s-ambient-orb--teal   { background: radial-gradient(circle, rgba(0,245,212,0.035) 0%, transparent 70%); }
.s-ambient-orb--pink   { background: radial-gradient(circle, rgba(255,60,172,0.035) 0%, transparent 70%); }
```

## Hero treatments

- **Hero grid** (`.s-hero-grid`): 80×80px line grid at `rgba(255,255,255,0.035)`, masked with a radial ellipse so it fades to transparent at the edges.
- **Grain** (`.s-grain`): full-bleed noise overlay at `opacity: 0.04` for film-grain texture.
- **Floating cards**: showcase cards that gently bob via `s-float-card` keyframe; each card carries a `--card-rotate` custom property so the float preserves its tilt.

## Auth splash

Standalone `/auth` page is its own brand surface:
- Same dark palette as app
- Hero grid + ambient orbs
- Floating showcase cards (revenue, products, store, delivery) on the right
- Clerk widget centered left
- Skeleton shimmer (`.s-skeleton-shimmer`) while Clerk hydrates

## Brand colors (landing page accent palette)

These are scoped to `.landing-page` only — they are **not** app-wide tokens. Use them for marketing surfaces.

```css
--s-black:  #050505;
--s-white:  #FAFAF5;
--s-yellow: #F5E642;
--s-orange: #FF6B35;
--s-pink:   #FF3CAC;
--s-teal:   #00F5D4;
--s-cream:  #F0E6D3;
```

For all other surfaces (dashboard, storefront chrome) use the semantic tokens in [colors.md](colors.md).
