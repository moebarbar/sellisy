// Product domain — platform-library products, owner-created products,
// per-store product listings, file assets, product images, and product
// categories. Phase 1.3 of the storage split.
//
// Discover (cross-domain marketplace reads) is intentionally NOT here —
// getDiscoverProducts + getDiscoverStores stay in storage.ts until a
// dedicated MarketplaceStorage extraction is justified.

import { db } from "../db";
import {
  products,
  storeProducts,
  fileAssets,
  productImages,
  categories,
  type Product,
  type InsertProduct,
  type StoreProduct,
  type InsertStoreProduct,
  type InsertFileAsset,
  type InsertCategory,
  type Category,
} from "@shared/schema";
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm";

export const productStorage = {
  // ─── Products ──────────────────────────────────────────────────────

  async getLibraryProducts() {
    return db.select().from(products).where(and(eq(products.source, "PLATFORM"), isNull(products.deletedAt)));
  },

  async getProductsByOwner(ownerId: string) {
    return db.select().from(products).where(and(eq(products.ownerId, ownerId), isNull(products.deletedAt))).orderBy(desc(products.createdAt));
  },

  async getProductById(id: string) {
    const [product] = await db.select().from(products).where(and(eq(products.id, id), isNull(products.deletedAt)));
    return product;
  },

  // Buyer-access variant: paid content must survive the seller soft-deleting
  // the product. Sellers' dashboards and storefront listings keep using the
  // deletedAt-filtered read above; this one backs course access, quizzes,
  // and certificates for buyers who already own the product.
  async getProductByIdIncludingDeleted(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  },

  async getProductBySlug(slug: string) {
    const [product] = await db.select().from(products).where(and(eq(products.slug, slug), isNull(products.deletedAt)));
    return product;
  },

  async createProduct(data: InsertProduct) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  },

  async updateProduct(id: string, data: Partial<Pick<Product, "title" | "slug" | "description" | "tagline" | "category" | "priceCents" | "originalPriceCents" | "thumbnailUrl" | "fileUrl" | "status" | "requiredTier" | "productType" | "deliveryInstructions" | "accessUrl" | "redemptionCode" | "tags" | "highlights" | "version" | "fileSize" | "certificatesEnabled" | "reviewsEnabled" | "pwywEnabled" | "pwywMinCents" | "discordGuildId" | "discordRoleId">>) {
    const [product] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product;
  },

  async deleteProduct(id: string, callerOwnerId?: string) {
    if (callerOwnerId) {
      const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.ownerId, callerOwnerId)));
      if (!product) throw new Error("Product not found or not owned by caller");
    }
    await db.update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(products.id, id));
  },

  async hardDeleteProduct(id: string) {
    console.warn(`[DATA-SAFETY] hardDeleteProduct called for product ${id} — permanently removing product and related assets`);
    await db.delete(storeProducts).where(eq(storeProducts.productId, id));
    await db.delete(fileAssets).where(eq(fileAssets.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
  },

  async restoreProduct(id: string) {
    const [product] = await db.update(products).set({ deletedAt: null, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product;
  },

  async getDeletedProducts() {
    return db.select().from(products).where(isNotNull(products.deletedAt)).orderBy(desc(products.deletedAt));
  },

  // ─── Store products ────────────────────────────────────────────────

  async getStoreProducts(storeId: string) {
    const rows = await db
      .select({ sp: storeProducts, product: products })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(and(eq(storeProducts.storeId, storeId), isNull(products.deletedAt)));
    return rows.map((r) => ({ ...r.sp, product: r.product }));
  },

  async getPublishedStoreProducts(storeId: string) {
    const rows = await db
      .select({ product: products })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.isPublished, true), isNull(products.deletedAt)));
    return rows.map((r) => r.product);
  },

  async getStoreProductById(id: string) {
    const [sp] = await db.select().from(storeProducts).where(eq(storeProducts.id, id));
    return sp;
  },

  async getStoreProductByStoreAndProduct(storeId: string, productId: string) {
    const [sp] = await db.select().from(storeProducts).where(
      and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId))
    );
    return sp;
  },

  async createStoreProduct(data: InsertStoreProduct) {
    const [sp] = await db.insert(storeProducts).values(data).returning();
    return sp;
  },

  async updateStoreProductPublish(id: string, isPublished: boolean) {
    const [sp] = await db.update(storeProducts).set({ isPublished, updatedAt: new Date() }).where(eq(storeProducts.id, id)).returning();
    return sp;
  },

  async updateStoreProduct(id: string, data: Partial<Pick<StoreProduct, "customPriceCents" | "customTitle" | "customDescription" | "customTags" | "customAccessUrl" | "customRedemptionCode" | "customDeliveryInstructions" | "isPublished" | "isLeadMagnet" | "isFeatured" | "sortOrder" | "upsellProductId" | "upsellBundleId">>) {
    const [sp] = await db.update(storeProducts).set({ ...data, updatedAt: new Date() }).where(eq(storeProducts.id, id)).returning();
    return sp;
  },

  async deleteStoreProduct(id: string) {
    await db.delete(storeProducts).where(eq(storeProducts.id, id));
  },

  // ─── File assets ───────────────────────────────────────────────────

  async getFileAssetsByProduct(productId: string) {
    return db.select().from(fileAssets).where(eq(fileAssets.productId, productId));
  },

  async createFileAsset(data: InsertFileAsset) {
    const [asset] = await db.insert(fileAssets).values(data).returning();
    return asset;
  },

  // ─── Product images ───────────────────────────────────────────────

  async getProductImages(productId: string) {
    return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder);
  },

  async setProductImages(productId: string, images: { url: string; sortOrder: number; isPrimary: boolean }[]) {
    await db.delete(productImages).where(eq(productImages.productId, productId));
    if (images.length === 0) return [];
    const rows = images.map((img) => ({
      productId,
      url: img.url,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    }));
    return db.insert(productImages).values(rows).returning();
  },

  // ─── Categories ───────────────────────────────────────────────────

  async getCategoriesByOwner(ownerId: string) {
    return db.select().from(categories).where(eq(categories.ownerId, ownerId)).orderBy(categories.sortOrder);
  },

  async createCategory(cat: InsertCategory) {
    const [created] = await db.insert(categories).values(cat).returning();
    return created;
  },

  async updateCategory(id: string, data: Partial<Pick<Category, "name" | "slug" | "sortOrder">>) {
    const [updated] = await db.update(categories).set({ ...data, updatedAt: new Date() }).where(eq(categories.id, id)).returning();
    return updated;
  },

  async deleteCategory(id: string) {
    await db.delete(categories).where(eq(categories.id, id));
  },

  async ensureDefaultCategories(ownerId: string) {
    const defaults = [
      { name: "Templates", slug: "templates", sortOrder: 0 },
      { name: "Graphics", slug: "graphics", sortOrder: 1 },
      { name: "Ebooks", slug: "ebooks", sortOrder: 2 },
      { name: "Tools", slug: "tools", sortOrder: 3 },
      { name: "Software", slug: "software", sortOrder: 4 },
    ];
    const existing = await productStorage.getCategoriesByOwner(ownerId);
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const missing = defaults.filter((d) => !existingSlugs.has(d.slug));
    if (missing.length > 0) {
      const rows = missing.map((d) => ({ ...d, ownerId }));
      await db.insert(categories).values(rows).onConflictDoNothing();
      return productStorage.getCategoriesByOwner(ownerId);
    }
    return existing;
  },
};

export type ProductStorage = typeof productStorage;
