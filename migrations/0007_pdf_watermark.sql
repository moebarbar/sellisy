-- PDF watermarking: per-store toggle. When enabled, /api/download/:token
-- stamps buyer email + order ID on each page of any PDF before serving.
-- Apply with: psql $DATABASE_URL -f migrations/0007_pdf_watermark.sql

ALTER TABLE "stores"
  ADD COLUMN IF NOT EXISTS "pdf_watermark_enabled" boolean NOT NULL DEFAULT false;
