// Sentry client-side init. Opt-in via VITE_SENTRY_DSN at build time.
// Called from main.tsx before React mounts.
//
// Vite inlines VITE_* env vars at build time, so leaving VITE_SENTRY_DSN
// unset in the build environment produces a no-op shipped bundle.

import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE as string | undefined,
    // Error reporting only for now. Replay + Performance integrations cost
    // bundle size and can be enabled when you actually use them.
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialized = true;
}

export const captureException = (err: unknown) => {
  if (!initialized) return;
  Sentry.captureException(err);
};
