import type { Express, Request } from "express";
import { isAuthenticated } from "../auth";
import { isR2Available, getUploadPresignedUrl } from "../../r2Storage";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB hard cap

// Allowlist of MIME types we accept for uploads. Anything that can execute
// in a browser context (HTML, SVG, JS) or that we don't classify is rejected.
const ALLOWED_MIME_PATTERNS: RegExp[] = [
  /^image\/(jpe?g|png|webp|gif|avif|heic|heif)$/i,
  /^video\/(mp4|webm|quicktime)$/i,
  /^audio\/(mpeg|mp3|wav|ogg|webm)$/i,
  /^application\/pdf$/i,
  /^application\/zip$/i,
  /^application\/x-zip-compressed$/i,
  /^application\/json$/i,
  /^application\/(vnd\.openxmlformats-officedocument|msword|vnd\.ms-(excel|powerpoint))/i,
  /^application\/(epub\+zip|x-iwork-pages-sffpages|x-iwork-keynote-sffkey|x-iwork-numbers-sffnumbers)$/i,
  /^text\/(plain|csv|markdown)$/i,
  /^font\/(woff2?|ttf|otf)$/i,
];

function isAllowedMime(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const trimmed = contentType.split(";")[0].trim();
  return ALLOWED_MIME_PATTERNS.some((re) => re.test(trimmed));
}

function getRequestUserId(req: Request): string | null {
  return (req as any).sellisyUserId ?? null;
}

let useReplitStorage = false;

async function checkReplitStorage(): Promise<boolean> {
  try {
    if (!process.env.PRIVATE_OBJECT_DIR || !process.env.PUBLIC_OBJECT_SEARCH_PATHS) {
      return false;
    }
    const response = await fetch("http://127.0.0.1:1106/object-storage/signed-object-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: "test",
        object_name: "test",
        method: "HEAD",
        expires_at: new Date(Date.now() + 60000).toISOString(),
      }),
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

export function registerObjectStorageRoutes(app: Express): void {
  checkReplitStorage().then((available) => {
    useReplitStorage = available;
    if (available) {
      console.log("[Storage] Using Replit Object Storage");
    } else if (isR2Available()) {
      console.log("[Storage] Using Cloudflare R2 Storage");
    } else {
      console.warn("[Storage] No storage backend available — uploads will fail");
    }
  });

  app.post("/api/uploads/request-url", isAuthenticated, async (req, res) => {
    try {
      const { name, size, contentType } = req.body ?? {};

      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }
      if (typeof contentType !== "string" || !isAllowedMime(contentType)) {
        return res.status(415).json({ error: `Unsupported file type: ${contentType ?? "unknown"}` });
      }
      const sizeNum = typeof size === "number" ? size : parseInt(String(size ?? ""), 10);
      if (!Number.isFinite(sizeNum) || sizeNum <= 0) {
        return res.status(400).json({ error: "Missing or invalid file size" });
      }
      if (sizeNum > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ error: `File too large (max ${MAX_UPLOAD_BYTES} bytes)` });
      }

      const userId = getRequestUserId(req);
      // Namespace every upload under the owner's id so one tenant cannot
      // overwrite or guess another tenant's object keys.
      const prefix = userId ? `u/${userId}` : "uploads";

      if (useReplitStorage) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

        return res.json({
          uploadURL,
          objectPath,
          metadata: { name, size: sizeNum, contentType },
        });
      }

      if (isR2Available()) {
        const result = await getUploadPresignedUrl({
          prefix,
          contentType,
          contentLength: sizeNum,
        });

        return res.json({
          uploadURL: result.uploadURL,
          objectPath: result.publicUrl,
          metadata: { name, size: sizeNum, contentType },
        });
      }

      return res.status(503).json({ error: "No storage backend available" });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      // ACL check — without this, any private object was streamed to anyone who
      // knew/guessed the path (IDOR). Deny unless the caller is authorized.
      const userId = (req as any).user?.claims?.sub as string | undefined;
      const canAccess = await objectStorageService.canAccessObjectEntity({ objectFile, userId });
      if (!canAccess) {
        return res.status(userId ? 403 : 401).json({ error: "Access denied" });
      }
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("Error serving object:", error);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
