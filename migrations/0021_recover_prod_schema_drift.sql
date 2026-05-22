-- Defensive recovery migration. Three known prod drifts surfaced during the
-- audit deploy:
--
-- 1. `products.cert_accent_color` and `products.cert_logo_url` are referenced
--    by the code (migration 0016) but missing in prod — drizzle-kit push
--    apparently never applied them.
-- 2. `webhook_events` table is referenced by the Stripe/PayPal webhook dedup
--    and the hourly cleanup setInterval, but the table only ever existed in
--    schema.ts — no numbered migration created it.
-- 3. `email_suppression` same story as (2), and may additionally exist in a
--    broken state on prod if drizzle-kit push silently renamed `store_domains`
--    to `email_suppression` (the columns wouldn't match — store_domains has
--    `registrar`, `domain`, `expiration_date`, etc.).
--
-- This migration is fully idempotent (CREATE/ALTER ... IF NOT EXISTS, DO-blocks
-- around enum creation, and a column-existence check before dropping any
-- bogus email_suppression table). Safe to run multiple times.
--
-- Apply with: psql $DATABASE_URL -f migrations/0021_recover_prod_schema_drift.sql

-- ─── (1) cert designer columns on products ──────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cert_accent_color varchar(7),
  ADD COLUMN IF NOT EXISTS cert_logo_url varchar(500);

-- ─── (2) Required enums for webhook_events + email_suppression ──────────
DO $$ BEGIN
  CREATE TYPE "email_suppression_reason" AS ENUM ('bounce', 'complaint', 'unsubscribe', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "webhook_provider" AS ENUM ('stripe', 'paypal', 'sendgrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── (3) Drop email_suppression IF it's a bogus rename of store_domains ─
-- Detection: the correct email_suppression has an `email` column. If the
-- table exists without one, it's the wrong schema (likely a rename leftover).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_suppression'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'email_suppression' AND column_name = 'email'
  ) THEN
    RAISE NOTICE 'Dropping email_suppression — wrong schema, likely a drizzle-kit rename of store_domains';
    DROP TABLE email_suppression;
  END IF;
END $$;

-- ─── (4) Create the two missing tables with the correct schemas ─────────
CREATE TABLE IF NOT EXISTS "email_suppression" (
  "email" varchar(255) PRIMARY KEY NOT NULL,
  "reason" "email_suppression_reason" NOT NULL,
  "detail" text,
  "suppressed_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" varchar(64) PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "provider" "webhook_provider" NOT NULL,
  "event_id" varchar(255) NOT NULL,
  "event_type" text,
  "processed_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_event_unique"
  ON "webhook_events" ("provider", "event_id");

CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx"
  ON "webhook_events" ("processed_at");
