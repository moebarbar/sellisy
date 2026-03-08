# Sellisy

## Overview
Sellisy is a multi-tenant platform for digital entrepreneurs to create, customize, and manage digital product storefronts. It provides tools for product management (importing from a central library or creating new ones), secure payment processing with digital download delivery, content creation (knowledge bases), marketing, and customer management. The platform aims to be a comprehensive solution for selling digital products online.

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)

## Brand & Design System
- **Theme**: Dark-only (no light mode toggle). Background `#050505`, foreground `#FAFAF5`
- **Primary color**: Yellow `#F5E642` (HSL 53 91% 61%) — used for CTAs, active states, accents
- **Fonts**: DM Sans (body/sans), Space Mono (mono/labels), Bebas Neue (logo/display headings)
- **Logo**: "SELL**I**SY" — Bebas Neue, the "I" is yellow (`text-primary`)
- **CSS Variables**: Both `:root` and `.dark` set to identical dark palette values
- **Cards**: Dark bg `#0a0a0a`, subtle borders `rgba(255,255,255,0.08)`
- **Auth page**: Standalone dark splash with floating showcase cards (revenue, products, store, delivery), hero grid background, and animated ambient gradient orbs
- **Landing page ambient effects**: Three slow-drifting gradient orbs (yellow, teal, pink at ~3-5% opacity) in a fixed wrapper add depth to the #050505 background. Pure CSS, GPU-composited.
- **Feature chips**: Glass-morphism `.s-chip` style (dark translucent bg, subtle border, colored dot indicator) replaces the old `.s-sticker` colorful pills. Portal chips hidden below 1280px via `.s-portal-chip`.
- **Product images**: Always `aspect-square` — never change this. Use `<img>` tags with `loading="lazy"` and `decoding="async"`, not CSS `background-image`
- **CTA buttons**: Use `.cta-mono` utility class (Space Mono, uppercase, letter-spacing)
- **No blue primary**: All former blue accents replaced with yellow/primary (except social media platform brand colors)
- **Public API**: `/api/products/library/public` maps `priceCents` to formatted price string, `thumbnailUrl` to `imageUrl`. Filters out products without thumbnails.

## System Architecture
The project utilizes a full-stack JavaScript architecture with an Express.js backend API, a Vite + React (wouter) frontend, and Drizzle ORM for PostgreSQL database interaction.

**Core Features & Design Patterns:**

*   **Authentication**: Local email/password authentication with `bcrypt` and session management.
*   **Multi-tenancy**: Strict data isolation enforced via `ownerId` scoping.
*   **Frontend**: Built with React, `shadcn/ui`, and `Tailwind CSS` for a premium, customizable UI. `TanStack Query` manages server state.
*   **Storefronts**: Unified base template system (Neon, Silk, Aurora, Ember, Frost, Midnight) configurable via visual tokens, featuring announcement bars, social links, rich footers, category navigation, search/sort, and scroll-reveal animations. Includes branded customer portals.
*   **Product Management**: Supports a central Product Library, admin product workflows (bulk upload, promotion, tier classification), user-created custom digital products, and product customization. Supports various digital product types (digital, software, template, ebook, course, graphics) with rich detail pages and "Featured Products" functionality.
*   **E-commerce & Payments**: Integrated with Stripe and PayPal for payment processing. Features a flexible coupon system, SendGrid for transactional emails (including download links), lead magnets, and secure token-based digital product downloads. All checkout-related database writes are transactional.
*   **Content Creation**: Notion-style block editor for Knowledge Bases and blogs with nested pages, various block types, drag-and-drop reordering, multi-block selection, and rich HTML paste parsing.
*   **Marketing Tools**: A 'Marketing Playbook' dashboard section.
*   **Analytics**: Comprehensive per-store analytics dashboard covering revenue, products, customers, coupons, and traffic, powered by real-time `store_events` tracking.
*   **Dashboard**: Feature-rich dashboard with store switching, unified navigation, onboarding checklists, and consistent layout. Product cards maintain a 1:1 aspect ratio.
*   **File Storage**: Dual-backend storage system using Cloudflare R2 as primary and Replit Object Storage as fallback.
*   **Embed Widgets**: Store owners can generate embeddable iframes for products or bundles with live preview and theme toggles.
*   **Custom Domains**: Integration with Cloudflare for SaaS for custom domains with automatic SSL and host-based routing.
*   **SEO**: Implements SEO-friendly product slugs, Open Graph & Twitter Cards, JSON-LD Structured Data, canonical URLs, meta descriptions, `robots.txt`, and a dynamic `sitemap.xml`.
*   **Data Protection System**: Utilizes soft deletes (`deletedAt` timestamp) for products, stores, orders, and other entities. Includes admin-only hard delete safety mechanisms, integrity checks (`runHealthCheck`, `runRepair`), and an Admin Data Health Dashboard.
*   **Security Hardening**: Implements rate limiting, a health check endpoint for DB connectivity, IDOR protection, global CORS, and webhook security warnings.
*   **Marketing Landing Page**: Editorial-style single-page marketing site (`/`) with a dark theme and sticker-culture aesthetic. Features modular components showcasing the platform's capabilities.
*   **Public Products Page**: Full product catalog at `/products` with filtering, search, and a dark theme matching the landing page.

## External Dependencies
*   **Cloudflare R2**: Primary file storage.
*   **Replit Object Storage**: Fallback file storage.
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