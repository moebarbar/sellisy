import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // _shell.html is an internal artifact (P1.b prerender backup of the SPA
  // shell used for non-prerendered routes). Block public access so bots
  // can't index the un-meta'd shell at /_shell.html.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/_shell.html") return res.status(404).send("Not found");
    next();
  });

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (filePath.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }));

  // SPA fallback. The runtime injectOgTags middleware already intercepts
  // GET requests for routes with computed SEO (including prerendered ones)
  // — anything that reaches here is a route with NO SEO branch and no
  // matching static file (e.g. /dashboard before the SPA mounts, or a
  // 404). Serve _shell.html if it exists (post-prerender build), else
  // fall back to index.html (pre-prerender build / dev build).
  const shellPath = path.resolve(distPath, "_shell.html");
  const indexPath = path.resolve(distPath, "index.html");
  app.use("/{*path}", (_req, res) => {
    res.sendFile(fs.existsSync(shellPath) ? shellPath : indexPath);
  });
}
