-- Attach affiliate attribution snapshot to each order at checkout time.
-- Stored on the order so commission writes work for both Stripe and PayPal,
-- without relying on payment-provider metadata being preserved.
-- Apply with: psql $DATABASE_URL -f migrations/0002_affiliate_order_attribution.sql

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "affiliate_id" varchar(64),
  ADD COLUMN IF NOT EXISTS "affiliate_rate_bps" integer;

CREATE INDEX IF NOT EXISTS "orders_affiliate_idx" ON "orders" ("affiliate_id");
