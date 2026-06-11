// Order domain — orders, order items, download tokens, coupons, plus the
// customer-linking helpers (setOrderCustomerId, linkOrdersByEmail) that
// mutate the orders table from outside the customer-portal flow.
// Phase 1.4 of the storage split.

import { db } from "../db";
import {
  orders,
  orderItems,
  downloadTokens,
  coupons,
  products,
  stores,
  type InsertOrder,
  type InsertOrderItem,
  type InsertDownloadToken,
  type InsertCoupon,
} from "@shared/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export const orderStorage = {
  // ─── Orders + items + download tokens ───────────────────────────────

  async createOrder(data: InsertOrder) {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  },

  async getOrderById(id: string) {
    const [order] = await db.select().from(orders).where(and(eq(orders.id, id), isNull(orders.deletedAt)));
    return order;
  },

  async getOrderByStripeSession(sessionId: string) {
    const [order] = await db.select().from(orders).where(and(eq(orders.stripeSessionId, sessionId), isNull(orders.deletedAt)));
    return order;
  },

  async getOrderByPaypalOrderId(paypalOrderId: string) {
    const [order] = await db.select().from(orders).where(and(eq(orders.paypalOrderId, paypalOrderId), isNull(orders.deletedAt)));
    return order;
  },

  async updateOrderStatus(id: string, status: string) {
    const [order] = await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order;
  },

  async updateOrderBuyerEmail(id: string, email: string) {
    await db.update(orders).set({ buyerEmail: email, updatedAt: new Date() }).where(eq(orders.id, id));
  },

  async createOrderItem(data: InsertOrderItem) {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  },

  async createDownloadToken(data: InsertDownloadToken) {
    const [token] = await db.insert(downloadTokens).values(data).returning();
    return token;
  },

  async getDownloadTokenByHash(hash: string) {
    const [token] = await db.select().from(downloadTokens).where(eq(downloadTokens.tokenHash, hash));
    return token;
  },

  // ─── Coupons ────────────────────────────────────────────────────────

  async createCoupon(data: InsertCoupon) {
    const [coupon] = await db.insert(coupons).values(data).returning();
    return coupon;
  },

  async getCouponsByStore(storeId: string) {
    return db.select().from(coupons).where(and(eq(coupons.storeId, storeId), isNull(coupons.deletedAt))).orderBy(desc(coupons.createdAt));
  },

  async getCouponByCode(storeId: string, code: string) {
    const [coupon] = await db.select().from(coupons).where(
      and(eq(coupons.storeId, storeId), eq(coupons.code, code.toUpperCase()), isNull(coupons.deletedAt))
    );
    return coupon;
  },

  async getCouponById(id: string) {
    const [coupon] = await db.select().from(coupons).where(and(eq(coupons.id, id), isNull(coupons.deletedAt)));
    return coupon;
  },

  async updateCoupon(id: string, data: Partial<InsertCoupon>) {
    const [coupon] = await db.update(coupons).set({ ...data, updatedAt: new Date() }).where(eq(coupons.id, id)).returning();
    return coupon;
  },

  async incrementCouponUses(id: string) {
    await db.update(coupons).set({ currentUses: sql`${coupons.currentUses} + 1`, updatedAt: new Date() }).where(eq(coupons.id, id));
  },

  async deleteCoupon(id: string) {
    await db.update(coupons).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(coupons.id, id));
  },

  // ─── Order reads + customer linking ─────────────────────────────────

  async getOrdersByStore(storeId: string) {
    return db.select().from(orders).where(and(eq(orders.storeId, storeId), isNull(orders.deletedAt))).orderBy(desc(orders.createdAt));
  },

  // Single-query replacement for the getOrdersByStore + per-order
  // getOrderItemsByOrder pattern (was 1 + N queries on the dashboard
  // orders page). LEFT JOIN so orders with no items still appear.
  async getOrdersWithItemsByStore(storeId: string) {
    const rows = await db
      .select({ order: orders, oi: orderItems, product: products })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(eq(orders.storeId, storeId), isNull(orders.deletedAt)))
      .orderBy(desc(orders.createdAt));

    const byId = new Map<string, (typeof rows)[number]["order"] & { items: any[] }>();
    for (const r of rows) {
      let entry = byId.get(r.order.id);
      if (!entry) {
        entry = { ...r.order, items: [] };
        byId.set(r.order.id, entry);
      }
      if (r.oi) entry.items.push({ ...r.oi, product: r.product });
    }
    return Array.from(byId.values());
  },

  async getOrderItemsByOrder(orderId: string) {
    const rows = await db
      .select({ oi: orderItems, product: products })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
    return rows.map((r) => ({ ...r.oi, product: r.product }));
  },

  async getOrdersByCustomer(customerId: string) {
    const rows = await db
      .select({ order: orders, store: stores })
      .from(orders)
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(orders.customerId, customerId), eq(orders.status, "COMPLETED"), isNull(orders.deletedAt)))
      .orderBy(desc(orders.createdAt));
    return rows.map((r) => ({ ...r.order, store: r.store }));
  },

  async setOrderCustomerId(orderId: string, customerId: string) {
    await db.update(orders).set({ customerId, updatedAt: new Date() }).where(eq(orders.id, orderId));
  },

  async linkOrdersByEmail(email: string, customerId: string) {
    await db.update(orders).set({ customerId, updatedAt: new Date() }).where(
      and(eq(orders.buyerEmail, email.toLowerCase()), sql`${orders.customerId} IS NULL`)
    );
  },
};

export type OrderStorage = typeof orderStorage;
