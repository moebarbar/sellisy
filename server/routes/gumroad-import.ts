import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { gumroadImports, gumroadProductShells, products, stores, storeProducts } from '@shared/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { encryptToken } from '../crypto/token-encryption';
import { gumroadImportQueue } from '../queue/queues';
import * as gumroad from '../gumroad/client';
import { GumroadAPIError } from '../gumroad/types';
import { isAuthenticated } from '../replit_integrations/auth';
import { redisConnection } from '../queue/connection';

export const gumroadImportRouter = Router();

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getUserId(req: Request): string {
  return req.sellisyUserId!;
}

async function getOwnedStore(userId: string, storeId: string) {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
  if (!store || store.ownerId !== userId) return null;
  return store;
}

// ── Per-session rate limiting ─────────────────────────────────────────────────
// Simple in-memory map: userId → array of request timestamps

const verifyRateMap = new Map<string, number[]>();
const startRateMap = new Map<string, number[]>();

function checkRateLimit(map: Map<string, number[]>, userId: string, maxCount: number, windowMs: number): boolean {
  const now = Date.now();
  const times = (map.get(userId) ?? []).filter(t => now - t < windowMs);
  if (times.length >= maxCount) return false;
  times.push(now);
  map.set(userId, times);
  return true;
}

// Periodically clean up old entries to avoid memory leaks
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, times] of Array.from(verifyRateMap.entries())) {
    if (times.every((t: number) => t < cutoff)) verifyRateMap.delete(k);
  }
  for (const [k, times] of Array.from(startRateMap.entries())) {
    if (times.every((t: number) => t < cutoff)) startRateMap.delete(k);
  }
}, 10 * 60 * 1000);

// ── OAuth flow ───────────────────────────────────────────────────────────────
// Three-step OAuth handshake with Gumroad:
//   1. GET  /oauth/start    — authenticated user clicks "Connect Gumroad",
//                              we mint a CSRF state token and return the
//                              authorize URL to redirect them to.
//   2. GET  /oauth/callback — Gumroad redirects the user's browser back
//                              with ?code & ?state. We exchange the code
//                              for an access_token, stash it in Redis
//                              under a one-shot key, then redirect the
//                              browser to the wizard with ?stash=<key>.
//   3. POST /oauth/claim    — wizard pulls the stashed token using the
//                              stash key (one-time read, then deleted).
//
// State and stashed tokens both live in Redis with short TTLs so they
// can't be replayed and don't pollute the DB.

const GUMROAD_AUTHORIZE_URL = 'https://gumroad.com/oauth/authorize';
const GUMROAD_TOKEN_URL = 'https://api.gumroad.com/oauth/token';
const GUMROAD_OAUTH_SCOPES = 'view_sales view_profile';
const OAUTH_STATE_TTL_SEC = 600;   // 10 min to complete the consent screen
const OAUTH_STASH_TTL_SEC = 300;   // 5 min for the wizard to claim the token

function getRedirectUri(): string {
  const explicit = process.env.GUMROAD_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  const base = (process.env.APP_URL || 'https://sellisy.com').replace(/\/$/, '');
  return `${base}/api/integrations/gumroad/oauth/callback`;
}

gumroadImportRouter.get('/oauth/start', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const storeId = (req.query.storeId as string | undefined) ?? '';
  if (!storeId) return res.status(400).json({ error: 'Missing storeId' });

  const store = await getOwnedStore(userId, storeId);
  if (!store) return res.status(403).json({ error: 'Store not found or access denied' });

  const clientId = process.env.GUMROAD_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Gumroad OAuth is not configured on this server.' });
  }

  // CSRF state — random 32 bytes, hex-encoded. Bind it to the originating
  // user + store so we can verify ownership in the callback.
  const state = randomBytes(32).toString('hex');
  await redisConnection.set(
    `gumroad:oauth:state:${state}`,
    JSON.stringify({ userId, storeId }),
    'EX',
    OAUTH_STATE_TTL_SEC,
  );

  const url = new URL(GUMROAD_AUTHORIZE_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getRedirectUri());
  url.searchParams.set('scope', GUMROAD_OAUTH_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');

  return res.json({ url: url.toString() });
});

gumroadImportRouter.get('/oauth/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const error = typeof req.query.error === 'string' ? req.query.error : '';
  const oauthError = typeof req.query.error_description === 'string'
    ? req.query.error_description
    : error;

  // Always redirect the browser back to the wizard so the user sees a
  // friendly UI rather than raw JSON, regardless of success/failure.
  const wizardBase = `/dashboard/import/gumroad`;
  const redirectWithError = (msg: string) =>
    res.redirect(`${wizardBase}?oauth_error=${encodeURIComponent(msg)}`);

  if (error || oauthError) {
    return redirectWithError(oauthError || 'Authorization denied');
  }
  if (!code || !state) {
    return redirectWithError('Missing OAuth code or state');
  }

  const stateKey = `gumroad:oauth:state:${state}`;
  const raw = await redisConnection.get(stateKey);
  if (!raw) return redirectWithError('OAuth session expired. Please try again.');
  await redisConnection.del(stateKey);  // single-use

  let stateData: { userId: string; storeId: string };
  try {
    stateData = JSON.parse(raw);
  } catch {
    return redirectWithError('Invalid OAuth session');
  }

  const clientId = process.env.GUMROAD_CLIENT_ID;
  const clientSecret = process.env.GUMROAD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectWithError('Server OAuth misconfigured');
  }

  // Exchange authorization code for an access token.
  let tokenJson: { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
  try {
    const tokenRes = await fetch(GUMROAD_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
      }).toString(),
    });
    tokenJson = await tokenRes.json() as any;
    if (!tokenRes.ok || !tokenJson.access_token) {
      const rawMsg = tokenJson.error_description || tokenJson.error || `Token exchange failed (${tokenRes.status})`;
      console.error('[gumroad-oauth] token exchange failed:', rawMsg);
      // Cap length to defend against attacker-controlled (or just very long)
      // error_description being injected into our UI as a confusing message.
      const safeMsg = String(rawMsg).slice(0, 200);
      return redirectWithError(safeMsg);
    }
  } catch (err: any) {
    console.error('[gumroad-oauth] token exchange threw:', err.message);
    return redirectWithError('Could not reach Gumroad to exchange the code');
  }

  // Stash the token under a one-shot key. The wizard calls /oauth/claim
  // to read it once, then it's deleted. Token never lives in localStorage
  // or in the URL beyond this stash id.
  const stashId = randomBytes(16).toString('hex');
  try {
    await redisConnection.set(
      `gumroad:oauth:stash:${stashId}`,
      JSON.stringify({
        userId: stateData.userId,
        storeId: stateData.storeId,
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token ?? null,
      }),
      'EX',
      OAUTH_STASH_TTL_SEC,
    );
  } catch (err: any) {
    // If Redis is down at this point we have a valid token in memory but
    // no way to deliver it to the wizard. Surface a friendly error rather
    // than crashing the request and leaving the user on a blank page.
    console.error('[gumroad-oauth] could not stash token:', err.message);
    return redirectWithError('Temporary connection issue. Please try again.');
  }

  return res.redirect(
    `${wizardBase}?oauth=connected&stash=${stashId}&storeId=${encodeURIComponent(stateData.storeId)}`,
  );
});

gumroadImportRouter.post('/oauth/claim', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const schema = z.object({ stashId: z.string().min(1).max(64) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const stashKey = `gumroad:oauth:stash:${parsed.data.stashId}`;
  const raw = await redisConnection.get(stashKey);
  if (!raw) return res.status(404).json({ error: 'OAuth session expired or already used' });

  let stash: { userId: string; storeId: string; accessToken: string; refreshToken: string | null };
  try {
    stash = JSON.parse(raw);
  } catch {
    // Corrupt entry — drop it so a retry doesn't keep tripping over it.
    await redisConnection.del(stashKey);
    return res.status(500).json({ error: 'Corrupt OAuth stash' });
  }

  // Defense in depth: only the user who initiated the OAuth flow can
  // claim its token. Prevents one Sellisy account from hijacking another's
  // pending OAuth callback even if they got the stashId.
  // IMPORTANT: do this check BEFORE deleting the key — a wrong-user
  // attempt must not consume the stash and lock the legitimate user out.
  if (stash.userId !== userId) {
    return res.status(403).json({ error: 'OAuth session belongs to a different account' });
  }

  // Re-verify store ownership in case it changed during the ~5-min stash
  // window (deletion, transfer). Don't delete the stash so the user can
  // recover by switching to a store they still own and retrying.
  const store = await getOwnedStore(userId, stash.storeId);
  if (!store) {
    return res.status(403).json({ error: 'You no longer have access to that store.' });
  }

  // Single-use: only delete after every check has passed.
  await redisConnection.del(stashKey);

  // NOTE: this response includes the raw access token. It's protected by:
  //   - HTTPS in transit
  //   - the response-body logger in server/index.ts skips logging in
  //     production (gated on NODE_ENV)
  //   - the React app stores it in component state only, never localStorage
  //   - the import worker wipes it from gumroad_imports after the job
  // If you ever change the prod log middleware, make sure /oauth/claim
  // responses stay redacted.
  return res.json({
    accessToken: stash.accessToken,
    storeId: stash.storeId,
  });
});

// ── POST /verify ─────────────────────────────────────────────────────────────

gumroadImportRouter.post('/verify', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);

  if (!checkRateLimit(verifyRateMap, userId, 5, 60_000)) {
    return res.status(429).json({ error: 'Too many verify attempts. Please wait a minute.' });
  }

  const schema = z.object({
    accessToken: z.string().min(1).max(500),
    storeId: z.string().min(1).max(100),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { accessToken, storeId } = parsed.data;

  const store = await getOwnedStore(userId, storeId);
  if (!store) return res.status(403).json({ error: 'Store not found or access denied' });

  try {
    const [gumroadAccount, gumroadProducts] = await Promise.all([
      gumroad.verifyToken(accessToken),
      gumroad.listProducts(accessToken),
    ]);

    // Estimate sales count from first page
    let estimatedSalesCount = 0;
    try {
      const firstPage = await gumroad.listSales(accessToken).next();
      if (!firstPage.done && firstPage.value.length > 0) {
        estimatedSalesCount = firstPage.value.length >= 100 ? 1000 : firstPage.value.length;
      }
    } catch { /* non-fatal */ }

    const productPreviews = gumroadProducts.map(p => ({
      gumroadProductId: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      thumbnailUrl: p.thumbnail_url,
      productType: 'digital',  // membership products imported as digital; flag shown in UI
      isSubscription: !!p.subscription_duration,
      isPublished: p.published,
      hasCustomFields: (p.custom_fields ?? []).length > 0,
    }));

    return res.json({
      gumroadAccount: {
        email: gumroadAccount.email,
        name: gumroadAccount.name,
        userId: gumroadAccount.user_id,
      },
      productCount: gumroadProducts.length,
      products: productPreviews,
      estimatedSalesCount,
    });
  } catch (err) {
    if (err instanceof GumroadAPIError) {
      if (err.statusCode === 401) {
        return res.status(400).json({ error: 'Invalid Gumroad token. Please check and try again.' });
      }
      return res.status(400).json({ error: err.message });
    }
    console.error('[gumroad] verify error:', err);
    return res.status(500).json({ error: 'Failed to connect to Gumroad' });
  }
});

// ── POST /start ───────────────────────────────────────────────────────────────

gumroadImportRouter.post('/start', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);

  // 10 import attempts per hour is generous enough for normal use + iteration
  // during testing, but still prevents accidental loops from creating dozens
  // of in-flight imports.
  if (!checkRateLimit(startRateMap, userId, 10, 60 * 60_000)) {
    return res.status(429).json({ error: 'Too many import attempts. Please wait a few minutes.' });
  }

  const schema = z.object({
    accessToken: z.string().min(1).max(500),
    storeId: z.string().min(1).max(100),
    selectedProductIds: z.array(z.string().max(200)).min(1).max(500),
    options: z.object({
      importCustomers: z.boolean(),
      importSales: z.boolean(),
      rewriteDescriptionsWithAI: z.boolean(),
    }),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { accessToken, storeId, selectedProductIds, options } = parsed.data;

  const store = await getOwnedStore(userId, storeId);
  if (!store) return res.status(403).json({ error: 'Store not found or access denied' });

  // Block duplicate imports; recover stale ones (stuck > 30 min)
  const STALE_MS = 30 * 60 * 1000;
  const [activeImport] = await db
    .select({ id: gumroadImports.id, startedAt: gumroadImports.startedAt })
    .from(gumroadImports)
    .where(and(
      eq(gumroadImports.storeId, storeId),
      inArray(gumroadImports.status, ['pending', 'importing']),
    ));

  if (activeImport) {
    const age = Date.now() - activeImport.startedAt.getTime();
    if (age < STALE_MS) {
      return res.status(409).json({
        error: 'An import is already in progress for this store.',
        importId: activeImport.id,
      });
    }
    await db.update(gumroadImports)
      .set({ status: 'failed', errorMessage: 'Import timed out and was superseded.', accessTokenEncrypted: '' })
      .where(eq(gumroadImports.id, activeImport.id));
  }

  const encryptedToken = encryptToken(accessToken);

  const [importRecord] = await db.insert(gumroadImports).values({
    storeId,
    ownerId: userId,
    status: 'pending',
    accessTokenEncrypted: encryptedToken,
    productsTotal: selectedProductIds.length,
  }).returning();

  await gumroadImportQueue.add('gumroad-import', {
    importId: importRecord.id,
    selectedProductIds,
    options,
  });

  return res.json({ importId: importRecord.id });
});

// ── GET /in-progress?storeId=… ────────────────────────────────────────────────
// Returns the most recent import for the given store that's still in
// `awaiting_files` state — i.e. products imported but files not yet
// uploaded. Lets the wizard offer a "Resume" path instead of forcing the
// user to start over (which would skip duplicate products and produce
// zero shells, leaving them unable to attach files at all).
gumroadImportRouter.get('/in-progress', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const storeId = (req.query.storeId as string | undefined) ?? '';
  if (!storeId) return res.status(400).json({ error: 'Missing storeId' });

  const store = await getOwnedStore(userId, storeId);
  if (!store) return res.status(403).json({ error: 'Store not found or access denied' });

  const [pending] = await db
    .select({
      id: gumroadImports.id,
      status: gumroadImports.status,
      productsTotal: gumroadImports.productsTotal,
      productsImported: gumroadImports.productsImported,
      startedAt: gumroadImports.startedAt,
    })
    .from(gumroadImports)
    .where(and(
      eq(gumroadImports.storeId, storeId),
      eq(gumroadImports.status, 'awaiting_files'),
    ))
    .orderBy(desc(gumroadImports.startedAt))
    .limit(1);

  if (!pending) return res.json({ inProgress: null });

  // Count how many shells still need a file or skip decision so the UI
  // can show the user exactly how much work is left.
  const shells = await db
    .select({ id: gumroadProductShells.id, fileStatus: gumroadProductShells.fileStatus })
    .from(gumroadProductShells)
    .where(eq(gumroadProductShells.importId, pending.id));

  const pendingFiles = shells.filter(s => s.fileStatus === 'missing').length;

  return res.json({
    inProgress: {
      importId: pending.id,
      productsImported: pending.productsImported,
      pendingFiles,
      totalShells: shells.length,
      startedAt: pending.startedAt,
    },
  });
});

// ── GET /status/:importId ─────────────────────────────────────────────────────

gumroadImportRouter.get('/status/:importId', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  return res.json({
    status: importRecord.status,
    productsTotal: importRecord.productsTotal,
    productsImported: importRecord.productsImported,
    customersTotal: importRecord.customersTotal,
    customersImported: importRecord.customersImported,
    salesTotal: importRecord.salesTotal,
    salesImported: importRecord.salesImported,
    errorMessage: importRecord.errorMessage,
    startedAt: importRecord.startedAt,
    completedAt: importRecord.completedAt,
  });
});

// ── GET /shells/:importId ─────────────────────────────────────────────────────

gumroadImportRouter.get('/shells/:importId', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  const shells = await db
    .select({
      shellId: gumroadProductShells.id,
      sellisyProductId: gumroadProductShells.sellisyProductId,
      gumroadProductId: gumroadProductShells.gumroadProductId,
      fileStatus: gumroadProductShells.fileStatus,
      fileMatchHint: gumroadProductShells.fileMatchHint,
      productName: products.title,
      thumbnailUrl: products.thumbnailUrl,
      priceCents: products.priceCents,
    })
    .from(gumroadProductShells)
    .innerJoin(products, eq(gumroadProductShells.sellisyProductId, products.id))
    .where(eq(gumroadProductShells.importId, importId));

  return res.json(shells);
});

// ── POST /files/attach ────────────────────────────────────────────────────────

gumroadImportRouter.post('/files/attach', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const schema = z.object({
    shellId: z.string().min(1).max(100),
    r2Key: z.string().min(1).max(500),
    fileSize: z.number().int().min(0),
    fileName: z.string().min(1).max(255),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const { shellId, r2Key, fileSize, fileName } = parsed.data;

  const [shell] = await db.select().from(gumroadProductShells).where(eq(gumroadProductShells.id, shellId));
  if (!shell) return res.status(404).json({ error: 'Shell not found' });

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, shell.importId));
  const store = importRecord ? await getOwnedStore(userId, importRecord.storeId) : null;
  if (!store) return res.status(403).json({ error: 'Access denied' });

  await db.update(products).set({ fileUrl: r2Key }).where(eq(products.id, shell.sellisyProductId));
  await db.update(gumroadProductShells).set({ fileStatus: 'uploaded' }).where(eq(gumroadProductShells.id, shellId));

  return res.json({ success: true });
});

// ── POST /files/skip ──────────────────────────────────────────────────────────

gumroadImportRouter.post('/files/skip', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const schema = z.object({ shellId: z.string().min(1).max(100) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const [shell] = await db.select().from(gumroadProductShells).where(eq(gumroadProductShells.id, parsed.data.shellId));
  if (!shell) return res.status(404).json({ error: 'Shell not found' });

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, shell.importId));
  const store = importRecord ? await getOwnedStore(userId, importRecord.storeId) : null;
  if (!store) return res.status(403).json({ error: 'Access denied' });

  await db.update(gumroadProductShells).set({ fileStatus: 'skipped' }).where(eq(gumroadProductShells.id, shell.id));
  return res.json({ success: true });
});

// ── POST /finish/:importId ────────────────────────────────────────────────────

gumroadImportRouter.post('/finish/:importId', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  if (importRecord.status !== 'awaiting_files') {
    return res.status(400).json({ error: 'Import is not ready to finish.' });
  }

  const shells = await db.select().from(gumroadProductShells).where(eq(gumroadProductShells.importId, importId));
  const missing = shells.filter(s => s.fileStatus === 'missing');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `${missing.length} product(s) still need files or need to be skipped.`,
      missingShellIds: missing.map(s => s.id),
    });
  }

  // Publish all imported products — upsert storeProducts row with isPublished=true
  for (const shell of shells) {
    const [existing] = await db
      .select()
      .from(storeProducts)
      .where(and(
        eq(storeProducts.storeId, importRecord.storeId),
        eq(storeProducts.productId, shell.sellisyProductId),
      ));
    if (existing) {
      await db.update(storeProducts).set({ isPublished: true }).where(eq(storeProducts.id, existing.id));
    } else {
      await db.insert(storeProducts).values({
        storeId: importRecord.storeId,
        productId: shell.sellisyProductId,
        isPublished: true,
      });
    }
  }

  await db.update(gumroadImports).set({
    status: 'completed',
    completedAt: new Date(),
    accessTokenEncrypted: '',
  }).where(eq(gumroadImports.id, importId));

  return res.json({ success: true });
});

// ── POST /disconnect/:importId ────────────────────────────────────────────────

gumroadImportRouter.post('/disconnect/:importId', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  await db.update(gumroadImports).set({ accessTokenEncrypted: '' }).where(eq(gumroadImports.id, importId));
  return res.json({ success: true });
});

// ── POST /send-welcome-emails/:importId ───────────────────────────────────────

gumroadImportRouter.post('/send-welcome-emails/:importId', isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  if (!['completed', 'awaiting_files'].includes(importRecord.status)) {
    return res.status(400).json({ error: 'Import must be completed before sending welcome emails.' });
  }

  if (importRecord.welcomeEmailsSentAt) {
    return res.status(409).json({ error: 'Welcome emails already sent for this import.' });
  }

  const { gumroadWelcomeEmailsQueue } = await import('../queue/queues');
  await gumroadWelcomeEmailsQueue.add('gumroad-welcome-emails', { importId, storeId: importRecord.storeId });

  return res.json({ success: true });
});
