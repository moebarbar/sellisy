// AI Store Launcher domain — launch-run rows (see shared/schema.ts
// aiLaunches). Merged onto the storage singleton like the other domains.

import { db } from "../db";
import { aiLaunches, type InsertAiLaunch, type AiLaunch } from "@shared/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";

export const aiLaunchStorage = {
  async createAiLaunch(data: InsertAiLaunch): Promise<AiLaunch> {
    const [row] = await db.insert(aiLaunches).values(data).returning();
    return row;
  },

  async getAiLaunchById(id: string) {
    const [row] = await db.select().from(aiLaunches).where(eq(aiLaunches.id, id));
    return row;
  },

  async updateAiLaunch(id: string, data: Partial<Pick<AiLaunch, "status" | "storeId" | "storeSlug" | "productCount" | "error">>) {
    const [row] = await db
      .update(aiLaunches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiLaunches.id, id))
      .returning();
    return row;
  },

  // Rate limiting: launches by this user in the trailing window.
  async countRecentAiLaunches(userId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(aiLaunches)
      .where(and(eq(aiLaunches.userId, userId), gt(aiLaunches.createdAt, since)));
    return result[0]?.count ?? 0;
  },

  // A run that's still working — used to prevent concurrent launches per user.
  async getActiveAiLaunchForUser(userId: string) {
    const [row] = await db
      .select()
      .from(aiLaunches)
      .where(and(
        eq(aiLaunches.userId, userId),
        sql`${aiLaunches.status} NOT IN ('completed', 'failed')`,
      ))
      .orderBy(desc(aiLaunches.createdAt))
      .limit(1);
    return row;
  },
};

export type AiLaunchStorage = typeof aiLaunchStorage;
