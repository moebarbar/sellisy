import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { db } from "./db";
import { orders, orderItems, downloadTokens, coupons, customers, products, marketingStrategies, storeStrategyProgress, PLAN_FEATURES, canAccessTier, type PlanTier } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { seedDatabase, seedMarketingIfNeeded } from "./seed";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import cookieParser from "cookie-parser";

function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub;
}

function sanitizeStore(store: any) {
  const { paypalClientId, paypalClientSecret, ...safe } = store;
  return { ...safe, paypalClientId: paypalClientId ? "***configured***" : null };
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

  await seedDatabase();
  await seedMarketingIfNeeded();

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
    res.json(stores);
  });

  app.get("/api/stores/:id", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json(store);
  });

  app.post("/api/stores", isAuthenticated, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      templateKey: z.enum(["neon", "silk"]),
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
      templateKey: z.enum(["neon", "silk"]).optional(),
      tagline: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
      accentColor: z.string().optional().nullable(),
      heroBannerUrl: z.string().optional().nullable(),
      paymentProvider: z.enum(["stripe", "paypal"]).optional(),
      paypalClientId: z.string().optional().nullable(),
      paypalClientSecret: z.string().optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    if (parsed.data.slug && parsed.data.slug !== store.slug) {
      const existing = await storage.getStoreBySlug(parsed.data.slug);
      if (existing) return res.status(409).json({ message: "Slug already taken" });
    }

    const updated = await storage.updateStore(store.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/stores/:id", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.id as string);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
    }
    await storage.deleteStore(store.id);
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

    await db.update(products).set({ source: "PLATFORM", ownerId: null }).where(eq(products.id, productId));
    const updated = await storage.getProductById(productId);
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
          source: "PLATFORM",
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
      images: z.array(imageSchema).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid product data" });

    const imgs = parsed.data.images || [];
    const primaryImg = imgs.find((i) => i.isPrimary) || imgs[0];
    const thumbUrl = primaryImg?.url ?? parsed.data.thumbnailUrl ?? null;

    const product = await storage.createProduct({
      ownerId: getUserId(req),
      source: "USER",
      title: parsed.data.title,
      description: parsed.data.description || null,
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
    });

    if (imgs.length > 0) {
      await storage.setProductImages(product.id, imgs);
    }

    res.json(product);
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    const product = await storage.getProductById(req.params.id as string);
    if (!product || product.ownerId !== getUserId(req) || product.source !== "USER") {
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
      images: z.array(imageSchema).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const { images: imgs, ...productData } = parsed.data;
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
    if (!product || product.ownerId !== getUserId(req) || product.source !== "USER") {
      return res.status(404).json({ message: "Product not found" });
    }

    await storage.deleteProduct(product.id);
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
    const kb = await storage.createKnowledgeBase({
      ownerId: userId,
      title: parsed.success && parsed.data.title ? parsed.data.title : "Untitled",
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
    const page = await storage.createKbPage({
      knowledgeBaseId: kb.id,
      title: parsed.success && parsed.data.title ? parsed.data.title : "Untitled Page",
      parentPageId: parsed.success ? parsed.data.parentPageId || null : null,
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
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link"]).optional(),
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

  app.patch("/api/kb-blocks/:id", isAuthenticated, async (req, res) => {
    const block = await storage.getKbBlockById(req.params.id as string);
    if (!block) return res.status(404).json({ message: "Not found" });
    const page = await storage.getKbPageById(block.pageId);
    if (!page) return res.status(404).json({ message: "Not found" });
    const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
    if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
    const schema = z.object({
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link"]).optional(),
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

    res.json({
      knowledgeBase: {
        id: kb.id,
        title: kb.title,
        description: kb.description,
        coverImageUrl: kb.coverImageUrl,
        priceCents: kb.priceCents,
      },
      pages: hasAccess ? pages : pages.map(p => ({ ...p, locked: true })),
      hasAccess,
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

  // --- Public storefront ---

  app.get("/api/storefront/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const [storeProductRows, publishedBundles] = await Promise.all([
      storage.getStoreProducts(store.id),
      storage.getPublishedBundlesByStore(store.id),
    ]);
    const publishedRows = storeProductRows.filter((sp) => sp.isPublished);
    const productsWithMeta = publishedRows.map((sp) => ({
      ...sp.product,
      title: sp.customTitle || sp.product.title,
      description: sp.customDescription || sp.product.description,
      tags: sp.customTags || sp.product.tags,
      accessUrl: sp.customAccessUrl || sp.product.accessUrl,
      redemptionCode: sp.customRedemptionCode || sp.product.redemptionCode,
      deliveryInstructions: sp.customDeliveryInstructions || sp.product.deliveryInstructions,
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
      products: allBundleItems[i].map((item) => item.product),
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
    const effectiveProduct = {
      ...product,
      title: sp.customTitle || product.title,
      description: sp.customDescription || product.description,
      tags: sp.customTags || product.tags,
      accessUrl: sp.customAccessUrl || product.accessUrl,
      redemptionCode: sp.customRedemptionCode || product.redemptionCode,
      deliveryInstructions: sp.customDeliveryInstructions || product.deliveryInstructions,
      priceCents: sp.customPriceCents ?? product.priceCents,
      originalPriceCents: sp.customPriceCents != null && sp.customPriceCents !== product.priceCents ? product.priceCents : product.originalPriceCents,
      isLeadMagnet: sp.isLeadMagnet,
      storeProductId: sp.id,
    };
    res.json({ store: sanitizeStore(store), product: effectiveProduct, images });
  });

  app.get("/api/storefront/:slug/bundle/:bundleId", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const data = await storage.getBundleWithProducts(req.params.bundleId as string);
    if (!data || data.bundle.storeId !== store.id || !data.bundle.isPublished) return res.status(404).json({ message: "Bundle not found" });

    res.json({ store: sanitizeStore(store), bundle: data.bundle, products: data.products });
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
    const schema = z.object({
      storeId: z.string(),
      productId: z.string().optional(),
      bundleId: z.string().optional(),
      buyerEmail: z.string().email().optional(),
      couponCode: z.string().optional(),
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

    if (store.paymentProvider === "paypal" && store.paypalClientId && store.paypalClientSecret) {
      try {
        const { approveUrl, paypalOrderId } = await createPayPalOrder(
          store.paypalClientId,
          store.paypalClientSecret,
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
        const stripe = await getUncachableStripeClient();

        const productData: any = { name: itemName };
        if (itemDescription) productData.description = itemDescription.substring(0, 500);
        const images: string[] = [];
        if (itemImage && itemImage.startsWith("http")) images.push(itemImage);
        if (images.length > 0) productData.images = images;

        const session = await stripe.checkout.sessions.create({
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
        });

        await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id));

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Stripe checkout error:", error.message);
        res.status(500).json({ message: "Payment processing unavailable. Please try again later." });
      }
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
    const id = req.params.identifier as string;
    let order = await storage.getOrderById(id);

    if (!order) {
      order = await storage.getOrderByStripeSession(id);
    }

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "PENDING" && order.stripeSessionId) {
      try {
        const stripe = await getUncachableStripeClient();
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
          await storage.updateOrderStatus(order.id, "COMPLETED");
          order = (await storage.getOrderById(order.id))!;

          if (order.couponId) {
            await storage.incrementCouponUses(order.couponId);
          }

          if (!order.customerId && order.buyerEmail && order.buyerEmail !== "pending@checkout.com") {
            const emailFromSession = (session as any).customer_details?.email || order.buyerEmail;
            const customer = await storage.findOrCreateCustomer(emailFromSession);
            await storage.setOrderCustomerId(order.id, customer.id);
            await storage.linkOrdersByEmail(emailFromSession, customer.id);
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

    res.json({
      order: {
        id: order.id,
        buyerEmail: order.buyerEmail,
        totalCents: order.totalCents,
        status: order.status,
      },
      downloadToken: tokenHash,
      store: store ? { name: store.name, slug: store.slug } : null,
      items: await Promise.all(items.map(async (i) => {
        const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, i.productId);
        return {
          title: sp?.customTitle || i.product.title,
          priceCents: i.priceCents,
        };
      })),
      fileCount,
    });
  });

  function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

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

    console.log(`[DEV MODE] Magic link for ${email}: ${magicLink}`);

    res.json({
      message: "Login link generated",
      devModeLink: magicLink,
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

  return httpServer;
}
