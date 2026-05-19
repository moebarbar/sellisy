import { Router, type Request, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { createHash, randomUUID } from "crypto";
import { storage } from "../storage";
import { db } from "../db";
import { affiliates, affiliateCommissions, stores, PLAN_FEATURES, type PlanTier } from "@shared/schema";
import { isAuthenticated } from "../replit_integrations/auth";
import { and, eq, desc, inArray } from "drizzle-orm";
import { audit } from "../audit";
import {
  sendAffiliateApplicationReceivedEmail,
  sendAffiliateApprovedEmail,
  sendAffiliatePayoutSentEmail,
} from "../emails";
import { authStorage } from "../replit_integrations/auth/storage";
import { affiliatePayouts } from "@shared/schema";

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
  audit({
    event: "affiliate.settings_updated",
    storeId: parsed.data.storeId,
    details: `Affiliate settings updated for store ${parsed.data.storeId}`,
  });
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
    audit({
      event: "affiliate.created",
      storeId: parsed.data.storeId,
      details: `Affiliate created: ${affiliate.id} (code=${affiliate.code}) for store ${parsed.data.storeId}`,
    });
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

  const updated = await storage.updateAffiliate(String(req.params.id), parsed.data);
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

// ── PUBLIC: store info for the apply page ─────────────────────────────

affiliateRouter.get("/public/store/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug).toLowerCase();
  const store = await storage.getStoreBySlug(slug);
  if (!store || store.deletedAt) return res.status(404).json({ message: "Store not found" });

  // Even if disabled, return the basic info so the apply page can render
  // a polite "not accepting" message instead of a 404.
  res.json({
    id: store.id,
    name: store.name,
    slug: store.slug,
    tagline: store.tagline,
    affiliateProgramEnabled: store.affiliateProgramEnabled,
    affiliateDefaultRateBps: store.affiliateDefaultRateBps,
    affiliateCookieDays: store.affiliateCookieDays,
  });
});

// ── PUBLIC: self-serve affiliate apply ────────────────────────────────

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1h
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, reason: "rate_limited" },
});

const applySchema = z.object({
  storeSlug: z.string().min(1).max(80),
  email: z.string().email().max(254),
  name: z.string().min(1).max(120),
  code: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/i, "Code must be lowercase letters, numbers, dashes"),
  message: z.string().max(800).optional(),
});

affiliateRouter.post("/apply", applyLimiter, async (req: Request, res: Response) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: parsed.error.errors[0].message });

  const store = await storage.getStoreBySlug(parsed.data.storeSlug);
  if (!store || store.deletedAt) return res.status(404).json({ ok: false, message: "Store not found" });
  if (!store.affiliateProgramEnabled) {
    return res.status(403).json({ ok: false, message: "This store isn't accepting affiliate applications right now." });
  }

  // Gate the program by owner's plan tier — same as everywhere else.
  const ownerProfile = await storage.getUserProfile(store.ownerId);
  const ownerTier = (ownerProfile?.planTier as PlanTier) || "basic";
  if (!PLAN_FEATURES[ownerTier].affiliateProgram) {
    return res.status(403).json({ ok: false, message: "This store isn't accepting affiliate applications right now." });
  }

  const code = parsed.data.code.toLowerCase();
  const email = parsed.data.email.toLowerCase();

  // Conflict checks
  const existingByCode = await storage.getAffiliateByCode(store.id, code);
  if (existingByCode) {
    return res.status(409).json({ ok: false, message: "That affiliate code is already taken. Try a different one." });
  }

  // Self-serve applicants don't have a Sellisy account at submit time, so we
  // store a random placeholder userId. When they later sign in with an email
  // matching payoutEmail, the /me endpoint lazy-links to their real users.id.
  // The "applicant-" prefix is the signal for the lazy-link check.
  const placeholderUserId = `applicant-${randomUUID()}`;
  const notes = parsed.data.message
    ? `Applicant: ${parsed.data.name} <${email}>\n\n${parsed.data.message}`
    : `Applicant: ${parsed.data.name} <${email}>`;

  try {
    const affiliate = await storage.createAffiliate({
      storeId: store.id,
      userId: placeholderUserId,
      code,
      status: "pending",
      commissionRateBps: store.affiliateDefaultRateBps,
      payoutEmail: email,
      notes,
    });

    audit({
      event: "affiliate.applied",
      storeId: store.id,
      details: `Affiliate application: ${affiliate.id} (code=${code}) for store ${store.id}`,
    });

    // Confirmation email (best-effort)
    sendAffiliateApplicationReceivedEmail({
      applicantEmail: email,
      applicantName: parsed.data.name,
      storeName: store.name,
      storeSlug: store.slug,
    }).catch((e) => console.error("[affiliate.apply] email failed:", e));

    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ ok: false, message: "That affiliate code is already taken." });
    }
    console.error("[affiliate.apply] failed:", err);
    res.status(500).json({ ok: false, message: "Application failed. Please try again." });
  }
});

// Override the existing PATCH /affiliates/:id to also fire the approval email
// when an affiliate transitions from pending → active. We do this by re-using
// updateAffiliate but enriching the response when the transition happens.

// ── OWNER: payouts ────────────────────────────────────────────────────

// GET /api/affiliate/payouts?storeId=...
affiliateRouter.get("/payouts", isAuthenticated, async (req: Request, res: Response) => {
  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const check = await requireStoreOwner(req, storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const list = await storage.getPayoutsByStore(storeId);
  res.json(list);
});

// GET /api/affiliate/payouts/eligible?storeId=...
// Returns affiliates with their eligible-for-payout balance, grouped.
affiliateRouter.get("/payouts/eligible", isAuthenticated, async (req: Request, res: Response) => {
  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const check = await requireStoreOwner(req, storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const list = await storage.getAffiliatesByStore(storeId);
  const eligible = await Promise.all(list.map(async (a) => {
    const commissions = await storage.getEligibleCommissionsForAffiliate(a.id);
    const totalCents = commissions.reduce((s, c) => s + c.commissionCents, 0);
    return {
      affiliateId: a.id,
      code: a.code,
      payoutEmail: a.payoutEmail,
      eligibleCents: totalCents,
      commissionIds: commissions.map((c) => c.id),
      meetsThreshold: totalCents >= check.store.affiliateMinPayoutCents,
    };
  }));

  res.json(eligible.filter((e) => e.eligibleCents > 0));
});

// POST /api/affiliate/payouts — create a payout and mark commissions paid
const payoutSchema = z.object({
  affiliateId: z.string(),
  commissionIds: z.array(z.string()).min(1),
  method: z.enum(["manual_paypal", "manual_wise", "manual_bank", "manual_other"]),
  externalRef: z.string().max(120).optional(),
});

affiliateRouter.post("/payouts", isAuthenticated, async (req: Request, res: Response) => {
  const parsed = payoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const aff = await storage.getAffiliateById(parsed.data.affiliateId);
  if (!aff) return res.status(404).json({ message: "Affiliate not found" });

  const check = await requireStoreOwner(req, aff.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  // Verify all commission IDs belong to this affiliate AND are eligible
  // (status pending/approved, locked_until past, not already paid).
  const eligible = await storage.getEligibleCommissionsForAffiliate(aff.id);
  const eligibleIds = new Set(eligible.map((c) => c.id));
  const invalid = parsed.data.commissionIds.filter((id) => !eligibleIds.has(id));
  if (invalid.length > 0) {
    return res.status(400).json({ message: `Some commissions are not eligible for payout.` });
  }

  const selectedCommissions = eligible.filter((c) => parsed.data.commissionIds.includes(c.id));
  const totalCents = selectedCommissions.reduce((s, c) => s + c.commissionCents, 0);

  const payout = await storage.createPayout({
    affiliateId: aff.id,
    storeId: aff.storeId,
    totalCents,
    method: parsed.data.method,
    externalRef: parsed.data.externalRef ?? null,
    status: "processing",
  });

  await storage.markCommissionsPaid(parsed.data.commissionIds, payout.id);

  audit({
    event: "affiliate.payout_created",
    storeId: aff.storeId,
    details: `Payout created: ${payout.id} for affiliate ${aff.id}, ${totalCents}c (${selectedCommissions.length} commissions)`,
  });

  res.json(payout);
});

// PATCH /api/affiliate/payouts/:id — mark as paid, record external reference
const markPaidSchema = z.object({
  externalRef: z.string().max(120).optional(),
});
affiliateRouter.patch("/payouts/:id", isAuthenticated, async (req: Request, res: Response) => {
  const parsed = markPaidSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  // Look up + verify ownership via the affiliate -> store chain.
  const [payout] = await db.select().from(affiliatePayouts).where(eq(affiliatePayouts.id, String(req.params.id))).limit(1);
  if (!payout) return res.status(404).json({ message: "Payout not found" });

  const check = await requireStoreOwner(req, payout.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const updated = await storage.markPayoutPaid(payout.id, parsed.data.externalRef ?? null);

  audit({
    event: "affiliate.payout_marked_paid",
    storeId: payout.storeId,
    details: `Payout ${payout.id} marked paid (${payout.totalCents}c, ref=${parsed.data.externalRef ?? "none"})`,
  });

  // Notify the affiliate
  const aff = await storage.getAffiliateById(payout.affiliateId);
  if (aff?.payoutEmail) {
    sendAffiliatePayoutSentEmail({
      affiliateEmail: aff.payoutEmail,
      storeName: check.store.name,
      amountCents: payout.totalCents,
      method: payout.method,
      externalRef: parsed.data.externalRef ?? null,
    }).catch((e) => console.error("[affiliate.payout] email failed:", e));
  }

  res.json(updated);
});

// ── AFFILIATE-SELF: my view ───────────────────────────────────────────

// GET /api/affiliate/me — affiliate-side aggregated view across all stores
affiliateRouter.get("/me", isAuthenticated, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const me = await authStorage.getUser(userId);
  const email = me?.email?.toLowerCase() ?? null;

  // Find by userId OR by matching email (for self-serve applicants who haven't
  // been linked yet).
  const myAffs = await storage.getAffiliatesByUserOrEmail(userId, email);

  // Lazy-link any rows that matched by email but still have a placeholder userId
  for (const a of myAffs) {
    if (a.userId !== userId && a.userId.startsWith("applicant-")) {
      await storage.linkAffiliateToUser(a.id, userId);
    }
  }

  // Build per-store summary
  const out = await Promise.all(myAffs.map(async (a) => {
    const store = await storage.getStoreById(a.storeId);
    if (!store) return null;
    const commissions = await storage.getCommissionsByAffiliate(a.id);
    const clicks = await storage.getAffiliateClickCount(a.id, 30);
    const pendingCents = commissions.filter((c) => c.status === "pending" || c.status === "approved").reduce((s, c) => s + c.commissionCents, 0);
    const paidCents = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commissionCents, 0);
    return {
      affiliateId: a.id,
      storeId: a.storeId,
      storeName: store.name,
      storeSlug: store.slug,
      code: a.code,
      status: a.status,
      commissionRateBps: a.commissionRateBps,
      payoutEmail: a.payoutEmail,
      clicks30d: clicks,
      conversions: commissions.length,
      pendingCents,
      paidCents,
      recentCommissions: commissions.slice(0, 10),
    };
  }));

  res.json(out.filter(Boolean));
});

// POST /api/affiliate/me/payout-email — affiliate updates their own payout email
const payoutEmailSchema = z.object({
  affiliateId: z.string(),
  payoutEmail: z.string().email(),
});
affiliateRouter.post("/me/payout-email", isAuthenticated, async (req: Request, res: Response) => {
  const parsed = payoutEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const aff = await storage.getAffiliateById(parsed.data.affiliateId);
  if (!aff) return res.status(404).json({ message: "Affiliate not found" });

  if (aff.userId !== getUserId(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await storage.updateAffiliate(aff.id, { payoutEmail: parsed.data.payoutEmail });
  res.json({ ok: true });
});

// POST /api/affiliate/affiliates/:id/approve — approves a pending application
// and emails the affiliate their unique link. Idempotent — re-approving an
// already-active affiliate is a no-op (no duplicate email).
affiliateRouter.post("/affiliates/:id/approve", isAuthenticated, async (req: Request, res: Response) => {
  const aff = await storage.getAffiliateById(String(req.params.id));
  if (!aff) return res.status(404).json({ message: "Affiliate not found" });

  const check = await requireStoreOwner(req, aff.storeId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  if (aff.status === "active") return res.json(aff);

  const updated = await storage.updateAffiliate(aff.id, { status: "active" });

  audit({
    event: "affiliate.approved",
    storeId: aff.storeId,
    details: `Affiliate ${aff.id} approved (code=${aff.code})`,
  });

  if (aff.payoutEmail) {
    // Prefer the store's verified custom domain if available so the affiliate
    // sees a branded URL instead of sellisy.com/s/<slug>.
    const useCustomDomain = check.store.customDomain && check.store.domainStatus === "active";
    const storeBase = useCustomDomain
      ? `https://${check.store.customDomain}`
      : `${process.env.APP_URL || "https://sellisy.com"}/s/${check.store.slug}`;
    const link = `${storeBase}/?ref=${encodeURIComponent(aff.code)}`;
    const applicantName = aff.notes?.match(/Applicant: ([^<]+)/)?.[1]?.trim() ?? null;
    sendAffiliateApprovedEmail({
      affiliateEmail: aff.payoutEmail,
      affiliateName: applicantName,
      storeName: check.store.name,
      affiliateLink: link,
      commissionPercent: Math.round(aff.commissionRateBps / 100),
      cookieDays: check.store.affiliateCookieDays,
    }).catch((e) => console.error("[affiliate.approve] email failed:", e));
  }

  res.json(updated);
});
