-- Course product type — lessons + buyer progress.
-- Apply with: psql $DATABASE_URL -f migrations/0006_course_lessons.sql

CREATE TABLE IF NOT EXISTS "course_lessons" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" varchar(64) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "video_url" text,
  "attachment_url" text,
  "duration_seconds" integer,
  "sort_order" integer NOT NULL DEFAULT 0,
  "deleted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "course_lessons_product_idx" ON "course_lessons" ("product_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "course_lessons_sort_idx" ON "course_lessons" ("product_id", "sort_order");

CREATE TABLE IF NOT EXISTS "course_lesson_progress" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "completed_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_lesson_progress_unique" ON "course_lesson_progress" ("lesson_id", "order_id");
CREATE INDEX IF NOT EXISTS "course_lesson_progress_order_idx" ON "course_lesson_progress" ("order_id");
