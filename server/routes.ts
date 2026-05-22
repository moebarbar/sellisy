import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { db } from "./db";
import { affiliateCommissions, orders, orderItems, downloadTokens, coupons, customers, products, storeProducts, marketingStrategies, storeStrategyProgress, stores, storeReviews, PLAN_FEATURES, canAccessTier, type PlanTier } from "@shared/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { createCustomHostname, getCustomHostname, deleteCustomHostname, createWorkerRoute, deleteWorkerRoute, isCloudflareConfigured } from "./cloudflareClient";
import { seedDatabase, seedMarketingIfNeeded, seedAdminUser } from "./seed";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import Stripe from 'stripe';
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
import { encryptPaymentSecret, decryptPaymentSecret } from "./crypto/payment-secret";
import { WebhookHandlers } from "./webhookHandlers";
import { watermarkPdf, isPdfFilename, isPdfContentType } from "./pdfWatermark";


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

# Block aggressive AI/SEO scrapers (allowlist only good citizens).
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: anthropic-ai
Disallow: /
User-agent: ClaudeBot
Disallow: /
User-agent: PerplexityBot
Disallow: /
User-agent: ImagesiftBot
Disallow: /
User-agent: Bytespider
Disallow: /

Sitemap: ${siteUrl}/sitemap.xml`);
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

  app.get("/api/stores", isAuthenticated, async (req, res) => {
    const stores = await storage.getStoresByOwner(getUserId(req));
    res.json(stores.map(sanitizeStore));
  });

  app.get("/api/stores/:id", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json(sanitizeStore(store));
  });

  app.post("/api/stores", isAuthenticated, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
      templateKey: z.enum(["neon", "silk", "aurora", "ember", "frost", "midnight", "launch"]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid store data" });

    const userId = getUserId(req);
    const tier = await getUserPlanTier(userId);
    const features = PLAN_FEATURES[tier];
    const currentStores = await storage.getStoresByOwner(userId);
    if (currentStores.length >= features.maxStores) {
      return res.status(403).json({ message: `Your ${tier} plan allows up to ${features.maxStores} store(s). Upgrade to create more.` });
    }

    const existing = await storage.getStoreBySlug(parsed.data.slug);
    if (existing) return res.status(409).json({ message: "Slug already taken" });

    const store = await storage.createStore({
      ownerId: userId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      templateKey: parsed.data.templateKey,
    });
    res.json(store);
  });

  app.patch("/api/stores/:id", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
      templateKey: z.enum(["neon", "silk", "aurora", "ember", "frost", "midnight", "launch"]).optional(),
      tagline: z.string().max(200).optional().nullable(),
      logoUrl: z.string().max(500).optional().nullable(),
      accentColor: z.string().max(20).optional().nullable(),
      heroBannerUrl: z.string().max(500).optional().nullable(),
      paymentProvider: z.enum(["stripe", "paypal"]).optional(),
      paypalClientId: z.string().max(200).optional().nullable(),
      paypalClientSecret: z.string().max(200).optional().nullable(),
      stripePublishableKey: z.string().max(200).refine(v => !v || v.startsWith("pk_"), { message: "Publishable key must start with pk_" }).optional().nullable(),
      stripeSecretKey: z.string().max(200).refine(v => !v || v.startsWith("sk_"), { message: "Secret key must start with sk_" }).optional().nullable(),
      blogEnabled: z.boolean().optional(),
      announcementText: z.string().max(500).optional().nullable(),
      announcementLink: z.string().max(500).optional().nullable(),
      footerText: z.string().max(500).optional().nullable(),
      socialTwitter: z.string().max(100).optional().nullable(),
      socialInstagram: z.string().max(100).optional().nullable(),
      socialYoutube: z.string().max(200).optional().nullable(),
      socialTiktok: z.string().max(100).optional().nullable(),
      socialWebsite: z.string().max(500).optional().nullable(),
      faviconUrl: z.string().max(500).optional().nullable(),
      seoTitle: z.string().max(200).optional().nullable(),
      seoDescription: z.string().max(500).optional().nullable(),
      allowImageDownload: z.boolean().optional(),
      aboutEnabled: z.boolean().optional(),
      aboutHeadline: z.string().max(200).optional().nullable(),
      aboutText: z.string().max(5000).optional().nullable(),
      aboutImageUrl: z.string().max(500).optional().nullable(),
      aboutCtaText: z.string().max(100).optional().nullable(),
      aboutCtaUrl: z.string().max(500).optional().nullable(),
      testimonialsEnabled: z.boolean().optional(),
      faqEnabled: z.boolean().optional(),
      newsletterEnabled: z.boolean().optional(),
      newsletterHeadline: z.string().max(200).optional().nullable(),
      newsletterSubtext: z.string().max(500).optional().nullable(),
      sectionOrder: z.string().max(500).optional().nullable(),
      reviewsEnabled: z.boolean().optional(),
      stripeTaxEnabled: z.boolean().optional(),
      pdfWatermarkEnabled: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    if (parsed.data.slug && parsed.data.slug !== store.slug) {
      const existing = await storage.getStoreBySlug(parsed.data.slug);
      if (existing) return res.status(409).json({ message: "Slug already taken" });
    }

    // Encrypt payment secrets before persisting. encryptPaymentSecret is a
    // no-op on empty/already-encrypted values, so it's safe to apply
    // unconditionally when the field is present in the request body.
    const toUpdate = { ...parsed.data };
    if (typeof toUpdate.stripeSecretKey === "string" && toUpdate.stripeSecretKey) {
      toUpdate.stripeSecretKey = encryptPaymentSecret(toUpdate.stripeSecretKey);
    }
    if (typeof toUpdate.paypalClientSecret === "string" && toUpdate.paypalClientSecret) {
      toUpdate.paypalClientSecret = encryptPaymentSecret(toUpdate.paypalClientSecret);
    }

    const updated = await storage.updateStore(store.id, toUpdate);
    res.json(sanitizeStore(updated));
  });

  app.delete("/api/stores/:id", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    await storage.deleteStore(store.id, getUserId(req));
    res.json({ success: true });
  });

  // --- Storefront Sections (Testimonials) ---
  app.get("/api/stores/:id/testimonials", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    res.json(await storage.getTestimonialsByStore(store.id));
  });

  app.post("/api/stores/:id/testimonials", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const schema = z.object({
      name: z.string().min(1).max(100),
      role: z.string().max(100).optional(),
      quote: z.string().min(1).max(1000),
      avatarUrl: z.string().max(500).optional(),
      sortOrder: z.number().optional().default(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createTestimonial({ storeId: store.id, ...parsed.data }));
  });

  app.patch("/api/stores/:id/testimonials/:testimonialId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const schema = z.object({
      name: z.string().max(100).optional(),
      role: z.string().max(100).optional().nullable(),
      quote: z.string().max(1000).optional(),
      avatarUrl: z.string().max(500).optional().nullable(),
      sortOrder: z.number().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const testimonial = await storage.getTestimonialById(req.params.testimonialId as string);
    if (!testimonial || testimonial.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    const updated = await storage.updateTestimonial(testimonial.id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/stores/:id/testimonials/:testimonialId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const testimonial = await storage.getTestimonialById(req.params.testimonialId as string);
    if (!testimonial || testimonial.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    await storage.deleteTestimonial(testimonial.id);
    res.json({ success: true });
  });

  // --- Storefront Sections (FAQs) ---
  app.get("/api/stores/:id/faqs", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    res.json(await storage.getFaqsByStore(store.id));
  });

  app.post("/api/stores/:id/faqs", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const schema = z.object({
      question: z.string().min(1).max(300),
      answer: z.string().min(1).max(5000),
      sortOrder: z.number().optional().default(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.status(201).json(await storage.createFaq({ storeId: store.id, ...parsed.data }));
  });

  app.patch("/api/stores/:id/faqs/:faqId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const schema = z.object({
      question: z.string().max(300).optional(),
      answer: z.string().max(5000).optional(),
      sortOrder: z.number().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const faq = await storage.getFaqById(req.params.faqId as string);
    if (!faq || faq.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    const updated = await storage.updateFaq(faq.id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/stores/:id/faqs/:faqId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const faq = await storage.getFaqById(req.params.faqId as string);
    if (!faq || faq.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    await storage.deleteFaq(faq.id);
    res.json({ success: true });
  });

  // --- Storefront Sections (Reviews — Owner routes) ---
  app.get("/api/stores/:id/reviews", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const reviews = await storage.getReviewsByStore(store.id);
    // Attach product titles
    const reviewsWithProduct = await Promise.all(reviews.map(async (r) => {
      const product = await storage.getProductById(r.productId);
      return { ...r, productTitle: product?.title || null };
    }));
    res.json(reviewsWithProduct);
  });

  app.delete("/api/stores/:id/reviews/:reviewId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const review = await storage.getReviewById(req.params.reviewId as string);
    if (!review || review.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    await storage.deleteReview(review.id);
    res.json({ success: true });
  });

  // --- Newsletter Campaigns ---

  app.get("/api/stores/:id/newsletter-campaigns", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaigns = await storage.getCampaignsByStore(store.id);
    res.json(campaigns);
  });

  app.post("/api/stores/:id/newsletter-campaigns", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const schema = z.object({ subject: z.string().min(1).max(200) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Subject is required" });
    const campaign = await storage.createCampaign({ storeId: store.id, subject: parsed.data.subject });
    res.json(campaign);
  });

  app.patch("/api/stores/:id/newsletter-campaigns/:campaignId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
    const schema = z.object({ subject: z.string().min(1).max(200).optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const updated = await storage.updateCampaign(campaign.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/stores/:id/newsletter-campaigns/:campaignId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    await storage.deleteCampaign(campaign.id);
    res.json({ success: true });
  });

  app.get("/api/stores/:id/newsletter-campaigns/:campaignId/blocks", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    const blocks = await storage.getBlocksByCampaign(campaign.id);
    res.json(blocks);
  });

  app.post("/api/stores/:id/newsletter-campaigns/:campaignId/blocks", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
    const schema = z.object({
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
      content: z.string().optional(),
      sortOrder: z.number().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid block data" });
    const block = await storage.createCampaignBlock({ campaignId: campaign.id, ...parsed.data });
    res.json(block);
  });

  app.patch("/api/stores/:id/newsletter-campaigns/:campaignId/blocks/:blockId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
    const schema = z.object({
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
      content: z.string().optional(),
      sortOrder: z.number().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid block data" });
    const updated = await storage.updateCampaignBlock(req.params.blockId as string, parsed.data);
    res.json(updated);
  });

  app.delete("/api/stores/:id/newsletter-campaigns/:campaignId/blocks/:blockId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
    await storage.deleteCampaignBlock(req.params.blockId as string);
    res.json({ success: true });
  });

  app.post("/api/stores/:id/newsletter-campaigns/:campaignId/send", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const campaign = await storage.getCampaignById(req.params.campaignId as string);
    if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
    if (campaign.status === "sent") return res.status(400).json({ message: "Campaign already sent" });

    const subscribers = await storage.getNewsletterSubscribers(store.id);
    if (subscribers.length === 0) return res.status(400).json({ message: "No subscribers to send to" });

    const blocks = await storage.getBlocksByCampaign(campaign.id);

    // Render blocks to HTML
    const blocksHtml = blocks.map(block => {
      const text = block.content || "";
      switch (block.type) {
        case "heading1": return `<h1 style="margin:0 0 16px;color:#111827;font-size:28px;font-weight:700;">${text}</h1>`;
        case "heading2": return sectionHeading(text);
        case "heading3": return `<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;font-weight:600;">${text}</h3>`;
        case "divider": return divider();
        case "image": return `<img src="${text}" alt="" style="max-width:100%;border-radius:8px;margin:16px 0;">`;
        case "link": {
          const [label, url] = text.split("|");
          return url ? ctaButton(label, url) : bodyText(`<a href="${label}" style="color:#6366f1;">${label}</a>`);
        }
        case "quote": return `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #6366f1;background:#f5f3ff;color:#374151;font-style:italic;">${text}</blockquote>`;
        case "callout": return `<div style="margin:16px 0;padding:16px;border-radius:8px;background:#fffbeb;border:1px solid #fde68a;color:#374151;">${text}</div>`;
        default: return bodyText(text);
      }
    }).join("\n");

    const html = baseLayout(
      `${sectionHeading(campaign.subject)}\n${blocksHtml}`,
      campaign.subject
    );

    // Send staggered to all subscribers
    const emails = subscribers.map(s => ({ to: s.email, subject: campaign.subject, html }));
    await sendEmailStaggered(emails);

    await storage.updateCampaign(campaign.id, {
      status: "sent",
      sentAt: new Date(),
      recipientCount: subscribers.length,
    });

    res.json({ sent: subscribers.length });
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
      const customerData = await storage.getStoreCustomers(storeId as string);
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

  app.get("/api/discover/stores", async (_req, res) => {
    const allStores = await storage.getAllPublicStores();
    const storesWithCounts = await Promise.all(
      allStores.map(async (store) => {
        const publishedProducts = await storage.getPublishedStoreProducts(store.id);
        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          templateKey: store.templateKey,
          tagline: store.tagline,
          logoUrl: store.logoUrl,
          productCount: publishedProducts.length,
        };
      })
    );
    res.json(storesWithCounts.filter(s => s.productCount > 0));
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
    res.json({ store: sanitizeStore(store), product: effectiveProduct, images });
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
