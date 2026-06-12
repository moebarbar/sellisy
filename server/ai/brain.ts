// Sellisy Brain — turns a store's real week of analytics into a prioritized
// action plan. Same safety architecture as the AI launcher: data collection
// and the AI call are side-effect-free, every model output is validated
// (action links against a hard allowlist) before anything is stored.
//
// DB-touching helpers lazy-import their dependencies so the pure functions
// stay unit-testable without DATABASE_URL (tests/brain.test.ts).

import { claudeJson } from "../lib/anthropic";

// ── Types ─────────────────────────────────────────────────────────────

export interface BrainMetrics {
  periodDays: number;
  revenueCents: number;
  prevRevenueCents: number;
  orders: number;
  prevOrders: number;
  avgOrderCents: number;
  uniqueVisitors: number;
  productViews: number;
  checkoutStarts: number;
  conversionRate: number; // orders / uniqueVisitors, %
  publishedProducts: number;
  newsletterSubscribers: number;
  topProducts: { title: string; revenueCents: number; views: number; conversionRate: number }[];
  activeCoupons: number;
  affiliateProgramEnabled: boolean;
}

export interface BrainAction {
  title: string;
  body: string;
  linkPath: string;
  priority: 1 | 2 | 3; // 1 = do first
}

export interface BrainPlan {
  summary: string;
  actions: BrainAction[];
}

export class BrainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainValidationError";
  }
}

// Hard allowlist — the model picks from this menu and anything else is
// dropped at validation. Keys are the paths; values describe when the
// model should send the seller there.
export const ALLOWED_LINKS: Record<string, string> = {
  "/dashboard/products": "manage or publish store products, change prices, configure upsells",
  "/dashboard/my-products": "create a new product",
  "/dashboard/library": "import ready-made products from the PLR library",
  "/dashboard/coupons": "create a discount code",
  "/dashboard/newsletter": "email subscribers a campaign (AI drafting available)",
  "/dashboard/bundles": "bundle products together at a combined price",
  "/dashboard/marketing": "marketing playbook strategies",
  "/dashboard/affiliates": "set up or manage the affiliate program",
  "/dashboard/analytics": "dig into traffic and conversion data",
  "/dashboard/customers": "view customers and members",
  "/dashboard/blog": "write a blog post for SEO traffic",
  "/dashboard/courses": "manage course content",
  "/dashboard/settings": "store settings — branding, payments, automations",
};

// ── Pure: validation ──────────────────────────────────────────────────

function clampStr(v: unknown, min: number, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  if (s.length < min) return null;
  return s.slice(0, max);
}

export function validateBrainPlan(raw: any): BrainPlan {
  if (!raw || typeof raw !== "object") throw new BrainValidationError("plan is not an object");

  const summary = clampStr(raw.summary, 20, 600);
  if (!summary) throw new BrainValidationError("summary missing or too short");

  if (!Array.isArray(raw.actions)) throw new BrainValidationError("actions missing");
  const actions: BrainAction[] = [];
  for (const a of raw.actions) {
    if (!a || typeof a !== "object") continue;
    const title = clampStr(a.title, 5, 80);
    const body = clampStr(a.body, 20, 300);
    const linkPath = typeof a.linkPath === "string" && ALLOWED_LINKS[a.linkPath] ? a.linkPath : null;
    if (!title || !body || !linkPath) continue; // drop malformed/off-menu actions
    const priority = a.priority === 1 || a.priority === 3 ? a.priority : 2;
    actions.push({ title, body, linkPath, priority });
    if (actions.length >= 6) break;
  }
  if (actions.length === 0) throw new BrainValidationError("no valid actions survived validation");

  actions.sort((x, y) => x.priority - y.priority);
  return { summary, actions };
}

// ── Pure: prompt ──────────────────────────────────────────────────────

export function buildBrainPrompt(storeName: string, m: BrainMetrics): string {
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
  const delta = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? "up from zero" : "flat at zero") : `${cur >= prev ? "+" : ""}${Math.round(((cur - prev) / prev) * 100)}% vs prior week`;

  const top = m.topProducts.length
    ? m.topProducts.map((p) => `- ${p.title}: ${fmt(p.revenueCents)} revenue, ${p.views} views, ${p.conversionRate.toFixed(1)}% conversion`).join("\n")
    : "- (no product sales this week)";

  const links = Object.entries(ALLOWED_LINKS).map(([k, v]) => `- "${k}": ${v}`).join("\n");

  return `You are Sellisy Brain, the weekly growth advisor for "${storeName}", a digital-product storefront. Analyze this week's REAL data and produce a short, sharp action plan.

This week (last ${m.periodDays} days):
- Revenue: ${fmt(m.revenueCents)} (${delta(m.revenueCents, m.prevRevenueCents)})
- Orders: ${m.orders} (${delta(m.orders, m.prevOrders)}) · Avg order: ${fmt(m.avgOrderCents)}
- Traffic: ${m.uniqueVisitors} unique visitors, ${m.productViews} product views, ${m.checkoutStarts} checkout starts
- Visitor→order conversion: ${m.conversionRate.toFixed(1)}%
- Store: ${m.publishedProducts} published products, ${m.newsletterSubscribers} newsletter subscribers, ${m.activeCoupons} active coupons, affiliate program ${m.affiliateProgramEnabled ? "ON" : "OFF"}
Top products:
${top}

Available action destinations (linkPath MUST be exactly one of these):
${links}

Rules:
- The numbers above are the ONLY numbers you may cite. Never invent data, benchmarks, or percentages.
- 3 to 5 actions, each tied to the most relevant linkPath. Be specific to THIS store's data ("Your checkout starts outnumber orders 4:1 — recover them" beats "improve conversion").
- If the store has little/no data yet, the plan is about getting the first sales: traffic, publishing, list-building. Say that plainly.
- Plain, confident, no hype. No emoji.

Respond with ONLY this JSON:
{
  "summary": "2-3 sentences: the week's story and the single most important thing to do, citing real numbers",
  "actions": [
    { "title": "imperative, max 60 chars", "body": "why + what to do, citing the data, max 250 chars", "linkPath": "/dashboard/...", "priority": 1 }
  ]
}`;
}

// ── Metrics collection (DB) ───────────────────────────────────────────

export async function collectBrainMetrics(storeId: string): Promise<BrainMetrics> {
  const { getRevenueAnalytics, getProductAnalytics, getTrafficAnalytics } = await import("../analytics");
  const { storage } = await import("../storage");

  const [revenue, productsA, traffic, store, sps, coupons, subscriberCount] = await Promise.all([
    getRevenueAnalytics(storeId, "7d"),   // { totalRevenue, totalOrders, avgOrderValue, prevRevenue, prevOrders, ... }
    getProductAnalytics(storeId, "7d"),   // { products: [{title, revenue, views, conversionRate, ...}], ... } sorted by revenue desc
    getTrafficAnalytics(storeId, "7d"),   // { productViews, checkoutStarts, uniqueVisitorsTotal, ... }
    storage.getStoreById(storeId),
    storage.getStoreProducts(storeId),
    storage.getCouponsByStore(storeId),
    storage.getNewsletterSubscriberCount(storeId),
  ]);

  const uniqueVisitors = traffic.uniqueVisitorsTotal;

  const topProducts = productsA.products.slice(0, 3).map((p) => ({
    title: p.title,
    revenueCents: p.revenue,
    views: p.views,
    conversionRate: p.conversionRate,
  }));

  return {
    periodDays: 7,
    revenueCents: revenue.totalRevenue,
    prevRevenueCents: revenue.prevRevenue,
    orders: revenue.totalOrders,
    prevOrders: revenue.prevOrders,
    avgOrderCents: revenue.avgOrderValue,
    uniqueVisitors,
    productViews: traffic.productViews,
    checkoutStarts: traffic.checkoutStarts,
    conversionRate: uniqueVisitors > 0 ? (revenue.totalOrders / uniqueVisitors) * 100 : 0,
    publishedProducts: sps.filter((sp) => sp.isPublished).length,
    newsletterSubscribers: subscriberCount,
    topProducts,
    activeCoupons: coupons.filter((c) => c.isActive && !c.deletedAt).length,
    affiliateProgramEnabled: !!store?.affiliateProgramEnabled,
  };
}

// ── Generation ────────────────────────────────────────────────────────

export async function generateBrainPlan(storeName: string, metrics: BrainMetrics): Promise<BrainPlan> {
  const raw = await claudeJson({ prompt: buildBrainPrompt(storeName, metrics), maxTokens: 1500 });
  return validateBrainPlan(raw);
}
