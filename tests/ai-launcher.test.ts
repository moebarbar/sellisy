import { describe, it, expect } from "vitest";
import {
  condenseCatalog,
  validateIdentity,
  validateSelection,
  buildIdentityPrompt,
  buildSelectionPrompt,
  LaunchValidationError,
  VALID_TEMPLATES,
  type CatalogEntry,
} from "../server/ai/launcher";
import { stripJsonFences } from "../server/lib/anthropic";

// ── stripJsonFences ───────────────────────────────────────────────────

describe("stripJsonFences", () => {
  it("passes plain JSON through", () => {
    expect(stripJsonFences('{"a":1}')).toBe('{"a":1}');
  });
  it("strips markdown fences", () => {
    expect(stripJsonFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripJsonFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it("recovers from a prose preamble", () => {
    expect(stripJsonFences('Here is the JSON:\n{"a":1}')).toBe('{"a":1}');
  });
  it("handles arrays", () => {
    expect(stripJsonFences("```json\n[1,2]\n```")).toBe("[1,2]");
  });
});

// ── condenseCatalog ───────────────────────────────────────────────────

function fakeProduct(over: Partial<any> = {}): any {
  return {
    id: over.id ?? "p1",
    title: "Notion Template Pack",
    category: "templates",
    priceCents: 1900,
    tagline: "A tidy tagline",
    description: "Long description ".repeat(30),
    status: "ACTIVE",
    deletedAt: null,
    billingInterval: null,
    requiredTier: "basic",
    ...over,
  };
}

describe("condenseCatalog", () => {
  it("includes active basic products for basic tier", () => {
    const out = condenseCatalog([fakeProduct()], "basic");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: "p1", category: "templates", priceCents: 1900 });
  });
  it("excludes drafts, deleted, and subscription products", () => {
    const out = condenseCatalog([
      fakeProduct({ id: "draft", status: "DRAFT" }),
      fakeProduct({ id: "deleted", deletedAt: new Date() }),
      fakeProduct({ id: "sub", billingInterval: "month" }),
      fakeProduct({ id: "ok" }),
    ], "max");
    expect(out.map((c) => c.id)).toEqual(["ok"]);
  });
  it("enforces tier gating on premium products", () => {
    const products = [fakeProduct({ id: "basic-p" }), fakeProduct({ id: "pro-p", requiredTier: "pro" })];
    expect(condenseCatalog(products, "basic").map((c) => c.id)).toEqual(["basic-p"]);
    expect(condenseCatalog(products, "pro").map((c) => c.id)).toEqual(["basic-p", "pro-p"]);
  });
  it("prefers tagline for the blurb and caps at 140 chars", () => {
    const out = condenseCatalog([fakeProduct({ tagline: null })], "basic");
    expect(out[0].blurb.length).toBeLessThanOrEqual(140);
    expect(out[0].blurb).not.toContain("\n");
  });
});

// ── validateIdentity ──────────────────────────────────────────────────

function validIdentityRaw(over: Partial<any> = {}): any {
  return {
    name: "Pixel & Prose",
    slug: "pixel-and-prose",
    tagline: "Design assets for indie storytellers",
    templateKey: "aurora",
    accentColor: "#7C3AED",
    aboutHeadline: "Made for makers",
    aboutText: "I build design assets for indie creators who want their projects to look professional without hiring a studio.",
    seoTitle: "Pixel & Prose — Design Assets for Indie Creators",
    seoDescription: "Templates, fonts, and graphics curated for indie storytellers. Instant download, lifetime access, made by a working designer.",
    newsletterHeadline: "New drops, monthly",
    newsletterSubtext: "One email a month with new assets and freebies.",
    ...over,
  };
}

describe("validateIdentity", () => {
  it("accepts a fully valid response", () => {
    const id = validateIdentity(validIdentityRaw());
    expect(id.name).toBe("Pixel & Prose");
    expect(id.slug).toBe("pixel-and-prose");
    expect(id.accentColor).toBe("#7c3aed");
  });
  it("normalizes a messy slug", () => {
    const id = validateIdentity(validIdentityRaw({ slug: "  Pixel & Prose!! " }));
    expect(id.slug).toMatch(/^[a-z0-9-]+$/);
    expect(id.slug).not.toMatch(/^-|-$/);
  });
  it("falls back to the name when slug is unusable", () => {
    const id = validateIdentity(validIdentityRaw({ slug: "!!!" }));
    expect(id.slug.length).toBeGreaterThanOrEqual(2);
  });
  it("defaults bad templateKey to launch instead of failing", () => {
    const id = validateIdentity(validIdentityRaw({ templateKey: "vaporwave" }));
    expect(id.templateKey).toBe("launch");
    expect(VALID_TEMPLATES).toContain(id.templateKey as any);
  });
  it("nulls an invalid accent color", () => {
    expect(validateIdentity(validIdentityRaw({ accentColor: "purple" })).accentColor).toBeNull();
    expect(validateIdentity(validIdentityRaw({ accentColor: "#zzz" })).accentColor).toBeNull();
    expect(validateIdentity(validIdentityRaw({ accentColor: null })).accentColor).toBeNull();
  });
  it("rejects a missing name", () => {
    expect(() => validateIdentity(validIdentityRaw({ name: undefined }))).toThrow(LaunchValidationError);
  });
  it("rejects an effectively empty aboutText", () => {
    expect(() => validateIdentity(validIdentityRaw({ aboutText: "short" }))).toThrow(LaunchValidationError);
  });
  it("clamps over-long fields rather than failing", () => {
    const id = validateIdentity(validIdentityRaw({ tagline: "x".repeat(500) }));
    expect(id.tagline.length).toBeLessThanOrEqual(180);
  });
  it("rejects non-object responses", () => {
    expect(() => validateIdentity(null)).toThrow(LaunchValidationError);
    expect(() => validateIdentity("a string")).toThrow(LaunchValidationError);
  });
});

// ── validateSelection ─────────────────────────────────────────────────

const CATALOG: CatalogEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `prod-${i}`,
  title: `Product ${i}`,
  category: "templates",
  priceCents: 1000 + i,
  blurb: "blurb",
}));

describe("validateSelection", () => {
  it("accepts a valid pick and preserves order", () => {
    const sel = validateSelection({ productIds: ["prod-3", "prod-1", "prod-5", "prod-7", "prod-2", "prod-9"] }, CATALOG);
    expect(sel.productIds).toEqual(["prod-3", "prod-1", "prod-5", "prod-7", "prod-2", "prod-9"]);
  });
  it("drops hallucinated ids and duplicates", () => {
    const sel = validateSelection(
      { productIds: ["prod-1", "made-up-id", "prod-1", "prod-2", "prod-3", "prod-4", "prod-5"] },
      CATALOG,
    );
    expect(sel.productIds).toEqual(["prod-1", "prod-2", "prod-3", "prod-4", "prod-5"]);
  });
  it("caps at 10", () => {
    const sel = validateSelection({ productIds: CATALOG.map((c) => c.id) }, CATALOG);
    expect(sel.productIds).toHaveLength(10);
  });
  it("fails when fewer than 4 real products survive validation", () => {
    expect(() => validateSelection({ productIds: ["prod-1", "fake-1", "fake-2", "fake-3"] }, CATALOG))
      .toThrow(LaunchValidationError);
  });
  it("fails on a malformed response", () => {
    expect(() => validateSelection({ products: [] }, CATALOG)).toThrow(LaunchValidationError);
    expect(() => validateSelection(null, CATALOG)).toThrow(LaunchValidationError);
  });
});

// ── prompts ───────────────────────────────────────────────────────────

describe("prompts", () => {
  it("identity prompt embeds the brief and all themes", () => {
    const p = buildIdentityPrompt("I sell icon packs for mobile designers");
    expect(p).toContain("icon packs for mobile designers");
    for (const t of VALID_TEMPLATES) expect(p).toContain(`"${t}"`);
    expect(p).toContain("NEVER invent statistics");
  });
  it("selection prompt lists every catalog id", () => {
    const identity = validateIdentity(validIdentityRaw());
    const p = buildSelectionPrompt("brief", identity, CATALOG.slice(0, 3));
    for (const c of CATALOG.slice(0, 3)) expect(p).toContain(c.id);
    expect(p).toContain(identity.name);
  });
});
