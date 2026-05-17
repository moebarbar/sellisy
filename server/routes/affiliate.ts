import { Router, type Request, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { createHash } from "crypto";
import { storage } from "../storage";
import { PLAN_FEATURES, type PlanTier } from "@shared/schema";

export const affiliateRouter = Router();

// ── Public click endpoint ─────────────────────────────────────────────
// Called by the storefront tracking script when a visitor lands with ?ref=<code>.
// Returns the affiliateId + cookieDays so the client can drop a same-site cookie.

const clickSchema = z.object({
  storeSlug: z.string().min(1).max(80),
  ref: z.string().min(1).max(80),
  path: z.string().max(500).optional(),
});

// Rate-limit so a bot can't spam click rows for fake fraud signals.
// 60 clicks/min per IP is far higher than any legit user can hit naturally.
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
  if (!parsed.success) {
    return res.status(400).json({ ok: false, reason: "invalid_body" });
  }

  const { storeSlug, ref, path } = parsed.data;

  const store = await storage.getStoreBySlug(storeSlug);
  if (!store || store.deletedAt) {
    // Don't leak which slugs exist; respond with a generic miss.
    return res.json({ ok: false });
  }

  if (!store.affiliateProgramEnabled) {
    return res.json({ ok: false });
  }

  // Belt-and-suspenders plan gate: even if affiliateProgramEnabled was flipped
  // on a Starter-plan store, the click pipeline refuses to honor it. The
  // settings UI should prevent the flip in the first place — this is the
  // last line of defense.
  const ownerProfile = await storage.getUserProfile(store.ownerId);
  const ownerTier = (ownerProfile?.planTier as PlanTier) || "basic";
  if (!PLAN_FEATURES[ownerTier].affiliateProgram) {
    return res.json({ ok: false });
  }

  const affiliate = await storage.getAffiliateByCode(store.id, ref);
  if (!affiliate || affiliate.status !== "active") {
    return res.json({ ok: false });
  }

  // Self-attribution guard: store owner can't earn commissions on their own store.
  if (affiliate.userId === store.ownerId) {
    return res.json({ ok: false });
  }

  const ipHash = hash(getClientIp(req) + ":" + store.id);
  const uaHash = hash((req.headers["user-agent"] || "") + ":" + store.id);
  const referrer = typeof req.headers.referer === "string" ? req.headers.referer.slice(0, 500) : null;

  // Dedup: skip writing if we've already seen this IP click this affiliate in the last hour.
  // The cookie still gets set on the client either way — this just keeps the
  // analytics table from being polluted by refresh-spammers.
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

  res.json({
    ok: true,
    affiliateId: affiliate.id,
    cookieDays: store.affiliateCookieDays,
  });
});
