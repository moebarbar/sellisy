// AI Store Launcher API.
//
//   POST /api/ai-launch      — start a launch (validated, tier-gated,
//                              rate-limited three ways)
//   GET  /api/ai-launch/:id  — poll progress (owner-only)
//
// Mounted in registerRoutes as: app.use(aiLaunchRouter)

import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";

import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { PLAN_FEATURES } from "@shared/schema";
import { audit } from "../audit";
import { getUserId, getUserPlanTier } from "./_helpers";

export const aiLaunchRouter = Router();

// Per-IP backstop; the real quota is per-user in the DB below.
const launchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many launch attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const MAX_LAUNCHES_PER_DAY = 5;
// A run silently killed mid-flight (deploy restart, Redis flush) must not
// block the user forever — consider it dead after this long without a
// status update and let them retry.
const STUCK_RUN_MS = 10 * 60 * 1000;

aiLaunchRouter.post("/api/ai-launch", launchLimiter, isAuthenticated, async (req, res) => {
  const schema = z.object({ prompt: z.string().min(10).max(300) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Describe what you sell in 10-300 characters — e.g. \"Notion templates for freelance designers\"" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ message: "AI launching is not configured on this server" });
  }
  if (!process.env.REDIS_URL) {
    return res.status(503).json({ message: "AI launching is temporarily unavailable" });
  }

  const userId = getUserId(req);
  const tier = await getUserPlanTier(userId);
  const features = PLAN_FEATURES[tier];

  // The launcher imports library products, so it needs the same gate as
  // manual imports. Trial users are effectively pro, so new signups pass.
  if (!features.importProducts) {
    return res.status(403).json({
      message: "AI store launching stocks your store from the product library, which needs the Growth plan. Start a free trial or upgrade to use it.",
      upgradeRequired: true,
    });
  }

  const existingStores = await storage.getStoresByOwner(userId);
  if (existingStores.length >= features.maxStores) {
    return res.status(403).json({
      message: `Your ${tier} plan allows up to ${features.maxStores} store(s). Remove a store or upgrade to launch another.`,
      upgradeRequired: true,
    });
  }

  // One launch at a time per user; auto-fail runs that died mid-flight.
  const active = await storage.getActiveAiLaunchForUser(userId);
  if (active) {
    if (Date.now() - new Date(active.updatedAt).getTime() > STUCK_RUN_MS) {
      await storage.updateAiLaunch(active.id, { status: "failed", error: "The previous launch timed out." });
    } else {
      return res.status(409).json({ message: "A launch is already in progress", launchId: active.id });
    }
  }

  // Per-user daily quota — each launch is two paid AI calls.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await storage.countRecentAiLaunches(userId, dayAgo);
  if (recent >= MAX_LAUNCHES_PER_DAY) {
    return res.status(429).json({ message: `You've used all ${MAX_LAUNCHES_PER_DAY} AI launches for today. Try again tomorrow, or create a store manually.` });
  }

  const launch = await storage.createAiLaunch({
    userId,
    prompt: parsed.data.prompt.trim(),
    status: "pending",
  });

  // Double-submit guard: the active-launch check above races with itself
  // across parallel POSTs. After creating our row, look again — if an
  // OLDER non-terminal launch exists, ours is the duplicate; fail it and
  // point the client at the original.
  const concurrent = await storage.getActiveAiLaunchForUser(userId);
  if (concurrent && concurrent.id !== launch.id && new Date(concurrent.createdAt) <= new Date(launch.createdAt)) {
    await storage.updateAiLaunch(launch.id, { status: "failed", error: "Duplicate submission" });
    return res.status(409).json({ message: "A launch is already in progress", launchId: concurrent.id });
  }

  try {
    const { aiLaunchQueue } = await import("../queue/queues");
    await aiLaunchQueue.add(
      "ai-launch",
      { launchId: launch.id, userId, prompt: parsed.data.prompt.trim(), userTier: tier },
      { jobId: `ai-launch-${launch.id}` },
    );
  } catch (err: any) {
    console.error("[ai-launch] enqueue failed:", err.message);
    await storage.updateAiLaunch(launch.id, { status: "failed", error: "Couldn't start the launch. Please try again." });
    return res.status(503).json({ message: "Couldn't start the launch. Please try again." });
  }

  audit({ event: "ai.launch_queued", details: `AI launch ${launch.id} queued for user ${userId}` });
  res.status(202).json({ id: launch.id, status: "pending" });
});

aiLaunchRouter.get("/api/ai-launch/:id", isAuthenticated, async (req, res) => {
  const launch = await storage.getAiLaunchById(req.params.id as string);
  if (!launch || launch.userId !== getUserId(req)) {
    return res.status(404).json({ message: "Launch not found" });
  }
  res.json({
    id: launch.id,
    status: launch.status,
    storeId: launch.storeId,
    storeSlug: launch.storeSlug,
    productCount: launch.productCount,
    error: launch.error,
    createdAt: launch.createdAt,
  });
});
