# DigitalVault

## Overview
Multi-tenant digital product storefront builder. Users sign up, create stores from templates, import products from a platform library, publish them, and accept payments with secure download delivery.

## Recent Changes
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
- **Database**: PostgreSQL via Drizzle ORM (models: users, sessions, stores, products, fileAssets, storeProducts, orders, orderItems, downloadTokens, bundles, bundleItems, coupons)
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

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)
