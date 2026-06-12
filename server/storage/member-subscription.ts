// Member-subscription domain — buyer subscriptions to recurring products
// on the seller's own Stripe account. Phase 4 of the storage split pattern:
// exported as a plain object and merged onto the storage singleton.

import { db } from "../db";
import {
  memberSubscriptions,
  products,
  type InsertMemberSubscription,
  type MemberSubscription,
} from "@shared/schema";
import { and, desc, eq, lt, or, isNull, sql } from "drizzle-orm";

export const memberSubscriptionStorage = {
  // Idempotent on stripeSubscriptionId — duplicate success-page polls or
  // re-processed completions can't create a second row.
  async createMemberSubscription(data: InsertMemberSubscription): Promise<MemberSubscription | undefined> {
    const [row] = await db
      .insert(memberSubscriptions)
      .values(data)
      .onConflictDoNothing({ target: memberSubscriptions.stripeSubscriptionId })
      .returning();
    return row;
  },

  async getMemberSubscriptionById(id: string) {
    const [row] = await db.select().from(memberSubscriptions).where(eq(memberSubscriptions.id, id));
    return row;
  },

  async getMemberSubscriptionByOrderId(orderId: string) {
    const [row] = await db.select().from(memberSubscriptions).where(eq(memberSubscriptions.orderId, orderId));
    return row;
  },

  async getMemberSubscriptionByStripeId(stripeSubscriptionId: string) {
    const [row] = await db.select().from(memberSubscriptions).where(eq(memberSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return row;
  },

  async getMemberSubscriptionsByCustomer(customerId: string) {
    const rows = await db
      .select({ sub: memberSubscriptions, product: products })
      .from(memberSubscriptions)
      .innerJoin(products, eq(memberSubscriptions.productId, products.id))
      .where(eq(memberSubscriptions.customerId, customerId))
      .orderBy(desc(memberSubscriptions.createdAt));
    return rows.map((r) => ({ ...r.sub, product: r.product }));
  },

  async getMemberSubscriptionsByStore(storeId: string) {
    const rows = await db
      .select({ sub: memberSubscriptions, product: products })
      .from(memberSubscriptions)
      .innerJoin(products, eq(memberSubscriptions.productId, products.id))
      .where(eq(memberSubscriptions.storeId, storeId))
      .orderBy(desc(memberSubscriptions.createdAt));
    return rows.map((r) => ({ ...r.sub, product: r.product }));
  },

  async updateMemberSubscription(id: string, data: Partial<Pick<MemberSubscription, "status" | "cancelAtPeriodEnd" | "currentPeriodEnd" | "lastVerifiedAt" | "canceledAt" | "customerId" | "stripeCustomerId">>) {
    const [row] = await db
      .update(memberSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(memberSubscriptions.id, id))
      .returning();
    return row;
  },

  // Sweep targets: not-yet-canceled subscriptions whose verification is
  // stale OR whose paid-through date has lapsed.
  async getMemberSubscriptionsNeedingVerification(verifiedBefore: Date, limit = 200) {
    return db
      .select()
      .from(memberSubscriptions)
      .where(and(
        sql`${memberSubscriptions.status} <> 'canceled'`,
        or(
          lt(memberSubscriptions.lastVerifiedAt, verifiedBefore),
          and(lt(memberSubscriptions.currentPeriodEnd, new Date()), isNull(memberSubscriptions.canceledAt)),
        ),
      ))
      .limit(limit);
  },
};

export type MemberSubscriptionStorage = typeof memberSubscriptionStorage;
