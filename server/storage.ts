import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  stores, products, fileAssets, storeProducts, orders, orderItems, downloadTokens,
  bundles, bundleItems, coupons,
  type Store, type InsertStore,
  type Product, type InsertProduct,
  type FileAsset, type InsertFileAsset,
  type StoreProduct, type InsertStoreProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type DownloadToken, type InsertDownloadToken,
  type Bundle, type InsertBundle,
  type BundleItem, type InsertBundleItem,
  type Coupon, type InsertCoupon,
} from "@shared/schema";

export interface IStorage {
  getStoresByOwner(ownerId: string): Promise<Store[]>;
  getStoreById(id: string): Promise<Store | undefined>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl">>): Promise<Store | undefined>;
  deleteStore(id: string): Promise<void>;

  getLibraryProducts(): Promise<Product[]>;
  getProductsByOwner(ownerId: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<Pick<Product, "title" | "description" | "category" | "priceCents" | "originalPriceCents" | "thumbnailUrl" | "fileUrl" | "status">>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  getStoreProducts(storeId: string): Promise<(StoreProduct & { product: Product })[]>;
  getPublishedStoreProducts(storeId: string): Promise<Product[]>;
  getStoreProductById(id: string): Promise<StoreProduct | undefined>;
  getStoreProductByStoreAndProduct(storeId: string, productId: string): Promise<StoreProduct | undefined>;
  createStoreProduct(sp: InsertStoreProduct): Promise<StoreProduct>;
  updateStoreProductPublish(id: string, isPublished: boolean): Promise<StoreProduct | undefined>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByStripeSession(sessionId: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  createDownloadToken(token: InsertDownloadToken): Promise<DownloadToken>;
  getDownloadTokenByHash(hash: string): Promise<DownloadToken | undefined>;

  getFileAssetsByProduct(productId: string): Promise<FileAsset[]>;
  createFileAsset(asset: InsertFileAsset): Promise<FileAsset>;

  createBundle(bundle: InsertBundle): Promise<Bundle>;
  getBundleById(id: string): Promise<Bundle | undefined>;
  getBundlesByStore(storeId: string): Promise<Bundle[]>;
  getPublishedBundlesByStore(storeId: string): Promise<Bundle[]>;
  updateBundle(id: string, data: Partial<InsertBundle>): Promise<Bundle | undefined>;
  deleteBundle(id: string): Promise<void>;
  addBundleItem(item: InsertBundleItem): Promise<BundleItem>;
  removeBundleItem(bundleId: string, productId: string): Promise<void>;
  getBundleItems(bundleId: string): Promise<(BundleItem & { product: Product })[]>;
  getBundleWithProducts(bundleId: string): Promise<{ bundle: Bundle; products: Product[] } | undefined>;

  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  getCouponsByStore(storeId: string): Promise<Coupon[]>;
  getCouponByCode(storeId: string, code: string): Promise<Coupon | undefined>;
  getCouponById(id: string): Promise<Coupon | undefined>;
  updateCoupon(id: string, data: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  incrementCouponUses(id: string): Promise<void>;
  deleteCoupon(id: string): Promise<void>;

  getOrdersByStore(storeId: string): Promise<Order[]>;
  getOrderItemsByOrder(orderId: string): Promise<(OrderItem & { product: Product })[]>;
}

export class DatabaseStorage implements IStorage {
  async getStoresByOwner(ownerId: string) {
    return db.select().from(stores).where(eq(stores.ownerId, ownerId)).orderBy(desc(stores.createdAt));
  }

  async getStoreById(id: string) {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async getStoreBySlug(slug: string) {
    const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
    return store;
  }

  async createStore(data: InsertStore) {
    const [store] = await db.insert(stores).values(data).returning();
    return store;
  }

  async updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl">>) {
    const [store] = await db.update(stores).set(data).where(eq(stores.id, id)).returning();
    return store;
  }

  async deleteStore(id: string) {
    const storeOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.storeId, id));
    for (const o of storeOrders) {
      await db.delete(downloadTokens).where(eq(downloadTokens.orderId, o.id));
      await db.delete(orderItems).where(eq(orderItems.orderId, o.id));
    }
    await db.delete(orders).where(eq(orders.storeId, id));
    const storeBundles = await db.select({ id: bundles.id }).from(bundles).where(eq(bundles.storeId, id));
    for (const b of storeBundles) {
      await db.delete(bundleItems).where(eq(bundleItems.bundleId, b.id));
    }
    await db.delete(bundles).where(eq(bundles.storeId, id));
    await db.delete(storeProducts).where(eq(storeProducts.storeId, id));
    await db.delete(stores).where(eq(stores.id, id));
  }

  async getLibraryProducts() {
    return db.select().from(products).where(eq(products.source, "PLATFORM"));
  }

  async getProductsByOwner(ownerId: string) {
    return db.select().from(products).where(and(eq(products.ownerId, ownerId), eq(products.source, "USER"))).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(data: InsertProduct) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<Pick<Product, "title" | "description" | "category" | "priceCents" | "originalPriceCents" | "thumbnailUrl" | "fileUrl" | "status">>) {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string) {
    await db.delete(storeProducts).where(eq(storeProducts.productId, id));
    await db.delete(fileAssets).where(eq(fileAssets.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async getStoreProducts(storeId: string) {
    const sps = await db.select().from(storeProducts).where(eq(storeProducts.storeId, storeId));
    const result = [];
    for (const sp of sps) {
      const [product] = await db.select().from(products).where(eq(products.id, sp.productId));
      if (product) {
        result.push({ ...sp, product });
      }
    }
    return result;
  }

  async getPublishedStoreProducts(storeId: string) {
    const sps = await db
      .select()
      .from(storeProducts)
      .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.isPublished, true)));
    const result: Product[] = [];
    for (const sp of sps) {
      const [product] = await db.select().from(products).where(eq(products.id, sp.productId));
      if (product) result.push(product);
    }
    return result;
  }

  async getStoreProductById(id: string) {
    const [sp] = await db.select().from(storeProducts).where(eq(storeProducts.id, id));
    return sp;
  }

  async getStoreProductByStoreAndProduct(storeId: string, productId: string) {
    const [sp] = await db.select().from(storeProducts).where(
      and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId))
    );
    return sp;
  }

  async createStoreProduct(data: InsertStoreProduct) {
    const [sp] = await db.insert(storeProducts).values(data).returning();
    return sp;
  }

  async updateStoreProductPublish(id: string, isPublished: boolean) {
    const [sp] = await db.update(storeProducts).set({ isPublished }).where(eq(storeProducts.id, id)).returning();
    return sp;
  }

  async createOrder(data: InsertOrder) {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async getOrderById(id: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByStripeSession(sessionId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId));
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const [order] = await db.update(orders).set({ status: status as any }).where(eq(orders.id, id)).returning();
    return order;
  }

  async createOrderItem(data: InsertOrderItem) {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async createDownloadToken(data: InsertDownloadToken) {
    const [token] = await db.insert(downloadTokens).values(data).returning();
    return token;
  }

  async getDownloadTokenByHash(hash: string) {
    const [token] = await db.select().from(downloadTokens).where(eq(downloadTokens.tokenHash, hash));
    return token;
  }

  async getFileAssetsByProduct(productId: string) {
    return db.select().from(fileAssets).where(eq(fileAssets.productId, productId));
  }

  async createFileAsset(data: InsertFileAsset) {
    const [asset] = await db.insert(fileAssets).values(data).returning();
    return asset;
  }

  async createBundle(data: InsertBundle) {
    const [bundle] = await db.insert(bundles).values(data).returning();
    return bundle;
  }

  async getBundleById(id: string) {
    const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
    return bundle;
  }

  async getBundlesByStore(storeId: string) {
    return db.select().from(bundles).where(eq(bundles.storeId, storeId)).orderBy(desc(bundles.createdAt));
  }

  async getPublishedBundlesByStore(storeId: string) {
    return db.select().from(bundles).where(and(eq(bundles.storeId, storeId), eq(bundles.isPublished, true)));
  }

  async updateBundle(id: string, data: Partial<InsertBundle>) {
    const [bundle] = await db.update(bundles).set(data).where(eq(bundles.id, id)).returning();
    return bundle;
  }

  async deleteBundle(id: string) {
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
    await db.delete(bundles).where(eq(bundles.id, id));
  }

  async addBundleItem(data: InsertBundleItem) {
    const [item] = await db.insert(bundleItems).values(data).returning();
    return item;
  }

  async removeBundleItem(bundleId: string, productId: string) {
    await db.delete(bundleItems).where(and(eq(bundleItems.bundleId, bundleId), eq(bundleItems.productId, productId)));
  }

  async getBundleItems(bundleId: string) {
    const items = await db.select().from(bundleItems).where(eq(bundleItems.bundleId, bundleId));
    const result = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) result.push({ ...item, product });
    }
    return result;
  }

  async getBundleWithProducts(bundleId: string) {
    const bundle = await this.getBundleById(bundleId);
    if (!bundle) return undefined;
    const items = await db.select().from(bundleItems).where(eq(bundleItems.bundleId, bundleId));
    const prods: Product[] = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) prods.push(product);
    }
    return { bundle, products: prods };
  }

  async createCoupon(data: InsertCoupon) {
    const [coupon] = await db.insert(coupons).values(data).returning();
    return coupon;
  }

  async getCouponsByStore(storeId: string) {
    return db.select().from(coupons).where(eq(coupons.storeId, storeId)).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(storeId: string, code: string) {
    const [coupon] = await db.select().from(coupons).where(
      and(eq(coupons.storeId, storeId), eq(coupons.code, code.toUpperCase()))
    );
    return coupon;
  }

  async getCouponById(id: string) {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async updateCoupon(id: string, data: Partial<InsertCoupon>) {
    const [coupon] = await db.update(coupons).set(data).where(eq(coupons.id, id)).returning();
    return coupon;
  }

  async incrementCouponUses(id: string) {
    await db.update(coupons).set({ currentUses: sql`${coupons.currentUses} + 1` }).where(eq(coupons.id, id));
  }

  async deleteCoupon(id: string) {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async getOrdersByStore(storeId: string) {
    return db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt));
  }

  async getOrderItemsByOrder(orderId: string) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const result = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) result.push({ ...item, product });
    }
    return result;
  }
}

export const storage = new DatabaseStorage();
