# Sellisy

A multi-tenant SaaS platform for selling digital products — storefronts, payments, content creation, and more.

## What it does

Each user gets their own customizable storefront where they can sell digital products, bundles, and courses. Buyers get instant access to their purchases via download links and a personal customer portal.

**Key features:**
- Customizable storefronts with multiple themes and section ordering
- Sell digital products (PDFs, software, templates, ebooks, courses)
- Product bundles and discount coupons
- Stripe and PayPal payment processing
- Cart with slide-out drawer for multi-product checkout
- Buyer reviews (verified purchase, owner toggle)
- Newsletter broadcast campaigns with a block editor
- Knowledge base / course builder with lesson attachments
- Blog with a rich block editor
- Customer portal with magic-link login
- Analytics (page views, product views, revenue)
- Marketing strategy playbook

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript, Vite, TanStack Query, Wouter, ShadCN UI, Tailwind CSS |
| Backend | Node.js + Express, TypeScript, Drizzle ORM |
| Database | PostgreSQL |
| File storage | Cloudflare R2 (presigned URL upload flow) |
| Payments | Stripe, PayPal |
| Email | SendGrid (with retry logic and email logs) |
| Auth | Clerk (owner), magic-link sessions (buyers) |

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe and/or PayPal credentials
- SendGrid API key
- Cloudflare R2 bucket (for file uploads)

### Environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_...
SENDGRID_API_KEY=SG....
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_PUBLIC_URL=https://...
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
│   │   │   ├── dashboard/   # Dashboard UI cards and settings
│   │   │   └── storefront/  # Public storefront templates and sections
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities, query client, cart context
│   │   └── pages/           # Route pages
│   │       └── dashboard/   # Dashboard pages
│
├── server/                  # Express backend
│   ├── routes.ts            # All API routes
│   ├── storage.ts           # Database access layer (IStorage interface)
│   ├── emails.ts            # Email template helpers
│   ├── sendgridClient.ts    # Email sending with retry logic
│   └── db.ts                # Drizzle database connection
│
└── shared/
    └── schema.ts            # Drizzle schema — single source of truth for all types
```

## Database schema highlights

- `stores` — per-user storefront configuration (theme, sections, branding)
- `products` / `storeProducts` — platform library + per-store listings with custom pricing
- `bundles` / `bundleItems` — grouped product deals
- `orders` / `orderItems` / `downloadTokens` — purchase and delivery flow
- `customers` / `customerSessions` — buyer auth with magic links
- `knowledgeBases` / `kbPages` / `kbBlocks` / `kbPageAttachments` — course builder
- `blogPosts` / `blogBlocks` — storefront blog
- `newsletterSubscribers` / `newsletterCampaigns` / `newsletterCampaignBlocks` — email marketing
- `storeReviews` — verified buyer reviews
- `storeTestimonials` / `storeFaqs` — social proof sections
- `emailLogs` — delivery audit trail

## Storefront themes

Storefronts support multiple built-in themes (Minimal, Silk, Dark, etc.) and a dark/light mode toggle. Each theme exposes a `ThemeColors` object (`c`) used for inline styles throughout storefront components — no CSS class conflicts between tenants.

## License

MIT
