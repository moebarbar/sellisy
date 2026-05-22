-- Recovery migration: `webhook_events` and `email_suppression` exist in
-- shared/schema.ts but were never written into a numbered migration. On any
-- prod DB that wasn't built via `drizzle-kit push`, both tables are missing,
-- which surfaces as:
--   [cleanup] periodic prune failed: relation "webhook_events" does not exist
-- (the hourly cleanup in routes/orders.ts) and would also break the
-- Stripe/PayPal webhook dedup path (`claimWebhookEvent`) and the SendGrid
-- bounce/complaint suppression list.
--
-- Both CREATEs use IF NOT EXISTS so this migration is idempotent — safe to
-- apply on DBs that already have these tables (e.g. populated via db:push).
--
-- Apply with: psql $DATABASE_URL -f migrations/0020_create_missing_webhook_event_tables.sql

-- Enums must exist before the tables that reference them.
DO $$ BEGIN
  CREATE TYPE "email_suppression_reason" AS ENUM ('bounce', 'complaint', 'unsubscribe', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "webhook_provider" AS ENUM ('stripe', 'paypal', 'sendgrid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "email_suppression" (
  "email" varchar(255) PRIMARY KEY NOT NULL,
  "reason" "email_suppression_reason" NOT NULL,
  "detail" text,
  "suppressed_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" varchar(64) PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "provider" "webhook_provider" NOT NULL,
  "event_id" varchar(255) NOT NULL,
  "event_type" text,
  "processed_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_event_unique"
  ON "webhook_events" ("provider", "event_id");

CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx"
  ON "webhook_events" ("processed_at");
