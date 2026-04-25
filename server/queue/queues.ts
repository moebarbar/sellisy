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
