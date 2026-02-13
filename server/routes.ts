import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { randomBytes } from "crypto";
import { z } from "zod";

function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await seedDatabase();

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
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

    const existing = await storage.getStoreBySlug(parsed.data.slug);
    if (existing) return res.status(409).json({ message: "Slug already taken" });

    const store = await storage.createStore({
      ownerId: getUserId(req),
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

  app.get("/api/products/library", isAuthenticated, async (_req, res) => {
    const library = await storage.getLibraryProducts();
    res.json(library);
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

    const store = await storage.getStoreById(parsed.data.storeId);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(404).json({ message: "Store not found" });
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
    const schema = z.object({ isPublished: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const spData = await storage.getStoreProductById(req.params.id as string);
    if (!spData) return res.status(404).json({ message: "Not found" });

    const store = await storage.getStoreById(spData.storeId);
    if (!store || store.ownerId !== getUserId(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const sp = await storage.updateStoreProductPublish(req.params.id as string, parsed.data.isPublished);
    if (!sp) return res.status(404).json({ message: "Not found" });
    res.json(sp);
  });

  // --- Bundle CRUD (authenticated) ---

  app.get("/api/bundles/:storeId", isAuthenticated, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId as string);
    if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
    const storeBundles = await storage.getBundlesByStore(store.id);
    const result = [];
    for (const b of storeBundles) {
      const items = await storage.getBundleItems(b.id);
      result.push({ ...b, products: items.map(i => i.product) });
    }
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
    const result = [];
    for (const order of storeOrders) {
      const items = await storage.getOrderItemsByOrder(order.id);
      result.push({ ...order, items });
    }
    res.json(result);
  });

  // --- Analytics ---

  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const userStores = await storage.getStoresByOwner(userId);
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProducts = 0;
    const topProducts: { title: string; revenue: number; count: number }[] = [];
    const revenueByDate: Record<string, number> = {};

    for (const store of userStores) {
      const storeOrders = await storage.getOrdersByStore(store.id);
      const storeProds = await storage.getStoreProducts(store.id);
      totalProducts += storeProds.length;

      for (const order of storeOrders) {
        if (order.status === "COMPLETED") {
          totalRevenue += order.totalCents;
          totalOrders++;
          const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
          revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.totalCents;

          const items = await storage.getOrderItemsByOrder(order.id);
          for (const item of items) {
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

  // --- Public storefront ---

  app.get("/api/storefront/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const publishedProducts = await storage.getPublishedStoreProducts(store.id);
    const publishedBundles = await storage.getPublishedBundlesByStore(store.id);
    const bundlesWithProducts = [];
    for (const b of publishedBundles) {
      const items = await storage.getBundleItems(b.id);
      bundlesWithProducts.push({ ...b, products: items.map(i => i.product) });
    }
    res.json({ store, products: publishedProducts, bundles: bundlesWithProducts });
  });

  app.get("/api/storefront/:slug/product/:productId", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const product = await storage.getProductById(req.params.productId as string);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ store, product });
  });

  app.get("/api/storefront/:slug/bundle/:bundleId", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const data = await storage.getBundleWithProducts(req.params.bundleId as string);
    if (!data || data.bundle.storeId !== store.id) return res.status(404).json({ message: "Bundle not found" });

    res.json({ store, bundle: data.bundle, products: data.products });
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
    const itemsToAdd: { productId: string; priceCents: number }[] = [];

    if (parsed.data.bundleId) {
      const bundleData = await storage.getBundleWithProducts(parsed.data.bundleId);
      if (!bundleData || bundleData.bundle.storeId !== store.id) return res.status(404).json({ message: "Bundle not found" });
      totalCents = bundleData.bundle.priceCents;
      for (const p of bundleData.products) {
        itemsToAdd.push({ productId: p.id, priceCents: p.priceCents });
      }
    } else if (parsed.data.productId) {
      const product = await storage.getProductById(parsed.data.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      totalCents = product.priceCents;
      itemsToAdd.push({ productId: product.id, priceCents: product.priceCents });
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
      await storage.incrementCouponUses(coupon.id);
    }

    const order = await storage.createOrder({
      storeId: store.id,
      buyerEmail: parsed.data.buyerEmail || "demo@example.com",
      totalCents,
      stripeSessionId: null,
      couponId,
      status: "COMPLETED",
    });

    for (const item of itemsToAdd) {
      await storage.createOrderItem({ orderId: order.id, ...item });
    }

    const tokenHash = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await storage.createDownloadToken({
      orderId: order.id,
      tokenHash,
      expiresAt,
    });

    const appUrl = `https://${req.headers.host}`;
    res.json({
      mockUrl: `${appUrl}/checkout/success?order_id=${order.id}`,
      message: "Stripe not configured — demo order created",
      orderId: order.id,
      totalCents,
    });
  });

  app.get("/api/checkout/success/:orderId", async (req, res) => {
    const order = await storage.getOrderById(req.params.orderId as string);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const hash = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = await storage.createDownloadToken({ orderId: order.id, tokenHash: hash, expiresAt });

    res.json({
      order: {
        id: order.id,
        buyerEmail: order.buyerEmail,
        totalCents: order.totalCents,
        status: order.status,
      },
      downloadToken: token.tokenHash,
    });
  });

  app.get("/api/download/:token", async (req, res) => {
    const downloadToken = await storage.getDownloadTokenByHash(req.params.token as string);
    if (!downloadToken) return res.status(404).json({ message: "Invalid download token" });

    if (new Date() > downloadToken.expiresAt) {
      return res.status(410).json({ message: "Download link expired" });
    }

    res.json({
      message: "R2/S3 not configured. In production, this would redirect to a signed URL.",
      mockDownloadUrl: "https://example.com/mock-file.zip",
    });
  });

  return httpServer;
}
