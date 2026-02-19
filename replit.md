# DigitalVault

## Overview
DigitalVault is a multi-tenant platform enabling users to create, customize, and manage their own digital product storefronts. It allows them to import products from a central library or create their own, publish them, and accept payments with secure download delivery. The platform also offers tools for content creation (knowledge bases), marketing, and customer management, aiming to provide a comprehensive solution for digital entrepreneurs.

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)

## System Architecture
The project utilizes a **full-stack JavaScript architecture** with **Express** for the backend API, **Vite + React (wouter)** for the frontend, and **Drizzle ORM** interacting with a **PostgreSQL** database.

**Core Features & Design Patterns:**

*   **Authentication**: Replit Auth (OIDC via passport.js) handles user authentication and session management, ensuring secure access with user IDs from `req.user.claims.sub`.
*   **Multi-tenancy**: All data operations (stores, products, orders, etc.) are strictly scoped by `ownerId` to ensure data isolation between different store owners.
*   **Frontend**: Built with React, leveraging `shadcn/ui` for components and `Tailwind CSS` for styling to achieve a premium, customizable UI. `TanStack Query` manages server state.
*   **Storefronts**: Two primary templates, 'Neon' (dark, bold) and 'Silk' (elegant, minimal), are available, fully customizable with store logos, banners, and themes. Each store has a branded customer portal.
*   **Product Management**:
    *   **Library**: A central repository of platform products that store owners can import.
    *   **Custom Products**: Users can create and manage their own digital products, including file uploads (via Object Storage), external URLs, and detailed metadata.
    *   **Customization**: Store owners can override product details (title, description, tags, delivery info) on a per-store basis without altering original library products.
    *   **Product Types**: Products support various types (digital, software, template, ebook, course, graphics) with type-specific delivery instructions and redemption methods.
    *   **Rich Detail Pages**: Software products feature AppSumo-style deal pages with structured content parsing, pricing comparisons, and feature lists.
*   **E-commerce & Payments**:
    *   **Payment Gateways**: Integration with Stripe Checkout and PayPal for secure payment processing. Store owners can select their preferred provider.
    *   **Coupon System**: Flexible coupon codes with percentage or fixed discounts, max uses, and expiration dates.
    *   **Lead Magnets**: Functionality to offer free products in exchange for email sign-ups, integrating with customer account creation and optional upsells.
    *   **Secure Downloads**: Token-based download system for purchased digital products, delivered from Object Storage.
    *   **Transactional Safety**: Checkout processes wrap all database writes in transactions for atomicity.
*   **Content Creation**: A Notion-style block editor for building Knowledge Bases (courses, guides, SOPs) with nested pages, various block types (text, headings, image, video, link), drag-and-drop reordering, and a slash command interface.
*   **Marketing Tools**: A curated 'Marketing Playbook' dashboard section with actionable strategies, progress tracking, and rich content guides.
*   **Dashboard**: A fully store-dedicated dashboard with a store switcher, unified navigation, analytics, order management, and settings.
*   **File Storage**: Integration with Replit Object Storage for handling product images, deliverable files, logos, and banners via presigned URLs.
*   **SEO**: Dynamic SEO meta tags (title, description, Open Graph) are implemented using a `usePageMeta` hook.

## External Dependencies
*   **Replit Auth**: For user authentication and authorization.
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
*   **passport.js**: Middleware for authentication in Node.js applications.