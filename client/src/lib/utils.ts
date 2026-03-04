import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isCustomDomain(): boolean {
  const host = window.location.hostname;
  return !!(host && host !== "localhost" && !host.includes("replit") && !host.includes("railway.app") && !host.includes("sellisy.com") && !/^\d+\./.test(host));
}

export function getStoreBasePath(slug: string): string {
  if (!slug) return "";
  return isCustomDomain() ? "" : `/s/${slug}`;
}

export function getStorePublicUrl(store: { slug: string; customDomain?: string | null; domainStatus?: string | null } | null | undefined): string {
  if (!store) return window.location.origin;
  if (store.customDomain && store.domainStatus === "active") {
    return `https://${store.customDomain}`;
  }
  return `${window.location.origin}/s/${store.slug}`;
}

export function getStorePublicPath(store: { slug: string; customDomain?: string | null; domainStatus?: string | null } | null | undefined, path: string): string {
  const base = getStorePublicUrl(store);
  if (!path) return base;
  return `${base}/${path.replace(/^\//, "")}`;
}
