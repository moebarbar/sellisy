-- Drip schedule: per-module and per-lesson "unlock after N days" relative
-- to the buyer's order createdAt. NULL = no drip.
-- Apply with: psql $DATABASE_URL -f migrations/0009_course_drip.sql

ALTER TABLE "course_modules"
  ADD COLUMN IF NOT EXISTS "unlock_after_days" integer;

ALTER TABLE "course_lessons"
  ADD COLUMN IF NOT EXISTS "unlock_after_days" integer;
