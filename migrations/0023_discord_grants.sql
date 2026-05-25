-- Discord auto-role granting (scaffold). When a buyer completes a purchase
-- of a product that's configured with a Discord guild + role, a worker
-- grants them that role in the seller's Discord server. The worker itself
-- isn't built yet — this migration just adds the columns the UI + grant
-- pipeline will read.
--
-- Apply with: psql $DATABASE_URL -f migrations/0023_discord_grants.sql

-- Per-product Discord config. Both nullable: a product without these
-- columns set will behave exactly as today (no Discord side-effect on
-- purchase).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discord_guild_id varchar(64),
  ADD COLUMN IF NOT EXISTS discord_role_id varchar(64);

-- Buyer's linked Discord user ID. Nullable — most buyers won't have
-- connected Discord. Future "Connect Discord" flow on the storefront
-- portal will populate this via Discord OAuth.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS discord_user_id varchar(64);
