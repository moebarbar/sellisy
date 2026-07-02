// Guards seller-authored URLs before they hit an href/src attribute. Rich-text
// blocks go through DOMPurify, but URL-bearing blocks (link, video) render the
// raw string into href/src and would otherwise execute `javascript:` /
// dangerous `data:` URIs. Allow only http(s), mailto, and site-relative links.

export function safeHref(url: string | null | undefined): string {
  if (!url) return "#";
  const t = url.trim();
  if (t.startsWith("/") || t.startsWith("#")) return t; // site-relative / anchor
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") return t;
  } catch {
    /* not an absolute URL */
  }
  return "#";
}

// True only for absolute http(s) URLs — used to decide whether it's safe to
// drop a value into an <iframe src> (where a javascript: URI would execute).
export function isHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
