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
    content: `## Pre-Launch Checklist: Your Complete Guide to a Flawless Launch

### Why a Pre-Launch Checklist Matters

Launching without preparation is like opening a restaurant without a menu. Your first visitors form lasting impressions within seconds, and you only get one chance to make that first impression count. A structured checklist ensures nothing falls through the cracks.

> **Pro Tip:** Most successful digital product creators spend 2-3 weeks on pre-launch preparation. Rushing this phase is the #1 reason for underwhelming launches.

### Step 1: Store Branding & Identity

Your brand is the first thing visitors notice. Get these elements right:

- **Logo:** Keep it simple and recognizable. Use a tool like Canva or Figma to create a clean wordmark or icon
- **Color Palette:** Choose 2-3 colors that reflect your brand personality. Use your primary color for CTAs
- **Tagline:** Write a one-liner that communicates your value. Formula: "I help [audience] achieve [outcome] with [product type]"
- **Consistent Voice:** Decide if your brand is professional, casual, playful, or authoritative

### Step 2: Compelling Product Descriptions

Features tell, but benefits sell. Transform your descriptions:

- **Bad:** "Includes 50 Notion templates"
- **Good:** "Save 10+ hours every week with 50 ready-to-use Notion templates that organize your entire business"

Structure each description with:
1. **Hook** - The main benefit or pain point solved
2. **Features** - What's included (bullet points)
3. **Social Proof** - Reviews, download counts, or testimonials
4. **CTA** - Clear call to action

### Step 3: Visual Assets

High-quality visuals dramatically increase conversions:

- Use **mockup generators** to showcase your products in context
- Create **multiple preview images** showing different aspects of your product
- Ensure thumbnails are **clear at small sizes** (they'll appear in grids)
- Add **before/after** comparisons where relevant

### Step 4: Pricing Strategy

- Research competitors and position your price relative to the market
- Set a **launch price** 20-30% below your regular price
- Display the regular price alongside the launch price to show value
- Consider offering a **bundle** at launch for higher average order value

### Step 5: Checkout Flow Testing

Before going live, test everything:

- Complete a purchase from start to finish
- Verify the download/delivery works correctly
- Check email confirmations are sent and formatted properly
- Test on both desktop and mobile devices
- Try applying a coupon code to ensure it works

> **Pro Tip:** Ask a friend to go through your checkout flow. Fresh eyes catch issues you've become blind to.

### Step 6: Launch Day Preparation

- Prepare your launch announcement posts for all platforms
- Have your coupon codes ready to share
- Set up a link-in-bio or landing page directing traffic to your store
- Schedule launch posts for optimal times on each platform
- Have a support plan ready for customer questions`,
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
    content: `## Product Positioning & Pricing: Stand Out and Sell More

### Understanding Product Positioning

Positioning is not about what your product does -- it's about how customers perceive it relative to alternatives. Great positioning makes the buying decision obvious.

> **Pro Tip:** Your positioning should answer one question instantly: "Why should I buy THIS instead of the alternatives?"

### Step 1: Competitive Research

Before setting your price or writing your copy, understand your landscape:

- **Identify 3-5 direct competitors** selling similar products
- Note their **price points**, description style, and unique claims
- Read their **customer reviews** to find gaps and complaints
- Look at their **product presentation** -- thumbnails, demos, previews
- Document what they do well and where they fall short

Create a simple comparison table:

| Competitor | Price | Strengths | Weaknesses |
|-----------|-------|-----------|------------|
| Product A | $49 | Great design | No support |
| Product B | $29 | Cheap | Outdated |
| Yours | $39 | Modern + Support | New to market |

### Step 2: Define Your Unique Value Proposition (UVP)

Your UVP is the single most important sentence in your marketing. Use this formula:

**"[Product] helps [audience] [achieve outcome] by [unique method], unlike [alternative] which [limitation]."**

Examples:
- "Our UI Kit helps indie developers ship beautiful apps in hours, not weeks, unlike generic templates that require heavy customization."
- "This Notion system helps solopreneurs manage their entire business in one workspace, unlike scattered tools that create more chaos."

### Step 3: Pricing Psychology

Pricing is as much psychology as it is economics:

- **Anchor pricing:** Show a higher "regular" price crossed out next to your sale price
- **Charm pricing:** $49 feels significantly cheaper than $50
- **Bundle premium:** Create a bundle at 70-80% of individual prices combined
- **Tiered pricing:** Offer basic, pro, and complete versions at different price points
- **Launch pricing:** Give early buyers 20-30% off with a clear deadline

### Step 4: Creating Urgency Without Being Sleazy

Urgency works, but it must be authentic:

- **Limited-time launch pricing** with a real deadline
- **Early-bird bonuses** that genuinely go away
- **Limited coupon codes** with a maximum number of uses
- **Seasonal offers** tied to real events (New Year, Back to School)

> **Pro Tip:** Never fake urgency. Customers who feel manipulated never come back. Real scarcity (limited bonus, genuine price increase) converts better than fake countdown timers.

### Step 5: Price Testing

- Start with your gut feeling based on competitor research
- Launch at a **slight discount** to generate initial sales and reviews
- After 20-30 sales, try raising the price by 10-20%
- Monitor conversion rates -- if they stay steady, the higher price wins
- Use coupon codes to offer personalized discounts without lowering your base price`,
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
    content: `## Build Your Email List: The Foundation of Digital Product Sales

### Why Email is King

Email marketing delivers an average ROI of **$36 for every $1 spent**. Unlike social media, you own your email list -- no algorithm changes can take it away. For digital product creators, email is the most direct path to sales.

> **Pro Tip:** A list of 500 engaged subscribers is worth more than 50,000 social media followers. Focus on quality over quantity.

### Step 1: Create an Irresistible Lead Magnet

Your lead magnet should be:
- **Directly related** to your paid product (a sample, lite version, or complementary resource)
- **Immediately useful** -- something they can use within 5 minutes
- **High perceived value** -- make it look and feel premium

**Lead Magnet Ideas by Product Type:**
- **Templates:** Give away 2-3 templates from your full pack
- **UI Kits:** Share a mini component kit with 10-15 elements
- **Ebooks:** Offer the first chapter or a condensed cheat sheet
- **Courses:** Provide a free lesson or quick-start video
- **Software:** Offer a free trial or limited-feature version

### Step 2: Set Up Your Lead Magnet Funnel

The flow should be seamless:

1. **Landing page** with clear headline and benefit-focused copy
2. **Email capture form** asking for just the email address (minimize friction)
3. **Instant delivery** -- send the lead magnet immediately upon signup
4. **Thank you page** with an upsell offer or next step

### Step 3: Drive Traffic to Your Lead Magnet

Share your lead magnet everywhere:

- **Social media bio links** -- make it the primary CTA
- **Content posts** -- mention it at the end of value posts
- **Pinterest pins** -- create dedicated pins for the free resource
- **Twitter threads** -- end threads with a link to the lead magnet
- **YouTube descriptions** -- link in every video description
- **Guest content** -- include it in guest posts and podcast appearances

### Step 4: Optimize Your Conversion Rate

Track and improve your signup rate:

- **Headline testing:** Try different headlines to see what converts best
- **Social proof:** Add subscriber count or testimonials near the form
- **Urgency:** "Join 2,000+ creators who already downloaded this"
- **Visual preview:** Show a mockup of what they'll receive

### Step 5: Grow Beyond the Lead Magnet

- **Checkout emails:** Every buyer should automatically join your list
- **Content upgrades:** Create bonus resources within blog posts
- **Referral incentives:** Give subscribers a bonus for referring friends
- **Webinars or live sessions:** Require email registration to attend

> **Pro Tip:** Send a welcome email immediately. Subscribers are most engaged in the first 24 hours. Deliver your lead magnet, introduce yourself, and set expectations for future emails.

### Milestone Targets

- **0-100 subscribers:** Focus on one lead magnet and one traffic source
- **100-500 subscribers:** Start your welcome email sequence
- **500-1,000 subscribers:** Begin regular newsletters and product launches
- **1,000+:** Segment your list by interest and personalize your campaigns`,
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
    content: `## Welcome Email Sequence: Turn Subscribers into Buyers

### Why Welcome Sequences Work

Welcome emails have **4x higher open rates** and **5x higher click rates** than regular emails. New subscribers are at peak curiosity -- capitalize on that momentum with a strategic sequence.

> **Pro Tip:** A well-crafted 6-email welcome sequence can generate 30-40% of your total email revenue on autopilot.

### Email 1: Welcome + Deliver (Day 0)

**Subject:** "Here's your [Lead Magnet Name] + a quick hello"

This email has one job: deliver value immediately.

- **Deliver the lead magnet** with a clear download link
- **Introduce yourself** in 2-3 sentences (keep it brief)
- **Set expectations** for what emails they'll receive
- **Ask a question** to encourage a reply (boosts deliverability)

**Example closing:** "Hit reply and tell me -- what's your biggest challenge with [topic]? I read every response."

### Email 2: Your Story (Day 1)

**Subject:** "Why I built [Product/Brand]"

People buy from people they connect with:

- Share the **problem you faced** that led to creating your products
- Describe the **journey** from idea to creation (keep it authentic)
- Connect your story to **their pain point**
- End with a subtle **bridge to your products** (don't sell yet)

### Email 3: Quick Win (Day 3)

**Subject:** "Try this [topic] tip today"

Deliver unexpected value to build trust:

- Share a **practical tip** they can implement immediately
- Make it related to your paid product's topic
- Include a **screenshot or example** if possible
- This positions you as genuinely helpful, not just trying to sell

### Email 4: The Offer (Day 5)

**Subject:** "I made something for [their problem]"

Now they trust you -- time to introduce your product:

- **Restate the problem** your product solves
- Introduce your product as **the solution**
- Highlight **3-5 key benefits** (not features)
- Include a **special subscriber-only discount** (10-20% off)
- Add a **clear CTA button** to your product page

### Email 5: Social Proof (Day 7)

**Subject:** "See what [Customer Name] created with [Product]"

Let your customers sell for you:

- Share a **testimonial or case study**
- Show **before/after results** if applicable
- Include **specific numbers** or outcomes
- Remind them of the special offer from Email 4
- Add urgency: "This discount expires in 3 days"

### Email 6: Last Chance (Day 10)

**Subject:** "Last chance: [Discount]% off expires tonight"

Create authentic urgency:

- Remind them of the **discount expiring**
- Summarize the **key benefits** one more time
- Address **common objections** (too expensive, not sure if it's for me)
- Include a **final CTA** with the discount code
- After this, transition them to your regular newsletter

> **Pro Tip:** Track open rates and click rates for each email. If Email 3 has low opens, test a new subject line. If Email 4 has low clicks, refine your product pitch.

### Key Metrics to Track

- **Open rate:** Aim for 40%+ on welcome emails
- **Click rate:** Aim for 5-10%
- **Conversion rate:** 2-5% of subscribers purchasing is a strong result
- **Reply rate:** Replies improve deliverability and build relationships`,
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
    content: `## Post-Purchase Email Flow: Maximize Customer Lifetime Value

### Why Post-Purchase Emails Matter

It costs **5x more to acquire a new customer** than to retain an existing one. Buyers who've already purchased trust you -- they're your warmest audience. A strategic post-purchase flow turns one-time buyers into loyal fans and repeat customers.

> **Pro Tip:** Existing customers are 60-70% more likely to buy from you again. Never neglect your buyer list.

### Email 1: Thank You + Delivery (Immediate)

**Subject:** "Your [Product Name] is ready!"

- Express genuine **gratitude** for their purchase
- Provide **clear download/access instructions**
- Include **quick-start tips** for getting the most from the product
- Set expectations for upcoming helpful emails
- Provide a **support contact** for any issues

### Email 2: Check-In (Day 3)

**Subject:** "How's [Product Name] working for you?"

- Ask if they've had a chance to use the product
- Offer a **helpful tip** for getting started
- Invite them to **reply with questions** or feedback
- This email opens a dialogue and catches issues early

### Email 3: Bonus Value (Day 7)

**Subject:** "Bonus: [Related tip or resource]"

- Share a **complementary resource** (tutorial, template, guide)
- Show them an **advanced use case** for their purchase
- This unexpected value delights customers and builds loyalty

### Email 4: Review Request (Day 14)

**Subject:** "Quick favor? (takes 30 seconds)"

- Ask for a **review or testimonial**
- Make it **easy** -- provide a direct link or simple reply prompt
- Explain **how their review helps** other creators like them
- Consider offering a **small incentive** (discount code for next purchase)

### Email 5: Cross-Sell (Day 30)

**Subject:** "You might love this too..."

- Introduce a **complementary product** that pairs with their purchase
- Explain **why it's relevant** based on what they bought
- Offer an **exclusive returning customer discount** (15-20% off)
- Show the **combined value** of using both products together

### Segmentation Strategy

After the sequence, segment buyers for future marketing:

- **Product category buyers** -- target with related products
- **High-value buyers** -- offer premium products and bundles first
- **Repeat buyers** -- create a VIP segment with exclusive early access
- **Reviewers** -- engage them as brand advocates

> **Pro Tip:** Tag every buyer by what they purchased. When you launch a complementary product, you'll know exactly who to email first.`,
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
    content: `## Content Strategy for Social Media: Build an Audience That Buys

### The 80/20 Rule of Social Selling

The biggest mistake digital product creators make on social media is being too promotional. Follow the **80/20 rule**: 80% of your content should provide genuine value, and only 20% should directly promote your products.

> **Pro Tip:** The best social media selling doesn't feel like selling. When you consistently help people, they naturally want to buy from you.

### Step 1: Choose Your Platforms

Don't try to be everywhere. Pick 1-2 platforms based on your audience:

- **Twitter/X:** Best for SaaS, dev tools, and building in public
- **Instagram:** Great for visual products (templates, graphics, presets)
- **TikTok:** Highest organic reach, great for tutorials and demos
- **Pinterest:** Excellent for templates, printables, and evergreen content
- **LinkedIn:** Best for B2B products and professional tools
- **YouTube:** Best for in-depth tutorials and product walkthroughs

### Step 2: Content Calendar Framework

Plan your week with a mix of content types:

- **Monday:** Educational tip or tutorial
- **Tuesday:** Behind-the-scenes or work-in-progress
- **Wednesday:** Product showcase or customer feature
- **Thursday:** Industry insight or trend commentary
- **Friday:** Engagement post (question, poll, or challenge)
- **Weekend:** Repurpose best-performing content or share personal stories

### Step 3: Content Pillars

Organize your content into 4 pillars:

1. **Educational (40%):** Tips, tutorials, how-tos related to your niche
2. **Inspirational (20%):** Success stories, transformations, possibilities
3. **Behind-the-Scenes (20%):** Your process, workspace, product creation
4. **Promotional (20%):** Product features, launches, discounts, testimonials

### Step 4: Creating Engaging Content

**Hook formulas that stop the scroll:**
- "Most people get [topic] wrong. Here's why..."
- "I spent [time] figuring this out so you don't have to"
- "The [number] mistake killing your [desired outcome]"
- "Here's exactly how I [achieved result]"

**Content formats that perform well:**
- Carousel posts with step-by-step instructions
- Short video demos of your product in action
- Before/after transformations
- Screenshot tutorials
- Lists and checklists

### Step 5: Engagement Strategy

Engagement is not optional -- it's how algorithms decide to show your content:

- **Reply to every comment** within the first hour of posting
- **Engage with others' content** for 15-30 minutes before posting
- **Ask questions** in your captions to encourage comments
- **DM new followers** with a genuine welcome (not a sales pitch)
- **Collaborate** with creators in complementary niches

### Step 6: Measuring Success

Track these metrics weekly:

- **Reach/Impressions:** How many people see your content
- **Engagement rate:** Likes + comments + shares / reach
- **Profile visits:** People checking out your bio and links
- **Link clicks:** Traffic driven to your store
- **Follower growth:** Net new followers per week

> **Pro Tip:** Don't chase vanity metrics. 100 engaged followers who click your links are worth more than 10,000 passive followers who never engage.`,
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
    content: `## Build Social Proof: Let Your Customers Sell for You

### Why Social Proof is Your #1 Conversion Tool

**92% of consumers** read reviews before making a purchase. Social proof removes the risk from buying decisions -- when others vouch for your product, new customers feel confident buying.

> **Pro Tip:** One genuine customer testimonial is worth more than any sales copy you'll ever write.

### Step 1: Collecting Testimonials

**When to ask:**
- Immediately after purchase (for quick feedback)
- 3-7 days after purchase (for in-depth reviews)
- After a customer shares positive feedback organically

**How to ask (email template):**
"Hey [Name], I'd love to hear how [Product] has worked for you. Would you mind sharing a quick sentence or two about your experience? It means the world to me as a solo creator."

**Make it easy:**
- Provide **specific prompts**: "What problem did this solve? What's your favorite feature?"
- Offer **multiple formats**: Written review, screenshot, or video
- Keep it **low-friction**: A simple reply to your email works

### Step 2: Types of Social Proof

Build a portfolio of different proof types:

- **Text testimonials:** Direct quotes from happy customers
- **Screenshot proof:** DMs, tweets, or comments praising your product
- **Numbers:** "Downloaded by 500+ creators" or "4.8/5 average rating"
- **Case studies:** Detailed before/after stories showing real results
- **Video testimonials:** The most persuasive format (offer a discount as incentive)
- **User-generated content:** Customers showing your product in use

### Step 3: Displaying Social Proof Effectively

Where to show it:

- **Product pages:** 2-3 testimonials near the buy button
- **Landing pages:** A dedicated testimonials section
- **Social media:** Regular posts featuring customer wins
- **Email sequences:** Include a testimonial in your sales emails
- **Checkout page:** A reassuring quote to reduce cart abandonment

### Step 4: Creating Case Studies

A compelling case study structure:

1. **The Problem:** What challenge was the customer facing?
2. **The Solution:** How did your product help?
3. **The Result:** What specific outcome did they achieve?
4. **The Quote:** A direct testimonial from the customer

### Step 5: Scaling Social Proof

- **Automate review requests** in your post-purchase email flow
- **Create a testimonial wall** on your storefront
- **Incentivize reviews** with discount codes for the next purchase
- **Share wins weekly** on social media to attract more buyers

> **Pro Tip:** Always ask permission before sharing customer feedback publicly. A simple "Mind if I share this?" builds trust and respect.

### Dealing with Negative Feedback

- **Respond promptly and professionally** to any complaints
- **Offer solutions** -- refund, replacement, or support
- **Learn from criticism** -- negative feedback often reveals real product improvements
- **Turn critics into fans** -- a well-handled complaint can create your biggest advocate`,
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
    content: `## Twitter/X Launch Playbook: Go Viral on Launch Day

### Why Twitter Works for Product Launches

Twitter's retweet mechanic and threaded format make it ideal for product launches. The **build-in-public** community actively supports creators, and a well-crafted launch thread can reach hundreds of thousands of people organically.

> **Pro Tip:** The best Twitter launches are built over weeks, not launched cold. Start building anticipation 2-4 weeks before you're ready.

### Phase 1: Pre-Launch (2-4 Weeks Before)

**Build anticipation by sharing your journey:**

- "Working on something I'm really excited about..."
- Share **screenshots and progress updates** of your product
- Ask your audience for **feedback and input** on features
- Create a **waitlist** by asking people to reply or DM for early access
- Share the **problems you're solving** (make your audience feel the pain)

**Building a waitlist tweet formula:**
"I'm building [product description] for [audience]. Dropping it next [day]. Reply 'interested' and I'll DM you early access + a launch discount."

### Phase 2: Launch Day

**The Launch Thread Structure:**

**Tweet 1 (Hook):** Grab attention with a bold claim or result
"I just launched [Product Name] -- [benefit statement]. Here's everything inside:"

**Tweet 2 (Problem):** Describe the pain point
"If you've ever struggled with [problem], you know how frustrating it is..."

**Tweet 3-5 (Solution):** Show your product with visuals
- Include **screenshots, GIFs, or short videos**
- Highlight **3-5 key features** with clear benefits
- Show the product **in action**

**Tweet 6 (Pricing):** Make the offer
"Regular price: $X. Launch price: $Y (first 48 hours only)."

**Tweet 7 (CTA):** Direct link with urgency
"Grab it here: [link]. Launch pricing ends [date]."

### Phase 3: Launch Week Momentum

Keep the energy going after launch day:

- **Share sales updates:** "Just hit 50 sales in 24 hours!" (builds social proof)
- **Retweet customer reactions** and testimonials
- **Answer every question** and reply to every comment
- **Share different angles** of your product daily
- **Extend your launch** offer if momentum is strong

### Engagement Tactics

- **Reply to every comment** in the first 2 hours (boosts the algorithm)
- **Quote tweet** nice things people say about your product
- **Tag people** who gave you feedback during development
- **Cross-post** your launch thread to LinkedIn and other platforms

### Launch Day Checklist

- [ ] Pin launch thread to your profile
- [ ] Update bio with product link
- [ ] DM waitlist members the link
- [ ] Ask 5-10 friends to retweet
- [ ] Engage with replies for 2+ hours
- [ ] Share launch on other platforms
- [ ] Send announcement email to your list

> **Pro Tip:** Schedule your launch for Tuesday-Thursday between 9-11 AM EST. These time slots get the most engagement on Twitter. Avoid weekends and Mondays.`,
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
    content: `## SEO Fundamentals: Drive Free Traffic to Your Product Pages

### Why SEO Matters for Digital Products

SEO is the gift that keeps on giving. Unlike paid ads that stop working when you stop paying, **SEO traffic compounds over time**. A well-optimized product page can drive consistent sales for months or years with zero ongoing effort.

> **Pro Tip:** SEO is a long game. Expect to see results in 2-6 months, but the traffic you build is essentially free and sustainable.

### Step 1: Keyword Research

Find what your audience is searching for:

**Free keyword research methods:**
- **Google Autocomplete:** Type your topic and see suggestions
- **Google "People Also Ask":** Questions related to your keywords
- **Reddit/Twitter:** See how your audience describes their problems
- **Competitor pages:** What keywords do they target in titles and descriptions?

**Keyword types to target:**
- **Product keywords:** "Notion templates for business" or "React component library"
- **Problem keywords:** "How to organize my business in Notion"
- **Comparison keywords:** "Best UI kits for developers 2026"

### Step 2: Optimizing Product Titles

Your title is the most important SEO element:

- **Include your primary keyword** naturally
- **Front-load the keyword** (put it near the beginning)
- **Keep it under 60 characters** so it doesn't get cut off in search results

**Formula:** [Primary Keyword] - [Benefit] | [Brand]

Examples:
- "Premium UI Kit - 200+ Components for Modern Web Apps | CreatorStore"
- "Notion Business Templates - Organize Everything in One Workspace"

### Step 3: Product Descriptions for SEO

Write descriptions that serve both search engines and humans:

- **Use your primary keyword** in the first 100 words
- Include **related keywords** naturally throughout the description
- Write **at least 300 words** for each product description
- Use **headers (H2, H3)** to structure your content
- Include **bullet points** for features and benefits

### Step 4: Image Optimization

Every image is an SEO opportunity:

- **File names:** Use descriptive names like "notion-project-management-template.png"
- **Alt text:** Describe the image including your keyword: "Notion project management template dashboard view"
- **File size:** Compress images for faster page load (under 200KB)

### Step 5: URL Structure

Clean URLs help both users and search engines:

- **Good:** /products/premium-ui-kit
- **Bad:** /products/item-12345

### Step 6: Technical SEO Checklist

- [ ] Pages load in under 3 seconds
- [ ] Site is mobile-responsive
- [ ] All images have alt text
- [ ] URLs are clean and descriptive
- [ ] Meta descriptions are unique per page
- [ ] Internal links connect related products

> **Pro Tip:** Focus on **long-tail keywords** (3-5 word phrases) when starting out. They have less competition and more buyer intent. "Notion template for freelancers" will convert better than just "Notion template."`,
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
    content: `## Blog & Content Marketing: Build a Traffic Engine

### The Content Marketing Flywheel

Content marketing is the most scalable way to drive organic traffic. Every piece of content you create works 24/7, attracting potential customers through search engines, social shares, and backlinks. Over time, this compounds into a **self-sustaining traffic engine**.

> **Pro Tip:** One great blog post can drive more sales than 100 social media posts. Invest time in creating comprehensive, genuinely helpful content.

### Step 1: Content Research

Find topics your audience actively searches for:

- **Google Autocomplete:** Type your niche topic and note the suggestions
- **"People Also Ask" boxes:** These reveal common questions
- **Reddit and forums:** What questions come up repeatedly?
- **Customer emails:** What do people ask you about?
- **Competitor blogs:** What topics drive their traffic?

### Step 2: Content Framework

Structure every piece of content for maximum impact:

1. **Hook (Introduction):** Address the reader's pain point directly
2. **Promise:** Tell them what they'll learn or achieve
3. **Body:** Deliver step-by-step, actionable advice
4. **Product Tie-In:** Naturally mention how your product helps
5. **CTA:** Clear next step (download, subscribe, or purchase)

### Step 3: Content Types That Drive Sales

- **Ultimate Guides:** "The Complete Guide to [Topic]" -- comprehensive, long-form content
- **Tutorials:** "How to [Achieve Outcome] Step by Step" -- shows your expertise
- **Listicles:** "10 Best [Tools/Resources] for [Audience]" -- include your product
- **Comparison Posts:** "[Your Product] vs [Alternative]" -- highlight your strengths
- **Case Studies:** "How [Customer] Achieved [Result]" -- social proof + education

### Step 4: SEO-Optimized Writing

- **Target one primary keyword** per article
- Write **1,500-3,000 words** for comprehensive coverage
- Use **headers (H2, H3)** to organize sections
- Include your keyword in the **title, first paragraph, and headers**
- Add **internal links** to your product pages naturally
- Include **images, screenshots, and examples**

### Step 5: Content Distribution

Creating content is half the work. Distribution is the other half:

- Share on **all your social platforms** with platform-native formatting
- Send to your **email list** as a newsletter
- **Repurpose into shorter formats:** Twitter threads, Instagram carousels, TikTok tips
- Submit to **relevant communities** (Reddit, Facebook groups, Slack channels)
- Reach out for **guest posting** opportunities on established blogs

### Step 6: Content Maintenance

- **Review quarterly** and update outdated information
- **Add new sections** when you have fresh insights
- **Refresh publish dates** after major updates
- **Fix broken links** and improve internal linking
- **Monitor rankings** and double down on what's working

> **Pro Tip:** Repurpose every blog post into at least 5 pieces of social content. A 2,000-word post can become a Twitter thread, 3 Instagram carousels, a YouTube script, and a Pinterest infographic.`,
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
    content: `## Lead Magnet Strategy: Convert Visitors into Subscribers and Buyers

### The Lead Magnet Formula

A great lead magnet does three things: **solves an immediate problem**, **demonstrates your expertise**, and **creates desire for your paid product**. It's the bridge between a stranger and a customer.

> **Pro Tip:** The best lead magnets give away a taste of your paid product. If they love the free version, buying the full version becomes a no-brainer.

### Step 1: Choose the Right Lead Magnet Type

Match your lead magnet to your paid product:

| Paid Product | Lead Magnet Idea |
|-------------|-----------------|
| Template Pack | 3-5 free templates from the pack |
| UI Kit | Mini component set (10-15 elements) |
| Ebook/Guide | Chapter 1 or a condensed cheat sheet |
| Course | Free lesson or quick-start guide |
| Software | Free trial or feature-limited version |
| Presets | 3-5 sample presets |

### Step 2: Design Principles

Your lead magnet should look premium:

- **Professional cover image** that matches your brand
- **Clean formatting** with clear headings and structure
- **Branded elements** (logo, colors, website URL)
- **Quick to consume** -- should provide value in under 10 minutes

### Step 3: The Value Ladder

Position your lead magnet within a value ladder:

1. **Free content** (social media posts, blog articles)
2. **Lead magnet** (free resource in exchange for email)
3. **Low-price product** ($9-29 entry-level product)
4. **Core product** ($29-99 main offering)
5. **Premium product/bundle** ($99+ comprehensive solution)

Each step builds trust and demonstrates increasing value.

### Step 4: Promotion Strategy

Get your lead magnet in front of the right people:

- **Bio links:** Make it the primary CTA in your social bios
- **Content posts:** End value posts with "Want more? Grab my free [resource]"
- **Pinterest:** Create 10+ pins linking to your lead magnet
- **Collaborations:** Partner with complementary creators
- **Guest content:** Include it in guest posts and interviews

### Step 5: Optimizing Conversions

Track and improve your lead magnet's performance:

- **Landing page conversion rate:** Aim for 30-50%
- **Email-to-purchase rate:** Track how many subscribers eventually buy
- **Time to purchase:** How long after subscribing do people buy?
- **A/B test:** Headlines, descriptions, and thumbnail images

### Step 6: The Upsell Path

After someone claims your lead magnet:

1. **Thank you page:** Offer an immediate discount on the full product
2. **Welcome email:** Deliver the lead magnet + introduce yourself
3. **Email sequence:** Nurture with value, then pitch your paid product
4. **Retargeting:** Show ads to lead magnet claimers who haven't purchased

> **Pro Tip:** Create multiple lead magnets for different products. Each lead magnet builds a segment of subscribers you can target with the most relevant paid product.`,
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
    content: `## Product Bundling: Increase Your Average Order Value

### Why Bundling Works

Bundles tap into a powerful psychological principle: **perceived value**. When customers see they can save 25% by buying a bundle instead of individual products, it feels like a smart decision. For you, it means higher revenue per transaction.

> **Pro Tip:** Bundles typically increase average order value by 20-35%. Even a small lift in AOV compounds into significant revenue over time.

### Step 1: Identify Bundle Opportunities

Look for natural product pairings:

- **Complementary products:** A UI kit + icon pack + font bundle
- **Skill progression:** Beginner template + advanced template + masterclass
- **Workflow bundles:** All the tools someone needs for a specific task
- **Category bundles:** "Everything for [specific audience]"

### Step 2: Bundle Pricing Strategy

The golden rule: **bundles should be 20-30% cheaper** than buying items individually.

**Example:**
- Product A: $29
- Product B: $39
- Product C: $19
- Total individual: $87
- **Bundle price: $59** (32% savings)

**Pricing psychology tips:**
- Always show the "regular price" crossed out next to the bundle price
- Calculate and display the exact savings amount or percentage
- Use odd pricing ($59 instead of $60)

### Step 3: Bundle Naming

Names should communicate the benefit, not just the contents:

- **Bad:** "Template Bundle #1"
- **Good:** "The Complete Creator Toolkit"
- **Better:** "Launch Your Business in a Weekend Kit"

**Naming formulas:**
- "The Complete [Outcome] Kit"
- "The [Audience] Starter Pack"
- "Everything You Need to [Goal]"
- "The Ultimate [Niche] Bundle"

### Step 4: Merchandising Your Bundles

Make bundles prominent and appealing:

- **Feature bundles on your storefront** homepage prominently
- **Create a dedicated bundle section** or category
- **Show individual product thumbnails** within the bundle listing
- **Highlight the savings** with visual badges or banners
- **Add bundle suggestions** on individual product pages

### Step 5: The "Everything" Bundle

Create a premium option that includes all your products:

- Price it at **50-60% of the total individual prices**
- Position it as the "best value" option
- Update it automatically when you add new products
- This becomes your **highest-price anchor**, making individual products seem affordable

### Step 6: Testing and Optimization

- **Track bundle vs individual sales** ratios
- **A/B test** different bundle combinations
- **Survey customers** on what they'd want bundled together
- **Seasonal bundles** for holiday promotions or launches

> **Pro Tip:** Create a limited-time "launch bundle" whenever you release a new product. Bundle the new product with your best-seller at a special price to drive initial sales.`,
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
    content: `## Smart Coupon & Discount Strategy: Drive Sales Without Devaluing Your Brand

### The Art of Strategic Discounting

Discounts are a powerful tool, but used carelessly, they train customers to wait for sales and erode your brand value. The key is **strategic, purposeful discounting** that drives action without creating dependency.

> **Pro Tip:** The most profitable discount strategy isn't about the size of the discount -- it's about giving the right discount to the right person at the right time.

### Step 1: Types of Discounts

**Welcome Discount (10-15%)**
- For first-time buyers only
- Delivered via lead magnet or pop-up
- Creates a low-friction entry point

**Flash Sales (20-30%)**
- Time-limited (24-48 hours)
- Creates genuine urgency
- Best for slow periods or inventory pushes

**Subscriber-Only Discounts (15-20%)**
- Exclusive to email list members
- Rewards loyalty and encourages signups
- Can be regular (monthly) or surprise offers

**Bundle Discounts (25-35%)**
- Encourages larger purchases
- Increases average order value
- Customers perceive greater value

### Step 2: Creating Effective Coupon Codes

- Use **memorable codes** that relate to the offer: WELCOME15, LAUNCH20, VIP25
- Set **expiration dates** on every coupon (creates urgency)
- Set **maximum uses** to create scarcity (e.g., "First 50 uses only")
- Track **revenue per coupon**, not just usage count

### Step 3: Discount Calendar

Plan your discounts throughout the year:

- **January:** New Year fresh start sale (20% off)
- **March:** Spring launch bundle deals
- **June:** Mid-year flash sale (24 hours)
- **September:** Back to business/school offers
- **November:** Black Friday / Cyber Monday (biggest sale of the year)
- **December:** Holiday gift bundles

### Step 4: Rules to Protect Your Brand

- **Never discount more than 40%** -- it signals desperation
- **Limit frequency** -- no more than one major sale per quarter
- **Don't discount your flagship product** too often
- **Use bonuses instead of discounts** when possible (add a free product instead of reducing the price)
- **Remove discounts that underperform** -- not every coupon needs to stay active

### Step 5: Measuring Discount Effectiveness

Track these metrics for every coupon:

- **Total revenue generated** (not just number of uses)
- **Average order value** with vs. without the coupon
- **New vs. returning customers** using the coupon
- **Conversion rate** of coupon page visitors

> **Pro Tip:** The most effective discounts feel exclusive. "Here's 20% off because you've been a subscriber for 3 months" converts better than a generic sale because it feels personal and earned.`,
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
    content: `## Upsell & Cross-Sell: Maximize Revenue Per Customer

### The Revenue Multiplication Effect

The most profitable moment in your business is right after a customer says "yes." They're in buying mode, they trust you, and they're engaged. **Strategic upsells and cross-sells can increase revenue by 10-30%** without acquiring a single new customer.

> **Pro Tip:** Amazon attributes 35% of its revenue to cross-selling. Even at a smaller scale, these techniques dramatically impact your bottom line.

### Step 1: Understanding the Difference

- **Upsell:** Encouraging the customer to buy a higher-tier version of what they're already buying (basic to pro)
- **Cross-sell:** Suggesting complementary products that enhance their purchase (UI kit + icon pack)

### Step 2: Upsell Strategies

**Product Tier Upgrades:**
- Create **Basic, Pro, and Complete** versions of your products
- Show a comparison table highlighting what each tier includes
- Price tiers to make the mid-tier feel like the best value

**Lead Magnet to Paid Product:**
- After someone claims a free lead magnet, immediately offer the full paid product
- Use the thank-you page for a special "just for you" discount
- The lead magnet has already demonstrated your quality

**Bundle Upsells:**
- When someone is buying a single product, offer the bundle at a discount
- Show the savings they'd get by upgrading to the bundle
- "Add 3 more products for just $20 more"

### Step 3: Cross-Sell Strategies

**Related Products:**
- On every product page, show 2-3 complementary products
- "Customers who bought this also bought..."
- Focus on products that genuinely enhance the original purchase

**Post-Purchase Recommendations:**
- In your thank-you email, suggest the next logical product
- "Now that you have [Product A], you might love [Product B]"
- Offer a **returning customer discount** (10-15%)

**Checkout Success Page:**
- After purchase, show complementary products
- "Complete your toolkit with these additions"
- Offer an exclusive one-time discount on the suggested product

### Step 4: Creating Upgrade Paths

Design clear progression paths for your customers:

1. **Free:** Lead magnet (demonstrates value)
2. **Starter ($9-19):** Single product or lite version
3. **Pro ($29-49):** Full product with all features
4. **Complete ($79-99):** Bundle of all related products
5. **VIP ($149+):** Everything + exclusive bonuses or support

### Step 5: Implementation Tips

- **Don't be pushy** -- frame upsells as helpful suggestions
- **Show clear value** -- explain why the upgrade/addition matters
- **Limit options** -- too many choices paralyze buyers (show 2-3 max)
- **Use social proof** -- "Most popular" badges drive upgrades
- **Time it right** -- upsell at moments of high engagement

> **Pro Tip:** The best upsell doesn't feel like a sales tactic. It feels like a helpful recommendation from a friend who knows what you need.`,
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
    content: `## Getting Started with Paid Ads: Amplify What Already Works

### When to Start Paid Ads

Paid ads are an accelerator, not a starting point. Before spending a single dollar on ads, ensure you have:

- **At least 10 organic sales** (proves product-market fit)
- **A proven product page** that converts visitors to buyers
- **A budget you can afford to lose** while learning
- **Clear unit economics** (you know your profit margin per sale)

> **Pro Tip:** Paid ads amplify what's already working. If your product doesn't sell organically, ads won't fix that -- they'll just burn money faster.

### Step 1: Choose Your Platform

Start with ONE platform:

**Facebook/Instagram Ads (Best for most digital products)**
- Massive audience reach
- Excellent targeting options
- Great for visual products
- Best for B2C digital products

**Google Ads (Best for search-intent products)**
- Catches people actively searching for solutions
- Higher intent = higher conversion rates
- Best for specific, problem-solving products
- Good for SEO-friendly product categories

### Step 2: Setting Your Budget

- Start with **$5-10/day** (that's $150-300/month)
- Plan to **test for 2-4 weeks** before making major decisions
- Calculate your **break-even CPA:** If your product is $49, your CPA must be below $49
- Set a **maximum daily budget** and never exceed it during testing

### Step 3: Creating Ad Variations

Test **3-5 different ad angles:**

- **Problem-focused:** Lead with the pain point your product solves
- **Benefit-focused:** Highlight the outcome of using your product
- **Social proof:** Feature a testimonial or result
- **Demo/Preview:** Show the product in action
- **Urgency:** Limited-time pricing or availability

**Ad copy formula:**
1. **Hook:** Grab attention in the first line
2. **Problem:** Acknowledge the pain point
3. **Solution:** Introduce your product
4. **Proof:** Show results or social proof
5. **CTA:** Clear next step with urgency

### Step 4: Targeting Strategy

- **Lookalike audiences:** Upload your customer email list and create lookalikes
- **Interest targeting:** Target people interested in your niche topics
- **Retargeting:** Show ads to people who visited your store but didn't buy
- **Exclude buyers:** Don't waste money showing ads to existing customers

### Step 5: Measuring Success

Track these metrics religiously:

- **CPA (Cost Per Acquisition):** How much you pay per sale
- **ROAS (Return on Ad Spend):** Revenue generated per dollar spent
- **CTR (Click-Through Rate):** Percentage of people who click your ad
- **Conversion Rate:** Percentage of clickers who purchase

**Decision framework:**
- CPA < 30% of product price = **Scale it** (increase budget 20% every 3 days)
- CPA 30-50% of product price = **Optimize** (test new creatives/audiences)
- CPA > 50% of product price = **Kill it** (stop spending, try a different approach)

### Step 6: Scaling Winners

When you find a winning ad:
- Increase budget by **20% every 3 days** (gradual scaling)
- Create variations of the winning angle
- Expand to similar audiences
- Test on additional platforms

> **Pro Tip:** Never scale a losing ad hoping it will improve. The data from the first 1,000 impressions is usually predictive. Cut losses fast and reinvest in what works.`,
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
    content: `## Retargeting Visitors: Bring Back Warm Leads

### Why Retargeting is Essential

**97% of first-time visitors leave without purchasing.** They're not lost -- they're just not ready yet. Retargeting ads remind these warm leads about your product and give them a reason to come back and buy.

> **Pro Tip:** Retargeting ads typically have 3-5x higher conversion rates than cold ads because you're showing ads to people who already know and are interested in your product.

### Step 1: Install Tracking Pixels

Set up tracking on your store to build retargeting audiences:

- **Meta Pixel:** For Facebook and Instagram retargeting
- **Google Tag:** For Google Display and YouTube retargeting
- **TikTok Pixel:** For TikTok retargeting
- Install pixels on **all pages** of your store, especially product pages and checkout

### Step 2: Create Retargeting Audiences

Segment your visitors for targeted messaging:

- **All store visitors (last 30 days):** Broad awareness retargeting
- **Product page viewers:** Show them the specific product they viewed
- **Cart abandoners:** People who started checkout but didn't finish
- **Lead magnet claimers:** People who got your freebie but haven't bought

### Step 3: Retargeting Ad Strategy

**Audience-specific messaging:**

- **Product viewers:** "Still thinking about [Product Name]? Here's 10% off"
- **Cart abandoners:** "You left something behind! Complete your purchase"
- **Lead magnet claimers:** "Loved the free [resource]? Get the full version"
- **Blog readers:** "Enjoyed our guide on [topic]? Check out our [product]"

### Step 4: Creative Best Practices

- **Show the exact product** they viewed (dynamic retargeting)
- **Include social proof** (reviews, testimonials, download counts)
- **Add urgency** without being pushy (limited-time discount)
- **Use different formats:** Static images, carousels, video demos
- **Keep copy short** -- they already know who you are

### Step 5: Frequency and Budget

- Set **frequency caps** of 3-5 impressions per week per person
- Budget **20-30% of your total ad spend** on retargeting
- **Exclude purchasers** -- don't waste money showing ads to people who already bought
- **Refresh creative** every 2-3 weeks to prevent ad fatigue

### Step 6: Advanced Retargeting Tactics

- **Sequential retargeting:** Show different ads over time (awareness then offer then urgency)
- **Cross-platform retargeting:** Reach them on Facebook, Instagram, and Google
- **Email + retargeting:** Combine email campaigns with retargeting for maximum impact
- **Lookalike retargeting:** Create lookalike audiences from your retargeting segments

> **Pro Tip:** The most effective retargeting feels like a gentle reminder, not stalking. Limit frequency, vary your creative, and always offer genuine value -- not just "buy now" messages.`,
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
    content: `## Analytics & Tracking: Make Data-Driven Decisions

### Why Analytics Matter

Without data, you're guessing. With data, you're making **informed decisions** that systematically improve your sales. The creators who grow fastest are the ones who track, analyze, and optimize based on real numbers.

> **Pro Tip:** Check your analytics once a week, not once a day. Daily fluctuations create anxiety; weekly trends reveal actionable insights.

### Step 1: Key Metrics to Track

**Revenue Metrics:**
- **Total revenue:** Your top-line number
- **Average order value (AOV):** Revenue per transaction
- **Revenue per product:** Which products drive the most income
- **Revenue by source:** Which channels drive the most sales

**Traffic Metrics:**
- **Total visitors:** How many people visit your store
- **Traffic sources:** Where visitors come from (social, search, direct, email)
- **Page views per session:** How much of your store they explore
- **Bounce rate:** Percentage who leave after viewing one page

**Conversion Metrics:**
- **Conversion rate:** Percentage of visitors who buy (aim for 2-5%)
- **Lead magnet conversion rate:** Percentage who claim your freebie
- **Email-to-purchase rate:** Percentage of subscribers who become buyers

### Step 2: Setting Up UTM Parameters

Tag every link you share to track where traffic comes from:

**UTM structure:**
\`yourstore.com/product?utm_source=twitter&utm_medium=social&utm_campaign=launch\`

**Key parameters:**
- **utm_source:** The platform (twitter, instagram, email, google)
- **utm_medium:** The type (social, email, paid, organic)
- **utm_campaign:** The specific campaign (launch, summer-sale, newsletter-jan)

### Step 3: Weekly Analytics Review

Every week, spend 15-20 minutes reviewing:

1. **Traffic:** Where are visitors coming from? Any new sources?
2. **Top products:** Which products get the most views and sales?
3. **Conversion rate:** Is it trending up, down, or stable?
4. **Revenue:** How does this week compare to last week?
5. **Email:** Open rates, click rates, and sales from email

### Step 4: Acting on Data

**If traffic is low:**
- Double down on the channel that sends the most visitors
- Create more content optimized for that channel
- Consider paid ads to supplement organic traffic

**If conversion rate is low:**
- Improve product descriptions and images
- Add more social proof (testimonials, reviews)
- Simplify the checkout flow
- Test different pricing

**If AOV is low:**
- Create and promote bundles
- Add upsell offers on product pages
- Show complementary product recommendations

### Step 5: Building a Dashboard

Track your key numbers in a simple spreadsheet:

| Week | Visitors | Conversion | Revenue | AOV | Top Source |
|------|----------|------------|---------|-----|------------|
| W1 | 450 | 2.2% | $198 | $19.80 | Twitter |
| W2 | 520 | 2.5% | $286 | $22.00 | Pinterest |

> **Pro Tip:** Focus on trends, not individual data points. A single bad week doesn't mean anything. Three consecutive declining weeks signals a problem that needs addressing.`,
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
    content: `## Partnership & Affiliate Marketing: Leverage Other Audiences

### Why Partnerships Accelerate Growth

Building an audience from scratch takes time. Partnerships give you **instant access to established audiences** that already trust the person recommending you. A single good partnership can drive more sales than months of organic posting.

> **Pro Tip:** The best partnerships are mutually beneficial. Always think about what value you can offer the partner, not just what you want from them.

### Step 1: Finding the Right Partners

Look for creators who:

- Serve a **similar audience** but sell **different products**
- Have an **engaged community** (engagement rate matters more than follower count)
- Are at a **similar or slightly higher level** than you
- Create **quality content** that aligns with your brand values

**Where to find partners:**
- Twitter/X lists of creators in your niche
- YouTube channels covering related topics
- Newsletter directories in your category
- Online communities and Slack groups
- Conference attendee lists

### Step 2: The Perfect Outreach Message

Keep it short, specific, and value-focused:

"Hey [Name], I love your work on [specific content]. I create [your products] and think our audiences would benefit from a collaboration. I had an idea: [specific proposal]. Would you be open to chatting about it?"

**Key principles:**
- **Reference specific work** they've done (shows you're genuine)
- **Propose something specific** (not "let's collaborate somehow")
- **Lead with value for them** (what do they get out of it?)
- **Keep it short** (3-4 sentences max)

### Step 3: Partnership Types

**Affiliate Programs:**
- Offer **20-30% commission** on referred sales
- Provide partners with **custom links and discount codes**
- Create **affiliate assets** (banners, product images, copy templates)
- Pay promptly and maintain transparent reporting

**Co-Created Products:**
- Create a **joint product** that combines both partners' expertise
- Split revenue **50/50** (or based on contribution)
- Both partners promote to their audiences
- The combined product has more value than either could create alone

**Content Collaborations:**
- **Guest blog posts** on each other's platforms
- **Podcast interviews** or YouTube collaborations
- **Joint webinars** or live sessions
- **Newsletter swaps** where you feature each other

### Step 4: Setting Up an Affiliate Program

- Create **unique tracking links** for each affiliate
- Set **clear terms** (commission rate, payment schedule, cookie duration)
- Provide **marketing materials** (images, copy, product samples)
- Send **monthly reports** with earnings and performance data
- Pay commissions **within 30 days** of the sale

### Step 5: Maintaining Partnerships

- **Check in monthly** with active partners
- **Share performance data** and optimization tips
- **Offer exclusive early access** to new products
- **Celebrate wins** publicly (tag them, share results)
- **Be reliable** -- always deliver on your promises

> **Pro Tip:** Start with 3-5 partnerships and nurture them deeply rather than trying to manage 50 surface-level relationships. Quality partnerships with engaged partners will always outperform quantity.`,
  },
  {
    id: "tiktok-strategy",
    category: "Social Media",
    title: "TikTok Growth Blueprint",
    description: "Algorithmic reach means zero followers can go viral. The highest ROI platform for 2026 \u2014 perfect for demonstrating digital products visually.",
    steps: [
      "Set up a TikTok Business Account with optimized bio and link",
      "Follow the weekly content phases: value-first, soft intro, product integration",
      "Use viral hook formulas to grab attention in the first second",
      "Apply a strategic hashtag mix: broad, medium, and niche (3-5 max)",
      "Engage with every comment in the first hour and go live weekly",
      "Set up monetization path: pin comment, free template, email sequence",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 4,
    content: `## TikTok Growth Blueprint: The Highest ROI Platform for 2026

### Why TikTok is a Game-Changer

TikTok's algorithm is the **great equalizer**. Unlike every other platform, your follower count doesn't determine your reach. A brand-new account with zero followers can get millions of views if the content resonates. For digital product creators, this means massive exposure with zero ad spend.

> **Pro Tip:** TikTok's algorithm tests every video with a small audience first. If those viewers engage (watch time, likes, comments, shares), it pushes the video to progressively larger audiences. Focus on the first 3 seconds -- that's where the algorithm decides your fate.

### Step 1: Account Setup

**Business Account Essentials:**
- Switch to a **Business Account** for analytics access and link-in-bio
- **Profile photo:** Clear, professional headshot or brand logo
- **Username:** Simple, memorable, related to your niche (e.g., @templatecreator)

**Bio Formula (150 characters max):**
Line 1: What you do ("I create digital templates that save you hours")
Line 2: Social proof ("10K+ downloads")
Line 3: CTA ("Free template below")

**Link in Bio:** Use a link aggregator (Linktree, Stan Store, or your storefront link) to direct traffic to your lead magnet and products.

### Step 2: Content Strategy (Weekly Phases)

**Weeks 1-2: Value-First (Build Trust)**
- Post 1-2 videos daily showing tips, tutorials, and quick wins
- No product mentions -- pure value
- Establish yourself as knowledgeable and helpful
- Content ideas: "3 ways to organize your business in Notion," "Design hack you didn't know existed"

**Weeks 3-4: Soft Introduction**
- Continue value content but start mentioning your products naturally
- "I actually built a template for this..." while showing a tip
- Show your product in action without making it the focus
- Behind-the-scenes content of creating your products

**Week 5+: Strategic Product Integration**
- Dedicate 1-2 posts per week to product showcases
- Product demos, before/after transformations, customer results
- Always lead with the value/result, not the sales pitch
- Maintain the 80/20 value-to-promotion ratio

### Step 3: Viral Hook Formulas

The first 1-3 seconds determine everything. Use these proven hooks:

- **"I made $X selling this simple template"** -- income proof grabs attention
- **"Stop wasting time doing X manually"** -- calls out a pain point
- **"This free template changed my workflow"** -- free + transformation
- **"POV: You just discovered [product type]"** -- relatable scenario
- **"3 tools I wish I knew about sooner"** -- listicle curiosity
- **"Here's what nobody tells you about [topic]"** -- insider knowledge
- **"If you're a [audience], you need this"** -- targeted relevance
- **"I can't believe this is free"** -- value shock

### Step 4: Hashtag Strategy

Less is more on TikTok. Use **3-5 hashtags maximum** with this mix:

- **1 Broad hashtag** (1M+ views): #digitalproducts, #sidehustle, #entrepreneur
- **1-2 Medium hashtags** (100K-1M views): #notiontemplate, #uidesign, #canvatemplates
- **1-2 Niche hashtags** (10K-100K views): #notionworkspace, #freelancertools, #designresources

> **Pro Tip:** Don't use #fyp or #foryou -- they're so oversaturated they provide zero targeting benefit. Use specific, niche hashtags that your ideal customer would search for.

### Step 5: Engagement Tactics

The algorithm rewards engagement velocity -- how fast people interact with your content:

- **Reply to every comment in the first hour** -- this is critical for boosting the algorithm
- **Reply with video** to interesting comments (creates new content and boosts engagement)
- **Stitch and duet** trending creators in your niche for exposure to their audience
- **Go live weekly** -- live videos boost your overall account visibility
- **Pin top comments** that include your CTA or drive conversation
- **Ask questions** in your captions to encourage comments

### Step 6: Monetization Path

The money flow on TikTok:

1. **Video hook grabs attention** and delivers value
2. **Pin comment with CTA:** "Want the free template? Link in bio"
3. **Free template/lead magnet** captures their email address
4. **Automated email sequence** nurtures and sells your premium product
5. **Profile link** directs to your storefront for immediate buyers

**Advanced monetization:**
- Create a "free vs. paid" comparison video showing the value of upgrading
- Use TikTok LIVE to demo products and drop discount codes
- Build a TikTok series (Part 1, Part 2, etc.) that naturally leads to your product
- Collaborate with other creators for cross-promotion

### Posting Schedule

- **Frequency:** 1-2 videos per day (minimum 5 per week)
- **Best times:** 7-9 AM, 12-2 PM, 7-9 PM (your audience's timezone)
- **Consistency matters** more than perfection -- post regularly
- **Batch create** content on one day and schedule throughout the week

### Common Mistakes to Avoid

- Starting with product-heavy content before building trust
- Using too many hashtags (keep it to 3-5)
- Ignoring comments and engagement
- Posting inconsistently
- Making videos too long (15-60 seconds is the sweet spot)
- Not including a clear CTA in every video`,
  },
  {
    id: "pinterest-strategy",
    category: "Social Media",
    title: "Pinterest Passive Traffic Machine",
    description: "Long-term evergreen traffic. People actively search for templates and tools. Pins can drive traffic for years without additional effort.",
    steps: [
      "Create a Pinterest Business Account and claim your website",
      "Optimize your profile with keyword-rich description and boards",
      "Create 10 vertical pin designs per product with different angles",
      "Research keywords using Pinterest autocomplete",
      "Post 5-10 pins daily during optimal hours (8-11 PM)",
      "Build a board strategy mixing product boards and value boards",
      "Set up landing pages optimized for Pinterest traffic conversion",
    ],
    difficulty: "easy" as const,
    impact: "high" as const,
    sortOrder: 5,
    content: `## Pinterest Passive Traffic Machine: Evergreen Sales on Autopilot

### Why Pinterest is Different

Pinterest isn't a social media platform -- it's a **visual search engine**. People come to Pinterest with **buying intent**, actively searching for templates, tools, and solutions. Unlike Instagram or TikTok where content dies in 24-48 hours, **a single pin can drive traffic for 2-3 years**.

> **Pro Tip:** Pinterest is the only platform where your content appreciates in value over time. A pin posted today might get its peak traffic 3-6 months from now. This makes it the ultimate "set it and forget it" marketing channel.

### Step 1: Account Setup

**Business Account Essentials:**
- Create a **Pinterest Business Account** (not personal) for analytics access
- **Claim your website** to get attribution on all pins linking to your site
- **Enable Rich Pins** for enhanced pin formatting with your product details

**Profile Optimization:**
- **Display name:** Include your primary keyword ("Sarah | Digital Templates & Tools")
- **Bio (500 chars):** Keyword-rich description of what you offer and who you help
- **Profile image:** Professional headshot or clean brand logo
- **Website link:** Direct to your storefront or link aggregator

### Step 2: Board Strategy

Create **5-10 boards** organized around your products and audience interests:

**Product Boards (direct selling):**
- "Notion Templates for Business"
- "UI Design Resources"
- "Social Media Templates"

**Value Boards (attract and educate):**
- "Productivity Tips for Creators"
- "Design Inspiration"
- "Small Business Marketing Ideas"
- "Work From Home Setup"

**Board optimization tips:**
- Use **keyword-rich board titles** and descriptions
- Add **board covers** that match your brand aesthetic
- Arrange boards with **most important first** on your profile
- Add **5-20 pins** to each board before making them public

### Step 3: Pin Creation Strategy

**Pin Design Specs:**
- **Size:** 1000 x 1500px (2:3 vertical ratio) -- this gets the most reach
- **Format:** Clean, readable, with clear text overlay
- **Branding:** Include your logo or website URL subtly on every pin

**Create 10 pins per product with different angles:**
1. Product mockup with benefit headline
2. Before/after transformation
3. Feature list with icons
4. Testimonial or review highlight
5. Step-by-step tutorial preview
6. "What's included" breakdown
7. Comparison (your product vs. doing it manually)
8. Use case scenario
9. Lifestyle/aspirational image with product
10. Free resource/lead magnet promotion

### Step 4: Keyword Research

Pinterest SEO is your secret weapon:

**Using Pinterest Autocomplete:**
- Type your product topic in the search bar
- Note every suggestion that appears -- these are real search terms
- Use these exact phrases in your pin titles, descriptions, and board names

**Keyword placement:**
- **Pin title:** Primary keyword front-loaded (e.g., "Notion Template for Project Management")
- **Pin description:** 2-3 related keywords woven into 2-3 sentences
- **Board title:** Keyword-optimized board name
- **Board description:** Keyword-rich, 200+ character description
- **Alt text:** Descriptive text including keywords

### Step 5: Posting Schedule

**Frequency:** 5-10 pins per day (mix of new pins and repins)
**Best times:** 8-11 PM in your target audience's timezone
**Consistency:** Daily pinning is more important than volume

**Weekly breakdown:**
- 3-5 **new original pins** per day
- 2-5 **repins** of your existing content to different boards
- **Spread pins throughout the day** using a scheduler (Tailwind is recommended)

### Step 6: Traffic Conversion

Getting clicks is only half the battle -- convert that traffic:

- **Landing pages:** Create Pinterest-specific landing pages with consistent design
- **Lead magnets:** Offer a freebie before the sale to capture emails
- **Clear CTAs:** Every pin should link to a specific product or landing page
- **Mobile optimization:** 85% of Pinterest traffic is mobile -- ensure your site is responsive
- **Minimal friction:** Reduce steps between pin click and purchase

### Step 7: Measuring Pinterest Success

Track these metrics monthly:

- **Impressions:** How many times your pins are shown
- **Saves:** How many people save your pins (highest-value engagement)
- **Outbound clicks:** Traffic driven to your website
- **Top-performing pins:** Double down on what works
- **Audience demographics:** Ensure you're reaching the right people

> **Pro Tip:** Pinterest rewards fresh content. Instead of pinning the same image repeatedly, create variations of your best-performing pins with different headlines, colors, and layouts. Same product, different visual angle.

### Long-Term Pinterest Strategy

- **Month 1-2:** Set up profile, boards, and create initial pin library
- **Month 3-4:** Consistent daily pinning, refine keyword strategy
- **Month 5-6:** Analyze top performers and create more of what works
- **Month 7+:** Traffic compounds as older pins gain traction in search`,
  },
  {
    id: "instagram-strategy",
    category: "Social Media",
    title: "Instagram Community & Sales",
    description: "Visual platform perfect for templates and digital products. Strong community building features drive repeat purchases and word-of-mouth growth.",
    steps: [
      "Set up your Instagram bio with the 4-line formula: solve, offer, proof, CTA",
      "Build content around 4 pillars: Educational 40%, Product 30%, BTS 20%, Engagement 10%",
      "Master the Reel formula: 1-sec hook, 5-15 sec value, 2-sec CTA",
      "Post 5-10 stories daily with interactive stickers for engagement",
      "Use 30 hashtags strategically: 10 small, 10 medium, 10 large",
      "Engage authentically: comment on 10-20 posts daily, respond within first hour",
      "Monetize through link in bio, story links, and DM automation",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 6,
    content: `## Instagram Community & Sales: Build a Loyal Following That Buys

### Why Instagram Works for Digital Products

Instagram combines **visual storytelling** with **powerful community features**. It's where your audience builds a relationship with you -- and relationships drive repeat purchases. With Reels, Stories, and DMs, you have multiple touchpoints to connect and convert.

> **Pro Tip:** Instagram isn't about follower count. An account with 1,000 engaged followers who trust you will outsell an account with 100,000 disengaged followers every time. Focus on building genuine connections.

### Step 1: Profile Setup

**Bio Structure (4 lines max):**
- **Line 1: What you solve** -- "Helping creators save hours with ready-made templates"
- **Line 2: What you offer** -- "Notion, Figma & Canva templates"
- **Line 3: Social proof** -- "5,000+ happy customers"
- **Line 4: CTA** -- "Grab your free starter pack"

**Profile essentials:**
- **Profile picture:** Clear headshot or brand logo (shows up small, keep it simple)
- **Username:** Short, memorable, searchable (@templatecreator not @sarah_creates_templates_2026)
- **Link in bio:** Use a link aggregator with your lead magnet as the top link
- **Highlights:** Organize stories into categories (Products, Reviews, Tutorials, FAQ)

### Step 2: Content Pillars

Organize your content into 4 pillars with specific ratios:

**Educational Content (40%)**
- Quick tips and tutorials related to your niche
- "How to" carousels and step-by-step guides
- Industry insights and trend breakdowns
- This builds authority and attracts new followers

**Product Showcase (30%)**
- Product demos and walkthroughs
- Before/after transformations using your product
- Feature highlights and use cases
- Customer testimonials and results

**Behind-the-Scenes (20%)**
- Your workspace and creative process
- Product creation journey and progress updates
- Personal stories that build connection
- Day-in-the-life content

**Engagement Content (10%)**
- Questions, polls, and "this or that" posts
- Conversation starters and hot takes
- Community spotlight and user-generated content
- Giveaways and challenges

### Step 3: Reel Formula

Reels are Instagram's highest-reach format. Master this structure:

**1 Second -- The Hook:**
- Visual disruption (quick zoom, text overlay, unexpected movement)
- Opening line that stops the scroll
- "Wait for it..." or "This changed everything..."

**5-15 Seconds -- The Value:**
- Deliver the tutorial, tip, or demo
- Keep it fast-paced with cuts every 2-3 seconds
- Use text overlays for key points (many watch without sound)
- Show your product naturally within the value content

**2 Seconds -- The CTA:**
- "Save this for later" (drives saves, boosting the algorithm)
- "Link in bio for the full template"
- "Comment [keyword] for the free version"
- "Follow for more tips like this"

### Step 4: Story Strategy

Stories build intimacy and drive daily engagement:

- **Post 5-10 stories daily** to stay top of feed
- **Use interactive stickers:** Polls, quizzes, questions, and sliders
- **Story sequence:** Start with a hook, deliver value, end with a CTA
- **Behind-the-scenes:** Show your authentic daily life and work process
- **Product teasers:** Show sneak peeks and build anticipation

**Story types that convert:**
- Tutorial stories with "swipe up" or link sticker to the product
- "Did you know?" facts related to your product's benefit
- Customer DM screenshots (with permission) as social proof
- "New product alert" with countdown sticker for launches

### Step 5: Hashtag Strategy

Use **up to 30 hashtags** with this distribution:

- **10 Small hashtags** (under 100K posts): #notionworkspace, #canvatemplatedesign
- **10 Medium hashtags** (100K-500K posts): #productivitytools, #digitaltemplate
- **10 Large hashtags** (500K-1M+ posts): #entrepreneur, #sidehustle, #digitalproducts

**Hashtag tips:**
- Create **3-5 hashtag sets** and rotate them across posts
- Place hashtags in the **first comment**, not the caption
- **Research hashtags** by checking what top creators in your niche use
- Remove underperforming hashtags and replace with new ones monthly

### Step 6: Engagement Hacks

Instagram's algorithm rewards early, authentic engagement:

- **Comment on 10-20 posts daily** in your niche (genuine, thoughtful comments -- not generic "great post!" spam)
- **Respond to every comment** on your posts within the first hour
- **Reply to every DM** -- even if it's just a quick "thanks!"
- **Engage before you post** -- spend 15-20 minutes engaging, then publish your content
- **Collaborate with other creators** through joint Lives or shared content
- **Use the Close Friends feature** for exclusive content (creates FOMO)

### Step 7: Monetization

**Primary conversion paths:**
- **Link in bio:** Lead magnet at the top, product links below
- **Story links:** Direct links to products in stories (available to all accounts)
- **DM automation:** Use keywords to trigger automatic DM responses with links
- **Instagram Shop:** Tag products in posts and stories for easy purchasing
- **Live shopping:** Demo products during Instagram Live with purchase links

> **Pro Tip:** The DM strategy is incredibly powerful. Create a post saying "Comment 'TEMPLATE' and I'll send you the free version." Use automation to instantly DM everyone who comments. This boosts your post's engagement AND captures leads.

### Weekly Instagram Schedule

- **Monday:** Educational carousel + 7 stories
- **Tuesday:** Reel (tutorial/tip) + 5 stories
- **Wednesday:** Product showcase post + 7 stories
- **Thursday:** Behind-the-scenes Reel + 5 stories
- **Friday:** Engagement post (poll/question) + 7 stories
- **Saturday:** User-generated content or testimonial + 5 stories
- **Sunday:** Personal/inspirational story + 5 stories`,
  },
  {
    id: "youtube-strategy",
    category: "Social Media",
    title: "YouTube Evergreen Authority",
    description: "Long-form content allows deep product demonstrations. An SEO goldmine where videos rank in Google too, driving traffic for years.",
    steps: [
      "Set up your YouTube channel with professional banner and keyword-rich description",
      "Plan content around 5 types: tutorials, walkthroughs, comparisons, case studies, build-with-me",
      "Structure videos: 15-sec hook, 80% value, 20% CTA",
      "Optimize for SEO with title formula, description template, and thumbnail rules",
      "Post 1 high-quality video per week consistently",
      "Build monetization layers: affiliate links, product links, lead magnets in descriptions",
    ],
    difficulty: "hard" as const,
    impact: "high" as const,
    sortOrder: 7,
    content: `## YouTube Evergreen Authority: Build a Content Library That Sells Forever

### Why YouTube is the Ultimate Long Game

YouTube is the **second largest search engine** in the world, and videos rank in Google search results too. Unlike social media posts that disappear in hours, a well-optimized YouTube video can drive traffic and sales for **3-5+ years**. The effort-to-reward ratio is unmatched.

> **Pro Tip:** One great YouTube video can generate more sales than 100 tweets or Instagram posts. The time investment is higher, but the compounding returns are exponential. A video you make today could be selling products for you in 2029.

### Step 1: Channel Setup

**Channel Branding:**
- **Channel name:** Your brand name or "[Name] | [Niche]"
- **Profile picture:** Same as other platforms for brand consistency
- **Banner:** Professional, clean design showing what your channel is about and when you post
- **Channel description:** Keyword-rich, 500+ characters explaining who you help and how

**Channel description template:**
"Welcome to [Channel Name]! I create [content type] for [audience]. Whether you're looking for [topic 1], [topic 2], or [topic 3], you'll find actionable tutorials and resources here. New videos every [schedule]. Grab my free [lead magnet]: [link]"

### Step 2: Content Types (5 Formats That Sell)

**1. Tutorials ("How to...")**
- Step-by-step guides related to your product's niche
- Example: "How to Set Up a Complete Business System in Notion"
- Naturally demonstrates your product while teaching

**2. Product Walkthroughs**
- Deep-dive tours of your products showing every feature
- Example: "Full Walkthrough: My Premium UI Kit (200+ Components)"
- Buyers watch these before purchasing -- make them thorough

**3. Comparison/Review Videos**
- Compare tools, methods, or approaches in your niche
- Example: "Best Notion Templates for Freelancers (2026 Comparison)"
- Include your product as one of the options (authentically)

**4. Transformation/Case Study Videos**
- Show before/after results from using your products
- Example: "I Rebuilt My Entire Workflow Using These Templates -- Here's What Happened"
- The most persuasive content type for driving sales

**5. Build With Me Series**
- Create something using your product in real-time
- Example: "Build With Me: Setting Up a Complete CRM in Notion"
- Viewers see the product in action and want it for themselves

### Step 3: Video Structure

**15-Second Hook (Critical):**
- Start with the outcome or a bold statement
- "By the end of this video, you'll have a complete business system set up"
- Show the end result first, then teach how to get there
- Never start with an intro or "Hey guys, welcome back..."

**80% Value (The Core):**
- Deliver on your hook's promise with clear, step-by-step content
- Use screen recordings, demonstrations, and visuals
- Keep a good pace -- edit out pauses, ums, and dead air
- Break content into clear sections with on-screen labels

**20% CTA (The Close):**
- Summarize what they learned
- Direct them to your product: "I've linked the template in the description below"
- Ask them to subscribe and like the video
- Tease the next video to keep them coming back

### Step 4: SEO Optimization

**Title Formula:**
"[Primary Keyword] -- [Benefit/Outcome] ([Year])"
Examples:
- "Notion Template for Freelancers -- Organize Your Entire Business (2026)"
- "React Component Library Tutorial -- Build Apps 10x Faster"

**Description Template (first 200 chars are most important):**
Line 1: Summarize the video with your primary keyword
Line 2-3: Expand on what viewers will learn
Links section: Product links, lead magnet, social media
Timestamps: Chapter markers for key sections
Tags: 5-10 relevant keywords

**Thumbnail Rules:**
- **Clear, readable text** (4-6 words max)
- **High contrast** between text and background
- **Expressive face** or compelling visual
- **Consistent style** across all videos (brand recognition)
- **Curiosity gap** -- make them want to click to learn more

### Step 5: Posting Schedule

- **Frequency:** 1 video per week minimum (quality over quantity always)
- **Consistency:** Same day and time every week (e.g., every Tuesday at 10 AM)
- **Batch production:** Film 2-4 videos in one session, edit and schedule them
- **Best posting times:** Tuesday-Thursday, 2-4 PM EST (when search traffic peaks)

### Step 6: Monetization Layers

YouTube offers multiple revenue streams:

- **Product links in description:** Direct links to your store with UTM tracking
- **Lead magnet promotion:** "Download my free [resource] -- link in the description"
- **Affiliate links:** Recommend tools you use and earn commission
- **YouTube Ad Revenue:** Monetize through the Partner Program (1,000+ subscribers)
- **Sponsored content:** As you grow, brands will pay for mentions
- **Community tab:** Share product announcements and exclusive offers with subscribers

> **Pro Tip:** Add timestamps/chapters to every video. This helps viewers find specific sections AND helps YouTube understand your content better for search rankings. It also increases watch time because viewers jump to the sections most relevant to them.

### Growth Timeline

- **Month 1-3:** Focus on quality content and SEO. Expect slow growth (this is normal)
- **Month 3-6:** Videos start ranking in search. Traffic builds gradually
- **Month 6-12:** Compounding effect kicks in. Older videos drive consistent traffic
- **Year 2+:** Your video library becomes a passive traffic and sales engine`,
  },
  {
    id: "twitter-x-strategy",
    category: "Social Media",
    title: "Twitter/X Growth Playbook",
    description: "Tech-savvy audience perfect for SaaS and software products. Building in public thrives here and creates authentic connections with buyers.",
    steps: [
      "Optimize your profile: keyword in display name, bio formula, pinned tweet",
      "Master 5 tweet types: value threads, quick tips, product mentions, BTS, engagement",
      "Learn the thread formula for viral reach and deep engagement",
      "Spend 30 minutes daily engaging before tweeting",
      "Build monetization through profile links, pinned tweets, and DMs",
    ],
    difficulty: "medium" as const,
    impact: "medium" as const,
    sortOrder: 8,
    content: `## Twitter/X Growth Playbook: Build in Public and Sell Authentically

### Why Twitter/X Works for Digital Products

Twitter is home to the **most tech-savvy, product-hungry audience** on the internet. The "build in public" movement thrives here, and the platform rewards **authentic, value-driven creators** with organic reach. It's the best platform for software products, SaaS tools, and digital templates.

> **Pro Tip:** Twitter rewards consistency and authenticity above all else. The creators who share their real journey -- wins, failures, and lessons -- build the most loyal followings and drive the most sales.

### Step 1: Profile Optimization

**Display Name:**
Include a keyword that tells people what you do:
- "Sarah | Template Creator"
- "Alex -- Building Digital Products"
- "Mike (Notion Expert)"

**Bio Formula (160 characters):**
Line 1: What you do / who you help
Line 2: Social proof or credibility
Line 3: CTA (link to lead magnet or product)

Example: "I build digital templates that save you hours. 5,000+ happy customers. Grab the free starter kit below."

**Profile essentials:**
- **Header image:** Showcase your products or brand message
- **Pinned tweet:** Your best-performing tweet or product launch thread
- **Website link:** Direct to your storefront or lead magnet

### Step 2: Content Strategy (5 Tweet Types)

**1. Value Threads (2-3 per week)**
Long-form threads that deliver actionable insights:
- "10 Notion hacks that saved me 5 hours this week (thread)"
- "I've sold $50K in digital products. Here's everything I learned:"
- Threads get 3-5x more engagement than single tweets

**2. Quick Tips (daily)**
Bite-sized actionable advice:
- "One Notion trick most people don't know: [tip]"
- "Quick design tip: [specific advice]"
- Easy to create and consistently drives engagement

**3. Product Mentions (2-3 per week)**
Natural references to your products:
- "Just shipped a new feature in my template pack..."
- "Someone asked how I organize [task]. Here's my template:"
- Frame as sharing, not selling

**4. Behind-the-Scenes (2-3 per week)**
Build in public content:
- Revenue updates and milestone celebrations
- Product creation process and decision-making
- Challenges you're facing and how you're solving them
- These posts build the deepest connections

**5. Engagement Tweets (daily)**
Posts designed to start conversations:
- Questions: "What's the one tool you can't live without?"
- Polls: "Which template would you want next?"
- Hot takes: "Unpopular opinion: [your take on industry topic]"

### Step 3: Thread Formula for Viral Reach

**Tweet 1 (Hook):** Bold claim or promise that compels people to read more
"I went from 0 to $10K/month selling digital products. Here are the 7 things that made it possible:"

**Tweets 2-7 (Value):** Each tweet delivers one key insight
- Number each point for easy reading
- Include specifics, not generalities
- Add images or screenshots where relevant

**Final Tweet (CTA):** Summarize and link to your product
"If you found this helpful: 1. Follow me for more tips, 2. RT the first tweet, 3. Grab my free template: [link]"

### Step 4: Engagement Tactics

**The 30-Minute Rule:**
Before posting your own content each day, spend 30 minutes engaging with others:
- **Reply to 10-15 tweets** from creators in your niche
- Write **thoughtful, substantive replies** (not "great thread!")
- **Quote tweet** interesting posts with your own perspective
- **Follow and engage** with people who interact with similar creators

**Why this works:** Twitter's algorithm shows your replies to your followers. Good replies attract followers from other creators' audiences.

### Step 5: Monetization

**Profile link:** Direct to your lead magnet or storefront
**Pinned tweet:** Your best product launch or highest-converting thread
**Thread CTAs:** End every value thread with a relevant product link
**DM strategy:** When people ask for recommendations, share your product naturally
**Twitter Blue:** Longer tweets and edit functionality can enhance your content

> **Pro Tip:** The "build in public" approach is the most authentic sales strategy on Twitter. Share your real revenue numbers, your process, your wins and losses. People buy from creators they feel connected to, and vulnerability builds that connection faster than polished marketing.

### Daily Twitter Routine

- **Morning (15 min):** Engage with 10 tweets in your niche
- **Midday:** Post your main tweet/thread for the day
- **Afternoon (15 min):** Reply to comments on your posts
- **Evening:** Engage with trending conversations in your space`,
  },
  {
    id: "linkedin-strategy",
    category: "Social Media",
    title: "LinkedIn B2B Strategy",
    description: "Professional audience willing to pay premium prices. Great for productivity tools, business templates, and software products.",
    steps: [
      "Set up your profile with the headline formula and featured section",
      "Master 4 content formats: story posts, carousel posts, video posts, and polls",
      "Comment on 10-15 posts daily in your niche for visibility",
      "Monetize through CTAs in posts, DM strategy, and featured section links",
    ],
    difficulty: "medium" as const,
    impact: "medium" as const,
    sortOrder: 9,
    content: `## LinkedIn B2B Strategy: Sell Premium Products to Professionals

### Why LinkedIn is Underrated for Digital Products

LinkedIn has **950+ million professionals** who are willing to pay premium prices for products that save them time or make them money. The organic reach is still generous, and the audience has significantly higher purchasing power than most other platforms.

> **Pro Tip:** LinkedIn's algorithm is 3-5 years behind Instagram and TikTok in terms of sophistication. This means organic reach is still incredibly high. A well-crafted post can reach 10-50x your follower count. Get in now while the opportunity is massive.

### Step 1: Profile Setup

**Headline Formula:**
"I help [audience] [achieve outcome] | [Your title/credential] | [CTA]"

Examples:
- "I help freelancers save 10+ hours/week with Notion templates | Template Creator | Free starter kit in Featured"
- "Building tools that help small businesses grow | Founder @BrandName | Check out my templates below"

**Featured Section (Critical for Sales):**
Pin your most important links at the top of your profile:
1. **Free lead magnet** (drives email signups)
2. **Best-selling product** (direct sales)
3. **Best-performing post** (social proof)

**About Section:**
- Tell your story in a conversational tone
- Focus on the **problem you solve** for your audience
- Include a **clear CTA** at the end
- Add relevant **keywords** for LinkedIn search

### Step 2: Content Strategy (4 Formats)

**1. Story-Based Posts (Most Engaging)**
LinkedIn loves personal stories with professional lessons:

Structure:
- **Hook:** Bold first line that creates curiosity
- **Story:** Short narrative (personal experience or observation)
- **Lesson:** What you learned and how it applies to the reader
- **CTA:** Soft product mention or engagement prompt

Example:
"I wasted 3 hours on a spreadsheet yesterday.

Then I remembered I built a template for exactly this.

Set it up in 10 minutes. Done.

Here's the lesson: We often forget to use our own tools.

If you're spending time on repetitive tasks, I have 15 templates that automate the boring stuff. Link in the comments."

**2. Carousel Posts (Highest Saves)**
Multi-slide educational content:
- **10-15 slides** with one key point per slide
- Clean design with readable text
- End with a CTA slide
- Topics: Tips, frameworks, step-by-step guides

**3. Video Posts (Highest Reach)**
- **60-90 seconds** is the sweet spot
- Native video (uploaded directly, not YouTube links)
- Add captions (most watch without sound)
- Product demos, quick tutorials, or talking-head insights

**4. Poll Posts (Highest Engagement)**
- Ask questions related to your product's problem space
- Use poll results as content ideas and market research
- Follow up with a post analyzing the results
- Example: "What's your biggest productivity challenge? A) Too many tools B) No system C) Procrastination D) Meeting overload"

### Step 3: Engagement Strategy

**Daily engagement routine (20-30 minutes):**
- **Comment on 10-15 posts** from people in your target audience
- Write **thoughtful, value-adding comments** (3+ sentences)
- **React to comments** on your own posts within the first hour
- **Send connection requests** to engaged commenters with a personal note

**Why commenting matters:** LinkedIn shows your comments to YOUR followers. A good comment on a viral post exposes you to thousands of new people. Think of comments as mini-content pieces.

### Step 4: Monetization

**CTA in posts:**
- End every 3rd post with a soft product mention
- "If you want the complete system, I've linked it in the comments"
- Never put links in the post body (LinkedIn suppresses posts with links)

**DM Strategy:**
- When someone engages meaningfully with your content, send a personal DM
- Don't pitch immediately -- start a conversation
- After building rapport, naturally mention your product if relevant
- "I actually built a template for exactly what you described. Want me to send the link?"

**Featured section:**
- Keep your lead magnet and best product pinned in Featured
- Update regularly with new products and seasonal offers

### Content Calendar

- **Monday:** Story post (personal lesson)
- **Tuesday:** Carousel (educational framework)
- **Wednesday:** Video (quick tip or product demo)
- **Thursday:** Poll or engagement post
- **Friday:** Product showcase or customer story

> **Pro Tip:** LinkedIn's algorithm heavily rewards posts that get engagement in the first 60-90 minutes. Post when your audience is most active (typically 8-10 AM on weekdays) and immediately engage with the first comments to boost visibility.`,
  },
  {
    id: "reddit-strategy",
    category: "Social Media",
    title: "Reddit Niche Communities",
    description: "Highly targeted audiences actively seeking solutions. Low competition if done right with a value-first, anti-spam approach.",
    steps: [
      "Build your Reddit account with 500+ karma before any promotion",
      "Find and join 5-10 subreddits where your target audience is active",
      "Follow the 3-phase content strategy: credibility, subtle intro, value posts",
      "Learn subreddit-specific tactics and posting rules",
      "Never break the cardinal rules of Reddit self-promotion",
    ],
    difficulty: "hard" as const,
    impact: "medium" as const,
    sortOrder: 10,
    content: `## Reddit Niche Communities: Tap into Targeted Audiences

### Why Reddit is a Hidden Goldmine

Reddit has **1.5+ billion monthly visitors** organized into hyper-specific communities (subreddits) where people **actively seek solutions**. Unlike other platforms, Reddit users are anti-marketing by nature -- but if you approach it correctly with genuine value, the conversions are among the highest of any platform.

> **Pro Tip:** Reddit will punish you ruthlessly for self-promotion. But if you genuinely help people and subtly mention your product when it's truly relevant, Reddit can become your most profitable channel per hour invested. Patience is everything here.

### Step 1: Account Setup (The Long Game)

**Building Karma (Reputation):**
Reddit has a karma system that determines your credibility. Before ANY promotion:

- **Spend 2-4 weeks** being a genuinely helpful community member
- **Aim for 500+ karma** before mentioning anything commercial
- **Post helpful comments** in subreddits related to your niche
- **Answer questions** thoroughly and thoughtfully
- **Share others' resources** before sharing your own

**Profile optimization:**
- Use a **real-sounding username** (not @brandname or @sellstemplates)
- Write a brief **bio** about your interests and expertise
- Let your **post/comment history** speak for itself

### Step 2: Finding the Right Subreddits

Search for communities where your audience hangs out:

**For template/tool creators:**
- r/Notion, r/productivity, r/Entrepreneur
- r/smallbusiness, r/startups, r/SideProject
- r/webdev, r/reactjs, r/design

**For content/creative products:**
- r/graphic_design, r/photography, r/socialmedia
- r/contentcreation, r/marketing

**Evaluation criteria:**
- **Subscriber count:** 10K-500K is the sweet spot (active but not oversaturated)
- **Post frequency:** At least 5-10 new posts daily
- **Self-promotion rules:** Read carefully -- some subreddits ban all promotion
- **Community vibe:** Helpful and constructive vs. toxic and hostile

### Step 3: Content Strategy (3 Phases)

**Phase 1: Establish Credibility (Weeks 1-4)**
- Be a **helpful community member** with zero mention of your products
- Answer questions with **detailed, thoughtful responses**
- Share free resources, tips, and insights
- Build relationships by engaging in discussions
- Goal: People start recognizing your username as a helpful contributor

**Phase 2: Subtle Introduction (Weeks 5-8)**
- Continue being helpful, but start **mentioning your expertise**
- "I actually work on this -- here's what I've found..."
- Share **free versions** of your resources when relevant
- If someone asks for exactly what you sell, you can mention it naturally
- Never create posts just to promote -- only mention products in responses

**Phase 3: Value Posts with Soft CTA (Week 9+)**
- Create **genuinely helpful posts** that happen to relate to your product
- "I built a free [resource] for [audience]. Here's how to use it: [detailed guide]"
- The post itself must be complete and valuable -- the product link is optional
- Share results, case studies, or detailed tutorials
- Let the community decide if they want to check out your product

### Step 4: Subreddit-Specific Tactics

**r/Entrepreneur and r/startups:**
- Share your journey with real numbers and lessons
- Focus on "how I did it" posts with actionable takeaways
- Be transparent about failures, not just successes

**r/Notion, r/productivity:**
- Share free templates with detailed setup guides
- Create comparison posts or workflow breakdowns
- Answer "how do I..." questions with thorough responses

**Niche-specific subreddits:**
- Become the go-to expert for your specific topic
- Create detailed guides and tutorials
- Offer to help people one-on-one (builds trust and rapport)

### Step 5: Rules to NEVER Break

1. **Never post a link without substantial accompanying value** -- Reddit will downvote you into oblivion
2. **Never use multiple accounts** to upvote your own content (Reddit bans for this)
3. **Never spam the same link** across multiple subreddits simultaneously
4. **Never argue with critics** -- respond gracefully or not at all
5. **Never be defensive** about self-promotion accusations -- acknowledge it honestly
6. **Always read subreddit rules** before posting (every community is different)
7. **Never use clickbait titles** -- Redditors hate manipulation

### The Reddit Formula That Works

The posts that perform best on Reddit follow this pattern:

1. **Compelling, honest title** (no clickbait, no hype)
2. **Long, detailed body** with genuine value (500-1000+ words)
3. **Personal experience** woven into the advice
4. **Specific, actionable steps** people can follow
5. **Soft mention of your product** at the end (optional): "P.S. I built a template for this if anyone's interested, but the steps above work with any tool."

> **Pro Tip:** The best Reddit marketing doesn't feel like marketing at all. If someone reads your post and thinks "this person is just trying to sell something," you've already lost. If they think "this person genuinely knows their stuff and happens to have a product," you've won.

### Expected Timeline

- **Month 1:** Build karma and credibility (zero sales expected)
- **Month 2:** Start getting recognition as a helpful contributor
- **Month 3:** First natural product mentions in responses
- **Month 4+:** Organic traffic from Reddit starts flowing. Posts live forever in search results`,
  },
  {
    id: "cross-platform-strategy",
    category: "Social Media",
    title: "Cross-Platform Content Strategy",
    description: "Create a content ecosystem where one piece of content becomes 20+ posts across all platforms. The real secret to scaling your marketing efforts.",
    steps: [
      "Master the content repurposing flow from long-form to short-form",
      "Set up a weekly content production schedule across all platforms",
      "Follow the 90-day launch plan: build foundation, introduce products, scale",
      "Create platform-specific adaptations of each piece of content",
    ],
    difficulty: "medium" as const,
    impact: "high" as const,
    sortOrder: 11,
    content: `## Cross-Platform Content Strategy: One Piece of Content, 20+ Posts

### The Content Multiplication Secret

The most successful digital product creators don't create unique content for every platform. They create **one core piece of content** and strategically repurpose it across every platform. This approach lets you maintain a strong presence everywhere while only creating content once.

> **Pro Tip:** The goal isn't to be on every platform -- it's to extract maximum value from every piece of content you create. One YouTube video can fuel an entire week of content across all your channels.

### The Content Repurposing Flow

Start with your highest-effort content and cascade down:

**1. YouTube Video (Long-Form Source)**
Create one in-depth video per week (10-20 minutes)
This is your "content anchor" for the entire week

**2. TikTok/Instagram Reels (Short Clips)**
Extract 3-5 short clips (15-60 seconds) from your YouTube video
- Key moments, tips, or demonstrations
- Add captions and platform-specific formatting
- Post throughout the week

**3. Twitter/X Threads**
Transform the video's key points into a value thread
- One main insight per tweet
- Add your own commentary and context
- End with a CTA to the full video

**4. Pinterest Pins**
Create 5-10 pin designs based on the video's content
- Quote graphics with key insights
- Infographic-style pins with steps or tips
- Product showcase pins from the demo portions
- Link each pin to your product page or blog post

**5. LinkedIn Carousel**
Convert the video's framework into a 10-15 slide carousel
- One insight per slide
- Professional, clean design
- End slide with CTA to your product

**6. Reddit Post**
Write a detailed text post sharing the key insights
- 500-1000 words of genuine value
- Personal experience and specific advice
- Soft mention of your product at the end

**7. Email Newsletter**
Summarize the week's key content for your email list
- Link to the full YouTube video
- Include a product mention or special offer
- Share behind-the-scenes insights

### Weekly Content Schedule

| Day | Primary | Secondary | Engagement |
|-----|---------|-----------|------------|
| **Monday** | YouTube video published | Twitter thread | Reply to comments |
| **Tuesday** | TikTok clip #1 | LinkedIn carousel | 30 min engagement |
| **Wednesday** | Instagram Reel #1 | Pinterest (5 pins) | Reply to comments |
| **Thursday** | TikTok clip #2 | Reddit post | 30 min engagement |
| **Friday** | Instagram Reel #2 | Email newsletter | Reply to comments |
| **Saturday** | TikTok clip #3 | Pinterest (5 pins) | Light engagement |
| **Sunday** | Content planning | Batch pin creation | Rest and reflect |

### The 90-Day Launch Plan

**Days 1-30: Build the Foundation**
- Set up all platform profiles with optimized bios and branding
- Start posting value-first content (zero promotion)
- Focus on 2-3 primary platforms
- Engage authentically with your target audience
- Create your lead magnet and email capture system
- Build your initial content library (10-15 pieces)

Goals: 100 followers, 50 email subscribers, content system established

**Days 31-60: Introduce Products**
- Begin soft product mentions in your content (80/20 rule)
- Launch your lead magnet and promote it across platforms
- Start your email welcome sequence
- Share behind-the-scenes of your product creation
- Create your first product-focused content pieces
- Collect initial customer testimonials

Goals: 500 followers, 200 email subscribers, first 10-20 sales

**Days 61-90: Scale What Works**
- Analyze which platforms and content types drive the most sales
- Double down on winning channels and content formats
- Launch product bundles or new products
- Start retargeting campaigns on top-performing platforms
- Build partnerships with complementary creators
- Create a repeatable weekly content system

Goals: 1,000+ followers, 500 email subscribers, consistent weekly sales

### Platform Priority by Product Type

| Product Type | Primary | Secondary | Tertiary |
|-------------|---------|-----------|----------|
| **Templates** | Pinterest, TikTok | Instagram | Twitter |
| **Software/SaaS** | Twitter, YouTube | LinkedIn | Reddit |
| **Design Assets** | Instagram, Pinterest | TikTok | YouTube |
| **Ebooks/Courses** | YouTube, Twitter | LinkedIn | Instagram |
| **B2B Tools** | LinkedIn, Twitter | YouTube | Reddit |

### Content Batching System

Maximize efficiency by batching content creation:

**Weekly Content Day (3-4 hours):**
1. **Film:** Record your YouTube video (1-2 hours)
2. **Clip:** Extract 3-5 short clips for TikTok/Reels (30 min)
3. **Write:** Create Twitter thread and LinkedIn post (30 min)
4. **Design:** Create Pinterest pins and carousel slides (30 min)
5. **Schedule:** Queue everything using scheduling tools (15 min)

**Tools for batching:**
- **Video editing:** CapCut, Descript, or DaVinci Resolve
- **Design:** Canva or Figma for pins and carousels
- **Scheduling:** Buffer, Later, or Hootsuite for social posts
- **Email:** ConvertKit or Mailchimp for newsletters

### Measuring Cross-Platform Success

Track these metrics monthly across all platforms:

- **Total reach:** Combined impressions across all platforms
- **Email list growth:** New subscribers per week
- **Revenue by source:** Which platform drives the most sales
- **Best content format:** What type of content converts best
- **Time investment:** Hours spent per platform vs. revenue generated

> **Pro Tip:** After 90 days, you'll have clear data on which platforms work best for YOUR products and audience. Don't try to maintain equal effort across all platforms. Go all-in on your top 2-3 performers and maintain a minimal presence elsewhere. The Pareto principle applies: 80% of your sales will come from 20% of your platforms.

### The Compound Effect

The magic of cross-platform content strategy is the **compound effect**:

- Week 1: 7 pieces of content across platforms
- Month 1: 30+ pieces of content working for you
- Month 3: 90+ pieces of content driving traffic
- Month 6: 180+ pieces of content, many ranking in search
- Year 1: 500+ pieces of content creating a massive content moat

Each piece of content is a **tiny salesperson** working 24/7. The more you create, the harder it becomes for competitors to catch up.`,
  },
];

async function seedMarketingStrategies() {
  const existing = await db.select().from(marketingStrategies);
  if (existing.length > 0 && existing[0].content) return;

  if (existing.length > 0) {
    await db.delete(marketingStrategies);
  }

  for (const s of strategies) {
    await db.insert(marketingStrategies).values(s);
  }

  console.log(`Seeded ${strategies.length} marketing strategies`);
}
