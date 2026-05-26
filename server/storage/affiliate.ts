// Affiliate domain — affiliates, clicks, commissions, payouts.
// Extracted from server/storage.ts as part of the Phase 1 storage split.
// Used via the singleton `storage` from ../storage.ts (which merges this
// object into the DatabaseStorage class via Object.assign).

import { db } from "../db";
import {
  affiliates,
  affiliateClicks,
  affiliateCommissions,
  affiliatePayouts,
  type Affiliate,
  type AffiliateClick,
  type AffiliateCommission,
  type AffiliatePayout,
  type InsertAffiliate,
  type InsertAffiliateClick,
  type InsertAffiliateCommission,
  type InsertAffiliatePayout,
} from "@shared/schema";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

export const affiliateStorage = {
  // ─── Affiliates ─────────────────────────────────────────────────────

  async getAffiliateByCode(storeId: string, code: string): Promise<Affiliate | undefined> {
    const [row] = await db.select().from(affiliates)
      .where(and(eq(affiliates.storeId, storeId), eq(affiliates.code, code), isNull(affiliates.deletedAt)))
      .limit(1);
    return row;
  },

  async getAffiliateById(id: string): Promise<Affiliate | undefined> {
    const [row] = await db.select().from(affiliates)
      .where(and(eq(affiliates.id, id), isNull(affiliates.deletedAt)))
      .limit(1);
    return row;
  },

  async getAffiliatesByStore(storeId: string): Promise<Affiliate[]> {
    return db.select().from(affiliates)
      .where(and(eq(affiliates.storeId, storeId), isNull(affiliates.deletedAt)))
      .orderBy(desc(affiliates.createdAt));
  },

  async getAffiliatesByUser(userId: string): Promise<Affiliate[]> {
    return db.select().from(affiliates)
      .where(and(eq(affiliates.userId, userId), isNull(affiliates.deletedAt)))
      .orderBy(desc(affiliates.createdAt));
  },

  // Returns affiliate rows matching this user via either userId or payout_email.
  // Self-serve applicants get a placeholder userId (since they weren't logged in
  // when they applied); we link by email until they sign in for the first time.
  async getAffiliatesByUserOrEmail(userId: string, email: string | null): Promise<Affiliate[]> {
    if (!email) return affiliateStorage.getAffiliatesByUser(userId);
    const rows = await db.select().from(affiliates)
      .where(and(
        sql`(${affiliates.userId} = ${userId} OR ${affiliates.payoutEmail} = ${email})`,
        isNull(affiliates.deletedAt),
      ))
      .orderBy(desc(affiliates.createdAt));
    return rows;
  },

  // Lazy-link: when a self-serve applicant signs in, swap the placeholder
  // userId on their affiliate rows with their real users.id.
  async linkAffiliateToUser(affiliateId: string, userId: string): Promise<void> {
    await db.update(affiliates)
      .set({ userId, updatedAt: new Date() })
      .where(eq(affiliates.id, affiliateId));
  },

  async createAffiliate(data: InsertAffiliate): Promise<Affiliate> {
    const [row] = await db.insert(affiliates).values(data).returning();
    return row;
  },

  async updateAffiliate(id: string, data: Partial<InsertAffiliate>): Promise<Affiliate | undefined> {
    const [row] = await db.update(affiliates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(affiliates.id, id))
      .returning();
    return row;
  },

  async softDeleteAffiliate(id: string): Promise<void> {
    await db.update(affiliates)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(affiliates.id, id));
  },

  // ─── Affiliate clicks ───────────────────────────────────────────────

  async recordAffiliateClick(data: InsertAffiliateClick): Promise<AffiliateClick> {
    const [row] = await db.insert(affiliateClicks).values(data).returning();
    return row;
  },

  async hasRecentClick(affiliateId: string, ipHash: string, withinMinutes: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const [row] = await db.select({ id: affiliateClicks.id }).from(affiliateClicks)
      .where(and(
        eq(affiliateClicks.affiliateId, affiliateId),
        eq(affiliateClicks.ipHash, ipHash),
        sql`${affiliateClicks.createdAt} > ${cutoff}`,
      ))
      .limit(1);
    return !!row;
  },

  async getAffiliateClickCount(affiliateId: string, sinceDays: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const [row] = await db.select({ n: sql<number>`count(*)::int` })
      .from(affiliateClicks)
      .where(and(
        eq(affiliateClicks.affiliateId, affiliateId),
        sql`${affiliateClicks.createdAt} > ${cutoff}`,
      ));
    return row?.n ?? 0;
  },

  // ─── Affiliate commissions ──────────────────────────────────────────

  async createCommission(data: InsertAffiliateCommission): Promise<AffiliateCommission> {
    const [row] = await db.insert(affiliateCommissions).values(data).returning();
    return row;
  },

  async getCommissionByOrderId(orderId: string): Promise<AffiliateCommission | undefined> {
    const [row] = await db.select().from(affiliateCommissions)
      .where(eq(affiliateCommissions.orderId, orderId))
      .limit(1);
    return row;
  },

  async voidCommissionsForOrder(orderId: string, reason: string): Promise<void> {
    await db.update(affiliateCommissions)
      .set({ status: "void", voidReason: reason, updatedAt: new Date() })
      .where(and(
        eq(affiliateCommissions.orderId, orderId),
        sql`${affiliateCommissions.status} IN ('pending', 'approved')`,
      ));
  },

  async getCommissionsByAffiliate(affiliateId: string): Promise<AffiliateCommission[]> {
    return db.select().from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliateId))
      .orderBy(desc(affiliateCommissions.createdAt));
  },

  async markCommissionsPaid(commissionIds: string[], payoutId: string): Promise<void> {
    if (commissionIds.length === 0) return;
    await db.update(affiliateCommissions)
      .set({ status: "paid", payoutId, updatedAt: new Date() })
      .where(inArray(affiliateCommissions.id, commissionIds));
  },

  // Eligible = pending/approved + locked_until is past + not yet paid.
  // These are the rows the owner picks when running a payout.
  async getEligibleCommissionsForAffiliate(affiliateId: string): Promise<AffiliateCommission[]> {
    return db.select().from(affiliateCommissions)
      .where(and(
        eq(affiliateCommissions.affiliateId, affiliateId),
        sql`${affiliateCommissions.status} IN ('pending', 'approved')`,
        sql`${affiliateCommissions.lockedUntil} <= NOW()`,
        isNull(affiliateCommissions.payoutId),
      ))
      .orderBy(desc(affiliateCommissions.createdAt));
  },

  // ─── Affiliate payouts ──────────────────────────────────────────────

  async createPayout(data: InsertAffiliatePayout): Promise<AffiliatePayout> {
    const [row] = await db.insert(affiliatePayouts).values(data).returning();
    return row;
  },

  async getPayoutsByStore(storeId: string): Promise<AffiliatePayout[]> {
    return db.select().from(affiliatePayouts)
      .where(eq(affiliatePayouts.storeId, storeId))
      .orderBy(desc(affiliatePayouts.createdAt));
  },

  async markPayoutPaid(payoutId: string, externalRef: string | null): Promise<AffiliatePayout | undefined> {
    const [row] = await db.update(affiliatePayouts)
      .set({ status: "paid", externalRef, paidAt: new Date(), updatedAt: new Date() })
      .where(eq(affiliatePayouts.id, payoutId))
      .returning();
    return row;
  },
};

export type AffiliateStorage = typeof affiliateStorage;
