import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const productSourceEnum = pgEnum("product_source", ["PLATFORM", "USER"]);
export const productStatusEnum = pgEnum("product_status", ["DRAFT", "ACTIVE"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "COMPLETED", "FAILED"]);

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id", { length: 64 }),
  source: productSourceEnum("source").notNull().default("USER"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("templates"),
  priceCents: integer("price_cents").notNull().default(0),
  originalPriceCents: integer("original_price_cents"),
  thumbnailUrl: text("thumbnail_url"),
  status: productStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const fileAssets = pgTable("file_assets", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 64 }).notNull(),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
});

export const insertFileAssetSchema = createInsertSchema(fileAssets).omit({ id: true });
export type InsertFileAsset = z.infer<typeof insertFileAssetSchema>;
export type FileAsset = typeof fileAssets.$inferSelect;

export const storeProducts = pgTable("store_products", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({ id: true });
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;
export type StoreProduct = typeof storeProducts.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id", { length: 64 }).notNull(),
  buyerEmail: text("buyer_email").notNull(),
  totalCents: integer("total_cents").notNull().default(0),
  stripeSessionId: text("stripe_session_id"),
  couponId: varchar("coupon_id", { length: 64 }),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  priceCents: integer("price_cents").notNull().default(0),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const downloadTokens = pgTable("download_tokens", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBundleSchema = createInsertSchema(bundles).omit({ id: true, createdAt: true });
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundles.$inferSelect;

export const bundleItems = pgTable("bundle_items", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
});

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, currentUses: true, createdAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
