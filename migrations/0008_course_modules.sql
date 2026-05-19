-- Course modules: group lessons into chapters. Lessons can be unmoduled
-- (moduleId NULL) for backwards compatibility with existing courses.
-- Apply with: psql $DATABASE_URL -f migrations/0008_course_modules.sql

CREATE TABLE IF NOT EXISTS "course_modules" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" varchar(64) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "deleted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "course_modules_product_idx" ON "course_modules" ("product_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "course_modules_sort_idx" ON "course_modules" ("product_id", "sort_order");

ALTER TABLE "course_lessons"
  ADD COLUMN IF NOT EXISTS "module_id" varchar(64);

CREATE INDEX IF NOT EXISTS "course_lessons_module_idx" ON "course_lessons" ("module_id", "sort_order");
