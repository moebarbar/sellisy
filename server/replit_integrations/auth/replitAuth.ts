import type { Express, Request, RequestHandler } from "express";
import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import { authStorage } from "./storage";
import { audit, auditMeta } from "../../audit";

declare global {
  namespace Express {
    interface Request {
      // Local Sellisy user UUID, resolved from Clerk userId on authenticated requests
      sellisyUserId?: string;
    }
  }
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  // clerkMiddleware verifies the session token (from cookie or Authorization header)
  // and attaches an `auth` object to req. It does NOT enforce auth on its own —
  // route-level `isAuthenticated` does that.
  app.use(clerkMiddleware());
}

// Resolve a Sellisy user row for the authenticated Clerk user.
// Creates the row on first sight (auto-provisioning) so we don't need a webhook
// to keep users in sync for the basic case.
//
// Performance: a fresh signup's first dashboard render fires several API
// requests in parallel, and ALL of them used to miss the DB lookup and each
// make their own Clerk API round trip (~150-400ms) before racing to insert
// the same row — the main reason signup felt slow. Two layers fix it:
//   1. single-flight: concurrent requests for the same clerkUserId share
//      ONE provisioning promise (one Clerk call total)
//   2. a short-TTL cache skips the per-request DB lookup on the hot path;
//      60s keeps multi-instance drift bounded
type LocalUser = Awaited<ReturnType<typeof authStorage.upsertUserByClerkId>>;
const USER_CACHE_TTL_MS = 60_000;
const userCache = new Map<string, { user: LocalUser; at: number }>();
const inFlight = new Map<string, Promise<LocalUser>>();

async function provisionLocalUser(clerkUserId: string): Promise<LocalUser> {
  const cached = userCache.get(clerkUserId);
  if (cached && Date.now() - cached.at < USER_CACHE_TTL_MS) return cached.user;

  const flight = inFlight.get(clerkUserId);
  if (flight) return flight;

  const promise = (async () => {
    try {
      const existing = await authStorage.getUserByClerkId(clerkUserId);
      if (existing) {
        userCache.set(clerkUserId, { user: existing, at: Date.now() });
        return existing;
      }

      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primaryEmail = clerkUser.emailAddresses.find(
        e => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;

      const user = await authStorage.upsertUserByClerkId({
        clerkUserId,
        email: primaryEmail,
        firstName: clerkUser.firstName ?? null,
        lastName: clerkUser.lastName ?? null,
        profileImageUrl: clerkUser.imageUrl ?? null,
      });
      userCache.set(clerkUserId, { user, at: Date.now() });
      return user;
    } finally {
      inFlight.delete(clerkUserId);
    }
  })();

  inFlight.set(clerkUserId, promise);
  // Unbounded-growth guard — a blunt clear is fine, entries rebuild on demand.
  if (userCache.size > 5000) userCache.clear();
  return promise;
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await provisionLocalUser(auth.userId);
    req.sellisyUserId = user.id;
    return next();
  } catch (err) {
    const meta = auditMeta(req as any);
    audit({ event: "auth.provision.failed", clerkUserId: auth.userId, details: (err as Error).message, ...meta });
    console.error("[auth] failed to provision local user:", err);
    return res.status(500).json({ message: "Authentication failed" });
  }
};
