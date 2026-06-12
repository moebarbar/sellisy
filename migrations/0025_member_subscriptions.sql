-- Memberships & Subscriptions (Phase 4): recurring products on the seller's
-- own Stripe keys.
--
-- Apply manually BEFORE deploying code that references these:
--   psql $DATABASE_URL -f migrations/0025_member_subscriptions.sql
-- (or via the Node pg client as done for 0024 — both ALTERs are idempotent)

DO $$ BEGIN
  CREATE TYPE billing_interval AS ENUM ('month', 'year');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS billing_interval billing_interval;

CREATE TABLE IF NOT EXISTS member_subscriptions (
  id varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id varchar(64) NOT NULL,
  product_id varchar(64) NOT NULL,
  order_id varchar(64) NOT NULL,
  customer_id varchar(64),
  buyer_email text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  status member_subscription_status NOT NULL DEFAULT 'active',
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_end timestamp,
  last_verified_at timestamp NOT NULL DEFAULT now(),
  canceled_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_subscriptions_store_status_idx ON member_subscriptions (store_id, status);
CREATE INDEX IF NOT EXISTS member_subscriptions_customer_idx ON member_subscriptions (customer_id);
CREATE INDEX IF NOT EXISTS member_subscriptions_order_idx ON member_subscriptions (order_id);
CREATE INDEX IF NOT EXISTS member_subscriptions_period_end_idx ON member_subscriptions (current_period_end);
