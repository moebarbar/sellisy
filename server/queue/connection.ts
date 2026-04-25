import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is required for the job queue. Set it in .env (e.g. redis://localhost:6379)');
}

export const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,  // required by BullMQ
  enableReadyCheck: false,     // required by BullMQ
});

redisConnection.on('error', (err) => {
  console.error('[redis] connection error:', err);
});
