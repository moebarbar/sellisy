import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { audit } from './audit';
import { randomBytes } from 'crypto';
import { sendOrderCompletionEmails } from './orderEmailHelper';
import { db } from './db';
import { affiliateCommissions, coupons, downloadTokens, orders, webhookEvents } from '@shared/schema';
import type { InsertAffiliateCommission } from '@shared/schema';
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
      case 'checkout.session.expired':
        await WebhookHandlers.handleCheckoutExpired(event.data.object);
        break;
    }
  }

  /**
   * Abandoned-checkout recovery. Stripe expires Checkout sessions ~24h
   * after creation and includes customer_details.email when the buyer
   * typed their email before leaving — that's our recovery audience.
   * Sends one email with an HMAC-signed resume link that mints a fresh
   * session for the SAME pending order (coupon discount + affiliate
   * attribution carry over).
   */
  static async handleCheckoutExpired(session: any): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;
    // Subscription signups have no order to recover.
    if (session.metadata?.sellisy_signup === 'true') return;

    try {
      const order = await storage.getOrderById(orderId);
      if (!order || order.status !== 'PENDING') return;

      const email = session.customer_details?.email
        || (order.buyerEmail && order.buyerEmail !== 'pending@checkout.com' ? order.buyerEmail : null);
      if (!email) {
        console.log(`[recovery] order ${orderId} expired with no buyer email — nothing to recover`);
        return;
      }

      const store = await storage.getStoreById(order.storeId);
      if (!store || !store.cartRecoveryEnabled) return;

      // Atomic claim — only the first expired-session delivery sends.
      const claimed = await db
        .update(orders)
        .set({ recoveryEmailSentAt: new Date(), buyerEmail: email, updatedAt: new Date() })
        .where(and(eq(orders.id, orderId), isNull(orders.recoveryEmailSentAt)))
        .returning({ id: orders.id });
      if (claimed.length === 0) return;

      const items = await storage.getOrderItemsByOrder(orderId);
      const { makeRecoveryToken } = await import('./crypto/recovery-token');
      const baseUrl = WebhookHandlers.getBaseUrl();
      const recoverUrl = `${baseUrl}/api/checkout/recover/${orderId}/${makeRecoveryToken(orderId)}`;

      const { sendCartRecoveryEmail } = await import('./emails');
      await sendCartRecoveryEmail({
        buyerEmail: email,
        storeName: store.name,
        items: items.map((i) => ({ title: i.product.title, priceCents: i.priceCents })),
        totalCents: order.totalCents,
        recoverUrl,
      });

      audit({ event: 'webhook.received', details: `Recovery email sent for expired checkout ${orderId} (${email})` });
      console.log(`[recovery] sent recovery email for order ${orderId}`);
    } catch (error: any) {
      console.error('[recovery] handleCheckoutExpired error for order:', orderId, error);
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

      const sessionEmail: string | undefined = session.customer_details?.email;
      const buyerEmail = sessionEmail || order.buyerEmail;
      const couponId: string | undefined = session.metadata?.couponId;

      // Resolve customer outside the tx — findOrCreateCustomer is idempotent
      // on email, so re-running on retry is safe.
      let customerId: string | null = order.customerId;
      if (buyerEmail && buyerEmail !== 'pending@checkout.com') {
        const customer = await storage.findOrCreateCustomer(buyerEmail);
        customerId = customer.id;
      }

      // Pre-compute the affiliate commission insert (all the reads + the
      // self-attribution check) so the transaction below only needs to INSERT.
      const commissionInsert = await WebhookHandlers.prepareAffiliateCommissionInsert(
        { ...order, buyerEmail },
      );

      const tokenHash = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await db.transaction(async (tx) => {
        // 1. Mark order COMPLETED, set buyerEmail + customerId in the same UPDATE.
        await tx.update(orders).set({
          status: 'COMPLETED',
          buyerEmail: buyerEmail && buyerEmail !== 'pending@checkout.com' ? buyerEmail : order.buyerEmail,
          customerId,
          updatedAt: new Date(),
        }).where(eq(orders.id, orderId));

        // 2. Issue the download token.
        await tx.insert(downloadTokens).values({ orderId, tokenHash, expiresAt });

        // 3. Coupon usage increment — conditional. Payment is already captured,
        // so a race overshoot is logged for ops, not failed back.
        let couponOvershoot = false;
        if (couponId) {
          const claimed = await tx
            .update(coupons)
            .set({ currentUses: sql`${coupons.currentUses} + 1` })
            .where(and(
              eq(coupons.id, couponId),
              sql`(${coupons.maxUses} IS NULL OR ${coupons.currentUses} < ${coupons.maxUses})`,
            ))
            .returning({ id: coupons.id });
          if (claimed.length === 0) couponOvershoot = true;
        }

        // 4. Affiliate commission row (idempotent on the unique orderId index).
        if (commissionInsert) {
          await tx.insert(affiliateCommissions)
            .values(commissionInsert)
            .onConflictDoNothing({ target: affiliateCommissions.orderId });
        }

        return { couponOvershoot };
      });

      if (result.couponOvershoot) {
        console.warn(`[coupon] race overshoot — Stripe order ${orderId} used coupon ${couponId} but cap was reached`);
      }

      // Best-effort post-commit backfill. Not in the tx because it touches
      // *other* orders by the same email and is purely a UX nicety.
      if (buyerEmail && buyerEmail !== 'pending@checkout.com' && customerId) {
        try {
          await storage.linkOrdersByEmail(buyerEmail, customerId);
        } catch (err) {
          console.error('Webhook: linkOrdersByEmail failed for', orderId, err);
        }
      }

      if (commissionInsert) {
        audit({
          event: 'affiliate.commission_created',
          details: `Order ${orderId} -> affiliate ${commissionInsert.affiliateId}: ${commissionInsert.commissionCents}c (${commissionInsert.commissionRateBps}bps on ${commissionInsert.subtotalCents}c)`,
        });
      }

      await sendOrderCompletionEmails(orderId, WebhookHandlers.getBaseUrl());

      console.log('Webhook: order completed, emails triggered:', orderId);
    } catch (error: any) {
      console.error('Webhook: handleCheckoutCompleted error for order:', orderId, error);
    }
  }

  /**
   * Pre-flight reads + checks for an affiliate commission row. Returns the
   * insertable shape, or null if the order shouldn't earn a commission
   * (no attribution, $0 order, affiliate inactive, self-attribution, etc.).
   *
   * Idempotency on duplicate webhook processing comes from the UNIQUE constraint
   * on affiliate_commissions.orderId — callers should INSERT … ON CONFLICT DO NOTHING.
   */
  static async prepareAffiliateCommissionInsert(
    order: { id: string; storeId: string; affiliateId: string | null; affiliateRateBps: number | null; totalCents: number; buyerEmail: string | null },
  ): Promise<InsertAffiliateCommission | null> {
    if (!order.affiliateId || !order.affiliateRateBps) return null;
    if (order.totalCents <= 0) return null;

    const existing = await storage.getCommissionByOrderId(order.id);
    if (existing) return null;

    const affiliate = await storage.getAffiliateById(order.affiliateId);
    if (!affiliate || affiliate.status !== 'active') return null;

    // Self-attribution guard.
    try {
      const affUser = await authStorage.getUser(affiliate.userId);
      if (affUser?.email && order.buyerEmail && affUser.email.toLowerCase() === order.buyerEmail.toLowerCase()) {
        audit({
          event: 'affiliate.self_attribution_blocked',
          details: `Order ${order.id} matched affiliate ${affiliate.id} self-purchase, commission skipped`,
        });
        return null;
      }
    } catch {
      // Fall through — better to write than to silently drop a legit commission.
    }

    const subtotalCents = order.totalCents;
    const rateBps = order.affiliateRateBps;
    const commissionCents = Math.floor((subtotalCents * rateBps) / 10000);
    if (commissionCents <= 0) return null;

    return {
      affiliateId: affiliate.id,
      storeId: order.storeId,
      orderId: order.id,
      subtotalCents,
      commissionRateBps: rateBps,
      commissionCents,
      status: 'pending',
      lockedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Standalone retry path for writing an affiliate commission. Used when the
   * primary call site (inline in a checkout-completion transaction) hasn't
   * already inserted the commission. Idempotent — the orderId UNIQUE on
   * affiliate_commissions makes duplicate inserts a no-op.
   */
  static async writeAffiliateCommissionForOrder(orderId: string): Promise<void> {
    const order = await storage.getOrderById(orderId);
    if (!order) return;
    // Defensive: only credit commissions on COMPLETED orders. Future callers
    // shouldn't accidentally credit a FAILED/REFUNDED order.
    if (order.status !== "COMPLETED") return;

    const insert = await WebhookHandlers.prepareAffiliateCommissionInsert(order);
    if (!insert) return;

    await db.insert(affiliateCommissions)
      .values(insert)
      .onConflictDoNothing({ target: affiliateCommissions.orderId });

    audit({
      event: "affiliate.commission_created",
      details: `Order ${orderId} -> affiliate ${insert.affiliateId}: ${insert.commissionCents}c (${insert.commissionRateBps}bps on ${insert.subtotalCents}c)`,
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

      // refund.created / refund.updated carry the Refund only (no charge
      // total), so full-vs-partial can't be derived from the payload. Resolve
      // it against the matched order's total — mirrors the PayPal refund path.
      // Without this a full refund via the refund-first shape would be marked
      // PARTIALLY_REFUNDED and leave download tokens live for a refunded buyer.
      if (eventType !== "charge.refunded") {
        isFullRefund = refundedAmount >= order.totalCents;
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
