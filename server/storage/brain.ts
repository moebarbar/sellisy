// Sellisy Brain domain — weekly AI report rows. Merged onto the storage
// singleton like the other domains.

import { db } from "../db";
import { brainReports, type InsertBrainReport } from "@shared/schema";
import { and, desc, eq, gt } from "drizzle-orm";

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

  async markBrainReportEmailed(id: string) {
    await db.update(brainReports).set({ emailedAt: new Date() }).where(eq(brainReports.id, id));
  },
};

export type BrainStorage = typeof brainStorage;
