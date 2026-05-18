import { Router, type Request, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { createHash } from "crypto";
import { storage } from "../storage";
import { db } from "../db";
import { affiliates, affiliateCommissions, stores, PLAN_FEATURES, type PlanTier } from "@shared/schema";
import { isAuthenticated } from "../replit_integrations/auth";
import { and, eq, desc, inArray } from "drizzle-orm";
import { audit } from "../audit";

export const affiliateRouter = Router();

function getUserId(req: Request): string {
  return req.sellisyUserId!;
}

// ── Public click endpoint ─────────────────────────────────────────────

const clickSchema = z.object({
  storeSlug: z.string().min(1).max(80),
  ref: z.string().min(1).max(80),
  path: z.string().max(500).optional(),
});

const clickLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, reason: "rate_limited" },
});

function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  return req.ip || req.socket.remoteAddress || "unknown";
}

affiliateRouter.post("/click", clickLimiter, async (req: Request, res: Response) => {
  const parsed = clickSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, reason: "invalid_body" });

  const { storeSlug, ref, path } = parsed.data;

  const store = await storage.getStoreBySlug(storeSlug);
  if (!store || store.deletedAt) return res.json({ ok: false });
  if (!store.affiliateProgramEnabled) return res.json({ ok: false });

  const ownerProfile = await storage.getUserProfile(store.ownerId);
  const ownerTier = (ownerProfile?.planTier as PlanTier) || "basic";
  if (!PLAN_FEATURES[ownerTier].affiliateProgram) return res.json({ ok: false });

  const affiliate = await storage.getAffiliateByCode(store.id, ref);
  if (!affiliate || affiliate.status !== "active") return res.json({ ok: false });
  if (affiliate.userId === store.ownerId) return res.json({ ok: false });

  const ipHash = hash(getClientIp(req) + ":" + store.id);
  const uaHash = hash((req.headers["user-agent"] || "") + ":" + store.id);
  const referrer = typeof req.headers.referer === "string" ? req.headers.referer.slice(0, 500) : null;

  const dup = await storage.hasRecentClick(affiliate.id, ipHash, 60);
  if (!dup) {
    await storage.recordAffiliateClick({
      affiliateId: affiliate.id,
      storeId: store.id,
      landingPath: path || null,
      referrer,
      userAgentHash: uaHash,
      ipHash,
    });
  }

  res.json({ ok: true, affiliateId: affiliate.id, cookieDays: store.affiliateCookieDays });
});

// ── Owner-side management endpoints ───────────────────────────────────

async function requireStoreOwner(req: Request, storeId: string): Promise<{ ok: true; store: any } | { ok: false; status: number; message: string }> {
  const store = await storage.getStoreById(storeId);
  if (!store) return { ok: false, status: 404, message: "Store not found" };
  if (store.ownerId !== getUserId(req)) return { ok: false, status: 403, message: "Forbidden" };
  return { ok: true, store };
}

async function requireAffiliateTier(req: Request): Promise<boolean> {
  const profile = await storage.getUserProfile(getUserId(req));
  const tier = (profile?.planTier as PlanTier) || "basic";
  return PLAN_FEATURES[tier].affiliateProgram;
}

// GET /api/affiliate/settings?storeId=...
affiliateRouter.get("/settings", isAuthenticated, async (req: Request, res: Response) => {
  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const check = await requireStoreOwner(req, storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  res.json({
    enabled: check.store.affiliateProgramEnabled,
    defaultRateBps: check.store.affiliateDefaultRateBps,
    cookieDays: check.store.affiliateCookieDays,
    minPayoutCents: check.store.affiliateMinPayoutCents,
    termsHtml: check.store.affiliateTermsHtml || "",
  });
});

// PUT /api/affiliate/settings
const settingsSchema = z.object({
  storeId: z.string(),
  enabled: z.boolean().optional(),
  defaultRateBps: z.number().int().min(100).max(8000).optional(),
  cookieDays: z.number().int().min(1).max(365).optional(),
  minPayoutCents: z.number().int().min(0).max(1_000_000).optional(),
  termsHtml: z.string().max(20_000).optional(),
});
affiliateRouter.put("/settings", isAuthenticated, async (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const check = await requireStoreOwner(req, parsed.data.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  // Enabling the program requires Growth+ tier. Disabling is always allowed.
  if (parsed.data.enabled === true && !(await requireAffiliateTier(req))) {
    return res.status(403).json({ message: "Affiliate program requires a Growth plan or higher." });
  }

  const updates: any = { updatedAt: new Date() };
  if (parsed.data.enabled !== undefined) updates.affiliateProgramEnabled = parsed.data.enabled;
  if (parsed.data.defaultRateBps !== undefined) updates.affiliateDefaultRateBps = parsed.data.defaultRateBps;
  if (parsed.data.cookieDays !== undefined) updates.affiliateCookieDays = parsed.data.cookieDays;
  if (parsed.data.minPayoutCents !== undefined) updates.affiliateMinPayoutCents = parsed.data.minPayoutCents;
  if (parsed.data.termsHtml !== undefined) updates.affiliateTermsHtml = parsed.data.termsHtml;

  await db.update(stores).set(updates).where(eq(stores.id, parsed.data.storeId));
  audit({ event: "store.created", details: `Affiliate settings updated for store ${parsed.data.storeId}` });
  res.json({ ok: true });
});

// GET /api/affiliate/affiliates?storeId=...
affiliateRouter.get("/affiliates", isAuthenticated, async (req: Request, res: Response) => {
  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const check = await requireStoreOwner(req, storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const list = await storage.getAffiliatesByStore(storeId);

  const enriched = await Promise.all(list.map(async (a) => {
    const commissions = await storage.getCommissionsByAffiliate(a.id);
    const earnedCents = commissions
      .filter((c) => c.status === "approved" || c.status === "paid")
      .reduce((sum, c) => sum + c.commissionCents, 0);
    const pendingCents = commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.commissionCents, 0);
    return { ...a, conversions: commissions.length, earnedCents, pendingCents };
  }));

  res.json(enriched);
});

// POST /api/affiliate/affiliates — create
const createAffiliateSchema = z.object({
  storeId: z.string(),
  userId: z.string().optional(),
  code: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/i, "Code must be lowercase letters, numbers, dashes"),
  commissionRateBps: z.number().int().min(100).max(8000).optional(),
  payoutEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
});
affiliateRouter.post("/affiliates", isAuthenticated, async (req: Request, res: Response) => {
  const parsed = createAffiliateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const check = await requireStoreOwner(req, parsed.data.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  if (!(await requireAffiliateTier(req))) {
    return res.status(403).json({ message: "Affiliate program requires a Growth plan or higher." });
  }

  // For MVP without an invite-accept flow, generate a placeholder userId tied
  // to the code. When PR #4 ships the invite/accept flow, the affiliate's
  // userId will be replaced with their real users.id on acceptance.
  const userIdForAffiliate = parsed.data.userId || `placeholder-${parsed.data.code}-${Date.now()}`;
  if (userIdForAffiliate === check.store.ownerId) {
    return res.status(400).json({ message: "You can't be your own affiliate." });
  }

  try {
    const affiliate = await storage.createAffiliate({
      storeId: parsed.data.storeId,
      userId: userIdForAffiliate,
      code: parsed.data.code,
      status: "active",
      commissionRateBps: parsed.data.commissionRateBps ?? check.store.affiliateDefaultRateBps,
      payoutEmail: parsed.data.payoutEmail ?? null,
      notes: parsed.data.notes ?? null,
    });
    audit({ event: "store.created", details: `Affiliate created: ${affiliate.id} (code=${affiliate.code}) for store ${parsed.data.storeId}` });
    res.json(affiliate);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: "An affiliate with that code already exists for this store." });
    }
    console.error("[affiliate] create failed:", err);
    res.status(500).json({ message: "Failed to create affiliate." });
  }
});

// PATCH /api/affiliate/affiliates/:id
const updateAffiliateSchema = z.object({
  status: z.enum(["active", "paused", "rejected"]).optional(),
  commissionRateBps: z.number().int().min(100).max(8000).optional(),
  payoutEmail: z.string().email().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
affiliateRouter.patch("/affiliates/:id", isAuthenticated, async (req: Request, res: Response) => {
  const aff = await storage.getAffiliateById(String(req.params.id));
  if (!aff) return res.status(404).json({ message: "Affiliate not found" });

  const check = await requireStoreOwner(req, aff.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = updateAffiliateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const updated = await storage.updateAffiliate(String(req.params.id), parsed.data as any);
  res.json(updated);
});

// DELETE /api/affiliate/affiliates/:id
affiliateRouter.delete("/affiliates/:id", isAuthenticated, async (req: Request, res: Response) => {
  const aff = await storage.getAffiliateById(String(req.params.id));
  if (!aff) return res.status(404).json({ message: "Affiliate not found" });

  const check = await requireStoreOwner(req, aff.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await storage.softDeleteAffiliate(String(req.params.id));
  res.json({ ok: true });
});

// GET /api/affiliate/commissions?storeId=...&status=pending
affiliateRouter.get("/commissions", isAuthenticated, async (req: Request, res: Response) => {
  const storeId = req.query.storeId as string;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (!storeId) return res.status(400).json({ message: "storeId required" });

  const check = await requireStoreOwner(req, storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const conditions = [eq(affiliateCommissions.storeId, storeId)];
  if (status && ["pending", "approved", "paid", "void"].includes(status)) {
    conditions.push(eq(affiliateCommissions.status, status as any));
  }

  const rows = await db.select().from(affiliateCommissions)
    .where(and(...conditions))
    .orderBy(desc(affiliateCommissions.createdAt))
    .limit(200);

  const affiliateIds = Array.from(new Set(rows.map((r) => r.affiliateId)));
  const affs = affiliateIds.length
    ? await db.select().from(affiliates).where(inArray(affiliates.id, affiliateIds))
    : [];
  const affMap = new Map(affs.map((a) => [a.id, a]));

  res.json(rows.map((r) => ({ ...r, affiliateCode: affMap.get(r.affiliateId)?.code ?? null })));
});

// GET /api/affiliate/stats?storeId=...
affiliateRouter.get("/stats", isAuthenticated, async (req: Request, res: Response) => {
  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const check = await requireStoreOwner(req, storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const all = await db.select().from(affiliateCommissions).where(eq(affiliateCommissions.storeId, storeId));
  const sum = (rows: typeof all) => rows.reduce((s, r) => s + r.commissionCents, 0);

  const affCount = (await storage.getAffiliatesByStore(storeId)).length;

  res.json({
    affiliates: affCount,
    conversions: all.length,
    pendingCents: sum(all.filter((r) => r.status === "pending")),
    approvedCents: sum(all.filter((r) => r.status === "approved")),
    paidCents: sum(all.filter((r) => r.status === "paid")),
    voidCents: sum(all.filter((r) => r.status === "void")),
  });
});
