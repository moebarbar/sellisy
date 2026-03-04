import { type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { products as productsTable, storeProducts } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

const CRAWLER_UA = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|googlebot|bingbot|yandex|baiduspider|duckduckbot/i;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncateDescription(text: string, maxLen = 160): string {
  if (!text) return "";
  const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

function buildCanonicalUrl(req: Request): string {
  const host = req.get("host") || "sellisy.com";
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${proto}://${host}${req.originalUrl}`;
}

export async function injectOgTags(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";
  if (!CRAWLER_UA.test(ua)) return next();

  const productMatch = req.path.match(/^\/s\/([^/]+)\/product\/([^/]+)$/);
  const bundleMatch = !productMatch && req.path.match(/^\/s\/([^/]+)\/bundle\/([^/]+)$/);
  const storeMatch = !productMatch && !bundleMatch && req.path.match(/^\/s\/([^/]+)\/?$/);
  const blogMatch = !productMatch && !bundleMatch && !storeMatch && req.path.match(/^\/s\/([^/]+)\/blog\/([^/]+)$/);

  if (!productMatch && !storeMatch && !bundleMatch && !blogMatch) return next();

  try {
    if (productMatch) {
      const [, slug, productId] = productMatch;
      const store = await storage.getStoreBySlug(slug);
      if (!store) return next();

      let product = await storage.getProductById(productId);
      if (!product) {
        const [bySlug] = await db
          .select({ product: productsTable })
          .from(productsTable)
          .innerJoin(storeProducts, and(eq(storeProducts.productId, productsTable.id), eq(storeProducts.storeId, store.id)))
          .where(and(eq(productsTable.slug, productId), isNull(productsTable.deletedAt)))
          .limit(1);
        product = bySlug?.product || null;
      }
      if (!product) return next();

      const images = await storage.getProductImages(product.id);
      const ogImage = (images && images.length > 0 ? images.find(i => i.isPrimary)?.url || images[0]?.url : null) || product.thumbnailUrl || "";

      const title = `${product.title} - ${store.name}`;
      const description = truncateDescription(product.description || product.tagline || `Get ${product.title} from ${store.name}`);
      const canonical = buildCanonicalUrl(req);

      const priceDollars = (product.priceCents / 100).toFixed(2);
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description || `${product.title} from ${store.name}`,
        image: ogImage || undefined,
        url: canonical,
        brand: { "@type": "Brand", name: store.name },
        sku: product.id,
        category: product.category,
        offers: {
          "@type": "Offer",
          price: priceDollars,
          priceCurrency: "USD",
          availability: product.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: canonical,
          seller: { "@type": "Organization", name: store.name },
        },
      };

      return res.send(buildFullHtml({
        title, description, image: ogImage, url: canonical, type: "product",
        jsonLd, storeName: store.name,
        twitterCard: "summary_large_image",
        additionalMeta: product.tags?.length ? `<meta name="keywords" content="${escapeHtml(product.tags.join(", "))}">` : "",
      }));
    }

    if (bundleMatch) {
      const [, slug, bundleId] = bundleMatch;
      const store = await storage.getStoreBySlug(slug);
      if (!store) return next();

      const bundleData = await storage.getBundleWithProducts(bundleId);
      if (!bundleData) return next();
      const { bundle, products: bundleProducts } = bundleData;

      const title = `${bundle.name} - ${store.name}`;
      const description = truncateDescription(bundle.description || `${bundle.name} bundle — ${bundleProducts.length} products from ${store.name}`);
      const image = bundle.thumbnailUrl || "";
      const canonical = buildCanonicalUrl(req);

      const priceDollars = (bundle.priceCents / 100).toFixed(2);
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: bundle.name,
        description: bundle.description || `${bundle.name} from ${store.name}`,
        image: image || undefined,
        url: canonical,
        brand: { "@type": "Brand", name: store.name },
        offers: {
          "@type": "Offer",
          price: priceDollars,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: canonical,
        },
      };

      return res.send(buildFullHtml({
        title, description, image, url: canonical, type: "product",
        jsonLd, storeName: store.name, twitterCard: "summary_large_image",
      }));
    }

    if (blogMatch) {
      const [, slug, postSlug] = blogMatch;
      const store = await storage.getStoreBySlug(slug);
      if (!store) return next();

      const posts = await storage.getBlogPostsByStore(store.id);
      const post = posts.find(p => p.slug === postSlug);
      if (!post) return next();

      const title = `${post.title} - ${store.name}`;
      const description = truncateDescription(post.excerpt || post.title);
      const image = post.coverImageUrl || store.logoUrl || "";
      const canonical = buildCanonicalUrl(req);

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || post.title,
        image: image || undefined,
        url: canonical,
        author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: store.name },
        publisher: { "@type": "Organization", name: store.name },
        datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      };

      return res.send(buildFullHtml({
        title, description, image, url: canonical, type: "article",
        jsonLd, storeName: store.name, twitterCard: "summary_large_image",
      }));
    }

    if (storeMatch) {
      const [, slug] = storeMatch;
      const store = await storage.getStoreBySlug(slug);
      if (!store) return next();

      const title = (store as any).seoTitle || store.name;
      const description = truncateDescription((store as any).seoDescription || store.tagline || `Shop digital products from ${store.name}`);
      const image = store.bannerUrl || store.logoUrl || "";
      const canonical = buildCanonicalUrl(req);

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Store",
        name: store.name,
        description: store.tagline || `Digital products from ${store.name}`,
        image: image || undefined,
        url: canonical,
      };

      return res.send(buildFullHtml({
        title, description, image, url: canonical, type: "website",
        jsonLd, storeName: store.name, twitterCard: "summary_large_image",
      }));
    }

    return next();
  } catch (err) {
    console.error("OG tag injection error:", err);
    return next();
  }
}

type FullHtmlOpts = {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  jsonLd: Record<string, any>;
  storeName: string;
  twitterCard: string;
  additionalMeta?: string;
};

function buildFullHtml(opts: FullHtmlOpts): string {
  const { title, description, image, url, type, jsonLd, storeName, twitterCard, additionalMeta } = opts;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  const img = image ? escapeHtml(image) : "";

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:type" content="${escapeHtml(type)}">
<meta property="og:site_name" content="${escapeHtml(storeName)}">
${img ? `<meta property="og:image" content="${img}">\n<meta property="og:image:alt" content="${t}">` : ""}
<meta name="twitter:card" content="${escapeHtml(twitterCard)}">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
${img ? `<meta name="twitter:image" content="${img}">\n<meta name="twitter:image:alt" content="${t}">` : ""}
${additionalMeta || ""}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head><body></body></html>`;
}
