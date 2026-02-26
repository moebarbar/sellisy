import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { randomBytes } from 'crypto';
import { sendOrderCompletionEmails } from './orderEmailHelper';
import { db } from './db';
import { coupons } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // NOTE: This webhook handler uses the platform-level Stripe client.
    // For stores with their own Stripe keys, order completion is handled
    // by the checkout success endpoint polling (GET /api/checkout/success/:id)
    // which uses the store's own Stripe client to verify payment status.
    const stripe = await getUncachableStripeClient();

    let event: any;
    if (webhookSecret) {
      const verified = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      event = verified;
    } else {
      console.warn('STRIPE_WEBHOOK_SECRET not set — webhook signature verification is disabled. Set it for production security.');
      event = JSON.parse(payload.toString());
    }

    await WebhookHandlers.handleEvent(event);
  }

  static async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        break;
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.log('Webhook: checkout.session.completed without orderId metadata, skipping');
      return;
    }

    const order = await storage.getOrderById(orderId);
    if (!order) {
      console.error('Webhook: order not found for id:', orderId);
      return;
    }

    if (order.status === 'COMPLETED') {
      console.log('Webhook: order already completed:', orderId);
      if (!order.emailSent) {
        const baseUrl = process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.REPL_SLUG
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            : 'https://sellisy.com';
        await sendOrderCompletionEmails(orderId, baseUrl);
      }
      return;
    }

    const buyerEmail = session.customer_details?.email || order.buyerEmail;

    await storage.updateOrderStatus(orderId, 'COMPLETED');

    if (buyerEmail && buyerEmail !== 'pending@checkout.com' && buyerEmail !== order.buyerEmail) {
      await storage.updateOrderBuyerEmail(orderId, buyerEmail);
    }

    const tokenHash = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await storage.createDownloadToken({ orderId, tokenHash, expiresAt });

    if (buyerEmail && buyerEmail !== 'pending@checkout.com') {
      const customer = await storage.findOrCreateCustomer(buyerEmail);
      await storage.setOrderCustomerId(orderId, customer.id);
      await storage.linkOrdersByEmail(buyerEmail, customer.id);
    }

    const couponId = session.metadata?.couponId;
    if (couponId) {
      await db.update(coupons).set({ currentUses: sql`${coupons.currentUses} + 1` }).where(eq(coupons.id, couponId));
    }

    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'https://sellisy.com';

    await sendOrderCompletionEmails(orderId, baseUrl);

    console.log('Webhook: order completed, emails triggered:', orderId);
  }
}
