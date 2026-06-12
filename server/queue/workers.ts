import { Worker, type Job } from 'bullmq';
import { redisConnection } from './connection';
import { audit } from '../audit';
import { captureException } from '../sentry';

// Centralize failure handling so every worker gets:
//   1. console.error (existing behavior, still useful in Railway logs)
//   2. structured audit log — distinguishes retryable failures from
//      "this job is dead, give up" terminal failures
//   3. Sentry capture on TERMINAL failure only (avoids spamming Sentry
//      with every transient retry — e.g. one-off Gumroad 503)
//
// Previous version just did console.error on every fail event, so a job
// dying after 3 retries looked the same as a transient blip — and neither
// surfaced anywhere except the Railway log scroll.
function attachFailHandler(worker: Worker, queueName: string) {
  worker.on('failed', (job: Job | undefined, err: Error) => {
    const attempts = job?.attemptsMade ?? 0;
    const maxAttempts = (job?.opts?.attempts as number | undefined) ?? 1;
    const exhausted = attempts >= maxAttempts;

    console.error(
      `[${queueName}] job ${job?.id} failed (attempt ${attempts}/${maxAttempts})${exhausted ? ' — DEAD' : ' — will retry'}:`,
      err.message,
    );

    audit({
      event: exhausted ? 'queue.job_dead' : 'queue.job_failed',
      details: `${queueName} job ${job?.id ?? '?'} ${exhausted ? 'permanently failed' : 'failed (will retry)'} after attempt ${attempts}/${maxAttempts}: ${err.message}`,
    });

    if (exhausted) {
      // Terminal — Sentry. Tag with queue + jobId so issues group correctly.
      const enriched = new Error(`[${queueName}] terminal job failure: ${err.message}`);
      (enriched as any).cause = err;
      (enriched as any).jobId = job?.id;
      (enriched as any).queueName = queueName;
      captureException(enriched);
    }
  });

  worker.on('error', (err) => {
    // Worker-level errors (Redis disconnect, etc.) — not per-job. Always
    // Sentry these; they almost always need ops attention.
    console.error(`[${queueName}] worker error:`, err.message);
    captureException(err);
  });
}

export async function startWorkers() {
  try {
    const { processGumroadImport } = await import('../jobs/gumroad-import');
    const gumroadImportWorker = new Worker(
      'gumroad-import',
      async (job) => processGumroadImport(job),
      { connection: redisConnection, concurrency: 2 },
    );
    attachFailHandler(gumroadImportWorker, 'gumroad-import');
    gumroadImportWorker.on('completed', (job) => {
      console.log(`[gumroad-import] job ${job.id} completed`);
    });
    console.log('[queue] gumroad-import worker started');
  } catch (err: any) {
    console.warn('[queue] gumroad-import worker not started:', err.message);
  }

  try {
    const { processAiLaunch } = await import('../jobs/ai-launch');
    const aiLaunchWorker = new Worker(
      'ai-launch',
      async (job) => processAiLaunch(job),
      { connection: redisConnection, concurrency: 2 },
    );
    attachFailHandler(aiLaunchWorker, 'ai-launch');
    aiLaunchWorker.on('completed', (job) => {
      console.log(`[ai-launch] job ${job.id} completed`);
    });
    console.log('[queue] ai-launch worker started');
  } catch (err: any) {
    console.warn('[queue] ai-launch worker not started:', err.message);
  }

  try {
    const { processBrainJob } = await import('../jobs/brain-report');
    const brainWorker = new Worker(
      'brain-report',
      async (job) => processBrainJob(job),
      { connection: redisConnection, concurrency: 1, limiter: { max: 20, duration: 60_000 } },
    );
    attachFailHandler(brainWorker, 'brain-report');
    brainWorker.on('completed', (job) => {
      console.log(`[brain-report] job ${job.id} (${job.name}) completed`);
    });
    // Weekly sweep — Mondays 09:00 UTC. Deterministic jobId upserts the
    // schedule across restarts.
    const { brainReportQueue } = await import('./queues');
    await brainReportQueue.add('weekly-sweep', {}, {
      repeat: { pattern: '0 9 * * 1' },
      jobId: 'brain-weekly-sweep',
    });
    console.log('[queue] brain-report worker started (weekly sweep Mondays 09:00 UTC)');
  } catch (err: any) {
    console.warn('[queue] brain-report worker not started:', err.message);
  }

  try {
    const { processSubscriptionSweep } = await import('../jobs/subscription-sweep');
    const sweepWorker = new Worker(
      'subscription-sweep',
      async (job) => processSubscriptionSweep(job),
      { connection: redisConnection, concurrency: 1 },
    );
    attachFailHandler(sweepWorker, 'subscription-sweep');
    sweepWorker.on('completed', (job) => {
      console.log(`[subscription-sweep] job ${job.id} completed`);
    });
    // Repeatable schedule — every 6h. Deterministic jobId means restarts
    // upsert the same schedule instead of stacking duplicates.
    const { subscriptionSweepQueue } = await import('./queues');
    await subscriptionSweepQueue.add('sweep', {}, {
      repeat: { every: 6 * 60 * 60 * 1000 },
      jobId: 'subscription-sweep-repeat',
    });
    console.log('[queue] subscription-sweep worker started (every 6h)');
  } catch (err: any) {
    console.warn('[queue] subscription-sweep worker not started:', err.message);
  }

  try {
    const { processPostPurchase } = await import('../jobs/post-purchase');
    const postPurchaseWorker = new Worker(
      'post-purchase',
      async (job) => processPostPurchase(job),
      { connection: redisConnection, concurrency: 1, limiter: { max: 60, duration: 60_000 } },
    );
    attachFailHandler(postPurchaseWorker, 'post-purchase');
    postPurchaseWorker.on('completed', (job) => {
      console.log(`[post-purchase] job ${job.id} completed`);
    });
    console.log('[queue] post-purchase worker started');
  } catch (err: any) {
    console.warn('[queue] post-purchase worker not started:', err.message);
  }

  try {
    const { processReviewRequest } = await import('../jobs/review-request');
    const reviewRequestWorker = new Worker(
      'review-request',
      async (job) => processReviewRequest(job),
      { connection: redisConnection, concurrency: 1, limiter: { max: 60, duration: 60_000 } },
    );
    attachFailHandler(reviewRequestWorker, 'review-request');
    reviewRequestWorker.on('completed', (job) => {
      console.log(`[review-request] job ${job.id} completed`);
    });
    console.log('[queue] review-request worker started');
  } catch (err: any) {
    console.warn('[queue] review-request worker not started:', err.message);
  }

  try {
    const { processGumroadWelcomeEmails } = await import('../jobs/gumroad-welcome-emails');
    const welcomeEmailsWorker = new Worker(
      'gumroad-welcome-emails',
      async (job) => processGumroadWelcomeEmails(job),
      { connection: redisConnection, concurrency: 1, limiter: { max: 100, duration: 60_000 } },
    );
    attachFailHandler(welcomeEmailsWorker, 'gumroad-welcome-emails');
    welcomeEmailsWorker.on('completed', (job) => {
      console.log(`[gumroad-welcome-emails] job ${job.id} completed`);
    });
    console.log('[queue] gumroad-welcome-emails worker started');
  } catch (err: any) {
    console.warn('[queue] gumroad-welcome-emails worker not started:', err.message);
  }
}
