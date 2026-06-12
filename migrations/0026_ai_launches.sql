-- AI Store Launcher (Phase 5): launch-run tracking.
--
-- Apply manually BEFORE deploying Phase 5 code (same Node-pg method as
-- 0024/0025; everything is idempotent):

DO $$ BEGIN
  CREATE TYPE ai_launch_status AS ENUM ('pending', 'analyzing', 'selecting', 'assembling', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ai_launches (
  id varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  prompt text NOT NULL,
  status ai_launch_status NOT NULL DEFAULT 'pending',
  store_id varchar(64),
  store_slug text,
  product_count integer,
  error text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_launches_user_created_idx ON ai_launches (user_id, created_at);
