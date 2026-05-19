-- Course certificates: per-product toggle + issued-certificate ledger.
-- Apply with: psql $DATABASE_URL -f migrations/0011_course_certificates.sql

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "certificates_enabled" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "certificate_issued" (
  "id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "store_id" varchar(64) NOT NULL,
  "buyer_email" text NOT NULL,
  "buyer_name" text,
  "verification_code" varchar(32) NOT NULL UNIQUE,
  "issued_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "certificate_issued_unique" ON "certificate_issued" ("order_id", "product_id");
CREATE INDEX IF NOT EXISTS "certificate_issued_store_idx" ON "certificate_issued" ("store_id", "issued_at");
