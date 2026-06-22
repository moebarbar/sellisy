import type { BlogArticle } from "./types";

export const setUpStripe: BlogArticle = {
  slug: "how-to-set-up-stripe-to-sell-digital-products",
  title: "How to Set Up Stripe to Sell Digital Products (2026)",
  h1: "How to Set Up Stripe to Sell Digital Products in 2026",
  description:
    "A step-by-step guide to selling digital downloads with Stripe — payment links vs. a storefront, automatic file delivery, fees, tax, and the fastest setup.",
  excerpt:
    "Stripe is the cleanest way to take payments for digital products — but raw Stripe leaves you to handle delivery, tax, and the storefront yourself. Here's how to set it up the easy way.",
  category: "Guides",
  keyword: "how to set up Stripe to sell digital products",
  datePublished: "2026-06-13",
  dateModified: "2026-06-13",
  readMinutes: 9,
  heroVariant: "stripe",
  eyebrow: "Guides",
  sections: [
    { type: "p", text: "Stripe is the payment processor most serious digital sellers use, because it's reliable, takes a predictable fee (~2.9% + $0.30 in the US), and pays out straight to your bank. But Stripe by itself only does one thing: it takes the money. Everything around the sale — delivering the file, hosting the product page, handling tax — is on you. This guide covers both the raw-Stripe route and the much faster way." },
    { type: "h2", text: "First: do you need a website?", id: "need-website" },
    { type: "p", text: "No — but you need *something* between the buyer and the file. There are three common setups, from most DIY to least:" },
    { type: "ul", items: [
      "**Stripe Payment Links** — create a link that takes payment with no code. But Stripe won't deliver your file or show a real product page; you'd email the download manually or rig up automation.",
      "**Stripe + a developer / plugin** — embed Stripe Checkout on your own site and build delivery yourself (or with a plugin like Easy Digital Downloads on WordPress). Full control, real setup work.",
      "**A storefront that connects your Stripe** — you keep Stripe-direct economics, and the platform handles the product page, automatic delivery, license keys, and customer accounts for you. Fastest by far.",
    ]},
    { type: "h2", text: "The raw-Stripe route, step by step", id: "raw-stripe" },
    { type: "ol", items: [
      "**Create a Stripe account** at stripe.com and complete verification (business details, bank account).",
      "**Add your product** in the Stripe dashboard under Products — name, price, currency.",
      "**Create a Payment Link** or Checkout session for that product.",
      "**Handle delivery.** This is the gap: Stripe charges the card but doesn't send the file. You'll either email it manually after each sale, or connect automation (a webhook + storage) to deliver the download link automatically.",
      "**Handle tax.** If you sell internationally, you may owe VAT/sales tax. Stripe Tax can calculate it, but you're still the merchant of record responsible for remitting it.",
    ]},
    { type: "callout", variant: "warning", title: "The delivery gap is the catch", text: "Most people who \"just use Stripe\" hit a wall right after the first sale: the payment worked, but now they're manually emailing files to every buyer. Automating delivery, expiring download links, and license keys is real engineering — or a feature you get for free on a storefront platform." },
    { type: "h2", text: "The faster route: connect your own Stripe to a storefront", id: "storefront" },
    { type: "p", text: "If you want Stripe's economics without building the plumbing, connect your Stripe account to a storefront platform. You get the best of both:" },
    { type: "ul", items: [
      "**Payouts still go straight to your Stripe** — same direct, low-fee economics, no middleman taking a cut.",
      "**Automatic file delivery** — the buyer gets a secure, expiring download link the moment payment clears.",
      "**A real product page and storefront** — branded, mobile-ready, no code.",
      "**Extras handled for you** — license keys, customer accounts, refunds, even subscriptions and courses.",
    ]},
    { type: "callout", variant: "tip", title: "Connect-your-own-Stripe ≠ a fee on top", text: "Look for a platform with a flat monthly fee and 0% per-sale. That way the only cut on your sale is Stripe's own ~2.9% + $0.30 — the same as if you'd built everything yourself, minus the weeks of building." },
    { type: "h2", text: "What Stripe costs", id: "fees" },
    { type: "p", text: "Stripe's standard US rate is about **2.9% + $0.30 per successful card charge** (international cards and currency conversion can add ~1%+). That fee is unavoidable for any business taking cards — it's not a platform fee. The thing you control is whether a *platform* takes an additional percentage on top." },
    { type: "cta", heading: "Connect your Stripe in 2 minutes", text: "Sellisy plugs into your own Stripe and adds the storefront, automatic delivery, and license keys — 0% per-sale fees, flat from $9/mo.", href: "/", label: "Set up your store" },
    { type: "p", text: "Deciding between processors? Read [Stripe vs PayPal for digital products](/blog/stripe-vs-paypal-for-digital-products). Worried about fees adding up? See [how to keep 100% of your sales](/blog/how-to-keep-100-percent-of-your-sales)." },
  ],
  faq: [
    { q: "Can I sell digital products with just Stripe?", a: "Yes, using Stripe Payment Links or Checkout — but Stripe only takes the payment. It won't host a product page or deliver your file automatically, so you'll handle delivery and tax yourself or connect your Stripe to a storefront that does it for you." },
    { q: "Do I need a website to use Stripe?", a: "Not strictly. Stripe Payment Links work with no website. But you still need a way to deliver the file after payment — which is why most sellers connect Stripe to a simple storefront that handles the product page and automatic delivery." },
    { q: "What are Stripe's fees for digital products?", a: "About 2.9% + $0.30 per successful card charge in the US, with roughly 1%+ extra for international cards and currency conversion. This is a payment-processing fee that any card-accepting business pays — separate from any platform fee." },
    { q: "How do I deliver a file automatically after a Stripe payment?", a: "You either build a webhook that emails a secure download link when payment succeeds, use a plugin (like Easy Digital Downloads on WordPress), or connect your Stripe to a storefront platform that delivers the file automatically with expiring links and license keys built in." },
  ],
};
