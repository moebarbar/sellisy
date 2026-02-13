# DigitalVault

## Overview
Multi-tenant digital product storefront builder. Users sign up, create stores from templates, import products from a platform library, publish them, and accept payments with secure download delivery.

## Recent Changes
- 2026-02-13: Initial MVP build — schema, frontend, backend, seed data

## Project Architecture
- **Stack**: Express + Vite + React (wouter) + Drizzle ORM + PostgreSQL
- **Auth**: Session-based with express-session and password hashing
- **Frontend**: React with shadcn/ui, Tailwind CSS, TanStack Query
- **Routing**: wouter (client), Express routes (server)
- **Database**: PostgreSQL via Drizzle ORM (models: users, stores, products, fileAssets, storeProducts, orders, orderItems, downloadTokens)
- **Templates**: Neon (dark, bold) and Silk (elegant, minimal) for public storefronts

## Key Files
- `shared/schema.ts` — All Drizzle models and Zod schemas
- `server/routes.ts` — All API endpoints
- `server/storage.ts` — Database storage interface
- `server/seed.ts` — Platform product seeding
- `client/src/App.tsx` — Root with routing
- `client/src/pages/` — All page components
- `client/src/components/storefront/` — Neon and Silk templates

## User Preferences
- Clean, minimal code
- Premium UI design
- Multi-tenant safety (queries scoped by ownerId)
