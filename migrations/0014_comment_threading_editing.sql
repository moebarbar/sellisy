-- Comment threading (one level deep) + edit tracking.
-- parent_id null → top-level. parent_id set → reply.
-- edited_at set whenever the body changes after creation; UI surfaces "(edited)".

ALTER TABLE course_lesson_comments
  ADD COLUMN IF NOT EXISTS parent_id varchar(64),
  ADD COLUMN IF NOT EXISTS edited_at timestamp;

CREATE INDEX IF NOT EXISTS course_lesson_comments_parent_idx
  ON course_lesson_comments (parent_id, created_at);
