// Sellisy Brain jobs.
//
// Two job names on the brain-report queue:
//   'weekly-sweep'  — repeatable (Mondays); fans out one 'generate' job per
//                     eligible store so each store retries independently
//   'generate'      — { storeId, email } → collect metrics, generate the
//                     plan, store the report, optionally email the owner
//
// Idempotency: 'generate' skips stores that already have a report from the
// last 5 days, so a re-delivered sweep or retry can't double-email.

import type { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '@shared/models/auth';
import { collectBrainMetrics, generateBrainPlan } from '../ai/brain';
import { sendBrainReportEmail } from '../emails';
import { storePublicUrl } from '../lib/store-url';

export interface BrainGenerateJobData {
  storeId: string;
  email: boolean;
}

const FRESH_REPORT_MS = 5 * 24 * 60 * 60 * 1000;

export async function processBrainJob(job: Job) {
  if (job.name === 'weekly-sweep') {
    const storeIds = await storage.getBrainEligibleStoreIds();
    if (storeIds.length === 0) {
      console.log('[brain] sweep: no eligible stores');
      return;
    }
    const { brainReportQueue } = await import('../queue/queues');
    for (const storeId of storeIds) {
      // Deterministic per-week jobId: re-running the sweep can't fan out
      // duplicates within the same ISO week.
      const week = new Date().toISOString().slice(0, 10);
      await brainReportQueue.add('generate', { storeId, email: true } satisfies BrainGenerateJobData, {
        jobId: `brain-${storeId}-${week}`,
      });
    }
    console.log(`[brain] sweep queued ${storeIds.length} stores`);
    return;
  }

  // ── generate ────────────────────────────────────────────────────────
  const { storeId, email } = job.data as BrainGenerateJobData;
  const store = await storage.getStoreById(storeId);
  if (!store || store.deletedAt) return;

  if (await storage.hasBrainReportSince(storeId, new Date(Date.now() - FRESH_REPORT_MS))) {
    console.log(`[brain] ${storeId}: fresh report exists — skipping`);
    return;
  }

  const metrics = await collectBrainMetrics(storeId);
  const plan = await generateBrainPlan(store.name, metrics);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const report = await storage.createBrainReport({
    storeId,
    periodStart,
    periodEnd,
    summary: plan.summary,
    actionsJson: JSON.stringify(plan.actions),
    metricsJson: JSON.stringify(metrics),
  });

  if (email) {
    try {
      const [owner] = await db.select().from(users).where(eq(users.id, store.ownerId));
      if (owner?.email) {
        const baseUrl = (process.env.APP_URL || 'https://sellisy.com').replace(/\/$/, '');
        await sendBrainReportEmail({
          ownerEmail: owner.email,
          storeName: store.name,
          summary: plan.summary,
          actions: plan.actions,
          dashboardUrl: `${baseUrl}/dashboard/brain`,
        });
        await storage.markBrainReportEmailed(report.id);
      }
    } catch (err: any) {
      console.error(`[brain] ${storeId}: report stored but email failed:`, err.message);
    }
  }

  console.log(`[brain] report generated for ${store.slug} (${plan.actions.length} actions)`);
}
