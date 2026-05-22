import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebhookHandlers } from './webhookHandlers';
import { runStartupCheck } from "./integrity";
import { injectOgTags } from "./og-tags";
import rateLimit from "express-rate-limit";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

const app = express();
const httpServer = createServer(app);

// Remove fingerprinting header
app.disable("x-powered-by");

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Webhook fail-closed policy:
// If the verification secret/credentials aren't configured, reject with 503
// (Service Unavailable) — a 5xx status so Stripe/PayPal will retry once the
// operator fixes the env. We never fall through to processing an unverified
// event, in any environment. webhookHandlers.processWebhook also re-checks
// STRIPE_WEBHOOK_SECRET as defense-in-depth.
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not set");
      return res.status(503).json({ error: "Webhook secret not configured" });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('Stripe webhook: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Stripe webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("[SECURITY WARNING] STRIPE_WEBHOOK_SECRET is not set — Stripe webhook endpoint will reject all events with 503 until configured.");
}

app.post(
  '/api/paypal/webhook',
  express.json({ limit: '1mb' }),
  async (req, res) => {
    if (
      !process.env.PAYPAL_WEBHOOK_ID ||
      !process.env.PAYPAL_CLIENT_ID ||
      !process.env.PAYPAL_CLIENT_SECRET
    ) {
      console.error("PayPal webhook rejected: PAYPAL_WEBHOOK_ID/PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET not set");
      return res.status(503).json({ error: "Webhook credentials not configured" });
    }

    try {
      const valid = await WebhookHandlers.verifyPaypalSignature(req.headers, req.body);
      if (!valid) {
        return res.status(400).json({ error: 'Invalid PayPal webhook signature' });
      }
      await WebhookHandlers.processPaypalEvent(req.body);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('PayPal webhook error:', error.message);
      res.status(500).json({ error: 'Webhook processing error' });
    }
  }
);

if (!process.env.PAYPAL_WEBHOOK_ID) {
  console.warn("[SECURITY WARNING] PAYPAL_WEBHOOK_ID is not set — PayPal webhook endpoint will reject all events with 503 until configured.");
}

// SendGrid event webhook — receives bounce, complaint (spam report), and
// unsubscribe events. Configure URL in SendGrid: https://app.sendgrid.com/settings/mail_settings
// Optionally verify with ED25519 signature using SENDGRID_WEBHOOK_PUBLIC_KEY.
app.post(
  '/api/sendgrid/webhook',
  express.json({ limit: '512kb' }),
  async (req, res) => {
    try {
      const events = Array.isArray(req.body) ? req.body : [];
      // Lazy import so this module doesn't pull storage during top-level init.
      const { storage } = await import('./storage');
      for (const ev of events) {
        const email = ev?.email;
        const eventType = ev?.event;
        if (typeof email !== 'string' || !email) continue;
        if (eventType === 'bounce' || eventType === 'dropped') {
          await storage.suppressEmail(email, 'bounce', ev.reason ?? ev.type ?? null);
        } else if (eventType === 'spamreport') {
          await storage.suppressEmail(email, 'complaint', ev.reason ?? null);
        } else if (eventType === 'unsubscribe' || eventType === 'group_unsubscribe') {
          await storage.suppressEmail(email, 'unsubscribe', ev.useragent ?? null);
        }
      }
      res.status(200).json({ received: true, count: events.length });
    } catch (error: any) {
      console.error('SendGrid webhook error:', error.message);
      res.status(500).json({ error: 'Webhook processing error' });
    }
  }
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many registration attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many checkout attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many download attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many coupon attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const claimFreeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many free claim attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many subscription attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const customerLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/checkout", checkoutLimiter);
app.use("/api/download", downloadLimiter);
app.use("/api/coupons/validate", couponLimiter);
app.use("/api/claim-free", claimFreeLimiter);
app.use("/api/storefront", (req, res, next) => {
  if (req.method === "POST" && req.path.endsWith("/subscribe")) return subscribeLimiter(req, res, next);
  next();
});
app.use("/api/store-events", eventLimiter);
app.use("/api/customer/login", customerLoginLimiter);
app.use("/api/customer/verify", customerLoginLimiter);

// /api/resolve-domain is hit by every page load on a custom domain; throttle
// abusive probing without breaking legitimate usage.
const resolveDomainLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { store: null },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/resolve-domain", resolveDomainLimiter);

const allowedOrigins = [
  "https://sellisy.com",
  "https://www.sellisy.com",
  "https://customers.sellisy.com",
  process.env.APP_URL,
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined,
].filter(Boolean) as string[];

// Security headers — applied to all responses
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // Cross-origin isolation headers (for non-embed routes)
  if (!req.path.startsWith("/api/embed/")) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  }

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Content-Security-Policy
  // - 'unsafe-inline' on style-src: required for React inline styles + Vite HMR in dev
  // - 'unsafe-inline' on script-src in dev only: required for Vite HMR module injection
  const isDev = process.env.NODE_ENV !== "production";
  // Clerk loads its JS bundle, makes XHR calls, posts CAPTCHA challenges,
  // and serves user avatar images all from the custom auth domain. Allow
  // the configured domain (or fall back to the Clerk dev hosts when the
  // custom one isn't set yet).
  const clerkHost = process.env.CLERK_AUTH_DOMAIN ?? "clerk.sellisy.com";
  const clerkDevHost = "*.clerk.accounts.dev";

  // Cloudflare auto-injects beacon.min.js for Web Analytics on proxied
  // domains. Allowlist it here so it doesn't fire CSP violations.
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://${clerkHost} https://${clerkDevHost} https://challenges.cloudflare.com https://static.cloudflareinsights.com`
    : `'self' https://js.stripe.com https://${clerkHost} https://${clerkDevHost} https://challenges.cloudflare.com https://static.cloudflareinsights.com`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://cdn.sellisy.com https://*.googleapis.com https://*.gstatic.com https://*.unsplash.com https://img.clerk.com https://${clerkHost} https://${clerkDevHost} https://public-files.gumroad.com https://*.gumroad.com`,
    `connect-src 'self' https://api.sellisy.com https://cdn.sellisy.com https://fonts.googleapis.com https://${clerkHost} https://${clerkDevHost} https://cloudflareinsights.com https://*.r2.cloudflarestorage.com ${isDev ? "ws: wss:" : ""}`.trim(),
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);

  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/embed/")) {
    return next();
  }

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // In production response bodies frequently carry buyer emails, totals,
      // download tokens — never log them. Dev keeps the dump for debugging.
      if (capturedJsonResponse && process.env.NODE_ENV !== "production") {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const isProd = process.env.NODE_ENV === "production";
    // For 4xx errors trust the application's message (intended for the user).
    // For 5xx in production, never expose internal error text — could leak
    // SQL fragments, file paths, or stack info.
    const message = status < 500
      ? (err.message || "Bad Request")
      : (isProd ? "Internal Server Error" : (err.message || "Internal Server Error"));

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    app.use(injectOgTags);
    serveStatic(app);
  } else {
    app.use(injectOgTags);
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      runStartupCheck().catch(err => {
        console.error("[integrity] Startup check failed:", err);
      });
      if (process.env.REDIS_URL) {
        import('./queue/workers').then(({ startWorkers }) => startWorkers())
          .catch(err => console.error('[queue] failed to start workers:', err));
      } else {
        console.warn('[queue] REDIS_URL not set — background job workers not started');
      }
    },
  );

  // Graceful shutdown: drain in-flight requests, close DB pool, then exit.
  // Railway sends SIGTERM and waits ~30s before SIGKILL. Without this we
  // truncate active responses on every redeploy.
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] received ${signal}, draining...`);
    httpServer.close(() => console.log("[shutdown] http server closed"));
    try {
      const { pool } = await import("./db");
      await pool.end();
      console.log("[shutdown] db pool closed");
    } catch (err) {
      console.error("[shutdown] error closing db pool:", err);
    }
    // Give pending writes a moment, then exit.
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})();
