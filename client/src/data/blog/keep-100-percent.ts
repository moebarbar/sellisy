import type { BlogArticle } from "./types";

export const keep100Percent: BlogArticle = {
  slug: "how-to-keep-100-percent-of-your-sales",
  title: "How to Sell Digital Products and Keep 100% of Sales",
  h1: "How to Sell Digital Products and Keep 100% of Every Sale",
  description:
    "Platform fees quietly take 5–10% of every digital sale. Here's the real math, the difference between platform and processor fees, and how to keep 100%.",
  excerpt:
    "Most platforms take a cut of every sale you make. We break down the real fee math across a revenue ladder — and show where keeping 100% actually starts paying off.",
  category: "Fees & Money",
  keyword: "keep 100% of your sales",
  datePublished: "2026-06-13",
  dateModified: "2026-06-13",
  readMinutes: 8,
  heroVariant: "keep100",
  eyebrow: "Fees & Money",
  sections: [
    {
      type: "p",
      text: "Every time you sell a digital product through a typical platform, two different fees come out of your payment — and most creators only notice one of them. Understanding the difference is the single highest-leverage thing you can learn about selling online, because at scale it's the difference between keeping your money and handing a percentage of it to a platform forever.",
    },
    {
      type: "p",
      text: "This guide breaks down exactly what \"keep 100%\" means, the honest math across a real revenue ladder, and how to structure your store so the only fee you pay is the one you can't avoid.",
    },
    {
      type: "h2",
      text: "Platform fees vs. payment-processor fees",
      id: "two-fees",
    },
    {
      type: "p",
      text: "There are two separate fees on a digital sale, and they are not the same thing:",
    },
    {
      type: "ul",
      items: [
        "**Payment-processor fee** — what Stripe or PayPal charges to move the money. In the US this is around **2.9% + $0.30** per transaction. Every business that takes card payments pays this. It is genuinely unavoidable.",
        "**Platform fee** — what the selling platform takes on top, just for hosting your store. Gumroad charges a flat 10% per sale. Payhip charges 5% on its free plan. Merchant-of-record platforms like Lemon Squeezy charge around 5% + $0.50. This fee is **optional** — it depends entirely on which platform you choose.",
      ],
    },
    {
      type: "callout",
      variant: "key",
      title: "What \"keep 100%\" actually means",
      text: "No platform can make payment-processor fees disappear — Stripe and PayPal still charge their ~2.9% + $0.30. \"Keep 100%\" means a platform takes **0% on top**: no per-sale platform cut. You pay only the processor, the same as any independent business, and the money lands directly in your own Stripe or PayPal account.",
    },
    {
      type: "h2",
      text: "The real fee math, across a revenue ladder",
      id: "fee-math",
    },
    {
      type: "p",
      text: "Percentages feel abstract until you put dollars on them. Below is the monthly platform cut on the same sales volume — assuming an average order of $25 — across common platforms. (Everyone additionally pays the ~2.9% + $0.30 processor fee, so we hold that constant and compare only the platform's cut.)",
    },
    {
      type: "table",
      caption: "Estimated monthly platform fee by revenue. Illustrative; always check each platform's current pricing.",
      headers: ["Monthly sales", "Gumroad (10%)", "Payhip (5% free)", "Lemon Squeezy (5% + $0.50)", "Sellisy (flat $29/mo)"],
      rows: [
        ["$500 (20 sales)", "$50", "$25", "$35", "$29"],
        ["$1,000 (40 sales)", "$100", "$50", "$70", "$29"],
        ["$5,000 (200 sales)", "$500", "$250", "$350", "$29"],
        ["$10,000 (400 sales)", "$1,000", "$500", "$700", "$29"],
        ["$25,000 (1,000 sales)", "$2,500", "$1,250", "$1,750", "$29"],
      ],
      highlightCol: 4,
    },
    {
      type: "p",
      text: "The pattern is the structural story of this entire category: a **percentage fee grows with your success**, while a **flat fee stays put**. A new seller doing $500/mo barely notices a 10% cut. A seller doing $10,000/mo is handing over $1,000 every single month — $12,000 a year — for the same hosting they could get for a fixed price.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Where the breakeven sits",
      text: "A flat monthly fee beats a percentage cut the moment your platform-fee total would exceed the subscription. Against a 10% cut, a $29/mo plan pulls ahead at roughly $290/mo in sales. Against a 5% cut, around $580/mo. Past that point, every extra dollar you earn stays yours.",
    },
    {
      type: "h2",
      text: "Why some platforms can't offer 0%",
      id: "why-percentage",
    },
    {
      type: "p",
      text: "It's worth understanding why the percentage model is so common. When a platform takes a cut of every sale, its revenue scales automatically with yours — you doing well makes them do well, with no extra work on their side. That's a great business model for the platform. It's a worse deal for you the more you grow.",
    },
    {
      type: "p",
      text: "It also creates a conflict of interest around fee transparency: a platform built on a 10% cut has little incentive to publish a clear chart showing what 10% costs you at $10,000/mo. The platforms that can talk openly about fees are the ones that don't depend on them.",
    },
    {
      type: "h2",
      text: "How to actually keep 100%",
      id: "how-to",
    },
    {
      type: "p",
      text: "Keeping 100% comes down to one architectural choice: **sell on a platform that connects to your own payment account instead of acting as the middleman.** Concretely:",
    },
    {
      type: "ol",
      items: [
        "**Use your own Stripe and/or PayPal.** When you connect your own account, payouts go directly to you on the processor's normal schedule — there's no platform sitting between you and your money, and no platform cut skimmed in transit.",
        "**Choose flat pricing over per-sale pricing.** A predictable monthly fee means your costs don't balloon as you grow. You can forecast margins and price with confidence.",
        "**Confirm the platform takes 0% on top.** Read the pricing page carefully. \"No monthly fee\" often means \"we take a percentage instead.\" You want the opposite: a clear monthly price and 0% per-sale.",
        "**Keep delivery, tax, and storefront in one place.** Keeping 100% is only worth it if you're not bolting together five tools to replace what a platform gives you. The goal is processor-direct economics *with* the storefront, automatic file delivery, and customer management included.",
      ],
    },
    {
      type: "cta",
      heading: "Keep 100% of every sale",
      text: "Sellisy connects your own Stripe or PayPal, takes 0% on top, and includes the storefront, delivery, and customer tools — from a flat $9/mo.",
      href: "/",
      label: "See how Sellisy works",
    },
    {
      type: "h2",
      text: "The bottom line",
      id: "bottom-line",
    },
    {
      type: "p",
      text: "You can't escape payment-processor fees — they're the cost of accepting money online. But the platform fee on top is a choice, and it's the one that compounds. At low volume the difference is a rounding error. At real volume, a percentage cut quietly becomes one of your largest recurring expenses. Picking a flat-fee, own-your-processor setup early means that as your sales grow, the extra money stays where it belongs: with you.",
    },
    {
      type: "p",
      text: "Next, see the full breakdown in our [digital product platform fees comparison](/blog/digital-product-platform-fees-compared), or if you're leaving a percentage-based platform, read our guide to the [best Gumroad alternatives](/blog/best-gumroad-alternatives).",
    },
  ],
  faq: [
    {
      q: "Does \"0% transaction fees\" mean the sale is completely free?",
      a: "No. \"0% platform fee\" means the platform takes nothing on top of the sale, but you still pay your payment processor (Stripe or PayPal), which is around 2.9% + $0.30 per transaction. That processor fee is unavoidable for any business that accepts cards.",
    },
    {
      q: "At what point does a flat monthly fee beat a percentage cut?",
      a: "It beats a percentage the moment the percentage you'd pay exceeds the subscription. Against a 10% cut, a $29/mo plan wins at about $290/mo in sales; against a 5% cut, around $580/mo. Above that, the flat fee saves you money — and the savings grow with your revenue.",
    },
    {
      q: "Do I keep 100% if I use my own Stripe account?",
      a: "You keep 100% of the platform's cut — the platform takes nothing, and payouts go straight to your Stripe account. You still pay Stripe's standard processing fee, which you'd pay running any independent online business.",
    },
    {
      q: "How much do platform fees actually cost at $10,000/mo?",
      a: "On a 10% platform like Gumroad, $10,000/mo in sales means $1,000/mo — $12,000/year — in platform fees alone, separate from processing. On a flat $29/mo plan, that same volume costs $29, and you keep the rest.",
    },
  ],
};
