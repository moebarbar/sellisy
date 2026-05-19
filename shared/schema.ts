import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const productSourceEnum = pgEnum("product_source", ["PLATFORM", "USER"]);
export const productStatusEnum = pgEnum("product_status", ["DRAFT", "ACTIVE"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]);
export const planTierEnum = pgEnum("plan_tier", ["basic", "pro", "max"]);
export const productTypeEnum = pgEnum("product_type", ["digital", "software", "template", "ebook", "course", "graphics"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "paypal"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "sent"]);
export const affiliateStatusEnum = pgEnum("affiliate_status", ["pending", "active", "paused", "rejected"]);
export const commissionStatusEnum = pgEnum("commission_status", ["pending", "approved", "paid", "void"]);
export const payoutStatusEnum = pgEnum("payout_status", ["processing", "paid", "failed"]);

export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id", { length: 64 }).primaryKey(),
  planTier: planTierEnum("plan_tier").notNull().default("basic"),
  isAdmin: boolean("is_admin").notNull().default(false),
  // Free 14-day Growth-tier trial. NULL = no trial (never had one, or
  // already converted to paid). Effective tier resolution treats
  // basic + trial_ends_at > now() as "pro".
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export const PLAN_TIERS = ["basic", "pro", "max"] as const;
export type PlanTier = typeof PLAN_TIERS[number];

export const PLAN_FEATURES = {
  basic: {
    importProducts: false,
    editImportedProducts: false,
    customBranding: false,
    rawFileDownload: false,
    sellSoftware: false,
    accessPremiumProducts: false,
    allowImageDownload: false,
    affiliateProgram: false,
    maxStores: 1,
  },
  pro: {
    importProducts: true,
    editImportedProducts: true,
    customBranding: true,
    rawFileDownload: false,
    sellSoftware: false,
    accessPremiumProducts: true,
    allowImageDownload: true,
    affiliateProgram: true,
    maxStores: 3,
  },
  max: {
    importProducts: true,
    editImportedProducts: true,
    customBranding: true,
    rawFileDownload: true,
    sellSoftware: true,
    accessPremiumProducts: true,
    allowImageDownload: true,
    affiliateProgram: true,
    maxStores: 10,
  },
} as const;

export type PlanFeatures = typeof PLAN_FEATURES[PlanTier];

export function canAccessTier(userTier: PlanTier, requiredTier: PlanTier): boolean {
  const tierOrder = { basic: 0, pro: 1, max: 2 };
  return tierOrder[userTier] >= tierOrder[requiredTier];
}

export const stores = pgTable("stores", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  templateKey: text("template_key").notNull().default("neon"),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"),
  heroBannerUrl: text("hero_banner_url"),
  paymentProvider: paymentProviderEnum("payment_provider").notNull().default("stripe"),
  paypalClientId: text("paypal_client_id"),
  paypalClientSecret: text("paypal_client_secret"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  allowImageDownload: boolean("allow_image_download").notNull().default(false),
  blogEnabled: boolean("blog_enabled").notNull().default(false),
  announcementText: text("announcement_text"),
  announcementLink: text("announcement_link"),
  footerText: text("footer_text"),
  socialTwitter: text("social_twitter"),
  socialInstagram: text("social_instagram"),
  socialYoutube: text("social_youtube"),
  socialTiktok: text("social_tiktok"),
  socialWebsite: text("social_website"),
  faviconUrl: text("favicon_url"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  customDomain: text("custom_domain"),
  domainStatus: text("domain_status"),
  domainSource: text("domain_source"),
  domainVerifiedAt: timestamp("domain_verified_at"),
  cloudflareHostnameId: text("cloudflare_hostname_id"),
  workerRouteId: text("worker_route_id"),
  aboutEnabled: boolean("about_enabled").notNull().default(false),
  aboutHeadline: text("about_headline"),
  aboutText: text("about_text"),
  aboutImageUrl: text("about_image_url"),
  aboutCtaText: text("about_cta_text"),
  aboutCtaUrl: text("about_cta_url"),
  testimonialsEnabled: boolean("testimonials_enabled").notNull().default(false),
  faqEnabled: boolean("faq_enabled").notNull().default(false),
  newsletterEnabled: boolean("newsletter_enabled").notNull().default(false),
  newsletterHeadline: text("newsletter_headline"),
  newsletterSubtext: text("newsletter_subtext"),
  sectionOrder: text("section_order"),
  reviewsEnabled: boolean("reviews_enabled").notNull().default(false),
  showRatingsOnCards: boolean("show_ratings_on_cards").notNull().default(true),
  showDiscountBadges: boolean("show_discount_badges").notNull().default(true),
  showSubscriberCount: boolean("show_subscriber_count").notNull().default(false),
  affiliateProgramEnabled: boolean("affiliate_program_enabled").notNull().default(false),
  affiliateDefaultRateBps: integer("affiliate_default_rate_bps").notNull().default(2000),
  affiliateCookieDays: integer("affiliate_cookie_days").notNull().default(30),
  affiliateMinPayoutCents: integer("affiliate_min_payout_cents").notNull().default(2500),
  affiliateTermsHtml: text("affiliate_terms_html"),
  stripeTaxEnabled: boolean("stripe_tax_enabled").notNull().default(false),
  pdfWatermarkEnabled: boolean("pdf_watermark_enabled").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("stores_owner_deleted_idx").on(t.ownerId, t.deletedAt),
  index("stores_custom_domain_idx").on(t.customDomain, t.deletedAt),
]);

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export const storeDomains = pgTable("store_domains", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  domain: text("domain").notNull(),
  registrar: text("registrar").notNull().default("namecheap"),
  namecheapOrderId: text("namecheap_order_id"),
  registrationDate: timestamp("registration_date"),
  expirationDate: timestamp("expiration_date"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStoreDomainSchema = createInsertSchema(storeDomains).omit({ id: true, createdAt: true });
export type InsertStoreDomain = z.infer<typeof insertStoreDomainSchema>;
export type StoreDomain = typeof storeDomains.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id", { length: 64 }),
  source: productSourceEnum("source").notNull().default("USER"),
  title: text("title").notNull(),
  slug: text("slug"),
  description: text("description"),
  tagline: text("tagline"),
  category: text("category").notNull().default("templates"),
  priceCents: integer("price_cents").notNull().default(0),
  originalPriceCents: integer("original_price_cents"),
  thumbnailUrl: text("thumbnail_url"),
  fileUrl: text("file_url"),
  status: productStatusEnum("status").notNull().default("DRAFT"),
  requiredTier: planTierEnum("required_tier").notNull().default("basic"),
  productType: productTypeEnum("product_type").notNull().default("digital"),
  deliveryInstructions: text("delivery_instructions"),
  accessUrl: text("access_url"),
  redemptionCode: text("redemption_code"),
  tags: text("tags").array(),
  highlights: text("highlights").array(),
  version: text("version"),
  fileSize: text("file_size"),
  gumroadProductId: text("gumroad_product_id").unique(),
  importedFromGumroad: boolean("imported_from_gumroad").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("products_owner_deleted_idx").on(t.ownerId, t.deletedAt),
  index("products_status_idx").on(t.status),
  index("products_slug_idx").on(t.slug),
]);

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const productImages = pgTable("product_images", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (t) => [
  index("product_images_product_idx").on(t.productId),
]);

export const insertProductImageSchema = createInsertSchema(productImages).omit({ id: true });
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

export const fileAssets = pgTable("file_assets", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
}, (t) => [
  index("file_assets_product_idx").on(t.productId),
]);

export const insertFileAssetSchema = createInsertSchema(fileAssets).omit({ id: true });
export type InsertFileAsset = z.infer<typeof insertFileAssetSchema>;
export type FileAsset = typeof fileAssets.$inferSelect;

export const storeProducts = pgTable("store_products", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  customPriceCents: integer("custom_price_cents"),
  customTitle: text("custom_title"),
  customDescription: text("custom_description"),
  customTags: text("custom_tags").array(),
  customAccessUrl: text("custom_access_url"),
  customRedemptionCode: text("custom_redemption_code"),
  customDeliveryInstructions: text("custom_delivery_instructions"),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isLeadMagnet: boolean("is_lead_magnet").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  upsellProductId: varchar("upsell_product_id", { length: 64 }),
  upsellBundleId: varchar("upsell_bundle_id", { length: 64 }),
}, (t) => [
  index("store_products_store_idx").on(t.storeId),
  index("store_products_product_idx").on(t.productId),
  uniqueIndex("store_products_store_product_unique").on(t.storeId, t.productId),
]);

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({ id: true });
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;
export type StoreProduct = typeof storeProducts.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  buyerEmail: text("buyer_email").notNull(),
  customerId: varchar("customer_id", { length: 64 }),
  totalCents: integer("total_cents").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  stripeSessionId: text("stripe_session_id"),
  paypalOrderId: text("paypal_order_id"),
  gumroadSaleId: text("gumroad_sale_id").unique(),
  couponId: varchar("coupon_id", { length: 64 }),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  emailSent: boolean("email_sent").notNull().default(false),
  refundedAt: timestamp("refunded_at"),
  refundedAmountCents: integer("refunded_amount_cents").notNull().default(0),
  refundReason: text("refund_reason"),
  stripeRefundId: text("stripe_refund_id"),
  paypalRefundId: text("paypal_refund_id"),
  affiliateId: varchar("affiliate_id", { length: 64 }),
  affiliateRateBps: integer("affiliate_rate_bps"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("orders_store_deleted_idx").on(t.storeId, t.deletedAt),
  index("orders_customer_idx").on(t.customerId),
  index("orders_stripe_session_idx").on(t.stripeSessionId),
  index("orders_paypal_idx").on(t.paypalOrderId),
  index("orders_created_idx").on(t.createdAt),
  index("orders_status_idx").on(t.status),
  index("orders_affiliate_idx").on(t.affiliateId),
]);

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  priceCents: integer("price_cents").notNull().default(0),
}, (t) => [
  index("order_items_order_idx").on(t.orderId),
  index("order_items_product_idx").on(t.productId),
]);

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const downloadTokens = pgTable("download_tokens", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("download_tokens_order_idx").on(t.orderId),
  index("download_tokens_revoked_idx").on(t.revokedAt),
]);

export const insertDownloadTokenSchema = createInsertSchema(downloadTokens).omit({ id: true, createdAt: true });
export type InsertDownloadToken = z.infer<typeof insertDownloadTokenSchema>;
export type DownloadToken = typeof downloadTokens.$inferSelect;

export const bundles = pgTable("bundles", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull().default(0),
  thumbnailUrl: text("thumbnail_url"),
  isPublished: boolean("is_published").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("bundles_store_deleted_idx").on(t.storeId, t.deletedAt),
]);

export const insertBundleSchema = createInsertSchema(bundles).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundles.$inferSelect;

export const bundleItems = pgTable("bundle_items", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
}, (t) => [
  index("bundle_items_bundle_idx").on(t.bundleId),
  index("bundle_items_product_idx").on(t.productId),
]);

export const insertBundleItemSchema = createInsertSchema(bundleItems).omit({ id: true });
export type InsertBundleItem = z.infer<typeof insertBundleItemSchema>;
export type BundleItem = typeof bundleItems.$inferSelect;

export const discountTypeEnum = pgEnum("discount_type", ["PERCENT", "FIXED"]);

export const coupons = pgTable("coupons", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  code: text("code").notNull(),
  discountType: discountTypeEnum("discount_type").notNull().default("PERCENT"),
  discountValue: integer("discount_value").notNull().default(0),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("coupons_store_code_unique").on(t.storeId, t.code),
  index("coupons_store_deleted_idx").on(t.storeId, t.deletedAt),
]);

export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, currentUses: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

export const customers = pgTable("customers", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const customerSessions = pgTable("customer_sessions", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("customer_sessions_customer_idx").on(t.customerId),
  index("customer_sessions_expires_idx").on(t.expiresAt),
]);

export const insertCustomerSessionSchema = createInsertSchema(customerSessions).omit({ id: true, createdAt: true });
export type InsertCustomerSession = z.infer<typeof insertCustomerSessionSchema>;
export type CustomerSession = typeof customerSessions.$inferSelect;

export const categories = pgTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("categories_owner_slug_unique").on(table.ownerId, table.slug),
  index("categories_owner_idx").on(table.ownerId),
]);

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const strategyStatusEnum = pgEnum("strategy_status", ["not_started", "in_progress", "completed"]);
export const strategyDifficultyEnum = pgEnum("strategy_difficulty", ["easy", "medium", "hard"]);
export const strategyImpactEnum = pgEnum("strategy_impact", ["low", "medium", "high"]);

export const marketingStrategies = pgTable("marketing_strategies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  steps: text("steps").array().notNull(),
  content: text("content"),
  difficulty: strategyDifficultyEnum("difficulty").notNull().default("medium"),
  impact: strategyImpactEnum("impact").notNull().default("medium"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertMarketingStrategySchema = createInsertSchema(marketingStrategies);
export type InsertMarketingStrategy = z.infer<typeof insertMarketingStrategySchema>;
export type MarketingStrategy = typeof marketingStrategies.$inferSelect;

export const storeStrategyProgress = pgTable("store_strategy_progress", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  strategyId: varchar("strategy_id", { length: 64 }).notNull(),
  status: strategyStatusEnum("status").notNull().default("not_started"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("store_strategy_progress_unique").on(t.storeId, t.strategyId),
]);

export const insertStoreStrategyProgressSchema = createInsertSchema(storeStrategyProgress).omit({ id: true, updatedAt: true });
export type InsertStoreStrategyProgress = z.infer<typeof insertStoreStrategyProgressSchema>;
export type StoreStrategyProgress = typeof storeStrategyProgress.$inferSelect;

export const blockTypeEnum = pgEnum("block_type", ["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]);

export const knowledgeBases = pgTable("knowledge_bases", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  title: text("title").notNull().default("Untitled"),
  slug: text("slug"),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  priceCents: integer("price_cents").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  fontFamily: text("font_family"),
  productId: varchar("product_id", { length: 64 }),
  authorName: text("author_name"),
  authorImageUrl: text("author_image_url"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("kb_owner_deleted_idx").on(t.ownerId, t.deletedAt),
  index("kb_product_idx").on(t.productId),
]);

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBases).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;

export const kbPages = pgTable("kb_pages", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  knowledgeBaseId: varchar("knowledge_base_id", { length: 64 }).notNull(),
  parentPageId: varchar("parent_page_id", { length: 64 }),
  title: text("title").notNull().default("Untitled Page"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("kb_pages_kb_idx").on(t.knowledgeBaseId),
  index("kb_pages_parent_idx").on(t.parentPageId),
]);

export const insertKbPageSchema = createInsertSchema(kbPages).omit({ id: true, createdAt: true });
export type InsertKbPage = z.infer<typeof insertKbPageSchema>;
export type KbPage = typeof kbPages.$inferSelect;

export const kbBlocks = pgTable("kb_blocks", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id", { length: 64 }).notNull(),
  type: blockTypeEnum("type").notNull().default("text"),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [
  index("kb_blocks_page_idx").on(t.pageId),
]);

export const insertKbBlockSchema = createInsertSchema(kbBlocks).omit({ id: true });
export type InsertKbBlock = z.infer<typeof insertKbBlockSchema>;
export type KbBlock = typeof kbBlocks.$inferSelect;

export const kbPageAttachments = pgTable("kb_page_attachments", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id", { length: 64 }).notNull(),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("kb_attachments_page_idx").on(t.pageId),
]);

export const insertKbPageAttachmentSchema = createInsertSchema(kbPageAttachments).omit({ id: true, createdAt: true });
export type InsertKbPageAttachment = z.infer<typeof insertKbPageAttachmentSchema>;
export type KbPageAttachment = typeof kbPageAttachments.$inferSelect;

export const storeEventTypeEnum = pgEnum("store_event_type", ["page_view", "product_view", "bundle_view", "checkout_start", "add_to_cart"]);

export const storeEvents = pgTable("store_events", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  eventType: storeEventTypeEnum("event_type").notNull(),
  productId: varchar("product_id", { length: 64 }),
  bundleId: varchar("bundle_id", { length: 64 }),
  path: text("path"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("store_events_store_created_idx").on(t.storeId, t.createdAt),
  index("store_events_store_type_created_idx").on(t.storeId, t.eventType, t.createdAt),
]);

export const insertStoreEventSchema = createInsertSchema(storeEvents).omit({ id: true, createdAt: true });
export type InsertStoreEvent = z.infer<typeof insertStoreEventSchema>;
export type StoreEvent = typeof storeEvents.$inferSelect;

export const emailStatusEnum = pgEnum("email_status", ["sent", "failed"]);

export const emailLogs = pgTable("email_logs", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  status: emailStatusEnum("status").notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (t) => [
  index("email_logs_to_idx").on(t.toEmail),
  index("email_logs_sent_idx").on(t.sentAt),
  index("email_logs_status_idx").on(t.status),
]);

export type EmailLog = typeof emailLogs.$inferSelect;

// ── Email suppression list (bounces, complaints, manual unsubscribes) ──

export const emailSuppressionReasonEnum = pgEnum("email_suppression_reason", ["bounce", "complaint", "unsubscribe", "manual"]);

export const emailSuppression = pgTable("email_suppression", {
  email: varchar("email", { length: 255 }).primaryKey(),
  reason: emailSuppressionReasonEnum("reason").notNull(),
  detail: text("detail"),
  suppressedAt: timestamp("suppressed_at").defaultNow().notNull(),
});

export const insertEmailSuppressionSchema = createInsertSchema(emailSuppression).omit({ suppressedAt: true });
export type InsertEmailSuppression = z.infer<typeof insertEmailSuppressionSchema>;
export type EmailSuppression = typeof emailSuppression.$inferSelect;

// ── Webhook event dedup (replaces in-memory Set) ──

export const webhookProviderEnum = pgEnum("webhook_provider", ["stripe", "paypal", "sendgrid"]);

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  provider: webhookProviderEnum("provider").notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventType: text("event_type"),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("webhook_events_provider_event_unique").on(t.provider, t.eventId),
  index("webhook_events_processed_idx").on(t.processedAt),
]);

export type WebhookEvent = typeof webhookEvents.$inferSelect;

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  title: text("title").notNull().default("Untitled"),
  slug: text("slug").notNull(),
  excerpt: text("excerpt"),
  coverImageUrl: text("cover_image_url"),
  fontFamily: text("font_family"),
  category: text("category").notNull().default("General"),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(1),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  authorName: text("author_name"),
  authorImageUrl: text("author_image_url"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("blog_posts_store_deleted_idx").on(t.storeId, t.deletedAt),
  uniqueIndex("blog_posts_store_slug_unique").on(t.storeId, t.slug),
]);

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const blogBlocks = pgTable("blog_blocks", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id", { length: 64 }).notNull(),
  type: blockTypeEnum("type").notNull().default("text"),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [
  index("blog_blocks_post_idx").on(t.postId),
]);

export const insertBlogBlockSchema = createInsertSchema(blogBlocks).omit({ id: true });
export type InsertBlogBlock = z.infer<typeof insertBlogBlockSchema>;
export type BlogBlock = typeof blogBlocks.$inferSelect;

// ── Storefront Sections ──────────────────────────────────────────

export const storeTestimonials = pgTable("store_testimonials", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  name: text("name").notNull(),
  role: text("role"),
  quote: text("quote").notNull(),
  avatarUrl: text("avatar_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("store_testimonials_store_idx").on(t.storeId),
]);

export const insertStoreTestimonialSchema = createInsertSchema(storeTestimonials).omit({ id: true, createdAt: true });
export type InsertStoreTestimonial = z.infer<typeof insertStoreTestimonialSchema>;
export type StoreTestimonial = typeof storeTestimonials.$inferSelect;

export const storeFaqs = pgTable("store_faqs", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("store_faqs_store_idx").on(t.storeId),
]);

export const insertStoreFaqSchema = createInsertSchema(storeFaqs).omit({ id: true, createdAt: true });
export type InsertStoreFaq = z.infer<typeof insertStoreFaqSchema>;
export type StoreFaq = typeof storeFaqs.$inferSelect;

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  storeEmailUnique: uniqueIndex("newsletter_subscribers_store_email_idx").on(t.storeId, t.email),
}));

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, createdAt: true });
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export const storeReviews = pgTable("store_reviews", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("store_reviews_customer_product_idx").on(t.customerId, t.productId),
  index("store_reviews_store_created_idx").on(t.storeId, t.createdAt),
  index("store_reviews_product_idx").on(t.productId),
]);

export const insertStoreReviewSchema = createInsertSchema(storeReviews).omit({ id: true, createdAt: true });
export type InsertStoreReview = z.infer<typeof insertStoreReviewSchema>;
export type StoreReview = typeof storeReviews.$inferSelect;

// ── Newsletter Campaigns ───────────────────────────────────────────

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  subject: text("subject").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("newsletter_campaigns_store_idx").on(t.storeId),
]);

export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;

export const newsletterCampaignBlocks = pgTable("newsletter_campaign_blocks", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id", { length: 64 }).notNull(),
  type: blockTypeEnum("type").notNull().default("text"),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [
  index("newsletter_campaign_blocks_campaign_idx").on(t.campaignId),
]);

export const insertNewsletterCampaignBlockSchema = createInsertSchema(newsletterCampaignBlocks).omit({ id: true });
export type InsertNewsletterCampaignBlock = z.infer<typeof insertNewsletterCampaignBlockSchema>;
export type NewsletterCampaignBlock = typeof newsletterCampaignBlocks.$inferSelect;

// ── Gumroad Importer ───────────────────────────────────────────────

export const gumroadImportStatusEnum = pgEnum("gumroad_import_status", [
  "pending",
  "importing",
  "awaiting_files",
  "completed",
  "failed",
]);

export const gumroadImports = pgTable("gumroad_imports", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  status: gumroadImportStatusEnum("status").notNull().default("pending"),
  gumroadEmail: text("gumroad_email"),
  gumroadUserId: text("gumroad_user_id"),
  accessTokenEncrypted: text("access_token_encrypted").notNull().default(""),
  productsTotal: integer("products_total").notNull().default(0),
  productsImported: integer("products_imported").notNull().default(0),
  customersTotal: integer("customers_total").notNull().default(0),
  customersImported: integer("customers_imported").notNull().default(0),
  salesTotal: integer("sales_total").notNull().default(0),
  salesImported: integer("sales_imported").notNull().default(0),
  errorMessage: text("error_message"),
  welcomeEmailsSentAt: timestamp("welcome_emails_sent_at"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertGumroadImportSchema = createInsertSchema(gumroadImports).omit({ id: true, startedAt: true });
export type InsertGumroadImport = z.infer<typeof insertGumroadImportSchema>;
export type GumroadImport = typeof gumroadImports.$inferSelect;

export const gumroadProductShells = pgTable("gumroad_product_shells", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  importId: varchar("import_id", { length: 64 }).notNull().references(() => gumroadImports.id, { onDelete: "cascade" }),
  sellisyProductId: varchar("sellisy_product_id", { length: 64 }).notNull().unique().references(() => products.id, { onDelete: "cascade" }),
  gumroadProductId: text("gumroad_product_id").notNull(),
  gumroadShortUrl: text("gumroad_short_url"),
  fileStatus: text("file_status").notNull().default("missing"),
  fileMatchHint: text("file_match_hint"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGumroadProductShellSchema = createInsertSchema(gumroadProductShells).omit({ id: true, createdAt: true });
export type InsertGumroadProductShell = z.infer<typeof insertGumroadProductShellSchema>;
export type GumroadProductShell = typeof gumroadProductShells.$inferSelect;

// ─── Affiliate program ────────────────────────────────────────────────

export const affiliates = pgTable("affiliates", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 64 }).notNull(),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  code: text("code").notNull(),
  status: affiliateStatusEnum("status").notNull().default("active"),
  commissionRateBps: integer("commission_rate_bps").notNull().default(2000),
  payoutEmail: text("payout_email"),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("affiliates_store_code_unique").on(t.storeId, t.code).where(sql`${t.deletedAt} IS NULL`),
  uniqueIndex("affiliates_store_user_unique").on(t.storeId, t.userId).where(sql`${t.deletedAt} IS NULL`),
  index("affiliates_store_deleted_idx").on(t.storeId, t.deletedAt),
  index("affiliates_user_idx").on(t.userId),
]);

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id", { length: 64 }).notNull(),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  landingPath: text("landing_path"),
  referrer: text("referrer"),
  userAgentHash: varchar("user_agent_hash", { length: 64 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("affiliate_clicks_affiliate_idx").on(t.affiliateId, t.createdAt),
  index("affiliate_clicks_store_idx").on(t.storeId, t.createdAt),
]);

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({ id: true, createdAt: true });
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id", { length: 64 }).notNull(),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull().unique(),
  subtotalCents: integer("subtotal_cents").notNull(),
  commissionRateBps: integer("commission_rate_bps").notNull(),
  commissionCents: integer("commission_cents").notNull(),
  status: commissionStatusEnum("status").notNull().default("pending"),
  payoutId: varchar("payout_id", { length: 64 }),
  lockedUntil: timestamp("locked_until").notNull(),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("affiliate_commissions_affiliate_status_idx").on(t.affiliateId, t.status),
  index("affiliate_commissions_store_status_idx").on(t.storeId, t.status),
]);

export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAffiliateCommission = z.infer<typeof insertAffiliateCommissionSchema>;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;

export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id", { length: 64 }).notNull(),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  totalCents: integer("total_cents").notNull(),
  method: text("method").notNull().default("manual_paypal"),
  externalRef: text("external_ref"),
  status: payoutStatusEnum("status").notNull().default("processing"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("affiliate_payouts_affiliate_idx").on(t.affiliateId, t.createdAt),
  index("affiliate_payouts_store_status_idx").on(t.storeId, t.status),
]);

export const insertAffiliatePayoutSchema = createInsertSchema(affiliatePayouts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAffiliatePayout = z.infer<typeof insertAffiliatePayoutSchema>;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;

// ─── Courses: lessons + progress ──────────────────────────────────────
// When a product has product_type='course', it can have multiple lessons.
// Lessons are owned by the product (cascade-cleaned via app code, not FK).

export const courseLessons = pgTable("course_lessons", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  attachmentUrl: text("attachment_url"),
  durationSeconds: integer("duration_seconds"),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("course_lessons_product_idx").on(t.productId, t.deletedAt),
  index("course_lessons_sort_idx").on(t.productId, t.sortOrder),
]);

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type CourseLesson = typeof courseLessons.$inferSelect;

// Progress is keyed by (lessonId, orderId) — the order is the unit of access
// (we use the existing download_tokens flow to grant the customer access).
// One row per lesson-the-buyer-completed; absence means not yet completed.
export const courseLessonProgress = pgTable("course_lesson_progress", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("course_lesson_progress_unique").on(t.lessonId, t.orderId),
  index("course_lesson_progress_order_idx").on(t.orderId),
]);

export const insertCourseLessonProgressSchema = createInsertSchema(courseLessonProgress).omit({ id: true, completedAt: true });
export type InsertCourseLessonProgress = z.infer<typeof insertCourseLessonProgressSchema>;
export type CourseLessonProgress = typeof courseLessonProgress.$inferSelect;
