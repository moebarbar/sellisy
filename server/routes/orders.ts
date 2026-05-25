// Owner-facing orders list + the entire buyer-facing money path:
// checkout (Stripe + PayPal), capture, success polling, resend, free
// claims, and the customer portal (magic-link login, purchases, downloads).
//
// Extracted from server/routes.ts as part of the routes-split refactor.
// Mounted in registerRoutes as: app.use(ordersRouter)

import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import Stripe from "stripe";

import { storage } from "../storage";
import { db } from "../db";
import { audit, auditMeta } from "../audit";
import { isAuthenticated } from "../replit_integrations/auth";
import {
  affiliateCommissions,
  coupons,
  customers,
  downloadTokens,
  orderItems,
  orders,
  products,
  storeProducts,
  stores,
  PLAN_FEATURES,
  type PlanTier,
} from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import {
  sendOrderConfirmationEmail,
  sendDownloadLinkEmail,
  sendMagicLinkEmail,
  sendLeadMagnetEmail,
} from "../emails";
import { sendOrderCompletionEmails } from "../orderEmailHelper";
import { WebhookHandlers } from "../webhookHandlers";
import { watermarkPdf, isPdfFilename, isPdfContentType } from "../pdfWatermark";
import { decryptPaymentSecret } from "../crypto/payment-secret";
import { getAppUrl, getCustomerFromCookie, getUserId, hashToken } from "./_helpers";

export const ordersRouter = Router();

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const isLive = clientId.startsWith("A") && clientId.length > 50;
  const baseUrl = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const resp = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayPal auth failed: ${resp.status} ${text}`);
  }
  const data = await resp.json() as any;
  return data.access_token;
}

function getPayPalBaseUrl(clientId: string): string {
  const isLive = clientId.startsWith("A") && clientId.length > 50;
  return isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function createPayPalOrder(
  clientId: string,
  clientSecret: string,
  totalCents: number,
  itemName: string,
  orderId: string,
  storeId: string,
  storeSlug: string,
  appUrl: string,
): Promise<{ approveUrl: string; paypalOrderId: string }> {
  const accessToken = await getPayPalAccessToken(clientId, clientSecret);
  const baseUrl = getPayPalBaseUrl(clientId);
  const totalUsd = (totalCents / 100).toFixed(2);

  const resp = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: orderId,
        description: itemName.substring(0, 127),
        amount: {
          currency_code: "USD",
          value: totalUsd,
        },
      }],
      application_context: {
        return_url: `${appUrl}/api/paypal/capture?orderId=${orderId}&storeSlug=${storeSlug}`,
        cancel_url: `${appUrl}/s/${storeSlug}`,
        brand_name: itemName.substring(0, 127),
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayPal create order failed: ${resp.status} ${text}`);
  }

  const paypalOrder = await resp.json() as any;
  const approveLink = paypalOrder.links?.find((l: any) => l.rel === "approve");
  if (!approveLink) throw new Error("PayPal approve link not found");
  return { approveUrl: approveLink.href, paypalOrderId: paypalOrder.id };
}
ordersRouter.get("/api/orders/:storeId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.storeId as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const storeOrders = await storage.getOrdersByStore(store.id);
  const itemsPerOrder = await Promise.all(
    storeOrders.map((order) => storage.getOrderItemsByOrder(order.id))
  );
  const result = storeOrders.map((order, i) => ({ ...order, items: itemsPerOrder[i] }));
  res.json(result);
});
ordersRouter.post("/api/checkout", async (req, res) => {
  try {
  const schema = z.object({
    storeId: z.string(),
    productId: z.string().optional(),
    // Optional pay-what-you-want amount (cents). Only honored if the
    // product has pwyw_enabled = true. Server re-validates ≥ pwyw_min_cents.
    pwywPriceCents: z.number().int().nonnegative().max(99_999_999).optional(),
    bundleId: z.string().optional(),
    items: z.array(z.object({ productId: z.string() })).optional(),
    buyerEmail: z.string().email().optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["stripe", "paypal"]).optional(),
  }).refine(d => d.productId || d.bundleId || (d.items && d.items.length > 0), { message: "productId, bundleId, or items required" });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

  const store = await storage.getStoreBySlug(parsed.data.storeId) || await storage.getStoreById(parsed.data.storeId);
  if (!store) return res.status(404).json({ message: "Store not found" });

  // ── Affiliate attribution snapshot ─────────────────────────────────
  // Read the storefront cookie set by the tracking script and resolve it
  // to a live, active affiliate for THIS store. If anything fails to
  // validate (program disabled, owner on free tier, affiliate paused,
  // self-attribution) we silently drop attribution — the buyer's
  // checkout proceeds normally.
  let attributedAffiliateId: string | null = null;
  let attributedRateBps: number | null = null;
  const affCookie = req.cookies?.[`sellisy_aff_${store.slug}`];
  if (affCookie && store.affiliateProgramEnabled) {
    try {
      const ownerProfile = await storage.getUserProfile(store.ownerId);
      const ownerTier = (ownerProfile?.planTier as PlanTier) || "basic";
      if (PLAN_FEATURES[ownerTier].affiliateProgram) {
        const affiliate = await storage.getAffiliateById(affCookie);
        if (
          affiliate &&
          affiliate.storeId === store.id &&
          affiliate.status === "active" &&
          affiliate.userId !== store.ownerId
        ) {
          attributedAffiliateId = affiliate.id;
          attributedRateBps = affiliate.commissionRateBps;
        }
      }
    } catch (err) {
      console.warn("[affiliate] attribution lookup failed:", err);
    }
  }

  let totalCents = 0;
  let itemName = "";
  let itemDescription = "";
  let itemImage: string | null = null;
  const itemsToAdd: { productId: string; priceCents: number; title?: string; image?: string | null }[] = [];

  if (parsed.data.bundleId) {
    const bundleData = await storage.getBundleWithProducts(parsed.data.bundleId);
    if (!bundleData || bundleData.bundle.storeId !== store.id || !bundleData.bundle.isPublished) return res.status(404).json({ message: "Bundle not found" });
    totalCents = bundleData.bundle.priceCents;
    itemName = bundleData.bundle.name;
    itemDescription = `Bundle from ${store.name} — ${bundleData.products.length} items`;
    itemImage = bundleData.bundle.thumbnailUrl;
    for (const p of bundleData.products) {
      itemsToAdd.push({ productId: p.id, priceCents: p.priceCents, title: p.title, image: p.thumbnailUrl });
    }
  } else if (parsed.data.items && parsed.data.items.length > 0) {
    // Cart checkout: multiple products
    for (const cartItem of parsed.data.items) {
      const product = await storage.getProductById(cartItem.productId);
      if (!product) return res.status(404).json({ message: `Product ${cartItem.productId} not found` });
      const sp = await storage.getStoreProductByStoreAndProduct(store.id, product.id);
      if (!sp || !sp.isPublished) return res.status(404).json({ message: `Product ${product.title} not available in this store` });
      const effectivePrice = sp.customPriceCents ?? product.priceCents;
      totalCents += effectivePrice;
      itemsToAdd.push({ productId: product.id, priceCents: effectivePrice, title: sp.customTitle || product.title, image: product.thumbnailUrl });
    }
    itemName = itemsToAdd.length === 1 ? itemsToAdd[0].title! : `${itemsToAdd.length} items from ${store.name}`;
    itemDescription = itemsToAdd.map(i => i.title).join(", ");
    itemImage = itemsToAdd[0]?.image || null;
  } else if (parsed.data.productId) {
    const product = await storage.getProductById(parsed.data.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const sp = await storage.getStoreProductByStoreAndProduct(store.id, product.id);
    if (!sp || !sp.isPublished) return res.status(404).json({ message: "Product not available in this store" });
    const suggestedPrice = sp.customPriceCents ?? product.priceCents;

    // Pay-what-you-want override: only honored if the product opted in.
    // The buyer-submitted amount is re-validated server-side against the
    // owner-set minimum (which can be 0 for true tip-jar PWYW).
    let effectivePrice = suggestedPrice;
    if (parsed.data.pwywPriceCents != null) {
      if (!product.pwywEnabled) {
        return res.status(400).json({ message: "Pay-what-you-want is not enabled for this product" });
      }
      if (parsed.data.pwywPriceCents < product.pwywMinCents) {
        return res.status(400).json({
          message: `Minimum is $${(product.pwywMinCents / 100).toFixed(2)}`,
        });
      }
      effectivePrice = parsed.data.pwywPriceCents;
    }

    totalCents = effectivePrice;
    itemName = sp.customTitle || product.title;
    itemDescription = sp.customDescription || product.description || `Digital product from ${store.name}`;
    itemImage = product.thumbnailUrl;
    itemsToAdd.push({ productId: product.id, priceCents: effectivePrice, title: itemName, image: itemImage });
  }

  let couponId: string | null = null;
  if (parsed.data.couponCode) {
    const coupon = await storage.getCouponByCode(store.id, parsed.data.couponCode);
    if (!coupon || !coupon.isActive) return res.status(400).json({ message: "Invalid coupon code" });
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return res.status(400).json({ message: "Coupon usage limit reached" });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ message: "Coupon expired" });

    if (coupon.discountType === "PERCENT") {
      totalCents = Math.max(0, Math.round(totalCents * (1 - coupon.discountValue / 100)));
    } else {
      totalCents = Math.max(0, totalCents - coupon.discountValue);
    }
    couponId = coupon.id;
  }

  const finalTotalCents = totalCents;
  const appUrl = getAppUrl(req);

  if (finalTotalCents === 0) {
    const tokenHash = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const buyerEmail = parsed.data.buyerEmail || "customer@example.com";
    let customerId: string | null = null;
    if (buyerEmail && buyerEmail !== "customer@example.com") {
      const customer = await storage.findOrCreateCustomer(buyerEmail);
      customerId = customer.id;
    }

    const result = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        storeId: store.id,
        buyerEmail,
        customerId,
        totalCents: 0,
        stripeSessionId: null,
        couponId,
        status: "COMPLETED",
        affiliateId: attributedAffiliateId,
        affiliateRateBps: attributedRateBps,
      }).returning();

      for (const item of itemsToAdd) {
        await tx.insert(orderItems).values({ orderId: order.id, ...item });
      }

      await tx.insert(downloadTokens).values({
        orderId: order.id,
        tokenHash,
        expiresAt,
      });

      if (couponId) {
        // Atomic conditional increment — only succeeds if maxUses is null or
        // currentUses is still under the cap. Prevents race where two parallel
        // checkouts both pass the read-check at line 2639 and over-redeem.
        const claimed = await tx
          .update(coupons)
          .set({ currentUses: sql`${coupons.currentUses} + 1` })
          .where(and(
            eq(coupons.id, couponId),
            sql`(${coupons.maxUses} IS NULL OR ${coupons.currentUses} < ${coupons.maxUses})`,
          ))
          .returning({ id: coupons.id });
        if (claimed.length === 0) {
          throw new Error("COUPON_LIMIT_REACHED");
        }
      }

      return order;
    }).catch((err: any) => {
      if (err?.message === "COUPON_LIMIT_REACHED") return null;
      throw err;
    });

    if (!result) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    sendOrderCompletionEmails(result.id, appUrl).catch(err =>
      console.error("Free order email error:", err)
    );

    return res.json({
      url: `${appUrl}/checkout/success?order_id=${result.id}`,
      orderId: result.id,
      totalCents: 0,
    });
  }

  const buyerEmail = parsed.data.buyerEmail || "pending@checkout.com";
  let customerId: string | null = null;
  if (buyerEmail && buyerEmail !== "pending@checkout.com") {
    const customer = await storage.findOrCreateCustomer(buyerEmail);
    customerId = customer.id;
  }

  const [order] = await db.transaction(async (tx) => {
    const [newOrder] = await tx.insert(orders).values({
      storeId: store.id,
      buyerEmail,
      customerId,
      totalCents: finalTotalCents,
      stripeSessionId: null,
      couponId,
      status: "PENDING",
      affiliateId: attributedAffiliateId,
      affiliateRateBps: attributedRateBps,
    }).returning();

    for (const item of itemsToAdd) {
      await tx.insert(orderItems).values({ orderId: newOrder.id, ...item });
    }

    return [newOrder];
  });

  const hasPayPal = !!(store.paypalClientId && store.paypalClientSecret);
  const hasStripe = !!store.stripeSecretKey;

  if (!hasPayPal && !hasStripe) {
    await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
    return res.status(400).json({ message: "This store hasn't set up payment processing yet. Please contact the store owner." });
  }

  const chosenMethod = parsed.data.paymentMethod;
  if (chosenMethod === "paypal" && !hasPayPal) {
    await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
    return res.status(400).json({ message: "PayPal is not configured for this store." });
  }
  if (chosenMethod === "stripe" && !hasStripe) {
    await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
    return res.status(400).json({ message: "Stripe is not configured for this store." });
  }

  const usePayPal = chosenMethod === "paypal" || (!chosenMethod && hasPayPal && !hasStripe);

  if (usePayPal) {
    try {
      const { approveUrl, paypalOrderId } = await createPayPalOrder(
        store.paypalClientId!,
        decryptPaymentSecret(store.paypalClientSecret)!,
        finalTotalCents,
        itemName,
        order.id,
        store.id,
        store.slug,
        appUrl,
      );
      await db.update(orders).set({ paypalOrderId }).where(eq(orders.id, order.id));
      res.json({ url: approveUrl });
    } catch (error: any) {
      console.error("PayPal checkout error:", error.message);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      res.status(500).json({ message: "PayPal payment processing unavailable. Please try again later." });
    }
  } else {
    try {
      const stripe = new Stripe(decryptPaymentSecret(store.stripeSecretKey)!, { apiVersion: '2025-11-17.clover' as any });

      // When the merchant has Stripe Tax enabled, each line item needs a
      // tax_code on the product and a tax_behavior on the price so Stripe
      // can compute VAT/sales tax. txcd_10103000 = "Digital goods - general"
      // which fits Sellisy's digital product use case.
      const taxEnabled = !!store.stripeTaxEnabled;
      const baseProductData = (pd: any) => taxEnabled ? { ...pd, tax_code: 'txcd_10103000' } : pd;
      const basePriceData = (pdata: any) => taxEnabled ? { ...pdata, tax_behavior: 'exclusive' } : pdata;

      // Build Stripe line_items — one per cart item for clarity, or one combined line for bundles
      const stripeLineItems = itemsToAdd.length > 1 && parsed.data.items
        ? itemsToAdd.map(item => {
            const pd: any = { name: item.title || itemName };
            if (item.image && item.image.startsWith("http")) pd.images = [item.image];
            return {
              price_data: basePriceData({ currency: 'usd', product_data: baseProductData(pd), unit_amount: item.priceCents }),
              quantity: 1,
            };
          })
        : [{
            price_data: basePriceData({
              currency: 'usd',
              product_data: baseProductData((() => {
                const pd: any = { name: itemName };
                if (itemDescription) pd.description = itemDescription.substring(0, 500);
                if (itemImage && itemImage.startsWith("http")) pd.images = [itemImage];
                return pd;
              })()),
              unit_amount: finalTotalCents,
            }),
            quantity: 1,
          }];

      const sessionParams: any = {
        mode: 'payment',
        line_items: stripeLineItems,
        metadata: {
          orderId: order.id,
          storeId: store.id,
          couponId: couponId || '',
          affiliateId: attributedAffiliateId || '',
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/s/${store.slug}`,
      };

      if (taxEnabled) {
        // Stripe Tax needs the buyer's billing address to know which
        // jurisdiction's rate to apply. billing_address_collection: required
        // forces Checkout to collect it. We don't set customer_update here
        // because that parameter is only valid with a pre-existing `customer`
        // ID — we use customer_email instead and let Stripe create one.
        sessionParams.automatic_tax = { enabled: true };
        sessionParams.billing_address_collection = 'required';
      }

      if (buyerEmail && buyerEmail !== "pending@checkout.com") {
        sessionParams.customer_email = buyerEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id));

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error.message);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      res.status(500).json({ message: "Payment processing unavailable. Please try again later." });
    }
  }
  } catch (error: any) {
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Checkout failed. Please try again." });
  }
});

ordersRouter.get("/api/paypal/capture", async (req, res) => {
  const { token: paypalToken, orderId, storeSlug } = req.query as { token?: string; orderId?: string; storeSlug?: string };
  if (!paypalToken || !orderId) {
    return res.redirect(`/s/${storeSlug || ""}`);
  }

  const order = await storage.getOrderById(orderId);
  if (!order || order.status !== "PENDING") {
    return res.redirect(`/checkout/success?order_id=${orderId}`);
  }

  if (order.paypalOrderId && order.paypalOrderId !== paypalToken) {
    console.error("PayPal token mismatch: expected", order.paypalOrderId, "got", paypalToken);
    return res.redirect(`/s/${storeSlug || ""}`);
  }

  const store = await storage.getStoreById(order.storeId);
  if (!store || !store.paypalClientId || !store.paypalClientSecret) {
    return res.redirect(`/s/${storeSlug || ""}`);
  }

  try {
    const accessToken = await getPayPalAccessToken(store.paypalClientId, decryptPaymentSecret(store.paypalClientSecret)!);
    const baseUrl = getPayPalBaseUrl(store.paypalClientId);

    const captureResp = await fetch(`${baseUrl}/v2/checkout/orders/${paypalToken}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResp.ok) {
      const text = await captureResp.text();
      console.error("PayPal capture failed:", text);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.redirect(`/s/${storeSlug || ""}`);
    }

    const captureData = await captureResp.json() as any;
    const captureStatus = captureData.status;

    const purchaseUnit = captureData.purchase_units?.[0];
    const capturedReferenceId = purchaseUnit?.reference_id;
    const capturedAmount = purchaseUnit?.amount?.value;
    const expectedAmount = (order.totalCents / 100).toFixed(2);

    if (capturedReferenceId && capturedReferenceId !== order.id) {
      console.error("PayPal reference_id mismatch:", capturedReferenceId, "vs", order.id);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.redirect(`/s/${storeSlug || ""}`);
    }

    if (capturedAmount && capturedAmount !== expectedAmount) {
      console.error("PayPal amount mismatch:", capturedAmount, "vs", expectedAmount);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.redirect(`/s/${storeSlug || ""}`);
    }

    if (captureStatus === "COMPLETED") {
      const payerEmail = captureData.payer?.email_address || order.buyerEmail;
      const effectiveBuyerEmail = payerEmail && payerEmail !== "pending@checkout.com" ? payerEmail : order.buyerEmail;

      // Resolve customer outside the tx — findOrCreateCustomer is idempotent.
      let customerId: string | null = order.customerId;
      if (payerEmail && payerEmail !== "pending@checkout.com") {
        const customer = await storage.findOrCreateCustomer(payerEmail);
        customerId = customer.id;
      }

      // Pre-compute affiliate commission inputs outside the tx.
      const commissionInsert = await WebhookHandlers.prepareAffiliateCommissionInsert({
        ...order,
        buyerEmail: effectiveBuyerEmail,
      });

      const tokenHash = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const txResult = await db.transaction(async (tx) => {
        await tx.update(orders).set({
          status: "COMPLETED",
          buyerEmail: effectiveBuyerEmail,
          customerId,
          updatedAt: new Date(),
        }).where(eq(orders.id, order.id));

        await tx.insert(downloadTokens).values({
          orderId: order.id,
          tokenHash,
          expiresAt,
        });

        let couponOvershoot = false;
        if (order.couponId) {
          // Best-effort atomic increment. Payment is already captured —
          // don't reject the order if the coupon happens to be exhausted
          // by a race; just record the over-use for ops to reconcile.
          const claimed = await tx
            .update(coupons)
            .set({ currentUses: sql`${coupons.currentUses} + 1` })
            .where(and(
              eq(coupons.id, order.couponId),
              sql`(${coupons.maxUses} IS NULL OR ${coupons.currentUses} < ${coupons.maxUses})`,
            ))
            .returning({ id: coupons.id });
          if (claimed.length === 0) couponOvershoot = true;
        }

        if (commissionInsert) {
          await tx.insert(affiliateCommissions)
            .values(commissionInsert)
            .onConflictDoNothing({ target: affiliateCommissions.orderId });
        }

        return { couponOvershoot };
      });

      if (txResult.couponOvershoot && order.couponId) {
        console.warn(`[coupon] race overshoot — order ${order.id} used coupon ${order.couponId} but cap was reached`);
      }

      // Post-commit backfill — best-effort.
      if (payerEmail && payerEmail !== "pending@checkout.com" && customerId) {
        storage.linkOrdersByEmail(payerEmail, customerId).catch((err) =>
          console.error("PayPal capture: linkOrdersByEmail failed:", order.id, err)
        );
      }

      if (commissionInsert) {
        audit({
          event: "affiliate.commission_created",
          details: `Order ${order.id} -> affiliate ${commissionInsert.affiliateId}: ${commissionInsert.commissionCents}c (${commissionInsert.commissionRateBps}bps on ${commissionInsert.subtotalCents}c)`,
        });
      }

      const baseUrl = getAppUrl(req);
      sendOrderCompletionEmails(order.id, baseUrl);

      return res.redirect(`/checkout/success?order_id=${order.id}`);
    } else {
      console.error("PayPal capture status not COMPLETED:", captureStatus);
      await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
      return res.redirect(`/s/${storeSlug || ""}`);
    }
  } catch (error: any) {
    console.error("PayPal capture error:", error.message);
    await db.update(orders).set({ status: "FAILED" }).where(eq(orders.id, order.id));
    return res.redirect(`/s/${storeSlug || ""}`);
  }
});

ordersRouter.get("/api/checkout/success/:identifier", async (req, res) => {
  try {
  const id = req.params.identifier as string;
  let order = await storage.getOrderById(id);

  if (!order) {
    order = await storage.getOrderByStripeSession(id);
  }

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === "PENDING" && order.stripeSessionId) {
    try {
      const orderStore = await storage.getStoreById(order.storeId);
      let stripe;
      if (orderStore?.stripeSecretKey) {
        stripe = new Stripe(decryptPaymentSecret(orderStore.stripeSecretKey)!, { apiVersion: '2025-11-17.clover' as any });
      } else {
        stripe = await getUncachableStripeClient();
      }
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      if (session.payment_status === "paid") {
        const emailFromSession = (session as any).customer_details?.email;
        if (emailFromSession && (!order.buyerEmail || order.buyerEmail === "pending@checkout.com")) {
          await storage.updateOrderBuyerEmail(order.id, emailFromSession);
        }

        await storage.updateOrderStatus(order.id, "COMPLETED");
        order = (await storage.getOrderById(order.id))!;

        if (order.couponId) {
          await storage.incrementCouponUses(order.couponId);
        }

        const finalEmail = emailFromSession || order.buyerEmail;
        if (finalEmail && finalEmail !== "pending@checkout.com") {
          const customer = await storage.findOrCreateCustomer(finalEmail);
          await storage.setOrderCustomerId(order.id, customer.id);
          await storage.linkOrdersByEmail(finalEmail, customer.id);
        }
      }
    } catch (e: any) {
      console.error("Error checking Stripe session:", e.message);
    }
  }

  const existingTokens = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, order.id));
  let tokenHash: string;

  if (existingTokens.length > 0 && new Date() < existingTokens[0].expiresAt) {
    tokenHash = existingTokens[0].tokenHash;
  } else {
    const hash = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await storage.createDownloadToken({ orderId: order.id, tokenHash: hash, expiresAt });
    tokenHash = token.tokenHash;
  }

  const store = await storage.getStoreById(order.storeId);
  const items = await storage.getOrderItemsByOrder(order.id);

  let fileCount = 0;
  for (const item of items) {
    const assets = await storage.getFileAssetsByProduct(item.productId);
    if (assets.length > 0) {
      fileCount += assets.length;
    } else if (item.product.fileUrl) {
      fileCount += 1;
    }
  }

  const storeProducts = await Promise.all(items.map(i => storage.getStoreProductByStoreAndProduct(order.storeId, i.productId)));
  const emailItems = items.map((i, idx) => ({
    title: storeProducts[idx]?.customTitle || i.product.title,
    priceCents: i.priceCents,
  }));

  // Resolve upsell from the first item that has one configured
  let upsellProduct = null;
  let upsellBundle = null;
  for (const sp of storeProducts) {
    if (!sp) continue;
    if (sp.upsellProductId && !upsellProduct) {
      const p = await storage.getProductById(sp.upsellProductId);
      if (p) upsellProduct = { id: p.id, title: p.title, description: p.description, priceCents: p.priceCents, thumbnailUrl: p.thumbnailUrl };
    }
    if (sp.upsellBundleId && !upsellBundle) {
      const b = await storage.getBundleWithProducts(sp.upsellBundleId);
      if (b) upsellBundle = { id: b.bundle.id, name: b.bundle.name, description: b.bundle.description, priceCents: b.bundle.priceCents, thumbnailUrl: b.bundle.thumbnailUrl, productCount: b.products.length };
    }
    if (upsellProduct && upsellBundle) break;
  }

  const baseUrl = getAppUrl(req);

  if (order.status === "COMPLETED" && !order.emailSent) {
    sendOrderCompletionEmails(order.id, baseUrl);
  }

  res.json({
    order: {
      id: order.id,
      buyerEmail: order.buyerEmail,
      totalCents: order.totalCents,
      status: order.status,
    },
    downloadToken: tokenHash,
    store: store ? { name: store.name, slug: store.slug } : null,
    items: emailItems,
    fileCount,
    upsellProduct,
    upsellBundle,
  });
  } catch (error: any) {
    console.error("Checkout success error:", error);
    res.status(500).json({ message: "Failed to load order details" });
  }
});

// ========== RESEND DOWNLOAD LINK ==========

ordersRouter.post("/api/resend-download", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    orderId: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please provide a valid email and order ID" });

  const { email, orderId } = parsed.data;

  const order = await storage.getOrderById(orderId);
  if (!order || order.status !== "COMPLETED") {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!order.buyerEmail || order.buyerEmail === "pending@checkout.com") {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.buyerEmail.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ message: "Email does not match this order" });
  }

  const tokenRows = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, orderId));
  let tokenHash: string;

  if (tokenRows.length > 0 && new Date() < tokenRows[0].expiresAt) {
    tokenHash = tokenRows[0].tokenHash;
  } else {
    const hash = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await storage.createDownloadToken({ orderId, tokenHash: hash, expiresAt });
    tokenHash = token.tokenHash;
  }

  const store = await storage.getStoreById(order.storeId);
  const baseUrl = getAppUrl(req);

  sendDownloadLinkEmail({
    buyerEmail: email,
    storeName: store?.name || "Store",
    downloadToken: tokenHash,
    baseUrl,
  });

  res.json({ message: "Download link has been sent to your email" });
});

// ========== FREE PRODUCT CLAIM (Lead Magnet) ==========

ordersRouter.post("/api/claim-free", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    productId: z.string(),
    storeId: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

  const { email, productId, storeId } = parsed.data;

  const store = await storage.getStoreById(storeId);
  if (!store) return res.status(404).json({ message: "Store not found" });

  const sp = await storage.getStoreProductByStoreAndProduct(storeId, productId);
  if (!sp || !sp.isPublished || !sp.isLeadMagnet) {
    return res.status(400).json({ message: "This product is not available as a free download" });
  }

  const product = await storage.getProductById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const effectivePrice = sp.customPriceCents ?? product.priceCents;
  if (effectivePrice > 0) {
    return res.status(400).json({ message: "This product is not free" });
  }

  const customer = await storage.findOrCreateCustomer(email);

  const result = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({
      storeId: store.id,
      buyerEmail: email.toLowerCase(),
      customerId: customer.id,
      totalCents: 0,
      stripeSessionId: null,
      status: "COMPLETED",
    }).returning();

    await tx.insert(orderItems).values({
      orderId: order.id,
      productId: product.id,
      priceCents: 0,
    });

    const tokenRaw = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tx.insert(downloadTokens).values({
      orderId: order.id,
      tokenHash: tokenRaw,
      expiresAt,
    });

    return { order, downloadToken: tokenRaw };
  });

  await storage.linkOrdersByEmail(email.toLowerCase(), customer.id);

  const sessionToken = randomBytes(32).toString("hex");
  const sessionHash = hashToken(sessionToken);
  const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await storage.createCustomerSession({
    customerId: customer.id,
    tokenHash: sessionHash,
    expiresAt: sessionExpiry,
  });

  res.cookie("customer_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  const baseUrl = getAppUrl(req);
  sendLeadMagnetEmail({
    buyerEmail: email,
    storeName: store.name,
    productTitle: sp.customTitle || product.title,
    downloadToken: result.downloadToken,
    baseUrl,
  });

  res.json({
    orderId: result.order.id,
    downloadToken: result.downloadToken,
    upsellProductId: sp.upsellProductId,
    upsellBundleId: sp.upsellBundleId,
  });
});

ordersRouter.get("/api/claim-free/success/:orderId", async (req, res) => {
  const order = await storage.getOrderById(req.params.orderId as string);
  if (!order || order.totalCents > 0) return res.status(404).json({ message: "Not found" });

  const store = await storage.getStoreById(order.storeId);
  const items = await storage.getOrderItemsByOrder(order.id);
  const product = items[0]?.product;

  const existingTokens = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, order.id));
  const tokenHash = existingTokens.length > 0 ? existingTokens[0].tokenHash : null;

  const sp = product ? await storage.getStoreProductByStoreAndProduct(order.storeId, product.id) : null;

  let upsellProduct = null;
  let upsellBundle = null;

  if (sp?.upsellProductId) {
    const p = await storage.getProductById(sp.upsellProductId);
    if (p) upsellProduct = { id: p.id, title: p.title, description: p.description, priceCents: p.priceCents, thumbnailUrl: p.thumbnailUrl };
  }
  if (sp?.upsellBundleId) {
    const b = await storage.getBundleWithProducts(sp.upsellBundleId);
    if (b) upsellBundle = { id: b.bundle.id, name: b.bundle.name, description: b.bundle.description, priceCents: b.bundle.priceCents, thumbnailUrl: b.bundle.thumbnailUrl, productCount: b.products.length };
  }

  res.json({
    order: { id: order.id, buyerEmail: order.buyerEmail, totalCents: order.totalCents },
    product: product ? { id: product.id, title: sp?.customTitle || product.title, thumbnailUrl: product.thumbnailUrl } : null,
    store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
    downloadToken: tokenHash,
    upsellProduct,
    upsellBundle,
  });
});
// ========== CUSTOMER PORTAL AUTH ==========

const magicLinkRateLimit = new Map<string, number>();

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  magicLinkRateLimit.forEach((timestamp, email) => {
    if (now - timestamp > 120_000) {
      magicLinkRateLimit.delete(email);
    }
  });
}, 5 * 60 * 1000);

// Periodic pruning of expired customer_sessions and stale webhook_events.
// Both grow unboundedly without this — the webhook dedup table only needs
// to remember events for slightly longer than the provider's retry window
// (Stripe ≈ 3 days, PayPal ≈ 25 days). Keep 30 days to be safe.
setInterval(async () => {
  try {
    await db.execute(sql`DELETE FROM customer_sessions WHERE expires_at < NOW()`);
    await db.execute(sql`DELETE FROM webhook_events WHERE processed_at < NOW() - INTERVAL '30 days'`);
  } catch (err) {
    console.error("[cleanup] periodic prune failed:", err);
  }
}, 60 * 60 * 1000);

async function isCustomerAuthenticated(req: Request, res: Response, next: NextFunction) {
  const customerAuth = await getCustomerFromCookie(req);
  if (!customerAuth) return res.status(401).json({ message: "Not logged in" });
  (req as any).customerId = customerAuth.customerId;
  next();
}

ordersRouter.post("/api/customer/login", async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please enter a valid email address." });

  const email = parsed.data.email.toLowerCase();

  const now = Date.now();
  const lastRequest = magicLinkRateLimit.get(email);
  if (lastRequest && now - lastRequest < 60_000) {
    return res.status(429).json({ message: "Please wait a minute before requesting another login link." });
  }
  magicLinkRateLimit.set(email, now);

  const customer = await storage.findOrCreateCustomer(email);
  await storage.linkOrdersByEmail(email, customer.id);

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await storage.createCustomerSession({
    customerId: customer.id,
    tokenHash,
    expiresAt,
  });

  const appUrl = getAppUrl(req);
  const storeSlug = req.body.storeSlug || "";
  const redirectParam = storeSlug ? `&redirect=${encodeURIComponent(`/s/${storeSlug}/portal`)}` : "";
  const magicLink = `${appUrl}/account/verify?token=${rawToken}${redirectParam}`;

  let storeName: string | undefined;
  if (storeSlug) {
    const store = await storage.getStoreBySlug(storeSlug);
    storeName = store?.name;
  }

  await sendMagicLinkEmail({ email, magicLink, storeName });
  audit({ event: "auth.magic_link.sent", email, ...auditMeta(req) });

  res.json({
    message: "A login link has been sent to your email address. Please check your inbox (and spam folder).",
  });
});

ordersRouter.get("/api/customer/verify", async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ message: "Missing token" });

  const tokenHash = hashToken(token);
  const session = await storage.getCustomerSessionByToken(tokenHash);

  if (!session) return res.status(400).json({ message: "Invalid or expired login link" });
  if (new Date() > session.expiresAt) {
    await storage.deleteCustomerSession(session.id);
    return res.status(400).json({ message: "Login link has expired. Please request a new one." });
  }

  // Atomic single-use consumption — if a concurrent verify already consumed this
  // token, our delete returns 0 rows and we reject the duplicate attempt.
  const consumed = await storage.consumeCustomerSession(session.id);
  if (!consumed) {
    return res.status(400).json({ message: "This login link has already been used. Please request a new one." });
  }

  const newSessionToken = randomBytes(32).toString("hex");
  const newTokenHash = hashToken(newSessionToken);
  const newExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await storage.createCustomerSession({
    customerId: session.customerId,
    tokenHash: newTokenHash,
    expiresAt: newExpires,
  });

  res.cookie("customer_session", newSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({ success: true });
});

ordersRouter.get("/api/customer/me", async (req, res) => {
  const customerAuth = await getCustomerFromCookie(req);
  if (!customerAuth) return res.status(401).json({ message: "Not logged in" });
  const customer = await storage.getCustomerById(customerAuth.customerId);
  if (!customer) return res.status(401).json({ message: "Customer not found" });
  res.json({ id: customer.id, email: customer.email });
});

ordersRouter.post("/api/customer/logout", async (req, res) => {
  const sessionToken = req.cookies?.customer_session;
  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    const session = await storage.getCustomerSessionByToken(tokenHash);
    if (session) await storage.deleteCustomerSession(session.id);
  }
  res.clearCookie("customer_session", { path: "/" });
  res.json({ success: true });
});

ordersRouter.get("/api/customer/purchases", isCustomerAuthenticated, async (req, res) => {
  const customerId = (req as any).customerId;
  const storeSlug = req.query.store as string | undefined;
  const customerOrders = await storage.getOrdersByCustomer(customerId);

  const filteredOrders = storeSlug
    ? customerOrders.filter((o) => o.store.slug.toLowerCase() === storeSlug.toLowerCase())
    : customerOrders;

  const purchasesWithItems = await Promise.all(
    filteredOrders.map(async (order) => {
      const items = await storage.getOrderItemsByOrder(order.id);
      return {
        id: order.id,
        totalCents: order.totalCents,
        status: order.status,
        createdAt: order.createdAt,
        store: {
          id: order.store.id,
          name: order.store.name,
          slug: order.store.slug,
        },
        items: await Promise.all(items.map(async (i) => {
          const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, i.productId);
          return {
            id: i.id,
            productId: i.productId,
            title: sp?.customTitle || i.product.title,
            priceCents: i.priceCents,
            thumbnailUrl: i.product.thumbnailUrl,
          };
        })),
      };
    })
  );

  res.json(purchasesWithItems);
});

ordersRouter.get("/api/customer/purchase/:orderId", isCustomerAuthenticated, async (req, res) => {
  const customerId = (req as any).customerId;
  const order = await storage.getOrderById(req.params.orderId as string);
  if (!order || order.customerId !== customerId) {
    return res.status(404).json({ message: "Order not found" });
  }

  const store = await storage.getStoreById(order.storeId);
  const items = await storage.getOrderItemsByOrder(order.id);

  const orderTokens = await db.select().from(downloadTokens).where(eq(downloadTokens.orderId, order.id));
  const activeToken = orderTokens.find(t => !t.expiresAt || t.expiresAt > new Date());

  const itemsWithFiles = await Promise.all(
    items.map(async (item) => {
      const assets = await storage.getFileAssetsByProduct(item.productId);
      const hasFiles = assets.length > 0 || !!item.product.fileUrl;
      const sp = await storage.getStoreProductByStoreAndProduct(order.storeId, item.productId);
      let resolvedAccessUrl = sp?.customAccessUrl || item.product.accessUrl || null;

      if (resolvedAccessUrl && resolvedAccessUrl.includes("/kb/") && activeToken) {
        const sep = resolvedAccessUrl.includes("?") ? "&" : "?";
        resolvedAccessUrl = `${resolvedAccessUrl}${sep}token=${activeToken.tokenHash}`;
      }

      return {
        id: item.id,
        productId: item.productId,
        title: sp?.customTitle || item.product.title,
        priceCents: item.priceCents,
        thumbnailUrl: item.product.thumbnailUrl,
        hasFiles,
        productType: item.product.productType || "digital",
        deliveryInstructions: sp?.customDeliveryInstructions || item.product.deliveryInstructions || null,
        accessUrl: resolvedAccessUrl,
        redemptionCode: sp?.customRedemptionCode || item.product.redemptionCode || null,
        description: sp?.customDescription || item.product.description || null,
      };
    })
  );

  const moreProducts = store ? await storage.getPublishedStoreProducts(store.id) : [];
  const purchasedProductIds = new Set(items.map((i) => i.productId));
  const upsellProducts = moreProducts
    .filter((p) => !purchasedProductIds.has(p.id))
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      title: p.title,
      priceCents: p.priceCents,
      thumbnailUrl: p.thumbnailUrl,
    }));

  res.json({
    order: {
      id: order.id,
      totalCents: order.totalCents,
      status: order.status,
      createdAt: order.createdAt,
    },
    store: store ? { id: store.id, name: store.name, slug: store.slug } : null,
    items: itemsWithFiles,
    upsellProducts,
  });
});

ordersRouter.post("/api/customer/download", isCustomerAuthenticated, async (req, res) => {
  const schema = z.object({ orderItemId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const customerId = (req as any).customerId;

  const allOrders = await storage.getOrdersByCustomer(customerId);
  let foundItem = null;
  let foundOrder = null;

  for (const order of allOrders) {
    const items = await storage.getOrderItemsByOrder(order.id);
    const match = items.find((i) => i.id === parsed.data.orderItemId);
    if (match) {
      foundItem = match;
      foundOrder = order;
      break;
    }
  }

  if (!foundItem || !foundOrder) {
    return res.status(404).json({ message: "Item not found in your purchases" });
  }

  const tokenRaw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await storage.createDownloadToken({
    orderId: foundOrder.id,
    tokenHash: tokenRaw,
    expiresAt,
  });

  res.json({ downloadToken: tokenRaw });
});

ordersRouter.get("/api/download/:token", async (req, res) => {
  const downloadToken = await storage.getDownloadTokenByHash(req.params.token as string);
  if (!downloadToken) return res.status(404).json({ message: "Invalid download token" });

  if (downloadToken.revokedAt) {
    return res.status(410).json({ message: "Download link has been revoked (order was refunded)." });
  }

  if (new Date() > downloadToken.expiresAt) {
    return res.status(410).json({ message: "Download link expired" });
  }

  const order = await storage.getOrderById(downloadToken.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const items = await storage.getOrderItemsByOrder(downloadToken.orderId);
  const files: { name: string; url: string }[] = [];

  for (const item of items) {
    const assets = await storage.getFileAssetsByProduct(item.productId);
    if (assets.length > 0) {
      for (const asset of assets) {
        files.push({ name: asset.originalName, url: asset.storageKey });
      }
    } else if (item.product.fileUrl) {
      files.push({
        name: `${item.product.title.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        url: item.product.fileUrl,
      });
    }
  }

  if (files.length === 0) {
    return res.json({ files: [], message: "No downloadable files for this order." });
  }

  // PDF watermarking: if the store has it enabled AND this is a single-file
  // download AND the file is a PDF, fetch + stamp + stream. Multi-file
  // downloads are not stamped (the JSON list returns raw URLs); buyers
  // hitting per-file URLs through future endpoints can pick this up later.
  if (files.length === 1) {
    const file = files[0];
    const store = await storage.getStoreById(order.storeId);
    const shouldWatermark = !!(store?.pdfWatermarkEnabled) && isPdfFilename(file.name);

    if (shouldWatermark) {
      try {
        const fileUrl = /^https?:\/\//i.test(file.url)
          ? file.url
          : `${(process.env.R2_PUBLIC_URL || "https://cdn.sellisy.com").replace(/\/$/, "")}/${file.url}`;
        const upstream = await fetch(fileUrl);
        if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
        const ct = upstream.headers.get("content-type");
        // Belt-and-suspenders: only stamp if it really looks like a PDF.
        if (!isPdfFilename(file.name) && !isPdfContentType(ct)) {
          return res.redirect(fileUrl);
        }
        const raw = new Uint8Array(await upstream.arrayBuffer());
        const stamped = await watermarkPdf(raw, {
          buyerEmail: order.buyerEmail,
          orderId: order.id,
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`);
        res.setHeader("Cache-Control", "no-store");
        return res.end(Buffer.from(stamped));
      } catch (err: any) {
        console.error("[pdf-watermark] fallback to redirect:", err?.message || err);
        // Fall through to the plain redirect below.
      }
    }
    return res.redirect(file.url);
  }

  res.json({ files });
});
