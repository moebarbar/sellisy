import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerAuthRoutes(app: Express): void {
  // Returns the Sellisy user record for the authenticated Clerk user.
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await authStorage.getUser(req.sellisyUserId!);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
