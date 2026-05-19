-- Per-order opt-out for course discussion email notifications.
-- Default true so behavior is unchanged for existing orders; flipped to false
-- by the one-click unsubscribe link or the buyer-facing toggle in the course
-- portal.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS comment_notifications_enabled boolean NOT NULL DEFAULT true;
