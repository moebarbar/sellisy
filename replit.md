# DigitalVault

## Overview
Multi-tenant digital product storefront builder. Users sign up, create stores from templates, import products from a platform library, publish them, and accept payments with secure download delivery.

## Recent Changes
- 2026-02-17: **Store-level product customization** — Store owners can override product title, description, tags, access URL, redemption code, and delivery instructions per-store via Edit Product dialog on store products page. Override columns (customTitle, customDescription, customTags, customAccessUrl, customRedemptionCode, customDeliveryInstructions) on storeProducts table. Overrides flow through storefront display, checkout, customer portal order details, and claim success pages. Original product data unchanged. Library renamed to "Products Library" with dynamic category filters derived from actual product data.
- 2026-02-17: **Product completeness + tags** — Added `tags` text array column to products. Updated Add Product form with tags input (comma-separated), reorganized delivery section with "Customer Delivery" header and helper text, delivery instructions now uses textarea. All platform products updated with MSRP, tags, access URLs, and delivery instructions. Product cards show up to 2 tags. Product detail dialog shows full tags and delivery info. Customer-facing product detail page displays tags as styled badges. Storage updateProduct expanded to handle all delivery/tag fields.
- 2026-02-16: **AppSumo-style software deal pages** — Software-type products get rich product detail pages with deal badges, pricing comparison card (Regular MSRP vs Lifetime Deal), "What's Included" feature checklist, "Why This Deal" highlights, "Perfect For" use cases, and "How to Redeem" step-by-step guide. `parseSections()` parses structured descriptions into sections using flexible regex heading patterns (supports markdown headings and variants like Features/Benefits/Key Features). Pricing cadence auto-detected from description text (/month vs /year). First example product: Analyio Max Plan ($69 lifetime vs $828/yr). Non-software products retain original layout.
- 2026-02-16: **Product type templates + type-specific delivery** — Products have productType enum (digital, software, template, ebook, course, graphics) with delivery metadata fields (deliveryInstructions, accessUrl, redemptionCode). Store portal order detail shows type-specific delivery cards: redemption codes with copy button (software/AppSumo style), access URLs with contextual labels (template/course), step-by-step instructions, type-aware download labels. Save as PDF button generates printable delivery receipt. XSS-safe HTML escaping on PDF output.
- 2026-02-15: **Lead magnet system** — Store owners mark free products as lead magnets (isLeadMagnet on storeProducts), visitors enter email to claim, creates customer account + $0 order + download token + session cookie. Upsell product/bundle shown on claim success page. "Get it Free" button on storefront templates with email capture modal. Dashboard settings panel for lead magnet config.
- 2026-02-15: **Store-branded customer portals** — Each store gets its own branded portal at `/s/:slug/portal` matching the store's template (Neon/Silk). Customers log in via magic link, see only that store's purchases, download files. Portal link (User icon) added to storefront headers. Checkout success points to store portal. Global "My Purchases" removed from landing page. Old `/account/*` routes kept as fallback.
- 2026-02-14: **Real file downloads** — `/api/download/:token` serves files from Object Storage; single-file orders redirect, multi-file orders return JSON list with URLs
- 2026-02-14: **Public store discovery** — `/api/discover/stores` endpoint and landing page section showcasing live stores with product counts
- 2026-02-14: **SEO meta tags** — `usePageMeta` hook for dynamic per-page title, description, and Open Graph tags on storefront, product, and bundle pages
- 2026-02-14: **Coupon code input** — product and bundle detail pages have coupon code field with validation errors and checkout integration
- 2026-02-13: **Stripe Checkout integration** — real payment processing via Stripe Checkout Sessions. `/api/checkout` creates Stripe sessions with `price_data` for dynamic marketplace products. Webhook at `/api/stripe/webhook` handles `checkout.session.completed` events. Free orders (100% coupon) bypass Stripe. Success page polls for pending orders. Payments card in Store Settings shows Stripe connection status (sandbox/live).
- 2026-02-13: **Logo & Hero Banner upload** — Store Settings branding section supports file upload (Object Storage) and URL paste for logo and hero banner, with preview/replace/remove; both Neon and Silk templates render them cleanly
- 2026-02-13: **Checkout transaction safety** — all checkout writes (order, items, download token, coupon increment) wrapped in db.transaction with tx client for atomicity
- 2026-02-13: Added multi-image support for products — productImages table, multi-upload form, image gallery on detail pages, square format (512/1024px)
- 2026-02-13: **Dashboard fully store-dedicated** — store switcher in header bar, unified nav (no Store/Global split), all pages reference active store, real analytics from DB
- 2026-02-13: Added dedicated Store Settings page with general/branding config and store deletion
- 2026-02-13: Removed old stores list and store-detail pages; store switcher moved to top header bar
- 2026-02-13: Added custom product creation — My Products page with file upload (Object Storage), thumbnail upload, external URL support, CRUD API, nav integration
- 2026-02-13: Integrated Replit Object Storage for file uploads (presigned URL flow via GCS)
- 2026-02-13: Built coupon system — CRUD API, validation, checkout integration with percent/fixed discounts, max uses, expiration
- 2026-02-13: Created orders management dashboard with revenue metrics and detailed order list
- 2026-02-13: Added analytics dashboard — total revenue/orders/products, 14-day revenue chart, top 5 products (per-store filtering)
- 2026-02-13: Major template upgrade — Neon gets animated grid, scanlines, holographic cards, particle effects; Silk gets animated gold shimmer, refined cards
- 2026-02-13: Added visitor light/dark mode toggle to storefront templates
- 2026-02-13: Added standalone product detail pages at /s/:slug/product/:productId and bundle detail at /s/:slug/bundle/:bundleId
- 2026-02-13: Added bundle system — bundles table, bundleItems, CRUD API
- 2026-02-13: Migrated auth from custom username/password to Replit Auth (OIDC)
- 2026-02-13: Added product categories with filtering UI and import tracking
- 2026-02-13: Initial MVP build — schema, frontend, backend, seed data

## Project Architecture
- **Stack**: Express + Vite + React (wouter) + Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OIDC via passport.js, sessions in PostgreSQL). Login at /api/login, logout at /api/logout, user at /api/auth/user. User ID from req.user.claims.sub.
- **Frontend**: React with shadcn/ui, Tailwind CSS, TanStack Query
- **Routing**: wouter (client), Express routes (server)
- **Database**: PostgreSQL via Drizzle ORM (models: users, sessions, stores, products, productImages, fileAssets, storeProducts, orders, orderItems, downloadTokens, bundles, bundleItems, coupons)
- **Product Images**: Multiple images per product via productImages table (square, 512px/1024px). Product.thumbnailUrl auto-synced to primary image. Gallery on product detail page with carousel + thumbnail strip
- **Templates**: Neon (dark, bold) and Silk (elegant, minimal) for public storefronts — now use store.tagline and store.logoUrl
- **Standalone Pages**: Product detail (/s/:slug/product/:id) and bundle detail (/s/:slug/bundle/:id) — premium dark landing pages for social sharing
- **Coupons**: PERCENT or FIXED discount codes per store, with max uses, expiration, active toggle
- **Dashboard**: Store-dedicated — StoreContext manages active store, header bar has store switcher dropdown, all pages filter by activeStoreId
- **Analytics**: /api/analytics supports optional storeId query param for per-store filtering; pulls real order/product data from DB
- **Navigation**: Unified sidebar (Overview, Products, My Products, Library, Bundles, Coupons, Orders, Settings) — no Store/Global split

## Key Files
- `shared/schema.ts` — All Drizzle models and Zod schemas (re-exports from models/auth)
- `shared/models/auth.ts` — Replit Auth users and sessions tables
- `server/routes.ts` — All API endpoints (uses isAuthenticated middleware)
- `server/storage.ts` — Database storage interface
- `server/seed.ts` — Platform product seeding (6 products with categories)
- `server/replit_integrations/auth/` — Replit Auth integration (DO NOT MODIFY)
- `client/src/hooks/use-auth.ts` — React auth hook (from Replit Auth integration)
- `client/src/lib/auth.tsx` — Re-export of useAuth for backward compatibility
- `client/src/lib/store-context.tsx` — StoreContext with activeStore/activeStoreId, localStorage persistence
- `client/src/App.tsx` — Root with routing
- `client/src/components/dashboard/layout.tsx` — Dashboard layout with auth guard, wraps StoreProvider
- `client/src/components/dashboard/sidebar.tsx` — Sidebar with store selector dropdown, nav items, user info
- `server/replit_integrations/object_storage/` — Object Storage integration (DO NOT MODIFY core files)
- `client/src/hooks/use-upload.ts` — React upload hook (presigned URL flow)
- `client/src/pages/dashboard/overview.tsx` — Store analytics dashboard
- `client/src/pages/dashboard/store-products.tsx` — Store products management
- `client/src/pages/dashboard/bundles.tsx` — Bundle management
- `client/src/pages/dashboard/coupons.tsx` — Coupon management
- `client/src/pages/dashboard/orders.tsx` — Order management page
- `client/src/pages/dashboard/library.tsx` — Platform product library with import
- `client/src/pages/dashboard/store-settings.tsx` — Store settings (general, branding, delete)
- `client/src/pages/dashboard/my-products.tsx` — My Products CRUD page with file upload
- `client/src/components/storefront/` — Neon and Silk templates
- `client/src/components/storefront/lead-magnet-modal.tsx` — Shared email capture modal for lead magnets
- `client/src/pages/claim-success.tsx` — Post-claim success page with download and upsell

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)
