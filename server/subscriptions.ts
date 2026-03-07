import type { Express, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { getUncachableStripeClient } from "./stripeClient";
import { authStorage } from "./replit_integrations/auth/storage";
import type { PlanTier } from "@shared/schema";

const PLAN_CONFIG: Record<string, { name: string; price: number; tier: PlanTier }> = {
  basic: { name: "Sellisy Starter", price: 1900, tier: "basic" },
  pro: { name: "Sellisy Growth", price: 3900, tier: "pro" },
  max: { name: "Sellisy Empire", price: 6900, tier: "max" },
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
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
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

  app.post("/api/subscribe", async (req: Request, res: Response) => {
    try {
      const parsed = subscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { plan, email, firstName, lastName, password } = parsed.data;

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists. Please log in instead." });
      }

      const priceIds = await ensureStripePrices();
      const priceId = priceIds[plan];
      if (!priceId) {
        return res.status(500).json({ message: "Pricing configuration error" });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const stripe = await getUncachableStripeClient();

      const baseUrl = process.env.APP_URL ||
        (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/auth?subscribed=true&plan=${plan}`,
        cancel_url: `${baseUrl}/#pricing`,
        metadata: {
          sellisy_signup: "true",
          email,
          firstName,
          lastName,
          passwordHash,
          planTier: plan,
        },
        customer_email: email,
        subscription_data: {
          metadata: {
            sellisy_signup: "true",
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
