-- Stripe Tax: per-store flag. When enabled, the checkout session is built
-- with automatic_tax + tax_code + tax_behavior so Stripe computes VAT/sales
-- tax on behalf of the merchant.
-- Apply with: psql $DATABASE_URL -f migrations/0004_stripe_tax.sql

ALTER TABLE "stores"
  ADD COLUMN IF NOT EXISTS "stripe_tax_enabled" boolean NOT NULL DEFAULT false;
