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
