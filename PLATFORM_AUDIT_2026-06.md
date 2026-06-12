# Sellisy Platform Audit — June 2026

Full-platform audit across five dimensions: product surface, backend architecture,
UI/UX, competitive position, and growth/monetization infrastructure. Synthesized
from parallel deep-dive reviews of the entire codebase.

---

## 1. Executive Summary

**Platform health: B+ (strong foundation, clear leaks).**

Sellisy is further along than its marketing admits. The feature surface is broad
and mostly polished: 7-theme storefront builder, full product/bundle/coupon CRUD,
Stripe + PayPal with tax/refunds/PWYW, enterprise-grade affiliate program with
clawback, a real LMS (modules, drip, quizzes, certificates, discussions),
newsletter campaigns, KB + blog block editors, customer portal with magic-link
auth, and seller analytics with funnel tracking.

**The four moats (defensible, unique):**
1. 0% transaction fees on the seller's own Stripe/PayPal
2. Unlimited multi-storefront (no competitor offers this)
3. Bundled PLR/MRR library (100% unique)
4. $9 entry price with real features behind it

**The four leaks (where deals die):**
1. **Email automation gap** — newsletter broadcasts only; no drips, no abandoned
   cart, no post-purchase sequences. Loses deals to Kit/Kajabi/Podia.
2. **No subscriptions/memberships** — 7 of 12 tracked competitors have recurring
   products; Sellisy has zero recurring revenue primitive for sellers.
3. **Zero social proof** — no case studies, no payout totals, no creator quotes
   anywhere. Every competitor flashes "$XX million paid out."
4. **Revenue features half-wired** — upsell data model exists but checkout never
   uses it; buyers don't even get a download-link email after purchase.

---

## 2. Audit Findings by Area

### 2.1 Product Surface (maturity map)

| Area | Status |
|---|---|
| Storefront builder (7 themes, custom domain via CF for SaaS) | Polished |
| Products / bundles / coupons / orders / downloads | Polished |
| Payments: Stripe (+Tax) & PayPal — one-time, PWYW, refunds | Polished |
| Affiliate program (self-serve + invite, clawback, payouts) | Polished |
| Course LMS (drip, quizzes, certificates, comments) | Polished |
| Newsletter campaigns, KB, blog (block editors) | Polished |
| Customer portal (magic link, purchase history, re-download) | Polished |
| Analytics (revenue, products, customers, traffic, coupons) | Polished |
| Gumroad importer (OAuth + BullMQ + AI description rewrite) | Functional |
| Marketing playbook | Basic |
| Marketplace /discover | Basic (newest-first, no search) |
| Upsells / order bumps | **Schema only — checkout never wired** |
| Subscriptions / memberships | **Absent** |
| Cart abandonment recovery | **Absent** |
| Outbound API / Zapier / webhooks | **Absent** |
| Discord role grants | Stub |
| Stripe Connect payouts (affiliates) | Manual only |
| Embeddable widgets | Routes exist, no dashboard UI |

### 2.2 Backend (security + performance)

**Critical fixes needed:**
- `server/webhookHandlers.ts` — **SendGrid webhook has no signature verification.**
  Forged events can suppress arbitrary buyer emails.
- `stores.paypalClientSecret` stored **plaintext** in DB.
- Missing indexes: `orders(storeId, status)`, `orderItems(orderId)`,
  `customers(email)`, `products(ownerId, status)`, `blogPosts(storeId, isPublished)`.
- N+1 in orders list (`server/routes/orders.ts:121-129`) — 1 + N queries via
  `Promise.all(map(getOrderItemsByOrder))`; should be one JOIN.
- `getStoreCustomers()` unbounded — no pagination, ARRAY_AGG over all rows.
- No caching anywhere (Redis is BullMQ-only). Store metadata re-queried on every
  storefront request.
- Tests: ~2 unit test files; 0% coverage on routes/storage/webhooks.
- No public `/health` endpoint; logs stdout-only, no levels, no correlation IDs.

**Solid:** Clerk auth + plan gating, Stripe/PayPal signature verification,
webhook idempotency table, rate limiters on auth/checkout, audit logging
discipline, graceful shutdown, Sentry.

### 2.3 UI/UX (worst gaps, prioritized)

1. 16-item sidebar with no grouping or progressive disclosure.
2. Three confusing product sections (Library / My Products / Products) with no
   visible hierarchy.
3. **No post-purchase email with download links** — buyer must click a button on
   the success page; lose the tab, lose the files (until they find the portal).
4. Getting-started checklist can't be dismissed until 100% complete.
5. Design system split three ways: landing (bespoke), auth (Clerk hardcoded hex),
   dashboard (shadcn). Storefront themes carry their own CSS.
6. Mobile: store context hidden (`hidden sm:flex`), tables not card-ified.
7. Course player hides lesson descriptions from students.
8. Form validation is toast-only — no inline errors, no `aria-invalid`.
9. Accessibility is Radix-dependent; custom components lack ARIA.
10. Landing page has zero social proof section.

### 2.4 Competitive position

- vs-pages shipped for 12 competitors; 5 of 6 Tier-1 roadmap gaps closed
  (affiliates, LMS, Stripe Tax, trial, PDF watermarking). Email automation is
  the remaining Tier-1 gap.
- The 0%-fee wedge only beats Gumroad above ~$90/mo in sales — the landing page
  should show this math, not hide it.
- "Roadmap" labels on vs-pages read as vaporware; ship or remove.
- Who Sellisy is for: product sellers + agencies/multi-brand creators. Not
  high-touch coaches (Kajabi), not communities (Whop), not newsletter-first (Kit).

---

## 3. The Five Unbeatable Features

### Feature 1 — AI Store Launcher: "Describe your business, get a revenue-ready store in 60 seconds" (AI)
The PLR library is the unique asset; weaponize it. New seller types one sentence
("I sell productivity templates for freelance designers") → AI generates store
name + slug, picks a theme + accent palette, selects 5–10 matching PLR products
from the library, writes all product descriptions + store tagline + about + FAQs,
and creates a launch checklist. The seller lands on a LIVE store, not an empty
dashboard. No competitor can copy this without a PLR library to draw from.
*Builds on: PLR library, theme system, existing Claude integration.*

### Feature 2 — Creator Growth Engine: email automation + cart recovery (non-AI core, AI-assisted copy)
Closes the #1 competitive leak. Visual 3–5 step automations: welcome drip on
newsletter signup, post-purchase sequence (download link → cross-sell → review
request), abandoned-checkout recovery (requires capturing email at checkout
start), win-back for lapsed buyers. AI drafts every email in the seller's voice.
*Builds on: SendGrid infra, suppression list, newsletter block editor, BullMQ.
New: automations table, trigger engine, abandoned-checkout capture.*

### Feature 3 — Memberships & Subscriptions (non-AI)
The biggest missing product primitive — recurring products on the seller's own
Stripe (subscriptions API, not Connect). Monthly/yearly tiers gate content:
courses, KB pages, download libraries, Discord roles (finishes the stub).
Combined with 0% fees this is lethal: Whop takes 3%, Kajabi charges $89+/mo —
"run your membership on your own Stripe, keep 100%" is a category-winning pitch.
*Builds on: Stripe per-store keys, customer portal, LMS, webhook idempotency.
New: subscription tables, billing webhooks, dunning, member-gating middleware.*

### Feature 4 — One-Click Revenue Funnels: upsells, order bumps, A/B pricing (non-AI core, AI suggestions)
The schema already has `upsellProductId`/`upsellBundleId` — wire it. Pre-purchase
order bump checkbox on checkout, post-purchase one-click upsell (card already
captured via Stripe), bundle-savings UX at cart. AI layer suggests pairings from
co-purchase data ("buyers of X also bought Y") and flags underpriced products.
Direct seller-revenue lift = the strongest retention lever Sellisy has.
*Builds on: existing upsell columns, checkout-success upsell UI, analytics events.*

### Feature 5 — Sellisy Brain: AI marketing copilot wired to real store data (AI)
Turn the static marketing playbook into an agent that reads the seller's actual
analytics weekly and produces: a prioritized action plan ("conversion on Product
X dropped 40% — here are 3 fixes"), drafted newsletter/social/blog content
referencing real products and numbers, SEO suggestions for product pages, and
pricing experiments. Kajabi charges $89+/mo without this; at $29 it makes Growth
irresistible and creates a daily-active habit loop for sellers.
*Builds on: analytics.ts, marketing playbook tables, newsletter editor, Claude.*

**Honorable mentions (not top-5 but cheap wins):** marketplace v2 (search +
categories + trending on /discover), outbound webhooks/Zapier, wishlist,
creator case-study program (marketing, not code — single highest-ROI item).

---

## 4. UI/UX Advances

1. **Sidebar restructure** — group 16 items into Sell / Content / Grow / Insights /
   Settings with collapsible sections; "Earnings"/"Data Health" contextual.
2. **Unified product flow** — one "Products" hub with tabs (Store / Mine / Library);
   import wizard ends with "Publish now?" prompt.
3. **Onboarding wizard v2** — AI Store Launcher becomes the onboarding; checklist
   shrinks to 3 items and is dismissible.
4. **Post-purchase email** (ship in week 1) — order confirmation with download
   links + portal link.
5. **Design-system unification** — landing + auth migrate to shadcn tokens; Clerk
   appearance reads CSS variables; storefront themes consume token system.
6. **Inline form validation** — field-level errors + `aria-invalid` +
   `aria-describedby`; toasts become secondary.
7. **Mobile pass** — store name in mobile sidebar, card layouts for tables,
   `prefers-reduced-motion` for count-up animations.
8. **Landing social proof** — creator spotlight section + live platform stats
   (stores created, downloads delivered) + payout-style counter.
9. **Course player polish** — show lesson descriptions, video resume timestamps,
   keyboard nav for carousel/lessons.
10. **Trust pass** — review-request email post-purchase (feeds Growth Engine),
    ratings on product cards by default.

---

## 5. Execution Plan

### Phase 0 — Hardening (Week 1) *do before any feature work*
- SendGrid webhook signature verification (security hole)
- Encrypt `paypalClientSecret` (AES-256-GCM like Gumroad tokens) + migration
- Add 5 missing indexes (one SQL migration, applied manually per policy)
- Fix orders N+1 → single JOIN
- **Ship post-purchase email with download links** (biggest UX win per LOC)
- Public `/health` endpoint
- Paginate `getStoreCustomers()`

### Phase 1 — UX Foundation (Weeks 2–3)
- Sidebar restructure + unified product flow
- Inline form validation on the 5 highest-traffic forms
- Mobile pass + reduced-motion
- Landing social proof section + review-request email
- Checklist dismissibility
- *(Parallel: finish storage split — Content/remaining domains — to unblock clean
  feature work)*

### Phase 2 — Revenue Funnels (Weeks 3–5) → Feature 4
- Order bump at checkout (data already there)
- Post-purchase one-click upsell on success page
- Bundle savings display at cart
- Co-purchase analytics query + AI pairing suggestions
- Metric: % orders with bump/upsell attached; target +10–15% seller AOV

### Phase 3 — Growth Engine (Weeks 5–9) → Feature 2
- Automations schema + trigger engine on BullMQ
- Checkout-start email capture → abandoned-checkout recovery (first automation)
- Post-purchase sequence + welcome drip templates
- AI email drafting (Claude, seller-voice prompt from store copy)
- Update all 12 vs-pages: email automation row flips to "Yes"
- Metric: recovered-cart revenue; automation adoption %

### Phase 4 — Memberships (Weeks 9–14) → Feature 3
- Subscription tables + Stripe subscription checkout on seller keys
- Billing webhooks (renewal, dunning, cancellation) through idempotency layer
- Member-gating for courses/KB/downloads; finish Discord role-grant stub
- Portal: manage subscription, update card, cancel
- New vs-page angle: "Whop charges 3% — keep 100% on your own Stripe"
- Metric: # stores with live membership; MRR flowing through platform

### Phase 5 — AI Store Launcher (Weeks 14–18) → Feature 1
- Intake (one sentence + optional socials) → generation pipeline (BullMQ):
  niche classification → PLR selection → theme/palette → copy generation →
  store assembly → preview/accept/regenerate UI
- Becomes default onboarding; old flow remains as "start from scratch"
- Metric: signup → first-published-store conversion; time-to-first-store

### Phase 6 — Sellisy Brain (Weeks 18–24) → Feature 5
- Weekly insights job: analytics snapshot → Claude → action plan w/ deep links
- Content studio: drafts referencing real products/numbers, one-click to
  newsletter/blog editors
- Anomaly alerts (conversion drops, traffic spikes) via email + dashboard
- Gate at Growth tier → upgrade driver
- Metric: weekly active sellers; Brain-attributed actions taken

### Continuous
- Integration tests for checkout + webhooks (start Phase 0, grow each phase)
- Storage split completion; dead-code removal (Replit fallbacks, legacy templates)
- Case-study pipeline: identify top sellers each phase, turn into landing content

---

## 6. Sequencing Logic

Order is deliberate: **Phase 2 before 3** (upsell wiring is days of work on an
existing schema and produces immediate seller-revenue proof), **3 before 4**
(Growth Engine emails are needed for membership dunning/win-back), **4 before 5**
(AI Launcher should generate stores with membership + funnel options available),
**5 before 6** (Brain needs the funnel/automation surface to recommend actions on).

Each phase ships independently and compounds: hardened core → smoother funnel →
sellers earn more per buyer → recurring revenue → instant onboarding → an AI
copilot that drives daily engagement. By Phase 6, the pitch is:

> "Describe your business. Get a live store with products in 60 seconds. Keep
> 100% of every sale — one-time or recurring. Your AI marketing team works
> every week. $29/mo."

No competitor can match that sentence without rebuilding their business model.
