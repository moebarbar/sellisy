import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { gumroadImports, gumroadProductShells, products, stores } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { encryptToken } from '../crypto/token-encryption';
import { gumroadImportQueue } from '../queue/queues';
import * as gumroad from '../gumroad/client';
import { GumroadAPIError } from '../gumroad/types';

export const gumroadImportRouter = Router();

// ── Auth helpers ──────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function getUserId(req: Request): string {
  return (req as any).session?.userId;
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

// ── POST /verify ─────────────────────────────────────────────────────────────

gumroadImportRouter.post('/verify', requireAuth, async (req, res) => {
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
      productType: p.subscription_duration ? 'membership' : 'digital',
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

gumroadImportRouter.post('/start', requireAuth, async (req, res) => {
  const userId = getUserId(req);

  if (!checkRateLimit(startRateMap, userId, 3, 60 * 60_000)) {
    return res.status(429).json({ error: 'Too many import attempts. Please wait an hour.' });
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

// ── GET /status/:importId ─────────────────────────────────────────────────────

gumroadImportRouter.get('/status/:importId', requireAuth, async (req, res) => {
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

gumroadImportRouter.get('/shells/:importId', requireAuth, async (req, res) => {
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

gumroadImportRouter.post('/files/attach', requireAuth, async (req, res) => {
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

gumroadImportRouter.post('/files/skip', requireAuth, async (req, res) => {
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

gumroadImportRouter.post('/finish/:importId', requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  const shells = await db.select().from(gumroadProductShells).where(eq(gumroadProductShells.importId, importId));
  const missing = shells.filter(s => s.fileStatus === 'missing');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `${missing.length} product(s) still need files or need to be skipped.`,
      missingShellIds: missing.map(s => s.id),
    });
  }

  // Publish all imported products as storeProducts (mark them visible)
  for (const shell of shells) {
    const { storeProducts } = await import('@shared/schema');
    // Insert store-product link if it doesn't exist, else update isPublished
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
    accessTokenEncrypted: '',  // zero out the token — no longer needed
  }).where(eq(gumroadImports.id, importId));

  return res.json({ success: true });
});

// ── POST /disconnect/:importId ────────────────────────────────────────────────

gumroadImportRouter.post('/disconnect/:importId', requireAuth, async (req, res) => {
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

gumroadImportRouter.post('/send-welcome-emails/:importId', requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const importId = req.params.importId as string;

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) return res.status(404).json({ error: 'Import not found' });

  const store = await getOwnedStore(userId, importRecord.storeId);
  if (!store) return res.status(403).json({ error: 'Access denied' });

  if (importRecord.welcomeEmailsSentAt) {
    return res.status(409).json({ error: 'Welcome emails already sent for this import.' });
  }

  const { gumroadWelcomeEmailsQueue } = await import('../queue/queues');
  await gumroadWelcomeEmailsQueue.add('gumroad-welcome-emails', { importId, storeId: importRecord.storeId });

  return res.json({ success: true });
});
