import { db } from "./db";
import { orders, downloadTokens } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq, and, sql } from "drizzle-orm";
import { storage } from "./storage";
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from "./emails";

export async function sendOrderCompletionEmails(orderId: string, baseUrl: string): Promise<boolean> {
  const claimed = await db
    .update(orders)
    .set({ emailSent: true })
    .where(and(eq(orders.id, orderId), eq(orders.emailSent, false)))
    .returning({ id: orders.id });

  if (claimed.length === 0) {
    console.log("sendOrderCompletionEmails: already claimed or not found:", orderId);
    return false;
  }

  const order = await storage.getOrderById(orderId);
  if (!order) {
    console.error("sendOrderCompletionEmails: order not found after claim:", orderId);
    return false;
  }

  if (order.status !== "COMPLETED") {
    console.log("sendOrderCompletionEmails: order not completed, reverting flag:", orderId);
    await db.update(orders).set({ emailSent: false }).where(eq(orders.id, orderId));
    return false;
  }

  if (!order.buyerEmail || order.buyerEmail === "pending@checkout.com") {
    console.log("sendOrderCompletionEmails: no valid buyer email, reverting flag:", orderId);
    await db.update(orders).set({ emailSent: false }).where(eq(orders.id, orderId));
    return false;
  }

  const tokenRows = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, orderId));
  if (tokenRows.length === 0) {
    console.error("sendOrderCompletionEmails: no download token, reverting flag:", orderId);
    await db.update(orders).set({ emailSent: false }).where(eq(orders.id, orderId));
    return false;
  }
  const tokenHash = tokenRows[0].tokenHash;

  const store = await storage.getStoreById(order.storeId);
  const items = await storage.getOrderItemsByOrder(order.id);

  const emailItems = await Promise.all(items.map(async (i) => {
    const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, i.productId);
    return { title: sp?.customTitle || i.product.title, priceCents: i.priceCents };
  }));

  try {
    await sendOrderConfirmationEmail({
      buyerEmail: order.buyerEmail,
      storeName: store?.name || "Store",
      storeSlug: store?.slug || "",
      orderId: order.id,
      totalCents: order.totalCents,
      items: emailItems,
      downloadToken: tokenHash,
      baseUrl,
    });

    if (store) {
      const [owner] = await db.select().from(users).where(eq(users.id, store.ownerId));
      if (owner?.email) {
        await sendNewOrderNotificationEmail({
          ownerEmail: owner.email,
          storeName: store.name,
          buyerEmail: order.buyerEmail,
          orderId: order.id,
          totalCents: order.totalCents,
          items: emailItems,
        });
      }
    }

    console.log("sendOrderCompletionEmails: emails sent for order:", orderId);

    // Queue the review-request follow-up 3 days out. Best-effort: a Redis
    // outage must not fail the confirmation email path. Deterministic jobId
    // makes duplicate webhook deliveries a no-op, and the job re-validates
    // (store reviewsEnabled, existing review, refund) at send time.
    if (store?.reviewsEnabled && process.env.REDIS_URL) {
      try {
        const { reviewRequestQueue } = await import("./queue/queues");
        await reviewRequestQueue.add(
          "review-request",
          { orderId, baseUrl },
          { jobId: `review-request-${orderId}`, delay: 3 * 24 * 60 * 60 * 1000 },
        );
      } catch (err) {
        console.error("sendOrderCompletionEmails: failed to queue review request:", orderId, err);
      }
    }

    return true;
  } catch (err) {
    console.error("sendOrderCompletionEmails: email send failed, reverting flag:", orderId, err);
    await db.update(orders).set({ emailSent: false }).where(eq(orders.id, orderId));
    return false;
  }
}
