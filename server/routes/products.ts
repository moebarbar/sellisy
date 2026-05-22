// Catalog domain: categories, products, store-products, bundles, coupons.
// Owner-facing CRUD for everything that shows up on a storefront's product
// grid + the coupon validation endpoint used at checkout.
//
// Extracted from server/routes.ts as part of the routes-split refactor.
// Mounted in registerRoutes as: app.use(productsRouter)

import { Router } from "express";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";

import { storage } from "../storage";
import { db } from "../db";
import { isAuthenticated } from "../replit_integrations/auth";
import {
  bundles,
  categories,
  coupons,
  products,
  storeProducts,
  PLAN_FEATURES,
  canAccessTier,
  type PlanTier,
} from "@shared/schema";
import { generateSlug, getUserId, getUserPlanTier, isUserAdmin } from "./_helpers";

export const productsRouter = Router();

productsRouter.get("/api/categories", isAuthenticated, async (req, res) => {
  const cats = await storage.ensureDefaultCategories(getUserId(req));
  res.json(cats);
});

productsRouter.post("/api/categories", isAuthenticated, async (req, res) => {
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

productsRouter.patch("/api/categories/:id", isAuthenticated, async (req, res) => {
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

productsRouter.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
  const cats = await storage.getCategoriesByOwner(getUserId(req));
  const cat = cats.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ message: "Category not found" });
  await storage.deleteCategory(cat.id);
  res.json({ success: true });
});

productsRouter.get("/api/products/library/public", async (_req, res) => {
  const library = await storage.getLibraryProducts();
  const publicProducts = library
    .filter((p: any) => p.thumbnailUrl)
    .slice(0, 50)
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: (p.priceCents / 100).toFixed(2),
      imageUrl: p.thumbnailUrl,
      productType: p.productType,
      slug: p.slug,
    }));
  res.json(publicProducts);
});

productsRouter.get("/api/products/library", isAuthenticated, async (_req, res) => {
  const library = await storage.getLibraryProducts();
  res.json(library);
});

productsRouter.post("/api/products/:id/promote", isAuthenticated, async (req, res) => {
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

productsRouter.post("/api/products/bulk-import", isAuthenticated, async (req, res) => {
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

productsRouter.delete("/api/products/bulk", isAuthenticated, async (req, res) => {
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

productsRouter.patch("/api/products/bulk-status", isAuthenticated, async (req, res) => {
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

productsRouter.get("/api/products/mine", isAuthenticated, async (req, res) => {
  const prods = await storage.getProductsByOwner(getUserId(req));
  res.json(prods);
});

productsRouter.get("/api/products/:id", isAuthenticated, async (req, res) => {
  const product = await storage.getProductById(String(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.ownerId !== getUserId(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  res.json(product);
});

productsRouter.post("/api/products", isAuthenticated, async (req, res) => {
  const imageSchema = z.object({
    url: z.string().min(1),
    sortOrder: z.number().int().min(0),
    isPrimary: z.boolean(),
  });
  const schema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(20000).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    priceCents: z.number().int().min(0),
    originalPriceCents: z.number().int().min(0).optional().nullable(),
    thumbnailUrl: z.string().max(500).optional().nullable(),
    fileUrl: z.string().max(500).optional().nullable(),
    status: z.enum(["DRAFT", "ACTIVE"]).optional(),
    productType: z.enum(["digital", "software", "template", "ebook", "course", "graphics"]).optional(),
    deliveryInstructions: z.string().max(5000).optional().nullable(),
    accessUrl: z.string().max(500).optional().nullable(),
    redemptionCode: z.string().max(200).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional().nullable(),
    highlights: z.array(z.string().max(200)).max(20).optional().nullable(),
    version: z.string().max(50).optional().nullable(),
    fileSize: z.string().max(50).optional().nullable(),
    requiredTier: z.enum(["basic", "pro", "max"]).optional(),
    certificatesEnabled: z.boolean().optional(),
    certAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a 7-character hex color like #1e40af").optional().nullable(),
    certLogoUrl: z.string().max(500).optional().nullable(),
    reviewsEnabled: z.boolean().optional(),
    images: z.array(imageSchema).max(10).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid product data" });

  const imgs = parsed.data.images || [];
  const primaryImg = imgs.find((i) => i.isPrimary) || imgs[0];
  const thumbUrl = primaryImg?.url ?? parsed.data.thumbnailUrl ?? null;

  const admin = await isUserAdmin(getUserId(req));
  const baseSlug = generateSlug(parsed.data.title, "product");
  let productSlug = baseSlug;
  let slugCounter = 1;
  while (await storage.getProductBySlug(productSlug)) {
    productSlug = `${baseSlug}-${slugCounter++}`;
  }
  const product = await storage.createProduct({
    ownerId: getUserId(req),
    source: "USER",
    title: parsed.data.title,
    slug: productSlug,
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
    certificatesEnabled: parsed.data.certificatesEnabled ?? false,
    certAccentColor: parsed.data.certAccentColor ?? null,
    certLogoUrl: parsed.data.certLogoUrl ?? null,
    reviewsEnabled: parsed.data.reviewsEnabled ?? true,
  });

  if (imgs.length > 0) {
    await storage.setProductImages(product.id, imgs);
  }

  res.json(product);
});

productsRouter.patch("/api/products/:id", isAuthenticated, async (req, res) => {
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
    certificatesEnabled: z.boolean().optional(),
    certAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a 7-character hex color like #1e40af").optional().nullable(),
    certLogoUrl: z.string().max(500).optional().nullable(),
    reviewsEnabled: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

  const admin = await isUserAdmin(getUserId(req));
  const { images: imgs, requiredTier, ...productData } = parsed.data;
  if (productData.title) {
    const baseSlug = generateSlug(productData.title, "product");
    let newSlug = baseSlug;
    let slugCtr = 1;
    while (true) {
      const existing = await storage.getProductBySlug(newSlug);
      if (!existing || existing.id === product.id) break;
      newSlug = `${baseSlug}-${slugCtr++}`;
    }
    (productData as any).slug = newSlug;
  }
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

productsRouter.delete("/api/products/:id", isAuthenticated, async (req, res) => {
  const product = await storage.getProductById(req.params.id as string);
  if (!product || product.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Product not found" });
  }

  await storage.deleteProduct(product.id, getUserId(req));
  res.json({ ok: true });
});

productsRouter.get("/api/products/:id/images", isAuthenticated, async (req, res) => {
  const product = await storage.getProductById(req.params.id as string);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.source !== "PLATFORM" && product.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Product not found" });
  }
  const images = await storage.getProductImages(req.params.id as string);
  res.json(images);
});

productsRouter.put("/api/products/:id/images", isAuthenticated, async (req, res) => {
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

productsRouter.get("/api/store-products/:storeId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.storeId as string);
  if (!store || store.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Store not found" });
  }
  const sps = await storage.getStoreProducts(req.params.storeId as string);
  res.json(sps);
});

productsRouter.get("/api/imported-products/:storeId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.storeId as string);
  if (!store || store.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Store not found" });
  }
  const sps = await storage.getStoreProducts(req.params.storeId as string);
  const productIds = sps.map((sp) => sp.productId);
  res.json(productIds);
});

productsRouter.post("/api/store-products", isAuthenticated, async (req, res) => {
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

  const userTier = await getUserPlanTier(userId);
  if (!PLAN_FEATURES[userTier].importProducts) {
    return res.status(403).json({ message: "Library imports require a Growth plan or higher. Upgrade to import products from the Sellisy library." });
  }

  if (product.requiredTier && product.requiredTier !== "basic") {
    if (!canAccessTier(userTier, product.requiredTier as PlanTier)) {
      return res.status(403).json({ message: `This product requires a ${product.requiredTier} plan or higher. Upgrade to access it.` });
    }
  }

  if (product.productType === "software") {
    if (!PLAN_FEATURES[userTier].sellSoftware) {
      return res.status(403).json({ message: "Software products require a max plan. Upgrade to sell software." });
    }
  }

  const existing = await storage.getStoreProductByStoreAndProduct(parsed.data.storeId, parsed.data.productId);
  if (existing) {
    return res.status(409).json({ message: "Product already imported to this store" });
  }

  const existingSPs = await storage.getStoreProducts(parsed.data.storeId);
  const sp = await storage.createStoreProduct({
    storeId: parsed.data.storeId,
    productId: parsed.data.productId,
    isPublished: false,
    sortOrder: existingSPs.length,
  });
  res.json(sp);
});

productsRouter.patch("/api/store-products/:id", isAuthenticated, async (req, res) => {
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
    isFeatured: z.boolean().optional(),
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

  if (parsed.data.isFeatured) {
    const allSps = await storage.getStoreProducts(store.id);
    const featuredCount = allSps.filter((sp) => sp.isFeatured && sp.id !== req.params.id).length;
    if (featuredCount >= 3) {
      return res.status(400).json({ message: "Maximum 3 featured products per store" });
    }
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

productsRouter.delete("/api/store-products/:id", isAuthenticated, async (req, res) => {
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

productsRouter.get("/api/bundles/:storeId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.storeId as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const storeBundles = await storage.getBundlesByStore(store.id);
  const allItems = await Promise.all(
    storeBundles.map((b) => storage.getBundleItems(b.id))
  );
  const result = storeBundles.map((b, i) => ({ ...b, products: allItems[i].map(item => item.product) }));
  res.json(result);
});

productsRouter.post("/api/bundles", isAuthenticated, async (req, res) => {
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

productsRouter.patch("/api/bundles/:id", isAuthenticated, async (req, res) => {
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

productsRouter.delete("/api/bundles/:id", isAuthenticated, async (req, res) => {
  const bundle = await storage.getBundleById(req.params.id as string);
  if (!bundle) return res.status(404).json({ message: "Bundle not found" });

  const store = await storage.getStoreById(bundle.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });

  await storage.deleteBundle(bundle.id);
  res.json({ ok: true });
});

// --- Coupons CRUD ---

productsRouter.get("/api/coupons/:storeId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.storeId as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const storeCoupons = await storage.getCouponsByStore(store.id);
  res.json(storeCoupons);
});

productsRouter.post("/api/coupons", isAuthenticated, async (req, res) => {
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

productsRouter.patch("/api/coupons/:id", isAuthenticated, async (req, res) => {
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

productsRouter.delete("/api/coupons/:id", isAuthenticated, async (req, res) => {
  const coupon = await storage.getCouponById(req.params.id as string);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  const store = await storage.getStoreById(coupon.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });

  await storage.deleteCoupon(coupon.id);
  res.json({ ok: true });
});

productsRouter.post("/api/coupons/validate", async (req, res) => {
  const schema = z.object({ storeId: z.string().max(100), code: z.string().max(50) });
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
