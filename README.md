# Sellisy

A multi-tenant SaaS platform for selling digital products — storefronts, payments, content creation, and more.

## What it does

Each user gets their own customizable storefront where they can sell digital products, bundles, and courses. Buyers get instant access to their purchases via download links and a personal customer portal.

**Key features:**
- Customizable storefronts — seven themes (Neon, Silk, Aurora, Ember, Frost, Midnight, Launch) with per-store section ordering and configurable accent color
- Sell digital products (PDFs, software, templates, ebooks, graphics) plus bundles and discount coupons
- **LMS** — full course product type with modules, lessons (video + attachments), drip scheduling, single/multi-select quizzes, completion certificates with a per-product designer (accent color + logo), and per-lesson threaded comments with per-buyer email opt-out
- **Affiliate program** — invite or self-serve apply, per-affiliate commission overrides, cookie attribution with refund clawback, manual payout tracking (Stripe Connect on the V2 roadmap)
- **Gumroad importer** — one-click OAuth import of products and customer history with welcome-email queueing
- Stripe and PayPal payment processing; opt-in Stripe Tax per store
- Per-buyer PDF watermarking on download
- Cart with slide-out drawer for multi-product checkout
- Buyer reviews (verified purchase, per-store + per-product opt-out)
- Newsletter broadcast campaigns with a block editor
- Knowledge bases with nested pages, a Notion-style block editor, and file attachments
- Blog with a rich block editor
- Customer portal with magic-link login
- Analytics (page views, product views, revenue, traffic, coupons)
- Marketing strategy playbook
- Embeddable product/bundle widgets and custom domains via Cloudflare for SaaS

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript, Vite, TanStack Query, Wouter, ShadCN UI, Tailwind CSS |
| Backend | Node.js + Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL |
| File storage | Cloudflare R2 (presigned URL upload flow) |
| Payments | Stripe, PayPal |
| Email | SendGrid (with retry, suppression list, event webhook) |
| Auth | Clerk (store owners), magic-link sessions (buyers) |
| Background jobs | BullMQ + Redis (Gumroad import, welcome emails) |
| PDF | `pdf-lib` (per-buyer watermarking + certificate generation) |
| Custom domains | Cloudflare for SaaS (auto SSL + host-based routing) |

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe and/or PayPal credentials
- SendGrid API key
- Cloudflare R2 bucket (for file uploads)

### Environment variables

Create a `.env` file at the project root. The full production list (Stripe + PayPal webhook secrets, SendGrid event webhook, Cloudflare for SaaS, Gumroad OAuth, Redis, etc.) is documented in [RAILWAY_ENV.md](RAILWAY_ENV.md). For local dev the minimum is:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=...
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...  # webhook endpoint will reject with 503 until set
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=hello@example.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://cdn.example.com
GUMROAD_TOKEN_ENCRYPTION_KEY=...  # 32-byte hex; used to AES-256-GCM-encrypt user Gumroad PATs
REDIS_URL=redis://localhost:6379  # optional in dev; required for Gumroad import/welcome-email workers
```

### Install and run

```bash
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app runs on `http://localhost:5000` by default.

### Build for production

```bash
npm run build
npm start
```

## Project structure

```
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Shared + feature components
│   │   │   ├── dashboard/   # Dashboard UI cards, editors (lessons, quiz, KB, blog)
│   │   │   ├── storefront/  # Base template, 7 themes, sections, cart drawer
│   │   │   └── ui/          # ShadCN primitives
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Query client, cart/store/theme contexts, Clerk bridge
│   │   └── pages/           # Route pages
│   │       └── dashboard/   # Dashboard pages (products, courses, KB, blog, affiliates, …)
│
├── server/                  # Express backend
│   ├── index.ts             # App bootstrap, CSP/CORS, rate limiters, webhook mounts
│   ├── routes.ts            # Most API routes (being split — see routes/)
│   ├── routes/              # Domain-extracted routers (affiliate, courses, gumroad-import)
│   ├── storage.ts           # Database access layer (IStorage)
│   ├── webhookHandlers.ts   # Stripe + PayPal webhook verification + dispatch
│   ├── emails.ts            # Email template helpers
│   ├── sendgridClient.ts    # Email send with retry, suppression-list aware
│   ├── pdfWatermark.ts      # Per-buyer PDF stamping (pdf-lib)
│   ├── certificate.ts       # Course certificate PDF generation
│   ├── og-tags.ts           # SSR meta/JSON-LD + affiliate tracking script injection
│   ├── crypto/              # AES-256-GCM token encryption, HMAC unsubscribe tokens
│   ├── queue/, jobs/        # BullMQ workers (Gumroad import, welcome emails)
│   ├── r2Storage.ts         # Cloudflare R2 presigned URLs
│   ├── cloudflareClient.ts  # Cloudflare for SaaS (custom domain SSL)
│   ├── audit.ts             # Structured JSON audit logger
│   ├── integrity.ts         # Boot-time health checks + repair helpers
│   └── db.ts                # Drizzle database connection
│
├── migrations/              # SQL migrations (numbered 0000 …)
├── design-system/           # Brand, colors, typography, themes, components
└── shared/
    └── schema.ts            # Drizzle schema — single source of truth for types
```

## Database schema highlights

- `stores` — per-user storefront configuration (theme, sections, branding, payment provider config, Stripe Tax toggle, PDF watermark toggle, affiliate program settings)
- `userProfiles` — plan tier (`basic` / `pro` / `max`), admin flag, 14-day trial tracking
- `products` / `storeProducts` — platform library + per-store listings with custom pricing, upsell chaining, lead-magnet flag, per-product review/certificate opt-out, certificate accent + logo
- `bundles` / `bundleItems` — grouped product deals
- `orders` / `orderItems` / `downloadTokens` — purchase and delivery flow, refund tracking, affiliate attribution snapshot
- `customers` / `customerSessions` — buyer auth with magic links
- `knowledgeBases` / `kbPages` / `kbBlocks` / `kbPageAttachments` — Notion-style KB
- `courseModules` / `courseLessons` / `courseLessonProgress` — LMS structure + drip scheduling + per-buyer completion
- `quizQuestions` / `quizChoices` / `quizAttempts` — single + multi-select MCQ quizzes
- `certificateIssued` — verifiable per-buyer certificates (32-char public verification code)
- `courseLessonComments` — threaded lesson discussion with edit tracking
- `affiliates` / `affiliateClicks` / `affiliateCommissions` / `affiliatePayouts` — affiliate program with refund clawback and locked-until payout buffer
- `gumroadImports` / `gumroadProductShells` — Gumroad importer job state (token AES-256-GCM encrypted)
- `blogPosts` / `blogBlocks` — storefront blog
- `newsletterSubscribers` / `newsletterCampaigns` / `newsletterCampaignBlocks` — email marketing
- `storeReviews` — verified buyer reviews
- `storeTestimonials` / `storeFaqs` — social proof sections
- `marketingStrategies` / `storeStrategyProgress` — marketing playbook content + per-store completion
- `storeEvents` — analytics clickstream (page_view, product_view, add_to_cart, etc.)
- `emailLogs` / `emailSuppression` — delivery audit trail + bounce/complaint/unsubscribe list
- `webhookEvents` — Stripe / PayPal / SendGrid event dedup ledger

## Storefront themes

Storefronts support multiple built-in themes (Minimal, Silk, Dark, etc.) and a dark/light mode toggle. Each theme exposes a `ThemeColors` object (`c`) used for inline styles throughout storefront components — no CSS class conflicts between tenants.

## License

MIT
