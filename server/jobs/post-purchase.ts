// Post-purchase cross-sell — runs ~24h after order completion (enqueued
// with a delay by orderEmailHelper.ts, jobId post-purchase-<orderId>).
//
// Recommendation priority:
//   1. the seller-configured upsell of a purchased item (storeProducts.upsellProductId)
//   2. the top co-purchased product across the store's completed orders
// Either way the pick must be published in the store, not part of this
// order, and not already owned by the buyer — otherwise we stay silent.
// Everything re-validates at send time; suppression is enforced by sendEmail.

import type { Job } from 'bullmq';
import { db } from '../db';
import { orderItems, orders } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';
import { storage } from '../storage';
import { sendCrossSellEmail } from '../emails';
import { storePublicUrl } from '../lib/store-url';

export interface PostPurchaseJobData {
  orderId: string;
  baseUrl: string;
}

async function buyerOwnsProduct(customerId: string | null, buyerEmail: string, productId: string): Promise<boolean> {
  const result = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(
      eq(orderItems.productId, productId),
      eq(orders.status, 'COMPLETED'),
      customerId
        ? sql`(${orders.customerId} = ${customerId} OR LOWER(${orders.buyerEmail}) = LOWER(${buyerEmail}))`
        : sql`LOWER(${orders.buyerEmail}) = LOWER(${buyerEmail})`,
    ))
    .limit(1);
  return result.length > 0;
}

export async function processPostPurchase(job: Job<PostPurchaseJobData>) {
  const { orderId, baseUrl } = job.data;

  const order = await storage.getOrderById(orderId);
  if (!order || order.status !== 'COMPLETED') return;
  if (!order.buyerEmail || order.buyerEmail === 'pending@checkout.com') return;

  const store = await storage.getStoreById(order.storeId);
  if (!store || !store.postPurchaseEmailEnabled) return;

  const items = await storage.getOrderItemsByOrder(orderId);
  if (items.length === 0) return;
  const orderedIds = new Set(items.map((i) => i.productId));

  // Candidate pool: configured upsells first, then top co-purchases.
  const candidateIds: string[] = [];
  for (const item of items) {
    const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, item.productId);
    if (sp?.upsellProductId) candidateIds.push(sp.upsellProductId);
  }
  const coPurchased = await db.execute(sql`
    SELECT oi2.product_id AS "productId", COUNT(*)::int AS "orders"
    FROM order_items oi1
    JOIN orders o ON o.id = oi1.order_id
      AND o.status = 'COMPLETED' AND o.store_id = ${order.storeId} AND o.deleted_at IS NULL
    JOIN order_items oi2 ON oi2.order_id = oi1.order_id AND oi2.product_id <> oi1.product_id
    WHERE oi1.product_id IN (${sql.join(items.map((i) => sql`${i.productId}`), sql`, `)})
    GROUP BY oi2.product_id
    ORDER BY COUNT(*) DESC
    LIMIT 5
  `);
  candidateIds.push(...(coPurchased.rows as any[]).map((r) => r.productId));

  for (const candidateId of candidateIds) {
    if (orderedIds.has(candidateId)) continue;
    const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, candidateId);
    if (!sp?.isPublished) continue;
    const product = await storage.getProductById(candidateId);
    if (!product) continue;
    if (await buyerOwnsProduct(order.customerId, order.buyerEmail, candidateId)) continue;

    const productUrl = storePublicUrl(store, baseUrl, `/product/${candidateId}`);

    await sendCrossSellEmail({
      buyerEmail: order.buyerEmail,
      storeName: store.name,
      purchasedTitle: items[0].product.title,
      recommendedTitle: sp.customTitle || product.title,
      recommendedPriceCents: sp.customPriceCents ?? product.priceCents,
      productUrl,
      thumbnailUrl: product.thumbnailUrl,
    });
    console.log(`[post-purchase] cross-sell sent for order ${orderId} → ${candidateId}`);
    return;
  }

  console.log(`[post-purchase] order ${orderId}: no eligible recommendation — staying silent`);
}
