-- Course quizzes: lesson-attached single-choice multiple-choice questions.
-- A lesson with any questions becomes quiz-gated: buyer must score >= 70%
-- to mark complete.
-- Apply with: psql $DATABASE_URL -f migrations/0010_course_quizzes.sql

CREATE TABLE IF NOT EXISTS "quiz_questions" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson_id" varchar(64) NOT NULL,
  "prompt" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "deleted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "quiz_questions_lesson_idx" ON "quiz_questions" ("lesson_id", "deleted_at", "sort_order");

CREATE TABLE IF NOT EXISTS "quiz_choices" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" varchar(64) NOT NULL,
  "label" text NOT NULL,
  "is_correct" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "quiz_choices_question_idx" ON "quiz_choices" ("question_id", "sort_order");

CREATE TABLE IF NOT EXISTS "quiz_attempts" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "correct_count" integer NOT NULL,
  "total_count" integer NOT NULL,
  "passed" boolean NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "quiz_attempts_lesson_order_idx" ON "quiz_attempts" ("lesson_id", "order_id", "created_at");
