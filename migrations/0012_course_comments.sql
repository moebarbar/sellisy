-- Per-lesson comments (flat — no threading in V1).
-- Buyers post via their download-token / orderId context;
-- store owners post via authenticated session.
-- Apply with: psql $DATABASE_URL -f migrations/0012_course_comments.sql

DO $$ BEGIN
  CREATE TYPE "public"."comment_author_type" AS ENUM ('buyer', 'owner');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "course_lesson_comments" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson_id" varchar(64) NOT NULL,
  "product_id" varchar(64) NOT NULL,
  "store_id" varchar(64) NOT NULL,
  "author_type" "comment_author_type" NOT NULL,
  "user_id" varchar(64),
  "order_id" varchar(64),
  "author_name" text,
  "author_email" text,
  "body" text NOT NULL,
  "is_pinned" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "course_lesson_comments_lesson_idx" ON "course_lesson_comments" ("lesson_id", "deleted_at", "created_at");
CREATE INDEX IF NOT EXISTS "course_lesson_comments_order_idx" ON "course_lesson_comments" ("order_id", "created_at");
