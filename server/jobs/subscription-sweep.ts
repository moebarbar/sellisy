// Subscription lifecycle sweep — repeatable BullMQ job (every 6h).
//
// Sellers don't configure Stripe webhooks, so this is the push half of
// lifecycle freshness (the pull half is lazy re-verification at content
// access). For every subscription that hasn't been verified in 12h or has
// lapsed past its paid-through date, sync from Stripe and email the buyer
// on STATE TRANSITIONS only:
//   active → past_due   "payment issue" (Stripe keeps retrying the card)
//   any    → canceled   "subscription ended" with a resubscribe link
// Re-running never re-emails: transitions are detected by comparing the
// stored status against the freshly-synced one.

import type { Job } from 'bullmq';
import { storage } from '../storage';
import { syncMemberSubscriptionFromStripe } from '../memberAccess';
import { sendSubscriptionPaymentFailedEmail, sendSubscriptionEndedEmail } from '../emails';
import { storePublicUrl } from '../lib/store-url';

const VERIFIED_BEFORE_MS = 12 * 60 * 60 * 1000;

export async function processSubscriptionSweep(_job: Job) {
  const baseUrl = (process.env.APP_URL || 'https://sellisy.com').replace(/\/$/, '');
  const cutoff = new Date(Date.now() - VERIFIED_BEFORE_MS);
  const stale = await storage.getMemberSubscriptionsNeedingVerification(cutoff);
  if (stale.length === 0) {
    console.log('[subscription-sweep] nothing to verify');
    return;
  }

  let synced = 0;
  let emailed = 0;
  for (const sub of stale) {
    try {
      const before = sub.status;
      const after = await syncMemberSubscriptionFromStripe(sub);
      synced++;
      if (before === after.status) continue;

      const store = await storage.getStoreById(sub.storeId);
      const product = await storage.getProductById(sub.productId);
      if (!store || !product || !sub.buyerEmail) continue;

      if (after.status === 'past_due') {
        await sendSubscriptionPaymentFailedEmail({
          buyerEmail: sub.buyerEmail,
          storeName: store.name,
          productTitle: product.title,
          portalUrl: `${baseUrl}/account/purchases`,
        });
        emailed++;
      } else if (after.status === 'canceled') {
        await sendSubscriptionEndedEmail({
          buyerEmail: sub.buyerEmail,
          storeName: store.name,
          productTitle: product.title,
          productUrl: storePublicUrl(store, baseUrl, `/product/${sub.productId}`),
        });
        emailed++;
      }
    } catch (err: any) {
      console.error('[subscription-sweep] failed for sub:', sub.id, err.message);
    }
  }

  console.log(`[subscription-sweep] synced ${synced}/${stale.length}, ${emailed} lifecycle emails sent`);
}
