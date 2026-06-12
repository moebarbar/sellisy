// AI Store Launcher job — drives the pipeline in server/ai/launcher.ts and
// keeps the ai_launches row in sync so the client can poll progress.
//
// Stage order matters: both AI stages complete and validate BEFORE assembly
// starts, so an AI failure costs nothing and an assembly failure rolls
// itself back (see assembleStore). The launch row's storeId is only set on
// full success.

import type { Job } from 'bullmq';
import { PLAN_FEATURES, type PlanTier } from '@shared/schema';
import { storage } from '../storage';
import {
  condenseCatalog,
  generateIdentity,
  selectProducts,
  assembleStore,
  LaunchValidationError,
} from '../ai/launcher';
import { AnthropicError } from '../lib/anthropic';

export interface AiLaunchJobData {
  launchId: string;
  userId: string;
  prompt: string;
  userTier: PlanTier;
}

function friendlyError(err: unknown): string {
  if (err instanceof LaunchValidationError) {
    return `The AI couldn't produce a usable store plan (${err.message}). Try a more specific description of what you sell.`;
  }
  if (err instanceof AnthropicError) {
    return "The AI service is briefly unavailable. Please try again in a minute.";
  }
  return "Something went wrong while building your store. Please try again.";
}

export async function processAiLaunch(job: Job<AiLaunchJobData>) {
  const { launchId, userId, prompt, userTier } = job.data;

  const launch = await storage.getAiLaunchById(launchId);
  if (!launch || launch.status === 'completed' || launch.status === 'failed') return;

  try {
    // Re-check the store cap at run time — the queue may lag behind a
    // manual store creation that happened after enqueue.
    const existing = await storage.getStoresByOwner(userId);
    if (existing.length >= PLAN_FEATURES[userTier].maxStores) {
      await storage.updateAiLaunch(launchId, {
        status: 'failed',
        error: `Your plan allows up to ${PLAN_FEATURES[userTier].maxStores} store(s). Remove a store or upgrade, then try again.`,
      });
      return;
    }

    // ── Stage 1: identity + copy (pure) ──────────────────────────────
    await storage.updateAiLaunch(launchId, { status: 'analyzing' });
    const identity = await generateIdentity(prompt);

    // ── Stage 2: product selection (pure, validated vs real catalog) ─
    await storage.updateAiLaunch(launchId, { status: 'selecting' });
    const library = await storage.getLibraryProducts();
    const catalog = condenseCatalog(library, userTier);
    const selection = await selectProducts(prompt, identity, catalog);

    // ── Stage 3: assembly (deterministic, self-rolling-back) ─────────
    await storage.updateAiLaunch(launchId, { status: 'assembling' });
    const result = await assembleStore({ userId, identity, selection, maxStores: PLAN_FEATURES[userTier].maxStores });

    await storage.updateAiLaunch(launchId, {
      status: 'completed',
      storeId: result.storeId,
      storeSlug: result.slug,
      productCount: result.productCount,
    });
    console.log(`[ai-launch] ${launchId} completed: store ${result.slug} with ${result.productCount} products`);
  } catch (err: any) {
    console.error(`[ai-launch] ${launchId} failed:`, err.message);
    await storage.updateAiLaunch(launchId, { status: 'failed', error: friendlyError(err) });
    // Don't rethrow — the launch row is the source of truth and a BullMQ
    // retry would re-run AI stages against an already-failed row.
  }
}
