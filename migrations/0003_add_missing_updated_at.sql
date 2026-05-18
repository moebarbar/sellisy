-- Pre-existing schema drift fix: production DB was missing `updated_at`
-- columns on 11 tables that the Drizzle schema declared. Surfaced when the
-- deploy of commit 8b95226 booted and the app crashed querying products.updated_at.
-- All ADDs use NOT NULL DEFAULT NOW() so existing rows backfill cleanly.
-- Apply with: psql $DATABASE_URL -f migrations/0003_add_missing_updated_at.sql

ALTER TABLE "stores"                   ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "products"                 ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "orders"                   ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "bundles"                  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "coupons"                  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "customers"                ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "knowledge_bases"          ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "blog_posts"               ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "newsletter_campaigns"     ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "store_strategy_progress"  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "users"                    ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
