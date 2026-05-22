-- Drop the unused `store_domains` table.
--
-- Created in 0000 for a Namecheap-registrar integration that never shipped.
-- The active custom-domain path is `stores.custom_domain` + Cloudflare for
-- SaaS (see server/cloudflareClient.ts). Removed from shared/schema.ts in
-- the same change that ships this migration.
--
-- SAFETY: Operator must confirm no rows exist before applying. Run:
--   SELECT count(*) FROM store_domains;
-- and only apply this migration if the count is 0.
--
-- Apply with: psql $DATABASE_URL -f migrations/0019_drop_store_domains.sql

DROP TABLE IF EXISTS "store_domains";
