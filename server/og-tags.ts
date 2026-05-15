import { type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { products as productsTable, storeProducts } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import fs from "fs";
import path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncateDescription(text: string, maxLen = 160): string {
  if (!text) return "";
  const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

function absoluteUrl(req: Request, path: string): string {
  const host = req.get("host") || "sellisy.com";
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  return `${proto}://${host}${path.startsWith("/") ? path : "/" + path}`;
}

function canonicalUrl(req: Request): string {
  return absoluteUrl(req, req.originalUrl.split("?")[0]);
}

function brandSiteUrl(): string {
  return (process.env.APP_URL || "https://sellisy.com").replace(/\/$/, "");
}

// ─── SPA shell loader ─────────────────────────────────────────────────

// Cache the production SPA shell — it doesn't change between requests.
let _cachedShell: string | null = null;

function getSpaShell(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (_cachedShell) return _cachedShell;
  try {
    const distPath = path.resolve(__dirname, "public", "index.html");
    _cachedShell = fs.readFileSync(distPath, "utf-8");
    return _cachedShell;
  } catch {
    return null;
  }
}

// ─── Meta-tag builders ────────────────────────────────────────────────

interface SeoBlock {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: "website" | "product" | "article";
  siteName?: string;
  twitterCard?: "summary" | "summary_large_image";
  keywords?: string;
  robots?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
}

function renderMetaBlock(b: SeoBlock): string {
  const t = escapeHtml(b.title);
  const d = escapeHtml(b.description);
  const u = escapeHtml(b.canonical);
  const img = b.ogImage ? escapeHtml(b.ogImage) : "";
  const card = b.twitterCard || "summary_large_image";
  const type = b.ogType || "website";
  const site = escapeHtml(b.siteName || "Sellisy");
  const jsonLdArr = Array.isArray(b.jsonLd) ? b.jsonLd : (b.jsonLd ? [b.jsonLd] : []);

  return `
<title>${t}</title>
<meta name="description" content="${d}">
${b.keywords ? `<meta name="keywords" content="${escapeHtml(b.keywords)}">` : ""}
${b.robots ? `<meta name="robots" content="${escapeHtml(b.robots)}">` : `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">`}
<link rel="canonical" href="${u}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:type" content="${escapeHtml(type)}">
<meta property="og:url" content="${u}">
<meta property="og:site_name" content="${site}">
<meta property="og:locale" content="en_US">
${img ? `<meta property="og:image" content="${img}">
<meta property="og:image:alt" content="${t}">
${b.ogImageWidth ? `<meta property="og:image:width" content="${b.ogImageWidth}">` : ""}
${b.ogImageHeight ? `<meta property="og:image:height" content="${b.ogImageHeight}">` : ""}` : ""}
<meta name="twitter:card" content="${escapeHtml(card)}">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
${img ? `<meta name="twitter:image" content="${img}">
<meta name="twitter:image:alt" content="${t}">` : ""}
${b.articlePublishedTime ? `<meta property="article:published_time" content="${escapeHtml(b.articlePublishedTime)}">` : ""}
${b.articleModifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(b.articleModifiedTime)}">` : ""}
${b.articleAuthor ? `<meta property="article:author" content="${escapeHtml(b.articleAuthor)}">` : ""}
${jsonLdArr.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
`.trim();
}

/**
 * Inject the SEO meta block into the SPA shell's <head>. Replaces the static
 * <title>, OG/Twitter meta, JSON-LD, and canonical in the shell with the
 * route-specific values. Idempotent — if the shell already has a tag, the
 * regex-replace just inserts before </head> instead.
 */
function injectIntoShell(shell: string, metaBlock: string): string {
  // Strip the static SEO bits from the shell so we don't double them up.
  const stripped = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']keywords["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']article:[^"']*["'][^>]*>/gi, "")
    .replace(/<script[^>]*type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, "");
  return stripped.replace(/<\/head>/i, `${metaBlock}\n</head>`);
}

// ─── Route → SEO data computation ─────────────────────────────────────

/**
 * Returns the SEO block for a request, or null if the route has no special
 * SEO handling (the SPA's client-side <usePageMeta> covers it instead).
 */
async function computeSeoForRoute(req: Request): Promise<SeoBlock | null> {
  const pathOnly = req.path;
  const canonical = canonicalUrl(req);

  // ── 1. Landing page ────────────────────────────────────────────────
  if (pathOnly === "/" || pathOnly === "") {
    const title = "Sellisy — Create & Sell Digital Products";
    const description = "Build your digital storefront in minutes. Import products, accept payments, and deliver secure downloads. The easiest way to sell digital products online.";

    const orgJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Sellisy",
      url: brandSiteUrl(),
      logo: `${brandSiteUrl()}/favicon.png`,
      sameAs: [] as string[],
    };

    const websiteJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Sellisy",
      url: brandSiteUrl(),
      potentialAction: {
        "@type": "SearchAction",
        target: `${brandSiteUrl()}/products?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    return {
      title,
      description,
      canonical,
      ogImage: `${brandSiteUrl()}/og-image.png`,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogType: "website",
      jsonLd: [orgJsonLd, websiteJsonLd],
    };
  }

  // ── 2. Public products catalog ────────────────────────────────────
  if (pathOnly === "/products") {
    return {
      title: "Browse Digital Products — Sellisy",
      description: "Discover digital products, templates, ebooks, courses, and software from independent creators. New listings added daily.",
      canonical,
      ogImage: `${brandSiteUrl()}/og-image.png`,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogType: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Browse Digital Products",
        url: canonical,
        isPartOf: { "@type": "WebSite", url: brandSiteUrl(), name: "Sellisy" },
      },
    };
  }

  // ── 3. Dashboard / auth / account / checkout / claim — noindex ────
  if (
    pathOnly.startsWith("/dashboard") ||
    pathOnly === "/auth" ||
    pathOnly.startsWith("/account") ||
    pathOnly.startsWith("/checkout") ||
    pathOnly.startsWith("/claim") ||
    pathOnly.startsWith("/embed/")
  ) {
    return {
      title: "Sellisy",
      description: "Sellisy",
      canonical,
      robots: "noindex,nofollow",
    };
  }

  // ── 4. Storefront product page ─────────────────────────────────────
  const productMatch = pathOnly.match(/^\/s\/([^/]+)\/product\/([^/]+)$/);
  if (productMatch) {
    const [, slug, productIdOrSlug] = productMatch;
    const store = await storage.getStoreBySlug(slug);
    if (!store) return null;

    let product = await storage.getProductById(productIdOrSlug);
    if (!product) {
      const [bySlug] = await db
        .select({ product: productsTable })
        .from(productsTable)
        .innerJoin(storeProducts, and(eq(storeProducts.productId, productsTable.id), eq(storeProducts.storeId, store.id)))
        .where(and(eq(productsTable.slug, productIdOrSlug), isNull(productsTable.deletedAt)))
        .limit(1);
      product = bySlug?.product || null;
    }
    if (!product) return null;

    const images = await storage.getProductImages(product.id);
    const primaryImage = images?.find(i => i.isPrimary)?.url || images?.[0]?.url || product.thumbnailUrl || "";
    const title = `${product.title} — ${store.name}`;
    const description = truncateDescription(product.description || product.tagline || `Get ${product.title} from ${store.name}`);
    const priceDollars = (product.priceCents / 100).toFixed(2);

    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description || `${product.title} from ${store.name}`,
      image: primaryImage || undefined,
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

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: store.name, item: absoluteUrl(req, `/s/${store.slug}`) },
        { "@type": "ListItem", position: 2, name: product.title, item: canonical },
      ],
    };

    return {
      title,
      description,
      canonical,
      ogImage: primaryImage,
      ogType: "product",
      siteName: store.name,
      keywords: product.tags?.length ? product.tags.join(", ") : undefined,
      jsonLd: [productJsonLd, breadcrumbJsonLd],
    };
  }

  // ── 5. Storefront bundle page ──────────────────────────────────────
  const bundleMatch = pathOnly.match(/^\/s\/([^/]+)\/bundle\/([^/]+)$/);
  if (bundleMatch) {
    const [, slug, bundleId] = bundleMatch;
    const store = await storage.getStoreBySlug(slug);
    if (!store) return null;

    const bundleData = await storage.getBundleWithProducts(bundleId);
    if (!bundleData) return null;
    const { bundle, products: bundleProducts } = bundleData;

    const title = `${bundle.name} — ${store.name}`;
    const description = truncateDescription(bundle.description || `${bundle.name} bundle — ${bundleProducts.length} products from ${store.name}`);
    const priceDollars = (bundle.priceCents / 100).toFixed(2);

    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: bundle.name,
      description: bundle.description || `${bundle.name} from ${store.name}`,
      image: bundle.thumbnailUrl || undefined,
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

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: store.name, item: absoluteUrl(req, `/s/${store.slug}`) },
        { "@type": "ListItem", position: 2, name: bundle.name, item: canonical },
      ],
    };

    return {
      title,
      description,
      canonical,
      ogImage: bundle.thumbnailUrl ?? undefined,
      ogType: "product",
      siteName: store.name,
      jsonLd: [productJsonLd, breadcrumbJsonLd],
    };
  }

  // ── 6. Storefront blog post ────────────────────────────────────────
  const blogMatch = pathOnly.match(/^\/s\/([^/]+)\/blog\/([^/]+)$/);
  if (blogMatch) {
    const [, slug, postSlug] = blogMatch;
    const store = await storage.getStoreBySlug(slug);
    if (!store) return null;

    const posts = await storage.getBlogPostsByStore(store.id);
    const post = posts.find(p => p.slug === postSlug);
    if (!post) return null;

    const title = `${post.title} — ${store.name}`;
    const description = truncateDescription(post.excerpt || post.title);
    const image = post.coverImageUrl || store.logoUrl || `${brandSiteUrl()}/og-image.png`;
    const publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : (post.createdAt ? new Date(post.createdAt).toISOString() : undefined);

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt || post.title,
      image: image || undefined,
      url: canonical,
      author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: store.name },
      publisher: { "@type": "Organization", name: store.name, logo: store.logoUrl ? { "@type": "ImageObject", url: store.logoUrl } : undefined },
      datePublished: publishedAt,
      dateModified: publishedAt,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: store.name, item: absoluteUrl(req, `/s/${store.slug}`) },
        { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl(req, `/s/${store.slug}/blog`) },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    };

    return {
      title,
      description,
      canonical,
      ogImage: image,
      ogType: "article",
      siteName: store.name,
      articlePublishedTime: publishedAt,
      articleModifiedTime: publishedAt,
      articleAuthor: post.authorName ?? undefined,
      jsonLd: [articleJsonLd, breadcrumbJsonLd],
    };
  }

  // ── 7. Storefront blog index ───────────────────────────────────────
  const blogIndexMatch = pathOnly.match(/^\/s\/([^/]+)\/blog\/?$/);
  if (blogIndexMatch) {
    const [, slug] = blogIndexMatch;
    const store = await storage.getStoreBySlug(slug);
    if (!store) return null;
    return {
      title: `Blog — ${store.name}`,
      description: truncateDescription(`Latest posts and updates from ${store.name}.`),
      canonical,
      ogType: "website",
      siteName: store.name,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `${store.name} Blog`,
        url: canonical,
        publisher: { "@type": "Organization", name: store.name },
      },
    };
  }

  // ── 8. Storefront home ─────────────────────────────────────────────
  const storeMatch = pathOnly.match(/^\/s\/([^/]+)\/?$/);
  if (storeMatch) {
    const [, slug] = storeMatch;
    const store = await storage.getStoreBySlug(slug);
    if (!store) return null;

    const title = (store as any).seoTitle || store.name;
    const description = truncateDescription((store as any).seoDescription || store.tagline || `Shop digital products from ${store.name}`);
    const image = store.heroBannerUrl || store.logoUrl || `${brandSiteUrl()}/og-image.png`;

    const storeJsonLd = {
      "@context": "https://schema.org",
      "@type": "Store",
      name: store.name,
      description: store.tagline || `Digital products from ${store.name}`,
      image: image || undefined,
      url: canonical,
      logo: store.logoUrl || undefined,
    };

    return {
      title,
      description,
      canonical,
      ogImage: image,
      ogType: "website",
      siteName: store.name,
      jsonLd: storeJsonLd,
    };
  }

  // ── 9. Custom-domain storefront (rewritten to /s/:slug) ────────────
  // The custom-domain middleware in routes.ts rewrites custom-domain paths
  // to /s/:slug/... before this middleware runs, so the storeMatch above
  // already covers it. No extra case needed.

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────

export async function injectOgTags(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET") return next();
  // Skip APIs, static assets, and object storage
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/assets/") ||
    req.path.startsWith("/objects/") ||
    req.path.startsWith("/src/") ||  // vite dev source files
    req.path.startsWith("/@") ||      // vite internals
    req.path === "/robots.txt" ||
    req.path === "/sitemap.xml"
  ) return next();
  // Skip non-HTML asset extensions
  if (/\.(js|mjs|ts|tsx|css|png|jpg|jpeg|webp|gif|svg|ico|map|woff2?|ttf|otf|json|xml|txt|mp4|webm)$/i.test(req.path)) return next();

  let seo: SeoBlock | null = null;
  try {
    seo = await computeSeoForRoute(req);
  } catch (err) {
    console.error("[seo] compute error:", err);
    return next();
  }
  if (!seo) return next();

  const metaBlock = renderMetaBlock(seo);

  // Only intercept in production where we have a built shell. In dev mode
  // the Vite middleware does HMR-aware HTML serving; we pass the meta
  // through res.locals so vite.ts can inject before responding.
  const shell = getSpaShell();
  if (shell) {
    const html = injectIntoShell(shell, metaBlock);
    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(html);
    return;
  }

  (res.locals as any).seoMetaBlock = metaBlock;
  return next();
}

// Helper exported for vite.ts to call during dev-mode HTML transformation.
export function getSeoMetaFromLocals(res: Response): string | null {
  return (res.locals as any).seoMetaBlock ?? null;
}

export function applySeoToHtml(html: string, metaBlock: string): string {
  return injectIntoShell(html, metaBlock);
}
