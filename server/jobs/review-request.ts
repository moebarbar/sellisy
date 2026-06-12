// Post-purchase review request — runs N days after order completion
// (enqueued with a delay by orderEmailHelper.ts).
//
// Re-validates everything at send time rather than enqueue time, because
// days pass between the two: the store may have disabled reviews, the
// buyer may have already reviewed, the order may have been refunded, or
// the email may have landed on the suppression list (sendEmail checks
// suppression itself).

import type { Job } from 'bullmq';
import { db } from '../db';
import { storeReviews } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { storage } from '../storage';
import { sendReviewRequestEmail } from '../emails';
import { storePublicUrl } from '../lib/store-url';

export interface ReviewRequestJobData {
  orderId: string;
  baseUrl: string;
}

export async function processReviewRequest(job: Job<ReviewRequestJobData>) {
  const { orderId, baseUrl } = job.data;

  const order = await storage.getOrderById(orderId);
  if (!order || order.status !== 'COMPLETED') {
    console.log(`[review-request] order ${orderId} missing or not COMPLETED — skipping`);
    return;
  }
  if (!order.buyerEmail || order.buyerEmail === 'pending@checkout.com') {
    console.log(`[review-request] order ${orderId} has no buyer email — skipping`);
    return;
  }

  const store = await storage.getStoreById(order.storeId);
  if (!store || !store.reviewsEnabled) {
    console.log(`[review-request] store ${order.storeId} missing or reviews disabled — skipping`);
    return;
  }

  const items = await storage.getOrderItemsByOrder(orderId);
  if (items.length === 0) return;

  // One email per order, anchored on the first reviewable item. Skip items
  // whose product has per-product reviews disabled, and skip entirely if the
  // buyer already reviewed everything in the order.
  let target: { productId: string; title: string } | null = null;
  for (const item of items) {
    if (item.product.reviewsEnabled === false) continue;
    if (order.customerId) {
      const [existing] = await db
        .select({ id: storeReviews.id })
        .from(storeReviews)
        .where(and(
          eq(storeReviews.customerId, order.customerId),
          eq(storeReviews.productId, item.productId),
        ));
      if (existing) continue;
    }
    const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, item.productId);
    target = { productId: item.productId, title: sp?.customTitle || item.product.title };
    break;
  }
  if (!target) {
    console.log(`[review-request] order ${orderId}: nothing reviewable — skipping`);
    return;
  }

  await sendReviewRequestEmail({
    buyerEmail: order.buyerEmail,
    storeName: store.name,
    productTitle: target.title,
    reviewUrl: `${storePublicUrl(store, baseUrl, `/product/${target.productId}`)}#reviews`,
  });

  console.log(`[review-request] sent for order ${orderId} (product ${target.productId})`);
}
