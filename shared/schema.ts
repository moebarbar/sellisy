import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const productSourceEnum = pgEnum("product_source", ["PLATFORM", "USER"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["month", "year"]);
export const aiLaunchStatusEnum = pgEnum("ai_launch_status", ["pending", "analyzing", "selecting", "assembling", "completed", "failed"]);
export const memberSubscriptionStatusEnum = pgEnum("member_subscription_status", ["active", "past_due", "canceled", "incomplete"]);
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ createdAt: true, updatedAt: true });
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
  // Growth Engine automation toggles (migration 0024). All default ON —
  // these recover/derive revenue for the seller and every email honors
  // the suppression list; sellers can opt out per store in Settings.
  cartRecoveryEnabled: boolean("cart_recovery_enabled").notNull().default(true),
  postPurchaseEmailEnabled: boolean("post_purchase_email_enabled").notNull().default(true),
  newsletterWelcomeEnabled: boolean("newsletter_welcome_enabled").notNull().default(true),
  // Store-level marketplace opt-out (migration 0027). When false, none of
  // the store's products appear on /discover regardless of per-product
  // promote flags.
  marketplaceEnabled: boolean("marketplace_enabled").notNull().default(true),
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

// `store_domains` was a Namecheap-registrar exploration that never shipped.
// The active custom-domain path is `stores.customDomain` + Cloudflare for SaaS
// (server/cloudflareClient.ts). The table is dropped in migration
// 0019_drop_store_domains.sql once the operator confirms no production rows.

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
  // Course-only: when true, buyers who complete 100% of the lessons get a
  // downloadable PDF certificate of completion. No effect on non-course products.
  certificatesEnabled: boolean("certificates_enabled").notNull().default(false),
  // Cert designer fields. certAccentColor is a 7-char hex string (e.g. "#1e40af")
  // applied to the heading + accent border on the cert PDF. certLogoUrl is an
  // owner-uploaded image rendered top-center on the cert. Both nullable; defaults
  // produce the standard black-and-white certificate.
  certAccentColor: varchar("cert_accent_color", { length: 7 }),
  certLogoUrl: varchar("cert_logo_url", { length: 500 }),
  // Per-product opt-out for reviews. The store-level reviewsEnabled flag
  // gates the whole feature; this lets an owner disable reviews on a
  // single touchy product even if their store has reviews on overall.
  // Default true so existing products inherit the store toggle behavior.
  reviewsEnabled: boolean("reviews_enabled").notNull().default(true),
  // Pay-what-you-want pricing. When enabled, the product detail page
  // renders a price input instead of a fixed-price pill. priceCents stays
  // as the *suggested* price; buyers can pay anything ≥ pwywMinCents
  // (which can be 0 for true tip-jar PWYW).
  pwywEnabled: boolean("pwyw_enabled").notNull().default(false),
  pwywMinCents: integer("pwyw_min_cents").notNull().default(0),
  // Discord auto-role grant (scaffold). Set both to the seller's guild ID
  // and a role ID inside that guild. On purchase, a worker grants the
  // buyer the role (once the buyer has linked their Discord). See
  // docs/discord-integration.md for the full setup flow.
  discordGuildId: varchar("discord_guild_id", { length: 64 }),
  discordRoleId: varchar("discord_role_id", { length: 64 }),
  // Subscription pricing (migration 0025). Non-null billingInterval makes
  // this a recurring product: checkout runs in Stripe subscription mode on
  // the seller's own keys and access is gated on the subscription staying
  // active (see shared/subscription-access.ts + server/routes/orders.ts).
  // Stripe-only — stores without Stripe configured can't sell these.
  // Mutually exclusive with pwywEnabled.
  billingInterval: billingIntervalEnum("billing_interval"),
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
  // Per-listing marketplace promote flag (migration 0027). Marketplace
  // policy: only USER-created products are eligible (PLATFORM/PLR library
  // products sell on the storefront only) — enforced in the discover
  // queries and the PATCH endpoint, with an admin exception so the
  // platform owner can seed the marketplace.
  showInMarketplace: boolean("show_in_marketplace").notNull().default(true),
  upsellProductId: varchar("upsell_product_id", { length: 64 }),
  upsellBundleId: varchar("upsell_bundle_id", { length: 64 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("store_products_store_idx").on(t.storeId),
  index("store_products_product_idx").on(t.productId),
  uniqueIndex("store_products_store_product_unique").on(t.storeId, t.productId),
]);

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({ id: true, updatedAt: true });
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
  // Abandoned-checkout recovery (migration 0024): set when the recovery
  // email goes out so a re-delivered session.expired webhook can't
  // double-send. Stays null for completed/never-expired checkouts.
  recoveryEmailSentAt: timestamp("recovery_email_sent_at"),
  refundedAt: timestamp("refunded_at"),
  refundedAmountCents: integer("refunded_amount_cents").notNull().default(0),
  refundReason: text("refund_reason"),
  stripeRefundId: text("stripe_refund_id"),
  paypalRefundId: text("paypal_refund_id"),
  affiliateId: varchar("affiliate_id", { length: 64 }),
  affiliateRateBps: integer("affiliate_rate_bps"),
  // Per-buyer opt-in for course discussion notifications (instructor replies
  // on lessons they've commented on). Default true; flipped to false via the
  // one-click unsubscribe link in the email or the toggle in the course portal.
  commentNotificationsEnabled: boolean("comment_notifications_enabled").notNull().default(true),
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

// Buyer subscriptions to recurring products (migration 0025). One row per
// Stripe subscription on the SELLER's Stripe account. Because sellers don't
// configure webhooks, lifecycle state is maintained by (a) lazy
// re-verification at content-access time when lastVerifiedAt is stale and
// (b) a daily sweep job — both fetch the subscription from Stripe with the
// store's own key. `orderId` points at the initial checkout's order row.
export const memberSubscriptions = pgTable("member_subscriptions", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }),
  buyerEmail: text("buyer_email").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: memberSubscriptionStatusEnum("status").notNull().default("active"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  currentPeriodEnd: timestamp("current_period_end"),
  lastVerifiedAt: timestamp("last_verified_at").defaultNow().notNull(),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("member_subscriptions_store_status_idx").on(t.storeId, t.status),
  index("member_subscriptions_customer_idx").on(t.customerId),
  index("member_subscriptions_order_idx").on(t.orderId),
  index("member_subscriptions_period_end_idx").on(t.currentPeriodEnd),
]);

export const insertMemberSubscriptionSchema = createInsertSchema(memberSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMemberSubscription = z.infer<typeof insertMemberSubscriptionSchema>;
export type MemberSubscription = typeof memberSubscriptions.$inferSelect;

// AI Store Launcher runs (migration 0026). One row per launch attempt —
// DB-backed (not just BullMQ state) so progress survives Redis flushes and
// the client can poll a stable id. The pipeline only sets storeId after
// FULL assembly succeeds; a failed run never references a partial store.
export const aiLaunches = pgTable("ai_launches", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 64 }).notNull(),
  prompt: text("prompt").notNull(),
  status: aiLaunchStatusEnum("status").notNull().default("pending"),
  storeId: varchar("store_id", { length: 64 }),
  storeSlug: text("store_slug"),
  productCount: integer("product_count"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("ai_launches_user_created_idx").on(t.userId, t.createdAt),
]);

export const insertAiLaunchSchema = createInsertSchema(aiLaunches).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAiLaunch = z.infer<typeof insertAiLaunchSchema>;
export type AiLaunch = typeof aiLaunches.$inferSelect;

// Sellisy Brain weekly reports (migration 0028). One row per store per
// generation: the metrics snapshot the AI saw, its summary, and the
// validated action list ({title, body, linkPath, priority}[] — linkPath is
// allowlist-validated server-side before storage). Generated by the weekly
// sweep or on demand; emailedAt marks sweep reports that were delivered.
export const brainReports = pgTable("brain_reports", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  summary: text("summary").notNull(),
  actionsJson: text("actions_json").notNull().default("[]"),
  metricsJson: text("metrics_json").notNull().default("{}"),
  emailedAt: timestamp("emailed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("brain_reports_store_created_idx").on(t.storeId, t.createdAt),
]);

export const insertBrainReportSchema = createInsertSchema(brainReports).omit({ id: true, createdAt: true });
export type InsertBrainReport = z.infer<typeof insertBrainReportSchema>;
export type BrainReport = typeof brainReports.$inferSelect;

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
  // Discord auto-role: populated once the buyer links their Discord account
  // via OAuth on the storefront customer portal. Used by the grant worker
  // to issue per-product roles after purchase.
  discordUserId: varchar("discord_user_id", { length: 64 }),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("categories_owner_slug_unique").on(table.ownerId, table.slug),
  index("categories_owner_idx").on(table.ownerId),
]);

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("kb_pages_kb_idx").on(t.knowledgeBaseId),
  index("kb_pages_parent_idx").on(t.parentPageId),
]);

export const insertKbPageSchema = createInsertSchema(kbPages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKbPage = z.infer<typeof insertKbPageSchema>;
export type KbPage = typeof kbPages.$inferSelect;

export const kbBlocks = pgTable("kb_blocks", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id", { length: 64 }).notNull(),
  type: blockTypeEnum("type").notNull().default("text"),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("kb_blocks_page_idx").on(t.pageId),
]);

export const insertKbBlockSchema = createInsertSchema(kbBlocks).omit({ id: true, updatedAt: true });
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("kb_attachments_page_idx").on(t.pageId),
]);

export const insertKbPageAttachmentSchema = createInsertSchema(kbPageAttachments).omit({ id: true, createdAt: true, updatedAt: true });
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("blog_blocks_post_idx").on(t.postId),
]);

export const insertBlogBlockSchema = createInsertSchema(blogBlocks).omit({ id: true, updatedAt: true });
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("store_testimonials_store_idx").on(t.storeId),
]);

export const insertStoreTestimonialSchema = createInsertSchema(storeTestimonials).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStoreTestimonial = z.infer<typeof insertStoreTestimonialSchema>;
export type StoreTestimonial = typeof storeTestimonials.$inferSelect;

export const storeFaqs = pgTable("store_faqs", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("store_faqs_store_idx").on(t.storeId),
]);

export const insertStoreFaqSchema = createInsertSchema(storeFaqs).omit({ id: true, createdAt: true, updatedAt: true });
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("newsletter_campaign_blocks_campaign_idx").on(t.campaignId),
]);

export const insertNewsletterCampaignBlockSchema = createInsertSchema(newsletterCampaignBlocks).omit({ id: true, updatedAt: true });
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

// ─── Courses: modules + lessons + progress ────────────────────────────
// When a product has product_type='course', it can have multiple modules
// (groupings) which each contain multiple lessons. moduleId is optional on
// lessons: lessons without a module appear at the top of the course outline.

export const courseModules = pgTable("course_modules", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  // Drip: unlock this module N days after the buyer's order createdAt.
  // NULL = no drip (available immediately). Module-level drip wins over
  // lesson-level if both are set (lesson can drip later within an unlocked module).
  unlockAfterDays: integer("unlock_after_days"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("course_modules_product_idx").on(t.productId, t.deletedAt),
  index("course_modules_sort_idx").on(t.productId, t.sortOrder),
]);

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseModule = typeof courseModules.$inferSelect;

export const courseLessons = pgTable("course_lessons", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  moduleId: varchar("module_id", { length: 64 }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  attachmentUrl: text("attachment_url"),
  durationSeconds: integer("duration_seconds"),
  sortOrder: integer("sort_order").notNull().default(0),
  // Drip: unlock this lesson N days after the buyer's order createdAt.
  // NULL = no drip. If the lesson belongs to a module that also has a drip,
  // the later of the two is used (so a drip-3-day module containing a
  // drip-5-day lesson stays locked until day 5).
  unlockAfterDays: integer("unlock_after_days"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("course_lessons_product_idx").on(t.productId, t.deletedAt),
  index("course_lessons_sort_idx").on(t.productId, t.sortOrder),
  index("course_lessons_module_idx").on(t.moduleId, t.sortOrder),
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

// ─── Quizzes ──────────────────────────────────────────────────────────
// A lesson can have N questions. Each question has M choices.
// - "single" (V1 default): exactly one choice is correct; buyer picks one.
// - "multi" (V2): one or more choices are correct; buyer must pick the
//   exact set (no missing correct, no extra incorrect) for the question to score.
// When a lesson has any questions, the lesson is considered "quiz-gated":
// the buyer must score >= QUIZ_PASS_THRESHOLD to mark it complete.
// Manual mark-complete is rejected on quiz-gated lessons.

export const quizQuestionTypeEnum = pgEnum("quiz_question_type", ["single", "multi"]);

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id", { length: 64 }).notNull(),
  prompt: text("prompt").notNull(),
  questionType: quizQuestionTypeEnum("question_type").notNull().default("single"),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("quiz_questions_lesson_idx").on(t.lessonId, t.deletedAt, t.sortOrder),
]);

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

export const quizChoices = pgTable("quiz_choices", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id", { length: 64 }).notNull(),
  label: text("label").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("quiz_choices_question_idx").on(t.questionId, t.sortOrder),
]);

export const insertQuizChoiceSchema = createInsertSchema(quizChoices).omit({ id: true, createdAt: true });
export type InsertQuizChoice = z.infer<typeof insertQuizChoiceSchema>;
export type QuizChoice = typeof quizChoices.$inferSelect;

// One row per quiz attempt — buyer can retake to improve. The latest passing
// attempt drives lesson completion. Failed attempts are kept for analytics.
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  correctCount: integer("correct_count").notNull(),
  totalCount: integer("total_count").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("quiz_attempts_lesson_order_idx").on(t.lessonId, t.orderId, t.createdAt),
]);

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, createdAt: true });
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Single source of truth for the pass threshold. 0.7 = 70% correct.
// Lives in shared so server + client agree.
export const QUIZ_PASS_THRESHOLD = 0.7;

// ─── Course certificates ──────────────────────────────────────────────
// When a buyer completes 100% of a course's lessons AND the course has
// certificatesEnabled, we issue a certificate (one per orderId+productId).
// The verification code is shown on the certificate and can be looked up
// at /verify/cert/:code in V2.

export const certificateIssued = pgTable("certificate_issued", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerName: text("buyer_name"),
  verificationCode: varchar("verification_code", { length: 32 }).notNull().unique(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("certificate_issued_unique").on(t.orderId, t.productId),
  index("certificate_issued_store_idx").on(t.storeId, t.issuedAt),
]);

export const insertCertificateIssuedSchema = createInsertSchema(certificateIssued).omit({ id: true, issuedAt: true });
export type InsertCertificateIssued = z.infer<typeof insertCertificateIssuedSchema>;
export type CertificateIssued = typeof certificateIssued.$inferSelect;

// ─── Course lesson comments ───────────────────────────────────────────
// Flat (no threading) per-lesson discussion. Buyers post via their
// download-token context (orderId); owners post via authenticated session.
// authorType distinguishes the two so we can render owner badges + give
// owners moderation powers (pin, delete any comment).

export const commentAuthorTypeEnum = pgEnum("comment_author_type", ["buyer", "owner"]);

export const courseLessonComments = pgTable("course_lesson_comments", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),   // denormalized for cheap "all comments on this course" queries
  storeId: varchar("store_id", { length: 64 }).notNull(),        // denormalized for owner moderation
  // parentId = null → top-level comment. parentId set → reply to that comment.
  // Threading is intentionally limited to one level (replies can't have replies).
  parentId: varchar("parent_id", { length: 64 }),
  // Buyer comments: orderId set, userId null, authorEmail/authorName carry display
  // Owner comments: userId set to the owner's users.id, orderId null
  authorType: commentAuthorTypeEnum("author_type").notNull(),
  userId: varchar("user_id", { length: 64 }),
  orderId: varchar("order_id", { length: 64 }),
  authorName: text("author_name"),
  authorEmail: text("author_email"),
  body: text("body").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("course_lesson_comments_lesson_idx").on(t.lessonId, t.deletedAt, t.createdAt),
  index("course_lesson_comments_order_idx").on(t.orderId, t.createdAt),
  index("course_lesson_comments_parent_idx").on(t.parentId, t.createdAt),
]);

export const insertCourseLessonCommentSchema = createInsertSchema(courseLessonComments).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertCourseLessonComment = z.infer<typeof insertCourseLessonCommentSchema>;
export type CourseLessonComment = typeof courseLessonComments.$inferSelect;
