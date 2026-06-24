import { describe, it, expect, vi, beforeEach } from "vitest";
import { orders, downloadTokens } from "@shared/schema";

// ── Mock the boundaries so we exercise the REAL WebhookHandlers orchestration
// (commission math, refund determination, event routing) without a database,
// Stripe, or email. vi.hoisted lets the mock fns be referenced both in the
// vi.mock factories (hoisted to the top) and in the tests below.
const h = vi.hoisted(() => {
  const storage = {
    getCommissionByOrderId: vi.fn(),
    getAffiliateById: vi.fn(),
    getOrderById: vi.fn(),
    getOrderByStripeSession: vi.fn(),
    voidCommissionsForOrder: vi.fn(),
    getOrderItemsByOrder: vi.fn(),
    findOrCreateCustomer: vi.fn(),
    linkOrdersByEmail: vi.fn(),
    getStoreById: vi.fn(),
    updateUserPlan: vi.fn(),
  };
  const authStorage = { getUser: vi.fn() };
  const stripe = { checkout: { sessions: { list: vi.fn() } }, webhooks: { constructEvent: vi.fn() } };
  // Records every db.update(table).set(payload) so tests can assert what was written.
  const updateCalls: Array<{ table: unknown; set: any }> = [];
  const awaitableWithReturning = (rows: any[] = []) => ({
    then: (res: any, rej: any) => Promise.resolve(rows).then(res, rej),
    returning: () => Promise.resolve(rows),
  });
  const db = {
    update: (table: unknown) => ({
      set: (payload: any) => {
        updateCalls.push({ table, set: payload });
        return { where: () => awaitableWithReturning([]) };
      },
    }),
    transaction: vi.fn(),
    insert: vi.fn(),
  };
  return { storage, authStorage, stripe, db, updateCalls };
});

vi.mock("../server/storage", () => ({ storage: h.storage }));
vi.mock("../server/db", () => ({ db: h.db }));
vi.mock("../server/stripeClient", () => ({ getUncachableStripeClient: async () => h.stripe }));
vi.mock("../server/audit", () => ({ audit: vi.fn() }));
vi.mock("../server/orderEmailHelper", () => ({ sendOrderCompletionEmails: vi.fn() }));
vi.mock("../server/replit_integrations/auth/storage", () => ({ authStorage: h.authStorage }));

import { WebhookHandlers } from "../server/webhookHandlers";
import { sendOrderCompletionEmails } from "../server/orderEmailHelper";

beforeEach(() => {
  vi.clearAllMocks();
  h.updateCalls.length = 0;
});

// ───────────────────────────── Affiliate commission ─────────────────────────
describe("prepareAffiliateCommissionInsert (money owed to affiliates)", () => {
  const baseOrder = { id: "ord_1", storeId: "store_1", affiliateId: "aff_1", affiliateRateBps: 1000, totalCents: 10000, buyerEmail: "buyer@example.com" };

  function arrangeValidAffiliate() {
    h.storage.getCommissionByOrderId.mockResolvedValue(undefined);
    h.storage.getAffiliateById.mockResolvedValue({ id: "aff_1", status: "active", userId: "u_aff" });
    h.authStorage.getUser.mockResolvedValue({ id: "u_aff", email: "affiliate@example.com" });
  }

  it("computes commission as floor(subtotal * bps / 10000)", async () => {
    arrangeValidAffiliate();
    const insert = await WebhookHandlers.prepareAffiliateCommissionInsert(baseOrder);
    expect(insert).not.toBeNull();
    expect(insert!.commissionCents).toBe(1000); // 10% of $100.00
    expect(insert!.subtotalCents).toBe(10000);
    expect(insert!.commissionRateBps).toBe(1000);
    expect(insert!.orderId).toBe("ord_1");
    expect(insert!.affiliateId).toBe("aff_1");
    expect(insert!.status).toBe("pending");
  });

  it("returns null when the order has no affiliate attribution", async () => {
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert({ ...baseOrder, affiliateId: null })).toBeNull();
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert({ ...baseOrder, affiliateRateBps: null })).toBeNull();
  });

  it("returns null on a $0 order", async () => {
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert({ ...baseOrder, totalCents: 0 })).toBeNull();
  });

  it("returns null when a commission already exists (idempotent)", async () => {
    h.storage.getCommissionByOrderId.mockResolvedValue({ id: "comm_existing" });
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert(baseOrder)).toBeNull();
  });

  it("returns null when the affiliate is missing or not active", async () => {
    h.storage.getCommissionByOrderId.mockResolvedValue(undefined);
    h.storage.getAffiliateById.mockResolvedValue(undefined);
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert(baseOrder)).toBeNull();

    h.storage.getAffiliateById.mockResolvedValue({ id: "aff_1", status: "suspended", userId: "u_aff" });
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert(baseOrder)).toBeNull();
  });

  it("blocks self-attribution (affiliate buying through their own link)", async () => {
    arrangeValidAffiliate();
    h.authStorage.getUser.mockResolvedValue({ id: "u_aff", email: "BUYER@example.com" }); // case-insensitive match
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert(baseOrder)).toBeNull();
  });

  it("returns null when the computed commission rounds to under a cent", async () => {
    arrangeValidAffiliate();
    // 5c * 1% = 0.05c → floor → 0
    expect(await WebhookHandlers.prepareAffiliateCommissionInsert({ ...baseOrder, totalCents: 5, affiliateRateBps: 100 })).toBeNull();
  });

  it("sets a 14-day commission lock window", async () => {
    arrangeValidAffiliate();
    const insert = await WebhookHandlers.prepareAffiliateCommissionInsert(baseOrder);
    const ms = insert!.lockedUntil!.getTime() - Date.now();
    expect(ms).toBeGreaterThan(13.9 * 24 * 60 * 60 * 1000);
    expect(ms).toBeLessThan(14.1 * 24 * 60 * 60 * 1000);
  });
});

// ───────────────────────────── Event routing ────────────────────────────────
describe("handleEvent routing", () => {
  it("routes a buyer checkout to handleCheckoutCompleted", async () => {
    const spy = vi.spyOn(WebhookHandlers, "handleCheckoutCompleted").mockResolvedValue();
    const signup = vi.spyOn(WebhookHandlers, "handleSubscriptionSignup").mockResolvedValue();
    await WebhookHandlers.handleEvent({ type: "checkout.session.completed", data: { object: { metadata: { orderId: "ord_1" } } } });
    expect(spy).toHaveBeenCalledOnce();
    expect(signup).not.toHaveBeenCalled();
    spy.mockRestore();
    signup.mockRestore();
  });

  it("routes a subscription signup to handleSubscriptionSignup", async () => {
    const spy = vi.spyOn(WebhookHandlers, "handleCheckoutCompleted").mockResolvedValue();
    const signup = vi.spyOn(WebhookHandlers, "handleSubscriptionSignup").mockResolvedValue();
    await WebhookHandlers.handleEvent({ type: "checkout.session.completed", data: { object: { metadata: { sellisy_signup: "true" } } } });
    expect(signup).toHaveBeenCalledOnce();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    signup.mockRestore();
  });

  it("routes every refund event shape to handleStripeRefund", async () => {
    const spy = vi.spyOn(WebhookHandlers, "handleStripeRefund").mockResolvedValue();
    for (const type of ["charge.refunded", "refund.created", "refund.updated"]) {
      await WebhookHandlers.handleEvent({ type, data: { object: { id: "re_1" } } });
    }
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith({ id: "re_1" }, "charge.refunded");
    spy.mockRestore();
  });

  it("routes session expiry to handleCheckoutExpired", async () => {
    const spy = vi.spyOn(WebhookHandlers, "handleCheckoutExpired").mockResolvedValue();
    await WebhookHandlers.handleEvent({ type: "checkout.session.expired", data: { object: { metadata: {} } } });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("ignores unknown event types", async () => {
    await expect(WebhookHandlers.handleEvent({ type: "invoice.paid", data: { object: {} } })).resolves.toBeUndefined();
  });
});

// ───────────────────────────── Refund handling ──────────────────────────────
describe("handleStripeRefund", () => {
  beforeEach(() => {
    h.stripe.checkout.sessions.list.mockResolvedValue({ data: [{ id: "cs_1" }] });
    h.storage.getOrderByStripeSession.mockResolvedValue({ id: "ord_1", totalCents: 10000 });
    h.storage.voidCommissionsForOrder.mockResolvedValue(undefined);
  });

  it("marks a full charge refund as REFUNDED and revokes download tokens", async () => {
    await WebhookHandlers.handleStripeRefund(
      { payment_intent: "pi_1", amount: 10000, amount_refunded: 10000, refunds: { data: [{ id: "re_1" }] } },
      "charge.refunded",
    );
    const orderUpdate = h.updateCalls.find((c) => c.table === orders);
    expect(orderUpdate?.set.status).toBe("REFUNDED");
    expect(orderUpdate?.set.refundedAmountCents).toBe(10000);
    // full refund revokes outstanding download tokens
    expect(h.updateCalls.some((c) => c.table === downloadTokens)).toBe(true);
    expect(h.storage.voidCommissionsForOrder).toHaveBeenCalledWith("ord_1", "order_refunded");
  });

  it("marks a partial refund as PARTIALLY_REFUNDED and does NOT revoke tokens", async () => {
    await WebhookHandlers.handleStripeRefund(
      { payment_intent: "pi_1", amount: 10000, amount_refunded: 3000, refunds: { data: [{ id: "re_1" }] } },
      "charge.refunded",
    );
    const orderUpdate = h.updateCalls.find((c) => c.table === orders);
    expect(orderUpdate?.set.status).toBe("PARTIALLY_REFUNDED");
    expect(orderUpdate?.set.refundedAmountCents).toBe(3000);
    expect(h.updateCalls.some((c) => c.table === downloadTokens)).toBe(false);
    expect(h.storage.voidCommissionsForOrder).toHaveBeenCalledWith("ord_1", "order_partially_refunded");
  });

  it("handles the refund-first shape (refund.created) where obj is the Refund", async () => {
    await WebhookHandlers.handleStripeRefund(
      { payment_intent: "pi_1", id: "re_2", amount: 10000 },
      "refund.created",
    );
    const orderUpdate = h.updateCalls.find((c) => c.table === orders);
    expect(orderUpdate?.set.status).toBe("REFUNDED");
    expect(orderUpdate?.set.stripeRefundId).toBe("re_2");
  });

  it("no-ops when the refund has no payment_intent", async () => {
    await WebhookHandlers.handleStripeRefund({ amount: 10000 }, "charge.refunded");
    expect(h.updateCalls.length).toBe(0);
    expect(h.storage.voidCommissionsForOrder).not.toHaveBeenCalled();
  });

  it("no-ops when no Sellisy order matches the Stripe session", async () => {
    h.storage.getOrderByStripeSession.mockResolvedValue(undefined);
    await WebhookHandlers.handleStripeRefund(
      { payment_intent: "pi_1", amount: 10000, amount_refunded: 10000, refunds: { data: [{ id: "re_1" }] } },
      "charge.refunded",
    );
    expect(h.updateCalls.length).toBe(0);
  });
});

// ───────────────────────── Checkout completion guards ───────────────────────
describe("handleCheckoutCompleted guards", () => {
  it("skips when the session has no orderId metadata", async () => {
    await WebhookHandlers.handleCheckoutCompleted({ metadata: {} });
    expect(h.storage.getOrderById).not.toHaveBeenCalled();
  });

  it("is idempotent — an already-COMPLETED order is not re-processed, but missing emails are sent", async () => {
    h.storage.getOrderById.mockResolvedValue({ id: "ord_1", status: "COMPLETED", emailSent: false });
    await WebhookHandlers.handleCheckoutCompleted({ metadata: { orderId: "ord_1" } });
    // no second completion write
    expect(h.updateCalls.some((c) => c.table === orders)).toBe(false);
    // but the completion email gets a retry
    expect(sendOrderCompletionEmails).toHaveBeenCalledOnce();
  });

  it("does not resend email when an already-COMPLETED order already sent it", async () => {
    h.storage.getOrderById.mockResolvedValue({ id: "ord_1", status: "COMPLETED", emailSent: true });
    await WebhookHandlers.handleCheckoutCompleted({ metadata: { orderId: "ord_1" } });
    expect(sendOrderCompletionEmails).not.toHaveBeenCalled();
  });
});
