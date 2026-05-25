-- Pay-what-you-want pricing on products. When pwyw_enabled is true, the
-- buyer-facing product page renders a price input instead of a fixed price
-- pill. The buyer enters any amount >= pwyw_min_cents (which can be 0 for
-- true "tip jar" PWYW). products.price_cents stays as the *suggested* price.
--
-- Both columns nullable / default-safe so existing products are unaffected.
--
-- Apply with: psql $DATABASE_URL -f migrations/0022_pay_what_you_want.sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pwyw_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pwyw_min_cents integer NOT NULL DEFAULT 0;
