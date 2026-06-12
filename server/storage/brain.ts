// Sellisy Brain domain — weekly AI report rows. Merged onto the storage
// singleton like the other domains.

import { db } from "../db";
import { brainReports, type InsertBrainReport } from "@shared/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";

export const brainStorage = {
  async createBrainReport(data: InsertBrainReport) {
    const [row] = await db.insert(brainReports).values(data).returning();
    return row;
  },

  async getLatestBrainReport(storeId: string) {
    const [row] = await db
      .select()
      .from(brainReports)
      .where(eq(brainReports.storeId, storeId))
      .orderBy(desc(brainReports.createdAt))
      .limit(1);
    return row;
  },

  async getBrainReports(storeId: string, limit = 10) {
    return db
      .select()
      .from(brainReports)
      .where(eq(brainReports.storeId, storeId))
      .orderBy(desc(brainReports.createdAt))
      .limit(limit);
  },

  // On-demand rate limit: has a report been generated for this store since?
  async hasBrainReportSince(storeId: string, since: Date): Promise<boolean> {
    const [row] = await db
      .select({ id: brainReports.id })
      .from(brainReports)
      .where(and(eq(brainReports.storeId, storeId), gt(brainReports.createdAt, since)))
      .limit(1);
    return !!row;
  },

  // Weekly sweep targets: live stores whose owner is (effectively) Growth+
  // and that had ANY activity in the trailing week — silent stores are
  // skipped rather than emailed a generic report.
  async getBrainEligibleStoreIds(limit = 500): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT s.id FROM stores s
      JOIN user_profiles up ON up.user_id = s.owner_id
      WHERE s.deleted_at IS NULL
        AND (up.plan_tier IN ('pro', 'max') OR (up.plan_tier = 'basic' AND up.trial_ends_at > NOW()))
        AND (
          EXISTS (SELECT 1 FROM store_events se WHERE se.store_id = s.id AND se.created_at > NOW() - INTERVAL '7 days')
          OR EXISTS (SELECT 1 FROM orders o WHERE o.store_id = s.id AND o.created_at > NOW() - INTERVAL '7 days' AND o.deleted_at IS NULL)
        )
      LIMIT ${limit}
    `);
    return (result.rows as { id: string }[]).map((r) => r.id);
  },

  async markBrainReportEmailed(id: string) {
    await db.update(brainReports).set({ emailedAt: new Date() }).where(eq(brainReports.id, id));
  },
};

export type BrainStorage = typeof brainStorage;
