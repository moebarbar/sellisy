import type { Job } from 'bullmq';
import { sql, eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
  gumroadImports,
  gumroadProductShells,
  products,
  customers,
  orders,
  orderItems,
} from '../../shared/schema';
import { decryptToken } from '../crypto/token-encryption';
import * as gumroad from '../gumroad/client';
import { GumroadAPIError } from '../gumroad/types';
import { isR2Available, putObject, getPublicUrl } from '../r2Storage';
import { randomUUID } from 'crypto';

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(baseSlug: string, ownerId: string): Promise<string> {
  let slug = baseSlug;
  let n = 0;
  while (true) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug));
    if (!existing) return slug;
    n++;
    slug = `${baseSlug}-${n}`;
  }
}

async function reHostThumbnail(url: string, ownerId: string): Promise<string | null> {
  if (!isR2Available()) return url;
  try {
    const buf = await gumroad.fetchThumbnail(url);
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const key = `thumbnails/${ownerId}/${randomUUID()}.${ext}`;
    await putObject(key, buf, contentType);
    return getPublicUrl(key);
  } catch {
    return url;
  }
}

async function rewriteDescription(productName: string, original: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return original;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are rewriting a product description for a digital product store. Improve the following description for "${productName}" to be cleaner, more professional, and conversion-focused. Keep the same key information. Return only the rewritten description, no preamble.\n\n${original}`,
      }],
    }),
  });

  if (!res.ok) return original;
  const json = await res.json() as any;
  return json?.content?.[0]?.text ?? original;
}

// Gumroad returns product descriptions as HTML markup. We render them as
// plain text on Sellisy, so raw <p>/<ul>/<li>/<strong> tags would display
// visibly to buyers. This converter:
//   - Drops <script>/<style> blocks entirely
//   - Inserts blank line after </p>, <br>, <h1-6>
//   - Prefixes "- " to <li> items
//   - Strips remaining tags but keeps their text content
//   - Decodes the most common HTML entities
//   - Collapses runs of >2 blank lines to exactly 2
// Output is human-readable text that lines up with how Sellisy renders
// it (whitespace-pre-wrap on the storefront and dashboard).
function htmlToCleanText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')        // strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/[ \t]+\n/g, '\n')     // trailing whitespace per line
    .replace(/\n{3,}/g, '\n\n')     // cap at 2 blank lines
    .trim();
}

function incrementField(field: any) {
  return sql`${field} + 1`;
}

// ── Main job ──────────────────────────────────────────────────────────────────

export async function processGumroadImport(job: Job) {
  const { importId, selectedProductIds, options } = job.data as {
    importId: string;
    selectedProductIds: string[];
    options: { importCustomers: boolean; importSales: boolean; rewriteDescriptionsWithAI: boolean };
  };

  const [importRecord] = await db.select().from(gumroadImports).where(eq(gumroadImports.id, importId));
  if (!importRecord) throw new Error(`Import record ${importId} not found`);
  if (importRecord.status !== 'pending') {
    console.warn(`[gumroad-import] ${importId} already in status ${importRecord.status}, skipping`);
    return;
  }

  await db.update(gumroadImports)
    .set({ status: 'importing', startedAt: new Date() })
    .where(eq(gumroadImports.id, importId));

  const accessToken = decryptToken(importRecord.accessTokenEncrypted);

  try {
    // ── Products ────────────────────────────────────────────────────────────

    const allGumroadProducts = await gumroad.listProducts(accessToken);
    const selectedSet = new Set(selectedProductIds);
    const toImport = allGumroadProducts.filter(p => selectedSet.has(p.id) && !p.deleted);

    await db.update(gumroadImports)
      .set({ productsTotal: toImport.length })
      .where(eq(gumroadImports.id, importId));

    // gumroadProductId → sellisyProductId for the sales pass
    const productIdMap = new Map<string, string>();

    for (const gp of toImport) {
      // Skip if already imported (idempotent on retry)
      const [existing] = await db.select({ id: products.id })
        .from(products)
        .where(eq(products.gumroadProductId, gp.id));
      if (existing) {
        productIdMap.set(gp.id, existing.id);
        await db.update(gumroadImports)
          .set({ productsImported: incrementField(gumroadImports.productsImported) })
          .where(eq(gumroadImports.id, importId));
        continue;
      }

      const thumbnailUrl = gp.thumbnail_url
        ? await reHostThumbnail(gp.thumbnail_url, importRecord.ownerId)
        : null;

      // Gumroad returns descriptions as HTML (<p>, <ul>, <li>, <strong>...).
      // Sellisy stores plain text and renders with whitespace-pre-wrap, so
      // raw HTML would show up as visible markup. Convert to clean text
      // first — preserving paragraph breaks, list bullets, and headings.
      let description = htmlToCleanText(gp.description ?? '');
      if (options.rewriteDescriptionsWithAI && description.trim()) {
        description = await rewriteDescription(gp.name, description);
      }

      const baseSlug = slugify(gp.name) || randomUUID().slice(0, 8);
      const slug = await uniqueSlug(baseSlug, importRecord.ownerId);

      const [newProduct] = await db.insert(products).values({
        ownerId: importRecord.ownerId,
        title: gp.name,
        slug,
        description,
        priceCents: gp.price,
        thumbnailUrl,
        status: 'DRAFT',
        productType: 'digital',
        gumroadProductId: gp.id,
        importedFromGumroad: true,
        tags: gp.tags ?? [],
      }).returning();

      await db.insert(gumroadProductShells).values({
        importId,
        sellisyProductId: newProduct.id,
        gumroadProductId: gp.id,
        gumroadShortUrl: gp.short_url ?? null,
        fileStatus: 'missing',
        fileMatchHint: gp.name,
      });

      productIdMap.set(gp.id, newProduct.id);

      await db.update(gumroadImports)
        .set({ productsImported: incrementField(gumroadImports.productsImported) })
        .where(eq(gumroadImports.id, importId));
    }

    // ── Sales / Customers ────────────────────────────────────────────────────

    if (options.importSales || options.importCustomers) {
      const seenSaleIds = new Set<string>();

      for await (const batch of gumroad.listSales(accessToken)) {
        for (const sale of batch) {
          if (seenSaleIds.has(sale.id)) continue;
          seenSaleIds.add(sale.id);

          if (!productIdMap.has(sale.product_id)) continue;
          if (sale.refunded || sale.chargebacked) continue;

          const sellisyProductId = productIdMap.get(sale.product_id)!;

          // Upsert customer
          let customerId: string | undefined;
          if (options.importCustomers) {
            const [existingCustomer] = await db.select({ id: customers.id })
              .from(customers)
              .where(eq(customers.email, sale.email));

            if (existingCustomer) {
              customerId = existingCustomer.id;
            } else {
              const [newCustomer] = await db.insert(customers).values({
                email: sale.email,
                name: sale.full_name ?? undefined,
              }).returning();
              customerId = newCustomer.id;
              await db.update(gumroadImports)
                .set({ customersImported: incrementField(gumroadImports.customersImported) })
                .where(eq(gumroadImports.id, importId));
            }
          }

          // Insert order (idempotent — skip if gumroadSaleId already exists)
          if (options.importSales) {
            const [existingOrder] = await db
              .select({ id: orders.id })
              .from(orders)
              .where(and(
                eq(orders.storeId, importRecord.storeId),
                eq(orders.gumroadSaleId, sale.id),
              ));

            if (!existingOrder) {
              const [order] = await db.insert(orders).values({
                storeId: importRecord.storeId,
                buyerEmail: sale.email,
                customerId,
                totalCents: sale.price_cents,
                status: 'COMPLETED',
                emailSent: false,
                gumroadSaleId: sale.id,
              }).returning();

              await db.insert(orderItems).values({
                orderId: order.id,
                productId: sellisyProductId,
                priceCents: sale.price_cents,
              });

              await db.update(gumroadImports)
                .set({ salesImported: incrementField(gumroadImports.salesImported) })
                .where(eq(gumroadImports.id, importId));
            }
          }
        }
      }
    }

    // ── Done ─────────────────────────────────────────────────────────────────

    await db.update(gumroadImports).set({
      status: 'awaiting_files',
      accessTokenEncrypted: '',
    }).where(eq(gumroadImports.id, importId));

  } catch (err: any) {
    const friendlyMessage = (err instanceof GumroadAPIError && err.statusCode === 401)
      ? 'Gumroad access token was revoked or expired. Please start a new import with a valid token.'
      : (err.message ?? 'Unknown error');
    await db.update(gumroadImports).set({
      status: 'failed',
      errorMessage: friendlyMessage,
      accessTokenEncrypted: '',
    }).where(eq(gumroadImports.id, importId));
    throw err;
  }
}
