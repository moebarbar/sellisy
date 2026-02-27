import { db } from "./db";
import { products, stores, storeProducts, orders, bundles, coupons, knowledgeBases, blogPosts } from "@shared/schema";
import { eq, isNull, isNotNull, sql, and, notInArray } from "drizzle-orm";

export interface IntegrityIssue {
  type: string;
  severity: "warning" | "error";
  description: string;
  count: number;
  details?: any[];
}

export interface IntegrityReport {
  timestamp: string;
  healthy: boolean;
  issues: IntegrityIssue[];
  stats: {
    totalProducts: number;
    totalStores: number;
    deletedProducts: number;
    deletedStores: number;
    totalOrders: number;
    deletedOrders: number;
    totalBundles: number;
    deletedBundles: number;
    totalCoupons: number;
    deletedCoupons: number;
    totalKnowledgeBases: number;
    deletedKnowledgeBases: number;
    totalBlogPosts: number;
    deletedBlogPosts: number;
    orphanedStoreProducts: number;
    nullOwnerProducts: number;
  };
}

export interface RepairResult {
  timestamp: string;
  repairs: { type: string; description: string; count: number }[];
  totalFixed: number;
}

const SEED_PRODUCT_TITLES = [
  "Premium UI Kit",
  "React Component Library",
  "Social Media Marketing Kit",
  "The SaaS Growth Playbook",
  "Notion Productivity System",
  "Cinematic Photo Presets",
];

export async function runHealthCheck(): Promise<IntegrityReport> {
  const issues: IntegrityIssue[] = [];

  const [{ count: totalProducts }] = await db.select({ count: sql<number>`count(*)` }).from(products).where(isNull(products.deletedAt));
  const [{ count: totalStores }] = await db.select({ count: sql<number>`count(*)` }).from(stores).where(isNull(stores.deletedAt));
  const [{ count: deletedProducts }] = await db.select({ count: sql<number>`count(*)` }).from(products).where(isNotNull(products.deletedAt));
  const [{ count: deletedStores }] = await db.select({ count: sql<number>`count(*)` }).from(stores).where(isNotNull(stores.deletedAt));

  const [{ count: totalOrders }] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(isNull(orders.deletedAt));
  const [{ count: deletedOrders }] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(isNotNull(orders.deletedAt));
  const [{ count: totalBundles }] = await db.select({ count: sql<number>`count(*)` }).from(bundles).where(isNull(bundles.deletedAt));
  const [{ count: deletedBundles }] = await db.select({ count: sql<number>`count(*)` }).from(bundles).where(isNotNull(bundles.deletedAt));
  const [{ count: totalCoupons }] = await db.select({ count: sql<number>`count(*)` }).from(coupons).where(isNull(coupons.deletedAt));
  const [{ count: deletedCoupons }] = await db.select({ count: sql<number>`count(*)` }).from(coupons).where(isNotNull(coupons.deletedAt));
  const [{ count: totalKnowledgeBases }] = await db.select({ count: sql<number>`count(*)` }).from(knowledgeBases).where(isNull(knowledgeBases.deletedAt));
  const [{ count: deletedKnowledgeBases }] = await db.select({ count: sql<number>`count(*)` }).from(knowledgeBases).where(isNotNull(knowledgeBases.deletedAt));
  const [{ count: totalBlogPosts }] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(isNull(blogPosts.deletedAt));
  const [{ count: deletedBlogPosts }] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(isNotNull(blogPosts.deletedAt));

  const allStoreProducts = await db.select({
    id: storeProducts.id,
    storeId: storeProducts.storeId,
    productId: storeProducts.productId,
  }).from(storeProducts);

  const activeStoreIds = new Set(
    (await db.select({ id: stores.id }).from(stores).where(isNull(stores.deletedAt))).map(s => s.id)
  );
  const activeProductIds = new Set(
    (await db.select({ id: products.id }).from(products).where(isNull(products.deletedAt))).map(p => p.id)
  );

  const orphanedSP = allStoreProducts.filter(
    sp => !activeStoreIds.has(sp.storeId) || !activeProductIds.has(sp.productId)
  );
  if (orphanedSP.length > 0) {
    issues.push({
      type: "orphaned_store_products",
      severity: "error",
      description: "Store-product links referencing deleted or non-existent stores/products",
      count: orphanedSP.length,
      details: orphanedSP.slice(0, 10),
    });
  }

  const nullOwnerProducts = await db.select({ id: products.id, title: products.title }).from(products)
    .where(and(isNull(products.ownerId), isNull(products.deletedAt), eq(products.source, "USER")));
  if (nullOwnerProducts.length > 0) {
    issues.push({
      type: "null_owner_user_products",
      severity: "error",
      description: "USER-source products with no owner (orphaned ownership)",
      count: nullOwnerProducts.length,
      details: nullOwnerProducts.slice(0, 10),
    });
  }

  const nullOwnerPlatform = await db.select({ id: products.id, title: products.title }).from(products)
    .where(and(isNull(products.ownerId), isNull(products.deletedAt), eq(products.source, "PLATFORM")));
  const nonSeedNullOwner = nullOwnerPlatform.filter(p => !SEED_PRODUCT_TITLES.includes(p.title));
  if (nonSeedNullOwner.length > 0) {
    issues.push({
      type: "null_owner_platform_products",
      severity: "warning",
      description: "PLATFORM products with no owner (not original seed products)",
      count: nonSeedNullOwner.length,
      details: nonSeedNullOwner.slice(0, 10),
    });
  }

  return {
    timestamp: new Date().toISOString(),
    healthy: issues.length === 0,
    issues,
    stats: {
      totalProducts: Number(totalProducts),
      totalStores: Number(totalStores),
      deletedProducts: Number(deletedProducts),
      deletedStores: Number(deletedStores),
      totalOrders: Number(totalOrders),
      deletedOrders: Number(deletedOrders),
      totalBundles: Number(totalBundles),
      deletedBundles: Number(deletedBundles),
      totalCoupons: Number(totalCoupons),
      deletedCoupons: Number(deletedCoupons),
      totalKnowledgeBases: Number(totalKnowledgeBases),
      deletedKnowledgeBases: Number(deletedKnowledgeBases),
      totalBlogPosts: Number(totalBlogPosts),
      deletedBlogPosts: Number(deletedBlogPosts),
      orphanedStoreProducts: orphanedSP.length,
      nullOwnerProducts: nullOwnerProducts.length + nonSeedNullOwner.length,
    },
  };
}

export async function runRepair(): Promise<RepairResult> {
  const repairs: RepairResult["repairs"] = [];

  const activeStoreIds = new Set(
    (await db.select({ id: stores.id }).from(stores).where(isNull(stores.deletedAt))).map(s => s.id)
  );
  const activeProductIds = new Set(
    (await db.select({ id: products.id }).from(products).where(isNull(products.deletedAt))).map(p => p.id)
  );

  const allSP = await db.select({ id: storeProducts.id, storeId: storeProducts.storeId, productId: storeProducts.productId }).from(storeProducts);
  const orphanedIds = allSP
    .filter(sp => !activeStoreIds.has(sp.storeId) || !activeProductIds.has(sp.productId))
    .map(sp => sp.id);

  if (orphanedIds.length > 0) {
    for (const id of orphanedIds) {
      await db.delete(storeProducts).where(eq(storeProducts.id, id));
    }
    repairs.push({
      type: "orphaned_store_products",
      description: `Removed ${orphanedIds.length} orphaned store-product link(s)`,
      count: orphanedIds.length,
    });
  }

  const totalFixed = repairs.reduce((sum, r) => sum + r.count, 0);
  return { timestamp: new Date().toISOString(), repairs, totalFixed };
}

export async function runStartupCheck(): Promise<void> {
  console.log("[integrity] Running startup data integrity check...");
  const report = await runHealthCheck();

  console.log(`[integrity] Stats: ${report.stats.totalProducts} products, ${report.stats.totalStores} stores, ${report.stats.deletedProducts} soft-deleted products, ${report.stats.deletedStores} soft-deleted stores`);

  if (report.healthy) {
    console.log("[integrity] All data integrity checks passed.");
    return;
  }

  for (const issue of report.issues) {
    const prefix = issue.severity === "error" ? "ERROR" : "WARN";
    console.log(`[integrity] ${prefix}: ${issue.description} (${issue.count} found)`);
  }

  if (report.stats.orphanedStoreProducts > 0) {
    console.log("[integrity] Auto-repairing orphaned store-product links...");
    const result = await runRepair();
    console.log(`[integrity] Repair complete: ${result.totalFixed} issue(s) fixed.`);
  }
}
