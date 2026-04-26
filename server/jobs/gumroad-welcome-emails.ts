import type { Job } from 'bullmq';
import { eq, inArray, and } from 'drizzle-orm';
import { db } from '../db';
import {
  gumroadImports,
  gumroadProductShells,
  stores,
  orders,
  orderItems,
  customers,
  products,
} from '../../shared/schema';
import { sendGumroadMigrationEmail } from '../emails';

const BASE_URL = process.env.APP_URL?.replace(/\/$/, '') ?? 'https://sellisy.com';

function storePortalUrl(store: { slug: string; customDomain: string | null; domainStatus: string | null }): string {
  if (store.customDomain && store.domainStatus === 'active') {
    return `https://${store.customDomain}/portal`;
  }
  return `${BASE_URL}/s/${store.slug}/portal`;
}

interface EmailEntry {
  name: string | null;
  customerId: string | null;
  productIds: string[];
}

export async function processGumroadWelcomeEmails(job: Job) {
  const { importId, storeId } = job.data as { importId: string; storeId: string };

  // ── Load & lock ─────────────────────────────────────────────────────

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) throw new Error(`Import ${importId} not found`);

  if (importRecord.welcomeEmailsSentAt) {
    console.log(`[gumroad-welcome-emails] ${importId} already sent, skipping`);
    return;
  }

  // Mark as sent immediately to prevent duplicate runs on retry
  await db.update(gumroadImports)
    .set({ welcomeEmailsSentAt: new Date() })
    .where(eq(gumroadImports.id, importId));

  // ── Load store ───────────────────────────────────────────────────────

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
  if (!store) throw new Error(`Store ${storeId} not found`);

  const portalUrl = storePortalUrl(store);

  // ── Find all buyer emails via shells → orderItems → orders ──────────

  const shells = await db
    .select({ sellisyProductId: gumroadProductShells.sellisyProductId })
    .from(gumroadProductShells)
    .where(eq(gumroadProductShells.importId, importId));

  if (shells.length === 0) {
    console.log(`[gumroad-welcome-emails] ${importId} has no shells, nothing to send`);
    return;
  }

  const productIds = shells.map(s => s.sellisyProductId);

  const matchingItems = await db
    .select({ orderId: orderItems.orderId, productId: orderItems.productId })
    .from(orderItems)
    .where(inArray(orderItems.productId, productIds));

  if (matchingItems.length === 0) {
    console.log(`[gumroad-welcome-emails] ${importId} no orders found, nothing to send`);
    return;
  }

  const orderIds = Array.from(new Set(matchingItems.map(i => i.orderId)));

  // Filter to this store only to prevent cross-store leakage
  const storeOrders = await db
    .select({ id: orders.id, buyerEmail: orders.buyerEmail, customerId: orders.customerId })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), inArray(orders.id, orderIds)));

  if (storeOrders.length === 0) return;

  // ── Build per-email payload ──────────────────────────────────────────

  // Map: email → { name, customerId, productIds[] }
  const emailMap = new Map<string, EmailEntry>();

  for (const order of storeOrders) {
    const orderProductIds = matchingItems
      .filter(i => i.orderId === order.id)
      .map(i => i.productId);

    const existing = emailMap.get(order.buyerEmail);
    if (!existing) {
      emailMap.set(order.buyerEmail, {
        name: null,
        customerId: order.customerId ?? null,
        productIds: orderProductIds,
      });
    } else {
      for (const pid of orderProductIds) {
        if (!existing.productIds.includes(pid)) existing.productIds.push(pid);
      }
    }
  }

  // Resolve customer names
  const customerIds = Array.from(emailMap.values())
    .map(e => e.customerId)
    .filter((id): id is string => !!id);

  if (customerIds.length > 0) {
    const customerRows = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(inArray(customers.id, customerIds));
    const nameById = new Map(customerRows.map(c => [c.id, c.name]));

    for (const entry of Array.from(emailMap.values())) {
      if (entry.customerId && !entry.name) {
        entry.name = nameById.get(entry.customerId) ?? null;
      }
    }
  }

  // Resolve product titles
  const allProductIds = Array.from(
    new Set(Array.from(emailMap.values()).flatMap(e => e.productIds))
  );
  const productTitleMap = new Map<string, string>();
  if (allProductIds.length > 0) {
    const productRows = await db
      .select({ id: products.id, title: products.title })
      .from(products)
      .where(inArray(products.id, allProductIds));
    for (const p of productRows) productTitleMap.set(p.id, p.title);
  }

  // ── Send emails ──────────────────────────────────────────────────────

  let sent = 0;
  let failed = 0;

  for (const [email, entry] of Array.from(emailMap.entries())) {
    const productTitles = entry.productIds
      .map(id => productTitleMap.get(id) ?? '')
      .filter(Boolean);

    try {
      await sendGumroadMigrationEmail({
        buyerEmail: email,
        buyerName: entry.name,
        storeName: store.name,
        storePortalUrl: portalUrl,
        products: productTitles,
      });
      sent++;
    } catch (err: any) {
      console.error(`[gumroad-welcome-emails] failed to send to ${email}:`, err.message);
      failed++;
    }
  }

  console.log(`[gumroad-welcome-emails] ${importId} done — sent:${sent} failed:${failed}`);
}
