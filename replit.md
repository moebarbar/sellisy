# Sellisy

## Overview
Sellisy is a multi-tenant platform enabling users to create, customize, and manage their own digital product storefronts. It allows them to import products from a central library or create their own, publish them, and accept payments with secure download delivery. The platform also offers tools for content creation (knowledge bases), marketing, and customer management, aiming to provide a comprehensive solution for digital entrepreneurs.

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)

## System Architecture
The project utilizes a **full-stack JavaScript architecture** with **Express** for the backend API, **Vite + React (wouter)** for the frontend, and **Drizzle ORM** interacting with a **PostgreSQL** database.

**Core Features & Design Patterns:**

*   **Authentication**: Local email/password authentication with bcrypt hashing and session management via `connect-pg-simple`. Users register/login at `/auth`. Landing page CTAs link to `/auth?mode=signup` to default new users to the signup form. Admin account seeded via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars; password re-synced from env var on every startup. User IDs read from `req.session.userId`.
*   **Multi-tenancy**: All data operations (stores, products, orders, etc.) are strictly scoped by `ownerId` to ensure data isolation between different store owners.
*   **Frontend**: Built with React, leveraging `shadcn/ui` for components and `Tailwind CSS` for styling to achieve a premium, customizable UI. `TanStack Query` manages server state.
*   **Storefronts**: Six templates available: **Neon** (bold, cyberpunk), **Silk** (elegant, minimal), **Aurora** (vibrant gradients, glassmorphism), **Ember** (warm, earthy, bold), **Frost** (clean, icy blue), and **Midnight** (sleek dark, purple accents). Neon and Silk exist as legacy standalone components; all six have unified theme configs in `client/src/components/storefront/themes/`. The **unified base template system** (`BaseTemplate` + `StorefrontTheme` configs) enables rapid creation of new templates by defining only visual tokens (colors, fonts, layout, effects). Stores support announcement bars, social media links, rich footers, category navigation, search/sort, and scroll-reveal animations. Each store has a branded customer portal.
*   **Product Management**:
    *   **Library**: A central repository of platform products that store owners can import. Admin has bulk selection (Select All + per-card checkboxes) with a floating action bar for bulk delete, set active, and set draft.
    *   **Admin Product Flow**: Products created by admin users are created as regular `source: "USER"` products. Admin manually promotes them to the Library via the "Promote to Library" button on My Products when ready.
    *   **Product Tier Classification**: Admin-only feature. Each product has a `requiredTier` field (`basic`, `pro`, `max`). Admin sets the tier via a dropdown in the product creation/edit form. The Library page shows tier badges and locks products behind the user's subscription tier. Non-admin users always create `basic` tier products.
    *   **CSV Bulk Upload**: Admin-only "Bulk Upload CSV" feature on My Products page. Download a CSV template, fill in product data, upload and preview rows, then import up to 500 products per batch via `/api/products/bulk-import`.
    *   **Bulk Actions API**: Admin-only endpoints: `DELETE /api/products/bulk` (cascading delete via storage layer), `PATCH /api/products/bulk-status` (batch status toggle).
    *   **Custom Products**: Users can create and manage their own digital products, including file uploads (via Object Storage), external URLs, and detailed metadata.
    *   **Customization**: Store owners can override product details (title, description, tags, delivery info) on a per-store basis without altering original library products.
    *   **Product Types**: Products support various types (digital, software, template, ebook, course, graphics) with type-specific delivery instructions and redemption methods.
    *   **Rich Detail Pages**: Software products feature AppSumo-style deal pages with structured content parsing, pricing comparisons, and feature lists.
*   **E-commerce & Payments**:
    *   **Payment Gateways**: Per-store Stripe and PayPal integration. Each store owner enters their own Stripe API keys (publishable + secret) or PayPal credentials in store settings. Payments go directly to the store owner's account. Server-side key validation enforces `pk_`/`sk_` prefixes. Secret keys are masked (`***configured***`) in API responses and never exposed to the frontend. Checkout creates Stripe sessions using the store's own keys, falling back to platform-level Stripe if no store keys are configured. Stripe `customer_email` is pre-filled in checkout sessions when available. `stripePublishableKey` and `stripeSecretKey` fields on `stores` table.
    *   **Coupon System**: Flexible coupon codes with percentage or fixed discounts, max uses, and expiration dates. Coupon usage is incremented in both the checkout success endpoint and the Stripe webhook handler (idempotent via order status checks).
    *   **Email System**: SendGrid integration sends: welcome email on registration, order confirmation to buyer, new sale notification to store owner, lead magnet delivery email, and download link resend. All emails use consistent branded HTML templates via `server/emails.ts`.
    *   **Lead Magnets**: Functionality to offer free products in exchange for email sign-ups, integrating with customer account creation and optional upsells.
    *   **Secure Downloads**: Token-based download system for purchased digital products, delivered from Object Storage.
    *   **Transactional Safety**: Checkout processes wrap all database writes in transactions for atomicity.
*   **Content Creation**: A Notion-style block editor for building Knowledge Bases (courses, guides, SOPs) with nested pages, various block types (text, headings, image, video, link), drag-and-drop reordering, and a slash command interface.
*   **Marketing Tools**: A curated 'Marketing Playbook' dashboard section with actionable strategies, progress tracking, and rich content guides.
*   **Analytics**: Deep per-store analytics dashboard at `/dashboard/analytics` with 5 tabs (Revenue, Products, Customers, Coupons, Traffic). Uses real data from orders, order items, coupons, customers, and a `store_events` tracking table. Public storefront pages fire lightweight tracking events (page_view, product_view, bundle_view, checkout_start) via `POST /api/store-events`. Backend aggregation in `server/analytics.ts` uses SQL group-by queries. Frontend tracking utility in `client/src/lib/tracking.ts` uses `navigator.sendBeacon` for non-blocking event capture.
*   **Dashboard**: A fully store-dedicated dashboard with a store switcher, unified navigation, analytics, order management, and settings. Overview page features:
    *   **Onboarding**: When no stores exist, shows an inline store creation form (name, slug, template picker) directly on the overview page.
    *   **Getting Started Checklist**: A 6-step progress-tracked checklist guides users through: create store, add products, publish, customize, connect payments, share. Stays visible until all steps complete and user explicitly dismisses. Auto-updates from real data. Dismissible via localStorage.
    *   **What's Next? Section**: Rotating marketing action prompts shown as 3 colorful gradient cards on each page load. Pool of 15 prompts linking to marketing strategies, knowledge base, settings, analytics, and coupons. Includes "Copy Link" for store sharing and "See all strategies" link to marketing playbook.
    *   **Motivational Quotes**: 24 rotating entrepreneurship quotes displayed in the welcome banner.
    *   **Quick Import**: Library product cards support one-click import (no confirmation dialog). Shows spinner during import, updates to "Imported" badge on success.
    *   **Compact Cards**: Dashboard product cards (library, my-products) use `aspect-[4/3]` images and `xl:grid-cols-4` grids. Storefront cards remain `aspect-square`.
    *   **Store Product Management**: Products page shows imported products with publish toggle, edit, embed, expand, and remove (delete) buttons. Remove confirms via browser dialog before deleting.
    *   **Consistent Layout**: All dashboard pages use `p-6 space-y-6` full-width containers — no `max-w-*` constraints on content pages. Only centered forms (e.g., inline store creation) use `max-w-2xl mx-auto`.
*   **File Storage**: Integration with Replit Object Storage for handling product images, deliverable files, logos, and banners via presigned URLs.
*   **Embed Widgets**: Store owners can embed any published product or bundle on external websites via iframe. Dashboard provides a code generator with live preview, light/dark theme toggle, and copy-to-clipboard. Embed endpoints: `GET /api/embed/:slug/product/:productId` and `/api/embed/:slug/bundle/:bundleId`. Widget pages at `/embed/:slug/product/:productId` and `/embed/:slug/bundle/:bundleId` render compact, styled cards with "Buy Now" links back to the storefront.
*   **Custom Domains**: Store owners can connect their own domains to their storefronts via **Cloudflare for SaaS** (Custom Hostnames).
    *   **Connect Your Domain**: Users enter their domain, add a CNAME record pointing to `customers.sellisy.com`, and Cloudflare provisions SSL automatically. No domain purchasing — connect-only flow.
    *   **Domain Verification**: Calls Cloudflare API to check custom hostname status. Status progression: `pending_dns` → `active`. SSL provisioned automatically by Cloudflare.
    *   **Host-Based Routing**: Middleware resolves custom domains to their storefronts automatically (rewrites root domain requests to `/s/{slug}`).
    *   **Schema**: `customDomain`, `domainStatus`, `domainSource`, `domainVerifiedAt`, `cloudflareHostnameId` fields on `stores` table.
    *   **API**: `server/cloudflareClient.ts` wraps Cloudflare Custom Hostnames API (create, get, delete, list). Domain routes at `/api/domains/*`.
    *   **UI**: `DomainSettings` component in `client/src/components/dashboard/domain-settings.tsx`, integrated into store settings page. Single connect flow with DNS instructions always pointing to `customers.sellisy.com`.
*   **SEO**: Dynamic SEO meta tags (title, description, Open Graph) are implemented using a `usePageMeta` hook. Storefront pages show the store's SEO title (or store name) in the browser tab — no platform branding. Custom `faviconUrl` per store, falling back to store logo. Store owners set SEO title, meta description, and favicon from dashboard settings.

## External Dependencies
*   **Replit Object Storage**: For storing product images, deliverable files, store logos, and banners.
*   **PostgreSQL**: The primary database for all application data, managed via Drizzle ORM.
*   **Stripe**: For payment processing via Stripe Checkout Sessions and webhooks.
*   **PayPal**: For payment processing via PayPal API.
*   **Vite**: Frontend build tool.
*   **React**: Frontend library.
*   **Express**: Backend web framework.
*   **Drizzle ORM**: TypeScript ORM for PostgreSQL.
*   **wouter**: Client-side router for React.
*   **shadcn/ui**: UI component library.
*   **Tailwind CSS**: Utility-first CSS framework.
*   **TanStack Query**: Data fetching and caching library for React.
*   **bcryptjs**: Password hashing for local authentication.
*   **Cloudflare for SaaS**: Custom domain provisioning via Cloudflare Custom Hostnames API (via `server/cloudflareClient.ts`). Env vars: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`.

## Integration Notes
*   **Stripe**: Connected via Replit Stripe connector. Credentials are fetched from the Replit connection API (`server/stripeClient.ts`). Functions are async. Replit handles sandbox/live key management and deployment transitions automatically. Webhook handler in `server/webhookHandlers.ts` processes `checkout.session.completed` events, creates download tokens, updates buyer email from Stripe session, increments coupon usage, and triggers order emails.
*   **SendGrid**: Connected via Replit SendGrid connector. Client in `server/sendgridClient.ts`. Use `sendEmail(to, subject, html)` for transactional emails. From-email configured in the connector. Includes retry logic (3 attempts with exponential backoff) and email logging.
*   **Error Handling**: `throwIfResNotOk` in `client/src/lib/queryClient.ts` parses JSON error responses to extract clean `message` fields — no raw JSON in user-facing error toasts.

## Template Standards
*   **Color Tokens**: All storefront templates use a centralized color object (`c`) that adapts to light/dark mode. Store `accentColor` (6-digit hex from color picker) is respected across storefronts and detail pages.
*   **Mode-Aware Badges**: Discount and savings badges must use `isDark` ternary for background, border, and text color — never hardcode dark-mode-only values.
*   **Bundle Thumbnails**: Both Neon and Silk templates render bundle thumbnail images when available.
*   **Protected Images**: All storefront images use `<ProtectedImage>` component, gated by `store.allowImageDownload`.