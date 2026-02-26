# Sellisy

## Overview
Sellisy is a multi-tenant platform designed to empower digital entrepreneurs. It enables users to create, customize, and manage their own digital product storefronts, offering tools for product management (importing from a central library or creating new ones), secure payment processing with digital download delivery, content creation (knowledge bases), marketing, and customer management. The platform aims to provide a comprehensive solution for selling digital products online.

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)

## System Architecture
The project employs a **full-stack JavaScript architecture** featuring an **Express.js** backend API, a **Vite + React (wouter)** frontend, and **Drizzle ORM** for interaction with a **PostgreSQL** database.

**Core Features & Design Patterns:**

*   **Authentication**: Local email/password authentication with `bcrypt` hashing and session management. Admin accounts are seeded via environment variables.
*   **Multi-tenancy**: Strict data isolation is enforced for all operations through `ownerId` scoping.
*   **Frontend**: Built with React, utilizing `shadcn/ui` components and `Tailwind CSS` for a premium, customizable UI. `TanStack Query` manages server state.
*   **Storefronts**: Features a unified base template system that allows for rapid creation of visually distinct storefronts (Neon, Silk, Aurora, Ember, Frost, Midnight) by configuring visual tokens. Storefronts include features like announcement bars, social links, rich footers, category navigation, search/sort, and scroll-reveal animations, each with a branded customer portal.
*   **Product Management**:
    *   **Product Library**: A central repository of platform products that store owners can import. Admins can promote user-created products to this library and classify products by `requiredTier` (basic, pro, max).
    *   **Admin Product Workflows**: Includes bulk selection, promotion to library, tier classification, and CSV bulk upload for up to 500 products.
    *   **User Products**: Users can create custom digital products with file uploads or external URLs.
    *   **Product Customization**: Store owners can override product details locally without affecting the original library product.
    *   **Product Types**: Supports various digital product types (digital, software, template, ebook, course, graphics) with type-specific delivery.
    *   **Rich Detail Pages**: Software products feature AppSumo-style deal pages with structured content and pricing comparisons.
*   **E-commerce & Payments**:
    *   **Payment Gateways**: Integration with Stripe and PayPal. Store owners can configure one or both processors simultaneously. When both are configured, customers see a payment method selection modal at checkout to choose between card (Stripe) or PayPal. The checkout API accepts an optional `paymentMethod` field ("stripe" or "paypal"). If no payment keys are configured, checkout returns a clear error instead of falling back to platform keys.
    *   **Coupon System**: Flexible coupon codes with various discount types, usage limits, and expiration dates.
    *   **Email System**: SendGrid integration for transactional emails (welcome, order confirmation, sale notifications, download links) using consistent HTML templates.
    *   **Lead Magnets**: Free product offerings in exchange for email sign-ups, integrating with customer accounts.
    *   **Secure Downloads**: Token-based system for digital product delivery from Object Storage.
    *   **Transactional Safety**: All checkout-related database writes are wrapped in transactions for atomicity.
*   **Content Creation**: A Notion-style block editor for building Knowledge Bases with nested pages, various block types, and drag-and-drop reordering.
*   **Marketing Tools**: A 'Marketing Playbook' dashboard section offering actionable strategies.
*   **Analytics**: A comprehensive per-store analytics dashboard covering revenue, products, customers, coupons, and traffic, powered by real-time data from `store_events` tracking.
*   **Dashboard**: A dedicated, feature-rich dashboard with store switching, unified navigation, onboarding checklists, rotating marketing prompts, inspirational quotes, and consistent layout. Product cards maintain a platform-standard 1:1 aspect ratio.
*   **File Storage**: Utilizes Replit Object Storage for product images, deliverable files, logos, and banners via presigned URLs.
*   **Embed Widgets**: Store owners can generate embeddable iframes for products or bundles on external websites, with live preview and theme toggles.
*   **Custom Domains**: Integration with Cloudflare for SaaS to allow store owners to connect custom domains with automatic SSL provisioning and host-based routing.
*   **SEO**: Dynamic SEO meta tags (title, description, Open Graph) for storefronts, knowledge bases, and product pages, configurable by store owners.
*   **Data Protection System**:
    *   **Soft Deletes**: Products and stores use a `deletedAt` timestamp instead of hard deletes. All queries filter out soft-deleted records (`WHERE deletedAt IS NULL`). Hard delete methods exist but are only used for full cleanup operations.
    *   **Integrity Checks**: `server/integrity.ts` provides `runHealthCheck()` (detect orphaned records, null owners) and `runRepair()` (auto-fix issues). Health check runs automatically on every server startup via `runStartupCheck()`.
    *   **Admin Data Health Dashboard**: `/dashboard/data-health` (admin-only) shows platform health stats, lists soft-deleted products/stores with restore buttons, and provides manual health check and repair controls.
    *   **Admin Endpoints**: `GET /api/admin/health-check`, `POST /api/admin/repair`, `GET /api/admin/deleted-products`, `GET /api/admin/deleted-stores`, `POST /api/admin/restore-product/:id`, `POST /api/admin/restore-store/:id`.
    *   **Protective Guards**: Defense-in-depth ownership verification in `storage.ts` (`deleteProduct`/`deleteStore` accept optional `callerOwnerId`). Promote route has a post-update guard preventing `ownerId` from being nulled. `updateProduct` uses TypeScript `Pick` to restrict updatable fields (excludes `ownerId`). Bulk operations verify product existence before modifying.

## External Dependencies
*   **Replit Object Storage**: For asset and file storage.
*   **PostgreSQL**: Primary database.
*   **Stripe**: Payment processing.
*   **PayPal**: Payment processing.
*   **Vite**: Frontend build tool.
*   **React**: Frontend library.
*   **Express**: Backend web framework.
*   **Drizzle ORM**: TypeScript ORM.
*   **wouter**: Client-side router.
*   **shadcn/ui**: UI component library.
*   **Tailwind CSS**: CSS framework.
*   **TanStack Query**: Data fetching and caching.
*   **bcryptjs**: Password hashing.
*   **Cloudflare for SaaS**: Custom domain management.
*   **SendGrid**: Email sending service.