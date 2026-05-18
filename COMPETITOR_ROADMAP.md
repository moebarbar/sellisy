# Competitor Research Report — What Sellisy should improve

> Generated alongside the `/vs/*` comparison pages. Read this when you want to
> know what to build next to close more deals against Gumroad, Lemon Squeezy,
> Payhip, Sellfy, Podia, SendOwl, Ko-fi, Stan Store, Whop, Kajabi, Kit, and
> Beacons.

---

## Current state

- 12 vs-pages shipped at `/vs/:slug` — see [`client/src/data/competitors.ts`](client/src/data/competitors.ts) for the comparison data.
- Landing page has a "HOW WE STACK UP VS THE REST" grid above the footer.
- Sitemap + robots updated; SSR meta/JSON-LD live for social crawlers.

## Pending decisions

_None — pricing is now locked to **$9 / $29 / $49**. Starter ($9) has no PLR library access. Library + AI tools + custom domain start at Growth ($29). All vs-pages, SSR meta, Stripe `PLAN_CONFIG`, and the `PLAN_FEATURES.basic` gate were updated together._

---

## Tier 1 — Real gaps competitors hit you on

These are the questions a prospect asks before paying you. Ship these first.

| # | Gap | Who has it | Why it matters | Suggested move |
|---|---|---|---|---|
| 1 | **Built-in affiliate program** | Gumroad, Lemon Squeezy, Payhip, Whop | Every Gumroad prospect expects it; self-serve growth lever | Unique-link + Stripe Connect transfer flow. Even MVP closes the gap. Mark "Coming soon" on vs pages today |
| 2 | **Course / lesson hosting (LMS)** | Podia, Kajabi, Payhip, Sellfy | Biggest "we don't do this" row across vs pages; locks out a huge creator segment | "Course" product type with chapters/lessons + Mux/Bunny embed for video |
| 3 | **Merchant of Record / VAT** | Lemon Squeezy (their #1 wedge), Paddle | EU/UK sellers can't legally ignore this; you're forcing them to set up Stripe Tax | Ship a Stripe Tax integration toggle in onboarding (much faster than becoming a MoR). Also evaluate Paddle/Polar partnership |
| 4 | **Email automation / sequences** | Kit, Kajabi, Beacons | "Newsletter campaigns" reads weaker than visual sequence builders | Add 3-step automation (post-purchase, abandoned-cart, drip). Or integrate Resend audiences + simple delay step UI |
| 5 | **PDF watermarking / per-buyer stamping** | SendOwl, Easy Digital Downloads | High-value PDF sellers (templates, ebooks) ask for this constantly | Server-side PDF stamp on download (buyer email/name in footer). Low effort, high trust signal |

## Tier 2 — Nice-to-haves that show up as comparison rows

| # | Gap | Who has it | Suggested move |
|---|---|---|---|
| 6 | Marketplace / discovery | Gumroad (Discover), Whop, Etsy | "Featured stores" / "New on Sellisy" surface on `/products` — light-touch, no algorithm needed |
| 7 | Discord auto-role granting | Whop | Stripe webhook → Discord bot grants role. ~1 day of work; closes the Whop conversation |
| 8 | Booking / calendar (1:1 calls) | Stan Store, Podia | Cal.com embed or partnership. A "Booking page" product type that points to Cal/SavvyCal works |
| 9 | Pay-what-you-want default UX | Gumroad, Ko-fi | First-class price model with slider + minimum |
| 10 | POD (print-on-demand) | Sellfy | **Skip** — Printful API integration is heavy. Document as "out of scope" |
| 11 | Newsletter Sponsor Network | Kit | **Don't build** — partner with Passionfroot or similar |

## Tier 3 — Polish that closes deals

| # | Gap | Suggested move |
|---|---|---|
| 12 | **Free trial or freemium tier** | Every competitor has *some* zero-cost entry. Either a 14-day free trial (no card) or a $0 tier with Sellisy footer branding. The proposed $9 tier helps but doesn't fully fill this gap |
| 13 | Customer reviews / ratings on product pages | Gumroad and Etsy have this baked in. Verified-buyer review system adds social proof + SEO |
| 14 | Bundle discounts shown at the cart | Sellfy and Podia show "Save $X" inline. You have bundles — surface the savings math visibly |
| 15 | Mobile-first storefront preview | Stan/Beacons brag about mobile-first. Mobile-preview toggle in template editor; reuses existing render path |
| 16 | App marketplace / Zapier-style integrations | Whop has apps. First-party Zapier + Make.com + Pabbly integrations would help |

## Tier 4 — Pricing & positioning observations

- **$19 entry is competitive vs everyone except free tiers.** The proposed $9 tier solves this for Ko-fi/Beacons/Payhip free-plan refugees.
- **"Connect your own Stripe" is a moat, not a liability.** Most competitors take a fee *because* they route payments — you don't. "You keep 100%" is genuinely differentiating and should be in the hero, not just pricing.
- **Multi-storefront is uniquely yours.** Almost no competitor offers it. Promote it more on the homepage — strong reason for agencies and PLR resellers to choose you.
- **PLR/MRR library is uniquely yours.** Doesn't appear in any competitor table because no one else has it. Keep hammering this on landing and `/vs` pages.

## Honest weaknesses surfaced while building the vs pages

1. **Roadmap items show up across 6+ vs pages.** "Affiliate program — roadmap", "Courses — roadmap". Either ship them, or remove "roadmap" and just acknowledge you don't do it. Repeated "roadmap" mentions look like vaporware to a careful prospect.
2. **"Branded customer portal" claim needs to deliver.** If a prospect screenshots Sellisy's portal next to Kajabi's, it has to actually look better.
3. **Zero social proof.** No case studies, no payout totals, no creator quotes. Every competitor flashes "$XX million paid out." One "$10k month on Sellisy" case study would close more deals than another feature.

## Suggested 90-day priority order

1. ~~**Affiliate program**~~ ✅ **Shipped** — full self-serve apply + invite-by-owner + commissions + payouts + emails (PR #1 through PR #4). Live on Growth+ tier. Vs-pages updated.
2. **Stripe Tax onboarding toggle** — kills the Lemon Squeezy objection cheaply.
3. **Free 14-day trial** — gets you in the consideration set against every freemium competitor. The $9 tier helps but a trial converts harder.
4. **Basic course product type** — opens up the entire Podia/Kajabi/Payhip course-creator market.
5. **PDF watermarking** — cheap to build, real trust signal.
6. **Reviews on product pages** — free SEO + social proof.

After these six, re-evaluate full LMS depth and Discord role automation based on actual funnel data.

---

## Detailed feature plans

- **#1 Affiliate program** → see [AFFILIATE_PLAN.md](AFFILIATE_PLAN.md) for the full A-Z spec (schema, API, UI, phasing, acceptance criteria).
