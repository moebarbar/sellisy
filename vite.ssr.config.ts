import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// SSR build config — produces a Node-loadable bundle at dist/ssr/entry.js
// exporting renderPath(). The aliases swap real Clerk + any other client-
// only modules for SSR-safe stubs so renderToString doesn't crash.
//
// Run via: vite build --config vite.ssr.config.ts

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      // CRITICAL: stub Clerk during SSR — real SDK can't init without a
      // window + valid publishable key.
      "@clerk/react": path.resolve(__dirname, "client/src/ssr/clerk-stub.tsx"),
    },
  },
  build: {
    ssr: "client/src/ssr/entry.tsx",
    outDir: "dist/ssr",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: "esm",
        entryFileNames: "entry.js",
      },
    },
    // Bundle EVERYTHING — no Node externals to resolve at runtime.
    // The output is a single file the prerender script imports directly.
    target: "node20",
  },
  ssr: {
    noExternal: true,
  },
});
