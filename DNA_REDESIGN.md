# Sellisy DNA — Brand-World Redesign

The platform's visual identity: a **neon-noir underground** where a crew of
retro-electronics characters run a creator's storefront. Comic-book illustration
(bold ink outlines + halftone), on the brand's neon triad over near-black.

Goal: make Sellisy feel like a *place with a pulse* — the opposite of sterile
SaaS — while every character and scene maps to a real product function. Ties to
the positioning: **grow your GDP** (your share of the digital economy).

## Palette — the neon triad (already in `client/src/index.css`)

- `--s-black #050505` (ground) · `--s-white #FAFAF5` (text)
- `--s-yellow #F5E642` (primary) · `--s-pink #FF3CAC` (energy) · `--s-teal #00F5D4` (cool accent)
- Support: `--s-orange #FF6B35`, `--s-cream #F0E6D3`
- Texture: halftone dot overlay, bold outline + outer-glow on neon elements.
- **Rule:** never place body text over a busy illustration — use the images'
  dark negative space, or a gradient scrim. Dark-only for marketing.

## The crew (mascots) → feature mapping

Working name for the world: **"The Sublevel."** Lead mascot (CRT-smiley):
**Pixel** — the friendly monitor-head, the face of the brand / the seller (you).

| Character | Name (proposed) | Role / surface |
|---|---|---|
| CRT smiley head | **Pixel** | mascot, brand face, seller, empty states, 404, milestones |
| Cash-register head | **Register** | payments, checkout, "keep 100%" |
| Radio head (antenna) | **Radio** | marketing, newsletter, affiliates, reach |
| Film-projector head | **Reel** | courses / LMS / content creator |
| Cassette head | **Cassette** | create / products / creative |
| Amp head | **Amp** | launch / growth |
| ATM+headphones bouncer | **Vault** | marketplace / Discover / access control |

The ⚡ lightning-bolt "S" is the logo mark.

## Optimized assets (`client/public/dna/`)

Full-bleed scenes, JPEG @ ~1600–1900w (3.8 MB total, from ~43 MB source):
- `crew-storefront.jpg` — dressing room + mirror → storefront theming/branding
- `crew-delivery.jpg` — conveyor + boxes + bouncer → product delivery/fulfillment
- `crew-analytics.jpg` — projector charts + grad cap + certificate → analytics + courses
- `crew-earnings.jpg` — claw machine full of coins → earnings / payout / keep 100%
- `crew-launch.jpg` — rooftop cannon firing product-boxes into the sky → launch/growth
- `crew-bundles.jpg` — warehouse of gift boxes + `%` tag → bundles / coupons / marketplace

Source PNGs kept in `DNA FOLDER/` (gitignored-candidate; large).

## Production model — HYBRID (decided)

1. **Now:** ship these 6 AI scenes as hero/section art across marketing + app moments.
2. **In parallel:** commission an illustrator to turn the crew into a consistent,
   scalable **vector character set** (each mascot: 3–4 poses + expressions) + a
   one-page style guide. Swap AI heroes → vector system as it lands.
3. Generate additional same-style scenes (Gemini) only for gaps until the vector
   set exists; keep a prompt recipe for consistency (style, palette, character refs).

## Phased rollout (whole-platform redesign — decided)

**Phase 1 — Foundation + marketing (in progress)**
- [x] Optimize + import the 6 scenes; neon-triad tokens confirmed.
- [ ] Landing "brand-world" band (dark-safe) — first visible slice.
- [ ] Swap blog article heroes (SVG → crew scenes per topic).
- [ ] Set an OG/social image from the crew art.

**Phase 2 — In-app moments (high feel, low risk)**
- Empty states: no products → Cassette; no sales → crew-earnings; no analytics → crew-analytics.
- Loading → glitchy Pixel; 404 → `X_X` Pixel.
- Milestone/celebration screens (first sale, $1k, $10k) → Pixel + confetti = "leveling up your GDP."

**Phase 3 — Dashboard reskin**
- Elevate pink/teal to first-class UI accents (sidebar sections get character avatars:
  Payments=Register, Marketing=Radio, Courses=Reel, Analytics/Brain=Pixel).
- Halftone/outline treatment on cards, headers, badges. Keep legibility + a11y first.

**Phase 4 — Storefront themes**
- Add a "Sublevel" neon-noir theme to the storefront theme set (opt-in for sellers).
- Character-driven empty/checkout/thank-you moments in storefronts.

**Phase 5 — System + polish**
- Reusable `<Illustration>` / `<Character>` components + asset manifest.
- Convert scenes to WebP/AVIF + responsive crops once a real encoder is available
  (sips can't do WebP; needs sharp/cwebp in the build or an external step).
- Accessibility pass (contrast, prefers-reduced-motion for any glow animation).

## Open production notes / risks
- **WebP/AVIF:** not possible with current tooling (`sips` JPEG-only). Add `sharp`
  to the build or a one-off `cwebp` step to cut image weight ~30% more.
- **Consistency:** AI scenes will drift; the commissioned vector set is what makes
  this durable. Don't scale AI one-offs into core UI.
- **Perf:** lazy-load all scene art; never above-the-fold without a lean crop.
