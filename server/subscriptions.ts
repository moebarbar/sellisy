import type { Express, Request, Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { getUncachableStripeClient } from "./stripeClient";
import { authStorage, isAuthenticated } from "./replit_integrations/auth";
import type { PlanTier } from "@shared/schema";

const PLAN_CONFIG: Record<string, { name: string; price: number; tier: PlanTier }> = {
  basic: { name: "Sellisy Starter", price: 900, tier: "basic" },
  pro: { name: "Sellisy Growth", price: 2900, tier: "pro" },
  max: { name: "Sellisy Empire", price: 4900, tier: "max" },
};

let cachedPriceIds: Record<string, string> = {};

async function ensureStripePrices(): Promise<Record<string, string>> {
  if (Object.keys(cachedPriceIds).length === 3) return cachedPriceIds;

  const stripe = await getUncachableStripeClient();
  const result: Record<string, string> = {};

  for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
    const products = await stripe.products.search({
      query: `name:'${config.name}' AND active:'true'`,
    });

    let productId: string;

    if (products.data.length > 0) {
      productId = products.data[0].id;
    } else {
      const product = await stripe.products.create({
        name: config.name,
        metadata: { tier },
      });
      productId = product.id;
    }

    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      type: "recurring",
    });

    const matchingPrice = prices.data.find(
      (p) => p.unit_amount === config.price && p.recurring?.interval === "month"
    );

    if (matchingPrice) {
      result[tier] = matchingPrice.id;
    } else {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: config.price,
        currency: "usd",
        recurring: { interval: "month" },
      });
      result[tier] = price.id;
    }
  }

  cachedPriceIds = result;
  console.log("[subscriptions] Stripe prices ready:", Object.keys(result).join(", "));
  return result;
}

const subscribeSchema = z.object({
  plan: z.enum(["basic", "pro", "max"]),
});

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many subscription attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerSubscriptionRoutes(app: Express) {
  app.use("/api/subscribe", subscribeLimiter);

  app.post("/api/subscribe", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parsed = subscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { plan } = parsed.data;

      const user = await authStorage.getUser(req.sellisyUserId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      const priceIds = await ensureStripePrices();
      const priceId = priceIds[plan];
      if (!priceId) {
        return res.status(500).json({ message: "Pricing configuration error" });
      }

      const stripe = await getUncachableStripeClient();

      const baseUrl = process.env.APP_URL ||
        (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/dashboard?subscribed=true&plan=${plan}`,
        cancel_url: `${baseUrl}/#pricing`,
        metadata: {
          sellisy_signup: "true",
          sellisyUserId: user.id,
          planTier: plan,
        },
        customer_email: user.email ?? undefined,
        subscription_data: {
          metadata: {
            sellisy_signup: "true",
            sellisyUserId: user.id,
            planTier: plan,
          },
        },
      });

      return res.json({ url: session.url });
    } catch (error: any) {
      console.error("[subscriptions] Error creating checkout session:", error);
      return res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  ensureStripePrices().catch((err) => {
    console.error("[subscriptions] Failed to initialize Stripe prices:", err.message);
  });
}
