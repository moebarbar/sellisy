import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { db } from "./db";
import { orders, orderItems, coupons, customers, products, storeProducts, marketingStrategies, storeStrategyProgress, stores, PLAN_FEATURES, type PlanTier } from "@shared/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { createCustomHostname, getCustomHostname, deleteCustomHostname, createWorkerRoute, deleteWorkerRoute, isCloudflareConfigured } from "./cloudflareClient";
import { seedDatabase, seedMarketingIfNeeded, seedAdminUser } from "./seed";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sendOrderConfirmationEmail, sendDownloadLinkEmail, sendLeadMagnetEmail, sendNewOrderNotificationEmail, sendMagicLinkEmail, sendAllTestEmails, baseLayout, sectionHeading, bodyText, ctaButton, divider } from "./emails";
import { registerSubscriptionRoutes } from "./subscriptions";
import { sendOrderCompletionEmails } from "./orderEmailHelper";
import { setEmailLogger, sendEmailStaggered, setSuppressionCheck } from "./sendgridClient";
import { runHealthCheck, runRepair } from "./integrity";
import { getRevenueAnalytics, getProductAnalytics, getCustomerAnalytics, getCouponAnalytics, getTrafficAnalytics } from "./analytics";
import { users } from "@shared/models/auth";
import { emailLogs, emailSuppression } from "@shared/schema";
import cookieParser from "cookie-parser";
import { audit, auditMeta } from "./audit";
import { gumroadImportRouter } from "./routes/gumroad-import";
import { affiliateRouter } from "./routes/affiliate";
import { coursesRouter } from "./routes/courses";
import { ordersRouter } from "./routes/orders";
import { productsRouter } from "./routes/products";
import { kbBlogRouter } from "./routes/kb-blog";
import { storesRouter } from "./routes/stores";
import {
  effectiveTier,
  ensureUserProfile,
  generateSlug,
  getAppUrl,
  getCustomerFromCookie,
  getUserId,
  getUserPlanTier,
  isUserAdmin,
  sanitizeProductForStorefront,
  sanitizeStore,
} from "./routes/_helpers";
import { verifyUnsubscribeToken } from "./crypto/unsubscribe-token";
import { encryptPaymentSecret } from "./crypto/payment-secret";


// All cross-router helpers (getUserId, getAppUrl, generateSlug, sanitizeStore,
// sanitizeProductForStorefront, hashToken, getCustomerFromCookie, plus the
// tier helpers ensureUserProfile/effectiveTier/getUserPlanTier/isUserAdmin)
// live in routes/_helpers.ts and are imported above.

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);
  registerSubscriptionRoutes(app);
  app.use(cookieParser());
  app.use('/api/integrations/gumroad', gumroadImportRouter);
  app.use('/api/affiliate', affiliateRouter);
  app.use('/api/courses', coursesRouter);
  // ordersRouter handles all /api paths it registers internally (orders list,
  // checkout, PayPal capture, downloads, customer portal).
  app.use(ordersRouter);
  // productsRouter: catalog domain — categories, products, store-products,
  // bundles, coupons, public library reads.
  app.use(productsRouter);
  // kbBlogRouter: knowledge bases, blog posts, and the storefront blog reads.
  app.use(kbBlogRouter);
  // storesRouter: store CRUD + per-store sections (testimonials, FAQs,
  // reviews, newsletter campaigns).
  app.use(storesRouter);

  // One-click unsubscribe. Stateless: HMAC of orderId is enough to authorize
  // the flip. Responds with a tiny HTML confirmation page so the user sees
  // something useful regardless of which mail client opened the link.
  // Supports both GET (clicking the unsubscribe link in the email body) and
  // POST (mail client one-click unsubscribe per RFC 8058).
  const unsubscribeHandler = async (req: any, res: any) => {
    const orderId = String(req.query.orderId || req.body?.orderId || "");
    const token = String(req.query.token || req.body?.token || "");
    if (!orderId || !token || !verifyUnsubscribeToken(orderId, token)) {
      return res.status(400).type("html").send(`<!doctype html><meta charset="utf-8"><title>Unsubscribe</title><body style="font-family:system-ui;text-align:center;padding:60px 20px;color:#374151;"><h1>That link is invalid or expired.</h1><p>If you keep getting these emails, contact the course owner directly.</p></body>`);
    }
    try {
      await storage.setOrderCommentNotifications(orderId, false);
      return res.status(200).type("html").send(`<!doctype html><meta charset="utf-8"><title>Unsubscribed</title><body style="font-family:system-ui;text-align:center;padding:60px 20px;color:#374151;"><h1>You're unsubscribed.</h1><p>You won't get discussion emails for this course anymore. You can turn them back on inside the course portal at any time.</p></body>`);
    } catch (e) {
      console.error("[unsubscribe] failed:", e);
      return res.status(500).type("html").send(`<!doctype html><meta charset="utf-8"><title>Unsubscribe</title><body style="font-family:system-ui;text-align:center;padding:60px 20px;color:#374151;"><h1>Something went wrong.</h1><p>Please try again in a moment.</p></body>`);
    }
  };
  app.get('/api/unsubscribe/course-comments', unsubscribeHandler);
  app.post('/api/unsubscribe/course-comments', unsubscribeHandler);

  app.use(async (req, res, next) => {
    const originalHost = (req.headers["x-custom-host"] as string) || (req.headers["x-forwarded-host"] as string) || req.hostname;
    const hostname = originalHost?.split(":")[0];
    if (!hostname || hostname === "localhost" || hostname.includes("replit") || hostname.includes("railway.app") || hostname.includes("sellisy.com") || /^\d+\./.test(hostname)) {
      return next();
    }
    try {
      const [store] = await db.select().from(stores).where(and(eq(stores.customDomain, hostname), isNull(stores.deletedAt))).limit(1);
      if (store) {
        if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || req.path.startsWith("/objects/")) {
          return next();
        }
        if (req.path === "/" || req.path === "") {
          req.url = "/s/" + store.slug;
        } else if (req.path.startsWith("/p/")) {
          req.url = "/s/" + store.slug + req.url;
        } else if (req.path.startsWith("/checkout")) {
          req.url = "/s/" + store.slug + req.url;
        } else if (req.path.startsWith("/portal")) {
          req.url = "/s/" + store.slug + req.url;
        } else if (req.path.startsWith("/kb")) {
          req.url = "/s/" + store.slug + req.url;
        } else if (req.path.startsWith("/blog")) {
          req.url = "/s/" + store.slug + req.url;
        } else if (req.path.startsWith("/product")) {
          req.url = "/s/" + store.slug + req.url;
        } else if (req.path.startsWith("/bundle")) {
          req.url = "/s/" + store.slug + req.url;
        }
        (req as any).customDomainStore = store;
      }
    } catch (err) {
      console.error("[custom-domain] Error looking up domain:", hostname, err);
    }
    next();
  });

  setEmailLogger(async (to, subject, status, error) => {
    await db.insert(emailLogs).values({
      toEmail: to,
      subject,
      status: status as "sent" | "failed",
      error: error || null,
    });
  });

  setSuppressionCheck(async (email) => storage.isEmailSuppressed(email));

  await seedDatabase();
  await seedMarketingIfNeeded();
  await seedAdminUser();

  app.get("/api/health", async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ ok: true, db: "connected" });
    } catch (err) {
      console.error("[health] Database connectivity check failed:", err);
      res.status(503).json({ ok: false, db: "disconnected" });
    }
  });

  // Public platform stats for the landing page. Real counts, cached
  // in-memory for 10 minutes — this is marketing data, staleness is fine.
  let _publicStatsCache: { data: any; at: number } | null = null;
  app.get("/api/public-stats", async (_req, res) => {
    try {
      if (_publicStatsCache && Date.now() - _publicStatsCache.at < 10 * 60 * 1000) {
        res.set("Cache-Control", "public, max-age=600");
        return res.json(_publicStatsCache.data);
      }
      const result = await db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM products WHERE source = 'PLATFORM' AND status = 'ACTIVE' AND deleted_at IS NULL) AS "libraryProducts",
          (SELECT COUNT(DISTINCT store_id)::int FROM store_products WHERE is_published = true) AS "activeStores",
          (SELECT COUNT(*)::int FROM orders WHERE status = 'COMPLETED' AND deleted_at IS NULL) AS "ordersDelivered"
      `);
      const data = result.rows[0];
      _publicStatsCache = { data, at: Date.now() };
      res.set("Cache-Control", "public, max-age=600");
      res.json(data);
    } catch (err) {
      console.error("[public-stats] failed:", err);
      res.status(500).json({ message: "Stats unavailable" });
    }
  });

  app.get("/robots.txt", (_req, res) => {
    const siteUrl = (process.env.APP_URL || "https://sellisy.com").replace(/\/$/, "");
    // Cache for an hour at the edge; clients can revalidate sooner.
    res.set("Cache-Control", "public, max-age=3600");
    res.type("text/plain").send(`User-agent: *
Allow: /
Allow: /s/
Allow: /product/
Allow: /bundle/
Allow: /products
Allow: /vs/
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth
Disallow: /account
Disallow: /checkout
Disallow: /claim
Disallow: /embed/
Disallow: /objects/
Disallow: /assets/
Disallow: /*?token=
Disallow: /*?session_id=
Disallow: /*?order_id=

# AI crawlers are explicitly ALLOWED on marketing surfaces. Sellisy is a
# public product — letting ChatGPT, Claude, Perplexity, Gemini, etc.
# summarize the site is part of discovery in an AI-mediated search world.
# Note: Cloudflare's "Block AI Scrapers" feature can still 403 these UAs
# at the edge before they ever read robots.txt. If you want AI traffic,
# turn that off in the Cloudflare dashboard (Security → Bots).

Sitemap: ${siteUrl}/sitemap.xml`);
  });

  // llms.txt — short, structured guide for AI assistants describing what
  // Sellisy is + which URLs are the canonical sources of platform info.
  // Follows the proposed llms.txt format (https://llmstxt.org).
  app.get("/llms.txt", (_req, res) => {
    const siteUrl = (process.env.APP_URL || "https://sellisy.com").replace(/\/$/, "");
    res.set("Cache-Control", "public, max-age=3600");
    res.type("text/plain").send(`# Sellisy

> Sellisy is a multi-tenant platform for creators selling digital products,
> courses, ebooks, software, and templates. Each creator gets their own
> branded storefront, connects their own Stripe or PayPal (keeping 100% of
> sales), and gets a full feature set out of the box — affiliate program,
> LMS with quizzes and certificates, PDF watermarking, custom domains,
> verified reviews, knowledge base + blog, newsletter campaigns, and a
> public marketplace for discovery.

Pricing: from \$9/month, flat. 0% transaction fee — sellers connect their own
Stripe or PayPal so payouts go direct. Library access starts at \$29 Growth.

## Marketing

- [Home](${siteUrl}/): Headline pitch, feature catalog, pricing.
- [Discover marketplace](${siteUrl}/discover): Public catalog of products
  across every live Sellisy storefront.
- [PLR / MRR library](${siteUrl}/products): 200+ ready-to-sell digital
  products with full resell rights, available to Growth+ subscribers.

## Comparisons

Side-by-side feature and pricing comparisons against the platforms creators
are usually switching from. Each page covers fees, plan tiers, ownership of
the storefront URL, payouts, and what's included vs paid-on-top.

- [Sellisy vs Gumroad](${siteUrl}/vs/gumroad)
- [Sellisy vs Lemon Squeezy](${siteUrl}/vs/lemon-squeezy)
- [Sellisy vs Payhip](${siteUrl}/vs/payhip)
- [Sellisy vs Sellfy](${siteUrl}/vs/sellfy)
- [Sellisy vs Podia](${siteUrl}/vs/podia)
- [Sellisy vs SendOwl](${siteUrl}/vs/sendowl)
- [Sellisy vs Ko-fi](${siteUrl}/vs/ko-fi)
- [Sellisy vs Stan Store](${siteUrl}/vs/stan-store)
- [Sellisy vs Whop](${siteUrl}/vs/whop)
- [Sellisy vs Kajabi](${siteUrl}/vs/kajabi)
- [Sellisy vs Kit](${siteUrl}/vs/kit)
- [Sellisy vs Beacons](${siteUrl}/vs/beacons)

## Legal

- [Privacy](${siteUrl}/privacy)
- [Terms](${siteUrl}/terms)
- [Data deletion](${siteUrl}/data-deletion)

## Notes for AI assistants

- The seller-owned storefronts at /s/<slug>/* belong to individual creators,
  not to Sellisy. Each store's content (product titles, prices, descriptions,
  blog posts) is the seller's. Sellisy provides the platform.
- Dashboard, auth, account, checkout, and embed paths are private and not
  intended for summarization. See robots.txt.
- For platform-feature questions ("does Sellisy do X?"), the marketing pages
  above are the authoritative answer.
`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getAppUrl(req);
      const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      const isoOrUndefined = (d: Date | string | null | undefined) => d ? new Date(d).toISOString() : undefined;

      const allStores = await db
        .select({
          id: stores.id,
          slug: stores.slug,
          name: stores.name,
          customDomain: stores.customDomain,
          domainStatus: stores.domainStatus,
          updatedAt: stores.updatedAt,
        })
        .from(stores)
        .where(isNull(stores.deletedAt));

      let urls = "";

      // Marketing pages
      urls += `  <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;
      urls += `  <url><loc>${baseUrl}/discover</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
      urls += `  <url><loc>${baseUrl}/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
      urls += `  <url><loc>${baseUrl}/privacy</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>\n`;
      urls += `  <url><loc>${baseUrl}/terms</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>\n`;
      urls += `  <url><loc>${baseUrl}/data-deletion</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>\n`;

      // Competitor comparison pages — keep slugs in sync with client/src/data/competitors.ts.
      const versusSlugs = [
        "gumroad", "lemon-squeezy", "payhip", "sellfy", "podia",
        "sendowl", "ko-fi", "stan-store", "whop", "kajabi", "kit", "beacons",
      ];
      for (const slug of versusSlugs) {
        urls += `  <url><loc>${baseUrl}/vs/${slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
      }

      for (const store of allStores) {
        const hasCustomDomain = !!(store.customDomain && store.domainStatus === "active");
        const storeBase = hasCustomDomain ? `https://${store.customDomain}` : `${baseUrl}/s/${store.slug}`;
        const storeLastmod = isoOrUndefined(store.updatedAt);

        urls += `  <url><loc>${storeBase}</loc>${storeLastmod ? `<lastmod>${storeLastmod}</lastmod>` : ""}<changefreq>daily</changefreq><priority>0.8</priority></url>\n`;

        const storeProductsList = await storage.getStoreProducts(store.id);
        for (const sp of storeProductsList) {
          if (!sp.isPublished) continue;
          const product = await storage.getProductById(sp.productId);
          if (!product || product.deletedAt) continue;
          const productSlug = product.slug || product.id;
          const productUrl = `${storeBase}/product/${productSlug}`;
          const lastmod = isoOrUndefined(product.updatedAt ?? product.createdAt);
          const imageTag = product.thumbnailUrl
            ? `<image:image><image:loc>${xmlEscape(product.thumbnailUrl)}</image:loc><image:title>${xmlEscape(product.title)}</image:title></image:image>`
            : "";
          urls += `  <url><loc>${productUrl}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.7</priority>${imageTag}</url>\n`;
        }

        const storeBundles = await storage.getBundlesByStore(store.id);
        for (const bundle of storeBundles) {
          if (!bundle.isPublished || bundle.deletedAt) continue;
          const bundleUrl = `${storeBase}/bundle/${bundle.id}`;
          const lastmod = isoOrUndefined(bundle.updatedAt ?? bundle.createdAt);
          const imageTag = bundle.thumbnailUrl
            ? `<image:image><image:loc>${xmlEscape(bundle.thumbnailUrl)}</image:loc><image:title>${xmlEscape(bundle.name)}</image:title></image:image>`
            : "";
          urls += `  <url><loc>${bundleUrl}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.6</priority>${imageTag}</url>\n`;
        }

        const blogPosts = await storage.getBlogPostsByStore(store.id);
        if (blogPosts.some(p => p.isPublished && !p.deletedAt)) {
          urls += `  <url><loc>${storeBase}/blog</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>\n`;
        }
        for (const post of blogPosts) {
          if (post.deletedAt || !post.isPublished) continue;
          const postUrl = `${storeBase}/blog/${post.slug}`;
          const lastmod = isoOrUndefined(post.updatedAt ?? post.publishedAt ?? post.createdAt);
          const imageTag = post.coverImageUrl
            ? `<image:image><image:loc>${xmlEscape(post.coverImageUrl)}</image:loc><image:title>${xmlEscape(post.title)}</image:title></image:image>`
            : "";
          urls += `  <url><loc>${postUrl}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.5</priority>${imageTag}</url>\n`;
        }
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}</urlset>`;

      res.set("Cache-Control", "public, max-age=900");
      res.type("application/xml").send(xml);
    } catch (err) {
      console.error("Sitemap generation error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/api/debug-headers", isAuthenticated, async (req, res) => {
    const xCustomHost = (req.headers["x-custom-host"] as string) || null;
    const hostname = xCustomHost?.split(":")[0] || null;
    let storeMatch = null;
    if (hostname) {
      const [found] = await db.select({ id: stores.id, slug: stores.slug, customDomain: stores.customDomain, domainStatus: stores.domainStatus }).from(stores).where(eq(stores.customDomain, hostname)).limit(1);
      storeMatch = found || null;
    }
    res.json({
      hostname: req.hostname,
      xCustomHost,
      xForwardedHost: req.headers["x-forwarded-host"] || null,
      host: req.headers["host"] || null,
      storeMatch,
    });
  });

  app.get("/api/resolve-domain", async (req, res) => {
    const hostname = (req.query.host as string)?.split(":")[0];
    if (!hostname) return res.json({ store: null });
    try {
      const [store] = await db.select({ slug: stores.slug }).from(stores).where(and(eq(stores.customDomain, hostname), isNull(stores.deletedAt))).limit(1);
      res.json({ store: store || null });
    } catch {
      res.json({ store: null });
    }
  });

  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const profile = await ensureUserProfile(userId);
    const trueTier = profile.planTier as PlanTier;
    const tier = effectiveTier(profile);
    const isOnTrial = trueTier === "basic" && !!profile.trialEndsAt && profile.trialEndsAt > new Date();
    res.json({
      ...profile,
      // The effective tier the client should use for feature gating.
      // The raw planTier is still on the row (planTier) if anything needs it.
      planTier: tier,
      features: PLAN_FEATURES[tier],
      isOnTrial,
      trialEndsAt: profile.trialEndsAt,
    });
  });

  app.patch("/api/user/plan", isAuthenticated, async (req, res) => {
    const schema = z.object({ planTier: z.enum(["basic", "pro", "max"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid plan tier" });
    const profile = await storage.updateUserPlan(getUserId(req), parsed.data.planTier);
    const tier = profile?.planTier as PlanTier;
    res.json({ ...profile, features: PLAN_FEATURES[tier] });
  });

  app.patch("/api/admin/user/:userId/plan", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const schema = z.object({ planTier: z.enum(["basic", "pro", "max"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid plan tier" });
    const adminId = getUserId(req);
    const profile = await storage.updateUserPlan(req.params.userId as string, parsed.data.planTier);
    audit({ event: "admin.plan_change", userId: adminId, details: `Changed plan for user ${req.params.userId} to ${parsed.data.planTier}`, ...auditMeta(req) });
    res.json(profile);
  });

  app.patch("/api/admin/user/:userId/admin", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const schema = z.object({ isAdmin: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const adminId2 = getUserId(req);
    const profile = await storage.setUserAdmin(req.params.userId as string, parsed.data.isAdmin);
    audit({ event: "admin.role_change", userId: adminId2, details: `Set isAdmin=${parsed.data.isAdmin} for user ${req.params.userId}`, ...auditMeta(req) });
    res.json(profile);
  });



  // --- Analytics ---

  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const storeIdParam = req.query.storeId as string | undefined;
    const userStores = await storage.getStoresByOwner(userId);

    const targetStores = storeIdParam
      ? userStores.filter((s) => s.id === storeIdParam)
      : userStores;

    if (storeIdParam && targetStores.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProducts = 0;
    const topProducts: { title: string; revenue: number; count: number }[] = [];
    const revenueByDate: Record<string, number> = {};

    const storeDataPromises = targetStores.map(async (store) => {
      const [storeOrders, storeProds] = await Promise.all([
        storage.getOrdersByStore(store.id),
        storage.getStoreProducts(store.id),
      ]);
      const completedOrders = storeOrders.filter((o) => o.status === "COMPLETED");
      const orderItemsPromises = completedOrders.map((o) => storage.getOrderItemsByOrder(o.id));
      const allOrderItems = await Promise.all(orderItemsPromises);
      return { storeProds, completedOrders, allOrderItems };
    });
    const storeDataResults = await Promise.all(storeDataPromises);

    for (const { storeProds, completedOrders, allOrderItems } of storeDataResults) {
      totalProducts += storeProds.length;
      for (let i = 0; i < completedOrders.length; i++) {
        const order = completedOrders[i];
        totalRevenue += order.totalCents;
        totalOrders++;
        const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.totalCents;
        for (const item of allOrderItems[i]) {
          const existing = topProducts.find(p => p.title === item.product.title);
          if (existing) {
            existing.revenue += item.priceCents;
            existing.count++;
          } else {
            topProducts.push({ title: item.product.title, revenue: item.priceCents, count: 1 });
          }
        }
      }
    }

    topProducts.sort((a, b) => b.revenue - a.revenue);

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalStores: userStores.length,
      topProducts: topProducts.slice(0, 5),
      revenueByDate,
    });
  });

  // --- Deep Store Analytics ---

  app.get("/api/store-analytics", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const storeId = req.query.storeId as string;
    const range = (req.query.range as string) || "30d";
    const section = req.query.section as string;

    if (!storeId) return res.status(400).json({ message: "storeId is required" });

    const userStores = await storage.getStoresByOwner(userId);
    if (!userStores.some((s) => s.id === storeId)) {
      return res.status(404).json({ message: "Store not found" });
    }

    try {
      switch (section) {
        case "revenue":
          return res.json(await getRevenueAnalytics(storeId, range));
        case "products":
          return res.json(await getProductAnalytics(storeId, range));
        case "customers":
          return res.json(await getCustomerAnalytics(storeId, range));
        case "coupons":
          return res.json(await getCouponAnalytics(storeId, range));
        case "traffic":
          return res.json(await getTrafficAnalytics(storeId, range));
        default: {
          const [revenue, productsData, customersData, couponsData, traffic] = await Promise.all([
            getRevenueAnalytics(storeId, range),
            getProductAnalytics(storeId, range),
            getCustomerAnalytics(storeId, range),
            getCouponAnalytics(storeId, range),
            getTrafficAnalytics(storeId, range),
          ]);
          return res.json({ revenue, products: productsData, customers: customersData, coupons: couponsData, traffic });
        }
      }
    } catch (err) {
      console.error("Store analytics error:", err);
      return res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // --- Store Customers ---

  app.get("/api/stores/:storeId/customers", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const { storeId } = req.params;
    const userStores = await storage.getStoresByOwner(userId);
    if (!userStores.some((s) => s.id === storeId)) {
      return res.status(404).json({ message: "Store not found" });
    }
    try {
      // Paginated with a hard cap — the aggregate query is expensive on
      // large stores. Response stays a plain array for client back-compat;
      // the full count is exposed via X-Total-Count for future paging UI.
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "500"), 10) || 500, 1), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
      const [customerData, total] = await Promise.all([
        storage.getStoreCustomers(storeId as string, { limit, offset }),
        storage.countStoreCustomers(storeId as string),
      ]);
      res.set("X-Total-Count", String(total));
      return res.json(customerData);
    } catch (err) {
      console.error("Get store customers error:", err);
      return res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.patch("/api/customers/:customerId", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const customerId = req.params.customerId as string;
    const schema = z.object({ name: z.string().min(1).max(200) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid name" });

    const customer = await storage.getCustomerById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const userStores = await storage.getStoresByOwner(userId);
    const storeIds = userStores.map((s) => s.id);
    const storeOrders = await db.select().from(orders).where(
      and(
        sql`${orders.storeId} = ANY(${storeIds})`,
        sql`(${orders.customerId} = ${customerId} OR LOWER(${orders.buyerEmail}) = LOWER(${customer.email}))`
      )
    );
    if (storeOrders.length === 0) return res.status(403).json({ message: "Not your customer" });

    await storage.updateCustomerName(customerId, parsed.data.name);
    return res.json({ ok: true });
  });

  app.get("/api/stores/:storeId/customers/export", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const { storeId } = req.params;
    const userStores = await storage.getStoresByOwner(userId);
    if (!userStores.some((s) => s.id === storeId)) {
      return res.status(404).json({ message: "Store not found" });
    }

    try {
      const ExcelJS = (await import("exceljs")).default;
      const customerData = await storage.getStoreCustomers(storeId as string);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Customers");

      sheet.columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 35 },
        { header: "Total Spent", key: "totalSpent", width: 15 },
        { header: "Orders", key: "orderCount", width: 10 },
        { header: "Last Purchase", key: "lastOrderDate", width: 20 },
        { header: "Products Purchased", key: "products", width: 50 },
        { header: "Customer Since", key: "createdAt", width: 20 },
      ];

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      for (const c of customerData) {
        sheet.addRow({
          name: c.name || "",
          email: c.email,
          totalSpent: `$${(c.totalSpent / 100).toFixed(2)}`,
          orderCount: c.orderCount,
          lastOrderDate: c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "N/A",
          products: (c.products || []).join(", "),
          createdAt: new Date(c.createdAt).toLocaleDateString(),
        });
      }

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("Customer export error:", err);
      return res.status(500).json({ message: "Failed to export customers" });
    }
  });

  // --- Public Event Tracking ---

  app.post("/api/store-events", async (req, res) => {
    const schema = z.object({
      storeId: z.string().min(1).max(100),
      sessionId: z.string().min(1).max(100),
      eventType: z.enum(["page_view", "product_view", "bundle_view", "checkout_start", "add_to_cart"]),
      productId: z.string().max(100).optional(),
      bundleId: z.string().max(100).optional(),
      path: z.string().max(500).optional(),
      referrer: z.string().max(500).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false });

    try {
      await storage.createStoreEvent(parsed.data);
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });

  // --- Public discover ---

  // Single-query stores-with-product-count. Replaces the prior N+1 loop.
  app.get("/api/discover/stores", async (_req, res) => {
    const rows = await storage.getDiscoverStores();
    res.json(rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      templateKey: s.templateKey,
      tagline: s.tagline,
      logoUrl: s.logoUrl,
      customDomain: s.customDomain,
      domainStatus: s.domainStatus,
      productCount: s.productCount,
    })));
  });

  // Newest published products across every live store. Powers /discover.
  // Single JOIN query, no N+1. Limit param caps at 100 to avoid heavy
  // payloads. Returns customDomain on each store so the frontend can link
  // to the seller's branded URL when one is active.
  app.get("/api/discover/products", async (req, res) => {
    const limitParam = parseInt((req.query.limit as string) || "60", 10);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 60 : limitParam, 1), 100);
    const rows = await storage.getDiscoverProducts(limit);

    // Word-boundary truncation so we don't cut mid-word.
    const truncate = (s: string, max: number) => {
      if (s.length <= max) return s;
      const trimmed = s.slice(0, max);
      const lastSpace = trimmed.lastIndexOf(" ");
      return (lastSpace > max * 0.6 ? trimmed.slice(0, lastSpace) : trimmed).trimEnd() + "…";
    };

    res.json(rows.map((r) => ({
      id: r.storeProductId,
      title: r.customTitle || r.title,
      description: truncate(r.customDescription || r.description || "", 140),
      priceCents: r.customPriceCents ?? r.priceCents,
      thumbnailUrl: r.thumbnailUrl,
      productType: r.productType,
      isFeatured: r.isFeatured,
      productSlug: r.productSlug,
      productId: r.productId,
      createdAt: r.productCreatedAt,
      store: {
        id: r.storeId,
        name: r.storeName,
        slug: r.storeSlug,
        logoUrl: r.storeLogoUrl,
        templateKey: r.storeTemplateKey,
        customDomain: r.storeCustomDomain,
        domainStatus: r.storeDomainStatus,
      },
    })));
  });
  // --- Public storefront ---

  app.get("/api/storefront/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const [storeProductRows, publishedBundles, testimonials, faqs, reviews, subscriberCount] = await Promise.all([
      storage.getStoreProducts(store.id),
      storage.getPublishedBundlesByStore(store.id),
      storage.getTestimonialsByStore(store.id),
      storage.getFaqsByStore(store.id),
      store.reviewsEnabled ? storage.getReviewsByStore(store.id) : Promise.resolve([]),
      store.newsletterEnabled && store.showSubscriberCount ? storage.getNewsletterSubscriberCount(store.id) : Promise.resolve(0),
    ]);
    const publishedRows = storeProductRows.filter((sp) => sp.isPublished);
    const productsWithMeta = publishedRows.map((sp) => sanitizeProductForStorefront({
      ...sp.product,
      title: sp.customTitle || sp.product.title,
      description: sp.customDescription || sp.product.description,
      tags: sp.customTags || sp.product.tags,
      accessUrl: sp.customAccessUrl || sp.product.accessUrl,
      priceCents: sp.customPriceCents ?? sp.product.priceCents,
      originalPriceCents: sp.customPriceCents != null && sp.customPriceCents !== sp.product.priceCents ? sp.product.priceCents : sp.product.originalPriceCents,
      isLeadMagnet: sp.isLeadMagnet,
      isFeatured: sp.isFeatured,
      upsellProductId: sp.upsellProductId,
      upsellBundleId: sp.upsellBundleId,
      storeProductId: sp.id,
    }));

    const allBundleItems = await Promise.all(
      publishedBundles.map((b) => storage.getBundleItems(b.id))
    );
    const bundlesWithProducts = publishedBundles.map((b, i) => ({
      ...b,
      products: allBundleItems[i].map((item) => sanitizeProductForStorefront(item.product)),
    }));
    res.json({ store: sanitizeStore(store), products: productsWithMeta, bundles: bundlesWithProducts, testimonials, faqs, reviews, subscriberCount });
  });

  app.post("/api/storefront/:slug/subscribe", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid email" });

    const existing = await storage.getNewsletterSubscriberByEmail(store.id, parsed.data.email);
    if (existing) return res.status(200).json({ message: "Already subscribed" });

    const subscriber = await storage.addNewsletterSubscriber({ storeId: store.id, email: parsed.data.email });
    res.status(201).json({ message: "Subscribed successfully", subscriber });
  });

  // --- Public storefront reviews ---
  app.get("/api/storefront/:slug/reviews", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const productId = req.query.productId as string | undefined;
    const reviews = productId
      ? await storage.getReviewsByProduct(store.id, productId)
      : await storage.getReviewsByStore(store.id);

    const reviewsWithCustomer = await Promise.all(reviews.map(async (r) => {
      const customer = await storage.getCustomerById(r.customerId);
      const customerName = customer?.name || (customer?.email ? customer.email.split("@")[0] : "Customer");
      return { ...r, customerName };
    }));

    // When a productId is given, also include the aggregate so the client
    // can render "4.7 ★ (123 reviews)" without a second round-trip. Also
    // expose the per-store and per-product reviewsEnabled flags so the
    // client knows whether to show the "Write a review" CTA.
    if (productId) {
      const agg = await storage.getProductRatingAggregate(productId);
      const product = await storage.getProductById(productId);
      return res.json({
        reviews: reviewsWithCustomer,
        aggregate: { avgRating: Math.round(agg.avgRating * 10) / 10, count: agg.count },
        reviewsEnabled: !!store.reviewsEnabled && product?.reviewsEnabled !== false,
      });
    }

    res.json(reviewsWithCustomer);
  });

  // --- Buyer review routes ---
  app.post("/api/storefront/:slug/reviews", async (req, res) => {
    const customerAuth = await getCustomerFromCookie(req);
    if (!customerAuth) return res.status(401).json({ message: "Not logged in" });

    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });
    if (!store.reviewsEnabled) return res.status(403).json({ message: "Reviews are not enabled for this store" });

    const schema = z.object({
      productId: z.string(),
      rating: z.number().int().min(1).max(5),
      content: z.string().min(10),
      title: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });

    const parsedProductId = parsed.data.productId;

    // Per-product opt-out: even if the store allows reviews, the owner may
    // have disabled them on this specific product.
    const productForReview = await storage.getProductById(parsedProductId);
    if (!productForReview) return res.status(404).json({ message: "Product not found" });
    if (productForReview.reviewsEnabled === false) {
      return res.status(403).json({ message: "Reviews are disabled for this product." });
    }

    // Verify completed order containing this product
    const customerOrders = await storage.getOrdersByCustomer(customerAuth.customerId);
    const completedOrders = customerOrders.filter((o) => o.storeId === store.id && o.status === "COMPLETED");
    let foundOrderId: string | null = null;
    for (const order of completedOrders) {
      const items = await db.select().from(orderItems).where(
        and(eq(orderItems.orderId, order.id), eq(orderItems.productId, parsedProductId))
      );
      if (items.length > 0) {
        foundOrderId = order.id;
        break;
      }
    }
    if (!foundOrderId) return res.status(403).json({ message: "You must have purchased this product to leave a review" });

    // Check no duplicate
    const existing = await storage.getReviewByCustomerAndProduct(customerAuth.customerId, parsedProductId);
    if (existing) return res.status(409).json({ message: "You have already reviewed this product" });

    const review = await storage.createReview({
      storeId: store.id,
      customerId: customerAuth.customerId,
      orderId: foundOrderId,
      ...parsed.data,
    });
    res.status(201).json(review);
  });

  app.delete("/api/storefront/:slug/reviews/:reviewId", async (req, res) => {
    const customerAuth = await getCustomerFromCookie(req);
    if (!customerAuth) return res.status(401).json({ message: "Not logged in" });

    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const review = await storage.getReviewById(req.params.reviewId as string);
    if (!review || review.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    if (review.customerId !== customerAuth.customerId) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteReview(review.id);
    res.json({ success: true });
  });

  app.get("/api/storefront/:slug/product/:productId", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const productIdOrSlug = req.params.productId as string;
    let sp = await storage.getStoreProductByStoreAndProduct(store.id, productIdOrSlug);
    let product = sp ? await storage.getProductById(productIdOrSlug) : null;

    if (!sp || !product) {
      const [foundBySlug] = await db
        .select({ product: products })
        .from(products)
        .innerJoin(storeProducts, and(eq(storeProducts.productId, products.id), eq(storeProducts.storeId, store.id)))
        .where(and(eq(products.slug, productIdOrSlug), isNull(products.deletedAt)))
        .limit(1);
      if (foundBySlug?.product) {
        sp = await storage.getStoreProductByStoreAndProduct(store.id, foundBySlug.product.id);
        product = foundBySlug.product;
      }
    }

    if (!sp || !sp.isPublished) return res.status(404).json({ message: "Product not found" });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const images = await storage.getProductImages(product.id);
    const effectiveProduct = sanitizeProductForStorefront({
      ...product,
      title: sp.customTitle || product.title,
      description: sp.customDescription || product.description,
      tags: sp.customTags || product.tags,
      accessUrl: sp.customAccessUrl || product.accessUrl,
      priceCents: sp.customPriceCents ?? product.priceCents,
      originalPriceCents: sp.customPriceCents != null && sp.customPriceCents !== product.priceCents ? product.priceCents : product.originalPriceCents,
      isLeadMagnet: sp.isLeadMagnet,
      isFeatured: sp.isFeatured,
      storeProductId: sp.id,
    });

    // Pre-purchase order bump — the seller-configured upsell product,
    // surfaced as an add-on checkbox at the buy button. Only returned if
    // the upsell is a different, published product in this store.
    let orderBump: { productId: string; title: string; priceCents: number; thumbnailUrl: string | null } | null = null;
    if (sp.upsellProductId && sp.upsellProductId !== product.id) {
      const bumpSp = await storage.getStoreProductByStoreAndProduct(store.id, sp.upsellProductId);
      if (bumpSp?.isPublished) {
        const bumpProduct = await storage.getProductById(sp.upsellProductId);
        if (bumpProduct) {
          orderBump = {
            productId: bumpProduct.id,
            title: bumpSp.customTitle || bumpProduct.title,
            priceCents: bumpSp.customPriceCents ?? bumpProduct.priceCents,
            thumbnailUrl: bumpProduct.thumbnailUrl,
          };
        }
      }
    }

    res.json({ store: sanitizeStore(store), product: effectiveProduct, images, orderBump });
  });

  app.get("/api/storefront/:slug/bundle/:bundleId", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const data = await storage.getBundleWithProducts(req.params.bundleId as string);
    if (!data || data.bundle.storeId !== store.id || !data.bundle.isPublished) return res.status(404).json({ message: "Bundle not found" });

    res.json({ store: sanitizeStore(store), bundle: data.bundle, products: data.products.map(sanitizeProductForStorefront) });
  });

  // --- Embed endpoints ---

  app.get("/api/embed/:slug/product/:productId", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const sp = await storage.getStoreProductByStoreAndProduct(store.id, req.params.productId as string);
    if (!sp || !sp.isPublished) return res.status(404).json({ message: "Product not found" });

    const product = await storage.getProductById(req.params.productId as string);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({
      type: "product",
      store: { name: store.name, slug: store.slug, accentColor: store.accentColor, templateKey: store.templateKey },
      item: {
        id: product.id,
        title: sp.customTitle || product.title,
        description: sp.customDescription || product.description,
        priceCents: sp.customPriceCents ?? product.priceCents,
        originalPriceCents: sp.customPriceCents != null && sp.customPriceCents !== product.priceCents ? product.priceCents : product.originalPriceCents,
        thumbnailUrl: product.thumbnailUrl,
        isLeadMagnet: sp.isLeadMagnet,
      },
    });
  });

  app.get("/api/embed/:slug/bundle/:bundleId", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const data = await storage.getBundleWithProducts(req.params.bundleId as string);
    if (!data || data.bundle.storeId !== store.id || !data.bundle.isPublished)
      return res.status(404).json({ message: "Bundle not found" });

    res.json({
      type: "bundle",
      store: { name: store.name, slug: store.slug, accentColor: store.accentColor, templateKey: store.templateKey },
      item: {
        id: data.bundle.id,
        name: data.bundle.name,
        description: data.bundle.description,
        priceCents: data.bundle.priceCents,
        thumbnailUrl: data.bundle.thumbnailUrl,
        productCount: data.products.length,
      },
    });
  });

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch {
      res.json({ publishableKey: null });
    }
  });


  app.get("/api/marketing/strategies", isAuthenticated, async (_req, res) => {
    const allStrategies = await db.select().from(marketingStrategies).orderBy(marketingStrategies.category, marketingStrategies.sortOrder);
    res.json(allStrategies);
  });

  app.get("/api/marketing/progress/:storeId", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const storeId = req.params.storeId as string;
    const store = await storage.getStoreById(storeId);
    if (!store || store.ownerId !== userId) {
      return res.status(403).json({ message: "Not your store" });
    }
    const progress = await db.select().from(storeStrategyProgress).where(eq(storeStrategyProgress.storeId, storeId));
    res.json(progress);
  });

  app.patch("/api/marketing/progress/:storeId/:strategyId", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const storeId = req.params.storeId as string;
    const strategyId = req.params.strategyId as string;
    const store = await storage.getStoreById(storeId);
    if (!store || store.ownerId !== userId) {
      return res.status(403).json({ message: "Not your store" });
    }

    const { status } = req.body as { status: "not_started" | "in_progress" | "completed" };
    if (!["not_started", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existing = await db.select().from(storeStrategyProgress)
      .where(and(
        eq(storeStrategyProgress.storeId, storeId),
        eq(storeStrategyProgress.strategyId, strategyId),
      ));

    if (existing.length > 0) {
      await db.update(storeStrategyProgress)
        .set({ status, updatedAt: new Date() })
        .where(eq(storeStrategyProgress.id, existing[0].id));
    } else {
      await db.insert(storeStrategyProgress).values({
        storeId,
        strategyId,
        status,
      });
    }

    res.json({ success: true });
  });

  // Domain API routes (Cloudflare for SaaS)
  app.post("/api/domains/connect", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        storeId: z.string().min(1),
        domain: z.string().min(1).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i, "Invalid domain format"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid domain format" });

      const store = await storage.getStoreById(parsed.data.storeId);
      if (!store || store.ownerId !== getUserId(req)) {
        return res.status(404).json({ message: "Store not found" });
      }

      if (!isCloudflareConfigured()) {
        return res.status(500).json({ message: "Custom domains are not configured yet. Please contact support." });
      }

      const [existingStore] = await db.select({ id: stores.id, slug: stores.slug }).from(stores)
        .where(and(eq(stores.customDomain, parsed.data.domain), isNull(stores.deletedAt)))
        .limit(1);
      if (existingStore && existingStore.id !== store.id) {
        return res.status(409).json({ message: "This domain is already connected to another store." });
      }

      const cfResult = await createCustomHostname(parsed.data.domain);

      const routeId = await createWorkerRoute(`${parsed.data.domain}/*`);

      await db.update(stores).set({
        customDomain: parsed.data.domain,
        domainStatus: "pending_dns",
        domainSource: "cloudflare",
        cloudflareHostnameId: cfResult.id,
        workerRouteId: routeId,
      }).where(eq(stores.id, store.id));

      res.json({
        success: true,
        cloudflareStatus: cfResult.status,
        sslStatus: cfResult.sslStatus,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/domains/verify/:storeId", isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.storeId as string;
      const store = await storage.getStoreById(storeId);
      if (!store || store.ownerId !== getUserId(req)) {
        return res.status(404).json({ message: "Store not found" });
      }

      if (!store.customDomain || !store.cloudflareHostnameId) {
        return res.status(400).json({ message: "No custom domain configured" });
      }

      const cfResult = await getCustomHostname(store.cloudflareHostnameId);
      const isActive = cfResult.status === "active" && cfResult.sslStatus === "active";

      let newStatus = store.domainStatus;
      if (isActive) {
        newStatus = "active";
      } else if (cfResult.status === "pending" || cfResult.status === "active") {
        newStatus = "verifying";
      } else if (cfResult.status === "moved" || cfResult.status === "deleted") {
        newStatus = "failed";
      } else {
        newStatus = "pending_dns";
      }

      const updateData: any = { domainStatus: newStatus };
      if (isActive && !store.domainVerifiedAt) {
        updateData.domainVerifiedAt = new Date();
      }
      await db.update(stores).set(updateData).where(eq(stores.id, store.id));

      res.json({
        verified: isActive,
        hostnameStatus: cfResult.status,
        sslStatus: cfResult.sslStatus,
        verificationErrors: cfResult.verificationErrors,
        domainStatus: newStatus,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/domains/:storeId", isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.storeId as string;
      const store = await storage.getStoreById(storeId);
      if (!store || store.ownerId !== getUserId(req)) {
        return res.status(404).json({ message: "Store not found" });
      }

      if (store.cloudflareHostnameId) {
        try {
          await deleteCustomHostname(store.cloudflareHostnameId);
        } catch (cfErr: any) {
          console.error("Failed to delete Cloudflare hostname:", cfErr.message);
        }
      }

      if ((store as any).workerRouteId) {
        try {
          await deleteWorkerRoute((store as any).workerRouteId);
        } catch (routeErr: any) {
          console.error("Failed to delete Worker route:", routeErr.message);
        }
      }

      await db.update(stores).set({
        customDomain: null,
        domainStatus: null,
        domainSource: null,
        domainVerifiedAt: null,
        cloudflareHostnameId: null,
        workerRouteId: null,
      }).where(eq(stores.id, store.id));

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/domains/:storeId", isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.storeId as string;
      const store = await storage.getStoreById(storeId);
      if (!store || store.ownerId !== getUserId(req)) {
        return res.status(404).json({ message: "Store not found" });
      }

      res.json({
        domain: store.customDomain,
        status: store.domainStatus,
        source: store.domainSource,
        verifiedAt: store.domainVerifiedAt,
        cloudflareHostnameId: store.cloudflareHostnameId,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/test-emails", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const profile = await storage.getUserProfile(userId);
    if (!profile?.isAdmin) return res.status(403).json({ message: "Admin access required" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email address required" });

    const baseUrl = getAppUrl(req);
    const results = await sendAllTestEmails(email, baseUrl);
    res.json({ results });
  });

  app.get("/api/admin/email-logs", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const profile = await storage.getUserProfile(userId);
    if (!profile?.isAdmin) return res.status(403).json({ message: "Admin access required" });

    const statusFilter = (req.query.status as string | undefined)?.toLowerCase();
    const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10) || 100, 500);

    const where = statusFilter === "failed" || statusFilter === "sent"
      ? eq(emailLogs.status, statusFilter as "sent" | "failed")
      : undefined;

    const logs = await db
      .select()
      .from(emailLogs)
      .where(where as any)
      .orderBy(sql`${emailLogs.sentAt} DESC`)
      .limit(limit);
    res.json(logs);
  });

  // ── Email suppression list (bounces, complaints, manual unsubscribes) ──

  app.get("/api/admin/email-suppression", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const rows = await db.select().from(emailSuppression).orderBy(sql`${emailSuppression.suppressedAt} DESC`).limit(500);
    res.json(rows);
  });

  app.delete("/api/admin/email-suppression/:email", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const email = decodeURIComponent(req.params.email as string);
    await storage.unsuppressEmail(email);
    res.json({ ok: true });
  });

  app.get("/api/admin/health-check", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const report = await runHealthCheck();
    res.json(report);
  });

  // Queue health snapshot — admin-only. Returns waiting/active/completed/
  // failed counts per BullMQ queue. Hits Redis directly so this works
  // even when no workers are running.
  app.get("/api/admin/queue-health", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    if (!process.env.REDIS_URL) {
      return res.json({ enabled: false, message: "REDIS_URL not set — queues disabled" });
    }
    try {
      const { gumroadImportQueue, gumroadWelcomeEmailsQueue } = await import("./queue/queues");
      const queues = [
        { name: "gumroad-import", q: gumroadImportQueue },
        { name: "gumroad-welcome-emails", q: gumroadWelcomeEmailsQueue },
      ];
      const stats = await Promise.all(
        queues.map(async ({ name, q }) => {
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            q.getWaitingCount(),
            q.getActiveCount(),
            q.getCompletedCount(),
            q.getFailedCount(),
            q.getDelayedCount(),
          ]);
          return { name, waiting, active, completed, failed, delayed };
        }),
      );
      res.json({ enabled: true, queues: stats });
    } catch (err: any) {
      res.status(500).json({ enabled: true, error: err.message });
    }
  });

  app.post("/api/admin/repair", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const result = await runRepair();
    res.json(result);
  });

  app.get("/api/admin/deleted-products", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const deleted = await storage.getDeletedProducts();
    res.json(deleted);
  });

  app.get("/api/admin/deleted-stores", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const deleted = await storage.getDeletedStores();
    res.json(deleted);
  });

  app.post("/api/admin/restore-product/:id", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const product = await storage.restoreProduct(req.params.id as string);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post("/api/admin/restore-store/:id", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const store = await storage.restoreStore(req.params.id as string);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  });

  return httpServer;
}
