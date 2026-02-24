import { useEffect } from "react";

type PageMeta = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  favicon?: string;
};

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setFavicon(url: string) {
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
  link.type = url.endsWith(".svg") ? "image/svg+xml" : "image/png";
}

const DEFAULT_TITLE = "Sellisy - Create & Sell Digital Products";
const DEFAULT_DESC = "Build your own digital storefront, sell products, and grow your business with Sellisy.";
const DEFAULT_FAVICON = "/favicon.png";

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    if (meta.title) document.title = meta.title;
    if (meta.description) setMeta("description", meta.description);
    if (meta.ogTitle || meta.title) setMeta("og:title", meta.ogTitle || meta.title || "", true);
    if (meta.ogDescription || meta.description) setMeta("og:description", meta.ogDescription || meta.description || "", true);
    if (meta.ogImage) setMeta("og:image", meta.ogImage, true);
    if (meta.ogType) setMeta("og:type", meta.ogType, true);
    if (meta.favicon) setFavicon(meta.favicon);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESC);
      setMeta("og:title", DEFAULT_TITLE, true);
      setMeta("og:description", DEFAULT_DESC, true);
      setFavicon(DEFAULT_FAVICON);
    };
  }, [meta.title, meta.description, meta.ogTitle, meta.ogDescription, meta.ogImage, meta.ogType, meta.favicon]);
}
