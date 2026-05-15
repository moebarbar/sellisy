# Layout

## Breakpoints

Tailwind defaults are used unmodified:

| Token | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Sellisy-specific breakpoint behaviors:

- **`< 768px`** — `backdrop-filter` is stripped globally (perf). Mobile devices don't render blur cheaply enough to justify it.
- **`< 1280px`** — `.s-portal-chip` is hidden so chip rows don't wrap on tablets.
- **Landing page grids** swap layouts at `sm` (640px) and `md` (768px) — see `.s-stats-grid`, `.s-steps-grid`, `.s-features-grid`.

## App shell — Dashboard

The dashboard uses a persistent two-column layout from [client/src/components/dashboard/layout.tsx](../client/src/components/dashboard/layout.tsx).

```
┌─────────────┬───────────────────────────────────┐
│             │                                   │
│   Sidebar   │   Page content (route-driven)     │
│  (sticky)   │                                   │
│             │                                   │
└─────────────┴───────────────────────────────────┘
```

- **Sidebar** ([sidebar.tsx](../client/src/components/dashboard/sidebar.tsx)) — `bg-sidebar`, `border-r border-sidebar-border`, store switcher at the top, nav groups, footer profile/settings. Active item uses `bg-sidebar-primary text-sidebar-primary-foreground`.
- **Page container** — Centered max-width per page, generous `py-6` to `py-8`.
- **Onboarding checklist** — Surfaces above page content on the overview until dismissed.
- **Page transitions** — `FadeIn` wrapper in [App.tsx](../client/src/App.tsx) cross-fades on route change (0.15s opacity + 4px Y).

## App shell — Marketing landing

`/` uses the `.landing-page` wrapper which scopes brand colors and typography utilities. Layout is a single-column, full-viewport-width series of sections — no sidebar.

Layered z-stack on landing:
1. `.s-ambient-wrap` (z-0) — fixed orbs
2. `.s-grain` (z-1) — film grain
3. `.s-hero-grid` (z-0, masked) — within hero only
4. Section content (z auto)
5. Sticky header (z-50)

## Storefront shell

Each storefront is a single-page experience composed from sections. Section order is configurable per store via [section-order-settings.tsx](../client/src/components/dashboard/section-order-settings.tsx) and stored on the `stores` row.

Standard order:

1. Announcement bar (optional, dismissible, persisted via `theme.announcementStoragePrefix`)
2. Header (logo, nav, search, sort, social links, mode toggle, cart)
3. Hero
4. Featured products
5. Product grid + bundles + categories
6. About
7. Testimonials
8. Reviews
9. FAQ
10. Newsletter
11. Footer

Plus floating elements:
- Slide-out cart drawer ([cart-drawer.tsx](../client/src/components/storefront/cart-drawer.tsx))
- Lead-magnet modal ([lead-magnet-modal.tsx](../client/src/components/storefront/lead-magnet-modal.tsx))

Width is governed per-theme via `ThemeLayout.maxWidth` — themes can be wide-bleed or narrow-editorial.

## Customer portal

The buyer-facing portal at `/s/:slug/portal` reuses storefront chrome (header, footer, theme) so it feels like part of the store, not a generic SaaS dashboard.

## Embed widgets

Embed routes (`/embed/:slug/product/:productId`, `/embed/:slug/bundle/:bundleId`) render a single card with the storefront's theme applied — no header, no footer, no chrome. Designed to live inside an iframe at any size.

## Grid patterns

| Pattern | Class chain | Use |
|---|---|---|
| 2-up product grid (mobile) | `grid grid-cols-2 gap-4` | Storefront on small screens |
| 3-up product grid | `grid grid-cols-2 md:grid-cols-3 gap-6` | Default storefront |
| 4-up product grid | `grid grid-cols-2 md:grid-cols-4 gap-6` | Wide themes |
| Stats row | `s-stats-grid` (1 → 3 cols at `sm`) | Landing |
| Features row | `s-features-grid` (1 → 2 → 3 cols) | Landing |
| Steps row | `s-steps-grid` (1 → 3 cols at `md`, with connecting line at `md+`) | Landing |

## Containers

There is **no global `.container` override.** Use Tailwind's `max-w-*` directly:

- `max-w-7xl` — wide dashboard pages, marketing sections
- `max-w-5xl` — standard content pages
- `max-w-3xl` — long-form (blog post, KB page)
- `max-w-md` — modal bodies, form cards

Always pair with `mx-auto px-4 sm:px-6 lg:px-8` for safe gutters.

## Z-index scale

There is no formal scale; use these conventions:

| Range | Use |
|---|---|
| `z-0` | Ambient backgrounds (orbs, grids) |
| `z-10` | Sticky in-content elements |
| `z-20`–`z-30` | Cart drawer body, dropdowns |
| `z-40` | Modal backdrops |
| `z-50` | Modals, sticky headers |
| `z-[9999]` | Confetti / toasts (one-off escape hatches) |

Avoid arbitrary `z-[123]` values unless you're working around a third-party widget.

## Rules

- **One layout per surface.** Dashboard shell, landing, storefront, embed — each has its own wrapper and they don't mix.
- **Mobile first.** Default classes target small screens; layer up via `sm:`, `md:`, `lg:` breakpoints.
- **Don't fight the sidebar.** Dashboard pages are centered inside the right column — don't add their own full-bleed backgrounds (use `bg-card` cards instead).
- **Sticky headers must respect safe-area** on iOS — add `pt-[env(safe-area-inset-top)]` if it's covering content.
