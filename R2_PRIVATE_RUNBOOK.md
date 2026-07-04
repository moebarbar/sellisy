# R2 Private Deliverables — Runbook

Goal: close the security hole where a **refunded/expired buyer keeps permanent
access** to a purchased file, because paid files resolve to permanent, unsigned
`cdn.sellisy.com/...` public URLs. Token revocation/expiry is currently
cosmetic against someone who saved the URL.

## ⚠️ Do NOT just "make the bucket private"

Uploads for BOTH **display images** (product thumbnails, hero banners, logos —
rendered on public storefronts via plain `<img src="cdn.sellisy.com/...">`) and
**deliverable files** (the thing a buyer downloads after paying) currently go to
the **same** prefix (`u/<userId>/…`) and are served from the **same public**
`cdn.sellisy.com`. Flipping the whole bucket to private **would break every
product image on every storefront.**

So this needs **separation of public assets from private deliverables**, not a
single toggle.

## What's already done (code)

`/api/download/:token` already returns short-lived (1h) **signed** URLs via
`r2Storage.signedDownloadUrlFor()` (single-file redirect, multi-file JSON, and
the watermark fetch). So once deliverables live behind a private path, downloads
+ watermarking keep working and revocation/expiry finally bite. See commit
`91b402c`.

## The plan (do in order)

### 1. Code — route deliverable uploads to a private prefix
Currently the upload endpoint (`server/replit_integrations/object_storage/routes.ts`,
`prefix = u/${userId}`) doesn't distinguish asset types. Change it so:
- **Display images** (thumbnails, hero, logo, product images) → stay under a
  **public** prefix, e.g. `u/<userId>/public/…` (served via `cdn.sellisy.com`).
- **Deliverable files** (product `fileUrl`, file assets) → go under a
  **private** prefix, e.g. `u/<userId>/private/…`.

The client upload calls pass an asset kind so the server picks the prefix.
`getUploadPresignedUrl({ prefix })` already accepts a prefix.

`signedDownloadUrlFor()` needs no change — it signs whatever key it's given;
just ensure deliverable records store the `private/` key.

> Migration note: existing deliverables already live under the public prefix.
> Either (a) leave old ones public and only new uploads go private (partial
> fix), or (b) run a one-time copy of existing deliverable objects into the
> private prefix and update the DB `fileUrl`/`storageKey` rows. (b) is the
> complete fix. R2 objects are never deleted by policy — copy, don't move,
> then repoint.

### 2. Cloudflare — make only the private path non-public
On the R2 bucket behind `cdn.sellisy.com`:
- Keep the public custom-domain access for the bucket **but** add a rule that
  blocks unsigned access to `…/private/*` (Cloudflare **WAF / Transform or
  Bucket policy**), OR
- Simpler + cleaner: put deliverables in a **separate bucket** with **no**
  public access at all, and point `signedDownloadUrlFor()` at it. Public images
  stay in the current public bucket. (Recommended — least foot-gun.)

The signed URLs are generated against the R2 S3 endpoint
(`<account>.r2.cloudflarestorage.com`), which works regardless of the public
custom-domain config.

### 3. Verify (all four must pass)
1. A raw `https://cdn.sellisy.com/u/<uid>/private/<file>` URL returns **403**.
2. A raw product **image** URL (`…/public/…`) still returns **200** and renders
   on the storefront.
3. Buying → `/api/download/:token` still downloads the file (via signed URL),
   and **PDF watermarking** still works.
4. After a **refund**, the download link returns **410** (token revoked) and any
   previously-copied public URL no longer resolves.

## Status
- Signed-download code: **shipped** (`91b402c`).
- Upload prefix split (step 1) + Cloudflare/bucket separation (step 2):
  **not done** — needs the code change above + an infra decision (single bucket
  + path rule vs. a dedicated private bucket). Recommend the **separate private
  bucket** route.

Ping me to implement step 1 (the upload-routing + optional migration) — it's the
code prerequisite before the infra flip is safe.
