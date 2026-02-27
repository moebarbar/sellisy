import type { Express } from "express";
import { isAuthenticated } from "../auth";
import { isR2Available, getUploadPresignedUrl } from "../../r2Storage";

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
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      if (useReplitStorage) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

        return res.json({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        });
      }

      if (isR2Available()) {
        const result = await getUploadPresignedUrl("uploads");

        return res.json({
          uploadURL: result.uploadURL,
          objectPath: result.publicUrl,
          metadata: { name, size, contentType },
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
      if (!useReplitStorage) {
        return res.status(404).json({ error: "Object not found — files are served from CDN" });
      }
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
