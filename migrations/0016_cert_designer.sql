-- Cert designer: per-product accent color (hex string) + logo URL applied
-- to the PDF certificate. Both nullable so existing certs render unchanged.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cert_accent_color varchar(7),
  ADD COLUMN IF NOT EXISTS cert_logo_url varchar(500);
