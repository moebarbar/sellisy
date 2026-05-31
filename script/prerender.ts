// Prerender public marketing routes into static HTML.
//
// Pipeline:
//   1. Programmatically run vite SSR build → dist/ssr/entry.js
//   2. Read the SPA shell from dist/public/index.html
//   3. Dynamic-import dist/ssr/entry.js → renderPath()
//   4. For each public route, render HTML body + compute per-route SEO,
//      inject both into the shell, write dist/public/<route>/index.html
//
// Run order vs build.ts: client build (vite) FIRST, then prerender. The
// build.ts entry point will call this after viteBuild() returns.
//
// IMPORTANT: do NOT prerender auth-gated routes (/dashboard, /admin, /auth,
// /s/*, /b/*, /a/*, etc). The Express router handles those — the SPA shell
// at dist/public/index.html serves as the fallback for anything not
// prerendered. No cloaking: prerendered HTML uses the SAME React tree the
// client mounts (just rendered server-side), so users and bots see the
// exact same content.

import { build as viteBuild } from "vite";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Placeholder so server/db.ts's import-time validation passes when building
// outside a deploy context. The pg pool is lazy — no connection is opened
// because computeSeoForPath() for static marketing routes never touches
// storage/db. At deploy time DATABASE_URL is already set; this is a no-op.
process.env.DATABASE_URL ??= "postgresql://prerender@localhost:5432/prerender";

// og-tags + competitors are dynamic-imported in main() so the env var above
// is set before server/db.ts evaluates.

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const SHELL_PATH = path.join(PROJECT_ROOT, "dist", "public", "index.html");
// Stash a clean copy of the SPA shell so Express can fall back to it for
// non-prerendered routes (dashboard, storefronts, etc) AFTER we overwrite
// dist/public/index.html with the prerendered landing page.
const SHELL_BACKUP = path.join(PROJECT_ROOT, "dist", "public", "_shell.html");
const SSR_BUNDLE = path.join(PROJECT_ROOT, "dist", "ssr", "entry.js");
const OUT_ROOT = path.join(PROJECT_ROOT, "dist", "public");
const BASE_URL = "https://sellisy.com";

function staticRoutes(getCompetitorSlugs: () => string[]): string[] {
  const competitorRoutes = getCompetitorSlugs().map((s) => `/vs/${s}`);
  return [
    "/",
    "/products",
    "/discover",
    "/privacy",
    "/terms",
    "/data-deletion",
    "/vs",
    ...competitorRoutes,
  ];
}

function injectIntoShell(shell: string, metaBlock: string, body: string): string {
  // Only strip the shell's static SEO when we have a replacement block —
  // otherwise the shell's landing-page defaults are preferable to nothing,
  // and the client-side <usePageMeta> will overwrite them after hydration.
  const stripped = metaBlock
    ? shell
        .replace(/<title>[\s\S]*?<\/title>/i, "")
        .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
        .replace(/<meta\s+name=["']keywords["'][^>]*>/gi, "")
        .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
        .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
        .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
        .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "")
        .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "")
    : shell;

  // Insert per-route meta before </head>, prerendered body inside #root.
  return stripped
    .replace(/<\/head>/i, `${metaBlock}\n</head>`)
    .replace(/<div id="root"><\/div>/i, `<div id="root">${body}</div>`);
}

function outFileFor(route: string): string {
  if (route === "/") return path.join(OUT_ROOT, "index.html");
  // Drop leading slash, add /index.html so the directory becomes the URL.
  return path.join(OUT_ROOT, route.slice(1), "index.html");
}

async function main() {
  console.log("[prerender] running vite SSR build...");
  await viteBuild({
    configFile: path.join(PROJECT_ROOT, "vite.ssr.config.ts"),
    logLevel: "warn",
  });

  // Dynamic imports so the DATABASE_URL fallback above is in place before
  // server/db.ts evaluates.
  const { computeSeoForPath, renderMetaBlock } = await import("../server/og-tags.js");
  const { getCompetitorSlugs } = await import("../client/src/data/competitors.js");

  console.log("[prerender] loading SPA shell + SSR bundle...");
  // Re-run safety: if _shell.html already exists (previous run), trust it
  // as the canonical shell — dist/public/index.html may have been
  // overwritten with the prerendered landing on a prior run. Otherwise
  // back up the freshly-built shell from index.html.
  let shell: string;
  try {
    shell = await fs.readFile(SHELL_BACKUP, "utf-8");
    console.log(`[prerender]  ↻ reusing shell backup at ${path.relative(PROJECT_ROOT, SHELL_BACKUP)}`);
  } catch {
    shell = await fs.readFile(SHELL_PATH, "utf-8");
    await fs.writeFile(SHELL_BACKUP, shell, "utf-8");
    console.log(`[prerender]  ✓ shell backed up to ${path.relative(PROJECT_ROOT, SHELL_BACKUP)}`);
  }
  const { renderPath } = (await import(pathToFileURL(SSR_BUNDLE).href)) as {
    renderPath: (path: string) => string;
  };

  const routes = staticRoutes(getCompetitorSlugs);
  console.log(`[prerender] generating ${routes.length} routes...`);

  let ok = 0;
  let failed = 0;
  for (const route of routes) {
    try {
      const body = renderPath(route);
      const seo = await computeSeoForPath(route, `${BASE_URL}${route}`);
      if (!seo) {
        // Marketing routes should always resolve to an SeoBlock — if one
        // doesn't, the per-route meta in og-tags.ts is missing a branch.
        console.warn(`[prerender] no SEO block for ${route} — emitting body without per-route meta`);
      }
      const metaBlock = seo ? renderMetaBlock(seo) : "";
      const html = injectIntoShell(shell, metaBlock, body);
      const outPath = outFileFor(route);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, html, "utf-8");
      console.log(`[prerender]  ✓ ${route} → ${path.relative(PROJECT_ROOT, outPath)}`);
      ok++;
    } catch (err) {
      console.error(`[prerender]  ✗ ${route}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`[prerender] done: ${ok} ok, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
