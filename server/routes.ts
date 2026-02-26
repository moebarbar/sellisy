import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { db } from "./db";
import { orders, orderItems, downloadTokens, coupons, customers, products, storeProducts, marketingStrategies, storeStrategyProgress, stores, PLAN_FEATURES, canAccessTier, type PlanTier } from "@shared/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { createCustomHostname, getCustomHostname, deleteCustomHostname, isCloudflareConfigured } from "./cloudflareClient";
import { seedDatabase, seedMarketingIfNeeded, seedAdminUser } from "./seed";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import Stripe from 'stripe';
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sendOrderConfirmationEmail, sendDownloadLinkEmail, sendLeadMagnetEmail, sendNewOrderNotificationEmail, sendMagicLinkEmail, sendAllTestEmails } from "./emails";
import { sendOrderCompletionEmails } from "./orderEmailHelper";
import { setEmailLogger } from "./sendgridClient";
import { runHealthCheck, runRepair } from "./integrity";
import { getRevenueAnalytics, getProductAnalytics, getCustomerAnalytics, getCouponAnalytics, getTrafficAnalytics } from "./analytics";
import { users } from "@shared/models/auth";
import { emailLogs } from "@shared/schema";
import cookieParser from "cookie-parser";

function getUserId(req: Request): string {
  return (req as any).session?.userId;
}

function sanitizeStore(store: any) {
  const { paypalClientSecret, stripeSecretKey, ...safe } = store;
  return {
    ...safe,
    paypalClientSecret: paypalClientSecret ? "***configured***" : null,
    stripeSecretKey: stripeSecretKey ? "***configured***" : null,
  };
}

function sanitizeProductForStorefront(product: any) {
  const { fileUrl, redemptionCode, deliveryInstructions, ...safe } = product;
  return safe;
}

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const isLive = clientId.startsWith("A") && clientId.length > 50;
  const baseUrl = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const resp = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayPal auth failed: ${resp.status} ${text}`);
  }
  const data = await resp.json() as any;
  return data.access_token;
}

function getPayPalBaseUrl(clientId: string): string {
  const isLive = clientId.startsWith("A") && clientId.length > 50;
  return isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function createPayPalOrder(
  clientId: string,
  clientSecret: string,
  totalCents: number,
  itemName: string,
  orderId: string,
  storeId: string,
  storeSlug: string,
  appUrl: string,
): Promise<{ approveUrl: string; paypalOrderId: string }> {
  const accessToken = await getPayPalAccessToken(clientId, clientSecret);
  const baseUrl = getPayPalBaseUrl(clientId);
  const totalUsd = (totalCents / 100).toFixed(2);

  const resp = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: orderId,
        description: itemName.substring(0, 127),
        amount: {
          currency_code: "USD",
          value: totalUsd,
        },
      }],
      application_context: {
        return_url: `${appUrl}/api/paypal/capture?orderId=${orderId}&storeSlug=${storeSlug}`,
        cancel_url: `${appUrl}/s/${storeSlug}`,
        brand_name: itemName.substring(0, 127),
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayPal create order failed: ${resp.status} ${text}`);
  }

  const paypalOrder = await resp.json() as any;
  const approveLink = paypalOrder.links?.find((l: any) => l.rel === "approve");
  if (!approveLink) throw new Error("PayPal approve link not found");
  return { approveUrl: approveLink.href, paypalOrderId: paypalOrder.id };
}

async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const profile = await storage.getUserProfile(userId);
  return (profile?.planTier as PlanTier) || "basic";
}

async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await storage.getUserProfile(userId);
  return profile?.isAdmin ?? false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);
  app.use(cookieParser());

  app.use(async (req, res, next) => {
    const hostname = req.hostname;
    if (!hostname || hostname === "localhost" || hostname.includes("replit") || /^\d+\./.test(hostname)) {
      return next();
    }
    try {
      const [store] = await db.select().from(stores).where(and(eq(stores.customDomain, hostname), eq(stores.domainStatus, "active"))).limit(1);
      if (store) {
        if (req.path === "/" || req.path === "") {
          req.url = "/s/" + store.slug;
        }
      }
    } catch (err) {
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

  await seedDatabase();
  await seedMarketingIfNeeded();
  await seedAdminUser();

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    let profile = await storage.getUserProfile(userId);
    if (!profile) {
      profile = await storage.upsertUserProfile({ userId, planTier: "basic", isAdmin: false });
    }
    const tier = profile.planTier as PlanTier;
    res.json({
      ...profile,
      features: PLAN_FEATURES[tier],
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
    const profile = await storage.updateUserPlan(req.params.userId as string, parsed.data.planTier);
    res.json(profile);
  });

  app.patch("/api/admin/user/:userId/admin", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const schema = z.object({ isAdmin: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const profile = await storage.setUserAdmin(req.params.userId as string, parsed.data.isAdmin);
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
      name: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      templateKey: z.enum(["neon", "silk", "aurora", "ember", "frost", "midnight"]),
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
      name: z.string().min(1).optional(),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
      templateKey: z.enum(["neon", "silk", "aurora", "ember", "frost", "midnight"]).optional(),
      tagline: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
      accentColor: z.string().optional().nullable(),
      heroBannerUrl: z.string().optional().nullable(),
      paymentProvider: z.enum(["stripe", "paypal"]).optional(),
      paypalClientId: z.string().optional().nullable(),
      paypalClientSecret: z.string().optional().nullable(),
      stripePublishableKey: z.string().refine(v => !v || v.startsWith("pk_"), { message: "Publishable key must start with pk_" }).optional().nullable(),
      stripeSecretKey: z.string().refine(v => !v || v.startsWith("sk_"), { message: "Secret key must start with sk_" }).optional().nullable(),
      blogEnabled: z.boolean().optional(),
      announcementText: z.string().optional().nullable(),
      announcementLink: z.string().optional().nullable(),
      footerText: z.string().optional().nullable(),
      socialTwitter: z.string().optional().nullable(),
      socialInstagram: z.string().optional().nullable(),
      socialYoutube: z.string().optional().nullable(),
      socialTiktok: z.string().optional().nullable(),
      socialWebsite: z.string().optional().nullable(),
      faviconUrl: z.string().optional().nullable(),
      seoTitle: z.string().optional().nullable(),
      seoDescription: z.string().optional().nullable(),
      allowImageDownload: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    if (parsed.data.slug && parsed.data.slug !== store.slug) {
      const existing = await storage.getStoreBySlug(parsed.data.slug);
      if (existing) return res.status(409).json({ message: "Slug already taken" });
    }

    const updated = await storage.updateStore(store.id, parsed.data);
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

  app.get("/api/categories", isAuthenticated, async (req, res) => {
    const cats = await storage.ensureDefaultCategories(getUserId(req));
    res.json(cats);
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).max(50),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid category" });
    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await storage.getCategoriesByOwner(getUserId(req));
    if (existing.some((c) => c.slug === slug)) {
      return res.status(409).json({ message: "Category already exists" });
    }
    const cat = await storage.createCategory({
      ownerId: getUserId(req),
      name: parsed.data.name,
      slug,
      sortOrder: existing.length,
    });
    res.json(cat);
  });

  app.patch("/api/categories/:id", isAuthenticated, async (req, res) => {
    const cats = await storage.getCategoriesByOwner(getUserId(req));
    const cat = cats.find((c) => c.id === req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    const schema = z.object({
      name: z.string().min(1).max(50).optional(),
      sortOrder: z.number().int().min(0).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const data: any = {};
    if (parsed.data.name) {
      data.name = parsed.data.name;
      data.slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;
    const updated = await storage.updateCategory(cat.id, data);
    res.json(updated);
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    const cats = await storage.getCategoriesByOwner(getUserId(req));
    const cat = cats.find((c) => c.id === req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    await storage.deleteCategory(cat.id);
    res.json({ success: true });
  });

  app.get("/api/products/library", isAuthenticated, async (_req, res) => {
    const library = await storage.getLibraryProducts();
    res.json(library);
  });

  app.post("/api/products/:id/promote", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });

    const productId = req.params.id as string;
    const product = await storage.getProductById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.source === "PLATFORM") return res.status(400).json({ message: "Product is already a platform product" });

    await db.update(products).set({ source: "PLATFORM" }).where(eq(products.id, productId));
    const updated = await storage.getProductById(productId);
    if (updated && !updated.ownerId) {
      console.error(`[GUARD] Promote route stripped ownerId from product ${productId} — reverting`);
      await db.update(products).set({ ownerId: product.ownerId }).where(eq(products.id, productId));
    }
    res.json(updated);
  });

  app.post("/api/products/bulk-import", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });

    const imageSchema = z.object({
      url: z.string().min(1),
      sortOrder: z.number().int().min(0),
      isPrimary: z.boolean(),
    });
    const rowSchema = z.object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      priceCents: z.number().int().min(0),
      originalPriceCents: z.number().int().min(0).optional().nullable(),
      thumbnailUrl: z.string().optional().nullable(),
      fileUrl: z.string().optional().nullable(),
      productType: z.enum(["digital", "software", "template", "ebook", "course", "graphics"]).optional(),
      deliveryInstructions: z.string().optional().nullable(),
      accessUrl: z.string().optional().nullable(),
      redemptionCode: z.string().optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
      images: z.array(imageSchema).optional(),
    });
    const schema = z.object({ products: z.array(rowSchema).min(1).max(500) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });

    const results: { created: number; errors: { row: number; message: string }[] } = { created: 0, errors: [] };
    for (let i = 0; i < parsed.data.products.length; i++) {
      const row = parsed.data.products[i];
      try {
        const imgs = row.images || [];
        const primaryImg = imgs.find((img) => img.isPrimary) || imgs[0];
        const thumbUrl = primaryImg?.url ?? row.thumbnailUrl ?? null;

        const product = await storage.createProduct({
          ownerId: getUserId(req),
          source: "USER",
          title: row.title,
          description: row.description || null,
          category: row.category || "templates",
          priceCents: row.priceCents,
          originalPriceCents: row.originalPriceCents ?? null,
          thumbnailUrl: thumbUrl,
          fileUrl: row.fileUrl ?? null,
          status: "ACTIVE",
          productType: row.productType || "digital",
          deliveryInstructions: row.deliveryInstructions ?? null,
          accessUrl: row.accessUrl ?? null,
          redemptionCode: row.redemptionCode ?? null,
          tags: row.tags ?? null,
        });

        if (imgs.length > 0) {
          await storage.setProductImages(product.id, imgs);
        }

        results.created++;
      } catch (err: any) {
        results.errors.push({ row: i + 1, message: err.message });
      }
    }
    res.json(results);
  });

  app.delete("/api/products/bulk", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const schema = z.object({ ids: z.array(z.string()).min(1).max(500) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    let deleted = 0;
    const skipped: string[] = [];
    for (const id of parsed.data.ids) {
      try {
        const product = await storage.getProductById(id);
        if (!product) { skipped.push(id); continue; }
        await storage.deleteProduct(id);
        deleted++;
      } catch { skipped.push(id); }
    }
    if (skipped.length > 0) console.warn(`[GUARD] Bulk delete skipped ${skipped.length} product(s): not found or error`);
    res.json({ deleted, skipped: skipped.length });
  });

  app.patch("/api/products/bulk-status", isAuthenticated, async (req, res) => {
    const admin = await isUserAdmin(getUserId(req));
    if (!admin) return res.status(403).json({ message: "Admin access required" });
    const schema = z.object({
      ids: z.array(z.string()).min(1).max(500),
      status: z.enum(["DRAFT", "ACTIVE"]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    let updated = 0;
    for (const id of parsed.data.ids) {
      try {
        const product = await storage.getProductById(id);
        if (!product) continue;
        await db.update(products).set({ status: parsed.data.status }).where(and(eq(products.id, id), isNull(products.deletedAt)));
        updated++;
      } catch {}
    }
    res.json({ updated });
  });

  app.get("/api/products/mine", isAuthenticated, async (req, res) => {
    const prods = await storage.getProductsByOwner(getUserId(req));
    res.json(prods);
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    const imageSchema = z.object({
      url: z.string().min(1),
      sortOrder: z.number().int().min(0),
      isPrimary: z.boolean(),
    });
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      tagline: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      priceCents: z.number().int().min(0),
      originalPriceCents: z.number().int().min(0).optional().nullable(),
      thumbnailUrl: z.string().optional().nullable(),
      fileUrl: z.string().optional().nullable(),
      status: z.enum(["DRAFT", "ACTIVE"]).optional(),
      productType: z.enum(["digital", "software", "template", "ebook", "course", "graphics"]).optional(),
      deliveryInstructions: z.string().optional().nullable(),
      accessUrl: z.string().optional().nullable(),
      redemptionCode: z.string().optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
      highlights: z.array(z.string()).optional().nullable(),
      version: z.string().optional().nullable(),
      fileSize: z.string().optional().nullable(),
      requiredTier: z.enum(["basic", "pro", "max"]).optional(),
      images: z.array(imageSchema).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid product data" });

    const imgs = parsed.data.images || [];
    const primaryImg = imgs.find((i) => i.isPrimary) || imgs[0];
    const thumbUrl = primaryImg?.url ?? parsed.data.thumbnailUrl ?? null;

    const admin = await isUserAdmin(getUserId(req));
    const product = await storage.createProduct({
      ownerId: getUserId(req),
      source: "USER",
      title: parsed.data.title,
      description: parsed.data.description || null,
      tagline: parsed.data.tagline ?? null,
      category: parsed.data.category || "templates",
      priceCents: parsed.data.priceCents,
      originalPriceCents: parsed.data.originalPriceCents ?? null,
      thumbnailUrl: thumbUrl,
      fileUrl: parsed.data.fileUrl ?? null,
      status: parsed.data.status || "ACTIVE",
      productType: parsed.data.productType || "digital",
      deliveryInstructions: parsed.data.deliveryInstructions ?? null,
      accessUrl: parsed.data.accessUrl ?? null,
      redemptionCode: parsed.data.redemptionCode ?? null,
      tags: parsed.data.tags ?? null,
      highlights: parsed.data.highlights ?? null,
      version: parsed.data.version ?? null,
      fileSize: parsed.data.fileSize ?? null,
      requiredTier: admin ? (parsed.data.requiredTier || "basic") : "basic",
    });

    if (imgs.length > 0) {
      await storage.setProductImages(product.id, imgs);
    }

    res.json(product);
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    const product = await storage.getProductById(req.params.id as string);
    if (!product || product.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageSchema = z.object({
      url: z.string().min(1),
      sortOrder: z.number().int().min(0),
      isPrimary: z.boolean(),
    });
    const schema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      tagline: z.string().optional().nullable(),
      category: z.string().optional(),
      priceCents: z.number().int().min(0).optional(),
      originalPriceCents: z.number().int().min(0).optional().nullable(),
      thumbnailUrl: z.string().optional().nullable(),
      fileUrl: z.string().optional().nullable(),
      status: z.enum(["DRAFT", "ACTIVE"]).optional(),
      productType: z.enum(["digital", "software", "template", "ebook", "course", "graphics"]).optional(),
      deliveryInstructions: z.string().optional().nullable(),
      accessUrl: z.string().optional().nullable(),
      redemptionCode: z.string().optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
      highlights: z.array(z.string()).optional().nullable(),
      version: z.string().optional().nullable(),
      fileSize: z.string().optional().nullable(),
      requiredTier: z.enum(["basic", "pro", "max"]).optional(),
      images: z.array(imageSchema).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const admin = await isUserAdmin(getUserId(req));
    const { images: imgs, requiredTier, ...productData } = parsed.data;
    if (admin && requiredTier) {
      (productData as any).requiredTier = requiredTier;
    }
    if (imgs !== undefined) {
      await storage.setProductImages(product.id, imgs);
      const primaryImg = imgs.find((i) => i.isPrimary) || imgs[0];
      if (primaryImg) {
        productData.thumbnailUrl = primaryImg.url;
      } else {
        productData.thumbnailUrl = null;
      }
    }

    const updated = await storage.updateProduct(product.id, productData);
    res.json(updated);
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    const product = await storage.getProductById(req.params.id as string);
    if (!product || product.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Product not found" });
    }

    await storage.deleteProduct(product.id, getUserId(req));
    res.json({ ok: true });
  });

  app.get("/api/products/:id/images", isAuthenticated, async (req, res) => {
    const product = await storage.getProductById(req.params.id as string);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.source !== "PLATFORM" && product.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const images = await storage.getProductImages(req.params.id as string);
    res.json(images);
  });

  app.put("/api/products/:id/images", isAuthenticated, async (req, res) => {
    const product = await storage.getProductById(req.params.id as string);
    if (!product || product.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const schema = z.array(z.object({
      url: z.string().min(1),
      sortOrder: z.number().int().min(0),
      isPrimary: z.boolean(),
    }));
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid images data" });

    const images = await storage.setProductImages(product.id, parsed.data);
    const primary = parsed.data.find((img) => img.isPrimary);
    if (primary) {
      await storage.updateProduct(product.id, { thumbnailUrl: primary.url });
    } else if (parsed.data.length > 0) {
      await storage.updateProduct(product.id, { thumbnailUrl: parsed.data[0].url });
    }
    res.json(images);
  });

  app.get("/api/store-products/:storeId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    const sps = await storage.getStoreProducts(req.params.storeId as string);
    res.json(sps);
  });

  app.get("/api/imported-products/:storeId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    const sps = await storage.getStoreProducts(req.params.storeId as string);
    const productIds = sps.map((sp) => sp.productId);
    res.json(productIds);
  });

  app.post("/api/store-products", isAuthenticated, async (req, res) => {
    const schema = z.object({ storeId: z.string(), productId: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const userId = getUserId(req);
    const store = await storage.getStoreById(parsed.data.storeId);
    if (!store || store.ownerId !== userId) {
      return res.status(404).json({ message: "Store not found" });
    }

    const product = await storage.getProductById(parsed.data.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.requiredTier && product.requiredTier !== "basic") {
      const tier = await getUserPlanTier(userId);
      if (!canAccessTier(tier, product.requiredTier as PlanTier)) {
        return res.status(403).json({ message: `This product requires a ${product.requiredTier} plan or higher. Upgrade to access it.` });
      }
    }

    if (product.productType === "software") {
      const tier = await getUserPlanTier(userId);
      const features = PLAN_FEATURES[tier];
      if (!features.sellSoftware) {
        return res.status(403).json({ message: "Software products require a max plan. Upgrade to sell software." });
      }
    }

    const existing = await storage.getStoreProductByStoreAndProduct(parsed.data.storeId, parsed.data.productId);
    if (existing) {
      return res.status(409).json({ message: "Product already imported to this store" });
    }

    const sp = await storage.createStoreProduct({
      storeId: parsed.data.storeId,
      productId: parsed.data.productId,
      isPublished: false,
      sortOrder: 0,
    });
    res.json(sp);
  });

  app.patch("/api/store-products/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      customPriceCents: z.number().int().min(0).nullable().optional(),
      customTitle: z.string().nullable().optional(),
      customDescription: z.string().nullable().optional(),
      customTags: z.array(z.string()).nullable().optional(),
      customAccessUrl: z.string().nullable().optional(),
      customRedemptionCode: z.string().nullable().optional(),
      customDeliveryInstructions: z.string().nullable().optional(),
      isPublished: z.boolean().optional(),
      isLeadMagnet: z.boolean().optional(),
      upsellProductId: z.string().nullable().optional(),
      upsellBundleId: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const spData = await storage.getStoreProductById(req.params.id as string);
    if (!spData) return res.status(404).json({ message: "Not found" });

    const store = await storage.getStoreById(spData.storeId);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (parsed.data.isLeadMagnet) {
      const product = await storage.getProductById(spData.productId);
      const effectivePrice = parsed.data.customPriceCents ?? spData.customPriceCents ?? product?.priceCents ?? 0;
      if (effectivePrice > 0) {
        return res.status(400).json({ message: "Lead magnets must be free. Set a custom price of $0 first." });
      }
    }

    const sp = await storage.updateStoreProduct(req.params.id as string, parsed.data);
    if (!sp) return res.status(404).json({ message: "Not found" });
    res.json(sp);
  });

  app.delete("/api/store-products/:id", isAuthenticated, async (req, res) => {
    try {
      const spData = await storage.getStoreProductById(req.params.id as string);
      if (!spData) return res.status(404).json({ message: "Not found" });

      const store = await storage.getStoreById(spData.storeId);
      if (!store || store.ownerId !== getUserId(req)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteStoreProduct(req.params.id as string);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to remove product" });
    }
  });

  // --- Bundle CRUD (authenticated) ---

  app.get("/api/bundles/:storeId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const storeBundles = await storage.getBundlesByStore(store.id);
    const allItems = await Promise.all(
      storeBundles.map((b) => storage.getBundleItems(b.id))
    );
    const result = storeBundles.map((b, i) => ({ ...b, products: allItems[i].map(item => item.product) }));
    res.json(result);
  });

  app.post("/api/bundles", isAuthenticated, async (req, res) => {
    const schema = z.object({
      storeId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      priceCents: z.number().int().min(0),
      thumbnailUrl: z.string().optional(),
      productIds: z.array(z.string()).min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const store = await storage.getStoreById(parsed.data.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });

    const bundle = await storage.createBundle({
      storeId: store.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents: parsed.data.priceCents,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      isPublished: false,
    });

    for (const productId of parsed.data.productIds) {
      await storage.addBundleItem({ bundleId: bundle.id, productId });
    }

    const items = await storage.getBundleItems(bundle.id);
    res.json({ ...bundle, products: items.map(i => i.product) });
  });

  app.patch("/api/bundles/:id", isAuthenticated, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      priceCents: z.number().int().min(0).optional(),
      thumbnailUrl: z.string().optional(),
      isPublished: z.boolean().optional(),
      productIds: z.array(z.string()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const bundle = await storage.getBundleById(req.params.id as string);
    if (!bundle) return res.status(404).json({ message: "Bundle not found" });

    const store = await storage.getStoreById(bundle.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });

    const { productIds, ...updateData } = parsed.data;
    const updated = await storage.updateBundle(bundle.id, updateData as any);

    if (productIds) {
      const existingItems = await storage.getBundleItems(bundle.id);
      for (const item of existingItems) {
        if (!productIds.includes(item.productId)) {
          await storage.removeBundleItem(bundle.id, item.productId);
        }
      }
      const existingIds = existingItems.map(i => i.productId);
      for (const pid of productIds) {
        if (!existingIds.includes(pid)) {
          await storage.addBundleItem({ bundleId: bundle.id, productId: pid });
        }
      }
    }

    const items = await storage.getBundleItems(bundle.id);
    res.json({ ...updated, products: items.map(i => i.product) });
  });

  app.delete("/api/bundles/:id", isAuthenticated, async (req, res) => {
    const bundle = await storage.getBundleById(req.params.id as string);
    if (!bundle) return res.status(404).json({ message: "Bundle not found" });

    const store = await storage.getStoreById(bundle.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteBundle(bundle.id);
    res.json({ ok: true });
  });

  // --- Coupons CRUD ---

  app.get("/api/coupons/:storeId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const storeCoupons = await storage.getCouponsByStore(store.id);
    res.json(storeCoupons);
  });

  app.post("/api/coupons", isAuthenticated, async (req, res) => {
    const schema = z.object({
      storeId: z.string(),
      code: z.string().min(1).max(32),
      discountType: z.enum(["PERCENT", "FIXED"]),
      discountValue: z.number().int().min(1),
      maxUses: z.number().int().min(1).optional().nullable(),
      expiresAt: z.string().optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const store = await storage.getStoreById(parsed.data.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });

    const existing = await storage.getCouponByCode(store.id, parsed.data.code.toUpperCase());
    if (existing) return res.status(409).json({ message: "Coupon code already exists" });

    const coupon = await storage.createCoupon({
      storeId: store.id,
      code: parsed.data.code.toUpperCase(),
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      maxUses: parsed.data.maxUses || null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      isActive: true,
    });
    res.json(coupon);
  });

  app.patch("/api/coupons/:id", isAuthenticated, async (req, res) => {
    const coupon = await storage.getCouponById(req.params.id as string);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    const store = await storage.getStoreById(coupon.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });

    const schema = z.object({ isActive: z.boolean().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const updated = await storage.updateCoupon(coupon.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/coupons/:id", isAuthenticated, async (req, res) => {
    const coupon = await storage.getCouponById(req.params.id as string);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    const store = await storage.getStoreById(coupon.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteCoupon(coupon.id);
    res.json({ ok: true });
  });

  app.post("/api/coupons/validate", async (req, res) => {
    const schema = z.object({ storeId: z.string(), code: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const store = await storage.getStoreById(parsed.data.storeId) || await storage.getStoreBySlug(parsed.data.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const coupon = await storage.getCouponByCode(store.id, parsed.data.code);
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (!coupon.isActive) return res.status(400).json({ message: "Coupon is no longer active" });
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return res.status(400).json({ message: "Coupon has reached its usage limit" });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: "Coupon has expired" });

    res.json({ valid: true, discountType: coupon.discountType, discountValue: coupon.discountValue, couponId: coupon.id });
  });

  // --- Orders Management ---

  app.get("/api/orders/:storeId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const storeOrders = await storage.getOrdersByStore(store.id);
    const itemsPerOrder = await Promise.all(
      storeOrders.map((order) => storage.getOrderItemsByOrder(order.id))
    );
    const result = storeOrders.map((order, i) => ({ ...order, items: itemsPerOrder[i] }));
    res.json(result);
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
      storeId: z.string().min(1),
      sessionId: z.string().min(1),
      eventType: z.enum(["page_view", "product_view", "bundle_view", "checkout_start", "add_to_cart"]),
      productId: z.string().optional(),
      bundleId: z.string().optional(),
      path: z.string().optional(),
      referrer: z.string().optional(),
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

  // --- Knowledge Bases ---

  app.get("/api/knowledge-bases", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const kbs = await storage.getKnowledgeBasesByOwner(userId);
    res.json(kbs);
  });

  app.post("/api/knowledge-bases", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const schema = z.object({ title: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    const title = parsed.success && parsed.data.title ? parsed.data.title.trim() : "Untitled";
    const existing = await storage.getKnowledgeBasesByOwner(userId);
    if (existing.some((kb) => kb.title.toLowerCase() === title.toLowerCase())) {
      return res.status(409).json({ message: `A knowledge base named "${title}" already exists.` });
    }
    const kb = await storage.createKnowledgeBase({
      ownerId: userId,
      title,
    });
    res.json(kb);
  });

  app.get("/api/knowledge-bases/:id", isAuthenticated, async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    res.json(kb);
  });

  app.patch("/api/knowledge-bases/:id", isAuthenticated, async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      coverImageUrl: z.string().nullable().optional(),
      priceCents: z.number().int().min(0).optional(),
      isPublished: z.boolean().optional(),
      fontFamily: z.string().nullable().optional(),
      productId: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const updated = await storage.updateKnowledgeBase(kb.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/knowledge-bases/:id", isAuthenticated, async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    await storage.deleteKnowledgeBase(kb.id);
    res.json({ ok: true });
  });

  app.post("/api/knowledge-bases/:id/create-product", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== userId) return res.status(404).json({ message: "Not found" });

    const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
    if (pages.length === 0) return res.status(400).json({ message: "Add at least one page before creating a product." });

    const appUrl = `${req.protocol}://${req.get("host")}`;
    const accessUrl = `${appUrl}/kb/${kb.id}`;

    if (kb.productId) {
      const existing = await storage.getProductById(kb.productId);
      if (existing && existing.ownerId === userId) {
        await storage.updateProduct(existing.id, {
          title: kb.title,
          description: kb.description || `Knowledge base with ${pages.length} pages`,
          priceCents: kb.priceCents,
          thumbnailUrl: kb.coverImageUrl || null,
          accessUrl,
          status: kb.isPublished ? "ACTIVE" : "DRAFT",
        });
        const updated = await storage.getProductById(existing.id);
        return res.json(updated);
      }
    }

    const product = await storage.createProduct({
      ownerId: userId,
      source: "USER",
      title: kb.title,
      description: kb.description || `Knowledge base with ${pages.length} pages`,
      category: "courses",
      priceCents: kb.priceCents,
      thumbnailUrl: kb.coverImageUrl || null,
      fileUrl: null,
      status: kb.isPublished ? "ACTIVE" : "DRAFT",
      requiredTier: "basic",
      productType: "course",
      deliveryInstructions: "Access your course content using the link below. Your access token is automatically included.",
      accessUrl,
      redemptionCode: null,
      tags: ["course", "knowledge-base"],
    });

    await storage.updateKnowledgeBase(kb.id, { productId: product.id });
    res.json(product);
  });

  app.get("/api/knowledge-bases/:id/pages", isAuthenticated, async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
    res.json(pages);
  });

  app.post("/api/knowledge-bases/:id/pages", isAuthenticated, async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      title: z.string().optional(),
      parentPageId: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    const parentPageId = parsed.success ? parsed.data.parentPageId || null : null;
    const existingPages = await storage.getKbPagesByKnowledgeBase(kb.id);
    const siblings = existingPages.filter(p => p.parentPageId === parentPageId);
    const maxSort = siblings.length > 0 ? Math.max(...siblings.map(p => p.sortOrder)) : -1;
    const page = await storage.createKbPage({
      knowledgeBaseId: kb.id,
      title: parsed.success && parsed.data.title ? parsed.data.title : "Untitled Page",
      parentPageId,
      sortOrder: maxSort + 1,
    });
    res.json(page);
  });

  app.patch("/api/kb-pages/:id", isAuthenticated, async (req, res) => {
    const page = await storage.getKbPageById(req.params.id as string);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      title: z.string().optional(),
      parentPageId: z.string().nullable().optional(),
      sortOrder: z.number().int().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const updated = await storage.updateKbPage(page.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/kb-pages/:id", isAuthenticated, async (req, res) => {
    const page = await storage.getKbPageById(req.params.id as string);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    await storage.deleteKbPage(page.id);
    res.json({ ok: true });
  });

  app.get("/api/kb-pages/:id/blocks", isAuthenticated, async (req, res) => {
    const page = await storage.getKbPageById(req.params.id as string);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const blocks = await storage.getKbBlocksByPage(page.id);
    res.json(blocks);
  });

  app.post("/api/kb-pages/:id/blocks", isAuthenticated, async (req, res) => {
    const page = await storage.getKbPageById(req.params.id as string);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
      content: z.string().optional(),
      sortOrder: z.number().int().optional(),
    });
    const parsed = schema.safeParse(req.body);
    const existingBlocks = await storage.getKbBlocksByPage(page.id);
    const block = await storage.createKbBlock({
      pageId: page.id,
      type: parsed.success && parsed.data.type ? parsed.data.type : "text",
      content: parsed.success && parsed.data.content ? parsed.data.content : "",
      sortOrder: parsed.success && parsed.data.sortOrder != null ? parsed.data.sortOrder : existingBlocks.length,
    });
    res.json(block);
  });

  app.post("/api/kb-pages/:id/blocks/bulk", isAuthenticated, async (req, res) => {
    const page = await storage.getKbPageById(req.params.id as string);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      blocks: z.array(z.object({
        type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]),
        content: z.string(),
        sortOrder: z.number().int(),
      })),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const insertAt = Math.min(...parsed.data.blocks.map((b) => b.sortOrder));
    const count = parsed.data.blocks.length;
    const existing = await storage.getKbBlocksByPage(page.id);
    for (const ex of existing) {
      if (ex.sortOrder >= insertAt) {
        await storage.updateKbBlock(ex.id, { sortOrder: ex.sortOrder + count });
      }
    }
    const created = [];
    for (const b of parsed.data.blocks) {
      const block = await storage.createKbBlock({ pageId: page.id, type: b.type, content: b.content, sortOrder: b.sortOrder });
      created.push(block);
    }
    res.json(created);
  });

  app.patch("/api/kb-blocks/:id", isAuthenticated, async (req, res) => {
    const block = await storage.getKbBlockById(req.params.id as string);
    if (!block) return res.status(404).json({ message: "Not found" });
    const page = await storage.getKbPageById(block.pageId);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
      content: z.string().optional(),
      sortOrder: z.number().int().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const updated = await storage.updateKbBlock(block.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/kb-blocks/:id", isAuthenticated, async (req, res) => {
    const block = await storage.getKbBlockById(req.params.id as string);
    if (!block) return res.status(404).json({ message: "Not found" });
    const page = await storage.getKbPageById(block.pageId);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    await storage.deleteKbBlock(block.id);
    res.json({ ok: true });
  });

  app.put("/api/knowledge-bases/:id/pages/reorder", isAuthenticated, async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({ pageIds: z.array(z.string()) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
    for (let i = 0; i < parsed.data.pageIds.length; i++) {
      const page = pages.find(p => p.id === parsed.data.pageIds[i]);
      if (page) {
        await storage.updateKbPage(page.id, { sortOrder: i });
      }
    }
    res.json({ ok: true });
  });

  app.put("/api/kb-pages/:id/blocks/reorder", isAuthenticated, async (req, res) => {
    const page = await storage.getKbPageById(req.params.id as string);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({ blockIds: z.array(z.string()) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    await storage.reorderKbBlocks(page.id, parsed.data.blockIds);
    res.json({ ok: true });
  });

  // Public KB viewer
  app.get("/api/kb/:id/view", async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || !kb.isPublished) return res.status(404).json({ message: "Not found" });
    const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
    const isPaid = kb.priceCents > 0;

    let hasAccess = !isPaid;
    if (isPaid) {
      const accessToken = req.query.token as string | undefined;
      if (accessToken) {
        const dl = await db.select().from(downloadTokens).where(eq(downloadTokens.tokenHash, accessToken)).then(r => r[0]);
        if (dl && (!dl.expiresAt || dl.expiresAt > new Date())) {
          hasAccess = true;
        }
      }
      const userId = getUserId(req);
      if (userId && userId === kb.ownerId) {
        hasAccess = true;
      }
    }

    let purchaseUrl: string | null = null;
    if (isPaid && !hasAccess && kb.productId) {
      const sp = await db.select().from(storeProducts).where(eq(storeProducts.productId, kb.productId)).then(r => r[0]);
      if (sp) {
        const store = await storage.getStoreById(sp.storeId);
        if (store) {
          purchaseUrl = `/s/${store.slug}/product/${kb.productId}`;
        }
      }
    }

    res.json({
      knowledgeBase: {
        id: kb.id,
        title: kb.title,
        description: kb.description,
        coverImageUrl: kb.coverImageUrl,
        priceCents: kb.priceCents,
        fontFamily: kb.fontFamily,
      },
      pages: hasAccess ? pages : pages.map(p => ({ id: p.id, title: "Locked", parentPageId: p.parentPageId, sortOrder: p.sortOrder, locked: true })),
      hasAccess,
      purchaseUrl,
    });
  });

  app.get("/api/kb/:id/view/page/:pageId", async (req, res) => {
    const kb = await storage.getKnowledgeBaseById(req.params.id as string);
    if (!kb || !kb.isPublished) return res.status(404).json({ message: "Not found" });

    const isPaid = kb.priceCents > 0;
    let hasAccess = !isPaid;
    if (isPaid) {
      const accessToken = req.query.token as string | undefined;
      if (accessToken) {
        const dl = await db.select().from(downloadTokens).where(eq(downloadTokens.tokenHash, accessToken)).then(r => r[0]);
        if (dl && (!dl.expiresAt || dl.expiresAt > new Date())) {
          hasAccess = true;
        }
      }
      const userId = getUserId(req);
      if (userId && userId === kb.ownerId) {
        hasAccess = true;
      }
    }

    if (!hasAccess) return res.status(403).json({ message: "Purchase required to access this content." });

    const page = await storage.getKbPageById(req.params.pageId as string);
    if (!page || page.knowledgeBaseId !== kb.id) return res.status(404).json({ message: "Not found" });
    const blocks = await storage.getKbBlocksByPage(page.id);
    res.json({ page, blocks });
  });

  // --- Blog routes (dashboard) ---

  app.get("/api/blog-posts", isAuthenticated, async (req, res) => {
    const storeId = req.query.storeId as string;
    if (!storeId) return res.status(400).json({ message: "storeId required" });
    const store = await storage.getStoreById(storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const posts = await storage.getBlogPostsByStore(storeId);
    res.json(posts);
  });

  app.post("/api/blog-posts", isAuthenticated, async (req, res) => {
    const { storeId, title } = req.body;
    if (!storeId) return res.status(400).json({ message: "storeId required" });
    const store = await storage.getStoreById(storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const postTitle = title || "Untitled";
    const baseSlug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
    let slug = baseSlug;
    let counter = 1;
    while (await storage.getBlogPostBySlug(storeId, slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    const post = await storage.createBlogPost({ storeId, title: postTitle, slug });
    res.json(post);
  });

  app.get("/api/blog-posts/:id", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    res.json(post);
  });

  app.patch("/api/blog-posts/:id", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const allowed = ["title", "slug", "excerpt", "coverImageUrl", "fontFamily", "category", "readingTimeMinutes", "isPublished", "publishedAt"] as const;
    const data: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.isPublished === true && !post.publishedAt) {
      data.publishedAt = new Date();
    }
    const updated = await storage.updateBlogPost(post.id, data);
    res.json(updated);
  });

  app.delete("/api/blog-posts/:id", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteBlogPost(post.id);
    res.json({ success: true });
  });

  app.get("/api/blog-posts/:id/blocks", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const blocks = await storage.getBlogBlocksByPost(post.id);
    res.json(blocks);
  });

  app.post("/api/blog-posts/:id/blocks", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const block = await storage.createBlogBlock({ postId: post.id, ...req.body });
    res.json(block);
  });

  app.post("/api/blog-posts/:id/blocks/bulk", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const blocks = req.body.blocks as Array<{ type: string; content: string; sortOrder: number }>;
    if (!Array.isArray(blocks)) return res.status(400).json({ message: "blocks array required" });
    const created = [];
    for (const b of blocks) {
      const block = await storage.createBlogBlock({ postId: post.id, type: b.type as any, content: b.content, sortOrder: b.sortOrder });
      created.push(block);
    }
    res.json(created);
  });

  app.patch("/api/blog-blocks/:id", isAuthenticated, async (req, res) => {
    const updated = await storage.updateBlogBlock(req.params.id as string, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/blog-blocks/:id", isAuthenticated, async (req, res) => {
    await storage.deleteBlogBlock(req.params.id as string);
    res.json({ success: true });
  });

  app.put("/api/blog-posts/:id/blocks/reorder", isAuthenticated, async (req, res) => {
    const post = await storage.getBlogPostById(req.params.id as string);
    if (!post) return res.status(404).json({ message: "Not found" });
    const store = await storage.getStoreById(post.storeId);
    if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
    const { blockIds } = req.body;
    if (!Array.isArray(blockIds)) return res.status(400).json({ message: "blockIds array required" });
    await storage.reorderBlogBlocks(post.id, blockIds);
    res.json({ success: true });
  });

  // --- Public blog routes ---

  app.get("/api/storefront/:slug/blog", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store || !store.blogEnabled) return res.status(404).json({ message: "Blog not found" });
    const [posts, categories] = await Promise.all([
      storage.getPublishedBlogPostsByStore(store.id),
      storage.getBlogCategories(store.id),
    ]);
    res.json({ store: sanitizeStore(store), posts, categories });
  });

  app.get("/api/storefront/:slug/blog/:postSlug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store || !store.blogEnabled) return res.status(404).json({ message: "Blog not found" });
    const post = await storage.getBlogPostBySlug(store.id, req.params.postSlug as string);
    if (!post || !post.isPublished) return res.status(404).json({ message: "Post not found" });
    const [blocks, relatedPosts] = await Promise.all([
      storage.getBlogBlocksByPost(post.id),
      storage.getRelatedBlogPosts(store.id, post.id, post.category, 3),
    ]);
    res.json({ store: sanitizeStore(store), post, blocks, relatedPosts });
  });

  // --- Public storefront ---

  app.get("/api/storefront/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const [storeProductRows, publishedBundles] = await Promise.all([
      storage.getStoreProducts(store.id),
      storage.getPublishedBundlesByStore(store.id),
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
    res.json({ store: sanitizeStore(store), products: productsWithMeta, bundles: bundlesWithProducts });
  });

  app.get("/api/storefront/:slug/product/:productId", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const sp = await storage.getStoreProductByStoreAndProduct(store.id, req.params.productId as string);
    if (!sp || !sp.isPublished) return res.status(404).json({ message: "Product not found" });

    const product = await storage.getProductById(req.params.productId as string);
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
    res.setHeader("X-Frame-Options", "ALLOWALL");
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
    res.setHeader("X-Frame-Options", "ALLOWALL");
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

  app.post("/api/checkout", async (req, res) => {
    try {
    const schema = z.object({
      storeId: z.string(),
      productId: z.string().optional(),
      bundleId: z.string().optional(),
      buyerEmail: z.string().email().optional(),
      couponCode: z.string().optional(),
      paymentMethod: z.enum(["stripe", "paypal"]).optional(),
    }).refine(d => d.productId || d.bundleId, { message: "productId or bundleId required" });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const store = await storage.getStoreBySlug(parsed.data.storeId) || await storage.getStoreById(parsed.data.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    let totalCents = 0;
    let itemName = "";
    let itemDescription = "";
    let itemImage: string | null = null;
    const itemsToAdd: { productId: string; priceCents: number }[] = [];

    if (parsed.data.bundleId) {
      const bundleData = await storage.getBundleWithProducts(parsed.data.bundleId);
      if (!bundleData || bundleData.bundle.storeId !== store.id || !bundleData.bundle.isPublished) return res.status(404).json({ message: "Bundle not found" });
      totalCents = bundleData.bundle.priceCents;
      itemName = bundleData.bundle.name;
      itemDescription = `Bundle from ${store.name} — ${bundleData.products.length} items`;
      itemImage = bundleData.bundle.thumbnailUrl;
      for (const p of bundleData.products) {
        itemsToAdd.push({ productId: p.id, priceCents: p.priceCents });
      }
    } else if (parsed.data.productId) {
      const product = await storage.getProductById(parsed.data.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      const sp = await storage.getStoreProductByStoreAndProduct(store.id, product.id);
      if (!sp || !sp.isPublished) return res.status(404).json({ message: "Product not available in this store" });
      const effectivePrice = sp.customPriceCents ?? product.priceCents;
      totalCents = effectivePrice;
      itemName = sp.customTitle || product.title;
      itemDescription = sp.customDescription || product.description || `Digital product from ${store.name}`;
      itemImage = product.thumbnailUrl;
      itemsToAdd.push({ productId: product.id, priceCents: effectivePrice });
    }

    let couponId: string | null = null;
    if (parsed.data.couponCode) {
      const coupon = await storage.getCouponByCode(store.id, parsed.data.couponCode);
      if (!coupon || !coupon.isActive) return res.status(400).json({ message: "Invalid coupon code" });
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return res.status(400).json({ message: "Coupon usage limit reached" });
      if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: "Coupon expired" });

      if (coupon.discountType === "PERCENT") {
        totalCents = Math.max(0, Math.round(totalCents * (1 - coupon.discountValue / 100)));
      } else {
        totalCents = Math.max(0, totalCents - coupon.discountValue);
      }
      couponId = coupon.id;
    }

    const finalTotalCents = totalCents;
    const appUrl = `https://${req.headers.host}`;

    if (finalTotalCents === 0) {
      const tokenHash = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const buyerEmail = parsed.data.buyerEmail || "customer@example.com";
      let customerId: string | null = null;
      if (buyerEmail && buyerEmail !== "customer@example.com") {
        const customer = await storage.findOrCreateCustomer(buyerEmail);
        customerId = customer.id;
      }

      const result = await db.transaction(async (tx) => {
        const [order] = await tx.insert(orders).values({
          storeId: store.id,
          buyerEmail,
          customerId,
          totalCents: 0,
          stripeSessionId: null,
          couponId,
          status: "COMPLETED",
        }).returning();

        for (const item of itemsToAdd) {
          await tx.insert(orderItems).values({ orderId: order.id, ...item });
        }

        await tx.insert(downloadTokens).values({
          orderId: order.id,
          tokenHash,
          expiresAt,
        });

        if (couponId) {
          await tx.update(coupons).set({ currentUses: sql`${coupons.currentUses} + 1` }).where(eq(coupons.id, couponId));
        }

        return order;
      });

      sendOrderCompletionEmails(result.id, appUrl).catch(err =>
        console.error("Free order email error:", err)
      );

      return res.json({
        url: `${appUrl}/checkout/success?order_id=${result.id}`,
        orderId: result.id,
        totalCents: 0,
      });
    }

    const buyerEmail = parsed.data.buyerEmail || "pending@checkout.com";
    let customerId: string | null = null;
    if (buyerEmail && buyerEmail !== "pending@checkout.com") {
      const customer = await storage.findOrCreateCustomer(buyerEmail);
      customerId = customer.id;
    }

    const [order] = await db.insert(orders).values({
      storeId: store.id,
      buyerEmail,
      customerId,
      totalCents: finalTotalCents,
      stripeSessionId: null,
      couponId,
      status: "PENDING",
    }).returning();

    for (const item of itemsToAdd) {
      await db.insert(orderItems).values({ orderId: order.id, ...item });
    }

    const hasPayPal = !!(store.paypalClientId && store.paypalClientSecret);
    const hasStripe = !!store.stripeSecretKey;

    if (!hasPayPal && !hasStripe) {
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.status(400).json({ message: "This store hasn't set up payment processing yet. Please contact the store owner." });
    }

    const chosenMethod = parsed.data.paymentMethod;
    if (chosenMethod === "paypal" && !hasPayPal) {
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.status(400).json({ message: "PayPal is not configured for this store." });
    }
    if (chosenMethod === "stripe" && !hasStripe) {
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.status(400).json({ message: "Stripe is not configured for this store." });
    }

    const usePayPal = chosenMethod === "paypal" || (!chosenMethod && hasPayPal && !hasStripe);

    if (usePayPal) {
      try {
        const { approveUrl, paypalOrderId } = await createPayPalOrder(
          store.paypalClientId!,
          store.paypalClientSecret!,
          finalTotalCents,
          itemName,
          order.id,
          store.id,
          store.slug,
          appUrl,
        );
        await db.update(orders).set({ paypalOrderId }).where(eq(orders.id, order.id));
        res.json({ url: approveUrl });
      } catch (error: any) {
        console.error("PayPal checkout error:", error.message);
        await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
        res.status(500).json({ message: "PayPal payment processing unavailable. Please try again later." });
      }
    } else {
      try {
        const stripe = new Stripe(store.stripeSecretKey!, { apiVersion: '2025-11-17.clover' as any });

        const productData: any = { name: itemName };
        if (itemDescription) productData.description = itemDescription.substring(0, 500);
        const images: string[] = [];
        if (itemImage && itemImage.startsWith("http")) images.push(itemImage);
        if (images.length > 0) productData.images = images;

        const sessionParams: any = {
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: productData,
              unit_amount: finalTotalCents,
            },
            quantity: 1,
          }],
          metadata: {
            orderId: order.id,
            storeId: store.id,
            couponId: couponId || '',
          },
          success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/s/${store.slug}`,
        };

        if (buyerEmail && buyerEmail !== "pending@checkout.com") {
          sessionParams.customer_email = buyerEmail;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id));

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Stripe checkout error:", error.message);
        await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
        res.status(500).json({ message: "Payment processing unavailable. Please try again later." });
      }
    }
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Checkout failed. Please try again." });
    }
  });

  app.get("/api/paypal/capture", async (req, res) => {
    const { token: paypalToken, orderId, storeSlug } = req.query as { token?: string; orderId?: string; storeSlug?: string };
    if (!paypalToken || !orderId) {
      return res.redirect(`/s/${storeSlug || ""}`);
    }

    const order = await storage.getOrderById(orderId);
    if (!order || order.status !== "PENDING") {
      return res.redirect(`/checkout/success?order_id=${orderId}`);
    }

    if (order.paypalOrderId && order.paypalOrderId !== paypalToken) {
      console.error("PayPal token mismatch: expected", order.paypalOrderId, "got", paypalToken);
      return res.redirect(`/s/${storeSlug || ""}`);
    }

    const store = await storage.getStoreById(order.storeId);
    if (!store || !store.paypalClientId || !store.paypalClientSecret) {
      return res.redirect(`/s/${storeSlug || ""}`);
    }

    try {
      const accessToken = await getPayPalAccessToken(store.paypalClientId, store.paypalClientSecret);
      const baseUrl = getPayPalBaseUrl(store.paypalClientId);

      const captureResp = await fetch(`${baseUrl}/v2/checkout/orders/${paypalToken}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!captureResp.ok) {
        const text = await captureResp.text();
        console.error("PayPal capture failed:", text);
        await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
        return res.redirect(`/s/${storeSlug || ""}`);
      }

      const captureData = await captureResp.json() as any;
      const captureStatus = captureData.status;

      const purchaseUnit = captureData.purchase_units?.[0];
      const capturedReferenceId = purchaseUnit?.reference_id;
      const capturedAmount = purchaseUnit?.amount?.value;
      const expectedAmount = (order.totalCents / 100).toFixed(2);

      if (capturedReferenceId && capturedReferenceId !== order.id) {
        console.error("PayPal reference_id mismatch:", capturedReferenceId, "vs", order.id);
        await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
        return res.redirect(`/s/${storeSlug || ""}`);
      }

      if (capturedAmount && capturedAmount !== expectedAmount) {
        console.error("PayPal amount mismatch:", capturedAmount, "vs", expectedAmount);
        await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
        return res.redirect(`/s/${storeSlug || ""}`);
      }

      if (captureStatus === "COMPLETED") {
        const payerEmail = captureData.payer?.email_address || order.buyerEmail;

        const tokenHash = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.transaction(async (tx) => {
          await tx.update(orders).set({
            status: "COMPLETED",
            buyerEmail: payerEmail !== "pending@checkout.com" ? payerEmail : order.buyerEmail,
          }).where(eq(orders.id, order.id));

          await tx.insert(downloadTokens).values({
            orderId: order.id,
            tokenHash,
            expiresAt,
          });

          if (order.couponId) {
            await tx.update(coupons).set({ currentUses: sql`${coupons.currentUses} + 1` }).where(eq(coupons.id, order.couponId));
          }
        });

        if (payerEmail && payerEmail !== "pending@checkout.com") {
          const customer = await storage.findOrCreateCustomer(payerEmail);
          await storage.setOrderCustomerId(order.id, customer.id);
          await storage.linkOrdersByEmail(payerEmail, customer.id);
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        sendOrderCompletionEmails(order.id, baseUrl);

        return res.redirect(`/checkout/success?order_id=${order.id}`);
      } else {
        console.error("PayPal capture status not COMPLETED:", captureStatus);
        await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
        return res.redirect(`/s/${storeSlug || ""}`);
      }
    } catch (error: any) {
      console.error("PayPal capture error:", error.message);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.redirect(`/s/${storeSlug || ""}`);
    }
  });

  app.get("/api/checkout/success/:identifier", async (req, res) => {
    try {
    const id = req.params.identifier as string;
    let order = await storage.getOrderById(id);

    if (!order) {
      order = await storage.getOrderByStripeSession(id);
    }

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "PENDING" && order.stripeSessionId) {
      try {
        const orderStore = await storage.getStoreById(order.storeId);
        let stripe;
        if (orderStore?.stripeSecretKey) {
          stripe = new Stripe(orderStore.stripeSecretKey, { apiVersion: '2025-11-17.clover' as any });
        } else {
          stripe = await getUncachableStripeClient();
        }
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
          const emailFromSession = (session as any).customer_details?.email;
          if (emailFromSession && (!order.buyerEmail || order.buyerEmail === "pending@checkout.com")) {
            await storage.updateOrderBuyerEmail(order.id, emailFromSession);
          }

          await storage.updateOrderStatus(order.id, "COMPLETED");
          order = (await storage.getOrderById(order.id))!;

          if (order.couponId) {
            await storage.incrementCouponUses(order.couponId);
          }

          const finalEmail = emailFromSession || order.buyerEmail;
          if (finalEmail && finalEmail !== "pending@checkout.com") {
            const customer = await storage.findOrCreateCustomer(finalEmail);
            await storage.setOrderCustomerId(order.id, customer.id);
            await storage.linkOrdersByEmail(finalEmail, customer.id);
          }
        }
      } catch (e: any) {
        console.error("Error checking Stripe session:", e.message);
      }
    }

    const existingTokens = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, order.id));
    let tokenHash: string;

    if (existingTokens.length > 0 && new Date() < existingTokens[0].expiresAt) {
      tokenHash = existingTokens[0].tokenHash;
    } else {
      const hash = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const token = await storage.createDownloadToken({ orderId: order.id, tokenHash: hash, expiresAt });
      tokenHash = token.tokenHash;
    }

    const store = await storage.getStoreById(order.storeId);
    const items = await storage.getOrderItemsByOrder(order.id);

    let fileCount = 0;
    for (const item of items) {
      const assets = await storage.getFileAssetsByProduct(item.productId);
      if (assets.length > 0) {
        fileCount += assets.length;
      } else if (item.product.fileUrl) {
        fileCount += 1;
      }
    }

    const emailItems = await Promise.all(items.map(async (i) => {
      const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, i.productId);
      return { title: sp?.customTitle || i.product.title, priceCents: i.priceCents };
    }));

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    if (order.status === "COMPLETED") {
      sendOrderCompletionEmails(order.id, baseUrl);
    }

    res.json({
      order: {
        id: order.id,
        buyerEmail: order.buyerEmail,
        totalCents: order.totalCents,
        status: order.status,
      },
      downloadToken: tokenHash,
      store: store ? { name: store.name, slug: store.slug } : null,
      items: emailItems,
      fileCount,
    });
    } catch (error: any) {
      console.error("Checkout success error:", error);
      res.status(500).json({ message: "Failed to load order details" });
    }
  });

  function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  // ========== RESEND DOWNLOAD LINK ==========

  app.post("/api/resend-download", async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      orderId: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please provide a valid email and order ID" });

    const { email, orderId } = parsed.data;

    const order = await storage.getOrderById(orderId);
    if (!order || order.status !== "COMPLETED") {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.buyerEmail || order.buyerEmail === "pending@checkout.com") {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.buyerEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this order" });
    }

    const tokenRows = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, orderId));
    let tokenHash: string;

    if (tokenRows.length > 0 && new Date() < tokenRows[0].expiresAt) {
      tokenHash = tokenRows[0].tokenHash;
    } else {
      const hash = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const token = await storage.createDownloadToken({ orderId, tokenHash: hash, expiresAt });
      tokenHash = token.tokenHash;
    }

    const store = await storage.getStoreById(order.storeId);
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    sendDownloadLinkEmail({
      buyerEmail: email,
      storeName: store?.name || "Store",
      downloadToken: tokenHash,
      baseUrl,
    });

    res.json({ message: "Download link has been sent to your email" });
  });

  // ========== FREE PRODUCT CLAIM (Lead Magnet) ==========

  app.post("/api/claim-free", async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      productId: z.string(),
      storeId: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const { email, productId, storeId } = parsed.data;

    const store = await storage.getStoreById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const sp = await storage.getStoreProductByStoreAndProduct(storeId, productId);
    if (!sp || !sp.isPublished || !sp.isLeadMagnet) {
      return res.status(400).json({ message: "This product is not available as a free download" });
    }

    const product = await storage.getProductById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const effectivePrice = sp.customPriceCents ?? product.priceCents;
    if (effectivePrice > 0) {
      return res.status(400).json({ message: "This product is not free" });
    }

    const customer = await storage.findOrCreateCustomer(email);

    const result = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        storeId: store.id,
        buyerEmail: email.toLowerCase(),
        customerId: customer.id,
        totalCents: 0,
        stripeSessionId: null,
        status: "COMPLETED",
      }).returning();

      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        priceCents: 0,
      });

      const tokenRaw = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tx.insert(downloadTokens).values({
        orderId: order.id,
        tokenHash: tokenRaw,
        expiresAt,
      });

      return { order, downloadToken: tokenRaw };
    });

    await storage.linkOrdersByEmail(email.toLowerCase(), customer.id);

    const sessionToken = randomBytes(32).toString("hex");
    const sessionHash = hashToken(sessionToken);
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await storage.createCustomerSession({
      customerId: customer.id,
      tokenHash: sessionHash,
      expiresAt: sessionExpiry,
    });

    res.cookie("customer_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    sendLeadMagnetEmail({
      buyerEmail: email,
      storeName: store.name,
      productTitle: sp.customTitle || product.title,
      downloadToken: result.downloadToken,
      baseUrl,
    });

    res.json({
      orderId: result.order.id,
      downloadToken: result.downloadToken,
      upsellProductId: sp.upsellProductId,
      upsellBundleId: sp.upsellBundleId,
    });
  });

  app.get("/api/claim-free/success/:orderId", async (req, res) => {
    const order = await storage.getOrderById(req.params.orderId as string);
    if (!order || order.totalCents > 0) return res.status(404).json({ message: "Not found" });

    const store = await storage.getStoreById(order.storeId);
    const items = await storage.getOrderItemsByOrder(order.id);
    const product = items[0]?.product;

    const existingTokens = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, order.id));
    const tokenHash = existingTokens.length > 0 ? existingTokens[0].tokenHash : null;

    const sp = product ? await storage.getStoreProductByStoreAndProduct(order.storeId, product.id) : null;

    let upsellProduct = null;
    let upsellBundle = null;

    if (sp?.upsellProductId) {
      const p = await storage.getProductById(sp.upsellProductId);
      if (p) upsellProduct = { id: p.id, title: p.title, description: p.description, priceCents: p.priceCents, thumbnailUrl: p.thumbnailUrl };
    }
    if (sp?.upsellBundleId) {
      const b = await storage.getBundleWithProducts(sp.upsellBundleId);
      if (b) upsellBundle = { id: b.bundle.id, name: b.bundle.name, description: b.bundle.description, priceCents: b.bundle.priceCents, thumbnailUrl: b.bundle.thumbnailUrl, productCount: b.products.length };
    }

    res.json({
      order: { id: order.id, buyerEmail: order.buyerEmail, totalCents: order.totalCents },
      product: product ? { id: product.id, title: sp?.customTitle || product.title, thumbnailUrl: product.thumbnailUrl } : null,
      store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
      downloadToken: tokenHash,
      upsellProduct,
      upsellBundle,
    });
  });

  // ========== CUSTOMER PORTAL AUTH ==========

  const magicLinkRateLimit = new Map<string, number>();

  async function getCustomerFromCookie(req: Request): Promise<{ customerId: string } | null> {
    const sessionToken = req.cookies?.customer_session;
    if (!sessionToken) return null;
    const tokenHash = hashToken(sessionToken);
    const session = await storage.getCustomerSessionByToken(tokenHash);
    if (!session || new Date() > session.expiresAt) {
      if (session) await storage.deleteCustomerSession(session.id);
      return null;
    }
    return { customerId: session.customerId };
  }

  async function isCustomerAuthenticated(req: Request, res: Response, next: NextFunction) {
    const customerAuth = await getCustomerFromCookie(req);
    if (!customerAuth) return res.status(401).json({ message: "Not logged in" });
    (req as any).customerId = customerAuth.customerId;
    next();
  }

  app.post("/api/customer/login", async (req, res) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Please enter a valid email address." });

    const email = parsed.data.email.toLowerCase();

    const now = Date.now();
    const lastRequest = magicLinkRateLimit.get(email);
    if (lastRequest && now - lastRequest < 60_000) {
      return res.status(429).json({ message: "Please wait a minute before requesting another login link." });
    }
    magicLinkRateLimit.set(email, now);

    const customer = await storage.findOrCreateCustomer(email);
    await storage.linkOrdersByEmail(email, customer.id);

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await storage.createCustomerSession({
      customerId: customer.id,
      tokenHash,
      expiresAt,
    });

    const appUrl = `https://${req.headers.host}`;
    const storeSlug = req.body.storeSlug || "";
    const redirectParam = storeSlug ? `&redirect=${encodeURIComponent(`/s/${storeSlug}/portal`)}` : "";
    const magicLink = `${appUrl}/account/verify?token=${rawToken}${redirectParam}`;

    let storeName: string | undefined;
    if (storeSlug) {
      const store = await storage.getStoreBySlug(storeSlug);
      storeName = store?.name;
    }

    await sendMagicLinkEmail({ email, magicLink, storeName });

    res.json({
      message: "A login link has been sent to your email address. Please check your inbox (and spam folder).",
    });
  });

  app.get("/api/customer/verify", async (req, res) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const tokenHash = hashToken(token);
    const session = await storage.getCustomerSessionByToken(tokenHash);

    if (!session) return res.status(400).json({ message: "Invalid or expired login link" });
    if (new Date() > session.expiresAt) {
      await storage.deleteCustomerSession(session.id);
      return res.status(400).json({ message: "Login link has expired. Please request a new one." });
    }

    const newSessionToken = randomBytes(32).toString("hex");
    const newTokenHash = hashToken(newSessionToken);
    const newExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await storage.deleteCustomerSession(session.id);
    await storage.createCustomerSession({
      customerId: session.customerId,
      tokenHash: newTokenHash,
      expiresAt: newExpires,
    });

    res.cookie("customer_session", newSessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ success: true });
  });

  app.get("/api/customer/me", async (req, res) => {
    const customerAuth = await getCustomerFromCookie(req);
    if (!customerAuth) return res.status(401).json({ message: "Not logged in" });
    const customer = await storage.getCustomerById(customerAuth.customerId);
    if (!customer) return res.status(401).json({ message: "Customer not found" });
    res.json({ id: customer.id, email: customer.email });
  });

  app.post("/api/customer/logout", async (req, res) => {
    const sessionToken = req.cookies?.customer_session;
    if (sessionToken) {
      const tokenHash = hashToken(sessionToken);
      const session = await storage.getCustomerSessionByToken(tokenHash);
      if (session) await storage.deleteCustomerSession(session.id);
    }
    res.clearCookie("customer_session", { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/customer/purchases", isCustomerAuthenticated, async (req, res) => {
    const customerId = (req as any).customerId;
    const storeSlug = req.query.store as string | undefined;
    const customerOrders = await storage.getOrdersByCustomer(customerId);

    const filteredOrders = storeSlug
      ? customerOrders.filter((o) => o.store.slug.toLowerCase() === storeSlug.toLowerCase())
      : customerOrders;

    const purchasesWithItems = await Promise.all(
      filteredOrders.map(async (order) => {
        const items = await storage.getOrderItemsByOrder(order.id);
        return {
          id: order.id,
          totalCents: order.totalCents,
          status: order.status,
          createdAt: order.createdAt,
          store: {
            id: order.store.id,
            name: order.store.name,
            slug: order.store.slug,
          },
          items: await Promise.all(items.map(async (i) => {
            const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, i.productId);
            return {
              id: i.id,
              productId: i.productId,
              title: sp?.customTitle || i.product.title,
              priceCents: i.priceCents,
              thumbnailUrl: i.product.thumbnailUrl,
            };
          })),
        };
      })
    );

    res.json(purchasesWithItems);
  });

  app.get("/api/customer/purchase/:orderId", isCustomerAuthenticated, async (req, res) => {
    const customerId = (req as any).customerId;
    const order = await storage.getOrderById(req.params.orderId as string);
    if (!order || order.customerId !== customerId) {
      return res.status(404).json({ message: "Order not found" });
    }

    const store = await storage.getStoreById(order.storeId);
    const items = await storage.getOrderItemsByOrder(order.id);

    const orderTokens = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, order.id));
    const activeToken = orderTokens.find(t => !t.expiresAt || t.expiresAt > new Date());

    const itemsWithFiles = await Promise.all(
      items.map(async (item) => {
        const assets = await storage.getFileAssetsByProduct(item.productId);
        const hasFiles = assets.length > 0 || !!item.product.fileUrl;
        const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, item.productId);
        let resolvedAccessUrl = sp?.customAccessUrl || item.product.accessUrl || null;

        if (resolvedAccessUrl && resolvedAccessUrl.includes("/kb/") && activeToken) {
          const sep = resolvedAccessUrl.includes("?") ? "&" : "?";
          resolvedAccessUrl = `${resolvedAccessUrl}${sep}token=${activeToken.tokenHash}`;
        }

        return {
          id: item.id,
          productId: item.productId,
          title: sp?.customTitle || item.product.title,
          priceCents: item.priceCents,
          thumbnailUrl: item.product.thumbnailUrl,
          hasFiles,
          productType: item.product.productType || "digital",
          deliveryInstructions: sp?.customDeliveryInstructions || item.product.deliveryInstructions || null,
          accessUrl: resolvedAccessUrl,
          redemptionCode: sp?.customRedemptionCode || item.product.redemptionCode || null,
          description: sp?.customDescription || item.product.description || null,
        };
      })
    );

    const moreProducts = store ? await storage.getPublishedStoreProducts(store.id) : [];
    const purchasedProductIds = new Set(items.map((i) => i.productId));
    const upsellProducts = moreProducts
      .filter((p) => !purchasedProductIds.has(p.id))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        title: p.title,
        priceCents: p.priceCents,
        thumbnailUrl: p.thumbnailUrl,
      }));

    res.json({
      order: {
        id: order.id,
        totalCents: order.totalCents,
        status: order.status,
        createdAt: order.createdAt,
      },
      store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
      items: itemsWithFiles,
      upsellProducts,
    });
  });

  app.post("/api/customer/download", isCustomerAuthenticated, async (req, res) => {
    const schema = z.object({ orderItemId: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

    const customerId = (req as any).customerId;

    const allOrders = await storage.getOrdersByCustomer(customerId);
    let foundItem = null;
    let foundOrder = null;

    for (const order of allOrders) {
      const items = await storage.getOrderItemsByOrder(order.id);
      const match = items.find((i) => i.id === parsed.data.orderItemId);
      if (match) {
        foundItem = match;
        foundOrder = order;
        break;
      }
    }

    if (!foundItem || !foundOrder) {
      return res.status(404).json({ message: "Item not found in your purchases" });
    }

    const tokenRaw = randomBytes(32).toString("hex");
    const hash = hashToken(tokenRaw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await storage.createDownloadToken({
      orderId: foundOrder.id,
      tokenHash: hash,
      expiresAt,
    });

    res.json({ downloadToken: hash });
  });

  app.get("/api/download/:token", async (req, res) => {
    const downloadToken = await storage.getDownloadTokenByHash(req.params.token as string);
    if (!downloadToken) return res.status(404).json({ message: "Invalid download token" });

    if (new Date() > downloadToken.expiresAt) {
      return res.status(410).json({ message: "Download link expired" });
    }

    const items = await storage.getOrderItemsByOrder(downloadToken.orderId);
    const files: { name: string; url: string }[] = [];

    for (const item of items) {
      const assets = await storage.getFileAssetsByProduct(item.productId);
      if (assets.length > 0) {
        for (const asset of assets) {
          files.push({ name: asset.originalName, url: asset.storageKey });
        }
      } else if (item.product.fileUrl) {
        files.push({
          name: `${item.product.title.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
          url: item.product.fileUrl,
        });
      }
    }

    if (files.length === 0) {
      return res.json({ files: [], message: "No downloadable files for this order." });
    }

    if (files.length === 1) {
      return res.redirect(files[0].url);
    }

    res.json({ files });
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

      const cfResult = await createCustomHostname(parsed.data.domain);

      await db.update(stores).set({
        customDomain: parsed.data.domain,
        domainStatus: "pending_dns",
        domainSource: "cloudflare",
        cloudflareHostnameId: cfResult.id,
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
      const isFailed = cfResult.verificationErrors && cfResult.verificationErrors.length > 0;

      let newStatus = store.domainStatus;
      if (isActive) {
        newStatus = "active";
      } else if (isFailed) {
        newStatus = "failed";
      } else if (cfResult.status === "pending") {
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

      await db.update(stores).set({
        customDomain: null,
        domainStatus: null,
        domainSource: null,
        domainVerifiedAt: null,
        cloudflareHostnameId: null,
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

  app.post("/api/admin/test-emails", async (req, res) => {
    const userId = getUserId(req);
    const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const profile = await storage.getUserProfile(userId);
    if (!profile?.isAdmin) return res.status(403).json({ message: "Admin access required" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email address required" });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const results = await sendAllTestEmails(email, baseUrl);
    res.json({ results });
  });

  app.get("/api/admin/email-logs", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const profile = await storage.getUserProfile(userId);
    if (!profile?.isAdmin) return res.status(403).json({ message: "Admin access required" });

    const logs = await db
      .select()
      .from(emailLogs)
      .orderBy(sql`${emailLogs.sentAt} DESC`)
      .limit(100);
    res.json(logs);
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
