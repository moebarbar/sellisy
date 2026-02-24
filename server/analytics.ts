import { db } from "./db";
import { orders, orderItems, storeProducts, storeEvents, coupons, customers, downloadTokens, products } from "@shared/schema";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(range: string): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getPreviousRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - duration),
    end: new Date(range.start.getTime() - 1),
  };
}

export async function getRevenueAnalytics(storeId: string, rangeStr: string) {
  const range = getDateRange(rangeStr);
  const prev = getPreviousRange(range);

  const currentOrders = await db
    .select({
      date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)))
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

  const [prevTotals] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, prev.start), lte(orders.createdAt, prev.end)));

  const totalRevenue = currentOrders.reduce((sum, r) => sum + Number(r.revenue), 0);
  const totalOrders = currentOrders.reduce((sum, r) => sum + Number(r.count), 0);
  const prevRevenue = Number(prevTotals?.revenue || 0);
  const prevOrderCount = Number(prevTotals?.count || 0);

  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue > 0 ? 100 : 0;
  const orderGrowth = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : totalOrders > 0 ? 100 : 0;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    orderGrowth: Math.round(orderGrowth * 10) / 10,
    prevRevenue,
    prevOrders: prevOrderCount,
    dailyRevenue: currentOrders.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
      orders: Number(r.count),
    })),
  };
}

export async function getProductAnalytics(storeId: string, rangeStr: string) {
  const range = getDateRange(rangeStr);

  const productSales = await db
    .select({
      productId: orderItems.productId,
      title: products.title,
      revenue: sql<number>`COALESCE(SUM(${orderItems.priceCents}), 0)`,
      unitsSold: sql<number>`COUNT(*)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)))
    .groupBy(orderItems.productId, products.title)
    .orderBy(desc(sql`COALESCE(SUM(${orderItems.priceCents}), 0)`));

  const productViews = await db
    .select({
      productId: storeEvents.productId,
      views: sql<number>`COUNT(*)`,
    })
    .from(storeEvents)
    .where(and(eq(storeEvents.storeId, storeId), eq(storeEvents.eventType, "product_view"), gte(storeEvents.createdAt, range.start), lte(storeEvents.createdAt, range.end)))
    .groupBy(storeEvents.productId);

  const viewMap = new Map(productViews.map((v) => [v.productId, Number(v.views)]));

  const enriched = productSales.map((p) => {
    const views = viewMap.get(p.productId) || 0;
    return {
      productId: p.productId,
      title: p.title,
      revenue: Number(p.revenue),
      unitsSold: Number(p.unitsSold),
      views,
      conversionRate: views > 0 ? Math.round((Number(p.unitsSold) / views) * 1000) / 10 : 0,
    };
  });

  const totalActiveProducts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(storeProducts)
    .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.isPublished, true)));

  return {
    products: enriched,
    totalActiveProducts: Number(totalActiveProducts[0]?.count || 0),
    bestSeller: enriched[0] || null,
    worstSeller: enriched.length > 1 ? enriched[enriched.length - 1] : null,
  };
}

export async function getCustomerAnalytics(storeId: string, rangeStr: string) {
  const range = getDateRange(rangeStr);

  const customerOrders = await db
    .select({
      buyerEmail: orders.buyerEmail,
      totalSpent: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
      orderCount: sql<number>`COUNT(*)`,
      firstOrder: sql<string>`MIN(TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD'))`,
      lastOrder: sql<string>`MAX(TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD'))`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)))
    .groupBy(orders.buyerEmail)
    .orderBy(desc(sql`COALESCE(SUM(${orders.totalCents}), 0)`));

  const validCustomers = customerOrders.filter((c) => c.buyerEmail && c.buyerEmail !== "pending@checkout.com");

  const topCustomers = validCustomers.slice(0, 10).map((c) => ({
    email: c.buyerEmail,
    totalSpent: Number(c.totalSpent),
    orderCount: Number(c.orderCount),
    firstOrder: c.firstOrder,
    lastOrder: c.lastOrder,
  }));

  const newCustomersPerDay = await db
    .select({
      date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`COUNT(DISTINCT ${orders.buyerEmail})`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)))
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

  const returning = validCustomers.filter((c) => Number(c.orderCount) > 1).length;
  const totalUnique = validCustomers.length;

  return {
    totalCustomers: totalUnique,
    newCustomers: totalUnique - returning,
    returningCustomers: returning,
    returnRate: totalUnique > 0 ? Math.round((returning / totalUnique) * 1000) / 10 : 0,
    avgLifetimeValue: totalUnique > 0 ? Math.round(validCustomers.reduce((s, c) => s + Number(c.totalSpent), 0) / totalUnique) : 0,
    topCustomers,
    acquisitionByDay: newCustomersPerDay.map((d) => ({ date: d.date, count: Number(d.count) })),
  };
}

export async function getCouponAnalytics(storeId: string, rangeStr: string) {
  const range = getDateRange(rangeStr);

  const storeCoupons = await db.select().from(coupons).where(eq(coupons.storeId, storeId));

  const couponOrders = await db
    .select({
      couponId: orders.couponId,
      orderCount: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), sql`${orders.couponId} IS NOT NULL`, gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)))
    .groupBy(orders.couponId);

  const couponMap = new Map(couponOrders.map((c) => [c.couponId, c]));

  const enriched = storeCoupons.map((c) => {
    const usage = couponMap.get(c.id);
    return {
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxUses: c.maxUses,
      currentUses: c.currentUses,
      isActive: c.isActive,
      ordersInPeriod: Number(usage?.orderCount || 0),
      revenueInPeriod: Number(usage?.totalRevenue || 0),
    };
  });

  const totalCouponOrders = couponOrders.reduce((s, c) => s + Number(c.orderCount), 0);
  const totalCouponRevenue = couponOrders.reduce((s, c) => s + Number(c.totalRevenue), 0);

  return {
    coupons: enriched.sort((a, b) => b.ordersInPeriod - a.ordersInPeriod),
    totalCouponOrders,
    totalCouponRevenue,
    activeCoupons: storeCoupons.filter((c) => c.isActive).length,
  };
}

export async function getTrafficAnalytics(storeId: string, rangeStr: string) {
  const range = getDateRange(rangeStr);

  const dailyTraffic = await db
    .select({
      date: sql<string>`TO_CHAR(${storeEvents.createdAt}, 'YYYY-MM-DD')`,
      pageViews: sql<number>`COUNT(*) FILTER (WHERE ${storeEvents.eventType} = 'page_view')`,
      productViews: sql<number>`COUNT(*) FILTER (WHERE ${storeEvents.eventType} = 'product_view')`,
      bundleViews: sql<number>`COUNT(*) FILTER (WHERE ${storeEvents.eventType} = 'bundle_view')`,
      checkoutStarts: sql<number>`COUNT(*) FILTER (WHERE ${storeEvents.eventType} = 'checkout_start')`,
      addToCart: sql<number>`COUNT(*) FILTER (WHERE ${storeEvents.eventType} = 'add_to_cart')`,
      uniqueVisitors: sql<number>`COUNT(DISTINCT ${storeEvents.sessionId})`,
    })
    .from(storeEvents)
    .where(and(eq(storeEvents.storeId, storeId), gte(storeEvents.createdAt, range.start), lte(storeEvents.createdAt, range.end)))
    .groupBy(sql`TO_CHAR(${storeEvents.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${storeEvents.createdAt}, 'YYYY-MM-DD')`);

  const totals = dailyTraffic.reduce(
    (acc, d) => ({
      pageViews: acc.pageViews + Number(d.pageViews),
      productViews: acc.productViews + Number(d.productViews),
      bundleViews: acc.bundleViews + Number(d.bundleViews),
      checkoutStarts: acc.checkoutStarts + Number(d.checkoutStarts),
      addToCart: acc.addToCart + Number(d.addToCart),
      uniqueVisitors: acc.uniqueVisitors + Number(d.uniqueVisitors),
    }),
    { pageViews: 0, productViews: 0, bundleViews: 0, checkoutStarts: 0, addToCart: 0, uniqueVisitors: 0 },
  );

  const [totalUniqueOverall] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${storeEvents.sessionId})` })
    .from(storeEvents)
    .where(and(eq(storeEvents.storeId, storeId), gte(storeEvents.createdAt, range.start), lte(storeEvents.createdAt, range.end)));

  const completedOrders = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, range.start), lte(orders.createdAt, range.end)));

  const orderCount = Number(completedOrders[0]?.count || 0);
  const uniqueVisitors = Number(totalUniqueOverall?.count || 0);

  const topReferrers = await db
    .select({
      referrer: storeEvents.referrer,
      count: sql<number>`COUNT(*)`,
    })
    .from(storeEvents)
    .where(and(eq(storeEvents.storeId, storeId), sql`${storeEvents.referrer} IS NOT NULL AND ${storeEvents.referrer} != ''`, gte(storeEvents.createdAt, range.start), lte(storeEvents.createdAt, range.end)))
    .groupBy(storeEvents.referrer)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return {
    ...totals,
    uniqueVisitorsTotal: uniqueVisitors,
    conversionRate: uniqueVisitors > 0 ? Math.round((orderCount / uniqueVisitors) * 1000) / 10 : 0,
    dailyTraffic: dailyTraffic.map((d) => ({
      date: d.date,
      pageViews: Number(d.pageViews),
      productViews: Number(d.productViews),
      bundleViews: Number(d.bundleViews),
      checkoutStarts: Number(d.checkoutStarts),
      addToCart: Number(d.addToCart),
      uniqueVisitors: Number(d.uniqueVisitors),
    })),
    funnel: {
      pageViews: totals.pageViews,
      productViews: totals.productViews,
      addToCart: totals.addToCart,
      checkoutStarts: totals.checkoutStarts,
      completedOrders: orderCount,
    },
    topReferrers: topReferrers.map((r) => ({ referrer: r.referrer || "Direct", count: Number(r.count) })),
  };
}
