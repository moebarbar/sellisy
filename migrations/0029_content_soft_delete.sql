-- Durability hardening: KB pages/blocks/attachments + blog blocks become
-- soft-deleted (deleted_at tombstones) instead of hard-deleted. User
-- content is never destroyed; tombstoned rows are recoverable via SQL.
--
-- Apply manually BEFORE deploying (Node-pg method, idempotent):

ALTER TABLE kb_pages ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE kb_blocks ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE kb_page_attachments ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE blog_blocks ADD COLUMN IF NOT EXISTS deleted_at timestamp;
