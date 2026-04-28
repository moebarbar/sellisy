import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { audit } from './audit';
import { randomBytes } from 'crypto';
import { sendOrderCompletionEmails } from './orderEmailHelper';
import { db } from './db';
import { coupons } from '@shared/schema';
import type { PlanTier } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { authStorage } from './replit_integrations/auth/storage';

// In-memory dedup store for processed webhook event IDs.
// Capped at 10k entries to prevent unbounded memory growth.
// Sufficient for single-instance deployments; swap for Redis if multi-instance.
const processedEventIds = new Set<string>();
const MAX_PROCESSED_EVENT_IDS = 10_000;

export class WebhookHandlers {
  static getBaseUrl(): string {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    }
    return 'https://sellisy.com';
  }

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

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set — rejecting unverified webhook. Set this environment variable to enable webhook processing.');
    }

    // constructEvent also validates the timestamp internally (rejects events > 5 min old by default)
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // Timestamp validation — reject events older than 5 minutes (replay attack prevention)
    const eventAge = Date.now() / 1000 - event.created;
    if (eventAge > 300) {
      throw new Error(`Webhook event ${event.id} rejected: timestamp too old (${Math.round(eventAge)}s)`);
    }

    // Idempotency — deduplicate by event ID to prevent double-processing
    if (processedEventIds.has(event.id)) {
      audit({ event: "webhook.duplicate", details: `Duplicate Stripe event ${event.id} (${event.type}) ignored` });
      return;
    }

    // Evict oldest entries if cap is reached (simple FIFO via iteration order)
    if (processedEventIds.size >= MAX_PROCESSED_EVENT_IDS) {
      const first = processedEventIds.values().next().value;
      if (first !== undefined) processedEventIds.delete(first);
    }
    processedEventIds.add(event.id);
    audit({ event: "webhook.received", details: `Stripe event ${event.id} (${event.type}) processing` });

    await WebhookHandlers.handleEvent(event);
  }

  static async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.metadata?.sellisy_signup === 'true') {
          await WebhookHandlers.handleSubscriptionSignup(session);
        } else {
          await WebhookHandlers.handleCheckoutCompleted(session);
        }
        break;
    }
  }

  static async handleSubscriptionSignup(session: any): Promise<void> {
    const meta = session.metadata;
    if (!meta?.sellisyUserId) {
      console.error('[subscriptions] Webhook: missing sellisyUserId in metadata');
      return;
    }

    try {
      const user = await authStorage.getUser(meta.sellisyUserId);
      if (!user) {
        console.error(`[subscriptions] Webhook: user ${meta.sellisyUserId} not found`);
        return;
      }

      const tier = (meta.planTier || 'basic') as PlanTier;
      await storage.updateUserPlan(user.id, tier);

      console.log(`[subscriptions] Activated plan ${tier} for user ${user.email ?? user.id}`);
    } catch (error: any) {
      console.error('[subscriptions] Error activating plan from webhook:', error);
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.log('Webhook: checkout.session.completed without orderId metadata, skipping');
      return;
    }

    try {
    const order = await storage.getOrderById(orderId);
    if (!order) {
      console.error('Webhook: order not found for id:', orderId);
      return;
    }

    if (order.status === 'COMPLETED') {
      console.log('Webhook: order already completed:', orderId);
      if (!order.emailSent) {
        await sendOrderCompletionEmails(orderId, WebhookHandlers.getBaseUrl());
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

    await sendOrderCompletionEmails(orderId, WebhookHandlers.getBaseUrl());

    console.log('Webhook: order completed, emails triggered:', orderId);
    } catch (error: any) {
      console.error('Webhook: handleCheckoutCompleted error for order:', orderId, error);
    }
  }
}
