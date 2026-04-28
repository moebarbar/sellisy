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
// to keep users in sync for the basic case. Profile fields are refreshed on
// every authenticated request — cheap and keeps things simple.
async function provisionLocalUser(clerkUserId: string) {
  const existing = await authStorage.getUserByClerkId(clerkUserId);
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail = clerkUser.emailAddresses.find(
    e => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;

  return authStorage.upsertUserByClerkId({
    clerkUserId,
    email: primaryEmail,
    firstName: clerkUser.firstName ?? null,
    lastName: clerkUser.lastName ?? null,
    profileImageUrl: clerkUser.imageUrl ?? null,
  });
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
