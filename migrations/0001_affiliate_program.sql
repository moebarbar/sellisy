-- Affiliate program: 3 enums, 4 new tables, 5 new columns on stores.
-- Apply with: psql $DATABASE_URL -f migrations/0001_affiliate_program.sql
-- (Or `npm run db:push` if you trust Drizzle's diff.)

-- ─── Enums ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."affiliate_status" AS ENUM ('pending', 'active', 'paused', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."commission_status" AS ENUM ('pending', 'approved', 'paid', 'void');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."payout_status" AS ENUM ('processing', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── stores: per-store affiliate program settings ─────────────────────

ALTER TABLE "stores"
  ADD COLUMN IF NOT EXISTS "affiliate_program_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "affiliate_default_rate_bps" integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS "affiliate_cookie_days" integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "affiliate_min_payout_cents" integer NOT NULL DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS "affiliate_terms_html" text;

-- ─── affiliates: a person who promotes a specific store ───────────────

CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(64) NOT NULL,
  "store_id" varchar(64) NOT NULL,
  "code" text NOT NULL,
  "status" "affiliate_status" NOT NULL DEFAULT 'active',
  "commission_rate_bps" integer NOT NULL DEFAULT 2000,
  "payout_email" text,
  "notes" text,
  "deleted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Partial unique indexes so soft-deleted rows don't block re-creation
-- (an owner can soft-delete affiliate "jane" and create a new one with the same code).
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_store_code_unique" ON "affiliates" ("store_id", "code") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_store_user_unique" ON "affiliates" ("store_id", "user_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "affiliates_store_deleted_idx" ON "affiliates" ("store_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "affiliates_user_idx" ON "affiliates" ("user_id");

-- ─── affiliate_clicks: lightweight clickstream (analytics + dedup) ────

CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "affiliate_id" varchar(64) NOT NULL,
  "store_id" varchar(64) NOT NULL,
  "landing_path" text,
  "referrer" text,
  "user_agent_hash" varchar(64),
  "ip_hash" varchar(64),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "affiliate_clicks_affiliate_idx" ON "affiliate_clicks" ("affiliate_id", "created_at");
CREATE INDEX IF NOT EXISTS "affiliate_clicks_store_idx" ON "affiliate_clicks" ("store_id", "created_at");

-- ─── affiliate_commissions: the money-truth table ─────────────────────

CREATE TABLE IF NOT EXISTS "affiliate_commissions" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "affiliate_id" varchar(64) NOT NULL,
  "store_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL UNIQUE,
  "subtotal_cents" integer NOT NULL,
  "commission_rate_bps" integer NOT NULL,
  "commission_cents" integer NOT NULL,
  "status" "commission_status" NOT NULL DEFAULT 'pending',
  "payout_id" varchar(64),
  "locked_until" timestamp NOT NULL,
  "void_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "affiliate_commissions_affiliate_status_idx" ON "affiliate_commissions" ("affiliate_id", "status");
CREATE INDEX IF NOT EXISTS "affiliate_commissions_store_status_idx" ON "affiliate_commissions" ("store_id", "status");

-- ─── affiliate_payouts: a batch of commissions paid in one go ─────────

CREATE TABLE IF NOT EXISTS "affiliate_payouts" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "affiliate_id" varchar(64) NOT NULL,
  "store_id" varchar(64) NOT NULL,
  "total_cents" integer NOT NULL,
  "method" text NOT NULL DEFAULT 'manual_paypal',
  "external_ref" text,
  "status" "payout_status" NOT NULL DEFAULT 'processing',
  "paid_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "affiliate_payouts_affiliate_idx" ON "affiliate_payouts" ("affiliate_id", "created_at");
CREATE INDEX IF NOT EXISTS "affiliate_payouts_store_status_idx" ON "affiliate_payouts" ("store_id", "status");
