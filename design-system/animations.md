# Animations

All keyframes live in [client/src/index.css](../client/src/index.css). The system is organized by surface:

- **App-wide** — accordion, save-pulse
- **`dv-*` (Dashboard Viz)** — analytics dashboard motion
- **`sf-*` (Storefront)** — scroll-reveal and page-enter
- **`s-*` (Sellisy landing)** — marketing-site motion (ambient orbs, ticker, floats)

## App-wide

### Accordion (Radix-driven)

```css
@keyframes accordion-down { from { height: 0 } to { height: var(--radix-accordion-content-height) } }
@keyframes accordion-up   { from { height: var(--radix-accordion-content-height) } to { height: 0 } }
```

Registered in Tailwind:
```ts
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up':   'accordion-up 0.2s ease-out',
}
```

Use `data-[state=open]:animate-accordion-down` style.

### Save pulse

Used to indicate a save in flight beside editor titles.

```css
.save-pulse { animation: save-pulse 1s ease-in-out infinite; }
```

## Dashboard analytics (`dv-*`)

Reveal motion for the analytics dashboard. Use these as `className` directly.

| Class | Use |
|---|---|
| `.dv-fade-in` | 0.5s rise-in for cards on first paint |
| `.dv-block-enter` | 0.2s tight rise-in for inserted blocks |
| `.dv-float` | 3s gentle bob for hero callouts |
| `.dv-bar-grow` | Scale-Y from 0 → 1 for chart bars (origin: bottom) |
| `.dv-pulse-glow` | Slow opacity pulse for live indicators |
| `.dv-slide-in-right` | Right-side enter for drawers / chips |
| `.dv-confetti-piece` | Falling square particle for celebration moments |

## Storefront (`sf-*`)

### Scroll-reveal

```html
<div class="sf-reveal-item">…</div>
```

```css
.sf-reveal-item        { opacity: 0; transform: translateY(24px); transition: opacity .5s, transform .5s; }
.sf-reveal-item.sf-revealed { opacity: 1; transform: translateY(0); }
```

A storefront-side IntersectionObserver toggles `sf-revealed` as items enter the viewport. Apply `.sf-reveal-item` to product cards, sections, and reviews. The reveal honors `prefers-reduced-motion` (instantly visible).

### Page enter

```css
.sf-page-enter { animation: sfPageFadeIn 0.2s ease-out both; }
```

Apply to the storefront route container so page transitions feel tactile but quick.

## Marketing landing (`s-*`)

### Ambient orbs

Three slow drifts for the fixed background:

```css
@keyframes s-ambient-drift-1 { /* yellow,  90s */ }
@keyframes s-ambient-drift-2 { /* teal,   105s */ }
@keyframes s-ambient-drift-3 { /* pink,    95s */ }
```

Each is asymmetric and out of phase so the trio never visibly aligns. Animation cadences over 1 minute — they're meant to be subliminal. See [brand.md](brand.md#ambient-orbs).

### Reveal

```css
.s-reveal { opacity: 0; transform: translateY(32px); transition: opacity .7s, transform .7s; }
.s-reveal.s-revealed { opacity: 1; transform: translateY(0); }
```

A heavier, slower scroll-reveal than `.sf-reveal-item`. Use on landing-page sections and feature blocks.

### Floats

```css
@keyframes s-float       { /* card bob: 12px, no rotation */ }
@keyframes s-float-card  { /* card bob: 10px, preserves --card-rotate */ }
```

`s-float-card` reads `var(--card-rotate)` so each tilted showcase card keeps its angle while bobbing.

### Ticker

```css
.s-ticker-track { animation: s-ticker 30s linear infinite; }
.s-ticker-track:hover { animation-play-state: paused; }
```

Horizontal scrolling marquee. Pauses on hover so labels are readable.

### Pulse dot / expand ring

```css
@keyframes s-pulse-dot   { /* status indicator with green glow */ }
@keyframes s-expand-ring { /* radar ping, scale 0.8 → 2.5, fade out */ }
```

### Gradient border

```css
@keyframes s-gradient-border { background-position: 0% → 100% → 0% }
```

For animated gradient outlines on featured cards.

### Bounce crown

```css
@keyframes s-bounce-crown { translateY 0 → -6px → 0 }
```

Tiny micro-animation for trophy/crown icons on testimonial blocks.

## Reduced motion

A single global block disables all expensive motion when the user prefers it:

```css
@media (prefers-reduced-motion: reduce) {
  .s-reveal       { opacity: 1; transform: none; transition: none; }
  .s-ticker-track { animation: none; }
  .s-ambient-orb  { animation: none; }
}
```

**When you add a new keyframe-driven class, add a reduced-motion override here too.**

## Performance notes

- All ambient orbs and the hero grid set `transform: translateZ(0)` and `contain: layout paint` so they're composited and don't re-rasterize on scroll.
- All elements with `backdrop-filter` get `contain: paint` and `transform: translateZ(0)` automatically (global rule in `index.css`), and `backdrop-filter` is **stripped entirely** below 768px or under `prefers-reduced-motion`. Phones aren't fast enough for blur and it barely shows on small screens.

## Rules

- **Don't add a new keyframe without checking it here first.** If something near it works, reuse.
- **Use the `dv-`, `sf-`, `s-` prefixes** to scope your motion to a surface.
- **Always honor `prefers-reduced-motion`** — extend the global block, don't add a new query.
- **Animate transform/opacity only.** No animating `width`, `top`, `left`, `padding`, or anything that triggers layout.
