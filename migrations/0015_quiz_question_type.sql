-- Multi-select MCQ quiz questions.
-- New enum + column on quiz_questions. Existing rows default to 'single' so
-- behavior is unchanged for any quizzes built before this migration.

DO $$ BEGIN
  CREATE TYPE quiz_question_type AS ENUM ('single', 'multi');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS question_type quiz_question_type NOT NULL DEFAULT 'single';
