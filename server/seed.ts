import { storage } from "./storage";
import { db } from "./db";
import { products, marketingStrategies } from "@shared/schema";
import { eq } from "drizzle-orm";

const platformProducts = [
  {
    title: "Premium UI Kit",
    description: "A comprehensive UI kit with 200+ components, design tokens, and ready-to-use templates for modern web applications. Includes dark mode support and responsive layouts.",
    priceCents: 4900,
    thumbnailUrl: "/images/product-ui-kit.png",
    category: "templates",
  },
  {
    title: "React Component Library",
    description: "Production-ready React components built with TypeScript and Tailwind CSS. Includes forms, data tables, modals, and navigation patterns with full accessibility.",
    priceCents: 3900,
    thumbnailUrl: "/images/product-react-templates.png",
    category: "templates",
  },
  {
    title: "Social Media Marketing Kit",
    description: "150+ Instagram, Twitter, and LinkedIn templates in Figma and Canva formats. Perfect for content creators and small businesses looking to level up their social presence.",
    priceCents: 2900,
    thumbnailUrl: "/images/product-social-kit.png",
    category: "graphics",
  },
  {
    title: "The SaaS Growth Playbook",
    description: "A 120-page comprehensive guide covering product-led growth, pricing strategies, customer acquisition, and retention tactics for SaaS founders and product managers.",
    priceCents: 1900,
    thumbnailUrl: "/images/product-ebook.png",
    category: "ebooks",
  },
  {
    title: "Cinematic Photo Presets",
    description: "40 professional Lightroom presets for photographers. Includes film emulation, moody tones, warm portraits, and landscape enhancement profiles with mobile support.",
    priceCents: 2400,
    thumbnailUrl: "/images/product-presets.png",
    category: "graphics",
  },
  {
    title: "Notion Productivity System",
    description: "All-in-one Notion workspace template with project management, habit tracking, goal setting, journal, and CRM modules. Duplicate and customize for your workflow.",
    priceCents: 1500,
    thumbnailUrl: "/images/product-notion.png",
    category: "tools",
  },
];

export async function seedDatabase() {
  const existing = await db.select().from(products).where(eq(products.source, "PLATFORM"));
  if (existing.length > 0) {
    return;
  }

  for (const p of platformProducts) {
    await storage.createProduct({
      ownerId: null,
      source: "PLATFORM",
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      thumbnailUrl: p.thumbnailUrl,
      category: p.category,
      status: "ACTIVE",
    });
  }

  console.log("Seeded 6 platform products");
}

export async function seedMarketingIfNeeded() {
  await seedMarketingStrategies();
}

const strategies = [
  {
    id: "launch-checklist",
    category: "Launch",
    title: "Pre-Launch Checklist",
    description: "Complete all essential steps before going live with your digital product store. A structured launch ensures you don't miss critical elements that affect first impressions and early sales.",
    steps: [
      "Set up your store branding (logo, colors, tagline)",
      "Write compelling product descriptions with benefits, not just features",
      "Upload high-quality product thumbnails and preview images",
      "Set competitive pricing with an introductory discount",
      "Create at least one coupon code for early supporters",
      "Test the full checkout flow from product page to download",
      "Set up a landing page or link-in-bio pointing to your store",
    ],
    difficulty: "easy" as const,
    impact: "high" as const,
    sortOrder: 1,
  },
  {
    id: "product-positioning",
    category: "Launch",
    title: "Product Positioning & Pricing",
    description: "Position your products effectively in the market. Clear positioning helps customers understand why your product is the right choice and justifies your pricing.",
    steps: [
      "Research 3-5 competitors and note their pricing and positioning",
      "Identify your unique value proposition \u2014 what makes yours different",
      "Set a regular price and a discounted launch price",
      "Add an MSRP or comparison price to show value",
      "Write a one-line tagline that captures your product\u2019s benefit",
      "Create urgency with limited-time pricing or bonuses",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 2,
  },
  {
    id: "email-list-building",
    category: "Email Marketing",
    title: "Build Your Email List",
    description: "Email is the highest-ROI marketing channel for digital products. Build a list of interested buyers before and after launch to drive consistent sales.",
    steps: [
      "Create a free lead magnet related to your paid products",
      "Set up a lead magnet on your storefront using the lead magnet feature",
      "Add an email signup incentive (discount code, free bonus)",
      "Share your lead magnet on social media platforms",
      "Collect emails at checkout and add buyers to your list",
      "Aim for at least 100 subscribers before your first email campaign",
    ],
    difficulty: "easy" as const,
    impact: "high" as const,
    sortOrder: 1,
  },
  {
    id: "email-welcome-sequence",
    category: "Email Marketing",
    title: "Welcome Email Sequence",
    description: "Set up an automated email series that nurtures new subscribers and converts them into buyers. A good welcome sequence can drive 30% or more of your email revenue.",
    steps: [
      "Email 1 (Day 0): Welcome + deliver the lead magnet",
      "Email 2 (Day 1): Share your story and why you created this product",
      "Email 3 (Day 3): Provide a quick win or valuable tip",
      "Email 4 (Day 5): Introduce your paid product with a special offer",
      "Email 5 (Day 7): Share a customer testimonial or case study",
      "Email 6 (Day 10): Last chance reminder with urgency",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 2,
  },
  {
    id: "post-purchase-emails",
    category: "Email Marketing",
    title: "Post-Purchase Email Flow",
    description: "Turn one-time buyers into repeat customers and brand advocates with strategic post-purchase emails. These customers already trust you.",
    steps: [
      "Send an immediate thank-you email with download instructions",
      "Day 3: Ask how they\u2019re enjoying the product (opens conversation)",
      "Day 7: Share a bonus tip or resource related to the product",
      "Day 14: Request a review or testimonial",
      "Day 30: Introduce a complementary product or bundle",
      "Segment buyers for future launches and exclusive offers",
    ],
    difficulty: "medium" as const,
    impact: "medium" as const,
    sortOrder: 3,
  },
  {
    id: "social-content-strategy",
    category: "Social Media",
    title: "Content Strategy for Social Media",
    description: "Build a consistent social media presence that drives traffic to your store. Focus on providing value first, selling second.",
    steps: [
      "Choose 1-2 primary platforms where your audience hangs out",
      "Create a content calendar with 3-5 posts per week",
      "Follow the 80/20 rule: 80% value content, 20% promotional",
      "Share behind-the-scenes of your product creation process",
      "Create short-form content (reels, shorts) showcasing your products",
      "Engage with comments and DMs within 24 hours",
      "Use relevant hashtags and keywords for discoverability",
    ],
    difficulty: "medium" as const,
    impact: "medium" as const,
    sortOrder: 1,
  },
  {
    id: "social-proof",
    category: "Social Media",
    title: "Build Social Proof",
    description: "People buy what others recommend. Systematically collect and display social proof to increase trust and conversions.",
    steps: [
      "Ask your first 10 customers for testimonials via email",
      "Screenshot positive DMs and comments (with permission)",
      "Share customer success stories as social media posts",
      "Display review count and ratings on your product pages",
      "Create case studies showing before/after results",
      "Offer a discount for video testimonials",
    ],
    difficulty: "easy" as const,
    impact: "high" as const,
    sortOrder: 2,
  },
  {
    id: "twitter-launch",
    category: "Social Media",
    title: "Twitter/X Launch Playbook",
    description: "Twitter is one of the best platforms for launching digital products. Build in public, create anticipation, and leverage the community for your launch.",
    steps: [
      "Start sharing your product creation journey 2-4 weeks before launch",
      "Build a waitlist by asking people to reply or DM for early access",
      "Create a launch thread with: problem, solution, features, pricing, link",
      "Pin the launch tweet to your profile",
      "Ask 5-10 friends or peers to retweet at launch",
      "Engage with every reply in the first 48 hours",
      "Share daily updates on sales numbers during launch week",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 3,
  },
  {
    id: "seo-basics",
    category: "SEO",
    title: "SEO Fundamentals for Product Pages",
    description: "Optimize your store and product pages so they appear in search results. Good SEO brings free, consistent traffic long after your initial launch.",
    steps: [
      "Research 5-10 keywords your target audience searches for",
      "Include primary keywords in your product titles and descriptions",
      "Write unique meta descriptions for each product page",
      "Use descriptive alt text on all product images",
      "Create a store tagline that includes your main keyword",
      "Ensure your store URL slug is clean and descriptive",
    ],
    difficulty: "easy" as const,
    impact: "medium" as const,
    sortOrder: 1,
  },
  {
    id: "content-marketing",
    category: "Content Marketing",
    title: "Blog & Content Marketing",
    description: "Create valuable content that attracts your ideal customers organically. Content marketing compounds over time and becomes your best source of free traffic.",
    steps: [
      "Identify 10 questions your target audience frequently asks",
      "Write detailed blog posts or guides answering each question",
      "Include natural links to your products within the content",
      "Share each piece of content across your social channels",
      "Repurpose long-form content into social media posts",
      "Guest post on relevant blogs or publications in your niche",
      "Update and refresh content every 3-6 months",
    ],
    difficulty: "hard" as const,
    impact: "high" as const,
    sortOrder: 1,
  },
  {
    id: "lead-magnet-strategy",
    category: "Content Marketing",
    title: "Lead Magnet Strategy",
    description: "Create irresistible free resources that showcase your expertise and naturally lead to your paid products. The best lead magnets solve a specific, immediate problem.",
    steps: [
      "Identify a quick-win problem your audience has",
      "Create a free resource that solves it (checklist, template, mini-guide)",
      "Make the lead magnet directly related to your paid product",
      "Design a professional cover or thumbnail",
      "Set it up as a lead magnet in your store",
      "Promote it on social media and in your bio links",
      "Track conversion rate from lead magnet to paid product",
    ],
    difficulty: "easy" as const,
    impact: "high" as const,
    sortOrder: 2,
  },
  {
    id: "bundle-strategy",
    category: "Sales Strategy",
    title: "Product Bundling for Higher AOV",
    description: "Increase your average order value by creating strategic product bundles. Bundles provide more value to customers while increasing your revenue per transaction.",
    steps: [
      "Identify products that complement each other naturally",
      "Create bundles with a 20-30% discount vs buying separately",
      "Name bundles with benefit-focused titles (e.g., 'Complete Starter Kit')",
      "Feature bundles prominently on your storefront",
      "Create an 'everything' bundle at the highest price point",
      "Test different bundle combinations and pricing",
    ],
    difficulty: "easy" as const,
    impact: "medium" as const,
    sortOrder: 1,
  },
  {
    id: "coupon-strategy",
    category: "Sales Strategy",
    title: "Smart Coupon & Discount Strategy",
    description: "Use discounts strategically to drive sales without devaluing your products. The right coupon at the right time can significantly boost conversions.",
    steps: [
      "Create a welcome discount (10-15%) for first-time buyers",
      "Set up limited-time flash sales (24-48 hours) for urgency",
      "Offer exclusive discounts to your email subscribers",
      "Use higher discounts on bundles to encourage larger purchases",
      "Set maximum uses on coupons to create scarcity",
      "Track which coupons drive the most revenue (not just uses)",
      "Never discount more than 40% \u2014 it devalues your brand",
    ],
    difficulty: "easy" as const,
    impact: "medium" as const,
    sortOrder: 2,
  },
  {
    id: "upsell-cross-sell",
    category: "Sales Strategy",
    title: "Upsell & Cross-Sell Techniques",
    description: "Maximize revenue from each customer interaction by offering relevant upgrades and complementary products at key moments.",
    steps: [
      "Configure upsell products on your lead magnet success pages",
      "Recommend related products on each product detail page",
      "Offer a premium version or extended license of popular products",
      "Show complementary products on the checkout success page",
      "Send cross-sell recommendations in post-purchase emails",
      "Create upgrade paths (basic \u2192 pro \u2192 complete package)",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 3,
  },
  {
    id: "paid-ads-getting-started",
    category: "Paid Ads",
    title: "Getting Started with Paid Ads",
    description: "Once you have a proven product with organic sales, amplify with paid advertising. Start small, measure everything, and scale what works.",
    steps: [
      "Only start paid ads after getting at least 10 organic sales",
      "Set a daily budget you can afford to lose ($5-10/day to start)",
      "Start with one platform (Facebook/Instagram or Google Ads)",
      "Create 3-5 ad variations to test different angles",
      "Target lookalike audiences based on your existing customers",
      "Track cost per acquisition (CPA) and return on ad spend (ROAS)",
      "Kill ads with CPA higher than 50% of your product price",
      "Scale winners gradually (increase budget 20% every 3 days)",
    ],
    difficulty: "hard" as const,
    impact: "high" as const,
    sortOrder: 1,
  },
  {
    id: "retargeting",
    category: "Paid Ads",
    title: "Retargeting Visitors",
    description: "Most visitors won't buy on their first visit. Retargeting ads bring back warm leads who already showed interest, dramatically increasing conversion rates.",
    steps: [
      "Install tracking pixels (Meta Pixel, Google Tag) on your store",
      "Create a retargeting audience of store visitors (last 30 days)",
      "Show product-specific ads to people who viewed that product",
      "Offer a small discount in retargeting ads to encourage purchase",
      "Exclude people who already purchased",
      "Set frequency caps to avoid annoying potential customers",
    ],
    difficulty: "hard" as const,
    impact: "medium" as const,
    sortOrder: 2,
  },
  {
    id: "analytics-tracking",
    category: "Analytics",
    title: "Set Up Analytics & Tracking",
    description: "You can't improve what you don't measure. Set up proper tracking to understand where your traffic comes from and what drives sales.",
    steps: [
      "Review your store's built-in analytics dashboard regularly",
      "Track which products generate the most revenue",
      "Monitor conversion rates from visitor to buyer",
      "Identify your top traffic sources (social, search, direct)",
      "Set up UTM parameters for all shared links",
      "Review analytics weekly and adjust strategy based on data",
    ],
    difficulty: "easy" as const,
    impact: "medium" as const,
    sortOrder: 1,
  },
  {
    id: "partnership-marketing",
    category: "Content Marketing",
    title: "Partnership & Affiliate Marketing",
    description: "Leverage other creators' audiences by forming strategic partnerships. This can rapidly expand your reach without ad spend.",
    steps: [
      "Identify 10-20 creators with complementary (not competing) audiences",
      "Reach out with a specific collaboration proposal",
      "Offer affiliate commissions (20-30%) for referral sales",
      "Create co-branded bundles with partner products",
      "Guest on podcasts or YouTube channels in your niche",
      "Cross-promote with other digital product creators",
    ],
    difficulty: "hard" as const,
    impact: "high" as const,
    sortOrder: 3,
  },
];

async function seedMarketingStrategies() {
  const existing = await db.select().from(marketingStrategies);
  if (existing.length > 0) return;

  for (const s of strategies) {
    await db.insert(marketingStrategies).values(s);
  }

  console.log(`Seeded ${strategies.length} marketing strategies`);
}
