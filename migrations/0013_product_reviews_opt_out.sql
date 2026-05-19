-- Per-product opt-out for reviews. Store-level reviewsEnabled gates the
-- whole feature; this lets an owner turn reviews off on a single product
-- even if their store has reviews on overall.
-- Apply with: psql $DATABASE_URL -f migrations/0013_product_reviews_opt_out.sql

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "reviews_enabled" boolean NOT NULL DEFAULT true;
