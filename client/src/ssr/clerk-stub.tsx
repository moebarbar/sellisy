// Build-time Clerk replacement for the SSR/prerender bundle ONLY. Aliased
// in vite.ssr.config.ts so anywhere the marketing tree imports from
// "@clerk/react" during prerender, it gets these no-op shapes instead of
// the real SDK (which can't initialize without a window and a real
// publishable key).
//
// The shapes match what the real SDK would return during its initial
// "loading" state on a logged-out visit — `isLoaded: false`, `isSignedIn:
// false`. So the SSR HTML matches what the client React tree renders on
// its first frame, before Clerk hydrates. No hydration mismatch.

import { type ReactNode } from "react";

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useUser() {
  return { isLoaded: false, isSignedIn: false, user: null } as const;
}

export function useAuth() {
  return {
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    signOut: async () => {},
    getToken: async () => null,
  } as const;
}

export function SignIn() { return null; }
export function SignUp() { return null; }
export function UserButton() { return null; }
export function SignedIn({ children }: { children: ReactNode }) { return null; }
export function SignedOut({ children: _ }: { children: ReactNode }) { return null; }
export function RedirectToSignIn() { return null; }
