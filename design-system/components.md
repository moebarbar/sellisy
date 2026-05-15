# Components

App primitives are ShadCN UI components in [client/src/components/ui/](../client/src/components/ui/), restyled to use the Sellisy token palette. This doc covers the conventions and the custom interaction system layered on top.

## Buttons

### Primary CTA

```tsx
<button className="cta-mono px-6 py-3 rounded-md bg-primary text-primary-foreground hover-elevate active-elevate-2">
  Start selling
</button>
```

- Mono uppercase via `.cta-mono`
- Yellow fill (`bg-primary`), near-black text (`text-primary-foreground`)
- Hover/active treatment via `hover-elevate` / `active-elevate-2` — no manual `hover:bg-*`

### Secondary

```tsx
<button className="px-4 py-2 rounded-md border border-card-border text-foreground hover-elevate">
  Cancel
</button>
```

### Destructive

```tsx
<button className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover-elevate">
  Delete
</button>
```

### Ghost / icon

Inline elements with `hover-elevate` and no explicit background. The elevate overlay does the work.

## Cards

```tsx
<div className="rounded-lg bg-card border border-card-border p-6">
  …
</div>
```

- `bg-card` (`#0a0a0a`) — slightly lighter than background to read as a surface
- `border-card-border` (`rgba(255,255,255,0.08)`-equivalent) — subtle outline
- `rounded-lg` (9px) for default cards
- Add `hover-elevate` if interactive

**Product cards** must be `aspect-square`. Always.

```tsx
<div className="aspect-square rounded-lg overflow-hidden bg-card">
  <img src={url} loading="lazy" decoding="async" className="w-full h-full object-cover" />
</div>
```

Never replace `<img>` with CSS `background-image` for product images — lazy loading and decoding hints are required for catalog perf.

## Chips (`.s-chip`)

Glass-morphism feature pills used on the landing page. Replaces the older colorful "sticker" pills.

```tsx
<span className="s-chip">
  <span className="s-chip-dot" style={{ background: '#F5E642' }} />
  Stripe + PayPal
</span>
```

```css
.s-chip {
  font: 500 13px/1 'DM Sans', sans-serif;
  border-radius: 999px;
  padding: 8px 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(250,250,245,0.7);
  backdrop-filter: blur(12px);
}
.s-chip:hover { border-color: rgba(255,255,255,0.18); }
```

The dot (`.s-chip-dot`) is a 6px circle whose color hints at the feature category.

`.s-portal-chip` is a variant hidden below 1280px to keep mobile chip rows tidy.

## Inputs

ShadCN `<Input>` and `<Textarea>` use:
- `bg-input` border, `bg-card` or transparent fill
- `rounded-md`
- `focus-visible:ring-2 ring-ring` (yellow focus)

For contenteditable surfaces (KB / blog / newsletter editors), placeholder behavior is handled by:

```css
[contenteditable][data-placeholder]:empty::before {
  content: attr(data-placeholder);
  color: hsl(var(--muted-foreground) / 0.4);
}
```

A focus-only variant is also defined for editors that should only show the placeholder while focused.

## Elevate system

The custom interaction layer that replaces hand-rolled `hover:bg-*` / `active:bg-*` classes. Defined in `@layer utilities` of [index.css](../client/src/index.css).

### Why

- Automatic contrast adjustment on any colored surface
- Stacks cleanly with toggle state (`toggled` + `hovered` + `active` all distinguishable)
- Single source of truth for "interactive feedback" — change two CSS variables and every component updates

### Variables

```css
--elevate-1: rgba(255,255,255, .04);  /* hover */
--elevate-2: rgba(255,255,255, .09);  /* active / toggled */
```

### Classes

| Class | Effect |
|---|---|
| `hover-elevate` | `+elevate-1` overlay on `:hover` |
| `hover-elevate-2` | `+elevate-2` overlay on `:hover` |
| `active-elevate` | `+elevate-1` overlay on `:active` |
| `active-elevate-2` | `+elevate-2` overlay on `:active` |
| `toggle-elevate` | Permanent `+elevate-2` background when `toggle-elevated` is also present (or via `data-[state=on]`) |
| `no-default-hover-elevate` | Escape hatch: opt out of the default behavior |
| `no-default-active-elevate` | Same, for active |

### Usage

```tsx
// Standard button
<button className="rounded-md bg-card border hover-elevate active-elevate-2">…</button>

// Toggle button driven by data-state
<button
  data-state={enabled ? "on" : "off"}
  className="toggle-elevate data-[state=on]:toggle-elevated"
>…</button>
```

The overlays use `::after` (hover/active, in front) and `::before` (toggle, behind content). Border insets are auto-adjusted for `.border` containers so the overlay covers the parent border edge.

**Caveat:** elevate doesn't work on elements with `overflow: hidden`. For those, wrap or use `no-default-*` and roll your own.

## Skeletons

Use `.s-skeleton-shimmer` for the brand shimmer (used on `/auth` while Clerk loads):

```css
background: linear-gradient(90deg,
  rgba(255,255,255,0.04) 0%,
  rgba(255,255,255,0.10) 50%,
  rgba(255,255,255,0.04) 100%);
background-size: 800px 100%;
animation: s-skeleton-shimmer 1.6s ease-in-out infinite;
```

For ShadCN `<Skeleton>` (most dashboard skeletons), the default pulsing-bg variant is fine.

## Save indicator

`.save-pulse` — opacity pulse 0.4 → 1 → 0.4 over 1s. Use on a small dot beside "Saved" / "Saving" labels in editors.

## KB / blog content rendering

The KB viewer scopes specific element styling so authored content reads like a doc, not raw HTML. See [client/src/index.css](../client/src/index.css#L243):

- `[data-testid="kb-viewer"] a` — yellow underlined links
- `[data-testid="kb-viewer"] code` — muted background, Fira Code font, inline padding
- `[data-testid="kb-viewer"] mark` — yellow `rgba(250,204,21,0.25)` highlight

Mirror these in any other long-form viewers (blog post page) for consistency.

## Multi-block selection (KB editor)

```css
.kb-block-multi-selected {
  background-color: hsl(var(--primary) / 0.12);
  border-radius: 4px;
}
```

Yellow tint at 12% on multi-selected blocks. While dragging across blocks, `.kb-multi-selecting` disables text selection so the blue browser highlight doesn't fight the custom marker.
