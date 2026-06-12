import { describe, it, expect } from "vitest";
import {
  validateBrainPlan,
  buildBrainPrompt,
  ALLOWED_LINKS,
  BrainValidationError,
  type BrainMetrics,
} from "../server/ai/brain";

const METRICS: BrainMetrics = {
  periodDays: 7,
  revenueCents: 42500,
  prevRevenueCents: 31000,
  orders: 17,
  prevOrders: 12,
  avgOrderCents: 2500,
  uniqueVisitors: 412,
  productViews: 890,
  checkoutStarts: 64,
  conversionRate: 4.1,
  publishedProducts: 8,
  newsletterSubscribers: 156,
  topProducts: [
    { title: "Freelancer OS", revenueCents: 20300, views: 310, conversionRate: 2.9 },
    { title: "Pricing Calculator", revenueCents: 9900, views: 120, conversionRate: 5.0 },
  ],
  activeCoupons: 1,
  affiliateProgramEnabled: false,
};

function validPlan(over: Partial<any> = {}): any {
  return {
    summary: "Revenue grew 37% to $425.00 on 17 orders. Your checkout starts (64) far outnumber orders — recovering even a fraction is the biggest available win this week.",
    actions: [
      { title: "Recover abandoned checkouts", body: "64 visitors started checkout but only 17 bought. Cart recovery emails are on — add a small comeback coupon to sweeten the return trip.", linkPath: "/dashboard/coupons", priority: 1 },
      { title: "Email your 156 subscribers", body: "Your list hasn't heard from you. Draft a campaign featuring Freelancer OS, your top earner at $203.00 this week.", linkPath: "/dashboard/newsletter", priority: 2 },
      { title: "Turn on the affiliate program", body: "Affiliates are off. With a converting store (4.1%), letting fans promote for a cut is free distribution.", linkPath: "/dashboard/affiliates", priority: 3 },
    ],
    ...over,
  };
}

describe("validateBrainPlan", () => {
  it("accepts a valid plan and sorts by priority", () => {
    const plan = validateBrainPlan(validPlan({
      actions: [
        { title: "Second thing to do", body: "This is the second-priority action with enough body text.", linkPath: "/dashboard/newsletter", priority: 2 },
        { title: "First thing to do", body: "This is the first-priority action with enough body text.", linkPath: "/dashboard/coupons", priority: 1 },
      ],
    }));
    expect(plan.actions[0].priority).toBe(1);
    expect(plan.actions[1].priority).toBe(2);
  });

  it("drops actions with off-menu linkPaths", () => {
    const plan = validateBrainPlan(validPlan({
      actions: [
        { title: "Legit coupon action", body: "A real action body that is long enough to pass validation.", linkPath: "/dashboard/coupons", priority: 1 },
        { title: "Evil external link", body: "This one points somewhere that is not on the allowlist menu.", linkPath: "https://evil.example.com", priority: 1 },
        { title: "Unknown internal path", body: "This one points to a dashboard page that does not exist today.", linkPath: "/dashboard/secret", priority: 1 },
      ],
    }));
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].linkPath).toBe("/dashboard/coupons");
  });

  it("fails when no actions survive", () => {
    expect(() => validateBrainPlan(validPlan({
      actions: [{ title: "Bad", body: "short", linkPath: "/nope", priority: 1 }],
    }))).toThrow(BrainValidationError);
  });

  it("normalizes bad priorities to 2 and caps at 6 actions", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      title: `Action number ${i} title`,
      body: "A sufficiently long body for this generated action to pass validation.",
      linkPath: "/dashboard/products",
      priority: 99,
    }));
    const plan = validateBrainPlan(validPlan({ actions: many }));
    expect(plan.actions.length).toBeLessThanOrEqual(6);
    expect(plan.actions.every((a) => a.priority === 2)).toBe(true);
  });

  it("rejects missing/short summaries and non-objects", () => {
    expect(() => validateBrainPlan(validPlan({ summary: "too short" }))).toThrow(BrainValidationError);
    expect(() => validateBrainPlan(null)).toThrow(BrainValidationError);
    expect(() => validateBrainPlan({ summary: validPlan().summary })).toThrow(BrainValidationError);
  });

  it("clamps over-long fields instead of failing", () => {
    const plan = validateBrainPlan(validPlan({
      summary: "S".repeat(2000),
      actions: [{ title: "T".repeat(300), body: "B".repeat(900), linkPath: "/dashboard/blog", priority: 1 }],
    }));
    expect(plan.summary.length).toBeLessThanOrEqual(600);
    expect(plan.actions[0].title.length).toBeLessThanOrEqual(80);
    expect(plan.actions[0].body.length).toBeLessThanOrEqual(300);
  });
});

describe("buildBrainPrompt", () => {
  it("embeds the real numbers and every allowed link", () => {
    const p = buildBrainPrompt("Desk & Brief", METRICS);
    expect(p).toContain("$425.00");
    expect(p).toContain("17");
    expect(p).toContain("Freelancer OS");
    expect(p).toContain("affiliate program OFF");
    for (const path of Object.keys(ALLOWED_LINKS)) expect(p).toContain(`"${path}"`);
    expect(p).toContain("Never invent data");
  });

  it("handles a zero-data store without dividing by zero", () => {
    const empty: BrainMetrics = { ...METRICS, revenueCents: 0, prevRevenueCents: 0, orders: 0, prevOrders: 0, uniqueVisitors: 0, productViews: 0, checkoutStarts: 0, conversionRate: 0, topProducts: [], newsletterSubscribers: 0, activeCoupons: 0 };
    const p = buildBrainPrompt("Fresh Store", empty);
    expect(p).toContain("flat at zero");
    expect(p).toContain("no product sales this week");
  });
});
