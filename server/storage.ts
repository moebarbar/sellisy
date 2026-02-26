import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  stores, products, fileAssets, storeProducts, orders, orderItems, downloadTokens,
  bundles, bundleItems, coupons, productImages, categories, userProfiles,
  customers, customerSessions, knowledgeBases, kbPages, kbBlocks, storeEvents, blogPosts, blogBlocks,
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
  type ProductImage, type InsertProductImage,
  type Category, type InsertCategory,
  type UserProfile, type InsertUserProfile,
  type Customer, type InsertCustomer,
  type CustomerSession, type InsertCustomerSession,
  type KnowledgeBase, type InsertKnowledgeBase,
  type KbPage, type InsertKbPage,
  type KbBlock, type InsertKbBlock,
  type PlanTier,
  type StoreEvent, type InsertStoreEvent,
  type BlogPost, type InsertBlogPost,
  type BlogBlock, type InsertBlogBlock,
} from "@shared/schema";

export interface IStorage {
  getStoresByOwner(ownerId: string): Promise<Store[]>;
  getAllPublicStores(): Promise<Store[]>;
  getStoreById(id: string): Promise<Store | undefined>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl" | "blogEnabled" | "announcementText" | "announcementLink" | "footerText" | "socialTwitter" | "socialInstagram" | "socialYoutube" | "socialTiktok" | "socialWebsite">>): Promise<Store | undefined>;
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
  updateStoreProduct(id: string, data: Partial<Pick<StoreProduct, "customPriceCents" | "customTitle" | "customDescription" | "customTags" | "customAccessUrl" | "customRedemptionCode" | "customDeliveryInstructions" | "isPublished" | "isLeadMagnet" | "upsellProductId" | "upsellBundleId">>): Promise<StoreProduct | undefined>;
  deleteStoreProduct(id: string): Promise<void>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByStripeSession(sessionId: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderBuyerEmail(id: string, email: string): Promise<void>;
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

  getProductImages(productId: string): Promise<ProductImage[]>;
  setProductImages(productId: string, images: { url: string; sortOrder: number; isPrimary: boolean }[]): Promise<ProductImage[]>;

  getCategoriesByOwner(ownerId: string): Promise<Category[]>;
  createCategory(cat: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<Pick<Category, "name" | "slug" | "sortOrder">>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  ensureDefaultCategories(ownerId: string): Promise<Category[]>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(data: InsertUserProfile): Promise<UserProfile>;
  updateUserPlan(userId: string, planTier: PlanTier): Promise<UserProfile | undefined>;
  setUserAdmin(userId: string, isAdmin: boolean): Promise<UserProfile | undefined>;

  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  findOrCreateCustomer(email: string): Promise<Customer>;
  createCustomerSession(data: InsertCustomerSession): Promise<CustomerSession>;
  getCustomerSessionByToken(tokenHash: string): Promise<CustomerSession | undefined>;
  deleteCustomerSession(id: string): Promise<void>;
  getOrdersByCustomer(customerId: string): Promise<(Order & { store: Store })[]>;
  setOrderCustomerId(orderId: string, customerId: string): Promise<void>;
  linkOrdersByEmail(email: string, customerId: string): Promise<void>;

  getKnowledgeBasesByOwner(ownerId: string): Promise<KnowledgeBase[]>;
  getKnowledgeBaseById(id: string): Promise<KnowledgeBase | undefined>;
  createKnowledgeBase(data: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: string, data: Partial<Pick<KnowledgeBase, "title" | "description" | "coverImageUrl" | "priceCents" | "isPublished" | "productId">>): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeBase(id: string): Promise<void>;

  getKbPagesByKnowledgeBase(knowledgeBaseId: string): Promise<KbPage[]>;
  getKbPageById(id: string): Promise<KbPage | undefined>;
  createKbPage(data: InsertKbPage): Promise<KbPage>;
  updateKbPage(id: string, data: Partial<Pick<KbPage, "title" | "parentPageId" | "sortOrder">>): Promise<KbPage | undefined>;
  deleteKbPage(id: string): Promise<void>;

  getKbBlocksByPage(pageId: string): Promise<KbBlock[]>;
  getKbBlockById(id: string): Promise<KbBlock | undefined>;
  createKbBlock(data: InsertKbBlock): Promise<KbBlock>;
  updateKbBlock(id: string, data: Partial<Pick<KbBlock, "type" | "content" | "sortOrder">>): Promise<KbBlock | undefined>;
  deleteKbBlock(id: string): Promise<void>;
  reorderKbBlocks(pageId: string, blockIds: string[]): Promise<void>;

  createStoreEvent(event: InsertStoreEvent): Promise<StoreEvent>;
  getStoreCustomers(storeId: string): Promise<{ id: string; email: string; name: string | null; createdAt: Date; totalSpent: number; orderCount: number; lastOrderDate: Date | null; products: string[] }[]>;
  updateCustomerName(customerId: string, name: string): Promise<void>;

  getBlogPostsByStore(storeId: string): Promise<BlogPost[]>;
  getPublishedBlogPostsByStore(storeId: string): Promise<BlogPost[]>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(storeId: string, slug: string): Promise<BlogPost | undefined>;
  createBlogPost(data: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<Pick<BlogPost, "title" | "slug" | "excerpt" | "coverImageUrl" | "fontFamily" | "category" | "readingTimeMinutes" | "isPublished" | "publishedAt">>): Promise<BlogPost | undefined>;
  getRelatedBlogPosts(storeId: string, postId: string, category: string, limit?: number): Promise<BlogPost[]>;
  getBlogCategories(storeId: string): Promise<string[]>;
  deleteBlogPost(id: string): Promise<void>;

  getBlogBlocksByPost(postId: string): Promise<BlogBlock[]>;
  createBlogBlock(data: InsertBlogBlock): Promise<BlogBlock>;
  updateBlogBlock(id: string, data: Partial<Pick<BlogBlock, "type" | "content" | "sortOrder">>): Promise<BlogBlock | undefined>;
  deleteBlogBlock(id: string): Promise<void>;
  reorderBlogBlocks(postId: string, blockIds: string[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStoresByOwner(ownerId: string) {
    return db.select().from(stores).where(eq(stores.ownerId, ownerId)).orderBy(desc(stores.createdAt));
  }

  async getAllPublicStores() {
    return db.select().from(stores).orderBy(desc(stores.createdAt));
  }

  async getStoreById(id: string) {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async getStoreBySlug(slug: string) {
    const [store] = await db.select().from(stores).where(eq(stores.slug, slug.toLowerCase()));
    return store;
  }

  async createStore(data: InsertStore) {
    const [store] = await db.insert(stores).values(data).returning();
    return store;
  }

  async updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl" | "paymentProvider" | "paypalClientId" | "paypalClientSecret" | "blogEnabled" | "announcementText" | "announcementLink" | "footerText" | "socialTwitter" | "socialInstagram" | "socialYoutube" | "socialTiktok" | "socialWebsite">>) {
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
    await db.delete(coupons).where(eq(coupons.storeId, id));
    await db.delete(storeProducts).where(eq(storeProducts.storeId, id));
    const storePosts = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.storeId, id));
    for (const p of storePosts) {
      await db.delete(blogBlocks).where(eq(blogBlocks.postId, p.id));
    }
    await db.delete(blogPosts).where(eq(blogPosts.storeId, id));
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

  async updateProduct(id: string, data: Partial<Pick<Product, "title" | "description" | "category" | "priceCents" | "originalPriceCents" | "thumbnailUrl" | "fileUrl" | "status" | "productType" | "deliveryInstructions" | "accessUrl" | "redemptionCode" | "tags">>) {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string) {
    await db.delete(storeProducts).where(eq(storeProducts.productId, id));
    await db.delete(fileAssets).where(eq(fileAssets.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async getStoreProducts(storeId: string) {
    const rows = await db
      .select({ sp: storeProducts, product: products })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(eq(storeProducts.storeId, storeId));
    return rows.map((r) => ({ ...r.sp, product: r.product }));
  }

  async getPublishedStoreProducts(storeId: string) {
    const rows = await db
      .select({ product: products })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.isPublished, true)));
    return rows.map((r) => r.product);
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

  async updateStoreProduct(id: string, data: Partial<Pick<StoreProduct, "customPriceCents" | "customTitle" | "customDescription" | "customTags" | "customAccessUrl" | "customRedemptionCode" | "customDeliveryInstructions" | "isPublished" | "isLeadMagnet" | "upsellProductId" | "upsellBundleId">>) {
    const [sp] = await db.update(storeProducts).set(data).where(eq(storeProducts.id, id)).returning();
    return sp;
  }

  async deleteStoreProduct(id: string) {
    await db.delete(storeProducts).where(eq(storeProducts.id, id));
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

  async updateOrderBuyerEmail(id: string, email: string) {
    await db.update(orders).set({ buyerEmail: email }).where(eq(orders.id, id));
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
    const rows = await db
      .select({ bi: bundleItems, product: products })
      .from(bundleItems)
      .innerJoin(products, eq(bundleItems.productId, products.id))
      .where(eq(bundleItems.bundleId, bundleId));
    return rows.map((r) => ({ ...r.bi, product: r.product }));
  }

  async getBundleWithProducts(bundleId: string) {
    const bundle = await this.getBundleById(bundleId);
    if (!bundle) return undefined;
    const items = await this.getBundleItems(bundleId);
    return { bundle, products: items.map((i) => i.product) };
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
    const rows = await db
      .select({ oi: orderItems, product: products })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
    return rows.map((r) => ({ ...r.oi, product: r.product }));
  }

  async getProductImages(productId: string) {
    return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder);
  }

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
  }

  async getCategoriesByOwner(ownerId: string) {
    return db.select().from(categories).where(eq(categories.ownerId, ownerId)).orderBy(categories.sortOrder);
  }

  async createCategory(cat: InsertCategory) {
    const [created] = await db.insert(categories).values(cat).returning();
    return created;
  }

  async updateCategory(id: string, data: Partial<Pick<Category, "name" | "slug" | "sortOrder">>) {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string) {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async ensureDefaultCategories(ownerId: string) {
    const existing = await this.getCategoriesByOwner(ownerId);
    const defaults = [
      { name: "Templates", slug: "templates", sortOrder: 0 },
      { name: "Graphics", slug: "graphics", sortOrder: 1 },
      { name: "Ebooks", slug: "ebooks", sortOrder: 2 },
      { name: "Tools", slug: "tools", sortOrder: 3 },
      { name: "Software", slug: "software", sortOrder: 4 },
    ];
    if (existing.length === 0) {
      const rows = defaults.map((d) => ({ ...d, ownerId }));
      return db.insert(categories).values(rows).returning();
    }
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const missing = defaults.filter((d) => !existingSlugs.has(d.slug));
    if (missing.length > 0) {
      const rows = missing.map((d) => ({ ...d, ownerId }));
      const added = await db.insert(categories).values(rows).returning();
      return [...existing, ...added];
    }
    return existing;
  }

  async getUserProfile(userId: string) {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(data: InsertUserProfile) {
    const existing = await this.getUserProfile(data.userId);
    if (existing) {
      const [updated] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, data.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(userProfiles).values(data).returning();
    return created;
  }

  async updateUserPlan(userId: string, planTier: PlanTier) {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      const [created] = await db.insert(userProfiles).values({ userId, planTier }).returning();
      return created;
    }
    const [updated] = await db.update(userProfiles).set({ planTier }).where(eq(userProfiles.userId, userId)).returning();
    return updated;
  }

  async setUserAdmin(userId: string, isAdmin: boolean) {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      const [created] = await db.insert(userProfiles).values({ userId, isAdmin }).returning();
      return created;
    }
    const [updated] = await db.update(userProfiles).set({ isAdmin }).where(eq(userProfiles.userId, userId)).returning();
    return updated;
  }

  async getCustomerByEmail(email: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email.toLowerCase()));
    return customer;
  }

  async getCustomerById(id: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async findOrCreateCustomer(email: string) {
    const normalized = email.toLowerCase();
    const existing = await this.getCustomerByEmail(normalized);
    if (existing) return existing;
    const [created] = await db.insert(customers).values({ email: normalized }).returning();
    return created;
  }

  async createCustomerSession(data: InsertCustomerSession) {
    const [session] = await db.insert(customerSessions).values(data).returning();
    return session;
  }

  async getCustomerSessionByToken(tokenHash: string) {
    const [session] = await db.select().from(customerSessions).where(eq(customerSessions.tokenHash, tokenHash));
    return session;
  }

  async deleteCustomerSession(id: string) {
    await db.delete(customerSessions).where(eq(customerSessions.id, id));
  }

  async getOrdersByCustomer(customerId: string) {
    const rows = await db
      .select({ order: orders, store: stores })
      .from(orders)
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(orders.customerId, customerId), eq(orders.status, "COMPLETED")))
      .orderBy(desc(orders.createdAt));
    return rows.map((r) => ({ ...r.order, store: r.store }));
  }

  async setOrderCustomerId(orderId: string, customerId: string) {
    await db.update(orders).set({ customerId }).where(eq(orders.id, orderId));
  }

  async linkOrdersByEmail(email: string, customerId: string) {
    await db.update(orders).set({ customerId }).where(
      and(eq(orders.buyerEmail, email.toLowerCase()), sql`${orders.customerId} IS NULL`)
    );
  }

  async getKnowledgeBasesByOwner(ownerId: string) {
    return db.select().from(knowledgeBases).where(eq(knowledgeBases.ownerId, ownerId)).orderBy(desc(knowledgeBases.createdAt));
  }

  async getKnowledgeBaseById(id: string) {
    const [kb] = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, id));
    return kb;
  }

  async createKnowledgeBase(data: InsertKnowledgeBase) {
    const [kb] = await db.insert(knowledgeBases).values(data).returning();
    return kb;
  }

  async updateKnowledgeBase(id: string, data: Partial<Pick<KnowledgeBase, "title" | "description" | "coverImageUrl" | "priceCents" | "isPublished" | "productId">>) {
    const [kb] = await db.update(knowledgeBases).set(data).where(eq(knowledgeBases.id, id)).returning();
    return kb;
  }

  async deleteKnowledgeBase(id: string) {
    const pages = await this.getKbPagesByKnowledgeBase(id);
    for (const page of pages) {
      await db.delete(kbBlocks).where(eq(kbBlocks.pageId, page.id));
    }
    await db.delete(kbPages).where(eq(kbPages.knowledgeBaseId, id));
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
  }

  async getKbPagesByKnowledgeBase(knowledgeBaseId: string) {
    return db.select().from(kbPages).where(eq(kbPages.knowledgeBaseId, knowledgeBaseId)).orderBy(kbPages.sortOrder);
  }

  async getKbPageById(id: string) {
    const [page] = await db.select().from(kbPages).where(eq(kbPages.id, id));
    return page;
  }

  async createKbPage(data: InsertKbPage) {
    const [page] = await db.insert(kbPages).values(data).returning();
    return page;
  }

  async updateKbPage(id: string, data: Partial<Pick<KbPage, "title" | "parentPageId" | "sortOrder">>) {
    const [page] = await db.update(kbPages).set(data).where(eq(kbPages.id, id)).returning();
    return page;
  }

  async deleteKbPage(id: string) {
    await db.delete(kbBlocks).where(eq(kbBlocks.pageId, id));
    const children = await db.select().from(kbPages).where(eq(kbPages.parentPageId, id));
    for (const child of children) {
      await this.deleteKbPage(child.id);
    }
    await db.delete(kbPages).where(eq(kbPages.id, id));
  }

  async getKbBlocksByPage(pageId: string) {
    return db.select().from(kbBlocks).where(eq(kbBlocks.pageId, pageId)).orderBy(kbBlocks.sortOrder);
  }

  async getKbBlockById(id: string) {
    const [block] = await db.select().from(kbBlocks).where(eq(kbBlocks.id, id));
    return block;
  }

  async createKbBlock(data: InsertKbBlock) {
    const [block] = await db.insert(kbBlocks).values(data).returning();
    return block;
  }

  async updateKbBlock(id: string, data: Partial<Pick<KbBlock, "type" | "content" | "sortOrder">>) {
    const [block] = await db.update(kbBlocks).set(data).where(eq(kbBlocks.id, id)).returning();
    return block;
  }

  async deleteKbBlock(id: string) {
    await db.delete(kbBlocks).where(eq(kbBlocks.id, id));
  }

  async reorderKbBlocks(pageId: string, blockIds: string[]) {
    for (let i = 0; i < blockIds.length; i++) {
      await db.update(kbBlocks).set({ sortOrder: i }).where(and(eq(kbBlocks.id, blockIds[i]), eq(kbBlocks.pageId, pageId)));
    }
  }

  async createStoreEvent(event: InsertStoreEvent) {
    const [row] = await db.insert(storeEvents).values(event).returning();
    return row;
  }

  async getStoreCustomers(storeId: string) {
    const rows = await db.execute(sql`
      SELECT
        c.id,
        c.email,
        c.name,
        c.created_at AS "createdAt",
        COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.total_cents ELSE 0 END), 0)::int AS "totalSpent",
        COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END)::int AS "orderCount",
        MAX(CASE WHEN o.status = 'COMPLETED' THEN o.created_at END) AS "lastOrderDate",
        COALESCE(
          ARRAY_AGG(DISTINCT p.title) FILTER (WHERE p.title IS NOT NULL),
          ARRAY[]::text[]
        ) AS "products"
      FROM customers c
      JOIN orders o ON (o.customer_id = c.id OR LOWER(o.buyer_email) = LOWER(c.email))
      LEFT JOIN order_items oi ON oi.order_id = o.id AND o.status = 'COMPLETED'
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.store_id = ${storeId}
      GROUP BY c.id, c.email, c.name, c.created_at
      ORDER BY "totalSpent" DESC
    `);
    return rows.rows as any;
  }

  async updateCustomerName(customerId: string, name: string) {
    await db.update(customers).set({ name }).where(eq(customers.id, customerId));
  }

  async getBlogPostsByStore(storeId: string) {
    return db.select().from(blogPosts).where(eq(blogPosts.storeId, storeId)).orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPostsByStore(storeId: string) {
    return db.select().from(blogPosts).where(and(eq(blogPosts.storeId, storeId), eq(blogPosts.isPublished, true))).orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostById(id: string) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(storeId: string, slug: string) {
    const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.storeId, storeId), eq(blogPosts.slug, slug)));
    return post;
  }

  async createBlogPost(data: InsertBlogPost) {
    const [post] = await db.insert(blogPosts).values(data).returning();
    return post;
  }

  async updateBlogPost(id: string, data: Partial<Pick<BlogPost, "title" | "slug" | "excerpt" | "coverImageUrl" | "fontFamily" | "category" | "readingTimeMinutes" | "isPublished" | "publishedAt">>) {
    const [post] = await db.update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
    return post;
  }

  async getRelatedBlogPosts(storeId: string, postId: string, category: string, limit = 3) {
    return db.select().from(blogPosts).where(
      and(
        eq(blogPosts.storeId, storeId),
        eq(blogPosts.isPublished, true),
        eq(blogPosts.category, category),
        sql`${blogPosts.id} != ${postId}`
      )
    ).orderBy(desc(blogPosts.publishedAt)).limit(limit);
  }

  async getBlogCategories(storeId: string) {
    const rows = await db.selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(and(eq(blogPosts.storeId, storeId), eq(blogPosts.isPublished, true)));
    return rows.map(r => r.category);
  }

  async deleteBlogPost(id: string) {
    await db.delete(blogBlocks).where(eq(blogBlocks.postId, id));
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getBlogBlocksByPost(postId: string) {
    return db.select().from(blogBlocks).where(eq(blogBlocks.postId, postId)).orderBy(blogBlocks.sortOrder);
  }

  async createBlogBlock(data: InsertBlogBlock) {
    const [block] = await db.insert(blogBlocks).values(data).returning();
    return block;
  }

  async updateBlogBlock(id: string, data: Partial<Pick<BlogBlock, "type" | "content" | "sortOrder">>) {
    const [block] = await db.update(blogBlocks).set(data).where(eq(blogBlocks.id, id)).returning();
    return block;
  }

  async deleteBlogBlock(id: string) {
    await db.delete(blogBlocks).where(eq(blogBlocks.id, id));
  }

  async reorderBlogBlocks(postId: string, blockIds: string[]) {
    for (let i = 0; i < blockIds.length; i++) {
      await db.update(blogBlocks).set({ sortOrder: i }).where(and(eq(blogBlocks.id, blockIds[i]), eq(blogBlocks.postId, postId)));
    }
  }
}

export const storage = new DatabaseStorage();
