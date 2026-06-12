// Subscription access gate. One-time purchases pass straight through; for
// orders backed by a member subscription, access requires the subscription
// to still be live.
//
// Sellers don't configure Stripe webhooks, so freshness comes from lazy
// re-verification: when a gated order is accessed and the row hasn't been
// verified in REVERIFY_AFTER_MS, we fetch the subscription from Stripe with
// the store's own key and sync status/period. A Stripe outage falls back to
// the stored state (with the post-period grace window absorbing brief lag).

import Stripe from "stripe";
import { storage } from "./storage";
import { decryptPaymentSecret } from "./crypto/payment-secret";
import type { MemberSubscription } from "@shared/schema";

const REVERIFY_AFTER_MS = 12 * 60 * 60 * 1000; // 12h
const GRACE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days past period end

export function mapStripeSubStatus(s: string): MemberSubscription["status"] {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled") return "canceled";
  return "incomplete";
}

export async function syncMemberSubscriptionFromStripe(sub: MemberSubscription): Promise<MemberSubscription> {
  const store = await storage.getStoreById(sub.storeId);
  if (!store?.stripeSecretKey) return sub;
  const stripe = new Stripe(decryptPaymentSecret(store.stripeSecretKey)!, { apiVersion: "2025-11-17.clover" as any });
  const s: any = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const periodEnd = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  const updated = await storage.updateMemberSubscription(sub.id, {
    status: mapStripeSubStatus(s.status),
    cancelAtPeriodEnd: !!s.cancel_at_period_end,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : sub.currentPeriodEnd,
    canceledAt: s.canceled_at ? new Date(s.canceled_at * 1000) : sub.canceledAt,
    lastVerifiedAt: new Date(),
  });
  return updated ?? sub;
}

export async function checkSubscriptionAccess(orderId: string): Promise<
  | { allowed: true }
  | { allowed: false; status: number; message: string }
> {
  const sub = await storage.getMemberSubscriptionByOrderId(orderId);
  if (!sub) return { allowed: true }; // not a subscription order

  let current = sub;
  if (Date.now() - new Date(sub.lastVerifiedAt).getTime() > REVERIFY_AFTER_MS) {
    try {
      current = await syncMemberSubscriptionFromStripe(sub);
    } catch (err: any) {
      console.warn("[memberships] re-verify failed, using stored state:", sub.id, err.message);
    }
  }

  if (current.status === "active") return { allowed: true };
  if (current.currentPeriodEnd && Date.now() <= new Date(current.currentPeriodEnd).getTime() + GRACE_MS) {
    return { allowed: true };
  }
  return {
    allowed: false,
    status: 403,
    message: current.status === "past_due"
      ? "There's a payment issue with your subscription. Update your payment method to restore access."
      : "Your subscription has ended. Resubscribe to regain access.",
  };
}
