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

  app.get("/api/storefront/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug as string);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const publishedProducts = await storage.getPublishedStoreProducts(store.id);
    res.json({ store, products: publishedProducts });
  });

  app.post("/api/checkout", async (req, res) => {
    const schema = z.object({ storeId: z.string(), productId: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const store = await storage.getStoreBySlug(parsed.data.storeId) || await storage.getStoreById(parsed.data.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const product = await storage.getProductById(parsed.data.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const order = await storage.createOrder({
      storeId: store.id,
      buyerEmail: "demo@example.com",
      totalCents: product.priceCents,
      stripeSessionId: null,
      status: "COMPLETED",
    });

    await storage.createOrderItem({
      orderId: order.id,
      productId: product.id,
      priceCents: product.priceCents,
    });

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
