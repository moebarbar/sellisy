-- Follow-up to migration 0003: 10 more mutable tables were missing `updated_at`.
-- Pattern matches the existing convention: explicit timestamp set by callers
-- (`updatedAt: new Date()` in storage.ts on every mutation). No triggers are
-- introduced; we stay consistent with how the other 14 tables already work.
--
-- Tables intentionally NOT touched:
--   - Append-only logs:       store_events, email_logs, webhook_events,
--                             affiliate_clicks, store_reviews,
--                             course_lesson_progress, quiz_attempts,
--                             certificate_issued
--   - Marker-column mutations: download_tokens (revokedAt),
--                              customer_sessions (expiresAt),
--                              email_suppression (suppressedAt)
--   - No current update path:  product_images, file_assets, quiz_choices,
--                              bundle_items, order_items, newsletter_subscribers,
--                              kb_blocks_attachments (caught), marketing_strategies
--   - Internal job trackers:   gumroad_imports (startedAt/completedAt),
--                              gumroad_product_shells (createdAt + fileStatus)
--   - Slated for removal:      store_domains
--
-- Apply with: psql $DATABASE_URL -f migrations/0018_backfill_updated_at.sql

ALTER TABLE "user_profiles"               ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "store_products"              ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "categories"                  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "kb_pages"                    ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "kb_blocks"                   ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "kb_page_attachments"         ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "blog_blocks"                 ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "store_testimonials"          ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "store_faqs"                  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "newsletter_campaign_blocks"  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
