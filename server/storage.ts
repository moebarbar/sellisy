import { eq, and, desc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
import { db } from "./db";
import {
  stores, products, storeProducts, orders, bundles, bundleItems, coupons, userProfiles,
  customers, customerSessions, knowledgeBases, kbPages, kbBlocks, kbPageAttachments, storeEvents, blogPosts, blogBlocks,
  storeTestimonials, storeFaqs, newsletterSubscribers, storeReviews,
  newsletterCampaigns, newsletterCampaignBlocks, emailSuppression,
  type Store, type InsertStore,
  type Product,
  type Bundle, type InsertBundle,
  type BundleItem, type InsertBundleItem,
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
  type StoreTestimonial, type InsertStoreTestimonial,
  type StoreFaq, type InsertStoreFaq,
  type NewsletterSubscriber, type InsertNewsletterSubscriber,
  type StoreReview, type InsertStoreReview,
  type NewsletterCampaign, type InsertNewsletterCampaign,
  type NewsletterCampaignBlock, type InsertNewsletterCampaignBlock,
  type KbPageAttachment, type InsertKbPageAttachment,
} from "@shared/schema";

export interface IStorage {
  getStoresByOwner(ownerId: string): Promise<Store[]>;
  getAllPublicStores(): Promise<Store[]>;
  getStoreById(id: string): Promise<Store | undefined>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl" | "paymentProvider" | "paypalClientId" | "paypalClientSecret" | "stripePublishableKey" | "stripeSecretKey" | "blogEnabled" | "announcementText" | "announcementLink" | "footerText" | "socialTwitter" | "socialInstagram" | "socialYoutube" | "socialTiktok" | "socialWebsite" | "faviconUrl" | "seoTitle" | "seoDescription" | "allowImageDownload" | "aboutEnabled" | "aboutHeadline" | "aboutText" | "aboutImageUrl" | "aboutCtaText" | "aboutCtaUrl" | "testimonialsEnabled" | "faqEnabled" | "newsletterEnabled" | "newsletterHeadline" | "newsletterSubtext" | "sectionOrder" | "reviewsEnabled" | "stripeTaxEnabled" | "pdfWatermarkEnabled" | "cartRecoveryEnabled" | "postPurchaseEmailEnabled" | "newsletterWelcomeEnabled">>): Promise<Store | undefined>;
  deleteStore(id: string, callerOwnerId?: string): Promise<void>;
  hardDeleteStore(id: string): Promise<void>;
  restoreStore(id: string): Promise<Store | undefined>;
  getDeletedStores(): Promise<Store[]>;

  // Product + StoreProduct signatures moved to server/storage/product.ts —
  // available on the merged `storage` singleton via Object.assign.

  // Order, OrderItem, DownloadToken signatures moved to server/storage/order.ts.
  // FileAsset signatures moved to server/storage/product.ts.

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

  // Coupon + order-reads signatures moved to server/storage/order.ts.
  // ProductImage + Category signatures moved to server/storage/product.ts.

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
  consumeCustomerSession(id: string): Promise<boolean>;

  isEmailSuppressed(email: string): Promise<boolean>;
  suppressEmail(email: string, reason: "bounce" | "complaint" | "unsubscribe" | "manual", detail?: string): Promise<void>;
  unsuppressEmail(email: string): Promise<void>;
  // getOrdersByCustomer / setOrderCustomerId / linkOrdersByEmail moved to
  // server/storage/order.ts.

  getKnowledgeBasesByOwner(ownerId: string): Promise<KnowledgeBase[]>;
  getKnowledgeBaseById(id: string): Promise<KnowledgeBase | undefined>;
  getKnowledgeBaseBySlug(slug: string): Promise<KnowledgeBase | undefined>;
  createKnowledgeBase(data: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: string, data: Partial<Pick<KnowledgeBase, "title" | "slug" | "description" | "coverImageUrl" | "priceCents" | "isPublished" | "productId" | "authorName" | "authorImageUrl">>): Promise<KnowledgeBase | undefined>;
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
  deleteKbBlocksBulk(ids: string[]): Promise<void>;
  reorderKbBlocks(pageId: string, blockIds: string[]): Promise<void>;

  // KB Page Attachments
  getAttachmentsByPage(pageId: string): Promise<KbPageAttachment[]>;
  createAttachment(data: InsertKbPageAttachment): Promise<KbPageAttachment>;
  updateAttachment(id: string, data: Partial<Pick<KbPageAttachment, "name" | "sortOrder">>): Promise<KbPageAttachment | undefined>;
  deleteAttachment(id: string): Promise<void>;

  createStoreEvent(event: InsertStoreEvent): Promise<StoreEvent>;
  getStoreCustomers(storeId: string, opts?: { limit?: number; offset?: number }): Promise<{ id: string; email: string; name: string | null; createdAt: Date; totalSpent: number; orderCount: number; lastOrderDate: Date | null; products: string[] }[]>;
  countStoreCustomers(storeId: string): Promise<number>;
  updateCustomerName(customerId: string, name: string): Promise<void>;

  getBlogPostsByStore(storeId: string): Promise<BlogPost[]>;
  getPublishedBlogPostsByStore(storeId: string): Promise<BlogPost[]>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(storeId: string, slug: string): Promise<BlogPost | undefined>;
  createBlogPost(data: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<Pick<BlogPost, "title" | "slug" | "excerpt" | "coverImageUrl" | "fontFamily" | "category" | "readingTimeMinutes" | "isPublished" | "publishedAt" | "authorName" | "authorImageUrl">>): Promise<BlogPost | undefined>;
  getRelatedBlogPosts(storeId: string, postId: string, category: string, limit?: number): Promise<BlogPost[]>;
  getBlogCategories(storeId: string): Promise<string[]>;
  deleteBlogPost(id: string): Promise<void>;

  getBlogBlocksByPost(postId: string): Promise<BlogBlock[]>;
  getBlogBlockById(id: string): Promise<BlogBlock | undefined>;
  createBlogBlock(data: InsertBlogBlock): Promise<BlogBlock>;
  updateBlogBlock(id: string, data: Partial<Pick<BlogBlock, "type" | "content" | "sortOrder">>): Promise<BlogBlock | undefined>;
  deleteBlogBlock(id: string): Promise<void>;
  deleteBlogBlocksBulk(ids: string[]): Promise<void>;
  reorderBlogBlocks(postId: string, blockIds: string[]): Promise<void>;

  // Storefront sections
  getTestimonialsByStore(storeId: string): Promise<StoreTestimonial[]>;
  getTestimonialById(id: string): Promise<StoreTestimonial | undefined>;
  createTestimonial(data: InsertStoreTestimonial): Promise<StoreTestimonial>;
  updateTestimonial(id: string, data: Partial<Pick<StoreTestimonial, "name" | "role" | "quote" | "avatarUrl" | "sortOrder">>): Promise<StoreTestimonial | undefined>;
  deleteTestimonial(id: string): Promise<void>;

  getFaqsByStore(storeId: string): Promise<StoreFaq[]>;
  getFaqById(id: string): Promise<StoreFaq | undefined>;
  createFaq(data: InsertStoreFaq): Promise<StoreFaq>;
  updateFaq(id: string, data: Partial<Pick<StoreFaq, "question" | "answer" | "sortOrder">>): Promise<StoreFaq | undefined>;
  deleteFaq(id: string): Promise<void>;

  getNewsletterSubscribers(storeId: string): Promise<NewsletterSubscriber[]>;
  getNewsletterSubscriberCount(storeId: string): Promise<number>;
  addNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSubscriberByEmail(storeId: string, email: string): Promise<NewsletterSubscriber | undefined>;

  // Reviews
  getReviewsByStore(storeId: string): Promise<Array<StoreReview & { customerName?: string | null }>>;
  getReviewsByProduct(storeId: string, productId: string): Promise<StoreReview[]>;
  getReviewByCustomerAndProduct(customerId: string, productId: string): Promise<StoreReview | undefined>;
  getReviewById(id: string): Promise<StoreReview | undefined>;
  createReview(data: InsertStoreReview): Promise<StoreReview>;
  deleteReview(id: string): Promise<void>;

  // Newsletter Campaigns
  getCampaignsByStore(storeId: string): Promise<NewsletterCampaign[]>;
  getCampaignById(id: string): Promise<NewsletterCampaign | undefined>;
  createCampaign(data: InsertNewsletterCampaign): Promise<NewsletterCampaign>;
  updateCampaign(id: string, data: Partial<InsertNewsletterCampaign>): Promise<NewsletterCampaign>;
  deleteCampaign(id: string): Promise<void>;
  getBlocksByCampaign(campaignId: string): Promise<NewsletterCampaignBlock[]>;
  createCampaignBlock(data: InsertNewsletterCampaignBlock): Promise<NewsletterCampaignBlock>;
  updateCampaignBlock(id: string, data: Partial<InsertNewsletterCampaignBlock>): Promise<NewsletterCampaignBlock>;
  deleteCampaignBlock(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStoresByOwner(ownerId: string) {
    return db.select().from(stores).where(and(eq(stores.ownerId, ownerId), isNull(stores.deletedAt))).orderBy(desc(stores.createdAt));
  }

  async getAllPublicStores() {
    return db.select().from(stores).where(isNull(stores.deletedAt)).orderBy(desc(stores.createdAt));
  }

  async getStoreById(id: string) {
    const [store] = await db.select().from(stores).where(and(eq(stores.id, id), isNull(stores.deletedAt)));
    return store;
  }

  async getStoreBySlug(slug: string) {
    const [store] = await db.select().from(stores).where(and(eq(stores.slug, slug.toLowerCase()), isNull(stores.deletedAt)));
    return store;
  }

  async createStore(data: InsertStore) {
    const [store] = await db.insert(stores).values(data).returning();
    return store;
  }

  async updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl" | "paymentProvider" | "paypalClientId" | "paypalClientSecret" | "stripePublishableKey" | "stripeSecretKey" | "blogEnabled" | "announcementText" | "announcementLink" | "footerText" | "socialTwitter" | "socialInstagram" | "socialYoutube" | "socialTiktok" | "socialWebsite" | "faviconUrl" | "seoTitle" | "seoDescription" | "allowImageDownload" | "aboutEnabled" | "aboutHeadline" | "aboutText" | "aboutImageUrl" | "aboutCtaText" | "aboutCtaUrl" | "testimonialsEnabled" | "faqEnabled" | "newsletterEnabled" | "newsletterHeadline" | "newsletterSubtext" | "sectionOrder" | "reviewsEnabled" | "stripeTaxEnabled" | "pdfWatermarkEnabled" | "cartRecoveryEnabled" | "postPurchaseEmailEnabled" | "newsletterWelcomeEnabled">>) {
    const [store] = await db.update(stores).set({ ...data, updatedAt: new Date() }).where(eq(stores.id, id)).returning();
    return store;
  }

  async deleteStore(id: string, callerOwnerId?: string) {
    if (callerOwnerId) {
      const [store] = await db.select().from(stores).where(and(eq(stores.id, id), eq(stores.ownerId, callerOwnerId)));
      if (!store) throw new Error("Store not found or not owned by caller");
    }
    await db.update(stores).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(stores.id, id));
  }

  async hardDeleteStore(id: string) {
    console.warn(`[DATA-SAFETY] hardDeleteStore called for store ${id} — this permanently removes the store and cascades soft-deletes to related data`);
    const now = new Date();
    await db.update(orders).set({ deletedAt: now, updatedAt: now }).where(eq(orders.storeId, id));
    await db.update(bundles).set({ deletedAt: now, updatedAt: now }).where(eq(bundles.storeId, id));
    await db.update(coupons).set({ deletedAt: now, updatedAt: now }).where(eq(coupons.storeId, id));
    await db.update(blogPosts).set({ deletedAt: now, updatedAt: now }).where(eq(blogPosts.storeId, id));
    await db.delete(storeProducts).where(eq(storeProducts.storeId, id));
    await db.delete(stores).where(eq(stores.id, id));
  }

  async restoreStore(id: string) {
    const [store] = await db.update(stores).set({ deletedAt: null, updatedAt: new Date() }).where(eq(stores.id, id)).returning();
    return store;
  }

  async getDeletedStores() {
    return db.select().from(stores).where(isNotNull(stores.deletedAt)).orderBy(desc(stores.deletedAt));
  }


  /**
   * Public marketplace feed: newest published products across every live
   * store, joined with the seller's identity. Used by /discover.
   *
   * Excludes deleted products, deleted stores, lead magnets (free freebies
   * shouldn't dominate the feed), and orders by products.createdAt DESC.
   * Also surfaces customDomain so the frontend can link to the seller's
   * branded URL when one is active.
   */
  async getDiscoverProducts(limit = 60) {
    const rows = await db
      .select({
        storeProductId: storeProducts.id,
        customTitle: storeProducts.customTitle,
        customDescription: storeProducts.customDescription,
        customPriceCents: storeProducts.customPriceCents,
        isFeatured: storeProducts.isFeatured,
        productId: products.id,
        title: products.title,
        description: products.description,
        priceCents: products.priceCents,
        thumbnailUrl: products.thumbnailUrl,
        productType: products.productType,
        productSlug: products.slug,
        productCreatedAt: products.createdAt,
        storeId: stores.id,
        storeName: stores.name,
        storeSlug: stores.slug,
        storeLogoUrl: stores.logoUrl,
        storeTemplateKey: stores.templateKey,
        storeCustomDomain: stores.customDomain,
        storeDomainStatus: stores.domainStatus,
      })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .innerJoin(stores, eq(storeProducts.storeId, stores.id))
      .where(and(
        eq(storeProducts.isPublished, true),
        eq(storeProducts.isLeadMagnet, false),
        isNull(products.deletedAt),
        isNull(stores.deletedAt),
      ))
      .orderBy(desc(products.createdAt))
      .limit(limit);
    return rows;
  }

  /**
   * Public marketplace: live stores with at least one published, non-lead-
   * magnet product. Replaces the prior loop-of-N storeQueries with a single
   * GROUP BY + COUNT — scales linearly with stores instead of quadratically.
   */
  async getDiscoverStores() {
    const productCount = sql<number>`count(${storeProducts.id})::int`.as("product_count");
    const rows = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        templateKey: stores.templateKey,
        tagline: stores.tagline,
        logoUrl: stores.logoUrl,
        customDomain: stores.customDomain,
        domainStatus: stores.domainStatus,
        productCount,
      })
      .from(stores)
      .innerJoin(storeProducts, eq(storeProducts.storeId, stores.id))
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(and(
        isNull(stores.deletedAt),
        eq(storeProducts.isPublished, true),
        eq(storeProducts.isLeadMagnet, false),
        isNull(products.deletedAt),
      ))
      .groupBy(stores.id)
      .orderBy(desc(stores.createdAt));
    return rows;
  }



  async createBundle(data: InsertBundle) {
    const [bundle] = await db.insert(bundles).values(data).returning();
    return bundle;
  }

  async getBundleById(id: string) {
    const [bundle] = await db.select().from(bundles).where(and(eq(bundles.id, id), isNull(bundles.deletedAt)));
    return bundle;
  }

  async getBundlesByStore(storeId: string) {
    return db.select().from(bundles).where(and(eq(bundles.storeId, storeId), isNull(bundles.deletedAt))).orderBy(desc(bundles.createdAt));
  }

  async getPublishedBundlesByStore(storeId: string) {
    return db.select().from(bundles).where(and(eq(bundles.storeId, storeId), eq(bundles.isPublished, true), isNull(bundles.deletedAt)));
  }

  async updateBundle(id: string, data: Partial<InsertBundle>) {
    const [bundle] = await db.update(bundles).set({ ...data, updatedAt: new Date() }).where(eq(bundles.id, id)).returning();
    return bundle;
  }

  async deleteBundle(id: string) {
    await db.update(bundles).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(bundles.id, id));
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




  async getUserProfile(userId: string) {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(data: InsertUserProfile) {
    const existing = await this.getUserProfile(data.userId);
    if (existing) {
      const [updated] = await db.update(userProfiles).set({ ...data, updatedAt: new Date() }).where(eq(userProfiles.userId, data.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(userProfiles).values(data).returning();
    return created;
  }

  async updateUserPlan(userId: string, planTier: PlanTier) {
    // When promoting to a paid tier, clear any active trial — the user has
    // converted, the trial is moot. We don't blank trialEndsAt on basic-set
    // (so an admin demotion doesn't reset/extend a trial).
    const clearTrial = planTier !== "basic";
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      const [created] = await db.insert(userProfiles)
        .values({ userId, planTier, trialEndsAt: clearTrial ? null : undefined })
        .returning();
      return created;
    }
    const updates: any = { planTier, updatedAt: new Date() };
    if (clearTrial) updates.trialEndsAt = null;
    const [updated] = await db.update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async setUserAdmin(userId: string, isAdmin: boolean) {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      const [created] = await db.insert(userProfiles).values({ userId, isAdmin }).returning();
      return created;
    }
    const [updated] = await db.update(userProfiles).set({ isAdmin, updatedAt: new Date() }).where(eq(userProfiles.userId, userId)).returning();
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

  async consumeCustomerSession(id: string): Promise<boolean> {
    const deleted = await db.delete(customerSessions).where(eq(customerSessions.id, id)).returning({ id: customerSessions.id });
    return deleted.length > 0;
  }

  async isEmailSuppressed(email: string): Promise<boolean> {
    const [row] = await db.select({ email: emailSuppression.email })
      .from(emailSuppression)
      .where(eq(emailSuppression.email, email.toLowerCase()))
      .limit(1);
    return !!row;
  }

  async suppressEmail(email: string, reason: "bounce" | "complaint" | "unsubscribe" | "manual", detail?: string) {
    await db.insert(emailSuppression)
      .values({ email: email.toLowerCase(), reason, detail: detail ?? null })
      .onConflictDoUpdate({
        target: emailSuppression.email,
        set: { reason, detail: detail ?? null, suppressedAt: new Date() },
      });
  }

  async unsuppressEmail(email: string) {
    await db.delete(emailSuppression).where(eq(emailSuppression.email, email.toLowerCase()));
  }



  async getKnowledgeBasesByOwner(ownerId: string) {
    return db.select().from(knowledgeBases).where(and(eq(knowledgeBases.ownerId, ownerId), isNull(knowledgeBases.deletedAt))).orderBy(desc(knowledgeBases.createdAt));
  }

  async getKnowledgeBaseById(id: string) {
    const [kb] = await db.select().from(knowledgeBases).where(and(eq(knowledgeBases.id, id), isNull(knowledgeBases.deletedAt)));
    return kb;
  }

  async getKnowledgeBaseBySlug(slug: string) {
    const [kb] = await db.select().from(knowledgeBases).where(and(eq(knowledgeBases.slug, slug), isNull(knowledgeBases.deletedAt)));
    return kb;
  }

  async createKnowledgeBase(data: InsertKnowledgeBase) {
    const [kb] = await db.insert(knowledgeBases).values(data).returning();
    return kb;
  }

  async updateKnowledgeBase(id: string, data: Partial<Pick<KnowledgeBase, "title" | "slug" | "description" | "coverImageUrl" | "priceCents" | "isPublished" | "productId" | "authorName" | "authorImageUrl">>) {
    const [kb] = await db.update(knowledgeBases).set({ ...data, updatedAt: new Date() }).where(eq(knowledgeBases.id, id)).returning();
    return kb;
  }

  async deleteKnowledgeBase(id: string) {
    await db.update(knowledgeBases).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(knowledgeBases.id, id));
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
    const [page] = await db.update(kbPages).set({ ...data, updatedAt: new Date() }).where(eq(kbPages.id, id)).returning();
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
    const [block] = await db.update(kbBlocks).set({ ...data, updatedAt: new Date() }).where(eq(kbBlocks.id, id)).returning();
    return block;
  }

  async deleteKbBlock(id: string) {
    await db.delete(kbBlocks).where(eq(kbBlocks.id, id));
  }

  async deleteKbBlocksBulk(ids: string[]) {
    if (ids.length === 0) return;
    await db.delete(kbBlocks).where(inArray(kbBlocks.id, ids));
  }

  async reorderKbBlocks(pageId: string, blockIds: string[]) {
    const now = new Date();
    for (let i = 0; i < blockIds.length; i++) {
      await db.update(kbBlocks).set({ sortOrder: i, updatedAt: now }).where(and(eq(kbBlocks.id, blockIds[i]), eq(kbBlocks.pageId, pageId)));
    }
  }

  // ── KB Page Attachments ──────────────────────────────────────────

  async getAttachmentsByPage(pageId: string) {
    return db.select().from(kbPageAttachments)
      .where(eq(kbPageAttachments.pageId, pageId))
      .orderBy(kbPageAttachments.sortOrder);
  }

  async createAttachment(data: InsertKbPageAttachment) {
    const [row] = await db.insert(kbPageAttachments).values(data).returning();
    return row;
  }

  async updateAttachment(id: string, data: Partial<Pick<KbPageAttachment, "name" | "sortOrder">>) {
    const [row] = await db.update(kbPageAttachments).set({ ...data, updatedAt: new Date() }).where(eq(kbPageAttachments.id, id)).returning();
    return row;
  }

  async deleteAttachment(id: string) {
    await db.delete(kbPageAttachments).where(eq(kbPageAttachments.id, id));
  }

  async createStoreEvent(event: InsertStoreEvent) {
    const [row] = await db.insert(storeEvents).values(event).returning();
    return row;
  }

  // opts.limit caps the result set (dashboard list passes a cap; the Excel
  // export passes none for a full dump). The GROUP BY + ARRAY_AGG is
  // expensive on large stores, so unbounded calls should be deliberate.
  async getStoreCustomers(storeId: string, opts?: { limit?: number; offset?: number }) {
    const limitClause = opts?.limit != null
      ? sql`LIMIT ${opts.limit} OFFSET ${opts?.offset ?? 0}`
      : sql``;
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
      ${limitClause}
    `);
    return rows.rows as any;
  }

  async countStoreCustomers(storeId: string): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT c.id)::int AS count
      FROM customers c
      JOIN orders o ON (o.customer_id = c.id OR LOWER(o.buyer_email) = LOWER(c.email))
      WHERE o.store_id = ${storeId}
    `);
    return (result.rows[0] as any)?.count ?? 0;
  }

  async updateCustomerName(customerId: string, name: string) {
    await db.update(customers).set({ name, updatedAt: new Date() }).where(eq(customers.id, customerId));
  }

  async getBlogPostsByStore(storeId: string) {
    return db.select().from(blogPosts).where(and(eq(blogPosts.storeId, storeId), isNull(blogPosts.deletedAt))).orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPostsByStore(storeId: string) {
    return db.select().from(blogPosts).where(and(eq(blogPosts.storeId, storeId), eq(blogPosts.isPublished, true), isNull(blogPosts.deletedAt))).orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostById(id: string) {
    const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.id, id), isNull(blogPosts.deletedAt)));
    return post;
  }

  async getBlogPostBySlug(storeId: string, slug: string) {
    const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.storeId, storeId), eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)));
    return post;
  }

  async createBlogPost(data: InsertBlogPost) {
    const [post] = await db.insert(blogPosts).values(data).returning();
    return post;
  }

  async updateBlogPost(id: string, data: Partial<Pick<BlogPost, "title" | "slug" | "excerpt" | "coverImageUrl" | "fontFamily" | "category" | "readingTimeMinutes" | "isPublished" | "publishedAt" | "authorName" | "authorImageUrl">>) {
    const [post] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return post;
  }

  async getRelatedBlogPosts(storeId: string, postId: string, category: string, limit = 3) {
    return db.select().from(blogPosts).where(
      and(
        eq(blogPosts.storeId, storeId),
        eq(blogPosts.isPublished, true),
        eq(blogPosts.category, category),
        isNull(blogPosts.deletedAt),
        sql`${blogPosts.id} != ${postId}`
      )
    ).orderBy(desc(blogPosts.publishedAt)).limit(limit);
  }

  async getBlogCategories(storeId: string) {
    const rows = await db.selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(and(eq(blogPosts.storeId, storeId), eq(blogPosts.isPublished, true), isNull(blogPosts.deletedAt)));
    return rows.map(r => r.category);
  }

  async deleteBlogPost(id: string) {
    await db.update(blogPosts).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(blogPosts.id, id));
  }

  async getBlogBlocksByPost(postId: string) {
    return db.select().from(blogBlocks).where(eq(blogBlocks.postId, postId)).orderBy(blogBlocks.sortOrder);
  }

  async getBlogBlockById(id: string) {
    const [block] = await db.select().from(blogBlocks).where(eq(blogBlocks.id, id));
    return block;
  }

  async createBlogBlock(data: InsertBlogBlock) {
    const [block] = await db.insert(blogBlocks).values(data).returning();
    return block;
  }

  async updateBlogBlock(id: string, data: Partial<Pick<BlogBlock, "type" | "content" | "sortOrder">>) {
    const [block] = await db.update(blogBlocks).set({ ...data, updatedAt: new Date() }).where(eq(blogBlocks.id, id)).returning();
    return block;
  }

  async deleteBlogBlock(id: string) {
    await db.delete(blogBlocks).where(eq(blogBlocks.id, id));
  }

  async deleteBlogBlocksBulk(ids: string[]) {
    if (ids.length === 0) return;
    await db.delete(blogBlocks).where(inArray(blogBlocks.id, ids));
  }

  async reorderBlogBlocks(postId: string, blockIds: string[]) {
    const now = new Date();
    for (let i = 0; i < blockIds.length; i++) {
      await db.update(blogBlocks).set({ sortOrder: i, updatedAt: now }).where(and(eq(blogBlocks.id, blockIds[i]), eq(blogBlocks.postId, postId)));
    }
  }

  // ── Storefront Sections ────────────────────────────────────────

  async getTestimonialsByStore(storeId: string) {
    return db.select().from(storeTestimonials).where(eq(storeTestimonials.storeId, storeId)).orderBy(storeTestimonials.sortOrder);
  }

  async getTestimonialById(id: string) {
    const [t] = await db.select().from(storeTestimonials).where(eq(storeTestimonials.id, id));
    return t;
  }

  async createTestimonial(data: InsertStoreTestimonial) {
    const [t] = await db.insert(storeTestimonials).values(data).returning();
    return t;
  }

  async updateTestimonial(id: string, data: Partial<Pick<StoreTestimonial, "name" | "role" | "quote" | "avatarUrl" | "sortOrder">>) {
    const [t] = await db.update(storeTestimonials).set({ ...data, updatedAt: new Date() }).where(eq(storeTestimonials.id, id)).returning();
    return t;
  }

  async deleteTestimonial(id: string) {
    await db.delete(storeTestimonials).where(eq(storeTestimonials.id, id));
  }

  async getFaqsByStore(storeId: string) {
    return db.select().from(storeFaqs).where(eq(storeFaqs.storeId, storeId)).orderBy(storeFaqs.sortOrder);
  }

  async getFaqById(id: string) {
    const [f] = await db.select().from(storeFaqs).where(eq(storeFaqs.id, id));
    return f;
  }

  async createFaq(data: InsertStoreFaq) {
    const [f] = await db.insert(storeFaqs).values(data).returning();
    return f;
  }

  async updateFaq(id: string, data: Partial<Pick<StoreFaq, "question" | "answer" | "sortOrder">>) {
    const [f] = await db.update(storeFaqs).set({ ...data, updatedAt: new Date() }).where(eq(storeFaqs.id, id)).returning();
    return f;
  }

  async deleteFaq(id: string) {
    await db.delete(storeFaqs).where(eq(storeFaqs.id, id));
  }

  async getNewsletterSubscribers(storeId: string) {
    return db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.storeId, storeId)).orderBy(desc(newsletterSubscribers.createdAt));
  }

  async getNewsletterSubscriberCount(storeId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.storeId, storeId));
    return row?.count ?? 0;
  }

  async addNewsletterSubscriber(data: InsertNewsletterSubscriber) {
    const [s] = await db.insert(newsletterSubscribers).values(data).returning();
    return s;
  }

  async getNewsletterSubscriberByEmail(storeId: string, email: string) {
    const [sub] = await db.select().from(newsletterSubscribers).where(
      and(eq(newsletterSubscribers.storeId, storeId), eq(newsletterSubscribers.email, email.toLowerCase()))
    );
    return sub;
  }

  // ── Reviews ────────────────────────────────────────────────────

  async getReviewsByStore(storeId: string) {
    return db
      .select({
        id: storeReviews.id,
        storeId: storeReviews.storeId,
        customerId: storeReviews.customerId,
        productId: storeReviews.productId,
        orderId: storeReviews.orderId,
        rating: storeReviews.rating,
        title: storeReviews.title,
        content: storeReviews.content,
        createdAt: storeReviews.createdAt,
        customerName: customers.name,
      })
      .from(storeReviews)
      .leftJoin(customers, eq(storeReviews.customerId, customers.id))
      .where(eq(storeReviews.storeId, storeId))
      .orderBy(desc(storeReviews.createdAt));
  }

  async getReviewsByProduct(storeId: string, productId: string) {
    return db.select().from(storeReviews).where(and(eq(storeReviews.storeId, storeId), eq(storeReviews.productId, productId))).orderBy(desc(storeReviews.createdAt));
  }

  async getReviewByCustomerAndProduct(customerId: string, productId: string) {
    const [r] = await db.select().from(storeReviews).where(and(eq(storeReviews.customerId, customerId), eq(storeReviews.productId, productId)));
    return r;
  }

  async getReviewById(id: string) {
    const [r] = await db.select().from(storeReviews).where(eq(storeReviews.id, id));
    return r;
  }

  async createReview(data: InsertStoreReview) {
    const [r] = await db.insert(storeReviews).values(data).returning();
    return r;
  }

  async deleteReview(id: string) {
    await db.delete(storeReviews).where(eq(storeReviews.id, id));
  }

  // Aggregate rating + count for a single product.
  async getProductRatingAggregate(productId: string): Promise<{ avgRating: number; count: number }> {
    const [row] = await db
      .select({
        n: sql<number>`count(*)::int`,
        avg: sql<number>`coalesce(avg(${storeReviews.rating})::float, 0)`,
      })
      .from(storeReviews)
      .where(eq(storeReviews.productId, productId));
    return { avgRating: row?.avg ?? 0, count: row?.n ?? 0 };
  }

  // Bulk version — used by the storefront to render a row of product cards
  // with ratings, avoiding N queries.
  async getProductRatingsAggregateBulk(productIds: string[]): Promise<Map<string, { avgRating: number; count: number }>> {
    const out = new Map<string, { avgRating: number; count: number }>();
    if (productIds.length === 0) return out;
    const rows = await db
      .select({
        productId: storeReviews.productId,
        n: sql<number>`count(*)::int`,
        avg: sql<number>`avg(${storeReviews.rating})::float`,
      })
      .from(storeReviews)
      .where(inArray(storeReviews.productId, productIds))
      .groupBy(storeReviews.productId);
    for (const r of rows) {
      out.set(r.productId, { avgRating: r.avg ?? 0, count: r.n ?? 0 });
    }
    return out;
  }

  // ── Newsletter Campaigns ─────────────────────────────────────────

  async getCampaignsByStore(storeId: string) {
    return db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.storeId, storeId)).orderBy(desc(newsletterCampaigns.createdAt));
  }

  async getCampaignById(id: string) {
    const [c] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    return c;
  }

  async createCampaign(data: InsertNewsletterCampaign) {
    const [c] = await db.insert(newsletterCampaigns).values(data).returning();
    return c;
  }

  async updateCampaign(id: string, data: Partial<InsertNewsletterCampaign>) {
    const [c] = await db.update(newsletterCampaigns).set({ ...data, updatedAt: new Date() }).where(eq(newsletterCampaigns.id, id)).returning();
    return c;
  }

  async deleteCampaign(id: string) {
    await db.delete(newsletterCampaignBlocks).where(eq(newsletterCampaignBlocks.campaignId, id));
    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
  }

  async getBlocksByCampaign(campaignId: string) {
    return db.select().from(newsletterCampaignBlocks).where(eq(newsletterCampaignBlocks.campaignId, campaignId)).orderBy(newsletterCampaignBlocks.sortOrder);
  }

  async createCampaignBlock(data: InsertNewsletterCampaignBlock) {
    const [b] = await db.insert(newsletterCampaignBlocks).values(data).returning();
    return b;
  }

  async updateCampaignBlock(id: string, data: Partial<InsertNewsletterCampaignBlock>) {
    const [b] = await db.update(newsletterCampaignBlocks).set({ ...data, updatedAt: new Date() }).where(eq(newsletterCampaignBlocks.id, id)).returning();
    return b;
  }

  async deleteCampaignBlock(id: string) {
    await db.delete(newsletterCampaignBlocks).where(eq(newsletterCampaignBlocks.id, id));
  }
}

// Phase 1 storage split — domain modules live under server/storage/ and are
// merged into the singleton here. Existing call sites (`storage.foo()`) keep
// working: Object.assign attaches the domain methods onto the DatabaseStorage
// instance, and the intersection type tells TypeScript both surfaces are
// available.
//
// Domains migrated so far: affiliate, course, product, order,
// member-subscription.
import { affiliateStorage, type AffiliateStorage } from "./storage/affiliate";
import { courseStorage, type CourseStorage } from "./storage/course";
import { productStorage, type ProductStorage } from "./storage/product";
import { orderStorage, type OrderStorage } from "./storage/order";
import { memberSubscriptionStorage, type MemberSubscriptionStorage } from "./storage/member-subscription";
import { aiLaunchStorage, type AiLaunchStorage } from "./storage/ai-launch";

export const storage = Object.assign(
  new DatabaseStorage(),
  affiliateStorage,
  courseStorage,
  productStorage,
  orderStorage,
  memberSubscriptionStorage,
  aiLaunchStorage,
) as DatabaseStorage & AffiliateStorage & CourseStorage & ProductStorage & OrderStorage & MemberSubscriptionStorage & AiLaunchStorage;
