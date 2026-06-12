import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const gumroadImportQueue = new Queue('gumroad-import', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const gumroadWelcomeEmailsQueue = new Queue('gumroad-welcome-emails', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

// Subscription lifecycle sweep — a single repeatable job (scheduled in
// workers.ts) that re-verifies stale member subscriptions against Stripe
// and emails buyers on past_due/canceled transitions.
export const subscriptionSweepQueue = new Queue('subscription-sweep', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 50 },
  },
});

// Post-purchase cross-sell recommendation, ~24h after completion.
// Same enqueue point + idempotency scheme as review-request below.
export const postPurchaseQueue = new Queue('post-purchase', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 200 },
  },
});

// Post-purchase review requests. Jobs are enqueued with a multi-day delay
// at order completion (see orderEmailHelper.ts) and a deterministic jobId
// of review-request-<orderId> so re-processing a webhook can't double-book.
export const reviewRequestQueue = new Queue('review-request', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 200 },
  },
});
