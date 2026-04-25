import { Worker } from 'bullmq';
import { redisConnection } from './connection';

export function startWorkers() {
  try {
    const { processGumroadImport } = require('../jobs/gumroad-import');
    const gumroadImportWorker = new Worker(
      'gumroad-import',
      async (job) => processGumroadImport(job),
      { connection: redisConnection, concurrency: 2 },
    );
    gumroadImportWorker.on('failed', (job, err) => {
      console.error(`[gumroad-import] job ${job?.id} failed:`, err.message);
    });
    gumroadImportWorker.on('completed', (job) => {
      console.log(`[gumroad-import] job ${job.id} completed`);
    });
    console.log('[queue] gumroad-import worker started');
  } catch (err: any) {
    console.warn('[queue] gumroad-import worker not started:', err.message);
  }

  try {
    const { processGumroadWelcomeEmails } = require('../jobs/gumroad-welcome-emails');
    const welcomeEmailsWorker = new Worker(
      'gumroad-welcome-emails',
      async (job) => processGumroadWelcomeEmails(job),
      { connection: redisConnection, concurrency: 1, limiter: { max: 100, duration: 60_000 } },
    );
    welcomeEmailsWorker.on('failed', (job, err) => {
      console.error(`[gumroad-welcome-emails] job ${job?.id} failed:`, err.message);
    });
    welcomeEmailsWorker.on('completed', (job) => {
      console.log(`[gumroad-welcome-emails] job ${job.id} completed`);
    });
    console.log('[queue] gumroad-welcome-emails worker started');
  } catch (err: any) {
    console.warn('[queue] gumroad-welcome-emails worker not started:', err.message);
  }
}
