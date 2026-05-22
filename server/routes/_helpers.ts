// Cross-router utilities. Anything that needs to be called from more than
// one router file lives here. Domain-specific helpers (PayPal API, plan-tier
// gating, etc.) stay in their owning router instead of being promoted here.

import type { Request } from "express";
import { createHash } from "crypto";
import { storage } from "../storage";
import type { PlanTier } from "@shared/schema";

export function getUserId(req: Request): string {
  return req.sellisyUserId!;
}

/**
 * Returns a safe base URL for building links in emails/redirects.
 * Prefers APP_URL env var to prevent host-header injection attacks.
 */
export function getAppUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  // Dev fallback only — in production APP_URL must be set
  return `${req.protocol}://${req.hostname}`;
}

export function generateSlug(title: string, fallback = "item"): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || fallback;
}

export function sanitizeStore(store: any) {
  const { paypalClientSecret, stripeSecretKey, ...safe } = store;
  return {
    ...safe,
    paypalClientSecret: paypalClientSecret ? "***configured***" : null,
    stripeSecretKey: stripeSecretKey ? "***configured***" : null,
  };
}

export function sanitizeProductForStorefront(product: any) {
  const { fileUrl, redemptionCode, deliveryInstructions, ...safe } = product;
  return safe;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Reads the buyer's customer_session cookie and resolves it to a customer
 * record. Used by the customer portal endpoints (in orders.ts) and the
 * storefront review submit/delete endpoints (in routes.ts) to identify the
 * authenticated buyer behind a request.
 */
export async function getCustomerFromCookie(req: Request): Promise<{ customerId: string } | null> {
  const sessionToken = req.cookies?.customer_session;
  if (!sessionToken) return null;
  const tokenHash = hashToken(sessionToken);
  const session = await storage.getCustomerSessionByToken(tokenHash);
  if (!session || new Date() > session.expiresAt) {
    if (session) await storage.deleteCustomerSession(session.id);
    return null;
  }
  return { customerId: session.customerId };
}

// Lazy-create the user_profiles row on first plan-tier check, with a free
// 14-day Growth-tier trial auto-granted. Existing users with no row also get
// the trial on their next request — no backfill cron needed.
export async function ensureUserProfile(userId: string) {
  const existing = await storage.getUserProfile(userId);
  if (existing) return existing;
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return storage.upsertUserProfile({
    userId,
    planTier: "basic",
    isAdmin: false,
    trialEndsAt,
  });
}

// Effective tier: a basic-tier user with an active trial gets pro-tier
// access. Once they convert to paid (Stripe webhook sets planTier=pro/max
// AND clears trialEndsAt) the trial is moot. Once trialEndsAt is in the
// past, they revert to basic.
export function effectiveTier(profile: { planTier: string | null; trialEndsAt: Date | null }): PlanTier {
  const tier = (profile.planTier as PlanTier) || "basic";
  if (tier !== "basic") return tier;
  if (profile.trialEndsAt && profile.trialEndsAt > new Date()) return "pro";
  return "basic";
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const profile = await ensureUserProfile(userId);
  return effectiveTier(profile);
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await storage.getUserProfile(userId);
  return profile?.isAdmin ?? false;
}
