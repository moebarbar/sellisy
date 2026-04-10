import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";
import { z } from "zod";
import { sendWelcomeEmail } from "../../emails";
import { audit, auditMeta } from "../../audit";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function getSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters. Generate one with: openssl rand -hex 32");
  }
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

const registerSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const loginSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/register", async (req, res) => {
    const meta = auditMeta(req as any);
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, firstName, lastName } = parsed.data;

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        audit({ event: "auth.register.failed", email, details: "Email already exists", ...meta });
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.upsertUser({ email, passwordHash, firstName, lastName });

      req.session.userId = user.id;
      audit({ event: "auth.register.success", userId: user.id, email, ...meta });

      sendWelcomeEmail({ email, firstName });
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Registration error:", error);
      audit({ event: "auth.register.failed", details: "Internal error", ...meta });
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const meta = auditMeta(req as any);
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        audit({ event: "auth.login.failed", email, details: "User not found or no password", ...meta });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        audit({ event: "auth.login.failed", userId: user.id, email, details: "Invalid password", ...meta });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      audit({ event: "auth.login.success", userId: user.id, email, ...meta });
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = (req as any).session?.userId;
    const meta = auditMeta(req as any);
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      if (userId) audit({ event: "auth.logout", userId, ...meta });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/logout", (req, res) => {
    const userId = (req as any).session?.userId;
    const meta = auditMeta(req as any);
    req.session.destroy(() => {
      if (userId) audit({ event: "auth.logout", userId, ...meta });
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
