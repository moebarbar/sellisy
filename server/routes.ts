import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(password + salt).digest("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const computed = createHash("sha256").update(password + salt).digest("hex");
  return hash === computed;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "digitalvault-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  await seedDatabase();

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/register", async (req, res) => {
    const schema = z.object({ username: z.string().min(3), password: z.string().min(6) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Username (3+ chars) and password (6+ chars) required" });

    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) return res.status(409).json({ message: "Username already taken" });

    const hashed = await hashPassword(parsed.data.password);
    const user = await storage.createUser({ username: parsed.data.username, password: hashed });
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/login", async (req, res) => {
    const schema = z.object({ username: z.string(), password: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Username and password required" });

    const user = await storage.getUserByUsername(parsed.data.username);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await verifyPassword(parsed.data.password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ ok: true });
  });

  app.get("/api/stores", requireAuth, async (req, res) => {
    const stores = await storage.getStoresByOwner(req.session.userId!);
    res.json(stores);
  });

  app.get("/api/stores/:id", requireAuth, async (req, res) => {
    const store = await storage.getStoreById(req.params.id);
    if (!store || store.ownerId !== req.session.userId) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json(store);
  });

  app.post("/api/stores", requireAuth, async (req, res) => {
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
      ownerId: req.session.userId!,
      name: parsed.data.name,
      slug: parsed.data.slug,
      templateKey: parsed.data.templateKey,
    });
    res.json(store);
  });

  app.get("/api/products/library", requireAuth, async (_req, res) => {
    const library = await storage.getLibraryProducts();
    res.json(library);
  });

  app.get("/api/store-products/:storeId", requireAuth, async (req, res) => {
    const store = await storage.getStoreById(req.params.storeId);
    if (!store || store.ownerId !== req.session.userId) {
      return res.status(404).json({ message: "Store not found" });
    }
    const sps = await storage.getStoreProducts(req.params.storeId);
    res.json(sps);
  });

  app.post("/api/store-products", requireAuth, async (req, res) => {
    const schema = z.object({ storeId: z.string(), productId: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const store = await storage.getStoreById(parsed.data.storeId);
    if (!store || store.ownerId !== req.session.userId) {
      return res.status(404).json({ message: "Store not found" });
    }

    const sp = await storage.createStoreProduct({
      storeId: parsed.data.storeId,
      productId: parsed.data.productId,
      isPublished: false,
      sortOrder: 0,
    });
    res.json(sp);
  });

  app.patch("/api/store-products/:id", requireAuth, async (req, res) => {
    const schema = z.object({ isPublished: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

    const spData = await storage.getStoreProductById(req.params.id);
    if (!spData) return res.status(404).json({ message: "Not found" });

    const store = await storage.getStoreById(spData.storeId);
    if (!store || store.ownerId !== req.session.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const sp = await storage.updateStoreProductPublish(req.params.id, parsed.data.isPublished);
    if (!sp) return res.status(404).json({ message: "Not found" });
    res.json(sp);
  });

  app.get("/api/storefront/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
    res.json({
      mockUrl: `${appUrl}/checkout/success?order_id=${order.id}`,
      message: "Stripe not configured — demo order created",
    });
  });

  app.get("/api/checkout/success/:orderId", async (req, res) => {
    const order = await storage.getOrderById(req.params.orderId);
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
    const downloadToken = await storage.getDownloadTokenByHash(req.params.token);
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
