import { eq, and, desc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
import { db } from "./db";
import {
  stores, products, fileAssets, storeProducts, orders, orderItems, downloadTokens,
  bundles, bundleItems, coupons, productImages, categories, userProfiles,
  customers, customerSessions, knowledgeBases, kbPages, kbBlocks, kbPageAttachments, storeEvents, blogPosts, blogBlocks,
  storeTestimonials, storeFaqs, newsletterSubscribers, storeReviews,
  newsletterCampaigns, newsletterCampaignBlocks, emailSuppression,
  affiliates, affiliateClicks, affiliateCommissions, affiliatePayouts,
  type Affiliate, type InsertAffiliate,
  type AffiliateClick, type InsertAffiliateClick,
  type AffiliateCommission, type InsertAffiliateCommission,
  type AffiliatePayout, type InsertAffiliatePayout,
  courseLessons, courseLessonProgress, courseModules,
  quizQuestions, quizChoices, quizAttempts, certificateIssued, courseLessonComments,
  type CourseLesson, type InsertCourseLesson,
  type CourseLessonProgress, type InsertCourseLessonProgress,
  type CourseModule, type InsertCourseModule,
  type QuizQuestion, type InsertQuizQuestion,
  type QuizChoice, type InsertQuizChoice,
  type QuizAttempt, type InsertQuizAttempt,
  type CertificateIssued, type InsertCertificateIssued,
  type CourseLessonComment, type InsertCourseLessonComment,
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
  updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl" | "paymentProvider" | "paypalClientId" | "paypalClientSecret" | "stripePublishableKey" | "stripeSecretKey" | "blogEnabled" | "announcementText" | "announcementLink" | "footerText" | "socialTwitter" | "socialInstagram" | "socialYoutube" | "socialTiktok" | "socialWebsite" | "faviconUrl" | "seoTitle" | "seoDescription" | "allowImageDownload" | "aboutEnabled" | "aboutHeadline" | "aboutText" | "aboutImageUrl" | "aboutCtaText" | "aboutCtaUrl" | "testimonialsEnabled" | "faqEnabled" | "newsletterEnabled" | "newsletterHeadline" | "newsletterSubtext" | "sectionOrder" | "reviewsEnabled" | "stripeTaxEnabled" | "pdfWatermarkEnabled">>): Promise<Store | undefined>;
  deleteStore(id: string, callerOwnerId?: string): Promise<void>;
  hardDeleteStore(id: string): Promise<void>;
  restoreStore(id: string): Promise<Store | undefined>;
  getDeletedStores(): Promise<Store[]>;

  getLibraryProducts(): Promise<Product[]>;
  getProductsByOwner(ownerId: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<Pick<Product, "title" | "slug" | "description" | "tagline" | "category" | "priceCents" | "originalPriceCents" | "thumbnailUrl" | "fileUrl" | "status" | "requiredTier" | "productType" | "deliveryInstructions" | "accessUrl" | "redemptionCode" | "tags" | "highlights" | "version" | "fileSize" | "certificatesEnabled" | "reviewsEnabled" | "pwywEnabled" | "pwywMinCents">>): Promise<Product | undefined>;
  deleteProduct(id: string, callerOwnerId?: string): Promise<void>;
  hardDeleteProduct(id: string): Promise<void>;
  restoreProduct(id: string): Promise<Product | undefined>;
  getDeletedProducts(): Promise<Product[]>;

  getStoreProducts(storeId: string): Promise<(StoreProduct & { product: Product })[]>;
  getPublishedStoreProducts(storeId: string): Promise<Product[]>;
  getStoreProductById(id: string): Promise<StoreProduct | undefined>;
  getStoreProductByStoreAndProduct(storeId: string, productId: string): Promise<StoreProduct | undefined>;
  createStoreProduct(sp: InsertStoreProduct): Promise<StoreProduct>;
  updateStoreProductPublish(id: string, isPublished: boolean): Promise<StoreProduct | undefined>;
  updateStoreProduct(id: string, data: Partial<Pick<StoreProduct, "customPriceCents" | "customTitle" | "customDescription" | "customTags" | "customAccessUrl" | "customRedemptionCode" | "customDeliveryInstructions" | "isPublished" | "isLeadMagnet" | "isFeatured" | "sortOrder" | "upsellProductId" | "upsellBundleId">>): Promise<StoreProduct | undefined>;
  deleteStoreProduct(id: string): Promise<void>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByStripeSession(sessionId: string): Promise<Order | undefined>;
  getOrderByPaypalOrderId(paypalOrderId: string): Promise<Order | undefined>;
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
  consumeCustomerSession(id: string): Promise<boolean>;

  isEmailSuppressed(email: string): Promise<boolean>;
  suppressEmail(email: string, reason: "bounce" | "complaint" | "unsubscribe" | "manual", detail?: string): Promise<void>;
  unsuppressEmail(email: string): Promise<void>;
  getOrdersByCustomer(customerId: string): Promise<(Order & { store: Store })[]>;
  setOrderCustomerId(orderId: string, customerId: string): Promise<void>;
  linkOrdersByEmail(email: string, customerId: string): Promise<void>;

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
  getStoreCustomers(storeId: string): Promise<{ id: string; email: string; name: string | null; createdAt: Date; totalSpent: number; orderCount: number; lastOrderDate: Date | null; products: string[] }[]>;
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

  async updateStore(id: string, data: Partial<Pick<Store, "name" | "slug" | "templateKey" | "tagline" | "logoUrl" | "accentColor" | "heroBannerUrl" | "paymentProvider" | "paypalClientId" | "paypalClientSecret" | "stripePublishableKey" | "stripeSecretKey" | "blogEnabled" | "announcementText" | "announcementLink" | "footerText" | "socialTwitter" | "socialInstagram" | "socialYoutube" | "socialTiktok" | "socialWebsite" | "faviconUrl" | "seoTitle" | "seoDescription" | "allowImageDownload" | "aboutEnabled" | "aboutHeadline" | "aboutText" | "aboutImageUrl" | "aboutCtaText" | "aboutCtaUrl" | "testimonialsEnabled" | "faqEnabled" | "newsletterEnabled" | "newsletterHeadline" | "newsletterSubtext" | "sectionOrder" | "reviewsEnabled" | "stripeTaxEnabled" | "pdfWatermarkEnabled">>) {
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

  async getLibraryProducts() {
    return db.select().from(products).where(and(eq(products.source, "PLATFORM"), isNull(products.deletedAt)));
  }

  async getProductsByOwner(ownerId: string) {
    return db.select().from(products).where(and(eq(products.ownerId, ownerId), isNull(products.deletedAt))).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string) {
    const [product] = await db.select().from(products).where(and(eq(products.id, id), isNull(products.deletedAt)));
    return product;
  }

  async getProductBySlug(slug: string) {
    const [product] = await db.select().from(products).where(and(eq(products.slug, slug), isNull(products.deletedAt)));
    return product;
  }

  async createProduct(data: InsertProduct) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<Pick<Product, "title" | "slug" | "description" | "tagline" | "category" | "priceCents" | "originalPriceCents" | "thumbnailUrl" | "fileUrl" | "status" | "requiredTier" | "productType" | "deliveryInstructions" | "accessUrl" | "redemptionCode" | "tags" | "highlights" | "version" | "fileSize" | "certificatesEnabled" | "reviewsEnabled" | "pwywEnabled" | "pwywMinCents">>) {
    const [product] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string, callerOwnerId?: string) {
    if (callerOwnerId) {
      const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.ownerId, callerOwnerId)));
      if (!product) throw new Error("Product not found or not owned by caller");
    }
    await db.update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(products.id, id));
  }

  async hardDeleteProduct(id: string) {
    console.warn(`[DATA-SAFETY] hardDeleteProduct called for product ${id} — permanently removing product and related assets`);
    await db.delete(storeProducts).where(eq(storeProducts.productId, id));
    await db.delete(fileAssets).where(eq(fileAssets.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async restoreProduct(id: string) {
    const [product] = await db.update(products).set({ deletedAt: null, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product;
  }

  async getDeletedProducts() {
    return db.select().from(products).where(isNotNull(products.deletedAt)).orderBy(desc(products.deletedAt));
  }

  async getStoreProducts(storeId: string) {
    const rows = await db
      .select({ sp: storeProducts, product: products })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(and(eq(storeProducts.storeId, storeId), isNull(products.deletedAt)));
    return rows.map((r) => ({ ...r.sp, product: r.product }));
  }

  async getPublishedStoreProducts(storeId: string) {
    const rows = await db
      .select({ product: products })
      .from(storeProducts)
      .innerJoin(products, eq(storeProducts.productId, products.id))
      .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.isPublished, true), isNull(products.deletedAt)));
    return rows.map((r) => r.product);
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
    const [sp] = await db.update(storeProducts).set({ isPublished, updatedAt: new Date() }).where(eq(storeProducts.id, id)).returning();
    return sp;
  }

  async updateStoreProduct(id: string, data: Partial<Pick<StoreProduct, "customPriceCents" | "customTitle" | "customDescription" | "customTags" | "customAccessUrl" | "customRedemptionCode" | "customDeliveryInstructions" | "isPublished" | "isLeadMagnet" | "isFeatured" | "sortOrder" | "upsellProductId" | "upsellBundleId">>) {
    const [sp] = await db.update(storeProducts).set({ ...data, updatedAt: new Date() }).where(eq(storeProducts.id, id)).returning();
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
    const [order] = await db.select().from(orders).where(and(eq(orders.id, id), isNull(orders.deletedAt)));
    return order;
  }

  async getOrderByStripeSession(sessionId: string) {
    const [order] = await db.select().from(orders).where(and(eq(orders.stripeSessionId, sessionId), isNull(orders.deletedAt)));
    return order;
  }

  async getOrderByPaypalOrderId(paypalOrderId: string) {
    const [order] = await db.select().from(orders).where(and(eq(orders.paypalOrderId, paypalOrderId), isNull(orders.deletedAt)));
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const [order] = await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateOrderBuyerEmail(id: string, email: string) {
    await db.update(orders).set({ buyerEmail: email, updatedAt: new Date() }).where(eq(orders.id, id));
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

  async createCoupon(data: InsertCoupon) {
    const [coupon] = await db.insert(coupons).values(data).returning();
    return coupon;
  }

  async getCouponsByStore(storeId: string) {
    return db.select().from(coupons).where(and(eq(coupons.storeId, storeId), isNull(coupons.deletedAt))).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(storeId: string, code: string) {
    const [coupon] = await db.select().from(coupons).where(
      and(eq(coupons.storeId, storeId), eq(coupons.code, code.toUpperCase()), isNull(coupons.deletedAt))
    );
    return coupon;
  }

  async getCouponById(id: string) {
    const [coupon] = await db.select().from(coupons).where(and(eq(coupons.id, id), isNull(coupons.deletedAt)));
    return coupon;
  }

  async updateCoupon(id: string, data: Partial<InsertCoupon>) {
    const [coupon] = await db.update(coupons).set({ ...data, updatedAt: new Date() }).where(eq(coupons.id, id)).returning();
    return coupon;
  }

  async incrementCouponUses(id: string) {
    await db.update(coupons).set({ currentUses: sql`${coupons.currentUses} + 1`, updatedAt: new Date() }).where(eq(coupons.id, id));
  }

  async deleteCoupon(id: string) {
    await db.update(coupons).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(coupons.id, id));
  }

  async getOrdersByStore(storeId: string) {
    return db.select().from(orders).where(and(eq(orders.storeId, storeId), isNull(orders.deletedAt))).orderBy(desc(orders.createdAt));
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
    const [updated] = await db.update(categories).set({ ...data, updatedAt: new Date() }).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string) {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async ensureDefaultCategories(ownerId: string) {
    const defaults = [
      { name: "Templates", slug: "templates", sortOrder: 0 },
      { name: "Graphics", slug: "graphics", sortOrder: 1 },
      { name: "Ebooks", slug: "ebooks", sortOrder: 2 },
      { name: "Tools", slug: "tools", sortOrder: 3 },
      { name: "Software", slug: "software", sortOrder: 4 },
    ];
    const existing = await this.getCategoriesByOwner(ownerId);
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const missing = defaults.filter((d) => !existingSlugs.has(d.slug));
    if (missing.length > 0) {
      const rows = missing.map((d) => ({ ...d, ownerId }));
      await db.insert(categories).values(rows).onConflictDoNothing();
      return this.getCategoriesByOwner(ownerId);
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

  async getOrdersByCustomer(customerId: string) {
    const rows = await db
      .select({ order: orders, store: stores })
      .from(orders)
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(orders.customerId, customerId), eq(orders.status, "COMPLETED"), isNull(orders.deletedAt)))
      .orderBy(desc(orders.createdAt));
    return rows.map((r) => ({ ...r.order, store: r.store }));
  }

  async setOrderCustomerId(orderId: string, customerId: string) {
    await db.update(orders).set({ customerId, updatedAt: new Date() }).where(eq(orders.id, orderId));
  }

  async linkOrdersByEmail(email: string, customerId: string) {
    await db.update(orders).set({ customerId, updatedAt: new Date() }).where(
      and(eq(orders.buyerEmail, email.toLowerCase()), sql`${orders.customerId} IS NULL`)
    );
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

  // ─── Affiliates ─────────────────────────────────────────────────────

  async getAffiliateByCode(storeId: string, code: string): Promise<Affiliate | undefined> {
    const [row] = await db.select().from(affiliates)
      .where(and(eq(affiliates.storeId, storeId), eq(affiliates.code, code), isNull(affiliates.deletedAt)))
      .limit(1);
    return row;
  }

  async getAffiliateById(id: string): Promise<Affiliate | undefined> {
    const [row] = await db.select().from(affiliates)
      .where(and(eq(affiliates.id, id), isNull(affiliates.deletedAt)))
      .limit(1);
    return row;
  }

  async getAffiliatesByStore(storeId: string): Promise<Affiliate[]> {
    return db.select().from(affiliates)
      .where(and(eq(affiliates.storeId, storeId), isNull(affiliates.deletedAt)))
      .orderBy(desc(affiliates.createdAt));
  }

  async getAffiliatesByUser(userId: string): Promise<Affiliate[]> {
    return db.select().from(affiliates)
      .where(and(eq(affiliates.userId, userId), isNull(affiliates.deletedAt)))
      .orderBy(desc(affiliates.createdAt));
  }

  // Returns affiliate rows matching this user via either userId or payout_email.
  // Self-serve applicants get a placeholder userId (since they weren't logged in
  // when they applied); we link by email until they sign in for the first time.
  async getAffiliatesByUserOrEmail(userId: string, email: string | null): Promise<Affiliate[]> {
    if (!email) return this.getAffiliatesByUser(userId);
    const rows = await db.select().from(affiliates)
      .where(and(
        sql`(${affiliates.userId} = ${userId} OR ${affiliates.payoutEmail} = ${email})`,
        isNull(affiliates.deletedAt),
      ))
      .orderBy(desc(affiliates.createdAt));
    return rows;
  }

  // Lazy-link: when a self-serve applicant signs in, swap the placeholder
  // userId on their affiliate rows with their real users.id.
  async linkAffiliateToUser(affiliateId: string, userId: string): Promise<void> {
    await db.update(affiliates)
      .set({ userId, updatedAt: new Date() })
      .where(eq(affiliates.id, affiliateId));
  }

  async createAffiliate(data: InsertAffiliate): Promise<Affiliate> {
    const [row] = await db.insert(affiliates).values(data).returning();
    return row;
  }

  async updateAffiliate(id: string, data: Partial<InsertAffiliate>): Promise<Affiliate | undefined> {
    const [row] = await db.update(affiliates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(affiliates.id, id))
      .returning();
    return row;
  }

  async softDeleteAffiliate(id: string): Promise<void> {
    await db.update(affiliates)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(affiliates.id, id));
  }

  // ─── Affiliate clicks ───────────────────────────────────────────────

  async recordAffiliateClick(data: InsertAffiliateClick): Promise<AffiliateClick> {
    const [row] = await db.insert(affiliateClicks).values(data).returning();
    return row;
  }

  async hasRecentClick(affiliateId: string, ipHash: string, withinMinutes: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const [row] = await db.select({ id: affiliateClicks.id }).from(affiliateClicks)
      .where(and(
        eq(affiliateClicks.affiliateId, affiliateId),
        eq(affiliateClicks.ipHash, ipHash),
        sql`${affiliateClicks.createdAt} > ${cutoff}`,
      ))
      .limit(1);
    return !!row;
  }

  // ─── Affiliate commissions ──────────────────────────────────────────

  async createCommission(data: InsertAffiliateCommission): Promise<AffiliateCommission> {
    const [row] = await db.insert(affiliateCommissions).values(data).returning();
    return row;
  }

  async getCommissionByOrderId(orderId: string): Promise<AffiliateCommission | undefined> {
    const [row] = await db.select().from(affiliateCommissions)
      .where(eq(affiliateCommissions.orderId, orderId))
      .limit(1);
    return row;
  }

  async voidCommissionsForOrder(orderId: string, reason: string): Promise<void> {
    await db.update(affiliateCommissions)
      .set({ status: "void", voidReason: reason, updatedAt: new Date() })
      .where(and(
        eq(affiliateCommissions.orderId, orderId),
        sql`${affiliateCommissions.status} IN ('pending', 'approved')`,
      ));
  }

  async getCommissionsByAffiliate(affiliateId: string): Promise<AffiliateCommission[]> {
    return db.select().from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliateId))
      .orderBy(desc(affiliateCommissions.createdAt));
  }

  // ─── Affiliate payouts ──────────────────────────────────────────────

  async createPayout(data: InsertAffiliatePayout): Promise<AffiliatePayout> {
    const [row] = await db.insert(affiliatePayouts).values(data).returning();
    return row;
  }

  async markCommissionsPaid(commissionIds: string[], payoutId: string): Promise<void> {
    if (commissionIds.length === 0) return;
    await db.update(affiliateCommissions)
      .set({ status: "paid", payoutId, updatedAt: new Date() })
      .where(inArray(affiliateCommissions.id, commissionIds));
  }

  // Eligible = pending/approved + locked_until is past + not yet paid.
  // These are the rows the owner picks when running a payout.
  async getEligibleCommissionsForAffiliate(affiliateId: string): Promise<AffiliateCommission[]> {
    return db.select().from(affiliateCommissions)
      .where(and(
        eq(affiliateCommissions.affiliateId, affiliateId),
        sql`${affiliateCommissions.status} IN ('pending', 'approved')`,
        sql`${affiliateCommissions.lockedUntil} <= NOW()`,
        isNull(affiliateCommissions.payoutId),
      ))
      .orderBy(desc(affiliateCommissions.createdAt));
  }

  async getPayoutsByStore(storeId: string): Promise<AffiliatePayout[]> {
    return db.select().from(affiliatePayouts)
      .where(eq(affiliatePayouts.storeId, storeId))
      .orderBy(desc(affiliatePayouts.createdAt));
  }

  async markPayoutPaid(payoutId: string, externalRef: string | null): Promise<AffiliatePayout | undefined> {
    const [row] = await db.update(affiliatePayouts)
      .set({ status: "paid", externalRef, paidAt: new Date(), updatedAt: new Date() })
      .where(eq(affiliatePayouts.id, payoutId))
      .returning();
    return row;
  }

  async getAffiliateClickCount(affiliateId: string, sinceDays: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const [row] = await db.select({ n: sql<number>`count(*)::int` })
      .from(affiliateClicks)
      .where(and(
        eq(affiliateClicks.affiliateId, affiliateId),
        sql`${affiliateClicks.createdAt} > ${cutoff}`,
      ));
    return row?.n ?? 0;
  }

  // ─── Course lessons ─────────────────────────────────────────────────

  async getLessonsByProduct(productId: string): Promise<CourseLesson[]> {
    return db.select().from(courseLessons)
      .where(and(eq(courseLessons.productId, productId), isNull(courseLessons.deletedAt)))
      .orderBy(courseLessons.sortOrder, courseLessons.createdAt);
  }

  async getLessonById(id: string): Promise<CourseLesson | undefined> {
    const [row] = await db.select().from(courseLessons)
      .where(and(eq(courseLessons.id, id), isNull(courseLessons.deletedAt)))
      .limit(1);
    return row;
  }

  async createLesson(data: InsertCourseLesson): Promise<CourseLesson> {
    const [row] = await db.insert(courseLessons).values(data).returning();
    return row;
  }

  async updateLesson(id: string, data: Partial<InsertCourseLesson>): Promise<CourseLesson | undefined> {
    const [row] = await db.update(courseLessons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseLessons.id, id))
      .returning();
    return row;
  }

  async softDeleteLesson(id: string): Promise<void> {
    await db.update(courseLessons)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(courseLessons.id, id));
  }

  async reorderLessons(productId: string, lessonIds: string[]): Promise<void> {
    // Set sort_order to position in the array. Run in a transaction so
    // a partial failure doesn't leave the course half-reordered.
    await db.transaction(async (tx) => {
      for (let i = 0; i < lessonIds.length; i++) {
        await tx.update(courseLessons)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(eq(courseLessons.id, lessonIds[i]), eq(courseLessons.productId, productId)));
      }
    });
  }

  async getLessonProgressForOrder(orderId: string): Promise<CourseLessonProgress[]> {
    return db.select().from(courseLessonProgress)
      .where(eq(courseLessonProgress.orderId, orderId));
  }

  async markLessonComplete(data: InsertCourseLessonProgress): Promise<CourseLessonProgress> {
    // Idempotent insert — if (lessonId, orderId) already exists, no-op.
    try {
      const [row] = await db.insert(courseLessonProgress).values(data).returning();
      return row;
    } catch (err: any) {
      if (err?.code === "23505") {
        const [existing] = await db.select().from(courseLessonProgress)
          .where(and(
            eq(courseLessonProgress.lessonId, data.lessonId),
            eq(courseLessonProgress.orderId, data.orderId),
          ))
          .limit(1);
        return existing;
      }
      throw err;
    }
  }

  async unmarkLessonComplete(lessonId: string, orderId: string): Promise<void> {
    await db.delete(courseLessonProgress)
      .where(and(
        eq(courseLessonProgress.lessonId, lessonId),
        eq(courseLessonProgress.orderId, orderId),
      ));
  }

  // ─── Course modules ─────────────────────────────────────────────────

  async getModulesByProduct(productId: string): Promise<CourseModule[]> {
    return db.select().from(courseModules)
      .where(and(eq(courseModules.productId, productId), isNull(courseModules.deletedAt)))
      .orderBy(courseModules.sortOrder, courseModules.createdAt);
  }

  async getModuleById(id: string): Promise<CourseModule | undefined> {
    const [row] = await db.select().from(courseModules)
      .where(and(eq(courseModules.id, id), isNull(courseModules.deletedAt)))
      .limit(1);
    return row;
  }

  async createModule(data: InsertCourseModule): Promise<CourseModule> {
    const [row] = await db.insert(courseModules).values(data).returning();
    return row;
  }

  async updateModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule | undefined> {
    const [row] = await db.update(courseModules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseModules.id, id))
      .returning();
    return row;
  }

  async softDeleteModule(id: string): Promise<void> {
    // Soft-delete the module AND un-module all its lessons so they survive
    // (lessons aren't cascade-deleted — they become un-grouped at the top
    // of the course outline). Owner can re-assign them later.
    await db.transaction(async (tx) => {
      await tx.update(courseModules)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(courseModules.id, id));
      await tx.update(courseLessons)
        .set({ moduleId: null, updatedAt: new Date() })
        .where(eq(courseLessons.moduleId, id));
    });
  }

  async reorderModules(productId: string, moduleIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < moduleIds.length; i++) {
        await tx.update(courseModules)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(eq(courseModules.id, moduleIds[i]), eq(courseModules.productId, productId)));
      }
    });
  }

  // ─── Quizzes ────────────────────────────────────────────────────────

  async getQuestionsByLesson(lessonId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions)
      .where(and(eq(quizQuestions.lessonId, lessonId), isNull(quizQuestions.deletedAt)))
      .orderBy(quizQuestions.sortOrder, quizQuestions.createdAt);
  }

  async getQuestionById(id: string): Promise<QuizQuestion | undefined> {
    const [row] = await db.select().from(quizQuestions)
      .where(and(eq(quizQuestions.id, id), isNull(quizQuestions.deletedAt)))
      .limit(1);
    return row;
  }

  async createQuestion(data: InsertQuizQuestion): Promise<QuizQuestion> {
    const [row] = await db.insert(quizQuestions).values(data).returning();
    return row;
  }

  async updateQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [row] = await db.update(quizQuestions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quizQuestions.id, id))
      .returning();
    return row;
  }

  async softDeleteQuestion(id: string): Promise<void> {
    // Choices stay in DB but are unreachable through the soft-deleted question.
    await db.update(quizQuestions)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(quizQuestions.id, id));
  }

  async getChoicesByQuestion(questionId: string): Promise<QuizChoice[]> {
    return db.select().from(quizChoices)
      .where(eq(quizChoices.questionId, questionId))
      .orderBy(quizChoices.sortOrder, quizChoices.createdAt);
  }

  async getChoicesByQuestionIds(questionIds: string[]): Promise<QuizChoice[]> {
    if (questionIds.length === 0) return [];
    return db.select().from(quizChoices)
      .where(inArray(quizChoices.questionId, questionIds))
      .orderBy(quizChoices.sortOrder);
  }

  async replaceChoicesForQuestion(questionId: string, choices: { label: string; isCorrect: boolean }[]): Promise<QuizChoice[]> {
    // Wipe + re-insert. Simpler than diffing add/update/delete and choices
    // are small (typically 2-5 per question). All-or-nothing in a transaction.
    return db.transaction(async (tx) => {
      await tx.delete(quizChoices).where(eq(quizChoices.questionId, questionId));
      if (choices.length === 0) return [];
      const rows = await tx.insert(quizChoices)
        .values(choices.map((c, i) => ({
          questionId,
          label: c.label,
          isCorrect: c.isCorrect,
          sortOrder: i,
        })))
        .returning();
      return rows;
    });
  }

  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const [row] = await db.insert(quizAttempts).values(data).returning();
    return row;
  }

  async getLatestPassingAttempt(lessonId: string, orderId: string): Promise<QuizAttempt | undefined> {
    const [row] = await db.select().from(quizAttempts)
      .where(and(
        eq(quizAttempts.lessonId, lessonId),
        eq(quizAttempts.orderId, orderId),
        eq(quizAttempts.passed, true),
      ))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(1);
    return row;
  }

  async hasLessonQuiz(lessonId: string): Promise<boolean> {
    const [row] = await db.select({ id: quizQuestions.id }).from(quizQuestions)
      .where(and(eq(quizQuestions.lessonId, lessonId), isNull(quizQuestions.deletedAt)))
      .limit(1);
    return !!row;
  }

  // ─── Certificates ───────────────────────────────────────────────────

  async getCertificateForOrderProduct(orderId: string, productId: string): Promise<CertificateIssued | undefined> {
    const [row] = await db.select().from(certificateIssued)
      .where(and(eq(certificateIssued.orderId, orderId), eq(certificateIssued.productId, productId)))
      .limit(1);
    return row;
  }

  async createCertificate(data: InsertCertificateIssued): Promise<CertificateIssued> {
    try {
      const [row] = await db.insert(certificateIssued).values(data).returning();
      return row;
    } catch (err: any) {
      // Idempotent: if another request already issued one, return existing.
      if (err?.code === "23505") {
        const existing = await this.getCertificateForOrderProduct(data.orderId, data.productId);
        if (existing) return existing;
      }
      throw err;
    }
  }

  async getCertificateByCode(code: string): Promise<CertificateIssued | undefined> {
    const [row] = await db.select().from(certificateIssued)
      .where(eq(certificateIssued.verificationCode, code))
      .limit(1);
    return row;
  }

  // ─── Course lesson comments ─────────────────────────────────────────

  async getCommentsByLesson(lessonId: string): Promise<CourseLessonComment[]> {
    return db.select().from(courseLessonComments)
      .where(and(eq(courseLessonComments.lessonId, lessonId), isNull(courseLessonComments.deletedAt)))
      // Pinned first (desc), then newest first
      .orderBy(desc(courseLessonComments.isPinned), desc(courseLessonComments.createdAt));
  }

  async getCommentById(id: string): Promise<CourseLessonComment | undefined> {
    const [row] = await db.select().from(courseLessonComments)
      .where(and(eq(courseLessonComments.id, id), isNull(courseLessonComments.deletedAt)))
      .limit(1);
    return row;
  }

  async createComment(data: InsertCourseLessonComment): Promise<CourseLessonComment> {
    const [row] = await db.insert(courseLessonComments).values(data).returning();
    return row;
  }

  async softDeleteComment(id: string): Promise<void> {
    await db.update(courseLessonComments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(courseLessonComments.id, id));
  }

  async editComment(id: string, body: string): Promise<void> {
    const now = new Date();
    await db.update(courseLessonComments)
      .set({ body, editedAt: now, updatedAt: now })
      .where(eq(courseLessonComments.id, id));
  }

  async setCommentPinned(id: string, isPinned: boolean): Promise<void> {
    await db.update(courseLessonComments)
      .set({ isPinned, updatedAt: new Date() })
      .where(eq(courseLessonComments.id, id));
  }

  // Returns one row per opted-in participant (email + orderId) so the caller
  // can build personalized unsubscribe links. Excludes orders that have
  // turned off comment notifications.
  async getCommentNotifyRecipientsForLesson(lessonId: string): Promise<Array<{ email: string; orderId: string }>> {
    // We want one row per (orderId), with the most recent author email for
    // display — but since authorEmail comes from order.buyerEmail at post
    // time, joining straight to orders.buyerEmail is more reliable.
    const rows = await db
      .selectDistinct({
        email: orders.buyerEmail,
        orderId: courseLessonComments.orderId,
      })
      .from(courseLessonComments)
      .innerJoin(orders, eq(orders.id, courseLessonComments.orderId))
      .where(and(
        eq(courseLessonComments.lessonId, lessonId),
        eq(courseLessonComments.authorType, "buyer"),
        isNull(courseLessonComments.deletedAt),
        eq(orders.commentNotificationsEnabled, true),
      ));
    return rows
      .filter((r): r is { email: string; orderId: string } => !!r.email && !!r.orderId);
  }

  async setOrderCommentNotifications(orderId: string, enabled: boolean): Promise<void> {
    await db.update(orders)
      .set({ commentNotificationsEnabled: enabled, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  // Distinct buyer emails who've posted a comment on this lesson. Used to
  // build the recipient list when the instructor replies — everyone who's
  // participated gets notified (other than the just-posted comment row).
  async getDistinctBuyerEmailsForLesson(lessonId: string, excludeCommentId?: string): Promise<string[]> {
    const conditions = [
      eq(courseLessonComments.lessonId, lessonId),
      eq(courseLessonComments.authorType, "buyer"),
      isNull(courseLessonComments.deletedAt),
      sql`${courseLessonComments.authorEmail} IS NOT NULL`,
    ];
    if (excludeCommentId) conditions.push(sql`${courseLessonComments.id} != ${excludeCommentId}`);
    const rows = await db.selectDistinct({ email: courseLessonComments.authorEmail })
      .from(courseLessonComments)
      .where(and(...conditions));
    return rows.map((r) => r.email).filter((e): e is string => !!e);
  }

  async countRecentCommentsByOrder(orderId: string, withinMinutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const [row] = await db.select({ n: sql<number>`count(*)::int` })
      .from(courseLessonComments)
      .where(and(
        eq(courseLessonComments.orderId, orderId),
        sql`${courseLessonComments.createdAt} > ${cutoff}`,
      ));
    return row?.n ?? 0;
  }
}

export const storage = new DatabaseStorage();
