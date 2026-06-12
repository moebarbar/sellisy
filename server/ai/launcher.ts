// AI Store Launcher pipeline.
//
// Safety architecture: the pipeline is split so that EVERYTHING fallible
// happens before anything is written.
//
//   stage 1  generateIdentity()   — Claude call, pure
//   stage 2  selectProducts()     — Claude call, pure; every returned id is
//                                   validated against the real catalog
//   stage 3  assembleStore()      — deterministic DB writes only; on any
//                                   mid-assembly error the store is hard-
//                                   deleted so a retry starts clean
//
// All validation lives in exported pure functions so it's unit-testable
// without network or DB (tests/ai-launcher.test.ts).

import { canAccessTier, type PlanTier, type Product } from "@shared/schema";
import { claudeJson } from "../lib/anthropic";
// NOTE: storage is lazy-imported inside assembleStore so this module stays
// importable without a DATABASE_URL (the pure functions are unit-tested
// standalone in tests/ai-launcher.test.ts).

// ── Types ─────────────────────────────────────────────────────────────

export interface StoreIdentity {
  name: string;
  slug: string;
  tagline: string;
  templateKey: string;
  accentColor: string | null;
  aboutHeadline: string;
  aboutText: string;
  seoTitle: string;
  seoDescription: string;
  newsletterHeadline: string;
  newsletterSubtext: string;
}

export interface CatalogEntry {
  id: string;
  title: string;
  category: string;
  priceCents: number;
  blurb: string;
}

export interface ProductSelection {
  productIds: string[]; // validated, deduped, 4–10, first 2 featured
}

export class LaunchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaunchValidationError";
  }
}

// Must match the templateKey enum on POST /api/stores and the
// template-selector UI.
export const VALID_TEMPLATES = ["neon", "silk", "aurora", "ember", "frost", "midnight", "launch"] as const;

const TEMPLATE_VIBES: Record<string, string> = {
  neon: "bold, electric, high-energy — fits gaming, fitness, hype-driven niches",
  silk: "elegant, minimal, refined — fits luxury, beauty, premium templates",
  aurora: "soft gradients, dreamy, creative — fits design assets, art, wellness",
  ember: "warm, earthy, inviting — fits food, lifestyle, coaching",
  frost: "clean, cool, professional — fits business tools, productivity, SaaS-adjacent",
  midnight: "dark, premium, focused — fits software, finance, developer tools",
  launch: "modern startup feel — fits makers, indie products, tech templates",
};

// ── Pure: catalog condensation ────────────────────────────────────────

const MAX_CATALOG_ENTRIES = 250;

export function condenseCatalog(products: Product[], userTier: PlanTier): CatalogEntry[] {
  return products
    .filter((p) =>
      p.status === "ACTIVE" &&
      !p.deletedAt &&
      !p.billingInterval && // launches stock one-time products only
      canAccessTier(userTier, (p.requiredTier as PlanTier) || "basic"),
    )
    .slice(0, MAX_CATALOG_ENTRIES)
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      priceCents: p.priceCents,
      blurb: (p.tagline || p.description || "").replace(/\s+/g, " ").trim().slice(0, 140),
    }));
}

// ── Pure: response validation ─────────────────────────────────────────

function asTrimmedString(v: unknown, field: string, min: number, max: number): string {
  if (typeof v !== "string") throw new LaunchValidationError(`${field} missing or not a string`);
  const s = v.replace(/\s+/g, " ").trim();
  if (s.length < min) throw new LaunchValidationError(`${field} too short`);
  return s.slice(0, max);
}

export function validateIdentity(raw: any): StoreIdentity {
  if (!raw || typeof raw !== "object") throw new LaunchValidationError("identity response is not an object");

  const name = asTrimmedString(raw.name, "name", 2, 60);

  const normalizeSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  // Try the model's slug; fall back to slugifying the name when it
  // normalizes to nothing (e.g. all punctuation or non-latin glyphs).
  let slug = normalizeSlug(typeof raw.slug === "string" ? raw.slug : name);
  if (slug.length < 2) slug = normalizeSlug(name);
  if (slug.length < 2) throw new LaunchValidationError("slug unusable after normalization");

  const templateKey = typeof raw.templateKey === "string" && (VALID_TEMPLATES as readonly string[]).includes(raw.templateKey)
    ? raw.templateKey
    : "launch"; // safe default rather than failing the run on a bad pick

  let accentColor: string | null = null;
  if (typeof raw.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor.trim())) {
    accentColor = raw.accentColor.trim().toLowerCase();
  }

  return {
    name,
    slug,
    tagline: asTrimmedString(raw.tagline, "tagline", 5, 180),
    templateKey,
    accentColor,
    aboutHeadline: asTrimmedString(raw.aboutHeadline, "aboutHeadline", 5, 120),
    aboutText: asTrimmedString(raw.aboutText, "aboutText", 30, 1200),
    seoTitle: asTrimmedString(raw.seoTitle, "seoTitle", 5, 70),
    seoDescription: asTrimmedString(raw.seoDescription, "seoDescription", 20, 160),
    newsletterHeadline: asTrimmedString(raw.newsletterHeadline, "newsletterHeadline", 3, 100),
    newsletterSubtext: asTrimmedString(raw.newsletterSubtext, "newsletterSubtext", 5, 200),
  };
}

export function validateSelection(raw: any, catalog: CatalogEntry[]): ProductSelection {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.productIds)) {
    throw new LaunchValidationError("selection response missing productIds array");
  }
  const catalogIds = new Set(catalog.map((c) => c.id));
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const id of raw.productIds) {
    if (typeof id !== "string" || !catalogIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    valid.push(id);
    if (valid.length >= 10) break;
  }
  if (valid.length < 4) {
    throw new LaunchValidationError(`only ${valid.length} of the selected products exist in the catalog (need ≥ 4)`);
  }
  return { productIds: valid };
}

// ── Prompts ───────────────────────────────────────────────────────────

const COPY_RULES = `Rules for all copy:
- Specific to this niche; no generic filler ("welcome to my store", "high quality products").
- Confident and human. No hype-speak, no emoji, no exclamation marks in headings.
- NEVER invent statistics, customer counts, testimonials, discounts, or guarantees.
- US English.`;

export function buildIdentityPrompt(brief: string): string {
  const themes = (VALID_TEMPLATES as readonly string[]).map((t) => `- "${t}": ${TEMPLATE_VIBES[t]}`).join("\n");
  return `You are naming and writing copy for a new digital-product storefront on Sellisy.

The store owner's brief: "${brief}"

Available visual themes:
${themes}

${COPY_RULES}

Respond with ONLY this JSON object:
{
  "name": "store name, 2-30 chars, memorable, no 'Store'/'Shop' suffix unless it genuinely fits",
  "slug": "url-slug-lowercase",
  "tagline": "one sentence positioning the store, max 120 chars",
  "templateKey": "one of the theme keys above, matched to the niche's vibe",
  "accentColor": "#rrggbb hex matched to the niche (or null to keep the theme default)",
  "aboutHeadline": "about-section heading, max 80 chars",
  "aboutText": "2-3 sentence about section in the owner's voice (first person), max 600 chars",
  "seoTitle": "search-result title, 40-60 chars, includes the niche",
  "seoDescription": "search-result description, 120-155 chars",
  "newsletterHeadline": "newsletter signup heading, max 60 chars",
  "newsletterSubtext": "one line on what subscribers get, max 120 chars"
}`;
}

export function buildSelectionPrompt(brief: string, identity: StoreIdentity, catalog: CatalogEntry[]): string {
  const lines = catalog.map((c) => `${c.id} | ${c.title} | ${c.category} | $${(c.priceCents / 100).toFixed(2)} | ${c.blurb}`).join("\n");
  return `You are stocking a new digital-product storefront called "${identity.name}" — ${identity.tagline}

The store owner's brief: "${brief}"

Below is the product catalog available to import (format: id | title | category | price | description). Choose the products that BEST fit this store's niche and would feel like a coherent, curated collection — not a grab bag.

${lines}

Selection rules:
- Pick 6 to 10 products. Order matters: put the strongest fits first (the first 2 become featured).
- Only choose products genuinely relevant to the niche. If fewer than 6 are truly relevant, pick the relevant ones plus the closest adjacent fits to reach 6.
- Use ONLY ids from the list above, exactly as written.

Respond with ONLY this JSON object:
{ "productIds": ["id1", "id2", ...] }`;
}

// ── AI stages ─────────────────────────────────────────────────────────

export async function generateIdentity(brief: string): Promise<StoreIdentity> {
  const raw = await claudeJson({ prompt: buildIdentityPrompt(brief), maxTokens: 1024 });
  return validateIdentity(raw);
}

export async function selectProducts(brief: string, identity: StoreIdentity, catalog: CatalogEntry[]): Promise<ProductSelection> {
  if (catalog.length === 0) throw new LaunchValidationError("the product library is empty for this plan tier");
  const raw = await claudeJson({ prompt: buildSelectionPrompt(brief, identity, catalog), maxTokens: 512 });
  return validateSelection(raw, catalog);
}

// ── Assembly (deterministic DB writes) ────────────────────────────────

export async function assembleStore(params: {
  userId: string;
  identity: StoreIdentity;
  selection: ProductSelection;
}): Promise<{ storeId: string; slug: string; productCount: number }> {
  const { userId, identity, selection } = params;
  const { storage } = await import("../storage");

  // Unique slug: suffix until free.
  let slug = identity.slug;
  let counter = 1;
  while (await storage.getStoreBySlug(slug)) {
    slug = `${identity.slug}-${counter++}`;
    if (counter > 50) throw new LaunchValidationError("could not find a free slug");
  }

  const store = await storage.createStore({
    ownerId: userId,
    name: identity.name,
    slug,
    templateKey: identity.templateKey,
  });

  try {
    await storage.updateStore(store.id, {
      tagline: identity.tagline,
      accentColor: identity.accentColor,
      aboutEnabled: true,
      aboutHeadline: identity.aboutHeadline,
      aboutText: identity.aboutText,
      seoTitle: identity.seoTitle,
      seoDescription: identity.seoDescription,
      newsletterEnabled: true,
      newsletterHeadline: identity.newsletterHeadline,
      newsletterSubtext: identity.newsletterSubtext,
      reviewsEnabled: true,
    });

    for (let i = 0; i < selection.productIds.length; i++) {
      await storage.createStoreProduct({
        storeId: store.id,
        productId: selection.productIds[i],
        isPublished: true,
        isFeatured: i < 2,
      });
    }

    return { storeId: store.id, slug, productCount: selection.productIds.length };
  } catch (err) {
    // Roll the whole thing back so a retry starts clean — never leave a
    // half-stocked store behind.
    try {
      await storage.hardDeleteStore(store.id);
    } catch (cleanupErr: any) {
      console.error("[ai-launcher] cleanup after failed assembly also failed:", store.id, cleanupErr.message);
    }
    throw err;
  }
}
