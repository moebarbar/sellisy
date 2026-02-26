import { type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";

const CRAWLER_UA = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|googlebot/i;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function injectOgTags(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";
  if (!CRAWLER_UA.test(ua)) return next();

  const productMatch = req.path.match(/^\/s\/([^/]+)\/product\/([^/]+)$/);
  const storeMatch = !productMatch && req.path.match(/^\/s\/([^/]+)\/?$/);

  if (!productMatch && !storeMatch) return next();

  try {
    if (productMatch) {
      const [, slug, productId] = productMatch;
      const store = await storage.getStoreBySlug(slug);
      if (!store) return next();
      const product = await storage.getProductById(productId);
      if (!product) return next();

      const title = escapeHtml(`${product.title} - ${store.name}`);
      const description = escapeHtml(product.description || `Get ${product.title} from ${store.name}`);
      const image = product.thumbnailUrl || "";

      return res.send(buildOgHtml(title, description, image, req));
    }

    if (storeMatch) {
      const [, slug] = storeMatch;
      const store = await storage.getStoreBySlug(slug);
      if (!store) return next();

      const title = escapeHtml(store.name);
      const description = escapeHtml(store.tagline || `Shop digital products from ${store.name}`);
      const image = store.bannerUrl || store.logoUrl || "";

      return res.send(buildOgHtml(title, description, image, req));
    }

    return next();
  } catch (err) {
    console.error("OG tag injection error:", err);
    return next();
  }
}

function buildOgHtml(title: string, description: string, image: string, req: Request): string {
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""}
</head><body></body></html>`;
}
