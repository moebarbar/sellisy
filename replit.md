# DigitalVault

## Overview
Multi-tenant digital product storefront builder. Users sign up, create stores from templates, import products from a platform library, publish them, and accept payments with secure download delivery.

## Recent Changes
- 2026-02-13: Added custom product creation — My Products page with file upload (Object Storage), thumbnail upload, external URL support, CRUD API, nav integration
- 2026-02-13: Integrated Replit Object Storage for file uploads (presigned URL flow via GCS)
- 2026-02-13: Added fileUrl field to products schema for downloadable files
- 2026-02-13: Added store customization (tagline, logoUrl, accentColor, heroBannerUrl) — settings dialog & template integration
- 2026-02-13: Built coupon system — CRUD API, validation, checkout integration with percent/fixed discounts, max uses, expiration
- 2026-02-13: Created orders management dashboard with revenue metrics and detailed order list
- 2026-02-13: Added analytics dashboard — total revenue/orders/products/stores, 14-day revenue chart, top 5 products
- 2026-02-13: Store detail page now has tabbed interface for products/bundles/coupons management
- 2026-02-13: Checkout route supports couponCode and buyerEmail fields
- 2026-02-13: Major template upgrade — Neon gets animated grid, scanlines, holographic cards, particle effects; Silk gets animated gold shimmer, refined cards
- 2026-02-13: Added visitor light/dark mode toggle to Neon template, Silk template, product detail, and bundle detail pages (localStorage persisted)
- 2026-02-13: Dashboard already has light/dark toggle via ThemeProvider
- 2026-02-13: Added beautiful standalone product detail pages at /s/:slug/product/:productId
- 2026-02-13: Added bundle system — bundles table, bundleItems, CRUD API, bundle detail page at /s/:slug/bundle/:bundleId
- 2026-02-13: Added originalPriceCents to products for discount display (strikethrough pricing)
- 2026-02-13: Updated Neon/Silk templates to link product cards to detail pages and show bundles section
- 2026-02-13: Added bundle management in store detail dashboard (create/publish/delete bundles)
- 2026-02-13: Migrated auth from custom username/password to Replit Auth (OIDC)
- 2026-02-13: Added product categories (templates, graphics, ebooks, tools) with filtering UI
- 2026-02-13: Added import tracking — "Imported" badge and disabled button on already-imported library products
- 2026-02-13: Square aspect-ratio product thumbnails in library
- 2026-02-13: Initial MVP build — schema, frontend, backend, seed data

## Project Architecture
- **Stack**: Express + Vite + React (wouter) + Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OIDC via passport.js, sessions in PostgreSQL). Login at /api/login, logout at /api/logout, user at /api/auth/user. User ID from req.user.claims.sub.
- **Frontend**: React with shadcn/ui, Tailwind CSS, TanStack Query
- **Routing**: wouter (client), Express routes (server)
- **Database**: PostgreSQL via Drizzle ORM (models: users, sessions, stores, products, fileAssets, storeProducts, orders, orderItems, downloadTokens, bundles, bundleItems, coupons)
- **Templates**: Neon (dark, bold) and Silk (elegant, minimal) for public storefronts — now use store.tagline and store.logoUrl
- **Standalone Pages**: Product detail (/s/:slug/product/:id) and bundle detail (/s/:slug/bundle/:id) — premium dark landing pages for social sharing
- **Coupons**: PERCENT or FIXED discount codes per store, with max uses, expiration, active toggle
- **Analytics**: /api/analytics aggregates revenue, orders, products across all user stores

## Key Files
- `shared/schema.ts` — All Drizzle models and Zod schemas (re-exports from models/auth)
- `shared/models/auth.ts` — Replit Auth users and sessions tables
- `server/routes.ts` — All API endpoints (uses isAuthenticated middleware)
- `server/storage.ts` — Database storage interface
- `server/seed.ts` — Platform product seeding (6 products with categories)
- `server/replit_integrations/auth/` — Replit Auth integration (DO NOT MODIFY)
- `client/src/hooks/use-auth.ts` — React auth hook (from Replit Auth integration)
- `client/src/lib/auth.tsx` — Re-export of useAuth for backward compatibility
- `client/src/App.tsx` — Root with routing
- `client/src/components/dashboard/layout.tsx` — Dashboard layout with auth guard
- `client/src/components/dashboard/sidebar.tsx` — Sidebar with user avatar/name, My Products nav item
- `server/replit_integrations/object_storage/` — Object Storage integration (DO NOT MODIFY core files)
- `client/src/hooks/use-upload.ts` — React upload hook (presigned URL flow)
- `client/src/pages/dashboard/my-products.tsx` — My Products CRUD page with file upload
- `client/src/pages/dashboard/overview.tsx` — Analytics dashboard
- `client/src/pages/dashboard/orders.tsx` — Order management page
- `client/src/pages/dashboard/store-detail.tsx` — Store management with products/bundles/coupons tabs
- `client/src/pages/` — All page components
- `client/src/components/storefront/` — Neon and Silk templates

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)
