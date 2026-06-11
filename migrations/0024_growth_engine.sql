-- Growth Engine (Phase 3): per-store automation toggles + abandoned-checkout
-- recovery tracking.
--
-- Apply manually BEFORE deploying code that references these columns:
--   psql $DATABASE_URL -f migrations/0024_growth_engine.sql
-- (RUN_MIGRATIONS=false on Railway per the post-May-22 migration policy.)

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS cart_recovery_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS post_purchase_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS newsletter_welcome_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS recovery_email_sent_at timestamp;
