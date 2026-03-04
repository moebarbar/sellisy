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
