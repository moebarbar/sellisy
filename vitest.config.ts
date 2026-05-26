import { defineConfig } from "vitest/config";
import path from "node:path";

// Minimal vitest config. We're starting with tests for pure helper functions
// (no DB, no React rendering) so node environment + a couple of path
// aliases is all that's needed. Add jsdom + setup files if/when we start
// testing components.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
