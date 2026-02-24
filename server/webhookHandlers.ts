import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { randomBytes } from 'crypto';
import { sendOrderCompletionEmails } from './orderEmailHelper';

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

    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'https://sellisy.com';

    await sendOrderCompletionEmails(orderId, baseUrl);

    console.log('Webhook: order completed, emails triggered:', orderId);
  }
}
