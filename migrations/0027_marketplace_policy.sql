-- Marketplace policy (v2.1): per-store opt-out + per-listing promote flag.
-- Only USER-created products are marketplace-eligible (admin exception);
-- enforcement lives in the discover queries — these columns are the
-- seller-facing controls.
--
-- Apply manually BEFORE deploying (same Node-pg method as 0024-0026):

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS show_in_marketplace boolean NOT NULL DEFAULT true;
