import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { audit } from './audit';
import { randomBytes } from 'crypto';
import { sendOrderCompletionEmails } from './orderEmailHelper';
import { db } from './db';
import { coupons, downloadTokens, orders, webhookEvents } from '@shared/schema';
import type { PlanTier } from '@shared/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { authStorage } from './replit_integrations/auth/storage';

/**
 * Atomically claim a webhook event ID for processing. Returns true if this is
 * the first time we've seen the event, false if a previous webhook attempt
 * already inserted it (i.e. a duplicate that should be skipped).
 *
 * Uses ON CONFLICT DO NOTHING + RETURNING so two concurrent webhook receivers
 * cannot both think they were first.
 */
async function claimWebhookEvent(provider: "stripe" | "paypal" | "sendgrid", eventId: string, eventType?: string): Promise<boolean> {
  const inserted = await db
    .insert(webhookEvents)
    .values({ provider, eventId, eventType: eventType ?? null })
    .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
    .returning({ id: webhookEvents.id });
  return inserted.length > 0;
}

async function revokeOrderDownloadTokens(orderId: string): Promise<void> {
  await db
    .update(downloadTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(downloadTokens.orderId, orderId), isNull(downloadTokens.revokedAt)));
}

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
    const stripe = await getUncachableStripeClient();

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set — rejecting unverified webhook. Set this environment variable to enable webhook processing.');
    }

    // constructEvent validates the timestamp internally (rejects events > 5 min old by default)
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // Timestamp validation — reject events older than 5 minutes (replay attack prevention)
    const eventAge = Date.now() / 1000 - event.created;
    if (eventAge > 300) {
      throw new Error(`Webhook event ${event.id} rejected: timestamp too old (${Math.round(eventAge)}s)`);
    }

    // DB-backed idempotency — survives restart and works across instances.
    const claimed = await claimWebhookEvent("stripe", event.id, event.type);
    if (!claimed) {
      audit({ event: "webhook.duplicate", details: `Duplicate Stripe event ${event.id} (${event.type}) ignored` });
      return;
    }
    audit({ event: "webhook.received", details: `Stripe event ${event.id} (${event.type}) processing` });

    await WebhookHandlers.handleEvent(event);
  }

  static async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.metadata?.sellisy_signup === 'true') {
          await WebhookHandlers.handleSubscriptionSignup(session);
        } else {
          await WebhookHandlers.handleCheckoutCompleted(session);
        }
        break;
      }
      case 'charge.refunded':
      case 'refund.created':
      case 'refund.updated':
        await WebhookHandlers.handleStripeRefund(event.data.object, event.type);
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
      // Best-effort atomic conditional increment — payment is already captured,
      // so a race overshoot on coupon cap is logged for ops, not failed back.
      const claimed = await db
        .update(coupons)
        .set({ currentUses: sql`${coupons.currentUses} + 1` })
        .where(and(
          eq(coupons.id, couponId),
          sql`(${coupons.maxUses} IS NULL OR ${coupons.currentUses} < ${coupons.maxUses})`,
        ))
        .returning({ id: coupons.id });
      if (claimed.length === 0) {
        console.warn(`[coupon] race overshoot — Stripe order ${orderId} used coupon ${couponId} but cap was reached`);
      }
    }

    await sendOrderCompletionEmails(orderId, WebhookHandlers.getBaseUrl());

    // Affiliate commission. Best-effort — never block the order on this.
    try {
      await WebhookHandlers.writeAffiliateCommissionForOrder(orderId);
    } catch (commErr) {
      console.error('Webhook: affiliate commission write failed for order:', orderId, commErr);
    }

    console.log('Webhook: order completed, emails triggered:', orderId);
    } catch (error: any) {
      console.error('Webhook: handleCheckoutCompleted error for order:', orderId, error);
    }
  }

  /**
   * Write an affiliate_commissions row for an order if it was attributed at
   * checkout time. Safe to call multiple times — the orderId is UNIQUE on
   * affiliate_commissions, so a duplicate insert is a no-op caught here.
   *
   * Self-attribution guard: if the buyer email matches the affiliate's
   * user-account email, void the would-be commission immediately.
   */
  static async writeAffiliateCommissionForOrder(orderId: string): Promise<void> {
    const order = await storage.getOrderById(orderId);
    if (!order || !order.affiliateId || !order.affiliateRateBps) return;
    if (order.totalCents <= 0) return;

    // Skip if a commission already exists for this order (idempotent webhook).
    const existing = await storage.getCommissionByOrderId(orderId);
    if (existing) return;

    const affiliate = await storage.getAffiliateById(order.affiliateId);
    if (!affiliate || affiliate.status !== "active") return;

    // Self-attribution guard: affiliate cannot earn on a purchase they made
    // themselves through an alt buyer email. We check the affiliate's user
    // email against the order's buyerEmail.
    try {
      const affUser = await authStorage.getUser(affiliate.userId);
      if (affUser?.email && order.buyerEmail && affUser.email.toLowerCase() === order.buyerEmail.toLowerCase()) {
        audit({
          event: "affiliate.self_attribution_blocked",
          details: `Order ${orderId} matched affiliate ${affiliate.id} self-purchase, commission skipped`,
        });
        return;
      }
    } catch {
      // If user lookup fails, fall through — better to write the commission
      // than to silently drop a legit one.
    }

    const subtotalCents = order.totalCents;
    const rateBps = order.affiliateRateBps;
    const commissionCents = Math.floor((subtotalCents * rateBps) / 10000);
    if (commissionCents <= 0) return;

    const lockedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await storage.createCommission({
      affiliateId: affiliate.id,
      storeId: order.storeId,
      orderId,
      subtotalCents,
      commissionRateBps: rateBps,
      commissionCents,
      status: "pending",
      lockedUntil,
    });

    audit({
      event: "affiliate.commission_created",
      details: `Order ${orderId} -> affiliate ${affiliate.id}: ${commissionCents}c (${rateBps}bps on ${subtotalCents}c)`,
    });
  }

  /**
   * Handle Stripe refund events. We accept both `charge.refunded` (refund on a
   * Charge) and `refund.created` / `refund.updated` (refund-first model).
   * The shape differs between these — `charge.refunded` payload is the Charge
   * with `refunds.data[]`; `refund.*` payload is the Refund itself.
   */
  static async handleStripeRefund(obj: any, eventType: string): Promise<void> {
    try {
      let paymentIntentId: string | undefined;
      let refundId: string | undefined;
      let refundedAmount = 0;
      let isFullRefund = false;
      let reason: string | undefined;

      if (eventType === "charge.refunded") {
        paymentIntentId = obj.payment_intent ?? undefined;
        const totalAmount = obj.amount ?? 0;
        refundedAmount = obj.amount_refunded ?? 0;
        isFullRefund = totalAmount > 0 && refundedAmount >= totalAmount;
        const latestRefund = (obj.refunds?.data ?? [])[0];
        refundId = latestRefund?.id;
        reason = latestRefund?.reason ?? undefined;
      } else {
        // refund.created / refund.updated — obj is a Refund
        paymentIntentId = obj.payment_intent ?? undefined;
        refundId = obj.id;
        refundedAmount = obj.amount ?? 0;
        reason = obj.reason ?? undefined;
      }

      if (!paymentIntentId) {
        console.warn(`Webhook: refund event ${eventType} has no payment_intent, cannot match to order`);
        return;
      }

      // Find the matching order. Stripe's checkout.session.completed sets the
      // order's stripeSessionId to the session ID; the payment_intent is
      // attached to that session. We look up via the session's payment_intent.
      const stripe = await getUncachableStripeClient();
      const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
      const sessionId = sessions.data[0]?.id;
      if (!sessionId) {
        console.warn(`Webhook: refund for payment_intent ${paymentIntentId} — no Stripe session found`);
        return;
      }

      const order = await storage.getOrderByStripeSession(sessionId);
      if (!order) {
        console.warn(`Webhook: refund for session ${sessionId} — no Sellisy order found`);
        return;
      }

      const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

      await db.update(orders).set({
        status: newStatus,
        refundedAt: new Date(),
        refundedAmountCents: refundedAmount,
        refundReason: reason ?? null,
        stripeRefundId: refundId ?? null,
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id));

      // Revoke any outstanding download tokens for the refunded order so the
      // buyer can no longer obtain the digital goods after getting their money back.
      if (isFullRefund) {
        await revokeOrderDownloadTokens(order.id);
      }

      audit({
        event: "order.refunded",
        details: `Order ${order.id} refunded (${refundedAmount} of ${order.totalCents}) via Stripe ${refundId ?? "?"}`,
      });

      // Clawback: void any pending/approved commission tied to this order.
      // V1 simplification: any refund voids the full commission. Future:
      // prorate partial refunds.
      try {
        await storage.voidCommissionsForOrder(order.id, isFullRefund ? "order_refunded" : "order_partially_refunded");
      } catch (commErr) {
        console.error("Webhook: commission clawback failed for order:", order.id, commErr);
      }
    } catch (error: any) {
      console.error("Webhook: handleStripeRefund error:", error);
    }
  }

  /**
   * Verify a PayPal webhook payload using PayPal's verify-webhook-signature
   * endpoint. Returns true if the signature is valid.
   *
   * Requires:
   *   PAYPAL_WEBHOOK_ID    — the webhook resource id from the PayPal dashboard
   *   PAYPAL_CLIENT_ID     — platform-level PayPal app
   *   PAYPAL_CLIENT_SECRET — platform-level PayPal app
   *   PAYPAL_API_BASE      — defaults to https://api-m.paypal.com
   */
  static async verifyPaypalSignature(headers: Record<string, string | string[] | undefined>, body: any): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!webhookId || !clientId || !clientSecret) {
      console.error("PayPal webhook env not configured (PAYPAL_WEBHOOK_ID, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)");
      return false;
    }
    const apiBase = process.env.PAYPAL_API_BASE ?? "https://api-m.paypal.com";
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Token exchange
    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) return false;
    const { access_token } = await tokenRes.json() as { access_token: string };

    const h = (k: string) => {
      const v = headers[k.toLowerCase()] ?? headers[k];
      return Array.isArray(v) ? v[0] : v;
    };

    const verifyRes = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: h("paypal-auth-algo"),
        cert_url: h("paypal-cert-url"),
        transmission_id: h("paypal-transmission-id"),
        transmission_sig: h("paypal-transmission-sig"),
        transmission_time: h("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });
    if (!verifyRes.ok) return false;
    const result = await verifyRes.json() as { verification_status?: string };
    return result.verification_status === "SUCCESS";
  }

  /**
   * Process a verified PayPal webhook event. Handles refunds; the original
   * order/capture flow stays in routes.ts under /api/paypal/capture.
   */
  static async processPaypalEvent(event: any): Promise<void> {
    const eventId = event.id as string | undefined;
    if (!eventId) {
      console.warn("PayPal webhook: no event id, skipping");
      return;
    }
    const claimed = await claimWebhookEvent("paypal", eventId, event.event_type);
    if (!claimed) {
      audit({ event: "webhook.duplicate", details: `Duplicate PayPal event ${eventId} (${event.event_type}) ignored` });
      return;
    }
    audit({ event: "webhook.received", details: `PayPal event ${eventId} (${event.event_type}) processing` });

    const type = event.event_type as string;
    if (type === "PAYMENT.CAPTURE.REFUNDED" || type === "PAYMENT.CAPTURE.REVERSED") {
      await WebhookHandlers.handlePaypalRefund(event.resource);
    }
  }

  static async handlePaypalRefund(resource: any): Promise<void> {
    try {
      // The refund resource links back to its capture via HATEOAS links.
      const captureLink = resource?.links?.find((l: any) => l.rel === "up");
      const captureId = captureLink ? captureLink.href.split("/").pop() : undefined;
      const refundId = resource?.id;
      const refundedAmount = Math.round(parseFloat(resource?.amount?.value ?? "0") * 100);

      // Match the capture id back to a Sellisy order. The capture flow at
      // /api/paypal/capture stores the captureId in paypalOrderId for matching.
      let order = captureId ? await storage.getOrderByPaypalOrderId(captureId) : null;
      if (!order && resource?.custom_id) {
        // Fallback: some PayPal flows pass the Sellisy order ID as custom_id.
        order = await storage.getOrderById(resource.custom_id);
      }
      if (!order) {
        console.warn(`PayPal webhook: refund ${refundId} — no Sellisy order match (capture=${captureId}, custom_id=${resource?.custom_id})`);
        return;
      }

      const isFullRefund = refundedAmount >= order.totalCents;
      const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

      await db.update(orders).set({
        status: newStatus,
        refundedAt: new Date(),
        refundedAmountCents: refundedAmount,
        refundReason: resource?.note_to_payer ?? null,
        paypalRefundId: refundId ?? null,
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id));

      if (isFullRefund) {
        await revokeOrderDownloadTokens(order.id);
      }

      audit({
        event: "order.refunded",
        details: `Order ${order.id} refunded (${refundedAmount} of ${order.totalCents}) via PayPal ${refundId ?? "?"}`,
      });

      // Clawback: void any pending/approved commission tied to this order.
      try {
        await storage.voidCommissionsForOrder(order.id, isFullRefund ? "order_refunded" : "order_partially_refunded");
      } catch (commErr) {
        console.error("PayPal webhook: commission clawback failed for order:", order.id, commErr);
      }
    } catch (error: any) {
      console.error("PayPal webhook: handlePaypalRefund error:", error);
    }
  }
}
