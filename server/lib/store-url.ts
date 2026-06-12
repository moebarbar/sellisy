// Public URL for a store (and paths under it), custom-domain aware.
// The customDomain + domainStatus === 'active' branch was being re-derived
// inline at every email/link call site — centralize so a future change
// (new domain states, https policy) lands once.

type StoreLike = {
  slug: string;
  customDomain?: string | null;
  domainStatus?: string | null;
};

export function storePublicUrl(store: StoreLike, baseUrl: string, path = ""): string {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (store.customDomain && store.domainStatus === "active") {
    return `https://${store.customDomain}${suffix}`;
  }
  return `${baseUrl}/s/${encodeURIComponent(store.slug)}${suffix}`;
}
