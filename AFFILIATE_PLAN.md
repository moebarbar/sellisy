# Affiliate Program — A-to-Z Plan

> Closes the #1 gap from [COMPETITOR_ROADMAP.md](COMPETITOR_ROADMAP.md). Built to neutralize Gumroad, Payhip, Whop, and Lemon Squeezy on their built-in-affiliates wedge.

---

## 0. Decisions (locked)

1. **Commission rate — set by each store owner, not the platform.** Every store owner picks their own rate in `/dashboard/affiliates/settings`. The platform ships **20% as the initial form value** but it is not a global default — it's just what the picker reads on first open before the owner saves their own number. Owners can also override the rate per-affiliate (e.g. give a top performer 30% while everyone else stays at 20%). Stored as basis points (`stores.affiliateDefaultRateBps` and `affiliates.commissionRateBps`).
2. **Cookie window: 30 days.** Configurable per store (7 / 14 / 30 / 60 / 90 options). 30 is the initial value. Stored as `stores.affiliateCookieDays`.
3. **Attribution model: last-click wins.** Each new `?ref=` overwrites the cookie. Simplest, matches what every competitor does, easiest to explain to confused affiliates.
4. **Plan gating: Growth tier and up.** Starter ($9) sees an upgrade CTA in the Affiliates tab — the affiliate program is one of the reasons to climb to Growth. Empire unlocks unlimited affiliates and per-product commission overrides (V2).
5. **MVP is invite-only.** Owners invite affiliates by email; no public apply page in v1. Self-serve apply page lands in V1 once we've seen how owners actually run their programs.
6. **Payouts: manual mark-as-paid.** Owner pays affiliates externally (PayPal/Wise) and records the reference in the dashboard. Stripe Connect transfers are V2 — they require migrating off the current per-store-Stripe-keys model, which is a separate project.
7. **Minimum payout threshold: $25.** Owner can lower it per-store if they want. Below threshold, balance rolls forward to the next payout cycle.
8. **Refunds clawback the commission.** Any refund within the cookie window auto-voids the matching commission row. Already-paid commissions get a negative balance entry (not auto-collected — owner deals with it manually).

---

## 1. Goals & non-goals

**Goals**
- Store owners can recruit affiliates, set a commission rate, and track conversions.
- Affiliates get a unique link per store (or per product), see clicks/conversions/earnings, and request payout.
- Buyers see no friction — affiliate links resolve to the normal storefront with attribution stored silently.
- The system is fraud-resistant enough for honest businesses (not bulletproof, but not naive).

**Non-goals (V1)**
- Multi-level / pyramid commissions.
- Coupon-code-based attribution (could add later — see V2).
- Public affiliate marketplace where strangers find products to promote.
- Per-product commission overrides (everyone gets the store-wide rate first; product overrides in V2).
- Stripe Connect auto-payouts (V2).

---

## 2. User stories

**Store owner**
- As a store owner, I can enable the affiliate program in Settings, pick a default commission rate, and get a public "Apply to be an affiliate" link.
- I can invite an affiliate by email, view all my affiliates, see their stats, and approve/pause/remove them.
- I can see total pending commissions, paid commissions, and click-to-conversion rate.
- I can mark a payout as "paid" once I've sent the money externally.

**Affiliate**
- As an affiliate, I sign up via an invite link (V1: self-apply), connect to a store, and get a unique tracking link.
- I see my dashboard: clicks, conversions, earnings (pending + paid), cookie window remaining for active visitors.
- I can generate links for the storefront or any specific product.
- I get an email when I earn a commission and when a payout is sent.

**Buyer**
- Clicks an affiliate link → lands on the normal storefront → an `affiliate_ref` cookie is set silently → buys normally → no UX change.

---

## 3. Data model

All new tables follow the existing Drizzle conventions in [`shared/schema.ts`](shared/schema.ts) (varchar IDs, `gen_random_uuid()`, `createdAt`/`updatedAt`/`deletedAt`).

### `affiliates`
The "person" — one row per (user, store) pair. A user can be an affiliate for multiple stores.

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(64) PK | uuid |
| `userId` | varchar(64) NOT NULL | FK → `users.id` |
| `storeId` | varchar(64) NOT NULL | FK → `stores.id` |
| `code` | text NOT NULL | URL-safe slug, e.g. `?ref=jane-doe`. Unique per store. |
| `status` | enum `affiliate_status` NOT NULL | `pending` / `active` / `paused` / `rejected` |
| `commissionRateBps` | integer NOT NULL | basis points (2000 = 20%). Per-affiliate override of store default. |
| `payoutEmail` | text | PayPal/Wise email — separate from user's login email |
| `notes` | text | Owner's private notes |
| `createdAt` / `updatedAt` / `deletedAt` | timestamps | |

Indexes:
- unique `(storeId, code)`
- unique `(storeId, userId)` — prevent dup affiliates per store
- `(storeId, deletedAt)` for list queries

### `affiliate_clicks`
Lightweight clickstream. **Not** the source of truth for commissions — just for analytics and fraud signals.

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(64) PK | uuid |
| `affiliateId` | varchar(64) NOT NULL | FK |
| `storeId` | varchar(64) NOT NULL | denormalized for fast queries |
| `landingPath` | text | e.g. `/product/abc` |
| `referrer` | text | document.referrer |
| `userAgentHash` | varchar(64) | sha256(ua) — privacy-safe |
| `ipHash` | varchar(64) | sha256(ip + salt) — for dedup, not retention |
| `createdAt` | timestamp | |

Indexes: `(affiliateId, createdAt)`, `(storeId, createdAt)`.

Retention: prune rows older than 90 days via a cron job (already have the `server/jobs` folder).

### `affiliate_commissions`
The money-truth table. One row per attributed order.

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(64) PK | uuid |
| `affiliateId` | varchar(64) NOT NULL | FK |
| `storeId` | varchar(64) NOT NULL | denormalized |
| `orderId` | varchar(64) NOT NULL UNIQUE | FK → `orders.id`. **Unique** prevents double-write on webhook retries. |
| `subtotalCents` | integer NOT NULL | Snapshot of order subtotal at time of commission write |
| `commissionRateBps` | integer NOT NULL | Snapshot of rate at time of sale (immutable history) |
| `commissionCents` | integer NOT NULL | Computed: floor(subtotal × rateBps / 10000) |
| `status` | enum `commission_status` NOT NULL | `pending` (locked for X days) / `approved` (paid out eligible) / `paid` / `void` (refunded) |
| `payoutId` | varchar(64) NULL | FK → `affiliate_payouts.id`, set when paid |
| `lockedUntil` | timestamp | createdAt + 14 days; can't pay before this (refund buffer) |
| `voidReason` | text | "order_refunded", "fraud_review", etc. |
| `createdAt` / `updatedAt` | timestamps | |

Indexes: `(affiliateId, status)`, `(storeId, status)`, `(orderId)` unique.

### `affiliate_payouts`
A batch of commissions paid in one go.

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(64) PK | uuid |
| `affiliateId` | varchar(64) NOT NULL | FK |
| `storeId` | varchar(64) NOT NULL | |
| `totalCents` | integer NOT NULL | Sum of included commissions |
| `method` | text | `manual_paypal` / `manual_wise` / `stripe_connect` (V2) |
| `externalRef` | text | PayPal transaction ID or Wise transfer ID, manually entered by owner |
| `status` | enum `payout_status` NOT NULL | `processing` / `paid` / `failed` |
| `paidAt` | timestamp | |
| `createdAt` / `updatedAt` | timestamps | |

### Settings on existing `stores` table
Add columns (in [`shared/schema.ts`](shared/schema.ts) `stores` block):

| Column | Type | Notes |
|---|---|---|
| `affiliateProgramEnabled` | boolean NOT NULL default false | Off until the owner explicitly turns it on |
| `affiliateDefaultRateBps` | integer NOT NULL default 2000 | **Owner-set.** 2000 = 20%. The form prefills with this; owner saves whatever they want. Each new affiliate gets this rate unless overridden on the individual row. |
| `affiliateCookieDays` | integer NOT NULL default 30 | Owner-set per store |
| `affiliateMinPayoutCents` | integer NOT NULL default 2500 | Owner-set per store ($25 default) |
| `affiliateTermsHtml` | text | Optional — owner's affiliate ToS |

### New enums
```
affiliate_status: pending | active | paused | rejected
commission_status: pending | approved | paid | void
payout_status: processing | paid | failed
```

### Migration file
Create `migrations/00XX_affiliate_program.sql` (Drizzle generates this). Single migration adds all four tables + enums + the `stores` columns.

---

## 4. Attribution flow (the hot path)

The most important part of the system. Once attribution is wrong, everything downstream is wrong.

```
[1] Affiliate shares link  →  https://store.com/?ref=jane-doe
                            or https://store.com/product/x?ref=jane-doe

[2] Browser hits storefront
    └─ Client: read ?ref= from URL
    └─ Client: POST /api/affiliate/click { ref, storeId, path }
       (server validates ref exists + active, writes affiliate_clicks row)
    └─ Server returns: { ok: true, affiliateId, cookieDays }
    └─ Client: set cookie `sellisy_aff_<storeSlug>=<affiliateId>` with maxAge=cookieDays
       (HttpOnly=false because checkout JS needs to read it)

[3] Buyer browses, may close tab, return days later
    └─ Cookie still valid → attribution survives

[4] Checkout flow (POST /api/checkout)
    └─ Client reads cookie, includes `affiliateId` in checkout body
    └─ Server validates affiliate is still active for this store
    └─ Server adds `affiliateId` + `commissionRateBps` to Stripe `session.metadata`
       (insertion point: server/routes.ts line ~2898 per the existing checkout handler)

[5] Stripe webhook checkout.session.completed
    └─ handleCheckoutCompleted reads metadata.affiliateId
    └─ If present + still active + order has subtotalCents > 0:
       INSERT affiliate_commissions (status=pending, lockedUntil=now+14d)
    └─ Send "you earned a commission" email to affiliate
       (insertion point: server/webhookHandlers.ts after updateOrderStatus, line ~152)
```

**Edge cases handled inline**:
- Affiliate clicks their own link → if `userId === store.ownerId`, do not write click and do not attribute (self-attribution prevention).
- Buyer clicks two different affiliate links → last-click wins (cookie overwritten).
- Order partially refunded → mark matching commission `void` with `voidReason="order_partially_refunded"` and clawback (V1 simplification: any refund voids the full commission; V2 prorates).

---

## 5. Commission calculation

```
subtotalCents = sum(orderItems.priceCents)        # excludes tax, shipping, processing
                - (couponDiscountCents if coupon)
commissionCents = floor(subtotalCents × rateBps / 10000)
```

Rules:
- Floor (never round up). Affiliates don't earn fractional cents.
- If subtotal ≤ 0 (100% off coupon), no commission row written.
- Rate is **snapshotted at sale time** — changing the rate later doesn't retroactively change past commissions.
- Tax and Stripe fees are excluded from the base.

---

## 6. Payout flow (MVP — manual)

```
[1] Store owner opens /dashboard/affiliates/payouts
[2] Sees affiliates with eligible balance (sum of commissions where:
     status=approved AND payoutId IS NULL AND lockedUntil < now)
[3] Clicks "Pay $X to Jane" → modal shows: amount, payout method (dropdown),
    external reference field
[4] Owner confirms → server creates affiliate_payouts row (status=processing),
    updates all included commissions to status=paid + payoutId
[5] Owner sends money externally (PayPal/Wise), comes back, enters reference,
    marks payout as paid
[6] System emails affiliate: "$X paid to you, reference XYZ"
```

**Why manual first**: Stripe Connect requires every store owner to go through Connect onboarding for their own platform account, which is friction. The dashboard reflects the reality that most early-stage creators pay affiliates via PayPal anyway.

**V2 — Stripe Connect**:
- Requires `stripeConnectAccountId` on `stores` and on `affiliates`
- Owner uses Connect Standard or Express to onboard affiliates
- Payout becomes a `stripe.transfers.create()` from the store's balance
- Trickier with the current per-store-Stripe-keys model — needs design work.

---

## 7. API surface

All under `/api/affiliate/*`. JSON in, JSON out, same auth middleware as the rest of the dashboard.

**Public (storefront)**
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/affiliate/click` | `{ storeSlug, ref, path }` | Rate-limited per IP. Returns `{ affiliateId, cookieDays }` |

**Buyer-facing (checkout)**
| Existing | `/api/checkout` | extend body with `affiliateId?: string` | Validates server-side before trusting client |

**Store-owner dashboard**
| Method | Path | Notes |
|---|---|---|
| GET | `/api/affiliate/settings` | per active store |
| PUT | `/api/affiliate/settings` | toggle enabled, rate, cookie days, ToS |
| GET | `/api/affiliate/affiliates` | list affiliates for store |
| POST | `/api/affiliate/affiliates/invite` | `{ email, commissionRateBps? }` — sends invite email |
| PATCH | `/api/affiliate/affiliates/:id` | status, rate, notes |
| DELETE | `/api/affiliate/affiliates/:id` | soft delete |
| GET | `/api/affiliate/commissions` | filterable by affiliateId, status, dateRange |
| GET | `/api/affiliate/stats` | totals: clicks, conversions, paid, pending, conv-rate |
| POST | `/api/affiliate/payouts` | `{ affiliateId, commissionIds[], method, externalRef? }` |
| PATCH | `/api/affiliate/payouts/:id` | mark as paid + record reference |

**Affiliate-facing dashboard** (lives under `/dashboard/earnings` for the affiliate user)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/affiliate/me` | aggregates across all stores user is affiliate for |
| GET | `/api/affiliate/me/links` | `{ affiliateId, storeSlug, baseUrl, exampleLinks[] }` |
| POST | `/api/affiliate/me/payout-email` | update payout email |

**Invite acceptance**
| Method | Path | Notes |
|---|---|---|
| GET | `/api/affiliate/invite/:token` | view invite |
| POST | `/api/affiliate/invite/:token/accept` | requires logged-in user; creates affiliate row, sets status=active |

---

## 8. UI — Store owner dashboard

**Sidebar nav addition** ([`client/src/components/dashboard/sidebar.tsx`](client/src/components/dashboard/sidebar.tsx))

Add `{ title: "Affiliates", url: "/dashboard/affiliates", icon: Users }` after the Customers nav.

**New pages** (under [`client/src/pages/dashboard/`](client/src/pages/dashboard/))

```
affiliates.tsx                       — list view (with tabs: Affiliates | Commissions | Payouts | Settings)
affiliates-detail.tsx                — single affiliate detail + commission history
affiliates-payouts.tsx               — payouts batch creation flow
```

**Affiliates list view sections**
- Stats row: Total earned by affiliates · Pending payouts · Clicks (30d) · Conversion rate
- Affiliates table: Name · Email · Code · Status · Clicks · Conversions · Earned · Owed · Actions
- "Invite affiliate" button → modal with email + optional custom rate

**Settings tab** (everything here is owner-controlled per store — no platform-wide defaults)
- Toggle: program enabled / disabled
- **Commission rate** (input field 1–80%, owner picks their own number — form prefills with last saved value, or 20% on first open)
- Cookie window (dropdown: 7 / 14 / 30 / 60 / 90 days, owner picks)
- Minimum payout threshold (USD input, default $25, owner can lower or raise)
- Public apply link (read-only, copy button) — only shown if self-serve apply is enabled (V1+)
- Terms of service for affiliates (rich text)

**Per-affiliate override** — in the affiliate detail view, owner can override the rate for a single affiliate (e.g. star promoter gets 30%, default stays 20%). Override stored on the `affiliates.commissionRateBps` row.

---

## 9. UI — Affiliate dashboard

Affiliates are users too, but they need a separate view. Two patterns possible:

**Option A** (recommended): A new `/dashboard/earnings` page that lists every store the logged-in user is an affiliate for. Doesn't require switching "into" an affiliate-only context.

**Option B**: A separate `/affiliate/` route tree outside `/dashboard/`. More complex routing, more UI surface — overkill for MVP.

Go with A. Add the nav entry conditionally — only show "Earnings" in the sidebar if `affiliates.where(userId=me).count() > 0`.

**Earnings page sections**
- Per-store summary cards (one per store user is affiliate for): logo, store name, balance, pending, paid, conversion rate
- Click "Manage" on a card → drawer with: copy link button, link generator (paste any product URL → returns affiliate-tagged version), recent commissions table
- "Update payout email" inline

---

## 10. Storefront — tracking script

The smallest possible client-side bundle: ~30 lines of inline JS that runs on every storefront page.

**Where**: inject in [`server/og-tags.ts`](server/og-tags.ts) when serving `/s/:slug/*` and custom-domain storefronts. Same SSR injection pattern as the meta tags.

**Behavior**
```
(function () {
  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if (!ref) return;

  // Fire click event (don't wait for response — fire and forget)
  fetch('/api/affiliate/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeSlug: window.__SELLISY_STORE_SLUG, ref, path: location.pathname }),
    keepalive: true,
  }).then(r => r.json()).then(data => {
    if (!data.affiliateId) return;
    const days = data.cookieDays || 30;
    document.cookie = `sellisy_aff_${window.__SELLISY_STORE_SLUG}=${data.affiliateId};path=/;max-age=${days * 86400};SameSite=Lax`;
  });

  // Strip ?ref= from URL so the buyer doesn't share a link with someone else's code
  params.delete('ref');
  history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
})();
```

**Checkout reads cookie** in the existing checkout flow ([`client/src/lib/cart-context.tsx`](client/src/lib/cart-context.tsx) or wherever `/api/checkout` is POSTed from) — reads `sellisy_aff_<storeSlug>` cookie and includes in body.

---

## 11. Email touchpoints

Add to [`server/emails.ts`](server/emails.ts) using the existing `baseLayout` / `sectionHeading` helpers:

1. **Affiliate invite** — sent when owner invites. Contains accept link with token.
2. **Application received** (V1+ self-serve) — confirms apply received.
3. **Application approved/rejected** — when owner reviews.
4. **Commission earned** — sent on every commission write. Includes order amount, commission amount, dashboard link. Throttle: bundle into daily digest if affiliate gets >5 in 24h (avoid spam).
5. **Payout sent** — when owner marks payout as paid. Includes amount, method, external ref, list of orders.
6. **Monthly summary** (V1+) — earnings, top product, links to share.

Email templates are HTML strings — match the pattern in [`server/emails.ts`](server/emails.ts).

---

## 12. Anti-fraud (the part everyone skips)

MVP-grade, not bulletproof:

| Vector | Mitigation |
|---|---|
| Affiliate clicks own link → buys own product | If `cookie.affiliateId.userId === buyer.email` matches affiliate's user email, do not write commission. Log to `audit`. |
| Affiliate creates fake account, buys via own link, refunds | `lockedUntil = createdAt + 14 days` blocks payout. Refund auto-voids commission. |
| Bot clicks to inflate stats | `affiliate_clicks` dedup: max 1 row per `(affiliateId, ipHash, 1h)`. Bot clicks don't pay anyway — but they pollute the dashboard. |
| Cookie stuffing / unsolicited cookies | Tracking only fires when `?ref=` is in URL. We don't accept cookie sets from arbitrary domains. |
| Owner pays themselves as affiliate | Block creating an affiliate where `userId === store.ownerId`. |

For honest businesses this is enough. Sophisticated fraud is V3+.

---

## 13. Refunds & adjustments

Hook into existing refund flow (find it in [`server/webhookHandlers.ts`](server/webhookHandlers.ts) — `charge.refunded` webhook).

When an order moves to `REFUNDED` or `PARTIALLY_REFUNDED`:
- Find any `affiliate_commissions` row with this `orderId`
- If `status === pending` or `approved`: set `status = void`, `voidReason = 'order_refunded'`
- If `status === paid`: log to audit ("uncollectable clawback") — don't try to recover money already sent
- Send email to affiliate explaining the void

This is why `lockedUntil = +14 days` matters — most refunds happen in that window.

---

## 14. Plan tier gating

Per the proposed pricing:
- **Starter ($9)**: no affiliate program — show "Upgrade to Growth" CTA in the Affiliates dashboard tab.
- **Growth ($29)**: full program, up to 25 active affiliates.
- **Empire ($49)**: unlimited affiliates, custom commission per product (V2), white-label affiliate dashboard.

Implement via [`canAccessTier()`](shared/schema.ts) checks already in the codebase.

---

## 15. Legal & terms

- Add a default affiliate ToS template (owner can override). Covers: who can be an affiliate, prohibited tactics (cookie stuffing, brand bidding, spam), payout terms, termination.
- Affiliates must accept ToS on invite acceptance.
- Privacy: tracking cookies require an existing cookie consent component on the storefront (check if one exists; if not, add a passive banner for EU traffic only).
- 1099 reporting: out of scope for V1. Owners are responsible. Add a note in the docs.

---

## 16. Phasing

### MVP (~2 weeks of focused work)
- Schema migration, all 4 tables + enums + store columns
- Invite-only affiliate flow
- Click tracking + cookie attribution
- Checkout metadata wiring
- Commission write in webhook
- Store-owner dashboard (list, settings, manual payout)
- Affiliate "Earnings" page in dashboard
- Emails: invite, commission earned, payout sent
- Refund clawback
- Plan tier gating

### V1 (+1 week)
- Self-serve affiliate apply flow (public page per store)
- Daily commission digest email
- Better stats: revenue-driving links, top buyers per affiliate
- Per-product commission overrides
- Coupon-code-based attribution (affiliate has both a link AND a code)

### V2 (later)
- Stripe Connect auto-payouts
- Multi-level (2-tier) commissions for top-tier plan
- Affiliate marketplace — public directory of stores accepting applications
- Anti-fraud: device fingerprinting, IP geolocation flags

---

## 17. Acceptance criteria (definition of done for MVP)

- [ ] Store owner can enable the program, set a default rate, invite an affiliate by email.
- [ ] Affiliate receives email, accepts invite, sees their unique link.
- [ ] Clicking the link sets a cookie that survives ≥30 days across browsing sessions.
- [ ] A purchase made within the cookie window writes a `pending` commission row.
- [ ] Refunded order voids the commission within 1 minute of the Stripe refund webhook.
- [ ] Store owner can see total owed per affiliate and mark a payout as paid.
- [ ] Affiliate gets emails for: invite, each commission, each payout.
- [ ] Starter-tier users see an upgrade CTA, not the feature.
- [ ] Sitemap and vs-pages updated: replace "Affiliate program — roadmap" rows with "Yes" across [`client/src/data/competitors.ts`](client/src/data/competitors.ts).

---

## 18. Files that will be touched (insertion map)

| File | Change |
|---|---|
| [`shared/schema.ts`](shared/schema.ts) | Add 4 tables, 3 enums, 4 columns on `stores` |
| `migrations/00XX_affiliate.sql` | Generated by Drizzle |
| [`server/routes.ts`](server/routes.ts) | Mount new `routes/affiliate.ts` |
| `server/routes/affiliate.ts` | NEW — all `/api/affiliate/*` endpoints |
| [`server/webhookHandlers.ts`](server/webhookHandlers.ts) | Commission write on `checkout.session.completed`; void on `charge.refunded` |
| [`server/emails.ts`](server/emails.ts) | 5 new email templates |
| [`server/storage.ts`](server/storage.ts) | CRUD helpers for new tables |
| [`server/og-tags.ts`](server/og-tags.ts) | Inject tracking script on storefront paths |
| [`client/src/components/dashboard/sidebar.tsx`](client/src/components/dashboard/sidebar.tsx) | Add "Affiliates" + conditional "Earnings" nav |
| [`client/src/pages/dashboard/affiliates.tsx`](client/src/pages/dashboard/affiliates.tsx) | NEW — owner dashboard |
| `client/src/pages/dashboard/earnings.tsx` | NEW — affiliate-side dashboard |
| [`client/src/App.tsx`](client/src/App.tsx) | Register new routes |
| [`client/src/lib/cart-context.tsx`](client/src/lib/cart-context.tsx) | Read cookie, pass to checkout |
| [`client/src/data/competitors.ts`](client/src/data/competitors.ts) | Flip "Affiliate program" rows from "Roadmap" to "Yes" |

---

## 19. Open risks

1. **Per-store Stripe keys make Connect transition hard.** If we ever want auto-payouts, we'll need to migrate to Connect at the platform level. Worth scoping that before V1 grows the manual flow too far.
2. **EU VAT on commissions.** Commissions paid to EU affiliates may have tax obligations. Currently out of scope; document clearly.
3. **Custom domain attribution.** Cookies are domain-scoped — if a buyer clicks an affiliate link on `creator.com` (custom domain) then checks out on `sellisy.com/s/creator`, attribution breaks. Plan: always do attribution on the domain that handles checkout. Verify the custom-domain rewrite in [`server/og-tags.ts`](server/og-tags.ts) preserves cookies.
4. **Mobile in-app browser cookie reliability.** TikTok / Instagram in-app browsers strip cookies on app switch. Mitigation: use sessionStorage as a fallback + URL-param survival across same-session navigation.

---

## 20. Suggested first PR

To de-risk: start with **schema migration + storage helpers + the click endpoint** in one PR. No UI yet. Verifies the data model lands cleanly, the click pipeline works, and we can write a fake commission with a curl. Everything else builds on that foundation.
