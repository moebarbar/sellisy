// Competitor comparison data for /vs/:slug pages.
// Pricing/features reflect publicly listed plans known as of early 2026.
// Treat specifics as a snapshot — verify on competitor sites before quoting.

export type CompetitorRow = {
  label: string;
  sellisy: string;
  competitor: string;
  // "sellisy" = Sellisy clearly wins this row, "competitor" = competitor wins,
  // "tie" = roughly even, "neutral" = informational only (no winner highlight).
  winner: "sellisy" | "competitor" | "tie" | "neutral";
};

export type CompetitorFAQ = { q: string; a: string };

export type Competitor = {
  slug: string;
  name: string;
  // Short tagline used on the landing grid card.
  tagline: string;
  // Accent color used as the competitor's brand tone (CSS color).
  accent: string;
  // One-paragraph "who they are" intro shown on the vs page.
  intro: string;
  // The single biggest reason a creator would prefer Sellisy.
  oneLineVerdict: string;
  // Headline pricing snapshot (creator-readable, not legal copy).
  pricingSellisy: string;
  pricingCompetitor: string;
  // Side-by-side feature matrix.
  rows: CompetitorRow[];
  // Honest "when the competitor is actually a better fit" callout.
  whenTheyWin: string[];
  // Why Sellisy wins for most creators.
  whySellisyWins: string[];
  faqs: CompetitorFAQ[];
};

const SELLISY_PRICING = "From $9/mo, flat. 0% transaction fee — keep 100% of every sale (you connect your own Stripe / PayPal). Library access starts at $29 Growth.";

const COMMON_ROWS = (extra: CompetitorRow[]): CompetitorRow[] => extra;

export const COMPETITORS: Competitor[] = [
  {
    slug: "gumroad",
    name: "Gumroad",
    tagline: "Keep 100% instead of giving up 10% per sale",
    accent: "#FF90E8",
    intro:
      "Gumroad is the OG creator marketplace — easy to start, but you give up roughly 10% of every sale and your storefront lives on a gumroad.com URL. Sellisy is the opposite trade: a flat monthly plan from $9, your own brand, and you keep the full price tag.",
    oneLineVerdict:
      "If you sell more than ~$90/mo, Sellisy's flat $9 plan pays for itself versus Gumroad's 10% cut.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free to start. 10% flat fee on every sale (+ Stripe/PayPal processing). No subscription tier.",
    rows: COMMON_ROWS([
      { label: "Transaction fee", sellisy: "0%", competitor: "10% per sale", winner: "sellisy" },
      { label: "Monthly cost", sellisy: "$9 / $29 / $49", competitor: "$0", winner: "competitor" },
      { label: "Own your customer email list", sellisy: "Yes", competitor: "Limited (Gumroad gates contact)", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "No — gumroad.com/yourname", winner: "sellisy" },
      { label: "Multiple storefronts / brands", sellisy: "Up to unlimited", competitor: "One profile only", winner: "sellisy" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Single product-page style", winner: "sellisy" },
      { label: "PLR / MRR product library", sellisy: "Hundreds, ready to resell", competitor: "Not included", winner: "sellisy" },
      { label: "AI creator tools (mockups, copy)", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Limited", winner: "sellisy" },
      { label: "Coupon codes", sellisy: "Yes", competitor: "Yes", winner: "tie" },
      { label: "Affiliate program", sellisy: "Yes (Growth+)", competitor: "Built-in", winner: "tie" },
      { label: "Marketplace traffic", sellisy: "No (you own SEO)", competitor: "Yes (Gumroad Discover)", winner: "competitor" },
      { label: "Customer portal & re-downloads", sellisy: "Yes — your brand", competitor: "Gumroad library (their brand)", winner: "sellisy" },
      { label: "Sell software / license keys", sellisy: "Yes", competitor: "Yes (license key add-on)", winner: "tie" },
      { label: "Stripe / PayPal direct payout", sellisy: "Yes — your account", competitor: "Routed through Gumroad", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "You sell less than $90/mo and want zero fixed cost.",
      "You rely heavily on the Gumroad Discover marketplace for new buyers.",
      "You rely heavily on Gumroad's discovery marketplace (Gumroad Discover) for new buyers.",
    ],
    whySellisyWins: [
      "10% of every sale adds up fast — at $1k/mo that's $100 to Gumroad. Sellisy is $9 flat.",
      "Your storefront lives on your own domain with your own brand, not gumroad.com/you.",
      "You get the customer email + Stripe payout directly, not as a Gumroad payout cycle.",
      "Built-in PLR library, AI tools, and multi-store — Gumroad has none of these.",
    ],
    faqs: [
      {
        q: "Can I import my Gumroad products into Sellisy?",
        a: "Yes — Sellisy has a Gumroad importer that pulls your products, descriptions, prices, and files in one click.",
      },
      {
        q: "Will I lose my Gumroad audience if I switch?",
        a: "No. You can run both side-by-side, or migrate gradually. Sellisy doesn't lock you in — your customer list and files are yours.",
      },
      {
        q: "Is Sellisy actually cheaper than Gumroad?",
        a: "If you do more than ~$90 in monthly sales, Sellisy's $9 Starter beats Gumroad's 10% cut. The bigger you get, the wider the gap.",
      },
    ],
  },

  {
    slug: "lemon-squeezy",
    name: "Lemon Squeezy",
    tagline: "Same selling power without the 5% per-transaction tax",
    accent: "#FFC233",
    intro:
      "Lemon Squeezy is built for SaaS founders who want a Merchant of Record handling VAT and global tax filings. That's powerful — and you pay 5% + $0.50 for it on every sale. Sellisy gives you a one-click Stripe Tax integration that handles the calculations at checkout, without the per-sale fee — you remain the merchant of record yourself.",
    oneLineVerdict:
      "Sellisy wins when you want a creator storefront with 0% fees and your own Stripe Tax setup. Lemon Squeezy wins only if you specifically want someone else filing your tax returns for you.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free to start. 5% + $0.50 per transaction. Merchant of Record fee is bundled in.",
    rows: COMMON_ROWS([
      { label: "Transaction fee", sellisy: "0%", competitor: "5% + $0.50 per sale", winner: "sellisy" },
      { label: "Monthly cost", sellisy: "$9 / $29 / $49", competitor: "$0", winner: "competitor" },
      { label: "Merchant of Record (handles VAT/tax)", sellisy: "No — Stripe Tax integration instead", competitor: "Yes (their headline feature)", winner: "competitor" },
      { label: "Own your Stripe / PayPal account", sellisy: "Yes — direct payout", competitor: "No — they're the merchant", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Minimal — product pages", winner: "sellisy" },
      { label: "PLR / MRR product library", sellisy: "Hundreds, ready to resell", competitor: "Not included", winner: "sellisy" },
      { label: "AI creator tools (mockups, copy)", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "Yes (strong)", winner: "tie" },
      { label: "Subscriptions", sellisy: "Built-in (0% fee, your own Stripe)", competitor: "Yes", winner: "sellisy" },
      { label: "Affiliate program", sellisy: "Yes (Growth+)", competitor: "Built-in", winner: "tie" },
      { label: "Email marketing", sellisy: "Campaigns + automated flows + AI drafting", competitor: "Built-in", winner: "tie" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Generic", winner: "sellisy" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One store", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "You sell SaaS to a global B2B audience and need Merchant-of-Record VAT/sales-tax compliance baked in.",
      "You don't want to deal with Stripe Tax or international VAT registration at all.",
      "You sell to a global B2B audience and need someone else handling sales tax filings (Sellisy hands you a Stripe Tax integration, not a full MoR service).",
    ],
    whySellisyWins: [
      "Keep your own Stripe/PayPal — direct payouts, not a payout cycle from a third party.",
      "No 5% + $0.50 chip off every sale. At $5k/mo that's $250 you'd hand to Lemon Squeezy — Sellisy is $9–$49 flat.",
      "Multi-storefront, PLR library, AI tools — Lemon Squeezy isn't built for creators with multiple brands.",
      "Branded customer portal where buyers re-download under your name, not theirs.",
    ],
    faqs: [
      {
        q: "Does Sellisy handle VAT and sales tax?",
        a: "Yes — toggle 'Automatic tax' in your store settings and Sellisy passes the right flags to Stripe Tax. Stripe computes VAT/sales tax at checkout for every buyer based on their location. You're still the merchant on record (you register where you owe tax and Stripe files reports), but the per-transaction math is handled. If you want a full Merchant of Record service (someone files for you), Lemon Squeezy still wins on that.",
      },
      {
        q: "Can I sell software licenses on Sellisy?",
        a: "Yes — Sellisy supports license-key delivery for software and SaaS-style products.",
      },
      {
        q: "Will my Stripe account work?",
        a: "Yes — connect your existing Stripe (and/or PayPal) and payouts go straight to you.",
      },
    ],
  },

  {
    slug: "payhip",
    name: "Payhip",
    tagline: "More design control, more creator tools, similar flat pricing",
    accent: "#3FAEFF",
    intro:
      "Payhip is a popular Gumroad alternative with tiered fees and decent storefronts. Sellisy goes further: 6 designer templates, a PLR library, AI creator tools, and a branded customer portal — at a competitive flat price.",
    oneLineVerdict:
      "Payhip's free plan is great for testing. For a serious storefront, Sellisy's flat $9 with 0% fee beats Payhip's free tier (5% fee) above ~$180/mo, and crushes Payhip Plus ($29 + 2%) outright.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free: 5% transaction fee. Plus: $29/mo + 2%. Pro: $99/mo + 0%.",
    rows: COMMON_ROWS([
      { label: "Transaction fee", sellisy: "0%", competitor: "5% / 2% / 0% by tier", winner: "sellisy" },
      { label: "Entry price", sellisy: "$9/mo flat", competitor: "$0 (with 5% fee)", winner: "competitor" },
      { label: "0% transaction fee", sellisy: "From $9/mo", competitor: "Requires $99/mo Pro", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "1 default theme", winner: "sellisy" },
      { label: "PLR / MRR library included", sellisy: "Yes — hundreds of products", competitor: "No", winner: "sellisy" },
      { label: "AI tools (mockups, copy)", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "Memberships / courses", sellisy: "Built-in memberships + courses (quizzes, certs, drip)", competitor: "Yes (full)", winner: "tie" },
      { label: "EU VAT handled", sellisy: "Yes — Stripe Tax toggle", competitor: "Built-in", winner: "tie" },
      { label: "Coupons / discount codes", sellisy: "Yes", competitor: "Yes", winner: "tie" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Cross-sells", winner: "sellisy" },
      { label: "Affiliate program", sellisy: "Yes (Growth+)", competitor: "Built-in", winner: "tie" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One store", winner: "sellisy" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Generic buyer dashboard", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "You sell courses or memberships as your primary product type.",
      "You want Payhip-branded EU VAT collection without setting up Stripe Tax (Sellisy uses Stripe Tax; both work, different UX).",
      "You want a free tier with no monthly cost and can absorb 5% per sale.",
    ],
    whySellisyWins: [
      "Six storefront templates vs Payhip's single theme — your store looks like you, not like every other Payhip seller.",
      "0% transaction fee starts at $9. Payhip's 0% only kicks in at $99/mo Pro.",
      "PLR library + AI mockup/copy tools (on Growth+) — Payhip has neither.",
      "Multi-store support if you run multiple brands.",
    ],
    faqs: [
      {
        q: "Is Payhip's free plan a better deal?",
        a: "If you do less than ~$180/mo in sales, yes — Payhip's 5% beats Sellisy's $9. Above that, Sellisy is cheaper. Bump to Sellisy Growth ($29) for the PLR library + AI tools.",
      },
      {
        q: "Does Sellisy handle EU VAT like Payhip?",
        a: "Yes — flip the 'Automatic tax' toggle in your store settings and Stripe Tax handles VAT collection at checkout for every EU country. You still need to register where you owe tax (same as Payhip's free tier).",
      },
      {
        q: "Can I run a membership site on Sellisy?",
        a: "Yes — memberships are built in. Mark any product as a monthly or yearly subscription and Sellisy handles recurring billing on your own Stripe (0% platform fee), gates the content while the subscription is active, and gives buyers a portal to manage or cancel. The course player includes lessons, video embeds, quizzes, certificates, and drip schedules. Community features are the main thing Payhip-style platforms still add.",
      },
    ],
  },

  {
    slug: "sellfy",
    name: "Sellfy",
    tagline: "Same 0% fees, lower starting price, more bundled tools",
    accent: "#21A56A",
    intro:
      "Sellfy is a solid digital-product platform with print-on-demand and email built-in. Sellisy is the leaner, faster-moving alternative: flat $9 starter (vs Sellfy's $29), with a PLR library, AI tools, and multi-storefront support on Growth ($29) and up.",
    oneLineVerdict:
      "If you don't need print-on-demand, Sellisy is the cheaper, more modern pick. If you do POD, Sellfy still wins that lane.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Starter $29/mo, Business $79/mo, Premium $159/mo. 0% transaction fees.",
    rows: COMMON_ROWS([
      { label: "Starting price", sellisy: "$9/mo", competitor: "$29/mo", winner: "sellisy" },
      { label: "Transaction fee", sellisy: "0%", competitor: "0%", winner: "tie" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Storefront + product pages", winner: "tie" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes (Business+)", winner: "tie" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One per plan", winner: "sellisy" },
      { label: "PLR / MRR product library", sellisy: "Hundreds, ready to resell", competitor: "Not included", winner: "sellisy" },
      { label: "AI creator tools (mockups, copy)", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "Print on demand", sellisy: "No", competitor: "Yes (their differentiator)", winner: "competitor" },
      { label: "Subscription products", sellisy: "Built-in (0% fee, your own Stripe)", competitor: "Yes", winner: "sellisy" },
      { label: "Email marketing", sellisy: "Campaigns + automated flows + AI drafting", competitor: "Built-in", winner: "tie" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Yes", winner: "tie" },
      { label: "Software license keys", sellisy: "Yes", competitor: "Limited", winner: "sellisy" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Buyer download page", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "Print-on-demand is a core part of your product mix.",
      "You want a deeply established platform with a long track record.",
    ],
    whySellisyWins: [
      "$20/mo cheaper at the entry tier ($9 vs $29). Bump to Sellisy Growth ($29) for the PLR library and AI tools — still matches Sellfy's price.",
      "Multi-storefront from one dashboard. Sellfy charges per store.",
      "Software license selling is first-class on Sellisy.",
      "Modern, faster UI built around creator workflows.",
    ],
    faqs: [
      {
        q: "Does Sellisy do print-on-demand?",
        a: "Not today. If POD t-shirts/mugs are central to your business, Sellfy is the better fit. For pure digital + software, Sellisy wins on price and tooling.",
      },
      {
        q: "How is Sellisy's email different from Sellfy's?",
        a: "Both support broadcast email. Sellisy focuses on newsletter campaigns tied to your storefront; Sellfy's is part of their marketing suite. Heavy email senders may want a dedicated ESP either way.",
      },
    ],
  },

  {
    slug: "podia",
    name: "Podia",
    tagline: "Cheaper. Faster checkout. Better for product-led creators.",
    accent: "#04AA6D",
    intro:
      "Podia is built around courses, memberships, and creator websites. That makes it powerful — and overkill (and expensive) if you're mainly selling digital products. Sellisy is the focused, cheaper alternative for downloads, software, and PLR.",
    oneLineVerdict:
      "Podia is for course creators. Sellisy is for product sellers who want a fast, flat-fee storefront with 0% per sale.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free: 8% transaction fee. Mover: $39/mo (0% fee). Shaker: $89/mo. Earthquaker: $199/mo.",
    rows: COMMON_ROWS([
      { label: "Starting paid price", sellisy: "$9/mo (0% fee)", competitor: "$39/mo for 0% fee", winner: "sellisy" },
      { label: "Transaction fee on entry tier", sellisy: "0%", competitor: "8% (free tier)", winner: "sellisy" },
      { label: "Digital downloads", sellisy: "Yes (core)", competitor: "Yes", winner: "tie" },
      { label: "Courses", sellisy: "Basic (lessons + player + progress)", competitor: "Yes (core, full LMS)", winner: "competitor" },
      { label: "Memberships", sellisy: "Built-in subscriptions (0% fee)", competitor: "Yes (core, with community)", winner: "competitor" },
      { label: "Email marketing", sellisy: "Campaigns + automated flows + AI drafting", competitor: "Built-in", winner: "tie" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Website builder", winner: "tie" },
      { label: "PLR / MRR library", sellisy: "Hundreds, included", competitor: "Not included", winner: "sellisy" },
      { label: "AI tools (mockups, copy)", sellisy: "Built-in", competitor: "AI writing assist", winner: "sellisy" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One brand", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Limited (higher tier)", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "Your main product is a course or membership community, not downloads.",
      "You want a full website + email + community + courses in one product.",
    ],
    whySellisyWins: [
      "Less than a quarter the price of Podia's first 0%-fee tier ($9 vs $39) — and 0% from the very first plan.",
      "Built for digital products, software, and PLR — Podia treats those as side features.",
      "Multi-storefront support, plus AI mockup/copy tools you'd otherwise pay extra for.",
    ],
    faqs: [
      {
        q: "Can I sell a course on Sellisy?",
        a: "Yes — Sellisy now has a built-in course player. Set product type to 'Course', add lessons with YouTube/Vimeo video links and optional attachments. Buyers see a clean player with progress tracking. For deeper LMS features (quizzes, certificates, drip schedules, community), Podia is still richer.",
      },
      {
        q: "Is Sellisy really cheaper than Podia?",
        a: "Yes — Sellisy starts at $9 with 0% fees. Podia's first 0%-fee tier (Mover) is $39/mo. You're paying 4x for equivalent fee economics.",
      },
    ],
  },

  {
    slug: "sendowl",
    name: "SendOwl",
    tagline: "A real storefront instead of just a 'buy now' button",
    accent: "#FF6B35",
    intro:
      "SendOwl is great if you already have a website and just need a checkout + delivery system. Sellisy is the opposite: a full storefront, designer templates, customer portal, and PLR library — without piecing it together.",
    oneLineVerdict:
      "SendOwl is a buy-button engine. Sellisy is a full creator store. If you don't have a website yet, Sellisy ships you one.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Starter $9/mo (10 products, 1GB), Growth $15/mo, Scale $39/mo. Storage tiered.",
    rows: COMMON_ROWS([
      { label: "Starting price", sellisy: "$9/mo", competitor: "$9/mo", winner: "tie" },
      { label: "Transaction fee", sellisy: "0%", competitor: "0%", winner: "tie" },
      { label: "Full storefront with theming", sellisy: "6 templates", competitor: "Basic showcase only", winner: "sellisy" },
      { label: "Customer portal & re-downloads", sellisy: "Branded portal", competitor: "Email links", winner: "sellisy" },
      { label: "PLR / MRR library", sellisy: "Hundreds, included", competitor: "Not included", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "PDF stamping / watermarking", sellisy: "Yes (buyer email + order ID per page)", competitor: "Yes", winner: "tie" },
      { label: "License keys / software", sellisy: "Yes", competitor: "Yes", winner: "tie" },
      { label: "Subscriptions", sellisy: "Built-in (0% fee, your own Stripe)", competitor: "Yes", winner: "sellisy" },
      { label: "Storage on entry plan", sellisy: "Generous", competitor: "1GB (small)", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "Single account", winner: "sellisy" },
      { label: "Buy buttons / embeds", sellisy: "Yes", competitor: "Yes (their strength)", winner: "tie" },
    ]),
    whenTheyWin: [
      "You already have a website (WordPress, Webflow, etc.) and just need a checkout + file-delivery layer.",
      "You need PDF stamping at a more granular level (per-paragraph fingerprints, page-by-page tagging) than Sellisy's footer + diagonal watermark.",
    ],
    whySellisyWins: [
      "Full storefront + customer portal — no separate website needed.",
      "PLR library and AI creator tools come bundled.",
      "Way more storage on entry plan than SendOwl's 1GB.",
      "Modern, designer-grade templates vs SendOwl's bare-bones storefront.",
    ],
    faqs: [
      {
        q: "Can I embed Sellisy products on my existing site?",
        a: "Yes — Sellisy supports embeddable product and bundle widgets, similar to SendOwl's buy buttons.",
      },
      {
        q: "Does Sellisy do PDF watermarking?",
        a: "Yes — toggle 'PDF watermarking' in your store settings. Every PDF download is stamped with the buyer's email + order ID in a footer plus a diagonal 'PERSONAL COPY' watermark. PDFs up to 30 MB are stamped; larger files pass through unstamped.",
      },
    ],
  },

  {
    slug: "ko-fi",
    name: "Ko-fi",
    tagline: "When a tip jar isn't enough — graduate to a real store",
    accent: "#FF5E5B",
    intro:
      "Ko-fi started as a tip jar and added a shop. Sellisy is built shop-first: real storefront templates, customer portal, upsells, PLR library, and software-license support — features Ko-fi only partially covers.",
    oneLineVerdict:
      "Ko-fi is perfect for casual tips and small shops. Sellisy is for treating digital products like a real business.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free: 0% on tips, 5% on shop/commissions. Ko-fi Gold: ~$8/mo (removes shop fees, adds features).",
    rows: COMMON_ROWS([
      { label: "Shop transaction fee", sellisy: "0%", competitor: "5% free / 0% on Gold", winner: "sellisy" },
      { label: "Tip jar / donations", sellisy: "Not a focus", competitor: "Yes (their core)", winner: "competitor" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Limited", winner: "sellisy" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "One Ko-fi page style", winner: "sellisy" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Customer portal & re-downloads", sellisy: "Branded portal", competitor: "Basic", winner: "sellisy" },
      { label: "PLR / MRR library", sellisy: "Hundreds, included", competitor: "Not included", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "Memberships / subscriptions", sellisy: "Built-in (0% fee, your own Stripe)", competitor: "Yes", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Stripe / PayPal direct", sellisy: "Yes", competitor: "Yes", winner: "tie" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One page", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "You're primarily collecting tips or commission deposits from fans.",
      "You want zero monthly cost and don't mind Ko-fi branding on your page.",
    ],
    whySellisyWins: [
      "A real storefront, not just a tip page with a shop tab.",
      "Designer-grade templates and your own custom domain.",
      "Upsells, customer portal, license keys, multi-store — none of which Ko-fi has.",
    ],
    faqs: [
      {
        q: "Can I accept tips on Sellisy?",
        a: "Sellisy supports pay-what-you-want pricing on products, but it's not a tip-jar replacement. Ko-fi is still better for that specific use case.",
      },
      {
        q: "Is my Ko-fi audience portable?",
        a: "Your customer list and product files are yours — you can migrate to Sellisy and keep selling without losing access to past buyers.",
      },
    ],
  },

  {
    slug: "stan-store",
    name: "Stan Store",
    tagline: "More than a link-in-bio — a real storefront with templates",
    accent: "#00C2A8",
    intro:
      "Stan Store is link-in-bio + simple checkout, popular with TikTok/Instagram creators. Sellisy is what you graduate to when one mobile page isn't enough: full storefront, branded portal, PLR library, and software-license support.",
    oneLineVerdict:
      "Stan Store wins if all your traffic comes from social bios. Sellisy wins when you want a real online store.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Creator $29/mo, Pro $99/mo. Free trial available. 0% transaction fees on paid plans.",
    rows: COMMON_ROWS([
      { label: "Starting price", sellisy: "$9/mo", competitor: "$29/mo", winner: "sellisy" },
      { label: "Transaction fee", sellisy: "0%", competitor: "0%", winner: "tie" },
      { label: "Link-in-bio format", sellisy: "Storefront-first", competitor: "Yes (their core)", winner: "competitor" },
      { label: "Full storefront templates", sellisy: "6 designer themes", competitor: "Single mobile layout", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Limited (their subdomain)", winner: "sellisy" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One Stan store", winner: "sellisy" },
      { label: "PLR / MRR library included", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Mockups + copy", competitor: "Some AI assist", winner: "tie" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Generic", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Coaching / calls booking", sellisy: "No", competitor: "Yes", winner: "competitor" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Limited", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "100% of your traffic is social (TikTok/IG/YT) and you only need a mobile link page.",
      "You sell coaching calls and need integrated scheduling.",
    ],
    whySellisyWins: [
      "$20/mo cheaper at entry ($9 vs $29) — and you get a real desktop+mobile storefront, not just a mobile page.",
      "Designer templates and a branded customer portal for repeat buyers.",
      "PLR library, software license selling, and multi-store — Stan doesn't offer any of these.",
    ],
    faqs: [
      {
        q: "Can I use Sellisy as a link-in-bio?",
        a: "Yes — point your social bio at your Sellisy store URL. It works great on mobile and desktop, unlike Stan which is mobile-first only.",
      },
      {
        q: "Does Sellisy do calendar booking?",
        a: "Not natively. For coaching businesses with heavy 1:1 calls, Stan's booking integration may matter more than Sellisy's product tooling.",
      },
    ],
  },

  {
    slug: "whop",
    name: "Whop",
    tagline: "Sell digital products without paying 3% on every sale",
    accent: "#FF6B6B",
    intro:
      "Whop is built around Discord communities and paid apps. Sellisy is built around digital storefronts. If you don't run a Discord-gated community, Whop's 3% fee is a tax you don't need to pay.",
    oneLineVerdict:
      "Whop wins for paid Discord communities. Sellisy wins for everything else digital.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free to start. 3% transaction fee. Whop Plus: $149/mo for lower fees + premium features.",
    rows: COMMON_ROWS([
      { label: "Transaction fee", sellisy: "0%", competitor: "3% per sale", winner: "sellisy" },
      { label: "Monthly cost (entry)", sellisy: "$9/mo", competitor: "$0", winner: "competitor" },
      { label: "Discord community gating", sellisy: "No", competitor: "Yes (their core)", winner: "competitor" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Whop hub style", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Limited", winner: "sellisy" },
      { label: "PLR / MRR library included", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Built-in", competitor: "Not included", winner: "sellisy" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Whop-branded hub", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "Yes (via apps)", winner: "tie" },
      { label: "Marketplace discovery", sellisy: "No (you own SEO)", competitor: "Whop marketplace", winner: "competitor" },
      { label: "Affiliate program", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "Single account", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "Your business model is a paid Discord community.",
      "You want marketplace discovery from Whop's existing buyer pool.",
    ],
    whySellisyWins: [
      "No 3% per-sale tax on top of payment processing.",
      "Branded storefront and customer portal on your own domain — not whop.com/you.",
      "PLR library + AI tools + multi-store — Whop offers none of these.",
    ],
    faqs: [
      {
        q: "Can I sell Discord access on Sellisy?",
        a: "You can sell a product whose 'file' is a Discord invite or instructions, but Sellisy doesn't auto-manage Discord roles like Whop does. For deep Discord-native businesses, Whop still wins that lane.",
      },
      {
        q: "How much do I save vs Whop at $10k/mo?",
        a: "Whop's 3% on $10k is $300/mo. Sellisy is $9–$49/mo flat. At scale, the gap pays for years of Sellisy.",
      },
    ],
  },

  {
    slug: "kajabi",
    name: "Kajabi",
    tagline: "Stop paying $149+/mo for features you don't use",
    accent: "#1E90FF",
    intro:
      "Kajabi is the premium all-in-one for course creators with budgets. Sellisy is the focused, dramatically cheaper alternative for selling digital products, software, and PLR — without the seven-figure-creator price tag.",
    oneLineVerdict:
      "Kajabi is for full-time course businesses with email marketing budgets. Sellisy is for product sellers who want to keep an extra $960+/year.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Kickstarter $89–$99/mo, Basic $149/mo, Growth $199/mo, Pro $399/mo.",
    rows: COMMON_ROWS([
      { label: "Starting price", sellisy: "$9/mo", competitor: "$89–$99/mo", winner: "sellisy" },
      { label: "Transaction fee", sellisy: "0%", competitor: "0%", winner: "tie" },
      { label: "Annual cost (entry)", sellisy: "$108/yr", competitor: "$1,068+/yr", winner: "sellisy" },
      { label: "Courses (LMS)", sellisy: "Basic LMS — lessons, player, progress", competitor: "Yes (core, full LMS)", winner: "competitor" },
      { label: "Email marketing (built-in)", sellisy: "Campaigns + automated flows + AI drafting", competitor: "Yes (their core)", winner: "competitor" },
      { label: "Sales funnels / pipelines", sellisy: "Upsells + order bumps", competitor: "Full funnels", winner: "competitor" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Website builder", winner: "tie" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "PLR / MRR library included", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Mockups + copy", competitor: "AI writing assistant", winner: "tie" },
      { label: "Software license keys", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "Limited (per plan)", winner: "sellisy" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Kajabi-branded", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "You run a high-ticket course or coaching business as your main income.",
      "You need full email automation, funnels, and an LMS in one product.",
      "You're already spending $300+/mo across separate tools.",
    ],
    whySellisyWins: [
      "You'll save ~$960/year vs Kajabi Kickstarter — money you keep instead of paying for funnels you might not need.",
      "Built for product sellers, not just course creators.",
      "Software license selling is first-class. Kajabi doesn't sell software.",
    ],
    faqs: [
      {
        q: "Can Sellisy replace Kajabi for me?",
        a: "If you mainly sell downloads, software, or PLR — yes, easily, for a fraction of the cost. If your business is courses + email funnels, Kajabi's LMS may still win.",
      },
      {
        q: "Does Sellisy do email automation like Kajabi?",
        a: "Sellisy ships the automations product sellers actually use: abandoned-checkout recovery, post-purchase recommendations, welcome emails, and AI-drafted campaigns. Kajabi still wins on arbitrary multi-step visual funnels — if your business is built on those, Kajabi earns its price.",
      },
    ],
  },

  {
    slug: "kit",
    name: "Kit (ConvertKit)",
    tagline: "Built to sell products — not email-first with a checkout bolted on",
    accent: "#FB6970",
    intro:
      "Kit (formerly ConvertKit) is email marketing first; their commerce module is an add-on for selling to your newsletter list. Sellisy is built the other way: storefront first, with newsletter campaigns supporting it.",
    oneLineVerdict:
      "Kit wins if your newsletter is your main asset. Sellisy wins if your storefront is.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free up to 10k subs. Creator from $29/mo. Creator Pro from $59/mo. Commerce fee: 3.5% + $0.30 per sale.",
    rows: COMMON_ROWS([
      { label: "Transaction fee on sales", sellisy: "0%", competitor: "3.5% + $0.30", winner: "sellisy" },
      { label: "Email marketing", sellisy: "Campaigns + automated flows + AI drafting", competitor: "Yes (their core)", winner: "competitor" },
      { label: "Storefront templates", sellisy: "6 designer themes", competitor: "Single product page", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes", winner: "tie" },
      { label: "PLR / MRR library included", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Mockups + copy", competitor: "Some AI features", winner: "tie" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Limited", winner: "sellisy" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Generic buyer page", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "Single account", winner: "sellisy" },
      { label: "Email automation", sellisy: "Cart recovery, post-purchase, welcome flows", competitor: "Advanced (visual sequences)", winner: "competitor" },
      { label: "Newsletter sponsorship marketplace", sellisy: "No", competitor: "Yes", winner: "competitor" },
    ]),
    whenTheyWin: [
      "Your main asset is a 10k+ newsletter and you mostly sell to your list.",
      "You need deep email automation (sequences, tagging, segments).",
      "You want access to Kit's Sponsor Network.",
    ],
    whySellisyWins: [
      "0% on product sales vs Kit's 3.5% + $0.30 chip.",
      "A real storefront — Kit's product pages are minimal.",
      "PLR library, AI tools, multi-store, license keys — Kit has none of these.",
      "Pair Sellisy with Kit if you want both: storefront on Sellisy, email on Kit.",
    ],
    faqs: [
      {
        q: "Can I use Sellisy and Kit together?",
        a: "Yes — many creators do. Run your storefront on Sellisy (0% fees, real store) and your newsletter on Kit. Best of both worlds.",
      },
      {
        q: "Does Sellisy have email sequences?",
        a: "Sellisy supports newsletter broadcasts; advanced automated sequences are still Kit's strength. If complex automation is critical, use both tools.",
      },
    ],
  },

  {
    slug: "beacons",
    name: "Beacons",
    tagline: "A real store instead of a fancy link page",
    accent: "#7C3AED",
    intro:
      "Beacons is a link-in-bio with an AI-built shop, popular with social-first creators. Sellisy is the upgrade path: a desktop-grade storefront, designer templates, branded customer portal, PLR library, and 0% fees from day one.",
    oneLineVerdict:
      "Beacons is link-in-bio with shop features. Sellisy is shop-first with link-in-bio compatibility.",
    pricingSellisy: SELLISY_PRICING,
    pricingCompetitor:
      "Free (with branding + 9% store fee). Creator Pro ~$10/mo. Store Pro ~$25/mo. Business ~$90/mo.",
    rows: COMMON_ROWS([
      { label: "Store transaction fee", sellisy: "0%", competitor: "9% free / lower on paid", winner: "sellisy" },
      { label: "Link-in-bio page", sellisy: "Storefront-first", competitor: "Yes (their core)", winner: "competitor" },
      { label: "Full desktop storefront", sellisy: "Yes — 6 templates", competitor: "Mobile-first link page", winner: "sellisy" },
      { label: "Custom domain", sellisy: "Yes (Growth+)", competitor: "Yes (paid tier)", winner: "tie" },
      { label: "PLR / MRR library included", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "AI creator tools", sellisy: "Mockups + copy", competitor: "AI store builder", winner: "tie" },
      { label: "Email marketing", sellisy: "Campaigns + automated flows + AI drafting", competitor: "Built-in", winner: "tie" },
      { label: "Customer portal", sellisy: "Branded portal", competitor: "Generic buyer view", winner: "sellisy" },
      { label: "Software license keys", sellisy: "Yes", competitor: "No", winner: "sellisy" },
      { label: "Multi-store / brands", sellisy: "Up to unlimited", competitor: "One bio page", winner: "sellisy" },
      { label: "Upsells & order bumps", sellisy: "Yes", competitor: "Limited", winner: "sellisy" },
    ]),
    whenTheyWin: [
      "Your entire business is one social bio link page.",
      "You want an AI to auto-generate your link page in 30 seconds.",
    ],
    whySellisyWins: [
      "Real storefront on your own domain — not a link page with a shop tab.",
      "0% transaction fee from day one. Beacons' free tier takes 9%.",
      "PLR library, software license selling, multi-store — Beacons doesn't do any of these.",
    ],
    faqs: [
      {
        q: "Can I use Sellisy as my link-in-bio?",
        a: "Yes — point your bio at your Sellisy storefront. It works as both a link page and a real desktop store.",
      },
      {
        q: "Will I lose money switching from Beacons free tier?",
        a: "Once you do more than ~$100/mo in sales, Sellisy ($9) is cheaper than Beacons' 9% fee. The gap grows fast above that.",
      },
    ],
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

export function getCompetitorSlugs(): string[] {
  return COMPETITORS.map((c) => c.slug);
}
