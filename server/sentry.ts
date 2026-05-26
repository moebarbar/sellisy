// Sentry server-side init. Opt-in: only activates when SENTRY_DSN is set.
// Imported as the FIRST thing in server/index.ts so it can wrap the rest
// of the app's loading.
//
// Keep the surface area tiny: just initSentry() + a re-export of the
// SDK's captureException for ad-hoc reporting elsewhere. We're not wiring
// performance tracing yet — error reporting is the immediate win.

import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // silently skip when DSN isn't configured

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    // Pin a useful release name so issues group by deploy. Railway sets
    // RAILWAY_GIT_COMMIT_SHA; fall back to short package version.
    release: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.npm_package_version,
    // 0.0 = no perf tracing; flip to e.g. 0.1 once the team is comfortable
    // with the cost/value of perf sampling.
    tracesSampleRate: 0,
    // Errors only. PII off — buyer emails / order IDs go in logs already.
    sendDefaultPii: false,
  });

  // Hook the global handlers we already use in index.ts so unhandled
  // rejections show up in Sentry too. (The console.error calls in
  // index.ts still fire — Sentry is additive, not replacing.)
  process.on("uncaughtException", (err) => Sentry.captureException(err));
  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  });

  initialized = true;
}

export const captureException = (err: unknown) => {
  if (!initialized) return;
  Sentry.captureException(err);
};
