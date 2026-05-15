# Spacing, Radius, Shadows

## Spacing

Tailwind's default spacing scale is used unmodified. The CSS custom property `--spacing: 0.25rem` (4px) is set for reference but no custom step keys are added.

Translation table (every step = 0.25rem = 4px):

| Class | Value |
|---|---|
| `p-1` / `gap-1` / `m-1` | 4px |
| `p-2` | 8px |
| `p-3` | 12px |
| `p-4` | 16px |
| `p-6` | 24px |
| `p-8` | 32px |
| `p-12` | 48px |
| `p-16` | 64px |

Common density patterns in the codebase:

- **Card padding**: `p-6` (24px) for dashboard cards; `p-4` for compact rows.
- **Section padding** (storefront / landing): `py-20` to `py-32` desktop, `py-12` mobile.
- **Stack gaps**: `gap-2` for tight metadata, `gap-4` for default, `gap-6` for cards in a grid.

## Border radius

Override values in [tailwind.config.ts](../tailwind.config.ts):

| Class | Token | Value |
|---|---|---|
| `rounded-sm` | — | `0.1875rem` (3px) |
| `rounded-md` | — | `0.375rem` (6px) |
| `rounded-lg` | — | `0.5625rem` (9px) |

The CSS variable `--radius: 0.75rem` (12px) exists and is used by some primitive components for their default; component authors can opt in via inline styles or by referencing `var(--radius)`.

For pills (chips, badges) use `rounded-full` (or the explicit `999px` in `.s-chip`).

**Choose:**
- `rounded-sm` — input fields, tight inline elements
- `rounded-md` — buttons, default
- `rounded-lg` — cards, modals, larger surfaces
- `rounded-full` — pills, avatars, status dots

## Shadows

Shadow tokens are layered (key + ambient) and tuned for dark backgrounds — heavier alphas than typical light-mode shadows.

```css
--shadow-2xs: 0px 1px 2px 0px rgba(0,0,0,0.3);
--shadow-xs:  0px 1px 3px 0px rgba(0,0,0,0.3);
--shadow-sm:  0px 1px 4px 0px rgba(0,0,0,0.25), 0px 1px 2px -1px rgba(0,0,0,0.2);
--shadow:     0px 2px 6px 0px rgba(0,0,0,0.25), 0px 1px 3px -1px rgba(0,0,0,0.2);
--shadow-md:  0px 4px 8px 0px rgba(0,0,0,0.3),  0px 2px 4px -1px rgba(0,0,0,0.2);
--shadow-lg:  0px 8px 16px 0px rgba(0,0,0,0.3), 0px 4px 6px -1px rgba(0,0,0,0.2);
--shadow-xl:  0px 16px 32px 0px rgba(0,0,0,0.3),0px 8px 12px -1px rgba(0,0,0,0.2);
--shadow-2xl: 0px 24px 48px 0px rgba(0,0,0,0.4);
```

These are used by storefront themes via the `ThemeColors.shadow` field; in app surfaces prefer Tailwind's `shadow-sm`, `shadow-md`, etc., which already pick up reasonable defaults on dark backgrounds.

## Tracking

`--tracking-normal: 0em` is set as a baseline. Real letter-spacing values are applied locally:

- `.s-label` — `2px` (very wide for tiny mono labels)
- `.cta-mono` — `0.08em`
- `.s-heading` — `-1px` (tight for big display)

## Rules

- **Don't invent radii.** Use `rounded-sm/md/lg/full`. If you need `2xl`, you're probably building a hero card — use `rounded-2xl` (Tailwind default) or inline `border-radius: 1rem`.
- **Don't stack heavy shadows on cards.** The dark palette plus a `card-border` is usually enough separation. Reserve `shadow-lg+` for floating popovers and modals.
- **Inputs and buttons share the same base radius** (`rounded-md`) so they compose cleanly in form rows.
