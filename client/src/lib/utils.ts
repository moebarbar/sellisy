import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isCustomDomain(): boolean {
  // SSR-safe: return false when window is absent. Prerender runs at build
  // time on Node where there's no real browser host; the canonical Sellisy
  // routes aren't custom-domain anyway, so false is the correct default.
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return !!(host && host !== "localhost" && !host.includes("replit") && !host.includes("railway.app") && !host.includes("sellisy.com") && !/^\d+\./.test(host));
}

export function getStoreBasePath(slug: string): string {
  if (!slug) return "";
  return isCustomDomain() ? "" : `/s/${slug}`;
}

export function getStorePublicUrl(store: { slug: string; customDomain?: string | null; domainStatus?: string | null } | null | undefined): string {
  // SSR-safe origin fallback. Marketing routes don't actually hit this code
  // path during prerender (storefront-specific), but the guard prevents the
  // bundler from blowing up if anything cross-references it.
  const origin = typeof window === "undefined" ? "https://sellisy.com" : window.location.origin;
  if (!store) return origin;
  if (store.customDomain && store.domainStatus === "active") {
    return `https://${store.customDomain}`;
  }
  return `${origin}/s/${store.slug}`;
}

export function getStorePublicPath(store: { slug: string; customDomain?: string | null; domainStatus?: string | null } | null | undefined, path: string): string {
  const base = getStorePublicUrl(store);
  if (!path) return base;
  return `${base}/${path.replace(/^\//, "")}`;
}
