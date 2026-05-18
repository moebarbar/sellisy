-- Free 14-day Growth-tier trial.
-- NULL = no trial. New signups get trial_ends_at = now() + 14d auto-set
-- when their user_profiles row is lazy-created on first plan-tier check.
-- Effective tier: basic + trial_ends_at > now() → treated as "pro".
-- Apply with: psql $DATABASE_URL -f migrations/0005_user_trial.sql

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;
